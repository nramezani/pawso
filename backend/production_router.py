import asyncio
import html
import logging
import os
import re
from datetime import UTC, datetime
from typing import Literal
from uuid import UUID

import httpx
from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field, field_validator

from auth import AuthenticatedUser, require_user
from rate_limit import DistributedUsageLimiter


router = APIRouter(prefix="/api/v1", tags=["production"])
logger = logging.getLogger("pawso.client_events")
invitation_limiter = DistributedUsageLimiter(
    requests_per_minute=max(1, int(os.getenv("INVITATION_EMAILS_PER_MINUTE", "3"))),
    requests_per_day=max(1, int(os.getenv("INVITATION_EMAILS_PER_DAY", "25"))),
    bucket="invitation_email",
    label="invitation email",
)
client_event_limiter = DistributedUsageLimiter(
    requests_per_minute=10,
    requests_per_day=100,
    bucket="client_event",
    label="diagnostic event",
)
export_limiter = DistributedUsageLimiter(
    requests_per_minute=max(1, int(os.getenv("DATA_EXPORTS_PER_MINUTE", "2"))),
    requests_per_day=max(1, int(os.getenv("DATA_EXPORTS_PER_DAY", "10"))),
    bucket="data_export",
    label="data export",
)


class InvitationEmailRequest(BaseModel):
    household_id: UUID
    email: str = Field(min_length=3, max_length=320)
    role: Literal["caregiver", "sitter"]
    invite_code: UUID

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", normalized):
            raise ValueError("Enter a valid invitation email address.")
        return normalized


class ClientEventRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    kind: Literal["crash", "screen_error", "network_recovery"]
    fingerprint: str = Field(pattern=r"^[a-f0-9]{8}$")
    platform: Literal["ios", "android", "web", "unknown"]
    app_version: str = Field(min_length=1, max_length=32, pattern=r"^[A-Za-z0-9._+-]+$")


@router.post("/client-events", status_code=status.HTTP_202_ACCEPTED)
async def record_client_event(
    event: ClientEventRequest,
    user: AuthenticatedUser = Depends(require_user),
):
    """Record a deliberately low-detail diagnostic event.

    No error message, stack, pet data, email, or request body is logged. The
    opaque fingerprint only groups repeats of the same client-side failure.
    """

    await client_event_limiter.check(user)
    logger.warning(
        "client_event kind=%s fingerprint=%s platform=%s app_version=%s",
        event.kind,
        event.fingerprint,
        event.platform,
        event.app_version,
    )
    return {"status": "accepted"}


async def _confirm_owner(user: AuthenticatedUser, household_id: str | UUID) -> str:
    supabase_url = os.getenv("SUPABASE_URL", "").rstrip("/")
    publishable_key = os.getenv("SUPABASE_PUBLISHABLE_KEY", "")
    if not supabase_url or not publishable_key:
        raise HTTPException(status_code=503, detail="Database service is not configured.")

    headers = {
        "apikey": publishable_key,
        "Authorization": f"Bearer {user.access_token}",
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        membership_response = await client.get(
            f"{supabase_url}/rest/v1/household_members",
            params={
                "household_id": f"eq.{household_id}",
                "user_id": f"eq.{user.id}",
                "role": "eq.owner",
                "select": "id",
                "limit": "1",
            },
            headers=headers,
        )

        household_response = await client.get(
            f"{supabase_url}/rest/v1/households",
            params={"id": f"eq.{household_id}", "select": "name", "limit": "1"},
            headers=headers,
        )

    if membership_response.status_code != 200 or household_response.status_code != 200:
        raise HTTPException(status_code=503, detail="Could not verify household access.")
    if not membership_response.json():
        raise HTTPException(status_code=403, detail="Only the household owner can send invitations.")
    households = household_response.json()
    if not households or not isinstance(households[0].get("name"), str):
        raise HTTPException(status_code=404, detail="Household was not found.")
    return households[0]["name"]


async def _confirm_invitation(
    user: AuthenticatedUser,
    request: InvitationEmailRequest,
) -> None:
    supabase_url = os.getenv("SUPABASE_URL", "").rstrip("/")
    publishable_key = os.getenv("SUPABASE_PUBLISHABLE_KEY", "")
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(
            f"{supabase_url}/rest/v1/household_invitations",
            params={
                "household_id": f"eq.{request.household_id}",
                "invite_code": f"eq.{request.invite_code}",
                "invited_email": f"eq.{str(request.email).strip().lower()}",
                "role": f"eq.{request.role}",
                "status": "eq.pending",
                "expires_at": f"gt.{datetime.now(UTC).isoformat()}",
                "select": "id,expires_at",
                "limit": "1",
            },
            headers={
                "apikey": publishable_key,
                "Authorization": f"Bearer {user.access_token}",
            },
        )

    if response.status_code != 200:
        raise HTTPException(status_code=503, detail="Could not verify invitation.")
    if not response.json():
        raise HTTPException(
            status_code=400,
            detail="Invitation details do not match a pending Pawso invitation.",
        )


async def _collect_storage_objects(
    client: httpx.AsyncClient,
    supabase_url: str,
    headers: dict[str, str],
    prefix: str,
    bucket: str = "vet-records",
) -> list[str]:
    object_names: list[str] = []
    offset = 0

    while True:
        response = await client.post(
            f"{supabase_url}/storage/v1/object/list/{bucket}",
            headers=headers,
            json={"prefix": prefix, "limit": 100, "offset": offset},
        )
        if response.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail="Could not prepare stored files for deletion.",
            )

        page = response.json()
        for item in page:
            if not isinstance(item, dict) or not isinstance(item.get("name"), str):
                continue
            child = f"{prefix.rstrip('/')}/{item['name']}"
            if item.get("id"):
                object_names.append(child)
            else:
                object_names.extend(
                    await _collect_storage_objects(
                        client,
                        supabase_url,
                        headers,
                        child,
                        bucket,
                    )
                )

        if len(page) < 100:
            return object_names
        offset += 100


