import html
import os
from typing import Literal

import httpx
from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, Field

from auth import AuthenticatedUser, require_user


router = APIRouter(prefix="/api/v1", tags=["production"])


class InvitationEmailRequest(BaseModel):
    household_id: str = Field(min_length=36, max_length=36)
    household_name: str = Field(min_length=1, max_length=120)
    email: str = Field(min_length=3, max_length=320)
    role: Literal["caregiver", "sitter"]
    invite_code: str = Field(min_length=36, max_length=36)


async def _confirm_owner(user: AuthenticatedUser, household_id: str) -> None:
    supabase_url = os.getenv("SUPABASE_URL", "").rstrip("/")
    publishable_key = os.getenv("SUPABASE_PUBLISHABLE_KEY", "")
    if not supabase_url or not publishable_key:
        raise HTTPException(status_code=503, detail="Database service is not configured.")

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(
            f"{supabase_url}/rest/v1/household_members",
            params={
                "household_id": f"eq.{household_id}",
                "user_id": f"eq.{user.id}",
                "role": "eq.owner",
                "select": "id",
                "limit": "1",
            },
            headers={
                "apikey": publishable_key,
                "Authorization": f"Bearer {user.access_token}",
            },
        )

    if response.status_code != 200:
        raise HTTPException(status_code=503, detail="Could not verify household access.")
    if not response.json():
        raise HTTPException(status_code=403, detail="Only the household owner can send invitations.")


@router.post("/household-invitations/email")
async def send_household_invitation(
    request: InvitationEmailRequest,
    user: AuthenticatedUser = Depends(require_user),
):
    await _confirm_owner(user, request.household_id)

    resend_key = os.getenv("RESEND_API_KEY", "")
    from_email = os.getenv("PAWSO_INVITE_FROM_EMAIL", "")
    if not resend_key or not from_email:
        raise HTTPException(
            status_code=503,
            detail="Automatic invitation email is not configured yet. Use Share invitation instead.",
        )

    invite_base = os.getenv("PAWSO_INVITE_BASE_URL", "pawso://invite").rstrip("/")
    invite_url = f"{invite_base}/{request.invite_code}"
    ios_url = os.getenv("PAWSO_IOS_DOWNLOAD_URL", "")
    android_url = os.getenv("PAWSO_ANDROID_DOWNLOAD_URL", "")

    safe_household = html.escape(request.household_name)
    safe_role = html.escape(request.role)
    safe_code = html.escape(request.invite_code)
    download_links = ""
    if ios_url:
        download_links += f'<p><a href="{html.escape(ios_url)}">Download Pawso for iPhone</a></p>'
    if android_url:
        download_links += f'<p><a href="{html.escape(android_url)}">Download Pawso for Android</a></p>'

    email_html = f"""
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#26222b">
      <h1 style="color:#53166f">You’re invited to Pawso</h1>
      <p>You have been invited to <strong>{safe_household}</strong> as a <strong>{safe_role}</strong>.</p>
      <p><a href="{html.escape(invite_url)}" style="display:inline-block;background:#53166f;color:white;padding:12px 18px;border-radius:10px;text-decoration:none">Accept invitation</a></p>
      {download_links}
      <p>If the button does not open Pawso, enter this one-time code in <strong>People &amp; access</strong>:</p>
      <p style="font-size:18px;font-weight:bold;word-break:break-all">{safe_code}</p>
      <p>This invitation expires after 7 days. Sign in with your own Pawso email and password—never use the owner’s password.</p>
    </div>
    """

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {resend_key}",
                "Content-Type": "application/json",
            },
            json={
                "from": from_email,
                "to": [str(request.email)],
                "subject": f"Join {request.household_name} on Pawso",
                "html": email_html,
            },
        )

    if response.status_code >= 300:
        raise HTTPException(status_code=502, detail="Invitation email could not be delivered.")

    return {"status": "sent"}


@router.delete("/account", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(user: AuthenticatedUser = Depends(require_user)):
    supabase_url = os.getenv("SUPABASE_URL", "").rstrip("/")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    if not supabase_url or not service_key:
        raise HTTPException(
            status_code=503,
            detail="Account deletion is not configured. Contact Pawso support.",
        )

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.delete(
            f"{supabase_url}/auth/v1/admin/users/{user.id}",
            headers={
                "apikey": service_key,
                "Authorization": f"Bearer {service_key}",
            },
        )

    if response.status_code not in (200, 204):
        raise HTTPException(status_code=502, detail="Pawso could not delete the account.")

    return Response(status_code=status.HTTP_204_NO_CONTENT)
