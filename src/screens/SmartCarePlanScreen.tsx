import { ActivityIndicator, Text, View } from 'react-native';

import { usePawso } from '../context/PawsoContext';
import { MetricStrip } from '../components/VisualSummary';
import { Header, Page, PrimaryButton, SecondaryButton, styles } from '../components/ui';

export function SmartCarePlanScreen() {
  const {
    setScreen,
    petName,
    canManageCare,
    smartCareSuggestions,
    smartCareLoading,
    smartCareError,
    generateSmartCarePlan,
    acceptSmartCareSuggestion,
    getSmartCareSourceLabel,
  } = usePawso();
  const suggestionCount = (type: 'follow_up' | 'monitoring' | 'routine_care') =>
    smartCareSuggestions.filter((suggestion) => suggestion.task_type === type).length;

  return (
    <Page scroll>
      <Header back={() => setScreen('today')} title="Smart Care Plan" />
      <Text style={styles.pageTitle}>Care ideas for {petName}</Text>
      <Text style={styles.pageSubtitle}>
        Pawso suggests optional tasks from confirmed records. Nothing is scheduled until you review it and choose a date.
      </Text>

      <PrimaryButton
        title={smartCareLoading ? 'Reviewing records…' : 'Generate care suggestions'}
        disabled={smartCareLoading}
        onPress={generateSmartCarePlan}
      />

      {smartCareLoading ? (
        <View style={styles.infoCard}>
          <ActivityIndicator size="small" color="#2F6F63" />
          <Text style={styles.cardMuted}>Looking for supported follow-up and monitoring tasks…</Text>
        </View>
      ) : null}

      {smartCareError ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Could not create suggestions</Text>
          <Text style={styles.errorText}>{smartCareError}</Text>
        </View>
      ) : null}

      {!smartCareLoading && smartCareSuggestions.length === 0 ? (
        <View style={styles.infoCard}>
          <Text style={styles.cardStrong}>No suggestions generated yet</Text>
          <Text style={styles.cardMuted}>Pawso only suggests tasks that confirmed records can support.</Text>
        </View>
      ) : null}

      {smartCareSuggestions.length > 0 ? (
        <MetricStrip
          accessibilityLabel={`${petName}'s smart care suggestion overview`}
          items={[
            {
              label: 'Follow-up',
              value: suggestionCount('follow_up'),
              icon: '🩺',
              tone: 'purple',
            },
            {
              label: 'Monitoring',
              value: suggestionCount('monitoring'),
              icon: '👁',
              tone: 'amber',
            },
            {
              label: 'Routine care',
              value: suggestionCount('routine_care'),
              icon: '✓',
              tone: 'green',
            },
          ]}
        />
      ) : null}

      {smartCareSuggestions.map((suggestion, index) => (
        <View key={`${suggestion.title}-${index}`} style={styles.infoCard}>
          <Text style={styles.cardStrong}>{suggestion.title}</Text>
          <Text style={styles.cardMuted}>{suggestion.reason}</Text>
          <Text style={styles.label}>Supporting records</Text>
          {[...new Set(suggestion.source_ids)].map((sourceId) => (
            <Text key={sourceId} style={styles.cardMuted}>• {getSmartCareSourceLabel(sourceId)}</Text>
          ))}
          {canManageCare ? (
            <PrimaryButton
              title="Review & schedule"
              onPress={() => acceptSmartCareSuggestion(suggestion)}
            />
          ) : null}
        </View>
      ))}

      {smartCareSuggestions.length > 0 ? (
        <SecondaryButton title="Generate again" onPress={generateSmartCarePlan} />
      ) : null}

      <View style={styles.infoCard}>
        <Text style={styles.cardStrong}>You stay in control</Text>
        <Text style={styles.cardMuted}>Suggestions are not veterinary instructions. Review each task and confirm its timing before saving.</Text>
      </View>
    </Page>
  );
}
