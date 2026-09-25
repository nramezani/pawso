import { useMemo, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { NumericTrendCard } from '../components/NumericTrendCard';
import { FilterChipRow, MetricStrip } from '../components/VisualSummary';
import {
  Header,
  Input,
  Label,
  Page,
  PrimaryButton,
  SecondaryButton,
  styles,
} from '../components/ui';
import { usePawso } from '../context/PawsoContext';

function shortDate(value: string) {
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function HealthTrendsScreen() {
  const {
    setScreen,
    petName,
    canViewMedical,
    canManageMedical,
    symptomEntries,
    labResults,
    healthDataLoading,
    healthDataError,
    healthDataSaving,
    openHealthCheckIn,
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
    saveLabResult,
  } = usePawso();
  const [showLabForm, setShowLabForm] = useState(false);
  const [symptomLimit, setSymptomLimit] = useState(10);
  const [labLimit, setLabLimit] = useState(10);
  const symptomCategories = useMemo(
    () => [...new Set(symptomEntries.map((entry) => entry.category))].sort(),
    [symptomEntries]
  );
  const [selectedSymptomCategory, setSelectedSymptomCategory] = useState('');
  const effectiveSymptomCategory = symptomCategories.includes(selectedSymptomCategory)
    ? selectedSymptomCategory
    : symptomCategories[0] ?? '';
  const labSeries = useMemo(() => {
    const keys = new Map<string, { label: string; count: number }>();
    for (const result of labResults) {
      if (result.numeric_value === null) continue;
      const key = `${result.test_name}\u0000${result.unit ?? ''}`;
      const existing = keys.get(key);
      keys.set(key, {
        label: `${result.test_name}${result.unit ? ` (${result.unit})` : ''}`,
        count: (existing?.count ?? 0) + 1,
      });
    }
    return [...keys.entries()];
  }, [labResults]);
  const [selectedLabKey, setSelectedLabKey] = useState('');
  const effectiveLabKey = labSeries.some(([key]) => key === selectedLabKey)
    ? selectedLabKey
    : labSeries[0]?.[0] ?? '';
  const selectedLabResults = labResults
    .filter(
      (item) =>
        `${item.test_name}\u0000${item.unit ?? ''}` === effectiveLabKey &&
        item.numeric_value !== null
    )
    .sort((a, b) => a.collected_on.localeCompare(b.collected_on))
    .slice(-8);
  const latestLab = selectedLabResults[selectedLabResults.length - 1];
  const selectedSymptoms = symptomEntries.filter(
    (entry) => entry.category === effectiveSymptomCategory
  );
  const symptomPoints = [...selectedSymptoms]
    .sort((a, b) => a.observed_on.localeCompare(b.observed_on))
    .slice(-8)
    .map((entry) => ({
      id: entry.id,
      label: shortDate(entry.observed_on),
      value: entry.severity,
    }));
  const hasConsistentReferenceRange = selectedLabResults.every(
    (result) =>
      result.reference_low === latestLab?.reference_low &&
      result.reference_high === latestLab?.reference_high
  );

  if (!canViewMedical) {
    return (
      <Page scroll>
        <Header title="Health trends" back={() => setScreen('petProfile')} />
        <View style={styles.infoCard}>
          <Text style={styles.cardStrong}>Health trends are private</Text>
          <Text style={styles.cardMuted}>
            Sitter access is limited to day-to-day care and medication instructions.
          </Text>
        </View>
      </Page>
    );
  }

  return (
    <Page scroll keyboard>
      <Header title="Health trends" back={() => setScreen('petProfile')} />
      <Text style={styles.pageTitle}>{petName}&apos;s health trends</Text>
      <Text style={styles.pageSubtitle}>
        Structured observations make changes easier to describe to a veterinarian.
        Pawso shows recorded patterns only and does not diagnose them.
      </Text>

      <MetricStrip
        items={[
          { label: 'Symptoms', value: symptomEntries.length, icon: '🩺', tone: 'amber' },
          { label: 'Lab results', value: labResults.length, icon: '🧪', tone: 'purple' },
        ]}
      />

      {healthDataLoading ? (
        <View style={styles.documentsLoading}>
          <ActivityIndicator color="#2F6F63" />
          <Text style={styles.cardMuted}>Loading health trends…</Text>
        </View>
      ) : null}

      {symptomCategories.length > 0 ? (
        <>
          <FilterChipRow
            label="Symptom trend"
            options={symptomCategories.map((value) => ({
              value,
              label: value,
              count: symptomEntries.filter((entry) => entry.category === value).length,
            }))}
            selected={effectiveSymptomCategory}
            onSelect={setSelectedSymptomCategory}
          />
          <NumericTrendCard
            title={`${effectiveSymptomCategory} severity`}
            detail={`Latest ${symptomPoints.length} comparable observation${symptomPoints.length === 1 ? '' : 's'}`}
            points={symptomPoints}
            minimum={1}
            maximum={5}
            note="Severity is the owner-selected 1–5 rating. Pawso charts one symptom category at a time so unrelated observations are not combined."
          />
        </>
      ) : (
        <View style={styles.infoCard}>
          <Text style={styles.cardStrong}>No symptom trend yet</Text>
          <Text style={styles.cardMuted}>Record an observation to start a symptom-specific chart.</Text>
        </View>
      )}

      {canManageMedical ? (
        <PrimaryButton title="Record symptom" onPress={() => openHealthCheckIn('symptom')} />
      ) : null}

      {labSeries.length > 0 ? (
        <>
          <FilterChipRow
            label="Lab trend"
            options={labSeries.map(([value, item]) => ({ value, ...item }))}
            selected={effectiveLabKey}
            onSelect={setSelectedLabKey}
          />
          <NumericTrendCard
            title={latestLab?.test_name ?? 'Lab trend'}
            detail={`${selectedLabResults.length} comparable result${selectedLabResults.length === 1 ? '' : 's'} with the same test name and unit`}
            points={selectedLabResults.map((result) => ({
              id: result.id,
              label: shortDate(result.collected_on),
              value: result.numeric_value as number,
            }))}
            unit={latestLab?.unit ?? ''}
            minimum={hasConsistentReferenceRange ? latestLab?.reference_low : null}
            maximum={hasConsistentReferenceRange ? latestLab?.reference_high : null}
            note={
              hasConsistentReferenceRange
                ? 'The chart uses the report range saved with these results. Pawso never combines results with different units.'
                : 'Reference ranges differ across these reports, so Pawso does not draw one shared range. Confirm each result against its original laboratory report.'
            }
          />
        </>
      ) : (
        <View style={styles.infoCard}>
          <Text style={styles.cardStrong}>No comparable lab trends yet</Text>
          <Text style={styles.cardMuted}>
            Add numeric results with the exact test name, unit, and report range.
          </Text>
        </View>
      )}

      {canManageMedical ? (
        <>
          <SecondaryButton
            title={showLabForm ? 'Close lab form' : '+ Add lab result'}
            onPress={() => setShowLabForm((value) => !value)}
          />
          {showLabForm ? (
            <View style={styles.infoCard}>
              <Text style={styles.cardTitle}>Add numeric lab result</Text>
              <Label text="Collected date *" />
              <Input value={newLabDate} onChangeText={setNewLabDate} placeholder="YYYY-MM-DD" maxLength={10} />
              <Label text="Test name *" />
              <Input value={newLabTest} onChangeText={setNewLabTest} placeholder="e.g. Creatinine" maxLength={120} />
              <View style={styles.medicationDoseRow}>
                <View style={{ flex: 1 }}>
                  <Label text="Value *" />
                  <Input value={newLabValue} onChangeText={setNewLabValue} keyboardType="decimal-pad" placeholder="1.2" maxLength={40} />
                </View>
                <View style={{ flex: 1 }}>
                  <Label text="Unit" />
                  <Input value={newLabUnit} onChangeText={setNewLabUnit} placeholder="mg/dL" maxLength={40} />
                </View>
              </View>
              <Text style={styles.sectionTitle}>Report reference range</Text>
              <View style={styles.medicationDoseRow}>
                <View style={{ flex: 1 }}>
                  <Label text="Low" />
                  <Input value={newLabLow} onChangeText={setNewLabLow} keyboardType="decimal-pad" maxLength={40} />
                </View>
                <View style={{ flex: 1 }}>
                  <Label text="High" />
                  <Input value={newLabHigh} onChangeText={setNewLabHigh} keyboardType="decimal-pad" maxLength={40} />
                </View>
              </View>
              <Label text="Notes" />
              <Input value={newLabNotes} onChangeText={setNewLabNotes} multiline placeholder="Optional context from the report" maxLength={2000} />
              <PrimaryButton
                title={healthDataSaving ? 'Saving result…' : 'Save lab result'}
                disabled={healthDataSaving || !newLabTest.trim() || !newLabValue.trim()}
                onPress={saveLabResult}
              />
            </View>
          ) : null}
        </>
      ) : null}

      <Text style={styles.sectionTitle}>Recent symptom observations</Text>
      {symptomEntries.slice(0, symptomLimit).map((entry) => (
        <View key={entry.id} style={styles.documentCard}>
          <Text style={styles.documentCardTitle}>{entry.category}</Text>
          <Text style={styles.documentCardMeta}>
            {entry.observed_on} · Severity {entry.severity}/5 · {entry.frequency}
            {entry.duration_minutes ? ` · ${entry.duration_minutes} min` : ''}
          </Text>
          {entry.notes ? <Text style={styles.cardMuted}>{entry.notes}</Text> : null}
        </View>
      ))}
      {symptomEntries.length > symptomLimit ? (
        <SecondaryButton
          title={`Show ${Math.min(10, symptomEntries.length - symptomLimit)} more symptoms`}
          onPress={() => setSymptomLimit((value) => value + 10)}
        />
      ) : null}

      <Text style={styles.sectionTitle}>Recent lab results</Text>
      {labResults.length === 0 ? (
        <View style={styles.infoCard}>
          <Text style={styles.cardMuted}>No laboratory results recorded yet.</Text>
        </View>
      ) : null}
      {labResults.slice(0, labLimit).map((result) => (
        <View key={result.id} style={styles.documentCard}>
          <Text style={styles.documentCardTitle}>{result.test_name}</Text>
          <Text style={styles.documentCardMeta}>
            {result.collected_on} · {result.numeric_value ?? result.text_value ?? 'No value'}
            {result.unit ? ` ${result.unit}` : ''}
            {result.reference_low !== null || result.reference_high !== null
              ? ` · Range ${result.reference_low ?? '—'}–${result.reference_high ?? '—'}`
              : ''}
          </Text>
          {result.notes ? <Text style={styles.cardMuted}>{result.notes}</Text> : null}
        </View>
      ))}
      {labResults.length > labLimit ? (
        <SecondaryButton
          title={`Show ${Math.min(10, labResults.length - labLimit)} more lab results`}
          onPress={() => setLabLimit((value) => value + 10)}
        />
      ) : null}

      {healthDataError ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Health trend error</Text>
          <Text style={styles.errorText}>{healthDataError}</Text>
        </View>
      ) : null}
      <SecondaryButton title="Back to pet profile" onPress={() => setScreen('petProfile')} />
    </Page>
  );
}
