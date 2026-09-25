import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants, { AppOwnership } from 'expo-constants';
import { Platform } from 'react-native';

import { supabase } from '../../lib/supabase';
import {
  addDaysToDateInput,
  formatDateInputInTimeZone,
  parseDateTimeInTimeZone,
} from '../utils/dateTime';

const ENABLED_KEY = 'pawso.localRemindersEnabled';
const CHANNEL_ID = 'pawso-care-reminders';
let notificationHandlerConfigured = false;

async function getNotifications() {
  if (Constants.appOwnership === AppOwnership.Expo) {
    return null;
  }

  const Notifications = await import('expo-notifications');

  if (!notificationHandlerConfigured) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    notificationHandlerConfigured = true;
  }

  return Notifications;
}

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;

  const Notifications = await getNotifications();
  if (!Notifications) return;

  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Pawso care reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
  });
}

export async function getLocalReminderPreference() {
  return (await AsyncStorage.getItem(ENABLED_KEY)) === 'true';
}

export async function setLocalReminderPreference(enabled: boolean) {
  await AsyncStorage.setItem(ENABLED_KEY, enabled ? 'true' : 'false');
}

export async function getLocalNotificationPermission() {
  const Notifications = await getNotifications();
  if (!Notifications) return 'denied' as const;

  const permission = await Notifications.getPermissionsAsync();
  return permission.status;
}

export async function requestLocalNotificationPermission() {
  await ensureAndroidChannel();

  const Notifications = await getNotifications();
  if (!Notifications) return 'denied' as const;

  const current = await Notifications.getPermissionsAsync();
  if (current.status === 'granted') return current.status;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.status;
}

export async function clearPawsoLocalNotifications() {
  const Notifications = await getNotifications();
  if (!Notifications) return;

  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function subscribeToPawsoNotificationResponses(
  onOpen: (data: Record<string, unknown>) => void | Promise<void>
) {
  const Notifications = await getNotifications();
  if (!Notifications) return () => {};

  const openResponse = async (response: {
    notification: { request: { content: { data?: Record<string, unknown> } } };
  }) => {
    try {
      await onOpen(response.notification.request.content.data ?? {});
    } finally {
      await Notifications.clearLastNotificationResponseAsync();
    }
  };

  const subscription = Notifications.addNotificationResponseReceivedListener(
    openResponse
  );
  const lastResponse = await Notifications.getLastNotificationResponseAsync();
  if (lastResponse) await openResponse(lastResponse);

  return () => subscription.remove();
}

export async function syncPawsoLocalNotifications(
  pets: { id: string; name: string }[],
  timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
) {
  const Notifications = await getNotifications();
  if (!Notifications) return 0;

  await ensureAndroidChannel();

  const enabled = await getLocalReminderPreference();
  if (!enabled) {
    await clearPawsoLocalNotifications();
    return 0;
  }

  const permission = await Notifications.getPermissionsAsync();
  if (permission.status !== 'granted') {
    return 0;
  }

  await clearPawsoLocalNotifications();

  if (pets.length === 0) return 0;

  const petIds = pets.map((pet) => pet.id);
  const petNameById = new Map(pets.map((pet) => [pet.id, pet.name]));
  let scheduledCount = 0;
  const now = Date.now();

  const { data: careTasks, error: careError } = await supabase
    .from('care_tasks')
    .select('id, pet_id, title, due_at, is_active, paused_at')
    .in('pet_id', petIds)
    .eq('is_active', true)
    .is('paused_at', null)
    .gt('due_at', new Date(now).toISOString())
    .order('due_at', { ascending: true })
    // Keep room under iOS's scheduled-notification ceiling for medications.
    .limit(30);

  if (careError) throw careError;

  for (const task of careTasks ?? []) {
    if (task.paused_at) continue;
    const due = new Date(task.due_at);
    if (Number.isNaN(due.getTime()) || due.getTime() <= now) continue;

    const petName = petNameById.get(task.pet_id) ?? 'your pet';

    await Notifications.scheduleNotificationAsync({
      identifier: `care:${task.id}`,
      content: {
        title: `${petName} · Care reminder`,
        body: task.title,
        sound: 'default',
        data: {
          kind: 'care_task',
          petId: task.pet_id,
          taskId: task.id,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: due,
        channelId: CHANNEL_ID,
      },
    });

    scheduledCount += 1;
  }

  const { data: medications, error: medicationError } = await supabase
    .from('medications')
    .select('id, pet_id, name, dose, unit, is_active, paused_at, start_date, end_date')
    .in('pet_id', petIds)
    .eq('is_active', true);

  if (medicationError) throw medicationError;

  const activeMedications = (medications ?? []).filter((medication) => !medication.paused_at);
  const medicationIds = activeMedications.map((medication) => medication.id);

  if (medicationIds.length > 0) {
    const { data: schedules, error: scheduleError } = await supabase
      .from('medication_schedules')
      .select('id, medication_id, pet_id, time_of_day, snoozed_until')
      .in('medication_id', medicationIds);

    if (scheduleError) throw scheduleError;

    const medicationById = new Map(
      activeMedications.map((medication) => [medication.id, medication])
    );

    const occurrences: {
      date: Date;
      schedule: NonNullable<typeof schedules>[number];
      medication: (typeof activeMedications)[number];
    }[] = [];
    const today = formatDateInputInTimeZone(new Date(), timeZone);
    for (let dayOffset = 0; dayOffset < 30; dayOffset += 1) {
      const dateValue = addDaysToDateInput(today, dayOffset);
      for (const schedule of schedules ?? []) {
        const medication = medicationById.get(schedule.medication_id);
        if (!medication) continue;
        if (medication.start_date && dateValue < medication.start_date) continue;
        if (medication.end_date && dateValue > medication.end_date) continue;
        const snoozedDate =
          dayOffset === 0 && schedule.snoozed_until
            ? new Date(schedule.snoozed_until)
            : null;
        const date =
          snoozedDate &&
          !Number.isNaN(snoozedDate.getTime()) &&
          snoozedDate.getTime() > now
            ? snoozedDate
            : parseDateTimeInTimeZone(
                dateValue,
                String(schedule.time_of_day).slice(0, 5),
                timeZone
              );
        if (!date || date.getTime() <= now) continue;
        occurrences.push({ date, schedule, medication });
      }
    }

    occurrences.sort((a, b) => a.date.getTime() - b.date.getTime());
    const capacity = Math.max(0, 60 - scheduledCount);
    for (const occurrence of occurrences.slice(0, capacity)) {
      const { schedule, medication, date } = occurrence;

      const petName = petNameById.get(schedule.pet_id) ?? 'your pet';
      const dose = [medication.dose, medication.unit].filter(Boolean).join(' ');

      await Notifications.scheduleNotificationAsync({
        identifier: `medication:${schedule.id}:${date.toISOString().slice(0, 10)}`,
        content: {
          title: `${petName} · Medication`,
          body: dose
            ? `${medication.name} · ${dose}`
            : medication.name,
          sound: 'default',
          data: {
            kind: 'medication',
            petId: schedule.pet_id,
            medicationId: medication.id,
            scheduleId: schedule.id,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date,
          channelId: CHANNEL_ID,
        },
      });

      scheduledCount += 1;
    }
  }

  return scheduledCount;
}
