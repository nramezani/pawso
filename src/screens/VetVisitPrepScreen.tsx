import { ActivityIndicator, Share, Text, View } from 'react-native';

import { usePawso } from '../context/PawsoContext';
import { MetricStrip } from '../components/VisualSummary';
import {
  Header,
  Input,
  Label,
  Page,
  PrimaryButton,
  SecondaryButton,
  styles,
} from '../components/ui';

function formatSection(title: string, items: string[]) {
  if (items.length === 0) return '';
  return `${title}\n${items.map((item) => `• ${item}`).join('\n')}`;
}

export function VetVisitPrepScreen() {
  const {
    setScreen,
    petName,
    timelineEvents,
    medicationList,
    careTasks,
    visitReason,
    setVisitReason,
    visitChanges,
    setVisitChanges,
    vetVisitPrep,
    vetVisitPrepLoading,
    vetVisitPrepError,
    generateVetVisitPrep,
  } = usePawso();

  const briefing = vetVisitPrep
    ? [
        `${petName} — Vet Visit Briefing`,
        vetVisitPrep.overview,
        formatSection('Priority concerns', vetVisitPrep.priority_concerns),
        formatSection('Current medications', vetVisitPrep.current_medications),
        formatSection('Recent history', vetVisitPrep.recent_history),
        formatSection('Recorded follow-up', vetVisitPrep.follow_up_items),
        formatSection('Questions for the vet', vetVisitPrep.questions_for_vet),
        formatSection('Details to add before the visit', vetVisitPrep.missing_information),
        'Prepared from owner-reported information and confirmed Pawso records. Not a diagnosis.',
      ].filter(Boolean).join('\n\n')
    : '';

  async function shareBriefing() {
    if (!briefing) return;
    await Share.share({ title: `${petName} — Vet Visit Briefing`, message: briefing });
  }

  return (
    <Page scroll keyboard>
      <Header back={() => setScreen('today')} title="Vet Visit Prep" />

      <Text style={styles.pageTitle}>Prepare for {petName}'s visit</Text>
      <Text style={styles.pageSubtitle}>
        Pawso turns confirmed records and your observations into a concise briefing to review with the vet.
      </Text>

      <View style={styles.infoCard}>
        <Text style={styles.cardStrong}>Pawso memory available</Text>
        <MetricStrip
          items={[
            {
              label: 'Health events',
              value: timelineEvents.length,
              icon: '📋',
              tone: 'purple',
            },
            {
              label: 'Medications',
              value: medicationList.length,
              icon: '💊',
              tone: 'green',
            },
            {
              label: 'Care tasks',
              value: careTasks.length,
              icon: '📅',
              tone: 'neutral',
            },
          ]}
        />
      </View>

      <Label text="Reason for this visit" />
      <Input
        value={visitReason}
        onChangeText={setVisitReason}
        placeholder="Example: follow-up visit or a new concern"
        multiline
      />

      <Label text="What have you noticed?" />
      <Input
        value={visitChanges}
        onChangeText={setVisitChanges}
        placeholder="When it started, frequency, appetite, drinking, bathroom habits, behavior…"
        multiline
      />

      <PrimaryButton
        title={vetVisitPrepLoading ? 'Preparing briefing…' : 'Generate vet briefing'}
        disabled={vetVisitPrepLoading}
        onPress={generateVetVisitPrep}
      />

      {vetVisitPrepLoading ? (
        <View style={styles.infoCard}>
          <ActivityIndicator size="small" color="#2F6F63" />
          <Text style={styles.cardMuted}>Reviewing confirmed Pawso records…</Text>
        </View>
      ) : null}

      {vetVisitPrepError ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Could not prepare the visit</Text>
          <Text style={styles.errorText}>{vetVisitPrepError}</Text>
        </View>
      ) : null}

      {vetVisitPrep && !vetVisitPrepLoading ? (
        <>
          <Text style={styles.sectionTitle}>Vet briefing</Text>
          <View style={styles.infoCard}>
            <Text selectable style={{ color: '#34433E', lineHeight: 22 }}>
              {briefing}
            </Text>
          </View>
          <PrimaryButton title="Share briefing" onPress={shareBriefing} />
          <SecondaryButton title="Generate again" onPress={generateVetVisitPrep} />
        </>
      ) : null}

      <View style={styles.infoCard}>
        <Text style={styles.cardStrong}>Before sharing</Text>
        <Text style={styles.cardMuted}>
          Review the briefing for accuracy. Pawso organizes your information; it does not diagnose or replace veterinary care.
        </Text>
      </View>
    </Page>
  );
}
