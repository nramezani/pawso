import { Platform } from 'react-native';
import Constants from 'expo-constants';

import { supabase } from '../../lib/supabase';
import { API_BASE_URL } from '../config';

function fingerprint(value: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export async function reportClientCrash(error: Error) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;

    const platform = ['ios', 'android', 'web'].includes(Platform.OS)
      ? Platform.OS
      : 'unknown';
    await fetch(`${API_BASE_URL}/api/v1/client-events`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        kind: 'crash',
        fingerprint: fingerprint(`${error.name}:${error.message}`),
        platform,
        app_version: Constants.expoConfig?.version ?? 'unknown',
      }),
    });
  } catch {
    // Diagnostics must never cause or prolong an app failure.
  }
}
