import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import { supabase } from '../../lib/supabase';
import { API_BASE_URL } from '../config';

async function authHeaders() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error) throw error;
  if (!session?.access_token) throw new Error('Please sign in again.');
  return { Authorization: `Bearer ${session.access_token}` };
}

async function apiError(response: Response, fallback: string) {
  const body = await response.json().catch(() => null);
  const detail = body?.detail;
  if (typeof detail === 'string' && detail.trim()) return detail;
  return fallback;
}

export async function shareStructuredDataExport() {
  const response = await fetch(`${API_BASE_URL}/api/v1/account/export`, {
    headers: await authHeaders(),
  });
  if (!response.ok) {
    throw new Error(await apiError(response, 'Could not create your data export.'));
  }

  const payload = await response.text();
  const root = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  if (!root) throw new Error('A local export folder is not available.');
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is not available on this device.');
  }

  const date = new Date().toISOString().slice(0, 10);
  const uri = `${root}pawso-export-${date}.json`;
  await FileSystem.writeAsStringAsync(uri, payload, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  try {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/json',
      dialogTitle: 'Save your Pawso data export',
      UTI: 'public.json',
    });
  } finally {
    await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => undefined);
  }
}

export async function permanentlyDeletePet(petId: string) {
  const response = await fetch(`${API_BASE_URL}/api/v1/pets/${petId}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  });
  if (!response.ok) {
    throw new Error(await apiError(response, 'Could not delete this pet.'));
  }
}

export async function permanentlyDeleteDocument(documentId: string) {
  const response = await fetch(`${API_BASE_URL}/api/v1/documents/${documentId}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  });
  if (!response.ok) {
    throw new Error(await apiError(response, 'Could not delete this document.'));
  }
}
