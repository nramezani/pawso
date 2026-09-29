import unittest
import asyncio
import io
from unittest.mock import AsyncMock, Mock, patch
from pathlib import Path
from uuid import UUID

from fastapi import HTTPException, UploadFile
from pydantic import ValidationError

from production_router import (
    ClientEventRequest, InvitationEmailRequest, _vet_link_hash,
    create_vet_upload_link, invitation_landing_page, receive_vet_record,
    revoke_vet_upload_links,
)
from auth import AuthenticatedUser


class InvitationEmailRequestTests(unittest.TestCase):
    def test_normalizes_valid_email(self):
        request = InvitationEmailRequest(
            household_id="11111111-1111-1111-1111-111111111111",
            email="  Sitter@Example.COM ",
            role="sitter",
            invite_code="22222222-2222-2222-2222-222222222222",
        )

        self.assertEqual(request.email, "sitter@example.com")

    def test_rejects_malformed_email(self):
        with self.assertRaises(ValidationError):
            InvitationEmailRequest(
                household_id="11111111-1111-1111-1111-111111111111",
                email="not-an-email",
                role="caregiver",
                invite_code="22222222-2222-2222-2222-222222222222",
            )

    def test_email_landing_has_link_and_expo_go_code(self):
        import asyncio

        code = UUID("22222222-2222-2222-2222-222222222222")
        response = asyncio.run(invitation_landing_page(code))
        body = response.body.decode()
        self.assertIn('href="pawso://invite/22222222-2222-2222-2222-222222222222"', body)
        self.assertIn("Using Expo Go?", body)
        self.assertIn("People &amp; access", body)
        self.assertEqual(response.headers["Referrer-Policy"], "no-referrer")

    def test_rejects_malformed_identifiers(self):
        with self.assertRaises(ValidationError):
            InvitationEmailRequest(
                household_id="not-a-uuid",
                email="sitter@example.com",
                role="sitter",
                invite_code="also-not-a-uuid",
            )


class StorageDeletionTests(unittest.TestCase):
    def test_claim_package_requires_owner_selected_documents(self):
        source = (Path(__file__).resolve().parents[1] / "production_router.py").read_text(
            encoding="utf-8"
        )
        handler = source.split('@router.get("/insurance-claim-package")', 1)[1].split(
            '@router.delete("/documents/{document_id}"', 1
        )[0]
        self.assertIn("_confirm_pet_owner", handler)
        self.assertIn("document_ids", handler)
        self.assertIn("len(selected_ids) > 20", handler)
        self.assertIn('"pet_id": f"eq.{pet_id}"', handler)

    def test_document_deletion_uses_all_discovered_storage_objects(self):
        source = (Path(__file__).resolve().parents[1] / "production_router.py").read_text(
            encoding="utf-8"
        )
        document_handler = source.split(
            '@router.delete("/documents/{document_id}"', 1
        )[1].split('@router.delete("/pets/{pet_id}"', 1)[0]

        self.assertIn('"select": "id,pet_id,user_id,storage_path,filename"', document_handler)
        self.assertIn("document_objects.extend", document_handler)
        self.assertIn("document_objects,", document_handler)


