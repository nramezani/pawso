import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import { decode } from 'base64-arraybuffer';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import * as Linking from 'expo-linking';

import { supabase } from '../../lib/supabase';
import { API_BASE_URL } from '../config';
import {
  clearPawsoLocalNotifications,
  getLocalNotificationPermission,
  getLocalReminderPreference,
  requestLocalNotificationPermission,
  setLocalReminderPreference,
  syncPawsoLocalNotifications,
} from '../services/notifications';
import { navigateToScreen } from '../navigation/navigationRef';
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
} from '../types';

function usePawsoState() {
  const setScreen = (screen: Screen) => navigateToScreen(screen);

  const [apiStatus, setApiStatus] = useState('Checking backend...');
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState('');
  const [accountEmail, setAccountEmail] = useState('');
  const [accountIsAnonymous, setAccountIsAnonymous] = useState(true);
  const [accountBusy, setAccountBusy] = useState(false);
  const [accountMessage, setAccountMessage] = useState('');
  const [accountError, setAccountError] = useState('');
  const [secureAccountEmail, setSecureAccountEmail] = useState('');
  const [secureAccountPassword, setSecureAccountPassword] = useState('');
  const [accountAuthMode, setAccountAuthMode] = useState<'secure' | 'signin'>('secure');
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [accountRecoveryMode, setAccountRecoveryMode] = useState(false);
  const [recoveryPassword, setRecoveryPassword] = useState('');
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [householdName, setHouseholdName] = useState('My Pawso Household');
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
  const [isConfirmingExtraction, setIsConfirmingExtraction] = useState(false);
  const [currentPetId, setCurrentPetId] = useState<string | null>(null);
  const [pets, setPets] = useState<PetSummary[]>([]);
  const [allPetsToday, setAllPetsToday] = useState<PetTodaySummary[]>([]);
  const [todayView, setTodayView] = useState<'all' | 'pet'>('pet');

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
  const [followUp, setFollowUp] = useState('');

  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [petDocuments, setPetDocuments] = useState<PetDocument[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState('');
  const [openingDocumentId, setOpeningDocumentId] = useState<string | null>(null);

  const [medicationList, setMedicationList] = useState<Medication[]>([]);
  const [medicationSchedules, setMedicationSchedules] = useState<MedicationSchedule[]>([]);
  const [medicationLogs, setMedicationLogs] = useState<MedicationLog[]>([]);
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
  const [checkInDate, setCheckInDate] = useState(new Date().toISOString().slice(0, 10));
  const [checkInTitle, setCheckInTitle] = useState('');
  const [checkInDetails, setCheckInDetails] = useState('');
  const [checkInWeight, setCheckInWeight] = useState('');
  const [checkInSaving, setCheckInSaving] = useState(false);
  const [checkInError, setCheckInError] = useState('');
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
          const count = await syncPawsoLocalNotifications(rows);
          setScheduledNotificationCount(count);
        }
      }
    } catch (error) {
      console.log('Notification state error:', error);
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

      const count = await syncPawsoLocalNotifications(pets);
      setScheduledNotificationCount(count);
    } catch (error) {
      console.log('Enable notifications error:', error);
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
      console.log('Disable notifications error:', error);
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

      const count = await syncPawsoLocalNotifications(rows);
      setScheduledNotificationCount(count);
    } catch (error) {
      console.log('Notification sync error:', error);
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
        supabase.from('households').select('id, name').eq('id', id).single(),
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
      if (invitationsError && householdRole === 'owner') throw invitationsError;

      setHouseholdInvitations(invitations ?? []);
      setHouseholdName(household?.name ?? 'My Pawso Household');
      setHouseholdMembers((members ?? []) as HouseholdMember[]);

      const currentMember = (members ?? []).find(
        (member: any) => member.user_id === session.user.id
      );

      setHouseholdRole(currentMember?.role ?? null);

      if (!memberDisplayName && currentMember?.display_name) {
        setMemberDisplayName(currentMember.display_name);
      }

      return id;
    } catch (error) {
      console.log('Load household error:', error);
      setHouseholdError(
        error instanceof Error ? error.message : 'Could not load household.'
      );
      throw error;
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
    if (!householdId) return;

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
              household_name: householdName,
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
      console.log('Create household invitation error:', error);
      setHouseholdError(
        error instanceof Error ? error.message : 'Could not create invitation.'
      );
    } finally {
      setHouseholdBusy(false);
    }
  }

  async function acceptHouseholdInvite() {
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
      console.log('Accept household invitation error:', error);
      setHouseholdError(
        error instanceof Error ? error.message : 'Could not join household.'
      );
    } finally {
      setHouseholdBusy(false);
    }
  }
  function hydrateAccount(user: any) {
    setAccountEmail(user?.email ?? '');
    setAccountIsAnonymous(Boolean(user?.is_anonymous));
    if (user?.email) {
      setSecureAccountEmail(user.email);
    }
  }

  async function signInAccount() {
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

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: signInPassword,
      });

      if (error) throw error;
      if (!data.user) throw new Error('Pawso could not sign in to that account.');

      hydrateAccount(data.user);
      setSignInPassword('');
      const activeHouseholdId = await ensureHousehold(
        data.user.email?.split('@')[0]
      );
      await loadExistingPet(data.user.id, activeHouseholdId);
      setAccountMessage('Signed in. Your Pawso records are ready.');
      setScreen('pets');
    } catch (error) {
      console.log('Sign in error:', error);
      setAccountError(
        error instanceof Error ? error.message : 'Could not sign in.'
      );
    } finally {
      setAccountBusy(false);
    }
  }

  async function requestPasswordReset() {
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
      setAccountMessage(
        'Password reset email sent. Open the link on this phone to return to Pawso.'
      );
    } catch (error) {
      console.log('Password reset error:', error);
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

      hydrateAccount(data.user);
      if (type === 'recovery') {
        setAccountRecoveryMode(true);
        setAccountMessage('Enter a new password for your Pawso account.');
        setScreen('account');
      }
    } catch (error) {
      console.log('Auth callback error:', error);
      setAccountError(
        error instanceof Error
          ? error.message
          : 'Could not open the Pawso recovery link.'
      );
    }
  }

  async function completePasswordRecovery() {
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
      setRecoveryPassword('');
      setAccountRecoveryMode(false);
      const activeHouseholdId = await ensureHousehold(
        data.user.email?.split('@')[0]
      );
      await loadExistingPet(data.user.id, activeHouseholdId);
      setAccountMessage('Password updated. Your Pawso records are ready.');
      setScreen('pets');
    } catch (error) {
      console.log('Complete password recovery error:', error);
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
      console.log('Secure account error:', error);
      setAccountError(
        error instanceof Error
          ? error.message
          : 'Could not secure your Pawso account.'
      );
    } finally {
      setAccountBusy(false);
    }
  }

  async function deleteAccount() {
    try {
      setAccountBusy(true);
      setAccountError('');
      setAccountMessage('');

      const response = await fetch(`${API_BASE_URL}/api/v1/account`, {
        method: 'DELETE',
        headers: await getApiAuthHeaders(),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(getApiErrorMessage(body, 'Could not delete your Pawso account.'));
      }

      await supabase.auth.signOut();
      setAccountEmail('');
      setAccountIsAnonymous(true);
      setPets([]);
      setCurrentPetId(null);
      setHouseholdId(null);
      setHouseholdMembers([]);
      setHouseholdInvitations([]);
      setScreen('welcome');
    } catch (error) {
      console.log('Delete account error:', error);
      setAccountError(
        error instanceof Error ? error.message : 'Could not delete your Pawso account.'
      );
    } finally {
      setAccountBusy(false);
    }
  }

  async function signOutAccount() {
    try {
      setAccountBusy(true);
      setAccountError('');
      setAccountMessage('');

      if (accountIsAnonymous) {
        throw new Error(
          'Secure the anonymous account before signing out so you do not lose access to its pet records.'
        );
      }

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      const { data: anonymousData, error: anonymousError } =
        await supabase.auth.signInAnonymously();
      if (anonymousError) throw anonymousError;
      if (!anonymousData.user) {
        throw new Error('Pawso could not prepare a new temporary session.');
      }

      hydrateAccount(anonymousData.user);
      const freshHouseholdId = await ensureHousehold();
      setHouseholdId(freshHouseholdId);
      setPets([]);
      setCurrentPetId(null);
      setScreen('welcome');
      setAccountMessage('Signed out.');
    } catch (error) {
      console.log('Sign out error:', error);
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
      const activeHouseholdId = await ensureHousehold(
        activeSession.user.email?.split('@')[0]
      );
      await loadExistingPet(activeSession.user.id, activeHouseholdId);
    } catch (error) {
      console.log('Supabase initialization error:', error);

      setAuthError(
        error instanceof Error
          ? error.message
          : 'Could not connect Pawso to its database.'
      );
    } finally {
      setAuthReady(true);
    }
  }

  function hydratePet(data: PetSummary) {
    setCurrentPetId(data.id);
    setPetName(data.name ?? '');
    setPetType((data.species as PetType) ?? null);
    setBreed(data.breed ?? '');
    setPetAge(data.approximate_age ?? '');
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
  }

  async function loadPets(userId: string, targetHouseholdId?: string | null) {
    const activeHouseholdId =
      targetHouseholdId ?? householdId ?? (await ensureHousehold());

    const { data, error } = await supabase
      .from('pets')
      .select(
        'id, household_id, name, species, breed, approximate_age, sex, spayed_neutered, weight_kg, microchip_number, conditions, allergies, medications, vet_clinic, created_at'
      )
      .eq('household_id', activeHouseholdId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const rows = (data ?? []) as PetSummary[];
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
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);

      const [
        { data: careRows, error: careErrorValue },
        { data: medicationRows, error: medicationErrorValue },
      ] = await Promise.all([
        supabase
          .from('care_tasks')
          .select('id, pet_id, due_at, is_active')
          .in('pet_id', petIds)
          .eq('is_active', true)
          .lt('due_at', end.toISOString()),
        supabase
          .from('medications')
          .select('id, pet_id, is_active')
          .in('pet_id', petIds)
          .eq('is_active', true),
      ]);

      if (careErrorValue) throw careErrorValue;
      if (medicationErrorValue) throw medicationErrorValue;

      const medicationIds = (medicationRows ?? []).map((item) => item.id);
      let scheduleRows: Array<{ id: string; medication_id: string; pet_id: string; time_of_day: string }> = [];
      let logRows: Array<{ schedule_id: string | null; pet_id: string; status: string }> = [];

      if (medicationIds.length > 0) {
        const [
          { data: schedules, error: schedulesError },
          { data: logs, error: logsError },
        ] = await Promise.all([
          supabase
            .from('medication_schedules')
            .select('id, medication_id, pet_id, time_of_day')
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
        (medicationRows ?? []).map((item) => [item.id, item.pet_id])
      );
      const completedScheduleIds = new Set(
        logRows
          .filter((log) => log.schedule_id)
          .map((log) => log.schedule_id as string)
      );

      const summaries: PetTodaySummary[] = rows.map((pet) => {
        const petCare = (careRows ?? []).filter((task) => task.pet_id === pet.id);
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
          const [hours, minutes] = schedule.time_of_day.split(':').map(Number);
          const scheduled = new Date(now);
          scheduled.setHours(hours || 0, minutes || 0, 0, 0);
          return scheduled.getTime() < now.getTime() - 30 * 60 * 1000;
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
      console.log('Load all pets Today summary error:', error);
    }
  }

  async function selectPet(petId: string, destination?: Screen) {
    try {
      setDatabaseError('');
      let pet = pets.find((item) => item.id === petId);

      if (!pet) {
        const { data, error } = await supabase
          .from('pets')
          .select(
            'id, household_id, name, species, breed, approximate_age, sex, spayed_neutered, weight_kg, microchip_number, conditions, allergies, medications, vet_clinic, created_at'
          )
          .eq('id', petId)
          .single();

        if (error) throw error;
        pet = data as PetSummary;
      }

      hydratePet(pet);
      setAskAnswer(null);
      setAskSources([]);
      setAskError('');

      await Promise.all([
        loadTimeline(pet.id),
        loadMedicationData(pet.id),
        loadCareData(pet.id),
      ]);

      if (destination) setScreen(destination);
    } catch (error) {
      console.log('Select pet error:', error);
      setDatabaseError(
        error instanceof Error ? error.message : 'Could not switch pets.'
      );
    }
  }

  function startAddPet() {
    setPetName('');
    setPetType(null);
    setBreed('');
    setPetAge('');
    setPetSex(null);
    setAlteredStatus(null);
    setWeight('');
    setMicrochip('');
    setConditions('');
    setAllergies('');
    setMedications('');
    setVetClinic('');
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
      setTodayView('pet');
      return;
    }

    const selected =
      rows.find((pet) => pet.id === currentPetId) ??
      rows[0];

    hydratePet(selected);

    await Promise.all([
      loadTimeline(selected.id),
      loadMedicationData(selected.id),
      loadCareData(selected.id),
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
          text: [
            medication.name,
            medication.dose,
            medication.unit,
            medication.instructions,
            scheduleTimes ? `Schedule: ${scheduleTimes}` : null,
          ]
            .filter(Boolean)
            .join(' · '),
        });
      }

      for (const task of careTasks) {
        sources.push({
          id: `care:${task.id}`,
          label: task.title,
          source_type: 'Confirmed care task',
          date: task.due_at,
          text: [
            task.title,
            task.notes,
            `Due: ${new Date(task.due_at).toLocaleString()}`,
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
      console.log('Ask Pawso error:', error);
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
          text: [
            medication.name,
            medication.dose,
            medication.unit,
            medication.instructions,
            scheduleTimes ? `Schedule: ${scheduleTimes}` : null,
          ].filter(Boolean).join(' · '),
        });
      }

      for (const task of careTasks) {
        sources.push({
          id: `care:${task.id}`,
          label: task.title,
          source_type: 'Confirmed care task',
          date: task.due_at,
          text: [task.title, task.notes, `Due: ${new Date(task.due_at).toLocaleString()}`]
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
      console.log('Vet Visit Prep error:', error);
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

  function openHealthCheckIn(type: 'symptom' | 'weight') {
    setCheckInType(type);
    setCheckInDate(new Date().toISOString().slice(0, 10));
    setCheckInTitle('');
    setCheckInDetails('');
    setCheckInWeight('');
    setCheckInError('');
    setScreen('healthCheckIn');
  }

  async function saveHealthCheckIn() {
    if (!currentPetId) return;

    const validDate = /^\d{4}-\d{2}-\d{2}$/.test(checkInDate.trim());
    if (!validDate || Number.isNaN(new Date(`${checkInDate}T12:00:00`).getTime())) {
      setCheckInError('Enter the date as YYYY-MM-DD.');
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

    try {
      setCheckInSaving(true);
      setCheckInError('');

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session?.user) throw new Error('Pawso session is not ready. Please try again.');

      const event = checkInType === 'symptom'
        ? {
            pet_id: currentPetId,
            user_id: session.user.id,
            event_type: 'owner_symptom',
            event_date: checkInDate.trim(),
            title: checkInTitle.trim(),
            description: checkInDetails.trim() || 'No additional details provided.',
            source_type: 'owner_note',
          }
        : {
            pet_id: currentPetId,
            user_id: session.user.id,
            event_type: 'weight',
            event_date: checkInDate.trim(),
            title: `Weight recorded: ${weightValue} kg`,
            description: checkInDetails.trim() || 'Owner-recorded weight.',
            source_type: 'owner_note',
          };

      const { error: insertError } = await supabase.from('medical_events').insert(event);
      if (insertError) throw insertError;

      if (checkInType === 'weight') {
        const { error: updateError } = await supabase
          .from('pets')
          .update({ weight_kg: weightValue })
          .eq('id', currentPetId);
        if (updateError) throw updateError;

        setWeight(`${weightValue} kg`);
        setPets((current) => current.map((pet) =>
          pet.id === currentPetId ? { ...pet, weight_kg: weightValue } : pet
        ));
      }

      await loadTimeline(currentPetId);
      setScreen('timeline');
    } catch (error) {
      console.log('Health Check-In error:', error);
      setCheckInError(
        error instanceof Error ? error.message : 'Could not save this check-in.'
      );
    } finally {
      setCheckInSaving(false);
    }
  }

  function openSmartCarePlan() {
    setSmartCareError('');
    setScreen('smartCarePlan');
  }

  async function generateSmartCarePlan() {
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

      for (const medication of medicationList) {
        const times = medicationSchedules
          .filter((schedule) => schedule.medication_id === medication.id)
          .map((schedule) => schedule.time_of_day)
          .join(', ');
        sources.push({
          id: `medication:${medication.id}`,
          label: medication.name,
          source_type: 'Confirmed medication record',
          text: [medication.name, medication.dose, medication.unit, medication.instructions, times ? `Schedule: ${times}` : null]
            .filter(Boolean).join(' · '),
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
      if (!response.ok) throw new Error(body.detail || 'Smart Care Plan request failed.');
      setSmartCareSuggestions(body.suggestions as SmartCareSuggestion[]);
    } catch (error) {
      console.log('Smart Care Plan error:', error);
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
        .select('id, title, notes, due_at, task_type, is_active')
        .eq('pet_id', petId)
        .eq('is_active', true)
        .order('due_at', { ascending: true });

      if (tasksError) throw tasksError;

      const taskIds = (tasks ?? []).map((task) => task.id);
      let completions: TaskCompletion[] = [];

      if (taskIds.length > 0) {
        const { data: completionRows, error: completionError } = await supabase
          .from('task_completions')
          .select('id, task_id, completed_at, actor_name')
          .in('task_id', taskIds);

        if (completionError) throw completionError;
        completions = (completionRows ?? []) as TaskCompletion[];
      }

      setCareTasks((tasks ?? []) as CareTask[]);
      setTaskCompletions(completions);
    } catch (error) {
      console.log('Load care data error:', error);
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

    const value = new Date(`${date}T${time}:00`);

    if (Number.isNaN(value.getTime())) {
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

      const { error } = await supabase.from('care_tasks').insert({
        pet_id: currentPetId,
        user_id: session.user.id,
        title: newCareTitle.trim(),
        notes: newCareNotes.trim() || null,
        due_at: dueDate.toISOString(),
        task_type: 'general',
        is_active: true,
      });

      if (error) throw error;

      setNewCareTitle('');
      setNewCareNotes('');
      setNewCareDate('');
      setNewCareTime('09:00');

      await loadCareData(currentPetId);
      await refreshAllPetsToday();
      await syncNotificationsIfEnabled();
      setScreen('care');
    } catch (error) {
      console.log('Create care task error:', error);
      setCareError(
        error instanceof Error ? error.message : 'Could not save this care task.'
      );
    } finally {
      setSavingCareTask(false);
    }
  }

  async function completeCareTask(task: CareTask) {
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

      const { error } = await supabase.from('task_completions').insert({
        task_id: task.id,
        pet_id: currentPetId,
        user_id: session.user.id,
        actor_name: actorName,
        completed_at: new Date().toISOString(),
      });

      if (error) throw error;

      const { error: taskError } = await supabase
        .from('care_tasks')
        .update({ is_active: false })
        .eq('id', task.id);

      if (taskError) throw taskError;

      await loadCareData(currentPetId);
      await refreshAllPetsToday();
      await syncNotificationsIfEnabled();
    } catch (error) {
      console.log('Complete care task error:', error);
      setCareError(
        error instanceof Error ? error.message : 'Could not complete this care task.'
      );
    } finally {
      setCompletingTaskId(null);
    }
  }

  async function deleteCareTask(task: CareTask) {
    if (!currentPetId) return;

    try {
      setDeletingTaskId(task.id);
      setCareError('');

      const { error } = await supabase.from('care_tasks').delete().eq('id', task.id);

      if (error) throw error;

      await loadCareData(currentPetId);
      await refreshAllPetsToday();
      await syncNotificationsIfEnabled();
    } catch (error) {
      console.log('Delete care task error:', error);
      setCareError(
        error instanceof Error ? error.message : 'Could not delete this care task.'
      );
    } finally {
      setDeletingTaskId(null);
    }
  }

  function formatDueLabel(value: string) {
    const due = new Date(value);
    const now = new Date();

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const nextDayStart = new Date(tomorrowStart);
    nextDayStart.setDate(nextDayStart.getDate() + 1);

    const time = due.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });

    if (due < now) return `Overdue · ${due.toLocaleDateString()} ${time}`;
    if (due >= todayStart && due < tomorrowStart) return `Today · ${time}`;
    if (due >= tomorrowStart && due < nextDayStart) return `Tomorrow · ${time}`;

    return `${due.toLocaleDateString()} · ${time}`;
  }

  function getMedicationUrgency(dose: TodayMedicationDose) {
    if (dose.log) return 'done';

    const now = new Date();
    const diffMinutes = (dose.scheduledFor.getTime() - now.getTime()) / 60000;

    if (diffMinutes < -30) return 'overdue';
    if (diffMinutes <= 60) return 'dueSoon';
    return 'later';
  }

  async function loadMedicationData(petId: string) {
    try {
      setMedicationsLoading(true);
      setMedicationsError('');

      const { data: meds, error: medsError } = await supabase
        .from('medications')
        .select('id, name, dose, unit, instructions, is_active')
        .eq('pet_id', petId)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (medsError) throw medsError;

      const medicationIds = (meds ?? []).map((med) => med.id);

      let schedules: MedicationSchedule[] = [];
      let logs: MedicationLog[] = [];

      if (medicationIds.length > 0) {
        const { data: scheduleRows, error: schedulesError } = await supabase
          .from('medication_schedules')
          .select('id, medication_id, time_of_day')
          .in('medication_id', medicationIds)
          .order('time_of_day', { ascending: true });

        if (schedulesError) throw schedulesError;
        schedules = (scheduleRows ?? []) as MedicationSchedule[];

        const start = new Date();
        start.setHours(0, 0, 0, 0);

        const end = new Date(start);
        end.setDate(end.getDate() + 1);

        const { data: logRows, error: logsError } = await supabase
          .from('medication_logs')
          .select('id, medication_id, schedule_id, scheduled_for, status, logged_at, note, actor_name')
          .eq('pet_id', petId)
          .gte('scheduled_for', start.toISOString())
          .lt('scheduled_for', end.toISOString());

        if (logsError) throw logsError;
        logs = (logRows ?? []) as MedicationLog[];
      }

      setMedicationList((meds ?? []) as Medication[]);
      setMedicationSchedules(schedules);
      setMedicationLogs(logs);
    } catch (error) {
      console.log('Load medication data error:', error);
      setMedicationsError(
        error instanceof Error ? error.message : 'Could not load medications.'
      );
    } finally {
      setMedicationsLoading(false);
    }
  }

  function buildScheduledDate(timeOfDay: string) {
    const [hours, minutes] = timeOfDay.split(':').map(Number);
    const date = new Date();
    date.setHours(hours || 0, minutes || 0, 0, 0);
    return date;
  }

  function getTodayMedicationDoses(): TodayMedicationDose[] {
    const doses: TodayMedicationDose[] = [];

    for (const schedule of medicationSchedules) {
      const medication = medicationList.find(
        (item) => item.id === schedule.medication_id
      );

      if (!medication) continue;

      const scheduledFor = buildScheduledDate(schedule.time_of_day);
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
    });
  }

  async function openMedicationsScreen() {
    if (!currentPetId) return;
    await loadMedicationData(currentPetId);
    setScreen('medications');
  }

  async function createMedication() {
    if (!currentPetId || !newMedicationName.trim()) {
      return;
    }

    const times = newMedicationTimes
      .map((time) => time.trim())
      .filter(Boolean)
      .filter((value, index, array) => array.indexOf(value) === index);

    const validTime = /^([01]\\d|2[0-3]):[0-5]\\d$/;
    if (times.length === 0 || times.some((time) => !validTime.test(time))) {
      setMedicationsError('Add at least one valid time in 24-hour format, such as 08:00.');
      return;
    }

    try {
      setIsSavingMedication(true);
      setMedicationsError('');

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;
      if (!session?.user) throw new Error('Pawso session is not ready.');

      const { data: medicationRow, error: medicationError } = await supabase
        .from('medications')
        .insert({
          pet_id: currentPetId,
          user_id: session.user.id,
          name: newMedicationName.trim(),
          dose: newMedicationDose.trim() || null,
          unit: newMedicationUnit.trim() || null,
          instructions: newMedicationInstructions.trim() || null,
          is_active: true,
        })
        .select('id')
        .single();

      if (medicationError) throw medicationError;

      const scheduleRows = times.map((time) => ({
        medication_id: medicationRow.id,
        pet_id: currentPetId,
        user_id: session.user.id,
        time_of_day: time,
      }));

      const { error: scheduleError } = await supabase
        .from('medication_schedules')
        .insert(scheduleRows);

      if (scheduleError) throw scheduleError;

      setNewMedicationName('');
      setNewMedicationDose('');
      setNewMedicationUnit('');
      setNewMedicationInstructions('');
      setNewMedicationTimes(['08:00']);

      await loadMedicationData(currentPetId);
      await refreshAllPetsToday();
      await syncNotificationsIfEnabled();
      setScreen('medications');
    } catch (error) {
      console.log('Create medication error:', error);
      setMedicationsError(
        error instanceof Error ? error.message : 'Could not save this medication.'
      );
    } finally {
      setIsSavingMedication(false);
    }
  }

  async function deleteMedication(medication: Medication) {
    if (!currentPetId) return;

    try {
      setDeletingMedicationId(medication.id);
      setMedicationsError('');

      // medication_schedules/medication_logs reference medications with
      // "on delete cascade" (see 20260911_core_schema.sql), so deleting the
      // medication row also removes its schedules and dose history.
      const { error } = await supabase.from('medications').delete().eq('id', medication.id);

      if (error) throw error;

      await loadMedicationData(currentPetId);
      await refreshAllPetsToday();
      await syncNotificationsIfEnabled();
    } catch (error) {
      console.log('Delete medication error:', error);
      setMedicationsError(
        error instanceof Error ? error.message : 'Could not delete this medication.'
      );
    } finally {
      setDeletingMedicationId(null);
    }
  }

  async function logMedicationDose(
    dose: TodayMedicationDose,
    status: 'given' | 'skipped'
  ) {
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
        const { error } = await supabase
          .from('medication_logs')
          .update({
            status,
            actor_name:
              householdMembers.find((member) => member.user_id === session.user.id)
                ?.display_name ??
              session.user.email?.split('@')[0] ??
              'Household member',
            logged_at: new Date().toISOString(),
          })
          .eq('id', existingLog.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('medication_logs')
          .insert({
            medication_id: dose.medication.id,
            schedule_id: dose.schedule.id,
            pet_id: currentPetId,
            user_id: session.user.id,
            actor_name:
              householdMembers.find((member) => member.user_id === session.user.id)
                ?.display_name ??
              session.user.email?.split('@')[0] ??
              'Household member',
            scheduled_for: dose.scheduledFor.toISOString(),
            status,
            logged_at: new Date().toISOString(),
          });

        if (error) throw error;
      }

      await loadMedicationData(currentPetId);
      await refreshAllPetsToday();
    } catch (error) {
      console.log('Log medication dose error:', error);
      setMedicationsError(
        error instanceof Error ? error.message : 'Could not update this dose.'
      );
    } finally {
      setLoggingDoseId(null);
    }
  }

  async function loadDocuments(petId: string) {
    try {
      setDocumentsLoading(true);
      setDocumentsError('');

      const { data: documents, error: documentsQueryError } = await supabase
        .from('documents')
        .select('id, filename, content_type, size_bytes, status, storage_path, created_at')
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

      setPetDocuments((documents ?? []).map((document) => ({
        ...document,
        linked_events: counts.get(document.id) ?? 0,
      })));
    } catch (error) {
      console.log('Load documents error:', error);
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
      console.log('Open original document error:', error);
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

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }

    return null;
  }

  function parseWeightKg(value: string) {
    if (!value.trim()) {
      return null;
    }

    const match = value.replace(',', '.').match(/\d+(\.\d+)?/);

    return match ? Number(match[0]) : null;
  }

  async function createPetProfile() {
    if (!canCreateProfile || !petType) {
      return;
    }

    try {
      setIsSavingPet(true);
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

      const { data, error } = await supabase
        .from('pets')
        .insert({
          user_id: session.user.id,
          household_id: householdId ?? (await ensureHousehold()),
          name: petName.trim(),
          species: petType,
          breed: breed.trim() || null,
          approximate_age: petAge.trim() || null,
          sex: petSex,
          spayed_neutered:
            alteredStatus === 'yes'
              ? true
              : alteredStatus === 'no'
              ? false
              : null,
          weight_kg: parseWeightKg(weight),
          microchip_number: microchip.trim() || null,
          conditions: conditions.trim() || null,
          allergies: allergies.trim() || null,
          medications: medications.trim() || null,
          vet_clinic: vetClinic.trim() || null,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      const createdPet = data as PetSummary;
      hydratePet(createdPet);

      const updatedPets = await loadPets(session.user.id);
      await refreshAllPetsToday(updatedPets);
      await Promise.all([
        loadTimeline(createdPet.id),
        loadMedicationData(createdPet.id),
        loadCareData(createdPet.id),
      ]);

      setTodayView(updatedPets.length > 1 ? 'all' : 'pet');
      setScreen('petProfile');
    } catch (error) {
      console.log('Create pet error:', error);

      setDatabaseError(
        error instanceof Error
          ? error.message
          : 'Could not save this pet.'
      );
    } finally {
      setIsSavingPet(false);
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
      console.log('Backend connection error:', error);
      setApiStatus('Backend unavailable');
    }
  }

  const canCreateProfile =
    petName.trim() !== '' && petType !== null;

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
  }: {
    filename: string;
    contentType: string;
    sizeBytes: number | null;
    localUri: string;
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
      console.log('Supabase Storage upload error:', storageError);
      throw storageError;
    }

    const { data: extractionRow, error: extractionError } = await supabase
      .from('ai_extractions')
      .insert({
        document_id: documentRow.id,
        model: 'gpt-5.6-luna',
        schema_version: '1.0',
        status: 'proposed',
      })
      .select('id')
      .single();

    if (extractionError) {
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
        throw fieldError;
      }
    }

    setCurrentDocumentId(documentRow.id);
    setCurrentExtractionId(extractionRow.id);
  }

  async function pickVetRecord() {
  try {
    setUploadError('');

    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];

    setDocumentName(asset.name);
    setDocumentSize(asset.size ?? null);
    setDocumentContentType(asset.mimeType || 'application/octet-stream');
    setCurrentDocumentId(null);
    setCurrentExtractionId(null);
    setScreen('processing');

    const uploadResult = await FileSystem.uploadAsync(
      `${API_BASE_URL}/api/v1/documents/extract`,
      asset.uri,
      {
        httpMethod: 'POST',
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: 'file',
        headers: await getApiAuthHeaders(),
        mimeType:
          asset.mimeType || 'application/octet-stream',
      }
    );

    if (
      uploadResult.status < 200 ||
      uploadResult.status >= 300
    ) {
      throw new Error(
        `Upload failed (${uploadResult.status}): ${uploadResult.body}`
      );
    }

    const data = JSON.parse(uploadResult.body);

    console.log('Document upload response:', data);

    setDocumentName(
      data.document?.filename || asset.name
    );

    setDocumentSize(
      data.document?.size_bytes ??
        asset.size ??
        null
    );

    setVisitDate(
      data.extraction?.visit_date || ''
    );

    setClinic(
      data.extraction?.clinic || ''
    );

    setFinding(
      data.extraction?.finding || ''
    );

    setDiagnosis(
      data.extraction?.diagnosis || ''
    );

    setFollowUp(
      data.extraction?.follow_up || ''
    );

    const resolvedContentType =
      data.document?.content_type ||
      asset.mimeType ||
      'application/octet-stream';

    setDocumentContentType(resolvedContentType);

    await persistExtractionProposal({
      filename: data.document?.filename || asset.name,
      contentType: resolvedContentType,
      sizeBytes:
        data.document?.size_bytes ??
        asset.size ??
        null,
      localUri: asset.uri,
      extraction: data.extraction ?? {},
    });

    setScreen('review');
  } catch (error) {
    console.log('Document upload error:', error);

    setUploadError(
      error instanceof Error
        ? error.message
        : 'Something went wrong while uploading the file.'
    );

    setScreen('today');
  }
}

  async function confirmExtraction() {
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

      const eventDate = normalizeEventDate(visitDate);

      const eventsToInsert = [
        {
          pet_id: currentPetId,
          document_id: currentDocumentId,
          user_id: session.user.id,
          event_type: 'vet_visit',
          event_date: eventDate,
          title: finding.trim() || 'Veterinary record added',
          description:
            diagnosis.trim() ||
            'Veterinary record confirmed by the owner.',
          source_type: 'veterinary_record',
        },
      ];

      if (followUp.trim()) {
        eventsToInsert.push({
          pet_id: currentPetId,
          document_id: currentDocumentId,
          user_id: session.user.id,
          event_type: 'follow_up',
          event_date: eventDate,
          title: 'Follow-up recommended',
          description: followUp.trim(),
          source_type: 'veterinary_record',
        });
      }

      if (currentExtractionId) {
        const confirmedFields = [
          ['visit_date', visitDate.trim()],
          ['clinic', clinic.trim()],
          ['finding', finding.trim()],
          ['diagnosis', diagnosis.trim()],
          ['follow_up', followUp.trim()],
        ];

        for (const [fieldType, confirmedValue] of confirmedFields) {
          const { error: fieldUpdateError } = await supabase
            .from('extracted_fields')
            .update({
              status: 'confirmed',
              confirmed_value: confirmedValue || null,
              confirmed_by: session.user.id,
              confirmed_at: new Date().toISOString(),
            })
            .eq('extraction_id', currentExtractionId)
            .eq('field_type', fieldType);

          if (fieldUpdateError) {
            throw fieldUpdateError;
          }
        }

        const { error: extractionUpdateError } = await supabase
          .from('ai_extractions')
          .update({
            status: 'confirmed',
          })
          .eq('id', currentExtractionId);

        if (extractionUpdateError) {
          throw extractionUpdateError;
        }
      }

      if (currentDocumentId) {
        const { error: documentUpdateError } = await supabase
          .from('documents')
          .update({
            status: 'confirmed',
          })
          .eq('id', currentDocumentId);

        if (documentUpdateError) {
          throw documentUpdateError;
        }
      }

      const { error } = await supabase
        .from('medical_events')
        .insert(eventsToInsert);

      if (error) {
        throw error;
      }

      await loadTimeline(currentPetId);
      setCurrentDocumentId(null);
      setCurrentExtractionId(null);
      setScreen('timeline');
    } catch (error) {
      console.log('Confirm extraction error:', error);

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
    (task) => !taskCompletions.some((completion) => completion.task_id === task.id)
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
    refreshHousehold,
    removeHouseholdMember,
    cancelHouseholdInvitation,
    createHouseholdInvite,
    acceptHouseholdInvite,
    accountEmail,
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
    signInAccount,
    requestPasswordReset,
    accountRecoveryMode,
    recoveryPassword,
    setRecoveryPassword,
    completePasswordRecovery,
    secureAccount,
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
    isConfirmingExtraction,
    setIsConfirmingExtraction,
    currentPetId,
    setCurrentPetId,
    pets,
    setPets,
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
    followUp,
    setFollowUp,
    timelineEvents,
    setTimelineEvents,
    petDocuments,
    setPetDocuments,
    documentsLoading,
    setDocumentsLoading,
    documentsError,
    setDocumentsError,
    openingDocumentId,
    setOpeningDocumentId,
    medicationList,
    setMedicationList,
    medicationSchedules,
    setMedicationSchedules,
    medicationLogs,
    setMedicationLogs,
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
    smartCareSuggestions,
    smartCareLoading,
    smartCareError,
    notificationPermission,
    notificationsEnabled,
    notificationSyncing,
    scheduledNotificationCount,
    notificationError,
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
    cancelAddPet,
    loadTimeline,
    askPawso,
    openAskScreen,
    getAskSourceLabel,
    generateVetVisitPrep,
    openVetVisitPrep,
    openHealthCheckIn,
    saveHealthCheckIn,
    openSmartCarePlan,
    generateSmartCarePlan,
    acceptSmartCareSuggestion,
    getSmartCareSourceLabel,
    loadCareData,
    parseCareDateTime,
    openCareScreen,
    createCareTask,
    completeCareTask,
    deleteCareTask,
    deletingTaskId,
    formatDueLabel,
    getMedicationUrgency,
    loadMedicationData,
    buildScheduledDate,
    getTodayMedicationDoses,
    formatMedicationTime,
    openMedicationsScreen,
    createMedication,
    deleteMedication,
    deletingMedicationId,
    logMedicationDose,
    loadDocuments,
    openDocumentsScreen,
    openOriginalDocument,
    formatDocumentDate,
    formatDocumentSize,
    normalizeEventDate,
    parseWeightKg,
    createPetProfile,
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
