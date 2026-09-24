import asyncio
import os
from collections import defaultdict, deque
from datetime import UTC, date, datetime
from time import monotonic

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


limiter = UsageLimiter(
    requests_per_minute=max(1, int(os.getenv("AI_REQUESTS_PER_MINUTE", "10"))),
    requests_per_day=max(1, int(os.getenv("AI_REQUESTS_PER_DAY", "100"))),
)


async def enforce_ai_limits(
    user: AuthenticatedUser = Depends(require_user),
) -> AuthenticatedUser:
    await limiter.check(user.id)
    return user
