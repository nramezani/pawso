import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { decode } from 'base64-arraybuffer';
import { Alert, Appearance } from 'react-native';
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import * as Linking from 'expo-linking';

import {
  createTransientAuthClient,
  SUPABASE_CONFIGURATION_ERROR,
  supabase,
} from '../../lib/supabase';
import { API_BASE_URL } from '../config';
import {
  clearPawsoLocalNotifications,
  getLocalNotificationPermission,
  getLocalReminderPreference,
  requestLocalNotificationPermission,
  setLocalReminderPreference,
  subscribeToPawsoNotificationResponses,
  syncPawsoLocalNotifications,
} from '../services/notifications';
import { navigateToScreen } from '../navigation/navigationRef';
import { setPawsoColorScheme } from '../components/ui';
import {
  permanentlyDeleteDocument,
  permanentlyDeletePet,
  shareStructuredDataExport,
} from '../services/dataRights';
import {
  chooseAndUploadPetPhoto,
  createPetPhotoUrl,
  removePetPhoto as removeStoredPetPhoto,
} from '../services/petPhotos';
import { shareEmergencyPetCard } from '../services/emergencyCard';
import {
  clearUserSnapshots,
  isDeviceOnline,
  loadLatestPetSnapshot,
  loadPetSnapshot,
  savePetSnapshot,
  subscribeToConnectivity,
} from '../services/offlineCache';
import {
  addDaysToDateInput,
  formatDateInputInTimeZone,
  formatLocalDateInput,
  getDayBoundsInTimeZone,
  isValidLocalDate,
  parseDateTimeInTimeZone,
} from '../utils/dateTime';
import type {
  Screen,
  PetType,
  PetSex,
  AlteredStatus,
  TimelineEvent,
  PetDocument,
  Medication,
  MedicationSchedule,
  MedicationLog,
  TodayMedicationDose,
  CareTask,
  TaskCompletion,
  AskSource,
  AskAnswer,
  VetVisitPrep,
  SmartCareSuggestion,
  PetSummary,
  PetTodaySummary,
  HouseholdMember,
  HouseholdSummary,
  SymptomEntry,
  LabResult,
} from '../types';

const ACTIVE_HOUSEHOLD_KEY_PREFIX = 'pawso.activeHousehold';
const AI_PROCESSING_CONSENT_VERSION = '2026-09-24';
const APPEARANCE_KEY = 'pawso.appearance';
const PET_SELECT = [
  'id',
  'household_id',
  'name',
  'species',
  'breed',
  'approximate_age',
  'date_of_birth',
  'sex',
  'spayed_neutered',
  'weight_kg',
  'microchip_number',
  'conditions',
  'allergies',
  'medications',
  'vet_clinic',
  'photo_path',
  'archived_at',
  'emergency_notes',
  'emergency_contact_name',
  'emergency_contact_phone',
  'created_at',
].join(', ');

type DiagnosisCertainty =
  | 'confirmed'
  | 'suspected'
  | 'possible'
  | 'rule_out'
  | 'historical'
  | 'unknown';

const DIAGNOSIS_CERTAINTY_LABELS: Record<DiagnosisCertainty, string> = {
  confirmed: 'Confirmed in record',
  suspected: 'Suspected',
  possible: 'Possible',
  rule_out: 'Rule out',
  historical: 'Historical',
  unknown: 'Not stated',
};

function logDevelopmentError(label: string, error: unknown) {
  if (!__DEV__) return;
  console.log(label, error instanceof Error ? error.message : error);
}

function withoutSignedPhotoUrl(pet: PetSummary): PetSummary {
  return { ...pet, photo_url: undefined };
}

function normalizeDiagnosisCertainty(value: unknown): DiagnosisCertainty {
  return typeof value === 'string' && value in DIAGNOSIS_CERTAINTY_LABELS
    ? (value as DiagnosisCertainty)
    : 'unknown';
}

function activeHouseholdStorageKey(userId: string) {
  return `${ACTIVE_HOUSEHOLD_KEY_PREFIX}.${userId}`;
}

function aiConsentStorageKey(userId: string) {
  return `pawso.aiProcessingConsent.${userId}`;
}

function offlineAccessStorageKey(userId: string) {
  return `pawso.offlineAccessEnabled.${userId}`;
}

