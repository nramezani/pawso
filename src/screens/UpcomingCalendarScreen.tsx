import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { supabase } from '../../lib/supabase';
import { usePawso } from '../context/PawsoContext';
import { Card, Header, Page, styles } from '../components/ui';

type CalendarItem = { id: string; at: string; title: string; pet: string; kind: string };

function formatCalendarDate(value: string) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date(value);
  return date.toLocaleString([], /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? { year: 'numeric', month: 'short', day: 'numeric' }
    : { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function UpcomingCalendarScreen() {
  const { setScreen, pets } = usePawso();
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!pets.length) return setItems([]);
    const ids = pets.map((pet) => pet.id);
    const [{ data: tasks, error: taskError }, { data: meds, error: medError }] = await Promise.all([
      supabase.from('care_tasks').select('id, pet_id, title, due_at, task_type, is_active, paused_at').in('pet_id', ids).eq('is_active', true).is('paused_at', null),
      supabase.from('medications').select('id, pet_id, name, refill_due_date, is_active, paused_at').in('pet_id', ids).eq('is_active', true),
    ]);
    if (taskError || medError) return setError((taskError ?? medError)?.message ?? 'Could not load calendar.');
    const petById = new Map(pets.map((pet) => [pet.id, pet]));
    const currentYear = new Date().getFullYear();
    const annual = (date: string | null, year = currentYear) => date ? `${year}-${date.slice(5)}` : '';
    const nextAnnual = (date: string | null) => {
      let value = annual(date);
      if (value && value < new Date().toISOString().slice(0, 10)) value = annual(date, currentYear + 1);
      return value;
    };
    const next: CalendarItem[] = [];
    for (const task of tasks ?? []) next.push({ id: `care-${task.id}`, at: task.due_at, title: task.title, pet: petById.get(task.pet_id)?.name ?? 'Pet', kind: task.task_type === 'vaccine' ? 'Vaccine' : 'Care' });
    for (const med of meds ?? []) if (med.refill_due_date && !med.paused_at) next.push({ id: `refill-${med.id}`, at: med.refill_due_date, title: `${med.name} refill`, pet: petById.get(med.pet_id)?.name ?? 'Pet', kind: 'Medication' });
    for (const pet of pets) {
      if (pet.date_of_birth) next.push({ id: `birthday-${pet.id}`, at: nextAnnual(pet.date_of_birth), title: 'Birthday', pet: pet.name, kind: 'Birthday' });
      if (pet.adoption_date) next.push({ id: `gotcha-${pet.id}`, at: nextAnnual(pet.adoption_date), title: 'Gotcha Day', pet: pet.name, kind: 'Anniversary' });
      if (pet.insurance_renewal_date) next.push({ id: `insurance-${pet.id}`, at: pet.insurance_renewal_date, title: 'Insurance renewal', pet: pet.name, kind: 'Insurance' });
    }
    setItems(next.filter((item) => new Date(item.at).getTime() >= Date.now() - 86400000).sort((a, b) => a.at.localeCompare(b.at)).slice(0, 100));
    setError('');
  }, [pets]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  return <Page scroll>
    <Header title="Upcoming" back={() => setScreen('today')} />
    <Text style={styles.pageTitle}>Household calendar</Text>
    <Text style={styles.pageSubtitle}>Care, medication refills, vaccines, birthdays, Gotcha Days, and insurance renewals across every pet.</Text>
    {error ? <View style={styles.errorCard}><Text style={styles.errorText}>{error}</Text></View> : null}
    {items.length ? items.map((item) => <Card key={item.id} title={`${item.kind} · ${item.pet}`}>
      <Text style={styles.cardStrong}>{item.title}</Text>
      <Text style={styles.cardMuted}>{formatCalendarDate(item.at)}</Text>
    </Card>) : <View style={styles.infoCard}><Text style={styles.cardStrong}>Nothing upcoming yet</Text><Text style={styles.cardMuted}>Add a care task, refill date, birthday, or adoption date.</Text></View>}
  </Page>;
}