def _service_configuration() -> tuple[str, dict[str, str]]:
    supabase_url = os.getenv("SUPABASE_URL", "").rstrip("/")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    if not supabase_url or not service_key:
        raise HTTPException(
            status_code=503,
            detail="Secure data management is not configured. Contact Pawso support.",
        )
    return supabase_url, {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
    }


async def _confirm_pet_owner(
    client: httpx.AsyncClient,
    supabase_url: str,
    service_headers: dict[str, str],
    user_id: str,
    pet_id: str,
) -> dict:
    pet_response = await client.get(
        f"{supabase_url}/rest/v1/pets",
        params={
            "id": f"eq.{pet_id}",
            "select": "id,household_id,photo_path,name",
            "limit": "1",
        },
        headers=service_headers,
    )
    if pet_response.status_code != 200:
        raise HTTPException(status_code=502, detail="Could not verify pet access.")
    pets = pet_response.json()
    if not pets:
        raise HTTPException(status_code=404, detail="Pet was not found.")

    pet = pets[0]
    membership_response = await client.get(
        f"{supabase_url}/rest/v1/household_members",
        params={
            "household_id": f"eq.{pet['household_id']}",
            "user_id": f"eq.{user_id}",
            "role": "eq.owner",
            "select": "id",
            "limit": "1",
        },
        headers=service_headers,
    )
    if membership_response.status_code != 200:
        raise HTTPException(status_code=502, detail="Could not verify household ownership.")
    if not membership_response.json():
        raise HTTPException(status_code=403, detail="Only the household owner can delete this data.")
    return pet


async def _delete_storage_paths(
    client: httpx.AsyncClient,
    supabase_url: str,
    service_headers: dict[str, str],
    bucket: str,
    object_names: list[str],
) -> None:
    names = sorted({name for name in object_names if isinstance(name, str) and name})
    if not names:
        return
    response = await client.delete(
        f"{supabase_url}/storage/v1/object/{bucket}",
        headers=service_headers,
        json={"prefixes": names},
    )
    if response.status_code not in (200, 204):
        raise HTTPException(status_code=502, detail="Could not delete stored files.")


async def _collect_export_table(
    client: httpx.AsyncClient,
    supabase_url: str,
    user_headers: dict[str, str],
    table: str,
) -> tuple[str, list[dict]]:
    rows: list[dict] = []
    offset = 0
    page_size = 500
    while True:
        response = await client.get(
            f"{supabase_url}/rest/v1/{table}",
            params={"select": "*", "limit": str(page_size), "offset": str(offset)},
            headers=user_headers,
        )
        if response.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail=f"Could not export {table.replace('_', ' ')}.",
            )
        page = response.json()
        if not isinstance(page, list):
            raise HTTPException(status_code=502, detail="Invalid export response.")
        rows.extend(page)
        if len(page) < page_size:
            break
        offset += page_size
    return table, rows


@router.post("/household-invitations/email")
async def send_household_invitation(
    request: InvitationEmailRequest,
    user: AuthenticatedUser = Depends(require_user),
):
    if user.is_anonymous:
        raise HTTPException(
            status_code=403,
            detail="Secure your Pawso account before sending invitations.",
        )
    household_name = await _confirm_owner(user, request.household_id)
    await _confirm_invitation(user, request)
    await invitation_limiter.check(user)

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

    normalized_household = " ".join(household_name.split())[:120] or "Pawso household"
    safe_household = html.escape(normalized_household)
    safe_role = html.escape(request.role)
    safe_code = html.escape(str(request.invite_code))
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
                "subject": f"Join {normalized_household} on Pawso",
                "html": email_html,
            },
        )

    if response.status_code >= 300:
        raise HTTPException(status_code=502, detail="Invitation email could not be delivered.")

    return {"status": "sent"}


