import os
from typing import Annotated

import httpx
from fastapi import Header, HTTPException, status
from pydantic import BaseModel


class AuthenticatedUser(BaseModel):
    id: str
    email: str | None = None
    is_anonymous: bool = False
    access_token: str


async def require_user(
    authorization: Annotated[str | None, Header()] = None,
) -> AuthenticatedUser:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = authorization.removeprefix("Bearer ").strip()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    supabase_url = os.getenv("SUPABASE_URL", "").rstrip("/")
    publishable_key = os.getenv("SUPABASE_PUBLISHABLE_KEY", "")
    if not supabase_url or not publishable_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service is not configured.",
        )

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{supabase_url}/auth/v1/user",
                headers={
                    "apikey": publishable_key,
                    "Authorization": f"Bearer {token}",
                },
            )
    except httpx.HTTPError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service is temporarily unavailable.",
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = response.json()
    user_id = payload.get("id")
    if not isinstance(user_id, str) or not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication response.",
        )

    email = payload.get("email")
    return AuthenticatedUser(
        id=user_id,
        email=email if isinstance(email, str) else None,
        is_anonymous=bool(payload.get("is_anonymous")),
        access_token=token,
    )