class ClinicIntakeTests(unittest.TestCase):
    def test_owner_can_revoke_unconsumed_links(self):
        client = AsyncMock()
        client.__aenter__.return_value = client
        client.patch.return_value = Mock(status_code=204)
        owner = AuthenticatedUser(id='11111111-1111-1111-1111-111111111111', email='owner@example.com', access_token='test')
        pet = UUID('22222222-2222-2222-2222-222222222222')
        with patch('production_router._service_configuration', return_value=('https://example.test', {})), \
             patch('production_router._confirm_pet_owner', new_callable=AsyncMock) as confirm_owner, \
             patch('production_router.httpx.AsyncClient', return_value=client):
            response = asyncio.run(revoke_vet_upload_links(pet, owner))
        self.assertEqual(response.status_code, 204)
        confirm_owner.assert_awaited_once()
        self.assertEqual(client.patch.await_args.kwargs['params']['used_at'], 'is.null')
        self.assertEqual(client.patch.await_args.kwargs['params']['revoked_at'], 'is.null')

    def test_creation_refuses_more_than_three_active_links(self):
        client = AsyncMock()
        client.__aenter__.return_value = client
        client.get.return_value = Mock(status_code=200)
        client.get.return_value.json.return_value = [{'id': str(i)} for i in range(3)]
        owner = AuthenticatedUser(id='11111111-1111-1111-1111-111111111111', email='owner@example.com', access_token='test')
        pet = UUID('22222222-2222-2222-2222-222222222222')
        with patch('production_router._service_configuration', return_value=('https://example.test', {})), \
             patch('production_router._confirm_pet_owner', new_callable=AsyncMock, return_value={}), \
             patch('production_router.vet_link_limiter.check', new_callable=AsyncMock), \
             patch('production_router.httpx.AsyncClient', return_value=client):
            with self.assertRaises(HTTPException) as error:
                asyncio.run(create_vet_upload_link(pet, owner))
        self.assertEqual(error.exception.status_code, 409)
        client.post.assert_not_awaited()

    def test_rejects_malformed_link_before_database_access(self):
        with self.assertRaises(HTTPException) as error:
            _vet_link_hash('bad-token')
        self.assertEqual(error.exception.status_code, 404)

    def test_rejects_spoofed_pdf_without_consuming_link(self):
        file = UploadFile(filename='results.pdf', file=io.BytesIO(b'not a pdf'),
                          headers={'content-type': 'application/pdf'})
        with patch('production_router._service_configuration') as config:
            with self.assertRaises(HTTPException) as error:
                asyncio.run(receive_vet_record('A' * 43, file))
        self.assertEqual(error.exception.status_code, 400)
        config.assert_not_called()

    def test_expired_or_consumed_link_cannot_upload(self):
        file = UploadFile(filename='results.pdf', file=io.BytesIO(b'%PDF-1.7\n'),
                          headers={'content-type': 'application/pdf'})
        client = AsyncMock()
        client.post.return_value = Mock(status_code=200)
        client.post.return_value.json.return_value = []
        client.__aenter__.return_value = client
        with patch('production_router._service_configuration', return_value=('https://example.test', {})), \
             patch('production_router.httpx.AsyncClient', return_value=client):
            with self.assertRaises(HTTPException) as error:
                asyncio.run(receive_vet_record('A' * 43, file))
        self.assertEqual(error.exception.status_code, 410)
        client.post.assert_awaited_once()

    def test_valid_one_time_claim_stores_private_file_and_links_document(self):
        file = UploadFile(filename='results.pdf', file=io.BytesIO(b'%PDF-1.7\n'),
                          headers={'content-type': 'application/pdf'})
        owner = '11111111-1111-1111-1111-111111111111'
        pet = '22222222-2222-2222-2222-222222222222'
        document = '33333333-3333-3333-3333-333333333333'
        client = AsyncMock()
        client.__aenter__.return_value = client
        claim = Mock(status_code=200)
        claim.json.return_value = [{'owner_id': owner, 'pet_id': pet, 'document_id': document}]
        client.post.side_effect = [claim, Mock(status_code=200)]
        client.patch.return_value = Mock(status_code=204)
        with patch('production_router._service_configuration', return_value=('https://example.test', {})), \
             patch('production_router.httpx.AsyncClient', return_value=client):
            response = asyncio.run(receive_vet_record('A' * 43, file))
        self.assertEqual(response.status_code, 200)
        self.assertIn('Record sent securely', response.body.decode())
        self.assertIn(f'{owner}/{pet}/{document}/original.pdf', client.post.await_args_list[1].args[0])
        self.assertEqual(client.patch.await_args.kwargs['json']['storage_path'],
                         f'{owner}/{pet}/{document}/original.pdf')


class ClientEventRequestTests(unittest.TestCase):
    def test_accepts_only_low_detail_diagnostics(self):
        event = ClientEventRequest(
            kind="crash",
            fingerprint="12abcdef",
            platform="ios",
            app_version="1.0.0",
        )
        self.assertEqual(event.fingerprint, "12abcdef")

    def test_rejects_messages_or_stack_traces(self):
        with self.assertRaises(ValidationError):
            ClientEventRequest(
                kind="crash",
                fingerprint="12abcdef",
                platform="android",
                app_version="1.0.0",
                message="Pet or account data must never be accepted here",
            )


if __name__ == "__main__":
    unittest.main()
