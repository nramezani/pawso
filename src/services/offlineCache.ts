import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';

const SNAPSHOT_PREFIX = 'pawso.readOnlySnapshot';
const LATEST_PREFIX = 'pawso.latestReadOnlySnapshot';

export type CachedPetSnapshot = {
  savedAt: string;
  householdId: string;
  petId: string;
  payload: Record<string, unknown>;
};

function snapshotKey(userId: string, householdId: string, petId: string) {
  return `${SNAPSHOT_PREFIX}.${userId}.${householdId}.${petId}`;
}

export async function savePetSnapshot(
  userId: string,
  householdId: string,
  petId: string,
  payload: Record<string, unknown>
) {
  const snapshot: CachedPetSnapshot = {
    savedAt: new Date().toISOString(),
    householdId,
    petId,
    payload,
  };
  await AsyncStorage.setItem(
    snapshotKey(userId, householdId, petId),
    JSON.stringify(snapshot)
  );
  await AsyncStorage.setItem(`${LATEST_PREFIX}.${userId}`, JSON.stringify(snapshot));
}

export async function loadLatestPetSnapshot(userId: string) {
  const raw = await AsyncStorage.getItem(`${LATEST_PREFIX}.${userId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CachedPetSnapshot;
  } catch {
    await AsyncStorage.removeItem(`${LATEST_PREFIX}.${userId}`);
    return null;
  }
}

export async function loadPetSnapshot(
  userId: string,
  householdId: string,
  petId: string
) {
  const raw = await AsyncStorage.getItem(snapshotKey(userId, householdId, petId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CachedPetSnapshot;
  } catch {
    await AsyncStorage.removeItem(snapshotKey(userId, householdId, petId));
    return null;
  }
}

export async function clearUserSnapshots(userId: string) {
  const keys = await AsyncStorage.getAllKeys();
  const ownedKeys = keys.filter(
    (key) =>
      key === `${LATEST_PREFIX}.${userId}` ||
      key.startsWith(`${SNAPSHOT_PREFIX}.${userId}.`)
  );
  if (ownedKeys.length > 0) await AsyncStorage.multiRemove(ownedKeys);
}

export async function isDeviceOnline() {
  const state = await Network.getNetworkStateAsync();
  return Boolean(state.isConnected && state.isInternetReachable !== false);
}

export function subscribeToConnectivity(listener: (online: boolean) => void) {
  return Network.addNetworkStateListener((state) => {
    listener(Boolean(state.isConnected && state.isInternetReachable !== false));
  });
}