@router.get("/account/export")
async def export_account_data(user: AuthenticatedUser = Depends(require_user)):
    """Return all rows the signed-in user may access under Supabase RLS.

    The export intentionally excludes file bytes and secrets. Original
    veterinary documents remain downloadable from the Documents screen.
    """

    await export_limiter.check(user)

    supabase_url = os.getenv("SUPABASE_URL", "").rstrip("/")
    publishable_key = os.getenv("SUPABASE_PUBLISHABLE_KEY", "")
    if not supabase_url or not publishable_key:
        raise HTTPException(status_code=503, detail="Database service is not configured.")

    user_headers = {
        "apikey": publishable_key,
        "Authorization": f"Bearer {user.access_token}",
    }
    tables = (
        "households",
        "household_members",
        "household_invitations",
        "pets",
        "documents",
        "medical_events",
        "medications",
        "medication_schedules",
        "medication_logs",
        "medication_log_revisions",
        "care_tasks",
        "task_completions",
        "symptom_entries",
        "lab_results",
        "ai_extractions",
        "extracted_fields",
    )

    async with httpx.AsyncClient(timeout=30.0) as client:
        exported = await asyncio.gather(
            *(
                _collect_export_table(
                    client,
                    supabase_url,
                    user_headers,
                    table,
                )
                for table in tables
            )
        )

    payload = {
        "format": "pawso-export-v1",
        "exported_at": datetime.now(UTC).isoformat(),
        "account": {"id": user.id, "email": user.email},
        "data": dict(exported),
        "notes": [
            "This export contains structured Pawso data, not original file bytes.",
            "Original veterinary files can be downloaded individually in Pawso.",
        ],
    }
    filename_date = datetime.now(UTC).date().isoformat()
    return JSONResponse(
        payload,
        headers={
            "Content-Disposition": f'attachment; filename="pawso-export-{filename_date}.json"',
            "Cache-Control": "no-store",
        },
    )