function usePawsoState() {
  const setScreen = (screen: Screen) => navigateToScreen(screen);

  const [apiStatus, setApiStatus] = useState('Checking backend...');
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState('');
  const [accountEmail, setAccountEmail] = useState('');
  const [accountUserId, setAccountUserId] = useState('');
  const [accountIsAnonymous, setAccountIsAnonymous] = useState(true);
  const [accountBusy, setAccountBusy] = useState(false);
  const [accountMessage, setAccountMessage] = useState('');
  const [accountError, setAccountError] = useState('');
  const [secureAccountEmail, setSecureAccountEmail] = useState('');
  const [secureAccountPassword, setSecureAccountPassword] = useState('');
  const [accountAuthMode, setAccountAuthMode] = useState<'secure' | 'signin'>('secure');
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [passwordResetCooldown, setPasswordResetCooldown] = useState(0);
  const [accountRecoveryMode, setAccountRecoveryMode] = useState(false);
  const [recoveryPassword, setRecoveryPassword] = useState('');
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [householdName, setHouseholdName] = useState('My Pawso Household');
  const [householdTimeZone, setHouseholdTimeZone] = useState('UTC');
  const [householdOptions, setHouseholdOptions] = useState<HouseholdSummary[]>([]);
  const [householdRole, setHouseholdRole] = useState<'owner' | 'caregiver' | 'sitter' | null>(null);
  const [householdMembers, setHouseholdMembers] = useState<HouseholdMember[]>([]);
  const [householdInvitations, setHouseholdInvitations] = useState<any[]>([]);
  const [householdBusy, setHouseholdBusy] = useState(false);
  const [householdError, setHouseholdError] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'caregiver' | 'sitter'>('caregiver');
  const [inviteCode, setInviteCode] = useState('');
  const [inviteEmailStatus, setInviteEmailStatus] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [memberDisplayName, setMemberDisplayName] = useState('');
  const canViewMedical = householdRole === 'owner' || householdRole === 'caregiver';
  const canManageMedical = householdRole === 'owner';
  const canManageCare = householdRole === 'owner' || householdRole === 'caregiver';
  const canLogCare = householdRole !== null;
  const [databaseError, setDatabaseError] = useState('');
  const [isSavingPet, setIsSavingPet] = useState(false);
  const [isEditingPet, setIsEditingPet] = useState(false);
  const [isConfirmingExtraction, setIsConfirmingExtraction] = useState(false);
  const [currentPetId, setCurrentPetId] = useState<string | null>(null);
  const [pets, setPets] = useState<PetSummary[]>([]);
  const selectPetRef = useRef<
    (petId: string, destination?: Screen) => Promise<boolean>
  >(async () => false);
  const [archivedPets, setArchivedPets] = useState<PetSummary[]>([]);
  const [allPetsToday, setAllPetsToday] = useState<PetTodaySummary[]>([]);
  const [todayView, setTodayView] = useState<'all' | 'pet'>('pet');
  const [petPhotoPath, setPetPhotoPath] = useState<string | null>(null);
  const [petPhotoUrl, setPetPhotoUrl] = useState<string | null>(null);
  const [petPhotoBusy, setPetPhotoBusy] = useState(false);
  const petPhotoRequestRef = useRef(0);
  const [petDateOfBirth, setPetDateOfBirth] = useState('');
  const [emergencyNotes, setEmergencyNotes] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  const [petName, setPetName] = useState('');
  const [petType, setPetType] = useState<PetType | null>(null);
  const [breed, setBreed] = useState('');
  const [petAge, setPetAge] = useState('');
  const [petSex, setPetSex] = useState<PetSex | null>(null);
  const [alteredStatus, setAlteredStatus] =
    useState<AlteredStatus | null>(null);

  const [weight, setWeight] = useState('');
  const [microchip, setMicrochip] = useState('');
  const [conditions, setConditions] = useState('');
  const [allergies, setAllergies] = useState('');
  const [medications, setMedications] = useState('');
  const [vetClinic, setVetClinic] = useState('');

  const [documentName, setDocumentName] = useState('');
  const [documentSize, setDocumentSize] = useState<number | null>(null);
  const [documentContentType, setDocumentContentType] = useState('');
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null);
  const [currentExtractionId, setCurrentExtractionId] = useState<string | null>(null);

  const [uploadError, setUploadError] = useState('');

  const [visitDate, setVisitDate] = useState('');
  const [clinic, setClinic] = useState('');
  const [finding, setFinding] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [diagnosisCertainty, setDiagnosisCertainty] =
    useState<DiagnosisCertainty>('unknown');
  const [followUp, setFollowUp] = useState('');
  const [extractedMedications, setExtractedMedications] = useState<string[]>([]);
  const [extractionWarnings, setExtractionWarnings] = useState<string[]>([]);
  const [extractionModel, setExtractionModel] = useState('');
  const [extractionPromptVersion, setExtractionPromptVersion] = useState('');

  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [petDocuments, setPetDocuments] = useState<PetDocument[]>([]);
  const [archivedPetDocuments, setArchivedPetDocuments] = useState<PetDocument[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState('');
  const [openingDocumentId, setOpeningDocumentId] = useState<string | null>(null);
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(null);

  const [medicationList, setMedicationList] = useState<Medication[]>([]);
  const [medicationSchedules, setMedicationSchedules] = useState<MedicationSchedule[]>([]);
  const [medicationLogs, setMedicationLogs] = useState<MedicationLog[]>([]);
  const [medicationHistoryLogs, setMedicationHistoryLogs] = useState<MedicationLog[]>([]);
  const [medicationsLoading, setMedicationsLoading] = useState(false);
  const [medicationsError, setMedicationsError] = useState('');
  const [isSavingMedication, setIsSavingMedication] = useState(false);
  const [deletingMedicationId, setDeletingMedicationId] = useState<string | null>(null);
  const [loggingDoseId, setLoggingDoseId] = useState<string | null>(null);

  const [newMedicationName, setNewMedicationName] = useState('');
  const [newMedicationDose, setNewMedicationDose] = useState('');
  const [newMedicationUnit, setNewMedicationUnit] = useState('');
  const [newMedicationInstructions, setNewMedicationInstructions] = useState('');
  const [newMedicationTimes, setNewMedicationTimes] = useState<string[]>(['08:00']);
  const [editingMedicationId, setEditingMedicationId] = useState<string | null>(null);
  const [newMedicationStartDate, setNewMedicationStartDate] = useState('');
  const [newMedicationEndDate, setNewMedicationEndDate] = useState('');
  const [newMedicationRefills, setNewMedicationRefills] = useState('');
  const [newMedicationRefillDate, setNewMedicationRefillDate] = useState('');
  const [newMedicationPaused, setNewMedicationPaused] = useState(false);

  const [careTasks, setCareTasks] = useState<CareTask[]>([]);
  const [taskCompletions, setTaskCompletions] = useState<TaskCompletion[]>([]);
  const [careLoading, setCareLoading] = useState(false);
  const [careError, setCareError] = useState('');
  const [savingCareTask, setSavingCareTask] = useState(false);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  const [newCareTitle, setNewCareTitle] = useState('');
  const [newCareNotes, setNewCareNotes] = useState('');
  const [newCareDate, setNewCareDate] = useState('');
  const [newCareTime, setNewCareTime] = useState('09:00');
  const [newCareFrequency, setNewCareFrequency] = useState<
    'none' | 'daily' | 'weekly' | 'monthly'
  >('none');
  const [newCareInterval, setNewCareInterval] = useState('1');
  const [newCareEndsOn, setNewCareEndsOn] = useState('');

  const [askQuestion, setAskQuestion] = useState('');
  const [askAnswer, setAskAnswer] = useState<AskAnswer | null>(null);
  const [askSources, setAskSources] = useState<AskSource[]>([]);
  const [askLoading, setAskLoading] = useState(false);
  const [askError, setAskError] = useState('');
  const [visitReason, setVisitReason] = useState('');
  const [visitChanges, setVisitChanges] = useState('');
  const [vetVisitPrep, setVetVisitPrep] = useState<VetVisitPrep | null>(null);
  const [vetVisitPrepLoading, setVetVisitPrepLoading] = useState(false);
  const [vetVisitPrepError, setVetVisitPrepError] = useState('');
  const [checkInType, setCheckInType] = useState<'symptom' | 'weight'>('symptom');
  const [checkInDate, setCheckInDate] = useState(formatLocalDateInput());
  const [checkInTitle, setCheckInTitle] = useState('');
  const [checkInDetails, setCheckInDetails] = useState('');
  const [checkInWeight, setCheckInWeight] = useState('');
  const [checkInSaving, setCheckInSaving] = useState(false);
  const [checkInError, setCheckInError] = useState('');
  const [symptomEntries, setSymptomEntries] = useState<SymptomEntry[]>([]);
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [healthDataLoading, setHealthDataLoading] = useState(false);
  const [healthDataError, setHealthDataError] = useState('');
  const [symptomSeverity, setSymptomSeverity] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [symptomFrequency, setSymptomFrequency] = useState<
    'single' | 'intermittent' | 'frequent' | 'constant'
  >('single');
  const [symptomDuration, setSymptomDuration] = useState('');
  const [newLabDate, setNewLabDate] = useState(formatLocalDateInput());
  const [newLabTest, setNewLabTest] = useState('');
  const [newLabValue, setNewLabValue] = useState('');
  const [newLabUnit, setNewLabUnit] = useState('');
  const [newLabLow, setNewLabLow] = useState('');
  const [newLabHigh, setNewLabHigh] = useState('');
  const [newLabNotes, setNewLabNotes] = useState('');
  const [healthDataSaving, setHealthDataSaving] = useState(false);
  const [smartCareSuggestions, setSmartCareSuggestions] = useState<SmartCareSuggestion[]>([]);
  const [smartCareSources, setSmartCareSources] = useState<AskSource[]>([]);
  const [smartCareLoading, setSmartCareLoading] = useState(false);
  const [smartCareError, setSmartCareError] = useState('');
  const [notificationPermission, setNotificationPermission] = useState<
    'granted' | 'denied' | 'undetermined'
  >('undetermined');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationSyncing, setNotificationSyncing] = useState(false);
  const [scheduledNotificationCount, setScheduledNotificationCount] = useState(0);
  const [notificationError, setNotificationError] = useState('');
  const [dataRightsBusy, setDataRightsBusy] = useState(false);
  const [dataRightsMessage, setDataRightsMessage] = useState('');
  const [dataRightsError, setDataRightsError] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [offlineSnapshotAt, setOfflineSnapshotAt] = useState<string | null>(null);
  const [offlineAccessEnabled, setOfflineAccessEnabledState] = useState(false);
  const [appearanceMode, setAppearanceModeState] = useState<'system' | 'light' | 'dark'>('system');
  const [systemAppearance, setSystemAppearance] = useState<'light' | 'dark'>(
    Appearance.getColorScheme() === 'dark' ? 'dark' : 'light'
  );
  const resolvedAppearance =
    appearanceMode === 'system' ? systemAppearance : appearanceMode;
  setPawsoColorScheme(resolvedAppearance);

  async function getApiAuthHeaders(contentType?: string) {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (!session?.access_token) {
      throw new Error('Pawso session is not ready. Please sign in again.');
    }

    return {
      Authorization: `Bearer ${session.access_token}`,
      ...(contentType ? { 'Content-Type': contentType } : {}),
    };
  }

  function requireOnline(setError: (message: string) => void) {
    if (isOnline) return true;
    setError('Pawso is offline. Reconnect before making changes.');
    return false;
  }

  function getApiErrorMessage(body: any, fallback: string) {
    const detail = body?.detail ?? body?.message;

    if (typeof detail === 'string' && detail.trim()) {
      return detail;
    }

    if (Array.isArray(detail)) {
      const messages = detail
        .map((item) => {
          if (typeof item === 'string') return item;
          if (!item || typeof item !== 'object') return '';
          const location = Array.isArray(item.loc)
            ? item.loc.filter((part: unknown) => part !== 'body').join(' → ')
            : '';
          const message = typeof item.msg === 'string' ? item.msg : '';
          return [location, message].filter(Boolean).join(': ');
        })
        .filter(Boolean);

      if (messages.length > 0) {
        return messages.join('\n');
      }
    }

    if (detail && typeof detail === 'object') {
      try {
        return JSON.stringify(detail);
      } catch {
        return fallback;
      }
    }

    return fallback;
  }

  function sanitizeAskSource(source: AskSource): AskSource {
    const shorten = (value: string, maxLength: number, fallback: string) => {
      const normalized = value.trim() || fallback;
      if (normalized.length <= maxLength) return normalized;
      return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
    };

    return {
      ...source,
      id: shorten(source.id, 200, 'source'),
      label: shorten(source.label, 500, 'Health record'),
      source_type: shorten(source.source_type, 200, 'Pawso record'),
      date: source.date ? shorten(source.date, 100, '') : undefined,
      text: shorten(source.text, 10000, 'No additional record details.'),
    };
  }

  useEffect(() => {
    checkBackend();
    initializeSupabase();
    // Provider bootstrap must run exactly once; auth changes are handled by Supabase listeners.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (passwordResetCooldown <= 0) return;
    const timer = setTimeout(
      () => setPasswordResetCooldown((value) => Math.max(0, value - 1)),
      1000
    );
    return () => clearTimeout(timer);
  }, [passwordResetCooldown]);

  useEffect(() => {
    if (
      !offlineAccessEnabled ||
      householdRole !== 'owner' ||
      !currentPetId ||
      !householdId
    ) return;
    const pet = pets.find((item) => item.id === currentPetId);
    if (!pet) return;
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      savePetSnapshot(data.user.id, householdId, currentPetId, {
        householdName,
        householdTimeZone,
        householdRole,
        householdMembers,
        pets: pets.map(withoutSignedPhotoUrl),
        pet: withoutSignedPhotoUrl(pet),
        timelineEvents: timelineEvents.slice(0, 100),
        petDocuments: petDocuments.slice(0, 50),
        medicationList,
        medicationSchedules,
        medicationLogs,
        medicationHistoryLogs: medicationHistoryLogs.slice(-100),
        careTasks: careTasks.slice(0, 100),
        taskCompletions: taskCompletions.slice(0, 100),
        symptomEntries: symptomEntries.slice(0, 100),
        labResults: labResults.slice(0, 100),
      }).catch(() => undefined);
    });
  }, [
    currentPetId,
    householdId,
    householdName,
    householdTimeZone,
    householdRole,
    householdMembers,
    pets,
    timelineEvents,
    petDocuments,
    medicationList,
    medicationSchedules,
    medicationLogs,
    medicationHistoryLogs,
    careTasks,
    taskCompletions,
    symptomEntries,
    labResults,
    offlineAccessEnabled,
  ]);

  useEffect(() => {
    AsyncStorage.getItem(APPEARANCE_KEY)
      .then((value) => {
        if (value === 'system' || value === 'light' || value === 'dark') {
          setAppearanceModeState(value);
        }
      })
      .catch(() => undefined);

    isDeviceOnline().then(setIsOnline).catch(() => undefined);
    const networkSubscription = subscribeToConnectivity(setIsOnline);
    const appearanceSubscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemAppearance(colorScheme === 'dark' ? 'dark' : 'light');
    });
    return () => {
      networkSubscription.remove();
      appearanceSubscription.remove();
    };
  }, []);

  async function setAppearanceMode(mode: 'system' | 'light' | 'dark') {
    setAppearanceModeState(mode);
    await AsyncStorage.setItem(APPEARANCE_KEY, mode);
  }

  async function updateOfflineAccess(enabled: boolean) {
    if (enabled && householdRole !== 'owner') {
      throw new Error('Only a household owner can enable offline medical access.');
    }
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) throw error;
    if (!user) throw new Error('Pawso session is not ready.');

    await AsyncStorage.setItem(
      offlineAccessStorageKey(user.id),
      enabled ? 'true' : 'false'
    );
    setOfflineAccessEnabledState(enabled);
    if (!enabled) {
      await clearUserSnapshots(user.id);
      setOfflineSnapshotAt(null);
    }
  }

  useEffect(() => {
    if (SUPABASE_CONFIGURATION_ERROR) return;

    let unsubscribe = () => {};
    let active = true;

    subscribeToPawsoNotificationResponses(async (data) => {
      const petId = typeof data.petId === 'string' ? data.petId : '';
      if (!petId) return;

      const selected = await selectPetRef.current(petId);
      if (!selected) return;
      setScreen(data.kind === 'care_task' ? 'care' : 'medications');
    })
      .then((cleanup) => {
        if (active) unsubscribe = cleanup;
        else cleanup();
      })
      .catch((error) => logDevelopmentError('Notification response error:', error));

    return () => {
      active = false;
      unsubscribe();
    };
    // Notification taps subscribe once and dispatch through selectPetRef.
  }, []);

  useEffect(() => {
    const handleUrl = ({ url }: { url: string }) => {
      handleAuthCallback(url);
    };

    Linking.getInitialURL().then((url) => {
      if (url) handleAuthCallback(url);
    });

    const subscription = Linking.addEventListener('url', handleUrl);
    return () => subscription.remove();
    // Linking subscribes once; callback processing obtains the current auth session itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshNotificationState(petRows?: PetSummary[]) {
    try {
      const [enabled, permission] = await Promise.all([
        getLocalReminderPreference(),
        getLocalNotificationPermission(),
      ]);

      setNotificationsEnabled(enabled);
      setNotificationPermission(
        permission === 'granted'
          ? 'granted'
          : permission === 'denied'
          ? 'denied'
          : 'undetermined'
      );

      if (enabled && permission === 'granted') {
        const rows = petRows ?? pets;
        if (rows.length > 0) {
          const count = await syncPawsoLocalNotifications(rows, householdTimeZone);
          setScheduledNotificationCount(count);
        }
      }
    } catch (error) {
      logDevelopmentError('Notification state error:', error);
      setNotificationError(
        error instanceof Error
          ? error.message
          : 'Could not prepare reminders.'
      );
    }
  }

  async function enableNotifications() {
    try {
      setNotificationSyncing(true);
      setNotificationError('');

      const permission = await requestLocalNotificationPermission();
      setNotificationPermission(
        permission === 'granted'
          ? 'granted'
          : permission === 'denied'
          ? 'denied'
          : 'undetermined'
      );

      if (permission !== 'granted') {
        await setLocalReminderPreference(false);
        setNotificationsEnabled(false);
        setScheduledNotificationCount(0);
        return;
      }

      await setLocalReminderPreference(true);
      setNotificationsEnabled(true);

      const count = await syncPawsoLocalNotifications(pets, householdTimeZone);
      setScheduledNotificationCount(count);
    } catch (error) {
      logDevelopmentError('Enable notifications error:', error);
      setNotificationError(
        error instanceof Error
          ? error.message
          : 'Could not enable reminders.'
      );
    } finally {
      setNotificationSyncing(false);
    }
  }

  async function disableNotifications() {
    try {
      setNotificationSyncing(true);
      setNotificationError('');
      await setLocalReminderPreference(false);
      await clearPawsoLocalNotifications();
      setNotificationsEnabled(false);
      setScheduledNotificationCount(0);
    } catch (error) {
      logDevelopmentError('Disable notifications error:', error);
      setNotificationError(
        error instanceof Error
          ? error.message
          : 'Could not disable reminders.'
      );
    } finally {
      setNotificationSyncing(false);
    }
  }

  async function syncNotificationsIfEnabled(petRows?: PetSummary[]) {
    try {
      const enabled = await getLocalReminderPreference();
      if (!enabled) return;

      const permission = await getLocalNotificationPermission();
      if (permission !== 'granted') return;

      const rows = petRows ?? pets;
      if (rows.length === 0) return;

      const count = await syncPawsoLocalNotifications(rows, householdTimeZone);
      setScheduledNotificationCount(count);
    } catch (error) {
      logDevelopmentError('Notification sync error:', error);
      setNotificationError(
        error instanceof Error
          ? error.message
          : 'Could not refresh reminders.'
      );
    }
  }

  async function ensureHousehold(displayName?: string) {
    const { data, error } = await supabase.rpc('ensure_household_for_current_user', {
      preferred_display_name: displayName?.trim() || null,
    });

    if (error) throw error;
    if (!data) throw new Error('Pawso could not prepare a household.');

    setHouseholdId(data as string);
    return data as string;
  }

  async function loadHouseholdOptions(userId: string) {
    const { data, error } = await supabase
      .from('household_members')
      .select('household_id, role, households!inner(name, time_zone)')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (error) throw error;

    const options: HouseholdSummary[] = (data ?? []).map((row: any) => ({
      household_id: row.household_id,
      role: row.role,
      name: row.households?.name ?? 'Pawso household',
      time_zone: row.households?.time_zone ?? 'UTC',
    }));
    setHouseholdOptions(options);
    return options;
  }

  async function rememberActiveHousehold(userId: string, activeHouseholdId: string) {
    await AsyncStorage.setItem(
      activeHouseholdStorageKey(userId),
      activeHouseholdId
    );
  }

  async function resolveActiveHousehold(userId: string, displayName?: string) {
    const rememberedHouseholdId = await AsyncStorage.getItem(
      activeHouseholdStorageKey(userId)
    );

    const { data: memberships, error } = await supabase
      .from('household_members')
      .select('household_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    await loadHouseholdOptions(userId);

    const rememberedMembership = (memberships ?? []).find(
      (membership) => membership.household_id === rememberedHouseholdId
    );
    const activeHouseholdId =
      rememberedMembership?.household_id ??
      memberships?.[0]?.household_id ??
      (await ensureHousehold(displayName));

    await rememberActiveHousehold(userId, activeHouseholdId);
    setHouseholdId(activeHouseholdId);
    return activeHouseholdId;
  }

  async function loadHousehold(targetHouseholdId?: string | null) {
    try {
      setHouseholdError('');

      const id = targetHouseholdId ?? householdId ?? (await ensureHousehold(memberDisplayName));
      setHouseholdId(id);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;
      if (!session?.user) throw new Error('Pawso session is not ready.');

      const [
        { data: household, error: householdLoadError },
        { data: members, error: membersError },
        { data: invitations, error: invitationsError },
      ] = await Promise.all([
        supabase.from('households').select('id, name, time_zone').eq('id', id).single(),
        supabase
          .from('household_members')
          .select('id, household_id, user_id, display_name, role, created_at')
          .eq('household_id', id)
          .order('created_at', { ascending: true }),
        supabase
          .from('household_invitations')
          .select('id, household_id, invited_email, role, status, invite_code, expires_at, created_at')
          .eq('household_id', id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false }),
      ]);

      if (householdLoadError) throw householdLoadError;
      if (membersError) throw membersError;
      setHouseholdName(household?.name ?? 'My Pawso Household');
      setHouseholdTimeZone(household?.time_zone ?? 'UTC');
      setHouseholdMembers((members ?? []) as HouseholdMember[]);

      const currentMember = (members ?? []).find(
        (member: any) => member.user_id === session.user.id
      );

      if (!currentMember) {
        throw new Error('You no longer have access to this household.');
      }

      if (invitationsError && currentMember.role === 'owner') {
        throw invitationsError;
      }

      setHouseholdInvitations(invitationsError ? [] : invitations ?? []);
      setHouseholdRole(currentMember?.role ?? null);
      await rememberActiveHousehold(session.user.id, id);

      if (!memberDisplayName && currentMember?.display_name) {
        setMemberDisplayName(currentMember.display_name);
      }

      return id;
    } catch (error) {
      logDevelopmentError('Load household error:', error);
      setHouseholdError(
        error instanceof Error ? error.message : 'Could not load household.'
      );
      throw error;
    }
  }

  async function switchHousehold(targetHouseholdId: string) {
    if (!requireOnline(setHouseholdError)) return;
    if (!targetHouseholdId || targetHouseholdId === householdId) return;
    try {
      setHouseholdBusy(true);
      setHouseholdError('');
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) throw error;
      if (!session?.user) throw new Error('Pawso session is not ready.');

      await rememberActiveHousehold(session.user.id, targetHouseholdId);
      clearPetScopedState();
      await loadExistingPet(session.user.id, targetHouseholdId);
      setScreen('today');
    } catch (error) {
      setHouseholdError(
        error instanceof Error ? error.message : 'Could not switch households.'
      );
    } finally {
      setHouseholdBusy(false);
    }
  }

  async function updateHouseholdTimeZone(timeZone: string) {
    if (!requireOnline(setHouseholdError)) return;
    if (!householdId || householdRole !== 'owner') return;
    try {
      Intl.DateTimeFormat(undefined, { timeZone }).format(new Date());
      const { error } = await supabase
        .from('households')
        .update({ time_zone: timeZone })
        .eq('id', householdId);
      if (error) throw error;
      setHouseholdTimeZone(timeZone);
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) await loadHouseholdOptions(session.user.id);
      await syncNotificationsIfEnabled();
    } catch (error) {
      setHouseholdError(
        error instanceof RangeError
          ? 'Enter a valid IANA time zone, such as America/Vancouver.'
          : error instanceof Error
          ? error.message
          : 'Could not update the household time zone.'
      );
    }
  }

  async function updateHouseholdMemberRole(
    memberId: string,
    role: 'caregiver' | 'sitter'
  ) {
    if (!requireOnline(setHouseholdError)) return;
    if (!householdId) return;
    try {
      setHouseholdBusy(true);
      setHouseholdError('');
      const { error } = await supabase.rpc('update_household_member_role', {
        target_household: householdId,
        target_member: memberId,
        target_role: role,
      });
      if (error) throw error;
      await loadHousehold(householdId);
    } catch (error) {
      setHouseholdError(
        error instanceof Error ? error.message : 'Could not change this role.'
      );
    } finally {
      setHouseholdBusy(false);
    }
  }

  async function refreshHousehold() {
    if (!householdId) return;
    setHouseholdBusy(true);
    try {
      await loadHousehold(householdId);
    } finally {
      setHouseholdBusy(false);
    }
  }

  async function removeHouseholdMember(memberId: string) {
    if (!requireOnline(setHouseholdError)) return;
    if (!householdId) return;
    try {
      setHouseholdBusy(true);
      setHouseholdError('');
      const { error } = await supabase.rpc('remove_household_member', {
        target_household: householdId,
        target_member: memberId,
      });
      if (error) throw error;
      await loadHousehold(householdId);
    } catch (error) {
      setHouseholdError(
        error instanceof Error ? error.message : 'Could not remove access.'
      );
    } finally {
      setHouseholdBusy(false);
    }
  }

  async function cancelHouseholdInvitation(invitationId: string) {
    if (!requireOnline(setHouseholdError)) return;
    if (!householdId) return;
    try {
      setHouseholdBusy(true);
      setHouseholdError('');
      const { error } = await supabase.rpc('cancel_household_invitation', {
        target_household: householdId,
        target_invitation: invitationId,
      });
      if (error) throw error;
      await loadHousehold(householdId);
    } catch (error) {
      setHouseholdError(
        error instanceof Error ? error.message : 'Could not cancel invitation.'
      );
    } finally {
      setHouseholdBusy(false);
    }
  }

  async function createHouseholdInvite() {
    if (!requireOnline(setHouseholdError)) return;
    if (!householdId) return;
    if (accountIsAnonymous) {
      setHouseholdError('Secure your Pawso account before sending invitations.');
      return;
    }

    try {
      setHouseholdBusy(true);
      setHouseholdError('');
      setInviteCode('');
      setInviteEmailStatus('');

      const { data, error } = await supabase.rpc('create_household_invitation', {
        target_household: householdId,
        target_email: inviteEmail.trim() || null,
        target_role: inviteRole,
      });

      if (error) throw error;
      const createdCode = String(data ?? '');
      setInviteCode(createdCode);

      if (inviteEmail.trim()) {
        setInviteEmailStatus('Sending invitation email…');
        try {
          const response = await fetch(`${API_BASE_URL}/api/v1/household-invitations/email`, {
            method: 'POST',
            headers: await getApiAuthHeaders('application/json'),
            body: JSON.stringify({
              household_id: householdId,
              email: inviteEmail.trim().toLowerCase(),
              role: inviteRole,
              invite_code: createdCode,
            }),
          });
          const body = await response.json().catch(() => null);
          if (!response.ok) {
            throw new Error(getApiErrorMessage(body, 'Automatic email is unavailable.'));
          }
          setInviteEmailStatus('Invitation email sent.');
        } catch (emailError) {
          setInviteEmailStatus(
            emailError instanceof Error
              ? `${emailError.message} You can still use Email or Share below.`
              : 'Automatic email is unavailable. Use Email or Share below.'
          );
        }
      }
    } catch (error) {
      logDevelopmentError('Create household invitation error:', error);
      setHouseholdError(
        error instanceof Error ? error.message : 'Could not create invitation.'
      );
    } finally {
      setHouseholdBusy(false);
    }
  }

  async function acceptHouseholdInvite() {
    if (!requireOnline(setHouseholdError)) return;
    if (accountIsAnonymous) {
      setHouseholdError('Secure or sign in to your Pawso account before joining a household.');
      return;
    }
    const code = joinCode.trim();
    if (!code) return;

    try {
      setHouseholdBusy(true);
      setHouseholdError('');

      const { data, error } = await supabase.rpc('accept_household_invitation', {
        code_text: code,
        preferred_display_name: memberDisplayName.trim() || null,
      });

      if (error) throw error;
      if (!data) throw new Error('Pawso could not join that household.');

      const joinedHouseholdId = String(data);
      setHouseholdId(joinedHouseholdId);
      setJoinCode('');
      setInviteCode('');

      await loadHousehold(joinedHouseholdId);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        await loadExistingPet(session.user.id, joinedHouseholdId);
      }
    } catch (error) {
      logDevelopmentError('Accept household invitation error:', error);
      setHouseholdError(
        error instanceof Error ? error.message : 'Could not join household.'
      );
    } finally {
      setHouseholdBusy(false);
    }
  }
  function hydrateAccount(user: any) {
    setAccountUserId(user?.id ?? '');
    setAccountEmail(user?.email ?? '');
    setAccountIsAnonymous(Boolean(user?.is_anonymous));
    if (user?.email) {
      setSecureAccountEmail(user.email);
    }
  }

  function resetUserScopedState() {
    setAccountEmail('');
    setAccountUserId('');
    setAccountIsAnonymous(true);
    setSecureAccountEmail('');
    setSecureAccountPassword('');
    setSignInEmail('');
    setSignInPassword('');
    setPasswordResetCooldown(0);
    setAccountRecoveryMode(false);
    setRecoveryPassword('');
    setHouseholdId(null);
    setHouseholdName('My Pawso Household');
    setHouseholdTimeZone('UTC');
    setHouseholdOptions([]);
    setHouseholdRole(null);
    setHouseholdMembers([]);
    setHouseholdInvitations([]);
    setHouseholdError('');
    setInviteEmail('');
    setInviteCode('');
    setInviteEmailStatus('');
    setJoinCode('');
    setMemberDisplayName('');
    setCurrentPetId(null);
    setIsEditingPet(false);
    setPets([]);
    setAllPetsToday([]);
    setTodayView('pet');
    setPetName('');
    setPetType(null);
    setBreed('');
    setPetAge('');
    setPetDateOfBirth('');
    setPetSex(null);
    setAlteredStatus(null);
    setWeight('');
    setMicrochip('');
    setConditions('');
    setAllergies('');
    setMedications('');
    setVetClinic('');
    setPetPhotoPath(null);
    setPetPhotoUrl(null);
    setEmergencyNotes('');
    setEmergencyContactName('');
    setEmergencyContactPhone('');
    setDocumentName('');
    setDocumentSize(null);
    setDocumentContentType('');
    setCurrentDocumentId(null);
    setCurrentExtractionId(null);
    setVisitDate('');
    setClinic('');
    setFinding('');
    setDiagnosis('');
    setDiagnosisCertainty('unknown');
    setFollowUp('');
    setExtractedMedications([]);
    setExtractionWarnings([]);
    setExtractionModel('');
    setExtractionPromptVersion('');
    setTimelineEvents([]);
    setPetDocuments([]);
    setArchivedPetDocuments([]);
    setMedicationList([]);
    setMedicationSchedules([]);
    setMedicationLogs([]);
    setMedicationHistoryLogs([]);
    setEditingMedicationId(null);
    setNewMedicationStartDate('');
    setNewMedicationEndDate('');
    setNewMedicationRefills('');
    setNewMedicationRefillDate('');
    setNewMedicationPaused(false);
    setCareTasks([]);
    setTaskCompletions([]);
    setNewCareFrequency('none');
    setNewCareInterval('1');
    setNewCareEndsOn('');
    setSymptomEntries([]);
    setLabResults([]);
    setAskQuestion('');
    setAskAnswer(null);
    setAskSources([]);
    setVisitReason('');
    setVisitChanges('');
    setVetVisitPrep(null);
    setSmartCareSuggestions([]);
    setSmartCareSources([]);
    setScheduledNotificationCount(0);
    setDatabaseError('');
    setUploadError('');
    setDocumentsError('');
    setMedicationsError('');
    setCareError('');
    setAskError('');
    setVetVisitPrepError('');
    setSmartCareError('');
    setNotificationError('');
    setDataRightsMessage('');
    setDataRightsError('');
    setOfflineSnapshotAt(null);
    setOfflineAccessEnabledState(false);
  }

  async function prepareAnonymousWorkspace() {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    if (!data.user) {
      throw new Error('Pawso could not prepare a new temporary session.');
    }

    hydrateAccount(data.user);
    const freshHouseholdId = await resolveActiveHousehold(data.user.id);
    await loadHousehold(freshHouseholdId);
  }

  async function signInAccount() {
    if (!requireOnline(setAccountError)) return;
    try {
      setAccountBusy(true);
      setAccountError('');
      setAccountMessage('');

      const email = signInEmail.trim().toLowerCase();
      if (!email || !email.includes('@')) {
        throw new Error('Enter the email address for your Pawso account.');
      }
      if (!signInPassword) {
        throw new Error('Enter your Pawso password.');
      }

      const {
        data: { session: currentSession },
        error: currentSessionError,
      } = await supabase.auth.getSession();
      if (currentSessionError) throw currentSessionError;

      // Verify the destination credentials without replacing the persistent
      // anonymous session. This lets Pawso safely remove the temporary
      // workspace before changing accounts instead of orphaning its records.
      const transientAuth = createTransientAuthClient();
      const { data: verified, error } = await transientAuth.auth.signInWithPassword({
        email,
        password: signInPassword,
      });

      if (error) throw error;
      if (!verified.user || !verified.session) {
        throw new Error('Pawso could not sign in to that account.');
      }

      const previousUser = currentSession?.user;
      if (previousUser?.is_anonymous && previousUser.id !== verified.user.id) {
        if (!currentSession?.access_token) {
          throw new Error('The temporary Pawso session is not ready. Please try again.');
        }
        const deleteResponse = await fetch(`${API_BASE_URL}/api/v1/account`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${currentSession.access_token}` },
        });
        const deleteBody = await deleteResponse.json().catch(() => null);
        if (!deleteResponse.ok) {
          throw new Error(
            getApiErrorMessage(
              deleteBody,
              'Could not safely remove the temporary workspace. Please try again.'
            )
          );
        }

        await AsyncStorage.multiRemove([
          activeHouseholdStorageKey(previousUser.id),
          aiConsentStorageKey(previousUser.id),
          offlineAccessStorageKey(previousUser.id),
        ]);
        await clearUserSnapshots(previousUser.id);
        await setLocalReminderPreference(false);
        await clearPawsoLocalNotifications();
      }

      const { data, error: setSessionError } = await supabase.auth.setSession({
        access_token: verified.session.access_token,
        refresh_token: verified.session.refresh_token,
      });
      if (setSessionError) throw setSessionError;
      if (!data.user) throw new Error('Pawso could not open that account.');

      clearPetScopedState();
      setHouseholdId(null);
      setHouseholdRole(null);
      setHouseholdMembers([]);
      setHouseholdInvitations([]);
      hydrateAccount(data.user);
      setOfflineAccessEnabledState(
        (await AsyncStorage.getItem(offlineAccessStorageKey(data.user.id))) === 'true'
      );
      setSignInPassword('');
      const activeHouseholdId = await resolveActiveHousehold(
        data.user.id,
        data.user.email?.split('@')[0]
      );
      await loadExistingPet(data.user.id, activeHouseholdId);
      setAccountMessage(
        joinCode.trim()
          ? 'Signed in. Your invitation is ready to accept.'
          : 'Signed in. Your Pawso records are ready.'
      );
      setScreen(joinCode.trim() ? 'household' : 'pets');
    } catch (error) {
      logDevelopmentError('Sign in error:', error);
      setAccountError(
        error instanceof Error ? error.message : 'Could not sign in.'
      );
    } finally {
      setAccountBusy(false);
    }
  }

  async function requestPasswordReset() {
    if (!requireOnline(setAccountError)) return;
    try {
      setAccountBusy(true);
      setAccountError('');
      setAccountMessage('');

      const email = signInEmail.trim().toLowerCase();
      if (!email || !email.includes('@')) {
        throw new Error('Enter your Pawso email address first.');
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: Linking.createURL('auth/callback'),
      });

      if (error) throw error;
      setPasswordResetCooldown(60);
      setAccountMessage(
        'Password reset email sent. Open the link on this phone to return to Pawso.'
      );
    } catch (error) {
      logDevelopmentError('Password reset error:', error);
      setAccountError(
        error instanceof Error
          ? error.message
          : 'Could not send the password reset email.'
      );
    } finally {
      setAccountBusy(false);
    }
  }

  async function handleAuthCallback(url: string) {
    const inviteMatch = url.match(/\/invite\/([0-9a-f-]{36})/i);
    if (inviteMatch) {
      setJoinCode(inviteMatch[1]);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user && !session.user.is_anonymous) {
        setScreen('household');
      } else {
        setAccountMessage(
          'Invitation saved. Sign in or secure your account, then join the household.'
        );
        setScreen('account');
      }
      return;
    }

    if (!url.includes('/auth/callback')) return;

    try {
      const encodedParameters = url.includes('#')
        ? url.split('#')[1]
        : url.split('?')[1] ?? '';
      const parameters = new URLSearchParams(encodedParameters);
      const accessToken = parameters.get('access_token');
      const refreshToken = parameters.get('refresh_token');
      const type = parameters.get('type');

      if (!accessToken || !refreshToken) {
        throw new Error('The password recovery link is incomplete or expired.');
      }

      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) throw error;
      if (!data.user) throw new Error('Pawso could not restore the account.');

      clearPetScopedState();
      setHouseholdId(null);
      setHouseholdRole(null);
      setHouseholdMembers([]);
      setHouseholdInvitations([]);
      hydrateAccount(data.user);
      if (type === 'recovery') {
        setAccountRecoveryMode(true);
        setAccountMessage('Enter a new password for your Pawso account.');
        setScreen('account');
      } else {
        setOfflineAccessEnabledState(
          (await AsyncStorage.getItem(offlineAccessStorageKey(data.user.id))) === 'true'
        );
        const activeHouseholdId = await resolveActiveHousehold(
          data.user.id,
          data.user.email?.split('@')[0]
        );
        await loadExistingPet(data.user.id, activeHouseholdId);
        setAccountMessage('Email verified. Your Pawso records are ready.');
        setScreen('pets');
      }
    } catch (error) {
      logDevelopmentError('Auth callback error:', error);
      setAccountError(
        error instanceof Error
          ? error.message
          : 'Could not open the Pawso recovery link.'
      );
    }
  }

  async function completePasswordRecovery() {
    if (!requireOnline(setAccountError)) return;
    try {
      setAccountBusy(true);
      setAccountError('');
      setAccountMessage('');

      if (recoveryPassword.length < 8) {
        throw new Error('Use a password with at least 8 characters.');
      }

      const { data, error } = await supabase.auth.updateUser({
        password: recoveryPassword,
      });

      if (error) throw error;
      if (!data.user) throw new Error('Pawso could not update the password.');

      hydrateAccount(data.user);
      setOfflineAccessEnabledState(
        (await AsyncStorage.getItem(offlineAccessStorageKey(data.user.id))) === 'true'
      );
      setRecoveryPassword('');
      setAccountRecoveryMode(false);
      const activeHouseholdId = await resolveActiveHousehold(
        data.user.id,
        data.user.email?.split('@')[0]
      );
      await loadExistingPet(data.user.id, activeHouseholdId);
      setAccountMessage('Password updated. Your Pawso records are ready.');
      setScreen('pets');
    } catch (error) {
      logDevelopmentError('Complete password recovery error:', error);
      setAccountError(
        error instanceof Error
          ? error.message
          : 'Could not update the password.'
      );
    } finally {
      setAccountBusy(false);
    }
  }

  async function secureAccount() {
    if (!requireOnline(setAccountError)) return;
    try {
      setAccountBusy(true);
      setAccountError('');
      setAccountMessage('');

      const email = secureAccountEmail.trim().toLowerCase();
      const password = secureAccountPassword;

      if (!email || !email.includes('@')) {
        throw new Error('Enter a valid email address.');
      }

      if (password.length < 8) {
        throw new Error('Use a password with at least 8 characters.');
      }

      const {
        data: { user: currentUser },
        error: currentUserError,
      } = await supabase.auth.getUser();

      if (currentUserError) throw currentUserError;
      if (!currentUser) throw new Error('No active Pawso user was found.');

      const originalUserId = currentUser.id;

      const { data, error } = await supabase.auth.updateUser({
        email,
        password,
      }, {
        emailRedirectTo: Linking.createURL('auth/callback'),
      });

      if (error) throw error;
      if (!data.user) throw new Error('Pawso could not update the account.');

      if (data.user.id !== originalUserId) {
        throw new Error('Account upgrade returned an unexpected user ID.');
      }

      hydrateAccount(data.user);
      setSecureAccountPassword('');

      if (data.user.email_confirmed_at) {
        setAccountMessage('Your Pawso account is secured.');
      } else {
        setAccountMessage(
          'Account details saved. Check your email if Supabase asks you to verify the address.'
        );
      }
    } catch (error) {
      logDevelopmentError('Secure account error:', error);
      setAccountError(
        error instanceof Error
          ? error.message
          : 'Could not secure your Pawso account.'
      );
    } finally {
      setAccountBusy(false);
    }
  }

  async function resetAiProcessingConsent() {
    try {
      setAccountError('');
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) throw error;
      if (!user) throw new Error('Pawso session is not ready.');

      await AsyncStorage.removeItem(aiConsentStorageKey(user.id));
      const message = 'Pawso will ask again before sending another file to AI.';
      setAccountMessage(message);
      Alert.alert('AI consent reset', message);
    } catch (error) {
      setAccountError(
        error instanceof Error ? error.message : 'Could not reset AI consent.'
      );
    }
  }

  async function deleteAccount() {
    if (!requireOnline(setAccountError)) return;
    try {
      setAccountBusy(true);
      setAccountError('');
      setAccountMessage('');

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      const response = await fetch(`${API_BASE_URL}/api/v1/account`, {
        method: 'DELETE',
        headers: await getApiAuthHeaders(),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(getApiErrorMessage(body, 'Could not delete your Pawso account.'));
      }

      if (currentUser) {
        await AsyncStorage.multiRemove([
          activeHouseholdStorageKey(currentUser.id),
          aiConsentStorageKey(currentUser.id),
          offlineAccessStorageKey(currentUser.id),
        ]);
        await clearUserSnapshots(currentUser.id);
      }
      await supabase.auth.signOut({ scope: 'local' });
      await setLocalReminderPreference(false);
      await clearPawsoLocalNotifications();
      resetUserScopedState();
      await prepareAnonymousWorkspace();
      setScreen('welcome');
      setAccountMessage('Account deleted. A new temporary workspace is ready.');
    } catch (error) {
      logDevelopmentError('Delete account error:', error);
      setAccountError(
        error instanceof Error ? error.message : 'Could not delete your Pawso account.'
      );
    } finally {
      setAccountBusy(false);
    }
  }

  async function signOutAccount() {
    if (!requireOnline(setAccountError)) return;
    try {
      setAccountBusy(true);
      setAccountError('');
      setAccountMessage('');

      if (accountIsAnonymous) {
        throw new Error(
          'Secure the anonymous account before signing out so you do not lose access to its pet records.'
        );
      }

      const { data: { session } } = await supabase.auth.getSession();
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) throw error;

      if (session?.user) await clearUserSnapshots(session.user.id);
      await setLocalReminderPreference(false);
      await clearPawsoLocalNotifications();
      resetUserScopedState();
      await prepareAnonymousWorkspace();
      setScreen('welcome');
      setAccountMessage('Signed out.');
    } catch (error) {
      logDevelopmentError('Sign out error:', error);
      setAccountError(
        error instanceof Error ? error.message : 'Could not sign out.'
      );
    } finally {
      setAccountBusy(false);
    }
  }

  async function initializeSupabase() {
    try {
      setAuthError('');

      if (SUPABASE_CONFIGURATION_ERROR) {
        throw new Error(
          `${SUPABASE_CONFIGURATION_ERROR} Add the required EAS environment variables and rebuild the app.`
        );
      }

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      let activeSession = session;

      if (!activeSession) {
        const { data, error } = await supabase.auth.signInAnonymously();

        if (error) {
          throw error;
        }

        activeSession = data.session;
      }

      if (!activeSession?.user) {
        throw new Error('Could not create a Pawso session.');
      }

      hydrateAccount(activeSession.user);
      const offlinePreference =
        (await AsyncStorage.getItem(
          offlineAccessStorageKey(activeSession.user.id)
        )) === 'true';
      setOfflineAccessEnabledState(offlinePreference);
      const activeHouseholdId = await resolveActiveHousehold(
        activeSession.user.id,
        activeSession.user.email?.split('@')[0]
      );
      await loadExistingPet(activeSession.user.id, activeHouseholdId);
    } catch (error) {
      logDevelopmentError('Supabase initialization error:', error);
      const { data: { session } } = await supabase.auth.getSession();
      const offlinePreference = session?.user
        ? (await AsyncStorage.getItem(
            offlineAccessStorageKey(session.user.id)
          ).catch(() => null)) === 'true'
        : false;
      setOfflineAccessEnabledState(offlinePreference);
      const snapshot = session?.user && offlinePreference
        ? await loadLatestPetSnapshot(session.user.id).catch(() => null)
        : null;
      if (snapshot) {
        hydrateAccount(session?.user);
        restoreOfflineSnapshot(snapshot);
        setIsOnline(false);
        setAuthError('Offline read-only mode · showing the last saved Pawso snapshot.');
        setScreen('today');
      } else {
        setAuthError(
          error instanceof Error
            ? error.message
            : 'Could not connect Pawso to its database.'
        );
      }
    } finally {
      setAuthReady(true);
    }
  }

  function restoreOfflineSnapshot(snapshot: {
    householdId: string;
    petId: string;
    savedAt: string;
    payload: Record<string, unknown>;
  }) {
    const payload = snapshot.payload as any;
    setHouseholdId(snapshot.householdId);
    setHouseholdName(payload.householdName ?? 'Pawso household');
    setHouseholdTimeZone(payload.householdTimeZone ?? 'UTC');
    setHouseholdRole(payload.householdRole ?? null);
    setHouseholdMembers(payload.householdMembers ?? []);
    setPets(payload.pets ?? []);
    if (payload.pet) hydratePet(payload.pet as PetSummary);
    setTimelineEvents(payload.timelineEvents ?? []);
    setPetDocuments(payload.petDocuments ?? []);
    setMedicationList(payload.medicationList ?? []);
    setMedicationSchedules(payload.medicationSchedules ?? []);
    setMedicationLogs(payload.medicationLogs ?? []);
    setMedicationHistoryLogs(payload.medicationHistoryLogs ?? []);
    setCareTasks(payload.careTasks ?? []);
    setTaskCompletions(payload.taskCompletions ?? []);
    setSymptomEntries(payload.symptomEntries ?? []);
    setLabResults(payload.labResults ?? []);
    setOfflineSnapshotAt(snapshot.savedAt);
  }

  function hydratePet(data: PetSummary) {
    const photoRequestId = ++petPhotoRequestRef.current;
    setCurrentPetId(data.id);
    setPetName(data.name ?? '');
    setPetType((data.species as PetType) ?? null);
    setBreed(data.breed ?? '');
    setPetAge(data.approximate_age ?? '');
    setPetDateOfBirth(data.date_of_birth ?? '');
    setPetSex((data.sex as PetSex) ?? null);

    if (data.spayed_neutered === true) {
      setAlteredStatus('yes');
    } else if (data.spayed_neutered === false) {
      setAlteredStatus('no');
    } else {
      setAlteredStatus(null);
    }

    setWeight(
      data.weight_kg !== null && data.weight_kg !== undefined
        ? `${data.weight_kg} kg`
        : ''
    );
    setMicrochip(data.microchip_number ?? '');
    setConditions(data.conditions ?? '');
    setAllergies(data.allergies ?? '');
    setMedications(data.medications ?? '');
    setVetClinic(data.vet_clinic ?? '');
    setPetPhotoPath(data.photo_path ?? null);
    setPetPhotoUrl(data.photo_url ?? null);
    if (data.photo_path && !data.photo_url) {
      createPetPhotoUrl(data.photo_path)
        .then((url) => {
          if (petPhotoRequestRef.current === photoRequestId) setPetPhotoUrl(url);
        })
        .catch(() => {
          if (petPhotoRequestRef.current === photoRequestId) setPetPhotoUrl(null);
        });
    }
    setEmergencyNotes(data.emergency_notes ?? '');
    setEmergencyContactName(data.emergency_contact_name ?? '');
    setEmergencyContactPhone(data.emergency_contact_phone ?? '');
  }

  function clearPetScopedState() {
    setCurrentPetId(null);
    setPets([]);
    setArchivedPets([]);
    setAllPetsToday([]);
    setPetName('');
    setPetType(null);
    setBreed('');
    setPetAge('');
    setPetDateOfBirth('');
    setPetSex(null);
    setAlteredStatus(null);
    setWeight('');
    setMicrochip('');
    setConditions('');
    setAllergies('');
    setMedications('');
    setVetClinic('');
    setPetPhotoPath(null);
    setPetPhotoUrl(null);
    setEmergencyNotes('');
    setEmergencyContactName('');
    setEmergencyContactPhone('');
    setTimelineEvents([]);
    setPetDocuments([]);
    setArchivedPetDocuments([]);
    setMedicationList([]);
    setMedicationSchedules([]);
    setMedicationLogs([]);
    setMedicationHistoryLogs([]);
    setCareTasks([]);
    setTaskCompletions([]);
    setAskAnswer(null);
    setAskSources([]);
    setVetVisitPrep(null);
    setSmartCareSuggestions([]);
    setSmartCareSources([]);
    setNewMedicationName('');
    setNewMedicationDose('');
    setNewMedicationUnit('');
    setNewMedicationInstructions('');
    setNewMedicationTimes(['08:00']);
    setEditingMedicationId(null);
    setNewMedicationStartDate('');
    setNewMedicationEndDate('');
    setNewMedicationRefills('');
    setNewMedicationRefillDate('');
    setNewMedicationPaused(false);
    setNewCareTitle('');
    setNewCareNotes('');
    setNewCareDate('');
    setNewCareTime('09:00');
    setNewCareFrequency('none');
    setNewCareInterval('1');
    setNewCareEndsOn('');
    setCheckInDate(formatLocalDateInput());
    setCheckInTitle('');
    setCheckInDetails('');
    setCheckInWeight('');
    setSymptomEntries([]);
    setLabResults([]);
    setUploadError('');
    setCheckInError('');
  }

  function clearLoadedPetRecords() {
    setTimelineEvents([]);
    setPetDocuments([]);
    setArchivedPetDocuments([]);
    setDocumentName('');
    setDocumentSize(null);
    setDocumentContentType('');
    setCurrentDocumentId(null);
    setCurrentExtractionId(null);
    setOpeningDocumentId(null);
    setVisitDate('');
    setClinic('');
    setFinding('');
    setDiagnosis('');
    setDiagnosisCertainty('unknown');
    setFollowUp('');
    setExtractedMedications([]);
    setExtractionWarnings([]);
    setExtractionModel('');
    setExtractionPromptVersion('');
    setMedicationList([]);
    setMedicationSchedules([]);
    setMedicationLogs([]);
    setMedicationHistoryLogs([]);
    setCareTasks([]);
    setTaskCompletions([]);
    setSymptomEntries([]);
    setLabResults([]);
    setAskQuestion('');
    setAskAnswer(null);
    setAskSources([]);
    setVisitReason('');
    setVisitChanges('');
    setVetVisitPrep(null);
    setVetVisitPrepError('');
    setSmartCareSuggestions([]);
    setSmartCareSources([]);
    setSmartCareError('');
    setNewMedicationName('');
    setNewMedicationDose('');
    setNewMedicationUnit('');
    setNewMedicationInstructions('');
    setNewMedicationTimes(['08:00']);
    setEditingMedicationId(null);
    setNewMedicationStartDate('');
    setNewMedicationEndDate('');
    setNewMedicationRefills('');
    setNewMedicationRefillDate('');
    setNewMedicationPaused(false);
    setNewCareTitle('');
    setNewCareNotes('');
    setNewCareDate('');
    setNewCareTime('09:00');
    setNewCareFrequency('none');
    setNewCareInterval('1');
    setNewCareEndsOn('');
    setCheckInDate(formatLocalDateInput());
    setCheckInTitle('');
    setCheckInDetails('');
    setCheckInWeight('');
    setUploadError('');
    setAskError('');
    setCheckInError('');
    setDocumentsError('');
    setMedicationsError('');
    setCareError('');
  }

  async function loadPets(userId: string, targetHouseholdId?: string | null) {
    const activeHouseholdId =
      targetHouseholdId ?? householdId ?? (await ensureHousehold());

    const { data, error } = await supabase
      .from('pets')
      .select(PET_SELECT)
      .eq('household_id', activeHouseholdId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const allRows = await Promise.all(
      ((data ?? []) as unknown as PetSummary[]).map(async (pet) => ({
        ...pet,
        photo_url: pet.photo_path
          ? await createPetPhotoUrl(pet.photo_path).catch(() => null)
          : null,
      }))
    );
    const rows = allRows.filter((pet) => !pet.archived_at);
    setArchivedPets(allRows.filter((pet) => Boolean(pet.archived_at)));
    setPets(rows);
    return rows;
  }

  async function refreshAllPetsToday(petRows?: PetSummary[]) {
    try {
      const rows = petRows ?? pets;
      if (rows.length === 0) {
        setAllPetsToday([]);
        return;
      }

      const petIds = rows.map((pet) => pet.id);
      const now = new Date();
      const bounds = getDayBoundsInTimeZone(now, householdTimeZone);
      const start = bounds.start ?? new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const end = bounds.end ?? new Date(start.getTime() + 86400000);
      const dateValue = bounds.dateValue;

      const [
        { data: careRows, error: careErrorValue },
        { data: medicationRows, error: medicationErrorValue },
      ] = await Promise.all([
        supabase
          .from('care_tasks')
          .select('id, pet_id, due_at, is_active, paused_at')
          .in('pet_id', petIds)
          .eq('is_active', true)
          .lt('due_at', end.toISOString()),
        supabase
          .from('medications')
          .select('id, pet_id, is_active, paused_at, start_date, end_date')
          .in('pet_id', petIds)
          .eq('is_active', true),
      ]);

      if (careErrorValue) throw careErrorValue;
      if (medicationErrorValue) throw medicationErrorValue;

      const activeMedicationRows = (medicationRows ?? []).filter(
        (item) =>
          !item.paused_at &&
          (!item.start_date || item.start_date <= dateValue) &&
          (!item.end_date || item.end_date >= dateValue)
      );
      const medicationIds = activeMedicationRows.map((item) => item.id);
      let scheduleRows: {
        id: string;
        medication_id: string;
        pet_id: string;
        time_of_day: string;
        snoozed_until: string | null;
      }[] = [];
      let logRows: { schedule_id: string | null; pet_id: string; status: string }[] = [];

      if (medicationIds.length > 0) {
        const [
          { data: schedules, error: schedulesError },
          { data: logs, error: logsError },
        ] = await Promise.all([
          supabase
            .from('medication_schedules')
            .select('id, medication_id, pet_id, time_of_day, snoozed_until')
            .in('medication_id', medicationIds),
          supabase
            .from('medication_logs')
            .select('schedule_id, pet_id, status')
            .in('pet_id', petIds)
            .gte('scheduled_for', start.toISOString())
            .lt('scheduled_for', end.toISOString()),
        ]);

        if (schedulesError) throw schedulesError;
        if (logsError) throw logsError;
        scheduleRows = schedules ?? [];
        logRows = logs ?? [];
      }

      const medicationPetById = new Map(
        activeMedicationRows.map((item) => [item.id, item.pet_id])
      );
      const completedScheduleIds = new Set(
        logRows
          .filter((log) => log.schedule_id)
          .map((log) => log.schedule_id as string)
      );

      const summaries: PetTodaySummary[] = rows.map((pet) => {
        const petCare = (careRows ?? []).filter(
          (task) => task.pet_id === pet.id && !task.paused_at
        );
        const dueCare = petCare.filter((task) => {
          const due = new Date(task.due_at);
          return due >= start && due < end;
        });
        const overdueCare = petCare.filter(
          (task) => new Date(task.due_at).getTime() < now.getTime()
        );

        const petSchedules = scheduleRows.filter(
          (schedule) => medicationPetById.get(schedule.medication_id) === pet.id
        );
        const pendingSchedules = petSchedules.filter(
          (schedule) => !completedScheduleIds.has(schedule.id)
        );
        const overdueMedication = pendingSchedules.filter((schedule) => {
          const snoozed = schedule.snoozed_until
            ? new Date(schedule.snoozed_until)
            : null;
          const scheduled =
            snoozed && !Number.isNaN(snoozed.getTime()) && snoozed > now
              ? snoozed
              : parseDateTimeInTimeZone(
                  dateValue,
                  schedule.time_of_day.slice(0, 5),
                  householdTimeZone
                );
          return Boolean(
            scheduled && scheduled.getTime() < now.getTime() - 30 * 60 * 1000
          );
        });

        return {
          pet_id: pet.id,
          name: pet.name,
          species: pet.species,
          care_due_today: dueCare.length,
          medication_doses_today: petSchedules.length,
          medication_doses_pending: pendingSchedules.length,
          overdue_count: overdueCare.length + overdueMedication.length,
        };
      });

      setAllPetsToday(summaries);
    } catch (error) {
      logDevelopmentError('Load all pets Today summary error:', error);
    }
  }

  async function selectPet(petId: string, destination?: Screen) {
    try {
      setDatabaseError('');

      if (!isOnline && accountUserId) {
        const cachedPet = pets.find((item) => item.id === petId);
        const cachedHouseholdId = cachedPet?.household_id ?? householdId;
        if (!cachedHouseholdId) {
          throw new Error('This pet is not available in the offline snapshot.');
        }
        const snapshot = await loadPetSnapshot(
          accountUserId,
          cachedHouseholdId,
          petId
        );
        if (!snapshot) {
          throw new Error(
            'This pet has no offline snapshot yet. Reconnect and open the pet once.'
          );
        }
        restoreOfflineSnapshot(snapshot);
        if (destination) setScreen(destination);
        return true;
      }

      let pet = pets.find((item) => item.id === petId);

      if (!pet) {
        const { data, error } = await supabase
          .from('pets')
          .select(PET_SELECT)
          .eq('id', petId)
          .is('archived_at', null)
          .single();

        if (error) throw error;
        pet = data as unknown as PetSummary;
      }

      if (currentPetId !== pet.id) clearLoadedPetRecords();
      hydratePet(pet);
      setAskAnswer(null);
      setAskSources([]);
      setAskError('');

      await Promise.all([
        loadTimeline(pet.id),
        loadMedicationData(pet.id),
        loadCareData(pet.id),
        loadHealthData(pet.id),
      ]);

      if (destination) setScreen(destination);
      return true;
    } catch (error) {
      logDevelopmentError('Select pet error:', error);
      setDatabaseError(
        error instanceof Error ? error.message : 'Could not switch pets.'
      );
      return false;
    }
  }

  selectPetRef.current = selectPet;

  function startAddPet() {
    if (!canManageMedical) {
      setDatabaseError('Only the household owner can add a pet.');
      return;
    }

    setIsEditingPet(false);
    setPetName('');
    setPetType(null);
    setBreed('');
    setPetAge('');
    setPetDateOfBirth('');
    setPetSex(null);
    setAlteredStatus(null);
    setWeight('');
    setMicrochip('');
    setConditions('');
    setAllergies('');
    setMedications('');
    setVetClinic('');
    setPetPhotoPath(null);
    setPetPhotoUrl(null);
    setEmergencyNotes('');
    setEmergencyContactName('');
    setEmergencyContactPhone('');
    setDatabaseError('');
    setScreen('addPet');
  }

  function startEditPet() {
    if (!currentPetId || !canManageMedical) return;
    setIsEditingPet(true);
    setDatabaseError('');
    setScreen('addPet');
  }

  async function cancelAddPet() {
    if (currentPetId && pets.some((pet) => pet.id === currentPetId)) {
      await selectPet(currentPetId, 'pets');
      return;
    }

    if (pets.length > 0) {
      await selectPet(pets[0].id, 'pets');
      return;
    }

    setScreen('welcome');
  }

  async function loadExistingPet(userId: string, targetHouseholdId?: string | null) {
    const activeHouseholdId =
      targetHouseholdId ?? householdId ?? (await ensureHousehold());

    setHouseholdId(activeHouseholdId);
    await loadHousehold(activeHouseholdId);

    const rows = await loadPets(userId, activeHouseholdId);

    if (rows.length === 0) {
      clearPetScopedState();
      setTodayView('pet');
      return;
    }

    const selected =
      rows.find((pet) => pet.id === currentPetId) ??
      rows[0];

    if (currentPetId !== selected.id) clearLoadedPetRecords();
    hydratePet(selected);

    await Promise.all([
      loadTimeline(selected.id),
      loadMedicationData(selected.id),
      loadCareData(selected.id),
      loadHealthData(selected.id),
      refreshAllPetsToday(rows),
    ]);

    await refreshNotificationState(rows);

    setTodayView(rows.length > 1 ? 'all' : 'pet');
    setScreen('today');
  }

  async function loadTimeline(petId: string) {
    const { data, error } = await supabase
      .from('medical_events')
      .select(
        'id, event_type, event_date, title, description, source_type, created_at'
      )
      .eq('pet_id', petId)
      .order('event_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const events: TimelineEvent[] = (data ?? []).map((event) => ({
      id: event.id,
      date:
        event.event_date ||
        (event.created_at
          ? new Date(event.created_at).toLocaleDateString()
          : 'Date not found'),
      type:
        event.event_type === 'follow_up'
          ? 'Follow-up'
          : event.event_type === 'vet_visit'
          ? 'Veterinary visit'
          : event.event_type === 'owner_symptom'
          ? 'Owner observation'
          : event.event_type === 'weight'
          ? 'Weight'
          : event.event_type === 'lab_result'
          ? 'Lab result'
          : event.event_type || 'Health event',
      title: event.title || 'Health event',
      detail: event.description || '',
      source:
        event.source_type === 'veterinary_record'
          ? 'Veterinary record'
          : event.source_type === 'owner_note'
          ? 'Owner note'
          : 'Pawso',
    }));

    setTimelineEvents(events);
  }

  async function askPawso(questionOverride?: string) {
    if (!requireOnline(setAskError)) return;
    if (!currentPetId) return;

    const question = (questionOverride ?? askQuestion).trim();
    if (!question) return;

    try {
      setAskLoading(true);
      setAskError('');
      setAskAnswer(null);

      const sources: AskSource[] = [];

      for (const event of timelineEvents) {
        sources.push({
          id: `event:${event.id}`,
          label: event.title,
          source_type: event.source,
          date: event.date,
          text: `${event.type}. ${event.title}. ${event.detail}`.trim(),
        });
      }

      for (const medication of medicationList) {
        const scheduleTimes = medicationSchedules
          .filter((schedule) => schedule.medication_id === medication.id)
          .map((schedule) => schedule.time_of_day)
          .join(', ');

        sources.push({
          id: `medication:${medication.id}`,
          label: medication.name,
          source_type: 'Confirmed medication record',
          text: medicationSourceText(medication, scheduleTimes),
        });
      }

      for (const task of careTasks.filter(
        (item) =>
          item.is_active ||
          taskCompletions.some((completion) => completion.task_id === item.id)
      )) {
        const completion = taskCompletions.find(
          (item) => item.task_id === task.id
        );
        sources.push({
          id: `care:${task.id}`,
          label: task.title,
          source_type: completion ? 'Completed care task' : 'Active care task',
          date: completion?.completed_at ?? task.due_at,
          text: [
            task.title,
            task.notes,
            `Due: ${new Date(task.due_at).toLocaleString()}`,
            completion
              ? `Completed: ${new Date(completion.completed_at).toLocaleString()}${
                  completion.actor_name ? ` by ${completion.actor_name}` : ''
                }`
              : 'Status: active',
          ]
            .filter(Boolean)
            .join(' · '),
        });
      }

      const safeSources = sources.map(sanitizeAskSource);
      setAskSources(safeSources);

      const response = await fetch(`${API_BASE_URL}/api/v1/ask`, {
        method: 'POST',
        headers: await getApiAuthHeaders('application/json'),
        body: JSON.stringify({
          pet: {
            id: currentPetId,
            name: petName,
            species: petType,
            breed: breed || null,
            conditions: conditions || null,
            allergies: allergies || null,
          },
          question,
          sources: safeSources,
        }),
      });

      const body = await response.json();

      if (!response.ok) {
        throw new Error(getApiErrorMessage(body, `Ask Pawso request failed (${response.status}).`));
      }

      setAskQuestion(question);
      setAskAnswer(body as AskAnswer);
    } catch (error) {
      logDevelopmentError('Ask Pawso error:', error);
      setAskError(
        error instanceof Error ? error.message : 'Pawso could not answer right now.'
      );
    } finally {
      setAskLoading(false);
    }
  }

  function openAskScreen() {
    setAskError('');
    setScreen('ask');
  }

  function getAskSourceLabel(sourceId: string) {
    const source = askSources.find((item) => item.id === sourceId);
    if (!source) return sourceId;

    const dateLabel = source.date
      ? ` · ${new Date(source.date).toLocaleDateString()}`
      : '';

    return `${source.label}${dateLabel}`;
  }

  async function generateVetVisitPrep() {
    if (!requireOnline(setVetVisitPrepError)) return;
    if (!currentPetId) return;

    try {
      setVetVisitPrepLoading(true);
      setVetVisitPrepError('');

      const sources: AskSource[] = timelineEvents.map((event) => ({
        id: `event:${event.id}`,
        label: event.title,
        source_type: event.source,
        date: event.date,
        text: `${event.type}. ${event.title}. ${event.detail}`.trim(),
      }));

      for (const medication of medicationList) {
        const scheduleTimes = medicationSchedules
          .filter((schedule) => schedule.medication_id === medication.id)
          .map((schedule) => schedule.time_of_day)
          .join(', ');

        sources.push({
          id: `medication:${medication.id}`,
          label: medication.name,
          source_type: 'Confirmed medication record',
          text: medicationSourceText(medication, scheduleTimes),
        });
      }

      for (const task of careTasks.filter(
        (item) =>
          item.is_active ||
          taskCompletions.some((completion) => completion.task_id === item.id)
      )) {
        const completion = taskCompletions.find(
          (item) => item.task_id === task.id
        );
        sources.push({
          id: `care:${task.id}`,
          label: task.title,
          source_type: completion ? 'Completed care task' : 'Active care task',
          date: completion?.completed_at ?? task.due_at,
          text: [
            task.title,
            task.notes,
            `Due: ${new Date(task.due_at).toLocaleString()}`,
            completion
              ? `Completed: ${new Date(completion.completed_at).toLocaleString()}${
                  completion.actor_name ? ` by ${completion.actor_name}` : ''
                }`
              : 'Status: active',
          ]
            .filter(Boolean)
            .join(' · '),
        });
      }

      const safeSources = sources.map(sanitizeAskSource);
      const response = await fetch(`${API_BASE_URL}/api/v1/vet-visit-prep`, {
        method: 'POST',
        headers: await getApiAuthHeaders('application/json'),
        body: JSON.stringify({
          pet: {
            id: currentPetId,
            name: petName,
            species: petType,
            breed: breed || null,
            conditions: conditions || null,
            allergies: allergies || null,
          },
          reason_for_visit: visitReason.trim() || null,
          recent_changes: visitChanges.trim() || null,
          sources: safeSources,
        }),
      });

      const body = await response.json();
      if (!response.ok) {
        throw new Error(getApiErrorMessage(body, `Vet Visit Prep request failed (${response.status}).`));
      }

      setVetVisitPrep(body as VetVisitPrep);
    } catch (error) {
      logDevelopmentError('Vet Visit Prep error:', error);
      setVetVisitPrepError(
        error instanceof Error ? error.message : 'Pawso could not prepare the visit right now.'
      );
    } finally {
      setVetVisitPrepLoading(false);
    }
  }

  function openVetVisitPrep() {
    setVetVisitPrepError('');
    setScreen('vetVisitPrep');
  }

  async function loadHealthData(petId: string) {
    try {
      setHealthDataLoading(true);
      setHealthDataError('');
      const [symptomsResult, labsResult] = await Promise.all([
        supabase
          .from('symptom_entries')
          .select(
            'id, pet_id, observed_on, category, severity, frequency, duration_minutes, notes, created_at'
          )
          .eq('pet_id', petId)
          .order('observed_on', { ascending: false })
          .limit(250),
        supabase
          .from('lab_results')
          .select(
            'id, pet_id, document_id, collected_on, test_name, numeric_value, text_value, unit, reference_low, reference_high, reference_text, notes, created_at'
          )
          .eq('pet_id', petId)
          .order('collected_on', { ascending: false })
          .limit(250),
      ]);
      if (symptomsResult.error) throw symptomsResult.error;
      if (labsResult.error) throw labsResult.error;
      setSymptomEntries((symptomsResult.data ?? []) as SymptomEntry[]);
      setLabResults((labsResult.data ?? []) as LabResult[]);
    } catch (error) {
      setHealthDataError(
        error instanceof Error ? error.message : 'Could not load health trends.'
      );
    } finally {
      setHealthDataLoading(false);
    }
  }

  async function openHealthTrends() {
    if (!currentPetId) return;
    await loadHealthData(currentPetId);
    setNewLabDate(formatDateInputInTimeZone(new Date(), householdTimeZone));
    setScreen('healthTrends');
  }

  function openHealthCheckIn(type: 'symptom' | 'weight') {
    setCheckInType(type);
    setCheckInDate(formatDateInputInTimeZone(new Date(), householdTimeZone));
    setCheckInTitle('');
    setCheckInDetails('');
    setCheckInWeight('');
    setSymptomSeverity(3);
    setSymptomFrequency('single');
    setSymptomDuration('');
    setCheckInError('');
    setScreen('healthCheckIn');
  }

  async function saveHealthCheckIn() {
    if (!requireOnline(setCheckInError)) return;
    if (!currentPetId) return;

    if (!isValidLocalDate(checkInDate)) {
      setCheckInError('Enter a real date as YYYY-MM-DD.');
      return;
    }
    if (checkInDate > formatDateInputInTimeZone(new Date(), householdTimeZone)) {
      setCheckInError('A health check-in date cannot be in the future.');
      return;
    }

    const weightValue = Number(checkInWeight.trim());
    if (checkInType === 'symptom' && !checkInTitle.trim()) {
      setCheckInError('Add a short symptom or observation.');
      return;
    }
    if (checkInType === 'weight' && (!Number.isFinite(weightValue) || weightValue <= 0)) {
      setCheckInError('Enter a valid weight in kilograms.');
      return;
    }
    if (checkInType === 'weight' && weightValue > 999999.99) {
      setCheckInError('That weight is outside Pawso’s supported range.');
      return;
    }

    try {
      setCheckInSaving(true);
      setCheckInError('');

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session?.user) throw new Error('Pawso session is not ready. Please try again.');

      if (checkInType === 'weight') {
        const { error: weightError } = await supabase.rpc(
          'record_weight_check_in',
          {
            target_pet: currentPetId,
            target_date: checkInDate.trim(),
            target_weight: weightValue,
            target_notes: checkInDetails.trim() || null,
          }
        );
        if (weightError) throw weightError;

        setWeight(`${weightValue} kg`);
        setPets((current) => current.map((pet) =>
          pet.id === currentPetId ? { ...pet, weight_kg: weightValue } : pet
        ));
      } else {
        const duration = symptomDuration.trim() ? Number(symptomDuration.trim()) : null;
        if (
          duration !== null &&
          (!Number.isInteger(duration) || duration <= 0 || duration > 525600)
        ) {
          throw new Error('Duration must be a whole number from 1 to 525600 minutes.');
        }
        const { error: insertError } = await supabase.rpc('record_structured_symptom', {
          target_pet: currentPetId,
          target_date: checkInDate.trim(),
          target_category: checkInTitle.trim(),
          target_severity: symptomSeverity,
          target_frequency: symptomFrequency,
          target_duration_minutes: duration,
          target_notes: checkInDetails.trim() || null,
        });
        if (insertError) throw insertError;
      }

      await Promise.all([loadTimeline(currentPetId), loadHealthData(currentPetId)]);
      setScreen(checkInType === 'symptom' ? 'healthTrends' : 'timeline');
    } catch (error) {
      logDevelopmentError('Health Check-In error:', error);
      setCheckInError(
        error instanceof Error ? error.message : 'Could not save this check-in.'
      );
    } finally {
      setCheckInSaving(false);
    }
  }

  async function saveLabResult() {
    if (!requireOnline(setHealthDataError)) return;
    if (!currentPetId) return;
    try {
      setHealthDataSaving(true);
      setHealthDataError('');
      if (!isValidLocalDate(newLabDate)) throw new Error('Use YYYY-MM-DD for the lab date.');
      if (newLabDate > formatDateInputInTimeZone(new Date(), householdTimeZone)) {
        throw new Error('A lab result date cannot be in the future.');
      }
      if (!newLabTest.trim()) throw new Error('Enter the lab test name.');
      const value = Number(newLabValue.trim().replace(',', '.'));
      if (!Number.isFinite(value)) throw new Error('Enter a numeric lab value.');
      const low = newLabLow.trim() ? Number(newLabLow.trim().replace(',', '.')) : null;
      const high = newLabHigh.trim() ? Number(newLabHigh.trim().replace(',', '.')) : null;
      if (low !== null && !Number.isFinite(low)) throw new Error('Reference low is invalid.');
      if (high !== null && !Number.isFinite(high)) throw new Error('Reference high is invalid.');
      if ([value, low, high].some((item) => item !== null && Math.abs(item) > 1_000_000_000_000)) {
        throw new Error('A laboratory value is outside Pawso’s supported range.');
      }
      if (low !== null && high !== null && high < low) {
        throw new Error('Reference high cannot be below reference low.');
      }
      const { error } = await supabase.rpc('record_lab_result_entry', {
        target_pet: currentPetId,
        target_date: newLabDate,
        target_test_name: newLabTest.trim(),
        target_numeric_value: value,
        target_text_value: null,
        target_unit: newLabUnit.trim() || null,
        target_reference_low: low,
        target_reference_high: high,
        target_reference_text: null,
        target_notes: newLabNotes.trim() || null,
        target_document: null,
      });
      if (error) throw error;
      setNewLabTest('');
      setNewLabValue('');
      setNewLabUnit('');
      setNewLabLow('');
      setNewLabHigh('');
      setNewLabNotes('');
      await Promise.all([loadHealthData(currentPetId), loadTimeline(currentPetId)]);
    } catch (error) {
      setHealthDataError(
        error instanceof Error ? error.message : 'Could not save this lab result.'
      );
    } finally {
      setHealthDataSaving(false);
    }
  }

  function openSmartCarePlan() {
    setSmartCareError('');
    setScreen('smartCarePlan');
  }

  async function generateSmartCarePlan() {
    if (!requireOnline(setSmartCareError)) return;
    if (!currentPetId) return;
    try {
      setSmartCareLoading(true);
      setSmartCareError('');
      const sources: AskSource[] = timelineEvents.map((event) => ({
        id: `event:${event.id}`,
        label: event.title,
        source_type: event.source,
        date: event.date,
        text: `${event.type}. ${event.title}. ${event.detail}`.trim(),
      }));

      for (const medication of medicationList.filter(
        (item) => medicationLifecycleStatus(item) === 'Current'
      )) {
        const times = medicationSchedules
          .filter((schedule) => schedule.medication_id === medication.id)
          .map((schedule) => schedule.time_of_day)
          .join(', ');
        sources.push({
          id: `medication:${medication.id}`,
          label: medication.name,
          source_type: 'Confirmed medication record',
          text: medicationSourceText(medication, times),
        });
      }

      for (const task of activeCareTasks) {
        sources.push({
          id: `care:${task.id}`,
          label: task.title,
          source_type: 'Existing care task',
          date: task.due_at,
          text: [task.title, task.notes, `Due: ${new Date(task.due_at).toLocaleString()}`].filter(Boolean).join(' · '),
        });
      }

      const safeSources = sources.map(sanitizeAskSource);
      setSmartCareSources(safeSources);
      const response = await fetch(`${API_BASE_URL}/api/v1/smart-care-plan`, {
        method: 'POST',
        headers: await getApiAuthHeaders('application/json'),
        body: JSON.stringify({
          pet: { id: currentPetId, name: petName, species: petType, breed: breed || null, conditions: conditions || null, allergies: allergies || null },
          sources: safeSources,
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(getApiErrorMessage(body, 'Smart Care Plan request failed.'));
      }
      setSmartCareSuggestions(body.suggestions as SmartCareSuggestion[]);
    } catch (error) {
      logDevelopmentError('Smart Care Plan error:', error);
      setSmartCareError(error instanceof Error ? error.message : 'Could not create care suggestions.');
    } finally {
      setSmartCareLoading(false);
    }
  }

  function acceptSmartCareSuggestion(suggestion: SmartCareSuggestion) {
    setNewCareTitle(suggestion.title);
    setNewCareNotes(`${suggestion.notes}\n\nPawso suggestion reason: ${suggestion.reason}`.trim());
    setNewCareDate('');
    setNewCareTime('09:00');
    setScreen('addCareTask');
  }

  function getSmartCareSourceLabel(sourceId: string) {
    const source = smartCareSources.find((item) => item.id === sourceId);
    return source ? `${source.label}${source.date ? ` · ${source.date}` : ''}` : sourceId;
  }

  async function loadCareData(petId: string) {
    try {
      setCareLoading(true);
      setCareError('');

      const { data: tasks, error: tasksError } = await supabase
        .from('care_tasks')
        .select(
          'id, title, notes, due_at, task_type, is_active, series_id, recurrence_frequency, recurrence_interval, recurrence_ends_on, occurrence_number, paused_at, snoozed_until'
        )
        .eq('pet_id', petId)
        .order('due_at', { ascending: true });

      if (tasksError) throw tasksError;

      const taskIds = (tasks ?? []).map((task) => task.id);
      let completions: TaskCompletion[] = [];

      if (taskIds.length > 0) {
        const { data: completionRows, error: completionError } = await supabase
          .from('task_completions')
          .select('id, task_id, completed_at, actor_name, outcome')
          .in('task_id', taskIds);

        if (completionError) throw completionError;
        completions = (completionRows ?? []) as TaskCompletion[];
      }

      setCareTasks((tasks ?? []) as CareTask[]);
      setTaskCompletions(completions);
    } catch (error) {
      logDevelopmentError('Load care data error:', error);
      setCareError(
        error instanceof Error ? error.message : 'Could not load care tasks.'
      );
    } finally {
      setCareLoading(false);
    }
  }

  function parseCareDateTime(dateValue: string, timeValue: string) {
    const date = dateValue.trim();
    const time = timeValue.trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error('Use YYYY-MM-DD for the care date.');
    }

    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
      throw new Error('Use HH:MM in 24-hour format for the care time.');
    }

    const value = parseDateTimeInTimeZone(date, time, householdTimeZone);

    if (!value) {
      throw new Error('The care date or time is invalid.');
    }

    return value;
  }

  async function openCareScreen() {
    if (!currentPetId) return;
    await loadCareData(currentPetId);
    setScreen('care');
  }

  async function createCareTask() {
    if (!requireOnline(setCareError)) return;
    if (!currentPetId || !newCareTitle.trim()) return;

    try {
      setSavingCareTask(true);
      setCareError('');

      const dueDate = parseCareDateTime(newCareDate, newCareTime);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;
      if (!session?.user) throw new Error('Pawso session is not ready.');

      const interval = Number(newCareInterval);
      if (!Number.isInteger(interval) || interval < 1 || interval > 52) {
        throw new Error('Repeat interval must be a whole number from 1 to 52.');
      }
      if (newCareEndsOn && !isValidLocalDate(newCareEndsOn)) {
        throw new Error('Repeat end date must use YYYY-MM-DD.');
      }
      if (
        newCareFrequency !== 'none' &&
        newCareEndsOn &&
        newCareEndsOn < newCareDate
      ) {
        throw new Error('Repeat end date cannot be before the first task.');
      }

      const { error } = await supabase.rpc('create_care_task_with_recurrence', {
        target_pet: currentPetId,
        target_title: newCareTitle.trim(),
        target_notes: newCareNotes.trim(),
        target_due_at: dueDate.toISOString(),
        target_frequency: newCareFrequency,
        target_interval: interval,
        target_ends_on:
          newCareFrequency === 'none' ? null : newCareEndsOn || null,
      });

      if (error) throw error;

      setNewCareTitle('');
      setNewCareNotes('');
      setNewCareDate('');
      setNewCareTime('09:00');
      setNewCareFrequency('none');
      setNewCareInterval('1');
      setNewCareEndsOn('');

      await loadCareData(currentPetId);
      await refreshAllPetsToday();
      await syncNotificationsIfEnabled();
      setScreen('care');
    } catch (error) {
      logDevelopmentError('Create care task error:', error);
      setCareError(
        error instanceof Error ? error.message : 'Could not save this care task.'
      );
    } finally {
      setSavingCareTask(false);
    }
  }

  async function completeCareTask(task: CareTask) {
    if (!requireOnline(setCareError)) return;
    if (!currentPetId) return;

    try {
      setCompletingTaskId(task.id);
      setCareError('');

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;
      if (!session?.user) throw new Error('Pawso session is not ready.');

      const actorName =
        householdMembers.find((member) => member.user_id === session.user.id)
          ?.display_name ??
        session.user.email?.split('@')[0] ??
        'Household member';

      const { error } = await supabase.rpc('complete_care_task', {
        target_task: task.id,
        actor_display_name: actorName,
      });

      if (error) throw error;

      await loadCareData(currentPetId);
      await refreshAllPetsToday();
      await syncNotificationsIfEnabled();
    } catch (error) {
      logDevelopmentError('Complete care task error:', error);
      setCareError(
        error instanceof Error ? error.message : 'Could not complete this care task.'
      );
    } finally {
      setCompletingTaskId(null);
    }
  }

  async function skipCareTask(task: CareTask) {
    if (!requireOnline(setCareError)) return;
    if (!currentPetId) return;
    try {
      setCompletingTaskId(task.id);
      setCareError('');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session?.user) throw new Error('Pawso session is not ready.');
      const actorName =
        householdMembers.find((member) => member.user_id === session.user.id)
          ?.display_name ?? session.user.email?.split('@')[0] ?? 'Household member';
      const { error } = await supabase.rpc('resolve_care_task', {
        target_task: task.id,
        actor_display_name: actorName,
        target_outcome: 'skipped',
      });
      if (error) throw error;
      await loadCareData(currentPetId);
      await refreshAllPetsToday();
      await syncNotificationsIfEnabled();
    } catch (error) {
      setCareError(error instanceof Error ? error.message : 'Could not skip this task.');
    } finally {
      setCompletingTaskId(null);
    }
  }

  async function setCareTaskState(
    task: CareTask,
    action: 'snooze' | 'pause' | 'resume' | 'end',
    snoozeUntil?: Date
  ) {
    if (!requireOnline(setCareError)) return;
    if (!currentPetId) return;
    try {
      setDeletingTaskId(task.id);
      setCareError('');
      const { error } = await supabase.rpc('set_care_task_state', {
        target_task: task.id,
        target_action: action,
        snooze_until: snoozeUntil?.toISOString() ?? null,
      });
      if (error) throw error;
      await loadCareData(currentPetId);
      await refreshAllPetsToday();
      await syncNotificationsIfEnabled();
    } catch (error) {
      setCareError(
        error instanceof Error ? error.message : 'Could not update this care schedule.'
      );
    } finally {
      setDeletingTaskId(null);
    }
  }

  async function deleteCareTask(task: CareTask) {
    if (!requireOnline(setCareError)) return;
    if (!currentPetId) return;

    try {
      setDeletingTaskId(task.id);
      setCareError('');

      const { error } = await supabase.rpc('set_care_task_state', {
        target_task: task.id,
        target_action: 'end',
        snooze_until: null,
      });

      if (error) throw error;

      await loadCareData(currentPetId);
      await refreshAllPetsToday();
      await syncNotificationsIfEnabled();
    } catch (error) {
      logDevelopmentError('Delete care task error:', error);
      setCareError(
        error instanceof Error ? error.message : 'Could not archive this care task.'
      );
    } finally {
      setDeletingTaskId(null);
    }
  }

  function formatDueLabel(value: string) {
    const due = new Date(value);
    const now = new Date();
    const todayValue = formatDateInputInTimeZone(now, householdTimeZone);
    const tomorrowValue = addDaysToDateInput(todayValue, 1);
    const dueValue = formatDateInputInTimeZone(due, householdTimeZone);

    const time = due.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: householdTimeZone,
    });

    if (due < now) {
      return `Overdue · ${due.toLocaleDateString([], {
        timeZone: householdTimeZone,
      })} ${time}`;
    }
    if (dueValue === todayValue) return `Today · ${time}`;
    if (dueValue === tomorrowValue) return `Tomorrow · ${time}`;

    return `${due.toLocaleDateString([], { timeZone: householdTimeZone })} · ${time}`;
  }

  function getMedicationUrgency(dose: TodayMedicationDose) {
    if (dose.log) return 'done';

    const now = new Date();
    const diffMinutes = (dose.scheduledFor.getTime() - now.getTime()) / 60000;

    if (diffMinutes < -30) return 'overdue';
    if (diffMinutes <= 60) return 'dueSoon';
    return 'later';
  }

  function medicationLifecycleStatus(medication: Medication) {
    const today = formatDateInputInTimeZone(new Date(), householdTimeZone);
    if (!medication.is_active) return 'Archived';
    if (medication.paused_at) return 'Paused';
    if (medication.start_date && medication.start_date > today) {
      return `Future course · starts ${medication.start_date}`;
    }
    if (medication.end_date && medication.end_date < today) {
      return `Ended ${medication.end_date}`;
    }
    return 'Current';
  }

  function medicationSourceText(medication: Medication, scheduleTimes: string) {
    return [
      medication.name,
      medication.dose,
      medication.unit,
      medication.instructions,
      `Status: ${medicationLifecycleStatus(medication)}`,
      medication.start_date ? `Start: ${medication.start_date}` : null,
      medication.end_date ? `End: ${medication.end_date}` : null,
      scheduleTimes ? `Schedule: ${scheduleTimes}` : null,
    ]
      .filter(Boolean)
      .join(' · ');
  }

  async function loadMedicationData(petId: string) {
    try {
      setMedicationsLoading(true);
      setMedicationsError('');

      const { data: meds, error: medsError } = await supabase
        .from('medications')
        .select(
          'id, name, dose, unit, instructions, is_active, start_date, end_date, refills_remaining, refill_due_date, paused_at'
        )
        .eq('pet_id', petId)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (medsError) throw medsError;

      const medicationIds = (meds ?? []).map((med) => med.id);

      let schedules: MedicationSchedule[] = [];
      let todayLogs: MedicationLog[] = [];

      if (medicationIds.length > 0) {
        const { data: scheduleRows, error: schedulesError } = await supabase
          .from('medication_schedules')
          .select('id, medication_id, time_of_day, snoozed_until')
          .in('medication_id', medicationIds)
          .order('time_of_day', { ascending: true });

        if (schedulesError) throw schedulesError;
        schedules = (scheduleRows ?? []) as MedicationSchedule[];

      }

      const bounds = getDayBoundsInTimeZone(new Date(), householdTimeZone);
      const todayDate = bounds.dateValue;
      const todayStart = bounds.start ?? new Date();
      const tomorrowStart = bounds.end ?? new Date(todayStart.getTime() + 86400000);
      const historyDate = addDaysToDateInput(todayDate, -6);
      const historyStart =
        parseDateTimeInTimeZone(historyDate, '00:00', householdTimeZone) ?? todayStart;

      const { data: historyRows, error: logsError } = await supabase
        .from('medication_logs')
        .select('id, user_id, medication_id, schedule_id, scheduled_for, status, logged_at, note, actor_name, corrected_at, correction_reason')
        .eq('pet_id', petId)
        .gte('scheduled_for', historyStart.toISOString())
        .lt('scheduled_for', tomorrowStart.toISOString())
        .order('scheduled_for', { ascending: true });

      if (logsError) throw logsError;
      const historyLogs = (historyRows ?? []) as MedicationLog[];
      todayLogs = historyLogs.filter((log) => {
        const scheduledFor = new Date(log.scheduled_for).getTime();
        return (
          scheduledFor >= todayStart.getTime() &&
          scheduledFor < tomorrowStart.getTime()
        );
      });

      setMedicationList((meds ?? []) as Medication[]);
      setMedicationSchedules(schedules);
      setMedicationLogs(todayLogs);
      setMedicationHistoryLogs(historyLogs);
    } catch (error) {
      logDevelopmentError('Load medication data error:', error);
      setMedicationsError(
        error instanceof Error ? error.message : 'Could not load medications.'
      );
    } finally {
      setMedicationsLoading(false);
    }
  }

  function buildScheduledDate(timeOfDay: string) {
    const dateValue = formatDateInputInTimeZone(new Date(), householdTimeZone);
    return (
      parseDateTimeInTimeZone(dateValue, timeOfDay.slice(0, 5), householdTimeZone) ??
      new Date()
    );
  }

  function getTodayMedicationDoses(): TodayMedicationDose[] {
    const doses: TodayMedicationDose[] = [];

    for (const schedule of medicationSchedules) {
      const medication = medicationList.find(
        (item) => item.id === schedule.medication_id
      );

      if (!medication) continue;

      const todayDate = formatDateInputInTimeZone(new Date(), householdTimeZone);
      if (
        medication.paused_at ||
        (medication.start_date && todayDate < medication.start_date) ||
        (medication.end_date && todayDate > medication.end_date)
      ) {
        continue;
      }

      const scheduledTime = buildScheduledDate(schedule.time_of_day);
      const snoozedTime = schedule.snoozed_until
        ? new Date(schedule.snoozed_until)
        : null;
      const scheduledFor =
        snoozedTime &&
        !Number.isNaN(snoozedTime.getTime()) &&
        snoozedTime.getTime() > scheduledTime.getTime()
          ? snoozedTime
          : scheduledTime;
      const log = medicationLogs.find(
        (item) => item.schedule_id === schedule.id
      ) ?? null;

      doses.push({
        medication,
        schedule,
        scheduledFor,
        log,
      });
    }

    return doses.sort(
      (a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime()
    );
  }

  function formatMedicationTime(date: Date) {
    return date.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: householdTimeZone,
    });
  }

  async function openMedicationsScreen() {
    if (!currentPetId) return;
    await loadMedicationData(currentPetId);
    setScreen('medications');
  }

  function resetMedicationEditor() {
    setEditingMedicationId(null);
    setNewMedicationName('');
    setNewMedicationDose('');
    setNewMedicationUnit('');
    setNewMedicationInstructions('');
    setNewMedicationTimes(['08:00']);
    setNewMedicationStartDate('');
    setNewMedicationEndDate('');
    setNewMedicationRefills('');
    setNewMedicationRefillDate('');
    setNewMedicationPaused(false);
  }

  function startAddMedication() {
    resetMedicationEditor();
    setMedicationsError('');
    setScreen('addMedication');
  }

  function startEditMedication(medication: Medication) {
    const times = medicationSchedules
      .filter((schedule) => schedule.medication_id === medication.id)
      .map((schedule) => schedule.time_of_day.slice(0, 5));
    setEditingMedicationId(medication.id);
    setNewMedicationName(medication.name);
    setNewMedicationDose(medication.dose ?? '');
    setNewMedicationUnit(medication.unit ?? '');
    setNewMedicationInstructions(medication.instructions ?? '');
    setNewMedicationTimes(times.length > 0 ? times : ['08:00']);
    setNewMedicationStartDate(medication.start_date ?? '');
    setNewMedicationEndDate(medication.end_date ?? '');
    setNewMedicationRefills(
      medication.refills_remaining === null ? '' : String(medication.refills_remaining)
    );
    setNewMedicationRefillDate(medication.refill_due_date ?? '');
    setNewMedicationPaused(Boolean(medication.paused_at));
    setMedicationsError('');
    setScreen('addMedication');
  }

  async function createMedication() {
    if (!requireOnline(setMedicationsError)) return;
    if (!currentPetId || !newMedicationName.trim()) {
      return;
    }

    const times = newMedicationTimes
      .map((time) => time.trim())
      .filter(Boolean)
      .filter((value, index, array) => array.indexOf(value) === index);

    const validTime = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (times.length === 0 || times.some((time) => !validTime.test(time))) {
      setMedicationsError('Add at least one valid time in 24-hour format, such as 08:00.');
      return;
    }

    if (
      (newMedicationStartDate && !isValidLocalDate(newMedicationStartDate)) ||
      (newMedicationEndDate && !isValidLocalDate(newMedicationEndDate)) ||
      (newMedicationRefillDate && !isValidLocalDate(newMedicationRefillDate))
    ) {
      setMedicationsError('Medication dates must use a real YYYY-MM-DD date.');
      return;
    }
    if (
      newMedicationStartDate &&
      newMedicationEndDate &&
      newMedicationEndDate < newMedicationStartDate
    ) {
      setMedicationsError('The medication end date cannot be before its start date.');
      return;
    }
    if (
      newMedicationStartDate &&
      newMedicationRefillDate &&
      newMedicationRefillDate < newMedicationStartDate
    ) {
      setMedicationsError('The refill date cannot be before the medication starts.');
      return;
    }
    const refills = newMedicationRefills.trim()
      ? Number(newMedicationRefills.trim())
      : null;
    if (refills !== null && (!Number.isInteger(refills) || refills < 0)) {
      setMedicationsError('Refills remaining must be a whole number of zero or more.');
      return;
    }

    try {
      setIsSavingMedication(true);
      setMedicationsError('');

      const { error: medicationError } = await supabase.rpc(
        'save_medication_with_schedules',
        {
          target_pet: currentPetId,
          target_name: newMedicationName.trim(),
          target_dose: newMedicationDose.trim(),
          target_unit: newMedicationUnit.trim(),
          target_instructions: newMedicationInstructions.trim(),
          target_times: times,
          target_medication: editingMedicationId,
          target_start_date: newMedicationStartDate || null,
          target_end_date: newMedicationEndDate || null,
          target_refills_remaining: refills,
          target_refill_due_date: newMedicationRefillDate || null,
          target_paused: newMedicationPaused,
        }
      );

      if (medicationError) throw medicationError;

      resetMedicationEditor();

      await loadMedicationData(currentPetId);
      await refreshAllPetsToday();
      await syncNotificationsIfEnabled();
      setScreen('medications');
    } catch (error) {
      logDevelopmentError('Create medication error:', error);
      setMedicationsError(
        error instanceof Error ? error.message : 'Could not save this medication.'
      );
    } finally {
      setIsSavingMedication(false);
    }
  }

  async function deleteMedication(medication: Medication) {
    if (!requireOnline(setMedicationsError)) return;
    if (!currentPetId) return;

    try {
      setDeletingMedicationId(medication.id);
      setMedicationsError('');

      const { error } = await supabase.rpc('set_medication_state', {
        target_medication: medication.id,
        target_action: 'archive',
      });

      if (error) throw error;

      await loadMedicationData(currentPetId);
      await refreshAllPetsToday();
      await syncNotificationsIfEnabled();
    } catch (error) {
      logDevelopmentError('Delete medication error:', error);
      setMedicationsError(
        error instanceof Error ? error.message : 'Could not archive this medication.'
      );
    } finally {
      setDeletingMedicationId(null);
    }
  }

  async function setMedicationState(
    medication: Medication,
    action: 'pause' | 'resume' | 'archive'
  ) {
    if (!requireOnline(setMedicationsError)) return;
    if (!currentPetId) return;
    try {
      setDeletingMedicationId(medication.id);
      setMedicationsError('');
      const { error } = await supabase.rpc('set_medication_state', {
        target_medication: medication.id,
        target_action: action,
      });
      if (error) throw error;
      await loadMedicationData(currentPetId);
      await refreshAllPetsToday();
      await syncNotificationsIfEnabled();
    } catch (error) {
      setMedicationsError(
        error instanceof Error ? error.message : 'Could not update this medication.'
      );
    } finally {
      setDeletingMedicationId(null);
    }
  }

  async function logMedicationDose(
    dose: TodayMedicationDose,
    status: 'given' | 'skipped',
    correctionReason?: string
  ) {
    if (!requireOnline(setMedicationsError)) return;
    if (!currentPetId) return;

    try {
      setLoggingDoseId(dose.schedule.id);
      setMedicationsError('');

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;
      if (!session?.user) throw new Error('Pawso session is not ready.');

      const existingLog = medicationLogs.find(
        (item) => item.schedule_id === dose.schedule.id
      );

      if (existingLog) {
        if (existingLog.status === status) return;
        const actorName =
          householdMembers.find((member) => member.user_id === session.user.id)
            ?.display_name ??
          session.user.email?.split('@')[0] ??
          'Household member';
        const { error } = await supabase.rpc('correct_medication_log', {
          target_log: existingLog.id,
          target_status: status,
          target_note: existingLog.note,
          correction_explanation:
            correctionReason?.trim() ||
            `Changed dose outcome from ${existingLog.status} to ${status}.`,
          actor_display_name: actorName,
        });

        if (error) throw error;
      } else {
        const actorName =
          householdMembers.find((member) => member.user_id === session.user.id)
            ?.display_name ??
          session.user.email?.split('@')[0] ??
          'Household member';
        const { error } = await supabase.rpc('record_medication_dose', {
          target_schedule: dose.schedule.id,
          target_scheduled_for: dose.scheduledFor.toISOString(),
          target_status: status,
          actor_display_name: actorName,
          target_note: null,
        });

        if (error) throw error;
      }

      await loadMedicationData(currentPetId);
      await refreshAllPetsToday();
      await syncNotificationsIfEnabled();
    } catch (error) {
      logDevelopmentError('Log medication dose error:', error);
      setMedicationsError(
        error instanceof Error ? error.message : 'Could not update this dose.'
      );
    } finally {
      setLoggingDoseId(null);
    }
  }

  async function snoozeMedicationDose(
    dose: TodayMedicationDose,
    minutes = 30
  ) {
    if (!requireOnline(setMedicationsError)) return;
    if (!currentPetId) return;
    try {
      setLoggingDoseId(dose.schedule.id);
      setMedicationsError('');
      const targetUntil = new Date(
        Math.max(Date.now(), dose.scheduledFor.getTime()) + minutes * 60_000
      ).toISOString();
      const { error } = await supabase.rpc('set_medication_schedule_snooze', {
        target_schedule: dose.schedule.id,
        target_until: targetUntil,
      });
      if (error) throw error;
      await loadMedicationData(currentPetId);
      await refreshAllPetsToday();
      await syncNotificationsIfEnabled();
    } catch (error) {
      setMedicationsError(
        error instanceof Error ? error.message : 'Could not snooze this dose.'
      );
    } finally {
      setLoggingDoseId(null);
    }
  }

  async function loadDocuments(petId: string) {
    try {
      setDocumentsLoading(true);
      setDocumentsError('');
      setPetDocuments([]);
      setArchivedPetDocuments([]);

      const { data: documents, error: documentsQueryError } = await supabase
        .from('documents')
        .select('id, filename, content_type, size_bytes, status, storage_path, created_at, archived_at')
        .eq('pet_id', petId)
        .order('created_at', { ascending: false });

      if (documentsQueryError) throw documentsQueryError;

      const { data: linkedEvents, error: linkedEventsError } = await supabase
        .from('medical_events')
        .select('id, document_id')
        .eq('pet_id', petId)
        .not('document_id', 'is', null);

      if (linkedEventsError) throw linkedEventsError;

      const counts = new Map<string, number>();
      for (const event of linkedEvents ?? []) {
        if (event.document_id) {
          counts.set(event.document_id, (counts.get(event.document_id) ?? 0) + 1);
        }
      }

      const documentRows = (documents ?? []).map((document) => ({
        ...document,
        linked_events: counts.get(document.id) ?? 0,
      }));
      setPetDocuments(documentRows.filter((document) => !document.archived_at));
      setArchivedPetDocuments(
        documentRows.filter((document) => Boolean(document.archived_at))
      );
    } catch (error) {
      logDevelopmentError('Load documents error:', error);
      setDocumentsError(
        error instanceof Error ? error.message : 'Could not load medical records.'
      );
    } finally {
      setDocumentsLoading(false);
    }
  }

  async function openDocumentsScreen() {
    if (!currentPetId) return;
    setScreen('documents');
    await loadDocuments(currentPetId);
  }

  async function resumeExtractionReview(document: PetDocument) {
    try {
      setDocumentsError('');
      setDatabaseError('');

      const { data: extraction, error: extractionError } = await supabase
        .from('ai_extractions')
        .select('id, model, schema_version')
        .eq('document_id', document.id)
        .eq('status', 'proposed')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (extractionError) throw extractionError;
      if (!extraction) {
        throw new Error('This record no longer has an AI review draft.');
      }

      const { data: fields, error: fieldsError } = await supabase
        .from('extracted_fields')
        .select('field_type, normalized_value, raw_value')
        .eq('extraction_id', extraction.id);

      if (fieldsError) throw fieldsError;

      const values = new Map(
        (fields ?? []).map((field) => [
          field.field_type,
          field.normalized_value ?? field.raw_value ?? '',
        ])
      );
      const parseStringList = (fieldType: string) => {
        const value = values.get(fieldType);
        if (!value) return [];
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed)
            ? parsed.filter((item): item is string => typeof item === 'string')
            : [];
        } catch {
          return [];
        }
      };

      setDocumentName(document.filename);
      setDocumentSize(document.size_bytes);
      setDocumentContentType(document.content_type ?? 'application/octet-stream');
      setCurrentDocumentId(document.id);
      setCurrentExtractionId(extraction.id);
      setVisitDate(values.get('visit_date') ?? '');
      setClinic(values.get('clinic') ?? '');
      setFinding(values.get('finding') ?? '');
      setDiagnosis(values.get('diagnosis') ?? '');
      setDiagnosisCertainty(
        normalizeDiagnosisCertainty(values.get('diagnosis_certainty'))
      );
      setFollowUp(values.get('follow_up') ?? '');
      setExtractedMedications(parseStringList('medications'));
      setExtractionWarnings(parseStringList('warnings'));
      setExtractionModel(extraction.model ?? '');
      setExtractionPromptVersion(extraction.schema_version ?? '');
      setScreen('review');
    } catch (error) {
      setDocumentsError(
        error instanceof Error ? error.message : 'Could not reopen this review.'
      );
    }
  }

  async function openOriginalDocument(document: PetDocument) {
    if (!document.storage_path) {
      setDocumentsError('The original file is not available for this record.');
      return;
    }

    try {
      setOpeningDocumentId(document.id);
      setDocumentsError('');

      const { data, error } = await supabase.storage
        .from('vet-records')
        .createSignedUrl(document.storage_path, 60);

      if (error) throw error;
      if (!data?.signedUrl) throw new Error('Could not create a secure document link.');

      await Linking.openURL(data.signedUrl);
    } catch (error) {
      logDevelopmentError('Open original document error:', error);
      setDocumentsError(
        error instanceof Error ? error.message : 'Could not open the original veterinary record.'
      );
    } finally {
      setOpeningDocumentId(null);
    }
  }

  function formatDocumentDate(value: string) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleDateString();
  }

  function formatDocumentSize(size: number | null) {
    if (size === null || size === undefined) return 'Size unavailable';
    return size < 1024 * 1024
      ? `${(size / 1024).toFixed(1)} KB`
      : `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  function normalizeEventDate(value: string) {
    const trimmed = value.trim();

    if (isValidLocalDate(trimmed)) {
      return trimmed;
    }

    return null;
  }

  function parseWeightKg(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const match = /^(\d+(?:[.,]\d{1,2})?)\s*(?:kg)?$/i.exec(trimmed);
    return match ? Number(match[1].replace(',', '.')) : null;
  }

  async function createPetProfile() {
    if (!requireOnline(setDatabaseError)) return;
    if (!canCreateProfile || !petType) {
      return;
    }

    try {
      setIsSavingPet(true);
      setDatabaseError('');

      if (petDateOfBirth.trim() && !isValidLocalDate(petDateOfBirth.trim())) {
        throw new Error('Enter the birth date as YYYY-MM-DD.');
      }
      if (
        petDateOfBirth.trim() &&
        petDateOfBirth.trim() > formatDateInputInTimeZone(new Date(), householdTimeZone)
      ) {
        throw new Error('A pet’s birth date cannot be in the future.');
      }
      const parsedWeight = parseWeightKg(weight);
      if (weight.trim() && (parsedWeight === null || parsedWeight <= 0)) {
        throw new Error('Enter weight like 4.2 kg, or leave it blank.');
      }
      if (parsedWeight !== null && parsedWeight > 999999.99) {
        throw new Error('That weight is outside Pawso’s supported range.');
      }

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (!session?.user) {
        throw new Error('Pawso session is not ready. Please try again.');
      }

      const petValues = {
        name: petName.trim(),
        species: petType,
        breed: breed.trim() || null,
        approximate_age: petAge.trim() || null,
        date_of_birth: petDateOfBirth.trim() || null,
        sex: petSex,
        spayed_neutered:
          alteredStatus === 'yes'
            ? true
            : alteredStatus === 'no'
            ? false
            : null,
        weight_kg: parsedWeight,
        microchip_number: microchip.trim() || null,
        conditions: conditions.trim() || null,
        allergies: allergies.trim() || null,
        medications: medications.trim() || null,
        vet_clinic: vetClinic.trim() || null,
        emergency_notes: emergencyNotes.trim() || null,
        emergency_contact_name: emergencyContactName.trim() || null,
        emergency_contact_phone: emergencyContactPhone.trim() || null,
      };

      const query = isEditingPet && currentPetId
        ? supabase.from('pets').update(petValues).eq('id', currentPetId)
        : supabase.from('pets').insert({
            ...petValues,
            user_id: session.user.id,
            household_id: householdId ?? (await ensureHousehold()),
          });

      const { data, error } = await query.select().single();

      if (error) {
        throw error;
      }

      const savedPet = data as PetSummary;
      hydratePet(savedPet);
      setIsEditingPet(false);

      const updatedPets = await loadPets(session.user.id);
      await refreshAllPetsToday(updatedPets);
      await Promise.all([
        loadTimeline(savedPet.id),
        loadMedicationData(savedPet.id),
        loadCareData(savedPet.id),
        loadHealthData(savedPet.id),
      ]);

      setTodayView(updatedPets.length > 1 ? 'all' : 'pet');
      setScreen('petProfile');
    } catch (error) {
      logDevelopmentError('Create pet error:', error);

      setDatabaseError(
        error instanceof Error
          ? error.message
          : 'Could not save this pet.'
      );
    } finally {
      setIsSavingPet(false);
    }
  }

  async function refreshPetProfile(petId: string) {
    const { data, error } = await supabase
      .from('pets')
      .select(PET_SELECT)
      .eq('id', petId)
      .single();
    if (error) throw error;
    const pet = data as unknown as PetSummary;
    setPets((current) => current.map((item) => (item.id === pet.id ? pet : item)));
    if (currentPetId === pet.id) hydratePet(pet);
    return pet;
  }

  async function updatePetPhoto() {
    if (!requireOnline(setDatabaseError)) return;
    if (!currentPetId || !canManageMedical) return;
    try {
      setPetPhotoBusy(true);
      setDatabaseError('');
      const path = await chooseAndUploadPetPhoto(currentPetId, petPhotoPath);
      if (!path) return;
      setPetPhotoPath(path);
      setPetPhotoUrl(await createPetPhotoUrl(path));
      await refreshPetProfile(currentPetId);
    } catch (error) {
      setDatabaseError(
        error instanceof Error ? error.message : 'Could not update the pet photo.'
      );
    } finally {
      setPetPhotoBusy(false);
    }
  }

  async function removePetPhoto() {
    if (!requireOnline(setDatabaseError)) return;
    if (!currentPetId || !petPhotoPath || !canManageMedical) return;
    try {
      setPetPhotoBusy(true);
      setDatabaseError('');
      await removeStoredPetPhoto(currentPetId, petPhotoPath);
      setPetPhotoPath(null);
      setPetPhotoUrl(null);
      await refreshPetProfile(currentPetId);
    } catch (error) {
      setDatabaseError(
        error instanceof Error ? error.message : 'Could not remove the pet photo.'
      );
    } finally {
      setPetPhotoBusy(false);
    }
  }

  async function archiveCurrentPet() {
    if (!requireOnline(setDataRightsError)) return;
    if (!currentPetId || !canManageMedical) return;
    try {
      setDataRightsBusy(true);
      setDataRightsError('');
      const archivedPetId = currentPetId;
      const { error } = await supabase
        .from('pets')
        .update({ archived_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', archivedPetId);
      if (error) throw error;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Pawso session is not ready.');
      const rows = await loadPets(user.id, householdId);
      if (rows[0]) await selectPet(rows[0].id, 'pets');
      else {
        clearPetScopedState();
        setScreen('pets');
      }
      setDataRightsMessage('Pet archived. Its records remain retained until deletion.');
    } catch (error) {
      setDataRightsError(
        error instanceof Error ? error.message : 'Could not archive this pet.'
      );
    } finally {
      setDataRightsBusy(false);
    }
  }

  async function restoreArchivedPet(pet: PetSummary) {
    if (!requireOnline(setDataRightsError)) return;
    if (!canManageMedical) return;
    try {
      setDataRightsBusy(true);
      setDataRightsError('');
      const { error } = await supabase
        .from('pets')
        .update({ archived_at: null, updated_at: new Date().toISOString() })
        .eq('id', pet.id);
      if (error) throw error;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Pawso session is not ready.');
      await loadPets(user.id, householdId);
      setDataRightsMessage(`${pet.name} was restored.`);
    } catch (error) {
      setDataRightsError(
        error instanceof Error ? error.message : 'Could not restore this pet.'
      );
    } finally {
      setDataRightsBusy(false);
    }
  }

  async function deleteArchivedPet(pet: PetSummary) {
    if (!requireOnline(setDataRightsError)) return;
    if (!canManageMedical) return;
    try {
      setDataRightsBusy(true);
      setDataRightsError('');
      await permanentlyDeletePet(pet.id);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Pawso session is not ready.');
      await loadPets(user.id, householdId);
      setDataRightsMessage(`${pet.name} and linked Pawso records were deleted.`);
    } catch (error) {
      setDataRightsError(
        error instanceof Error ? error.message : 'Could not delete this pet.'
      );
    } finally {
      setDataRightsBusy(false);
    }
  }

  async function deleteCurrentPet() {
    if (!requireOnline(setDataRightsError)) return;
    if (!currentPetId || !canManageMedical) return;
    try {
      setDataRightsBusy(true);
      setDataRightsError('');
      const deletedPetId = currentPetId;
      await permanentlyDeletePet(deletedPetId);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Pawso session is not ready.');
      clearPetScopedState();
      const rows = await loadPets(user.id, householdId);
      if (rows[0]) await selectPet(rows[0].id, 'pets');
      else setScreen('pets');
      setDataRightsMessage('Pet and linked Pawso records were permanently deleted.');
    } catch (error) {
      setDataRightsError(
        error instanceof Error ? error.message : 'Could not delete this pet.'
      );
    } finally {
      setDataRightsBusy(false);
    }
  }

  async function exportAccountData() {
    if (!requireOnline(setDataRightsError)) return;
    try {
      setDataRightsBusy(true);
      setDataRightsError('');
      setDataRightsMessage('');
      await shareStructuredDataExport();
      setDataRightsMessage('Your structured Pawso export is ready.');
    } catch (error) {
      setDataRightsError(
        error instanceof Error ? error.message : 'Could not export Pawso data.'
      );
    } finally {
      setDataRightsBusy(false);
    }
  }

  async function shareCurrentEmergencyCard() {
    if (!currentPetId) return;
    try {
      setDataRightsBusy(true);
      setDataRightsError('');
      const pet = pets.find((item) => item.id === currentPetId) ??
        (await refreshPetProfile(currentPetId));
      await shareEmergencyPetCard(pet, medicationList, householdTimeZone);
    } catch (error) {
      setDataRightsError(
        error instanceof Error ? error.message : 'Could not create the emergency card.'
      );
    } finally {
      setDataRightsBusy(false);
    }
  }

  async function archiveDocument(document: PetDocument) {
    if (!requireOnline(setDocumentsError)) return;
    if (!currentPetId || !canManageMedical) return;
    try {
      setDeletingDocumentId(document.id);
      setDocumentsError('');
      const { error } = await supabase
        .from('documents')
        .update({ archived_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', document.id);
      if (error) throw error;
      await loadDocuments(currentPetId);
    } catch (error) {
      setDocumentsError(
        error instanceof Error ? error.message : 'Could not archive this document.'
      );
    } finally {
      setDeletingDocumentId(null);
    }
  }

  async function restoreDocument(document: PetDocument) {
    if (!requireOnline(setDocumentsError)) return;
    if (!currentPetId || !canManageMedical) return;
    try {
      setDeletingDocumentId(document.id);
      setDocumentsError('');
      const { error } = await supabase
        .from('documents')
        .update({ archived_at: null, updated_at: new Date().toISOString() })
        .eq('id', document.id);
      if (error) throw error;
      await loadDocuments(currentPetId);
    } catch (error) {
      setDocumentsError(
        error instanceof Error ? error.message : 'Could not restore this document.'
      );
    } finally {
      setDeletingDocumentId(null);
    }
  }

  async function deleteDocumentPermanently(document: PetDocument) {
    if (!requireOnline(setDocumentsError)) return;
    if (!currentPetId || !canManageMedical) return;
    try {
      setDeletingDocumentId(document.id);
      setDocumentsError('');
      await permanentlyDeleteDocument(document.id);
      await Promise.all([loadDocuments(currentPetId), loadTimeline(currentPetId)]);
    } catch (error) {
      setDocumentsError(
        error instanceof Error ? error.message : 'Could not delete this document.'
      );
    } finally {
      setDeletingDocumentId(null);
    }
  }

  async function checkBackend() {
    try {
      setApiStatus('Checking backend...');

      const response = await fetch(`${API_BASE_URL}/health`);

      if (!response.ok) {
        throw new Error('Backend response failed');
      }

      const data = await response.json();

      if (data.status === 'ok') {
        setApiStatus('Backend connected');
      } else {
        setApiStatus('Backend unavailable');
      }
    } catch (error) {
      logDevelopmentError('Backend connection error:', error);
      setApiStatus('Backend unavailable');
    }
  }

  const canCreateProfile =
    canManageMedical && petName.trim() !== '' && petType !== null;

  const petEmoji = petType === 'dog' ? '🐶' : '🐱';

  const alteredLabel =
    petSex === 'female'
      ? 'Spayed'
      : petSex === 'male'
      ? 'Neutered'
      : 'Spayed / Neutered';

  const alteredValue =
    alteredStatus === 'yes'
      ? 'Yes'
      : alteredStatus === 'no'
      ? 'No'
      : alteredStatus === 'notSure'
      ? 'Not sure'
      : 'Not provided';

  async function persistExtractionProposal({
    filename,
    contentType,
    sizeBytes,
    localUri,
    extraction,
    model,
    promptVersion,
  }: {
    filename: string;
    contentType: string;
    sizeBytes: number | null;
    localUri: string;
    model?: string | null;
    promptVersion?: string | null;
    extraction: {
      visit_date?: string | null;
      clinic?: string | null;
      finding?: string | null;
      diagnosis?: string | null;
      diagnosis_certainty?: string | null;
      follow_up?: string | null;
      medications?: string[] | null;
      warnings?: string[] | null;
    };
  }) {
    if (!currentPetId) {
      throw new Error('No pet is selected for this veterinary record.');
    }

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      throw sessionError;
    }

    if (!session?.user) {
      throw new Error('Pawso session is not ready. Please try again.');
    }

    const { data: documentRow, error: documentError } = await supabase
      .from('documents')
      .insert({
        pet_id: currentPetId,
        user_id: session.user.id,
        filename,
        content_type: contentType,
        size_bytes: sizeBytes,
        status: 'review_required',
      })
      .select('id')
      .single();

    if (documentError) {
      throw documentError;
    }

    try {
      const base64 = await FileSystem.readAsStringAsync(localUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const extensionMatch = filename.match(/\.([a-zA-Z0-9]+)$/);
      const extension = extensionMatch?.[1]?.toLowerCase() || 'bin';

      const storagePath =
        `${session.user.id}/${currentPetId}/${documentRow.id}/original.${extension}`;

      const { error: storageError } = await supabase.storage
        .from('vet-records')
        .upload(storagePath, decode(base64), {
          contentType,
          upsert: false,
        });

      if (storageError) {
        await supabase
          .from('documents')
          .update({ status: 'failed' })
          .eq('id', documentRow.id);

        throw storageError;
      }

      const { error: documentStorageUpdateError } = await supabase
        .from('documents')
        .update({
          storage_path: storagePath,
        })
        .eq('id', documentRow.id);

      if (documentStorageUpdateError) {
        throw documentStorageUpdateError;
      }
    } catch (storageError) {
      logDevelopmentError('Supabase Storage upload error:', storageError);
      await supabase
        .from('documents')
        .update({ status: 'failed' })
        .eq('id', documentRow.id);
      throw storageError;
    }

    const { data: extractionRow, error: extractionError } = await supabase
      .from('ai_extractions')
      .insert({
        document_id: documentRow.id,
        model: model?.trim() || 'unknown',
        schema_version: promptVersion?.trim() || 'unknown',
        status: 'proposed',
      })
      .select('id')
      .single();

    if (extractionError) {
      await supabase
        .from('documents')
        .update({ status: 'failed' })
        .eq('id', documentRow.id);
      throw extractionError;
    }

    const proposedFields = [
      ['visit_date', extraction.visit_date ?? null],
      ['clinic', extraction.clinic ?? null],
      ['finding', extraction.finding ?? null],
      ['diagnosis', extraction.diagnosis ?? null],
      ['diagnosis_certainty', extraction.diagnosis_certainty ?? null],
      ['follow_up', extraction.follow_up ?? null],
      [
        'medications',
        extraction.medications?.length
          ? JSON.stringify(extraction.medications)
          : null,
      ],
      [
        'warnings',
        extraction.warnings?.length
          ? JSON.stringify(extraction.warnings)
          : null,
      ],
    ]
      .filter(([, value]) => value !== null && value !== '')
      .map(([fieldType, value]) => ({
        extraction_id: extractionRow.id,
        field_type: fieldType,
        raw_value: value,
        normalized_value: value,
        status: 'proposed',
      }));

    if (proposedFields.length > 0) {
      const { error: fieldError } = await supabase
        .from('extracted_fields')
        .insert(proposedFields);

      if (fieldError) {
        await Promise.all([
          supabase
            .from('ai_extractions')
            .update({ status: 'failed' })
            .eq('id', extractionRow.id),
          supabase
            .from('documents')
            .update({ status: 'failed' })
            .eq('id', documentRow.id),
        ]);
        throw fieldError;
      }
    }

    setCurrentDocumentId(documentRow.id);
    setCurrentExtractionId(extractionRow.id);
  }

  async function confirmAiProcessingConsent() {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) throw error;
    if (!session?.user) throw new Error('Pawso session is not ready.');

    const storageKey = aiConsentStorageKey(session.user.id);
    const existingConsent = await AsyncStorage.getItem(storageKey);
    if (existingConsent) {
      try {
        const parsed = JSON.parse(existingConsent);
        if (parsed?.version === AI_PROCESSING_CONSENT_VERSION) return true;
      } catch {
        // Replace invalid or outdated local consent after the user agrees again.
      }
    }

    return new Promise<boolean>((resolve) => {
      Alert.alert(
        'Before Pawso uses AI',
        'Pawso sends the veterinary file you choose to its AI provider for extraction. AI can make mistakes, and nothing is added to the health timeline until you review and confirm it.',
        [
          { text: 'Not now', style: 'cancel', onPress: () => resolve(false) },
          {
            text: 'I agree and continue',
            onPress: async () => {
              try {
                await AsyncStorage.setItem(
                  storageKey,
                  JSON.stringify({
                    version: AI_PROCESSING_CONSENT_VERSION,
                    accepted_at: new Date().toISOString(),
                  })
                );
                resolve(true);
              } catch {
                resolve(false);
              }
            },
          },
        ],
        { cancelable: true, onDismiss: () => resolve(false) }
      );
    });
  }

  async function pickVetRecord() {
    if (!requireOnline(setUploadError)) return;
    let temporaryFileUri: string | null = null;
    try {
      setUploadError('');

      if (!(await confirmAiProcessingConsent())) return;

      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];
      temporaryFileUri = asset.uri;

      if (asset.name.length > 255) {
        throw new Error('Choose a file with a name of 255 characters or fewer.');
      }
      if (asset.size !== undefined && asset.size !== null && asset.size > 10 * 1024 * 1024) {
        throw new Error('Choose a veterinary file smaller than 10 MB.');
      }

      setDocumentName(asset.name);
      setDocumentSize(asset.size ?? null);
      setDocumentContentType(asset.mimeType || 'application/octet-stream');
      setCurrentDocumentId(null);
      setCurrentExtractionId(null);
      setDiagnosisCertainty('unknown');
      setExtractedMedications([]);
      setExtractionWarnings([]);
      setExtractionModel('');
      setExtractionPromptVersion('');
      setScreen('processing');

      const uploadResult = await FileSystem.uploadAsync(
        `${API_BASE_URL}/api/v1/documents/extract`,
        asset.uri,
        {
          httpMethod: 'POST',
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          fieldName: 'file',
          headers: await getApiAuthHeaders(),
          mimeType: asset.mimeType || 'application/octet-stream',
        }
      );

      const responseBody = (() => {
        try {
          return JSON.parse(uploadResult.body);
        } catch {
          return null;
        }
      })();

      if (uploadResult.status < 200 || uploadResult.status >= 300) {
        throw new Error(
          getApiErrorMessage(
            responseBody,
            `Pawso could not analyze this file (${uploadResult.status}).`
          )
        );
      }
      if (!responseBody || typeof responseBody !== 'object') {
        throw new Error('Pawso received an invalid document response.');
      }

      const data = responseBody;

      setDocumentName(data.document?.filename || asset.name);
      setDocumentSize(data.document?.size_bytes ?? asset.size ?? null);
      setVisitDate(data.extraction?.visit_date || '');
      setClinic(data.extraction?.clinic || '');
      setFinding(data.extraction?.finding || '');
      setDiagnosis(data.extraction?.diagnosis || '');
      setDiagnosisCertainty(
        normalizeDiagnosisCertainty(data.extraction?.diagnosis_certainty)
      );
      setFollowUp(data.extraction?.follow_up || '');
      setExtractedMedications(
        Array.isArray(data.extraction?.medications)
          ? data.extraction.medications.filter(
              (item: unknown) => typeof item === 'string'
            )
          : []
      );
      setExtractionWarnings(
        Array.isArray(data.extraction?.warnings)
          ? data.extraction.warnings.filter(
              (item: unknown) => typeof item === 'string'
            )
          : []
      );
      setExtractionModel(
        typeof data.ai?.model === 'string' ? data.ai.model : ''
      );
      setExtractionPromptVersion(
        typeof data.ai?.prompt_version === 'string'
          ? data.ai.prompt_version
          : ''
      );

      const resolvedContentType =
        data.document?.content_type ||
        asset.mimeType ||
        'application/octet-stream';

      setDocumentContentType(resolvedContentType);

      await persistExtractionProposal({
        filename: data.document?.filename || asset.name,
        contentType: resolvedContentType,
        sizeBytes: data.document?.size_bytes ?? asset.size ?? null,
        localUri: asset.uri,
        extraction: data.extraction ?? {},
        model: data.ai?.model,
        promptVersion: data.ai?.prompt_version,
      });

      setScreen('review');
    } catch (error) {
      logDevelopmentError('Document upload error:', error);

      setUploadError(
        error instanceof Error
          ? error.message
          : 'Something went wrong while uploading the file.'
      );

      setScreen('today');
    } finally {
      if (temporaryFileUri) {
        await FileSystem.deleteAsync(temporaryFileUri, { idempotent: true }).catch(
          () => undefined
        );
      }
    }
  }

  async function confirmExtraction() {
    if (!requireOnline(setDatabaseError)) return;
    if (!currentPetId) {
      setDatabaseError(
        'Pawso could not identify the current pet. Please return to the pet profile and try again.'
      );
      return;
    }

    try {
      setIsConfirmingExtraction(true);
      setDatabaseError('');

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (!session?.user) {
        throw new Error('Pawso session is not ready. Please try again.');
      }

      if (!currentDocumentId || !currentExtractionId) {
        throw new Error('This AI review draft is incomplete. Reopen it from Documents.');
      }

      if (visitDate.trim() && !isValidLocalDate(visitDate.trim())) {
        throw new Error('Enter the visit date as YYYY-MM-DD, or leave it blank.');
      }
      if (
        visitDate.trim() &&
        visitDate.trim() > formatDateInputInTimeZone(new Date(), householdTimeZone)
      ) {
        throw new Error('A veterinary visit date cannot be in the future.');
      }

      const eventDate = normalizeEventDate(visitDate);
      const diagnosisText = diagnosis.trim();
      const diagnosisDescription = diagnosisText
        ? diagnosisCertainty === 'confirmed'
          ? diagnosisText
          : `${DIAGNOSIS_CERTAINTY_LABELS[diagnosisCertainty]}: ${diagnosisText}`
        : 'Veterinary record confirmed by the owner.';

      const { error } = await supabase.rpc('confirm_vet_extraction', {
        target_pet: currentPetId,
        target_document: currentDocumentId,
        target_extraction: currentExtractionId,
        target_visit_date: eventDate,
        target_clinic: clinic.trim(),
        target_finding: finding.trim(),
        target_diagnosis: diagnosisText,
        target_diagnosis_certainty: diagnosisCertainty,
        target_follow_up: followUp.trim(),
        target_medications_json: JSON.stringify(extractedMedications),
        target_warnings_json: JSON.stringify(extractionWarnings),
        target_event_description: diagnosisDescription,
      });

      if (error) {
        throw error;
      }

      await loadTimeline(currentPetId);
      setCurrentDocumentId(null);
      setCurrentExtractionId(null);
      setDiagnosisCertainty('unknown');
      setExtractedMedications([]);
      setExtractionWarnings([]);
      setExtractionModel('');
      setExtractionPromptVersion('');
      setScreen('timeline');
    } catch (error) {
      logDevelopmentError('Confirm extraction error:', error);

      setDatabaseError(
        error instanceof Error
          ? error.message
          : 'Could not save this health history.'
      );
    } finally {
      setIsConfirmingExtraction(false);
    }
  }

  const todayMedicationDoses = getTodayMedicationDoses();
  const pendingMedicationDoses = todayMedicationDoses.filter(
    (dose) => !dose.log
  );
  const completedMedicationDoses = todayMedicationDoses.filter(
    (dose) => dose.log
  );

  const activeCareTasks = careTasks.filter(
    (task) =>
      task.is_active &&
      !task.paused_at &&
      !taskCompletions.some((completion) => completion.task_id === task.id)
  );

  const overdueMedicationDoses = pendingMedicationDoses.filter(
    (dose) => getMedicationUrgency(dose) === 'overdue'
  );
  const dueSoonMedicationDoses = pendingMedicationDoses.filter(
    (dose) => getMedicationUrgency(dose) === 'dueSoon'
  );
  const laterMedicationDoses = pendingMedicationDoses.filter(
    (dose) => getMedicationUrgency(dose) === 'later'
  );

  const overdueCareTasks = activeCareTasks.filter(
    (task) => new Date(task.due_at).getTime() < Date.now()
  );
  const upcomingCareTasks = activeCareTasks.filter(
    (task) => new Date(task.due_at).getTime() >= Date.now()
  );

  const followUpEvents = timelineEvents.filter(
    (event) => event.type === 'Follow-up'
  );


  return {
    setScreen,
    apiStatus,
    householdId,
    householdName,
    householdTimeZone,
    householdOptions,
    householdRole,
    householdMembers,
    householdInvitations,
    householdBusy,
    householdError,
    canViewMedical,
    canManageMedical,
    canManageCare,
    canLogCare,
    inviteEmail,
    setInviteEmail,
    inviteRole,
    setInviteRole,
    inviteCode,
    inviteEmailStatus,
    joinCode,
    setJoinCode,
    memberDisplayName,
    setMemberDisplayName,
    ensureHousehold,
    loadHousehold,
    loadHouseholdOptions,
    switchHousehold,
    updateHouseholdTimeZone,
    updateHouseholdMemberRole,
    refreshHousehold,
    removeHouseholdMember,
    cancelHouseholdInvitation,
    createHouseholdInvite,
    acceptHouseholdInvite,
    accountEmail,
    accountUserId,
    accountIsAnonymous,
    accountBusy,
    accountMessage,
    accountError,
    secureAccountEmail,
    setSecureAccountEmail,
    secureAccountPassword,
    setSecureAccountPassword,
    accountAuthMode,
    setAccountAuthMode,
    signInEmail,
    setSignInEmail,
    signInPassword,
    setSignInPassword,
    passwordResetCooldown,
    signInAccount,
    requestPasswordReset,
    accountRecoveryMode,
    recoveryPassword,
    setRecoveryPassword,
    completePasswordRecovery,
    secureAccount,
    resetAiProcessingConsent,
    deleteAccount,
    signOutAccount,
    setApiStatus,
    authReady,
    setAuthReady,
    authError,
    setAuthError,
    databaseError,
    setDatabaseError,
    isSavingPet,
    setIsSavingPet,
    isEditingPet,
    isConfirmingExtraction,
    setIsConfirmingExtraction,
    currentPetId,
    setCurrentPetId,
    pets,
    setPets,
    archivedPets,
    allPetsToday,
    setAllPetsToday,
    todayView,
    setTodayView,
    petName,
    setPetName,
    petType,
    setPetType,
    breed,
    setBreed,
    petAge,
    setPetAge,
    petDateOfBirth,
    setPetDateOfBirth,
    petSex,
    setPetSex,
    alteredStatus,
    setAlteredStatus,
    weight,
    setWeight,
    microchip,
    setMicrochip,
    conditions,
    setConditions,
    allergies,
    setAllergies,
    medications,
    setMedications,
    vetClinic,
    setVetClinic,
    petPhotoPath,
    petPhotoUrl,
    petPhotoBusy,
    emergencyNotes,
    setEmergencyNotes,
    emergencyContactName,
    setEmergencyContactName,
    emergencyContactPhone,
    setEmergencyContactPhone,
    documentName,
    setDocumentName,
    documentSize,
    setDocumentSize,
    documentContentType,
    setDocumentContentType,
    currentDocumentId,
    setCurrentDocumentId,
    currentExtractionId,
    setCurrentExtractionId,
    uploadError,
    setUploadError,
    visitDate,
    setVisitDate,
    clinic,
    setClinic,
    finding,
    setFinding,
    diagnosis,
    setDiagnosis,
    diagnosisCertainty,
    setDiagnosisCertainty,
    followUp,
    setFollowUp,
    extractedMedications,
    extractionWarnings,
    extractionModel,
    extractionPromptVersion,
    timelineEvents,
    setTimelineEvents,
    petDocuments,
    setPetDocuments,
    archivedPetDocuments,
    documentsLoading,
    setDocumentsLoading,
    documentsError,
    setDocumentsError,
    openingDocumentId,
    setOpeningDocumentId,
    deletingDocumentId,
    medicationList,
    setMedicationList,
    medicationSchedules,
    setMedicationSchedules,
    medicationLogs,
    setMedicationLogs,
    medicationHistoryLogs,
    medicationsLoading,
    setMedicationsLoading,
    medicationsError,
    setMedicationsError,
    isSavingMedication,
    setIsSavingMedication,
    loggingDoseId,
    setLoggingDoseId,
    newMedicationName,
    setNewMedicationName,
    newMedicationDose,
    setNewMedicationDose,
    newMedicationUnit,
    setNewMedicationUnit,
    newMedicationInstructions,
    setNewMedicationInstructions,
    newMedicationTimes,
    setNewMedicationTimes,
    editingMedicationId,
    newMedicationStartDate,
    setNewMedicationStartDate,
    newMedicationEndDate,
    setNewMedicationEndDate,
    newMedicationRefills,
    setNewMedicationRefills,
    newMedicationRefillDate,
    setNewMedicationRefillDate,
    newMedicationPaused,
    setNewMedicationPaused,
    careTasks,
    setCareTasks,
    taskCompletions,
    setTaskCompletions,
    careLoading,
    setCareLoading,
    careError,
    setCareError,
    savingCareTask,
    setSavingCareTask,
    completingTaskId,
    setCompletingTaskId,
    newCareTitle,
    setNewCareTitle,
    newCareNotes,
    setNewCareNotes,
    newCareDate,
    setNewCareDate,
    newCareTime,
    setNewCareTime,
    newCareFrequency,
    setNewCareFrequency,
    newCareInterval,
    setNewCareInterval,
    newCareEndsOn,
    setNewCareEndsOn,
    askQuestion,
    setAskQuestion,
    askAnswer,
    setAskAnswer,
    askSources,
    setAskSources,
    askLoading,
    setAskLoading,
    askError,
    setAskError,
    visitReason,
    setVisitReason,
    visitChanges,
    setVisitChanges,
    vetVisitPrep,
    setVetVisitPrep,
    vetVisitPrepLoading,
    vetVisitPrepError,
    checkInType,
    checkInDate,
    setCheckInDate,
    checkInTitle,
    setCheckInTitle,
    checkInDetails,
    setCheckInDetails,
    checkInWeight,
    setCheckInWeight,
    checkInSaving,
    checkInError,
    symptomSeverity,
    setSymptomSeverity,
    symptomFrequency,
    setSymptomFrequency,
    symptomDuration,
    setSymptomDuration,
    symptomEntries,
    labResults,
    healthDataLoading,
    healthDataError,
    healthDataSaving,
    newLabDate,
    setNewLabDate,
    newLabTest,
    setNewLabTest,
    newLabValue,
    setNewLabValue,
    newLabUnit,
    setNewLabUnit,
    newLabLow,
    setNewLabLow,
    newLabHigh,
    setNewLabHigh,
    newLabNotes,
    setNewLabNotes,
    smartCareSuggestions,
    smartCareLoading,
    smartCareError,
    notificationPermission,
    notificationsEnabled,
    notificationSyncing,
    scheduledNotificationCount,
    notificationError,
    dataRightsBusy,
    dataRightsMessage,
    dataRightsError,
    isOnline,
    offlineSnapshotAt,
    offlineAccessEnabled,
    appearanceMode,
    resolvedAppearance,
    setAppearanceMode,
    updateOfflineAccess,
    refreshNotificationState,
    enableNotifications,
    disableNotifications,
    syncNotificationsIfEnabled,
    initializeSupabase,
    loadExistingPet,
    loadPets,
    refreshAllPetsToday,
    selectPet,
    startAddPet,
    startEditPet,
    cancelAddPet,
    loadTimeline,
    askPawso,
    openAskScreen,
    getAskSourceLabel,
    generateVetVisitPrep,
    openVetVisitPrep,
    openHealthCheckIn,
    saveHealthCheckIn,
    loadHealthData,
    openHealthTrends,
    saveLabResult,
    openSmartCarePlan,
    generateSmartCarePlan,
    acceptSmartCareSuggestion,
    getSmartCareSourceLabel,
    loadCareData,
    parseCareDateTime,
    openCareScreen,
    createCareTask,
    completeCareTask,
    skipCareTask,
    setCareTaskState,
    deleteCareTask,
    deletingTaskId,
    formatDueLabel,
    getMedicationUrgency,
    loadMedicationData,
    buildScheduledDate,
    getTodayMedicationDoses,
    formatMedicationTime,
    openMedicationsScreen,
    startAddMedication,
    startEditMedication,
    createMedication,
    deleteMedication,
    setMedicationState,
    deletingMedicationId,
    logMedicationDose,
    snoozeMedicationDose,
    loadDocuments,
    openDocumentsScreen,
    resumeExtractionReview,
    openOriginalDocument,
    archiveDocument,
    restoreDocument,
    deleteDocumentPermanently,
    formatDocumentDate,
    formatDocumentSize,
    normalizeEventDate,
    parseWeightKg,
    createPetProfile,
    updatePetPhoto,
    removePetPhoto,
    archiveCurrentPet,
    restoreArchivedPet,
    deleteArchivedPet,
    deleteCurrentPet,
    exportAccountData,
    shareCurrentEmergencyCard,
    checkBackend,
    canCreateProfile,
    petEmoji,
    alteredLabel,
    alteredValue,
    persistExtractionProposal,
    pickVetRecord,
    confirmExtraction,
    todayMedicationDoses,
    pendingMedicationDoses,
    completedMedicationDoses,
    activeCareTasks,
    overdueMedicationDoses,
    dueSoonMedicationDoses,
    laterMedicationDoses,
    overdueCareTasks,
    upcomingCareTasks,
    followUpEvents,
  };
}

type PawsoContextValue = ReturnType<typeof usePawsoState>;

const PawsoContext = createContext<PawsoContextValue | null>(null);

export function PawsoProvider({ children }: { children: ReactNode }) {
  const value = usePawsoState();

  return <PawsoContext.Provider value={value}>{children}</PawsoContext.Provider>;
}

export function usePawso() {
  const value = useContext(PawsoContext);

  if (!value) {
    throw new Error('usePawso must be used inside PawsoProvider.');
  }

  return value;
}
