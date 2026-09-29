import { Share } from 'react-native';

import { supabase } from '../../lib/supabase';
import { API_BASE_URL } from '../config';

export async function shareVetUploadLink(petId: string, petName: string) {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!session?.access_token) throw new Error('Please sign in again.');
  const response = await fetch(`${API_BASE_URL}/api/v1/pets/${petId}/vet-upload-link`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (!response.ok) throw new Error('Could not create the clinic upload link. Try again.');
  const { url } = await response.json();
  await Share.share({ message: `Please send ${petName}'s veterinary record to Pawso using this private, one-time link (expires in 7 days): ${url}` });
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
