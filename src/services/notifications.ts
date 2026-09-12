import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from '../../lib/supabase';

const ENABLED_KEY = 'pawso.localRemindersEnabled';
const CHANNEL_ID = 'pawso-care-reminders';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;

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
  const permission = await Notifications.getPermissionsAsync();
  return permission.status;
}

export async function requestLocalNotificationPermission() {
  await ensureAndroidChannel();

  const current = await Notifications.getPermissionsAsync();
  if (current.status === 'granted') return current.status;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.status;
}

export async function clearPawsoLocalNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function syncPawsoLocalNotifications(
  pets: Array<{ id: string; name: string }>
) {
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

  const { data: careTasks, error: careError } = await supabase
    .from('care_tasks')
    .select('id, pet_id, title, due_at, is_active')
    .in('pet_id', petIds)
    .eq('is_active', true);

  if (careError) throw careError;

  const now = Date.now();

  for (const task of careTasks ?? []) {
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
    .select('id, pet_id, name, dose, unit, is_active')
    .in('pet_id', petIds)
    .eq('is_active', true);

  if (medicationError) throw medicationError;

  const medicationIds = (medications ?? []).map((medication) => medication.id);

  if (medicationIds.length > 0) {
    const { data: schedules, error: scheduleError } = await supabase
      .from('medication_schedules')
      .select('id, medication_id, pet_id, time_of_day')
      .in('medication_id', medicationIds);

    if (scheduleError) throw scheduleError;

    const medicationById = new Map(
      (medications ?? []).map((medication) => [medication.id, medication])
    );

    for (const schedule of schedules ?? []) {
      const medication = medicationById.get(schedule.medication_id);
      if (!medication) continue;

      const [hourValue, minuteValue] = String(schedule.time_of_day)
        .split(':')
        .map(Number);

      if (
        !Number.isInteger(hourValue) ||
        !Number.isInteger(minuteValue) ||
        hourValue < 0 ||
        hourValue > 23 ||
        minuteValue < 0 ||
        minuteValue > 59
      ) {
        continue;
      }

      const petName = petNameById.get(schedule.pet_id) ?? 'your pet';
      const dose = [medication.dose, medication.unit].filter(Boolean).join(' ');

      await Notifications.scheduleNotificationAsync({
        identifier: `medication:${schedule.id}`,
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
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: hourValue,
          minute: minuteValue,
          channelId: CHANNEL_ID,
        },
      });

      scheduledCount += 1;
    }
  }

  return scheduledCount;
}
