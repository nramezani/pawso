import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import { supabase } from '../../lib/supabase';
import { API_BASE_URL } from '../config';

export async function shareInsuranceClaimPackage(petId: string, documentIds: string[]) {
  if (!documentIds.length) throw new Error('Select at least one veterinary record.');
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!session?.access_token) throw new Error('Please sign in again.');
  const root = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  if (!root) throw new Error('A temporary folder is not available.');
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available on this device.');
  const date = new Date().toISOString().slice(0, 10);
  const uri = `${root}pawso-claim-${date}.zip`;
  const query = new URLSearchParams({ pet_id: petId, document_ids: documentIds.join(',') });
  const result = await FileSystem.downloadAsync(
    `${API_BASE_URL}/api/v1/insurance-claim-package?${query}`,
    uri,
    { headers: { Authorization: `Bearer ${session.access_token}` } }
  );
  if (result.status < 200 || result.status >= 300) {
    await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => undefined);
    throw new Error('Could not create the insurance claim package.');
  }
  try {
    await Sharing.shareAsync(uri, { mimeType: 'application/zip', dialogTitle: 'Save insurance claim package', UTI: 'public.zip-archive' });
  } finally {
    await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => undefined);
  }
}
