import { Share } from 'react-native';

import { supabase } from '../../lib/supabase';
import { API_BASE_URL } from '../config';

async function ownerHeaders() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!session?.access_token) throw new Error('Please sign in again.');
  return { Authorization: `Bearer ${session.access_token}` };
}

export async function shareVetUploadLink(petId: string, petName: string) {
  const response = await fetch(`${API_BASE_URL}/api/v1/pets/${petId}/vet-upload-link`, {
    method: 'POST',
    headers: await ownerHeaders(),
  });
  if (!response.ok) {
    if (response.status === 409) throw new Error('Three unused links are active. Revoke them before creating a new one.');
    throw new Error('Could not create the clinic upload link. Try again.');
  }
  const { url } = await response.json();
  await Share.share({ message: `Please send ${petName}'s veterinary record to Pawso using this private, one-time link (expires in 7 days): ${url}` });
}

export async function countActiveVetUploadLinks(petId: string) {
  const response = await fetch(`${API_BASE_URL}/api/v1/pets/${petId}/vet-upload-links`, {
    headers: await ownerHeaders(),
  });
  if (!response.ok) throw new Error('Could not load clinic links.');
  const payload = await response.json();
  return Array.isArray(payload.links) ? payload.links.length as number : 0;
}

export async function revokeVetUploadLinks(petId: string) {
  const response = await fetch(`${API_BASE_URL}/api/v1/pets/${petId}/vet-upload-links`, {
    method: 'DELETE', headers: await ownerHeaders(),
  });
  if (!response.ok) throw new Error('Could not revoke clinic links. Try again.');
}

export async function confirmClinicDocument(documentId: string) {
  const { data: { user }, error: sessionError } = await supabase.auth.getUser();
  if (sessionError) throw sessionError;
  if (!user) throw new Error('Please sign in again.');
  const { data, error } = await supabase.from('documents')
    .update({ status: 'confirmed' })
    .eq('id', documentId)
    .eq('source_type', 'clinic_upload')
    .eq('status', 'review_required')
    .not('storage_path', 'is', null)
    .select('id');
  if (error) throw error;
  if (!data?.length) throw new Error('This record is unavailable or was already reviewed.');
}
