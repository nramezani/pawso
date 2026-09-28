import { useEffect, useState } from 'react';
import { Switch, Text, View } from 'react-native';

import { supabase } from '../../lib/supabase';
import { usePawso } from '../context/PawsoContext';
import { Card, Header, OptionButton, Page, PrimaryButton, styles } from '../components/ui';

type Preferences = {
  birthday_enabled: boolean;
  adoption_day_enabled: boolean;
  medication_enabled: boolean;
  care_enabled: boolean;
  vaccine_enabled: boolean;
  lead_days: number[];
};

const DEFAULTS: Preferences = {
  birthday_enabled: true,
  adoption_day_enabled: true,
  medication_enabled: true,
  care_enabled: true,
  vaccine_enabled: true,
  lead_days: [0],
};

export function NotificationPreferencesScreen() {
  const { setScreen, currentPetId, petName, canManageMedical, syncNotificationsIfEnabled } = usePawso();
  const [preferences, setPreferences] = useState(DEFAULTS);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!currentPetId) return;
    supabase.from('pet_notification_preferences').select('*').eq('pet_id', currentPetId).maybeSingle()
      .then(({ data }) => data && setPreferences({
        birthday_enabled: data.birthday_enabled,
        adoption_day_enabled: data.adoption_day_enabled,
        medication_enabled: data.medication_enabled,
        care_enabled: data.care_enabled,
        vaccine_enabled: data.vaccine_enabled,
        lead_days: data.lead_days,
      }));
  }, [currentPetId]);

  const toggle = (key: keyof Omit<Preferences, 'lead_days'>) =>
    setPreferences((current) => ({ ...current, [key]: !current[key] }));
  const toggleLead = (day: number) => setPreferences((current) => {
    const exists = current.lead_days.includes(day);
    const next = exists ? current.lead_days.filter((item) => item !== day) : [...current.lead_days, day];
    return { ...current, lead_days: next.length ? next.sort((a, b) => a - b) : [0] };
  });

  async function save() {
    if (!currentPetId || !canManageMedical) return;
    setBusy(true);
    setMessage('');
    const { error } = await supabase.from('pet_notification_preferences').upsert({
      pet_id: currentPetId,
      ...preferences,
      updated_at: new Date().toISOString(),
    });
    if (error) setMessage(error.message);
    else {
      await syncNotificationsIfEnabled();
      setMessage('Reminder preferences saved.');
    }
    setBusy(false);
  }

  const rows: { key: keyof Omit<Preferences, 'lead_days'>; label: string }[] = [
    { key: 'birthday_enabled', label: 'Birthdays' },
    { key: 'adoption_day_enabled', label: 'Gotcha / adoption days' },
    { key: 'medication_enabled', label: 'Medications' },
    { key: 'care_enabled', label: 'Care routines' },
    { key: 'vaccine_enabled', label: 'Vaccines' },
  ];

  return <Page scroll>
    <Header title="Reminder preferences" back={() => setScreen('petProfile')} />
    <Text style={styles.pageTitle}>{petName}'s reminders</Text>
    <Text style={styles.pageSubtitle}>Choose which reminders this phone schedules for this pet.</Text>
    <Card title="Categories">
      {rows.map((row) => <View key={row.key} style={[styles.row, { justifyContent: 'space-between' }]}>
        <Text style={styles.cardStrong}>{row.label}</Text>
        <Switch value={preferences[row.key]} onValueChange={() => toggle(row.key)} />
      </View>)}
    </Card>
    <Text style={styles.sectionTitle}>Advance notice</Text>
    <Text style={styles.cardMuted}>Used for birthdays, Gotcha Days, care routines, and vaccines. Medication doses stay at their exact scheduled time.</Text>
    <View style={styles.scheduleWrap}>
      <OptionButton title="On due date" selected={preferences.lead_days.includes(0)} onPress={() => toggleLead(0)} />
      <OptionButton title="1 day before" selected={preferences.lead_days.includes(1)} onPress={() => toggleLead(1)} />
      <OptionButton title="1 week before" selected={preferences.lead_days.includes(7)} onPress={() => toggleLead(7)} />
    </View>
    {message ? <Text style={styles.cardMuted}>{message}</Text> : null}
    <PrimaryButton title={busy ? 'Saving…' : 'Save reminder preferences'} disabled={busy || !canManageMedical} onPress={save} />
  </Page>;
}
