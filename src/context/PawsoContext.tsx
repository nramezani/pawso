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
import { Linking } from 'react-native';

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
  PetSummary,
  PetTodaySummary,
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
  const [loggingDoseId, setLoggingDoseId] = useState<string | null>(null);

  const [newMedicationName, setNewMedicationName] = useState('');
  const [newMedicationDose, setNewMedicationDose] = useState('');
  const [newMedicationUnit, setNewMedicationUnit] = useState('');
  const [newMedicationInstructions, setNewMedicationInstructions] = useState('');
  const [newMedicationTime1, setNewMedicationTime1] = useState('08:00');
  const [newMedicationTime2, setNewMedicationTime2] = useState('');

  const [careTasks, setCareTasks] = useState<CareTask[]>([]);
  const [taskCompletions, setTaskCompletions] = useState<TaskCompletion[]>([]);
  const [careLoading, setCareLoading] = useState(false);
  const [careError, setCareError] = useState('');
  const [savingCareTask, setSavingCareTask] = useState(false);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);

  const [newCareTitle, setNewCareTitle] = useState('');
  const [newCareNotes, setNewCareNotes] = useState('');
  const [newCareDate, setNewCareDate] = useState('');
  const [newCareTime, setNewCareTime] = useState('09:00');

  const [askQuestion, setAskQuestion] = useState('');
  const [askAnswer, setAskAnswer] = useState<AskAnswer | null>(null);
  const [askSources, setAskSources] = useState<AskSource[]>([]);
  const [askLoading, setAskLoading] = useState(false);
  const [askError, setAskError] = useState('');
  const [notificationPermission, setNotificationPermission] = useState<
    'granted' | 'denied' | 'undetermined'
  >('undetermined');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationSyncing, setNotificationSyncing] = useState(false);
  const [scheduledNotificationCount, setScheduledNotificationCount] = useState(0);
  const [notificationError, setNotificationError] = useState('');

  useEffect(() => {
    checkBackend();
    initializeSupabase();
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

  function hydrateAccount(user: any) {
    setAccountEmail(user?.email ?? '');
    setAccountIsAnonymous(Boolean(user?.is_anonymous));
    if (user?.email) {
      setSecureAccountEmail(user.email);
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

      setAccountEmail('');
      setAccountIsAnonymous(true);
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
      await loadExistingPet(activeSession.user.id);
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

  async function loadPets(userId: string) {
    const { data, error } = await supabase
      .from('pets')
      .select(
        'id, name, species, breed, approximate_age, sex, spayed_neutered, weight_kg, microchip_number, conditions, allergies, medications, vet_clinic, created_at'
      )
      .eq('user_id', userId)
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
            'id, name, species, breed, approximate_age, sex, spayed_neutered, weight_kg, microchip_number, conditions, allergies, medications, vet_clinic, created_at'
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

  async function loadExistingPet(userId: string) {
    const rows = await loadPets(userId);

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

      setAskSources(sources);

      const response = await fetch(`${API_BASE_URL}/api/v1/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
          sources,
        }),
      });

      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.detail || body.message || 'Ask Pawso request failed.');
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
          .select('id, task_id, completed_at')
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

      const { error } = await supabase.from('task_completions').insert({
        task_id: task.id,
        pet_id: currentPetId,
        user_id: session.user.id,
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
          .select('id, medication_id, schedule_id, scheduled_for, status, logged_at, note')
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
    if (!currentPetId || !newMedicationName.trim() || !newMedicationTime1.trim()) {
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

      const times = [newMedicationTime1.trim(), newMedicationTime2.trim()]
        .filter(Boolean)
        .filter((value, index, array) => array.indexOf(value) === index);

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
      setNewMedicationTime1('08:00');
      setNewMedicationTime2('');

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
    accountEmail,
    accountIsAnonymous,
    accountBusy,
    accountMessage,
    accountError,
    secureAccountEmail,
    setSecureAccountEmail,
    secureAccountPassword,
    setSecureAccountPassword,
    secureAccount,
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
    newMedicationTime1,
    setNewMedicationTime1,
    newMedicationTime2,
    setNewMedicationTime2,
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
    loadCareData,
    parseCareDateTime,
    openCareScreen,
    createCareTask,
    completeCareTask,
    formatDueLabel,
    getMedicationUrgency,
    loadMedicationData,
    buildScheduledDate,
    getTodayMedicationDoses,
    formatMedicationTime,
    openMedicationsScreen,
    createMedication,
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
