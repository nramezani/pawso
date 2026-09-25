import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';

import { supabase } from '../../lib/supabase';

function extensionForMime(mimeType?: string | null) {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  return 'jpg';
}

export async function chooseAndUploadPetPhoto(
  petId: string,
  previousPath?: string | null
) {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Allow photo access to choose a pet picture.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.82,
  });
  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
    throw new Error('Choose a pet photo smaller than 5 MB.');
  }
  const mimeType = asset.mimeType ?? 'image/jpeg';
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
    throw new Error('Choose a JPEG, PNG, or WebP pet photo.');
  }
  const extension = extensionForMime(mimeType);
  const path = `${petId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
  const base64 = await FileSystem.readAsStringAsync(asset.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  if (base64.length > Math.ceil((5 * 1024 * 1024 * 4) / 3) + 8) {
    throw new Error('Choose a pet photo smaller than 5 MB.');
  }

  const { error: uploadError } = await supabase.storage
    .from('pet-photos')
    .upload(path, decode(base64), { contentType: mimeType, upsert: false });
  if (uploadError) throw uploadError;

  const { error: updateError } = await supabase
    .from('pets')
    .update({ photo_path: path, updated_at: new Date().toISOString() })
    .eq('id', petId);
  if (updateError) {
    await supabase.storage.from('pet-photos').remove([path]);
    throw updateError;
  }

  if (previousPath && previousPath !== path) {
    await supabase.storage.from('pet-photos').remove([previousPath]);
  }
  return path;
}

export async function removePetPhoto(petId: string, path: string) {
  const { error: updateError } = await supabase
    .from('pets')
    .update({ photo_path: null, updated_at: new Date().toISOString() })
    .eq('id', petId);
  if (updateError) throw updateError;

  const { error: storageError } = await supabase.storage
    .from('pet-photos')
    .remove([path]);
  if (storageError) {
    // Restore the visible reference when storage deletion fails so retrying
    // cannot silently strand an undiscoverable private object.
    await supabase
      .from('pets')
      .update({ photo_path: path, updated_at: new Date().toISOString() })
      .eq('id', petId);
    throw storageError;
  }
}

export async function createPetPhotoUrl(path?: string | null) {
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from('pet-photos')
    .createSignedUrl(path, 60 * 60);
  if (error) throw error;
  return data?.signedUrl ?? null;
}
