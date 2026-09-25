import asyncio
import os
from collections import defaultdict, deque
from datetime import UTC, date, datetime
from time import monotonic

import httpx
from fastapi import Depends, HTTPException, status

from auth import AuthenticatedUser, require_user


class UsageLimiter:
    def __init__(
        self,
        requests_per_minute: int,
        requests_per_day: int,
        label: str = "AI",
    ):
        self.requests_per_minute = requests_per_minute
        self.requests_per_day = requests_per_day
        self.label = label
        self._minute_windows: dict[str, deque[float]] = defaultdict(deque)
        self._daily_usage: dict[tuple[str, date], int] = defaultdict(int)
        self._lock = asyncio.Lock()

    async def check(self, user_id: str) -> None:
        now = monotonic()
        today = datetime.now(UTC).date()

        async with self._lock:
            window = self._minute_windows[user_id]
            while window and now - window[0] >= 60:
                window.popleft()

            if len(window) >= self.requests_per_minute:
                retry_after = max(1, int(60 - (now - window[0])))
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Too many {self.label} requests. Please try again shortly.",
                    headers={"Retry-After": str(retry_after)},
                )

            daily_key = (user_id, today)
            if self._daily_usage[daily_key] >= self.requests_per_day:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Daily {self.label} limit reached. Please try again tomorrow.",
                )

            window.append(now)
            self._daily_usage[daily_key] += 1

            stale_days = [key for key in self._daily_usage if key[1] < today]
            for key in stale_days:
                del self._daily_usage[key]


class DistributedUsageLimiter:
    """Use Supabase counters in production and an in-memory fallback locally."""

    def __init__(
        self,
        requests_per_minute: int,
        requests_per_day: int,
        bucket: str,
        label: str = "AI",
    ):
        self.requests_per_minute = requests_per_minute
        self.requests_per_day = requests_per_day
        self.bucket = bucket
        self.label = label
        self._local = UsageLimiter(requests_per_minute, requests_per_day, label)

    async def check(self, user: AuthenticatedUser) -> None:
        environment = os.getenv("ENVIRONMENT", "development").lower()
        backend = os.getenv(
            "RATE_LIMIT_BACKEND",
            "postgres" if environment == "production" else "memory",
        ).lower()
        if backend != "postgres":
            await self._local.check(user.id)
            return

        supabase_url = os.getenv("SUPABASE_URL", "").rstrip("/")
        publishable_key = os.getenv("SUPABASE_PUBLISHABLE_KEY", "")
        if not supabase_url or not publishable_key:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Rate limiting is not configured.",
            )

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.post(
                    f"{supabase_url}/rest/v1/rpc/consume_api_rate_limit",
                    headers={
                        "apikey": publishable_key,
                        "Authorization": f"Bearer {user.access_token}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "target_bucket": self.bucket,
                        "minute_limit": self.requests_per_minute,
                        "day_limit": self.requests_per_day,
                    },
                )
        except httpx.HTTPError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Request protection is temporarily unavailable.",
            ) from exc

        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Request protection is temporarily unavailable.",
            )

        try:
            payload = response.json()
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Request protection is temporarily unavailable.",
            ) from exc
        if not isinstance(payload, dict):
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Request protection is temporarily unavailable.",
            )
        if payload.get("allowed"):
            return

        retry_after = payload.get("retry_after_seconds")
        headers = {"Retry-After": str(retry_after)} if retry_after else None
        detail = (
            f"Daily {self.label} limit reached. Please try again tomorrow."
            if payload.get("daily_limit_reached")
            else f"Too many {self.label} requests. Please try again shortly."
        )
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=detail,
            headers=headers,
        )


limiter = DistributedUsageLimiter(
    requests_per_minute=max(1, int(os.getenv("AI_REQUESTS_PER_MINUTE", "10"))),
    requests_per_day=max(1, int(os.getenv("AI_REQUESTS_PER_DAY", "100"))),
    bucket="ai",
)


async def enforce_ai_limits(
    user: AuthenticatedUser = Depends(require_user),
) -> AuthenticatedUser:
    await limiter.check(user)
    return user