@router.delete("/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: UUID,
    user: AuthenticatedUser = Depends(require_user),
):
    supabase_url, service_headers = _service_configuration()

    async with httpx.AsyncClient(timeout=20.0) as client:
        document_response = await client.get(
            f"{supabase_url}/rest/v1/documents",
            params={
                "id": f"eq.{document_id}",
                "select": "id,pet_id,user_id,storage_path,filename",
                "limit": "1",
            },
            headers=service_headers,
        )
        if document_response.status_code != 200:
            raise HTTPException(status_code=502, detail="Could not verify this document.")
        documents = document_response.json()
        if not documents:
            raise HTTPException(status_code=404, detail="Document was not found.")
        document = documents[0]

        await _confirm_pet_owner(
            client,
            supabase_url,
            service_headers,
            user.id,
            document["pet_id"],
        )
        document_objects = [document.get("storage_path")]
        uploader_id = document.get("user_id")
        if isinstance(uploader_id, str) and uploader_id:
            document_objects.extend(
                await _collect_storage_objects(
                    client,
                    supabase_url,
                    service_headers,
                    f"{uploader_id}/{document['pet_id']}/{document['id']}",
                )
            )
        await _delete_storage_paths(
            client,
            supabase_url,
            service_headers,
            "vet-records",
            document_objects,
        )

        delete_response = await client.delete(
            f"{supabase_url}/rest/v1/documents",
            params={"id": f"eq.{document_id}"},
            headers={**service_headers, "Prefer": "return=minimal"},
        )
        if delete_response.status_code not in (200, 204):
            raise HTTPException(status_code=502, detail="Could not delete this document.")

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete("/pets/{pet_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_pet(
    pet_id: UUID,
    user: AuthenticatedUser = Depends(require_user),
):
    supabase_url, service_headers = _service_configuration()

    async with httpx.AsyncClient(timeout=30.0) as client:
        pet = await _confirm_pet_owner(
            client,
            supabase_url,
            service_headers,
            user.id,
            str(pet_id),
        )

        documents_response = await client.get(
            f"{supabase_url}/rest/v1/documents",
            params={
                "pet_id": f"eq.{pet_id}",
                "select": "id,user_id,storage_path",
            },
            headers=service_headers,
        )
        if documents_response.status_code != 200:
            raise HTTPException(status_code=502, detail="Could not prepare pet files for deletion.")

        document_rows = documents_response.json()
        document_objects = [row.get("storage_path") for row in document_rows]
        uploader_ids = {
            row.get("user_id")
            for row in document_rows
            if isinstance(row, dict) and isinstance(row.get("user_id"), str)
        }
        for uploader_id in uploader_ids:
            document_objects.extend(
                await _collect_storage_objects(
                    client,
                    supabase_url,
                    service_headers,
                    f"{uploader_id}/{pet_id}",
                )
            )
        await _delete_storage_paths(
            client,
            supabase_url,
            service_headers,
            "vet-records",
            document_objects,
        )
        photo_objects = await _collect_storage_objects(
            client,
            supabase_url,
            service_headers,
            str(pet_id),
            "pet-photos",
        )
        await _delete_storage_paths(
            client,
            supabase_url,
            service_headers,
            "pet-photos",
            [pet.get("photo_path"), *photo_objects],
        )

        delete_response = await client.delete(
            f"{supabase_url}/rest/v1/pets",
            params={"id": f"eq.{pet_id}"},
            headers={**service_headers, "Prefer": "return=minimal"},
        )
        if delete_response.status_code not in (200, 204):
            raise HTTPException(status_code=502, detail="Could not delete this pet.")

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete("/account", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(user: AuthenticatedUser = Depends(require_user)):
    supabase_url, service_headers = _service_configuration()

    async with httpx.AsyncClient(timeout=15.0) as client:
        owned_response = await client.get(
            f"{supabase_url}/rest/v1/household_members",
            params={
                "user_id": f"eq.{user.id}",
                "role": "eq.owner",
                "select": "household_id",
            },
            headers=service_headers,
        )
        if owned_response.status_code != 200:
            raise HTTPException(status_code=502, detail="Could not verify household ownership.")

        for membership in owned_response.json():
            household_id = membership.get("household_id")
            members_response = await client.get(
                f"{supabase_url}/rest/v1/household_members",
                params={
                    "household_id": f"eq.{household_id}",
                    "user_id": f"neq.{user.id}",
                    "select": "id",
                    "limit": "1",
                },
                headers=service_headers,
            )
            if members_response.status_code != 200:
                raise HTTPException(status_code=502, detail="Could not verify household members.")
            if members_response.json():
                raise HTTPException(
                    status_code=409,
                    detail=(
                        "Remove other caregivers and sitters before deleting an owner account. "
                        "This prevents accidental deletion of shared household records."
                    ),
                )

        object_names = await _collect_storage_objects(
            client,
            supabase_url,
            service_headers,
            user.id,
        )

        # Pet-photo paths do not start with user ids, so collect them through
        # the user's owned households before removing Auth data. Veterinary
        # records may have been uploaded by a former caregiver, so also collect
        # document paths from every owned pet instead of relying only on the
        # current user's Storage prefix.
        owned_household_ids = [
            row.get("household_id") for row in owned_response.json() if row.get("household_id")
        ]
        photo_paths: list[str] = []
        for household_id in owned_household_ids:
            photo_response = await client.get(
                f"{supabase_url}/rest/v1/pets",
                params={
                    "household_id": f"eq.{household_id}",
                    "select": "id,photo_path",
                },
                headers=service_headers,
            )
            if photo_response.status_code != 200:
                raise HTTPException(status_code=502, detail="Could not prepare pet photos for deletion.")
            for row in photo_response.json():
                photo_paths.append(row.get("photo_path"))
                if row.get("id"):
                    document_response = await client.get(
                        f"{supabase_url}/rest/v1/documents",
                        params={
                            "pet_id": f"eq.{row['id']}",
                            "select": "id,user_id,storage_path",
                        },
                        headers=service_headers,
                    )
                    if document_response.status_code != 200:
                        raise HTTPException(
                            status_code=502,
                            detail="Could not prepare veterinary files for deletion.",
                        )
                    for item in document_response.json():
                        if not isinstance(item, dict):
                            continue
                        object_names.append(item.get("storage_path"))
                        uploader_id = item.get("user_id")
                        document_id = item.get("id")
                        if isinstance(uploader_id, str) and isinstance(document_id, str):
                            object_names.extend(
                                await _collect_storage_objects(
                                    client,
                                    supabase_url,
                                    service_headers,
                                    f"{uploader_id}/{row['id']}/{document_id}",
                                )
                            )
                    photo_paths.extend(
                        await _collect_storage_objects(
                            client,
                            supabase_url,
                            service_headers,
                            str(row["id"]),
                            "pet-photos",
                        )
                    )
        await _delete_storage_paths(
            client,
            supabase_url,
            service_headers,
            "vet-records",
            object_names,
        )
        await _delete_storage_paths(
            client,
            supabase_url,
            service_headers,
            "pet-photos",
            photo_paths,
        )

        response = await client.delete(
            f"{supabase_url}/auth/v1/admin/users/{user.id}",
            headers=service_headers,
        )

    if response.status_code not in (200, 204):
        raise HTTPException(status_code=502, detail="Pawso could not delete the account.")

    return Response(status_code=status.HTTP_204_NO_CONTENT)
