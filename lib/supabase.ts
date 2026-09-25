import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const SUPABASE_CONFIGURATION_ERROR = !supabaseUrl
  ? 'This Pawso build is missing its Supabase URL.'
  : !supabasePublishableKey
  ? 'This Pawso build is missing its Supabase publishable key.'
  : '';

export const supabase = createClient(
  supabaseUrl ?? 'https://missing-config.supabase.co',
  supabasePublishableKey ?? 'missing-publishable-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

export function createTransientAuthClient() {
  return createClient(
    supabaseUrl ?? 'https://missing-config.supabase.co',
    supabasePublishableKey ?? 'missing-publishable-key',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    }
  );
}
