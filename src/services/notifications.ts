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
  pets: { id: string; name: string; date_of_birth?: string | null; adoption_date?: string | null }[],
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
  const { data: preferenceRows, error: preferenceError } = await supabase
    .from('pet_notification_preferences')
    .select('pet_id, birthday_enabled, adoption_day_enabled, medication_enabled, care_enabled, vaccine_enabled, lead_days')
    .in('pet_id', petIds);
  if (preferenceError) throw preferenceError;
  const preferenceByPet = new Map((preferenceRows ?? []).map((item) => [item.pet_id, item]));
  const preferencesFor = (petId: string) => preferenceByPet.get(petId) ?? {
    birthday_enabled: true,
    adoption_day_enabled: true,
    medication_enabled: true,
    care_enabled: true,
    vaccine_enabled: true,
    lead_days: [0],
  };
  let scheduledCount = 0;
  const now = Date.now();

  const { data: careTasks, error: careError } = await supabase
    .from('care_tasks')
    .select('id, pet_id, title, due_at, task_type, is_active, paused_at')
    .in('pet_id', petIds)
    .eq('is_active', true)
    .is('paused_at', null)
    .gt('due_at', new Date(now).toISOString())
    .order('due_at', { ascending: true })
    // Keep room under iOS's scheduled-notification ceiling for medications.
    .limit(15);

  if (careError) throw careError;

  for (const task of careTasks ?? []) {
    if (task.paused_at) continue;
    const preference = preferencesFor(task.pet_id);
    if (task.task_type === 'vaccine' ? !preference.vaccine_enabled : !preference.care_enabled) continue;
    const due = new Date(task.due_at);
    if (Number.isNaN(due.getTime()) || due.getTime() <= now) continue;

    const petName = petNameById.get(task.pet_id) ?? 'your pet';

    const leadDays = Array.isArray(preference.lead_days) ? preference.lead_days : [0];
    for (const leadDay of leadDays) {
      if (scheduledCount >= 60) break;
      const notifyAt = new Date(due.getTime() - Number(leadDay) * 86400000);
      if (notifyAt.getTime() <= now) continue;
      await Notifications.scheduleNotificationAsync({
      identifier: `care:${task.id}:${leadDay}`,
      content: {
        title: `${petName} · ${task.task_type === 'vaccine' ? 'Vaccine' : 'Care'} reminder`,
        body: `${task.title}${leadDay ? ` · due in ${leadDay} day${leadDay === 1 ? '' : 's'}` : ''}`,
        sound: 'default',
        data: {
          kind: 'care_task',
          petId: task.pet_id,
          taskId: task.id,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: notifyAt,
        channelId: CHANNEL_ID,
      },
      });
      scheduledCount += 1;
    }
  }

  for (const pet of pets) {
    // Keep the total below iOS's scheduled-notification ceiling.
    if (scheduledCount >= 60) break;

    const preference = preferencesFor(pet.id);
    const annualDates = [
      { kind: 'birthday', value: pet.date_of_birth, enabled: preference.birthday_enabled, title: `🎉 It’s ${pet.name}’s birthday!`, body: `Celebrate ${pet.name} today.` },
      { kind: 'adoption_day', value: pet.adoption_date, enabled: preference.adoption_day_enabled, title: `🐾 It’s ${pet.name}’s Gotcha Day!`, body: `Celebrate the day ${pet.name} joined the family.` },
    ];
    for (const annual of annualDates) {
    if (!annual.enabled) continue;
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(annual.value ?? '');
    if (!match) continue;

    const month = Number(match[2]);
    const day = Number(match[3]);
    if (month < 1 || month > 12 || day < 1 || day > 31) continue;

    const annualLeadDays = Array.isArray(preference.lead_days) ? preference.lead_days : [0];
    for (const leadDay of annualLeadDays) {
      if (scheduledCount >= 60) break;
      const content = {
        title: annual.title,
        body: leadDay ? `${annual.body} Coming up in ${leadDay} day${leadDay === 1 ? '' : 's'}.` : annual.body,
        sound: 'default' as const,
        data: { kind: annual.kind, petId: pet.id },
      };
      if (leadDay === 0) {
        await Notifications.scheduleNotificationAsync({
          identifier: `${annual.kind}:${pet.id}:0`,
          content,
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.YEARLY,
            month: month - 1,
            day,
            hour: 9,
            minute: 0,
            channelId: CHANNEL_ID,
          },
        });
      } else {
        const currentYear = Number(formatDateInputInTimeZone(new Date(), timeZone).slice(0, 4));
        let annualDate = `${currentYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        let notificationDate = addDaysToDateInput(annualDate, -leadDay);
        let triggerDate = parseDateTimeInTimeZone(notificationDate, '09:00', timeZone);
        if (!triggerDate || triggerDate.getTime() <= now) {
          annualDate = `${currentYear + 1}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          notificationDate = addDaysToDateInput(annualDate, -leadDay);
          triggerDate = parseDateTimeInTimeZone(notificationDate, '09:00', timeZone);
        }
        if (!triggerDate) continue;
        await Notifications.scheduleNotificationAsync({
          identifier: `${annual.kind}:${pet.id}:${leadDay}`,
          content,
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: triggerDate,
            channelId: CHANNEL_ID,
          },
        });
      }
      scheduledCount += 1;
    }
    }
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
      if (!preferencesFor(schedule.pet_id).medication_enabled) continue;

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
