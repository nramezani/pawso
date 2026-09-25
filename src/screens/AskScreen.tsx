import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { usePawso } from '../context/PawsoContext';
import { MetricStrip } from '../components/VisualSummary';
import {
  Page,
  Header,
  Input,
  PrimaryButton,
  SecondaryButton,
  styles,
} from '../components/ui';

export function AskScreen() {
  const {
    setScreen,
    canViewMedical,
    petName,
    timelineEvents,
    medicationList,
    careTasks,
    taskCompletions,
    askQuestion,
    setAskQuestion,
    askAnswer,
    askLoading,
    askError,
    askPawso,
    getAskSourceLabel,
  } = usePawso();

  const careRecordCount = careTasks.filter(
    (task) =>
      task.is_active ||
      taskCompletions.some((completion) => completion.task_id === task.id)
  ).length;

  const suggestedQuestions = [
    `Summarize ${petName}'s health history.`,
    'What follow-up did the vet recommend?',
    `What medications are currently recorded for ${petName}?`,
  ];
  const uniqueAnswerSourceIds = askAnswer
    ? Array.from(new Set(askAnswer.source_ids))
    : [];

  if (!canViewMedical) {
    return (
      <Page scroll>
        <Header back={() => setScreen('today')} title="Ask Pawso" />
        <View style={styles.infoCard}>
          <Text style={styles.cardStrong}>Ask Pawso is not available to sitters</Text>
          <Text style={styles.cardMuted}>
            Sitter access is limited to day-to-day care and medication instructions.
          </Text>
        </View>
      </Page>
    );
  }

  return (
      <Page scroll keyboard>
        <Header back={() => setScreen('today')} title="Ask Pawso" />

        <View style={styles.askHero}>
          <View style={styles.askHeroIcon}>
            <Text style={styles.askHeroEmoji}>✨</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.documentsTitle}>Ask about {petName}</Text>
            <Text style={styles.cardMuted}>
              Answers are grounded in confirmed Pawso records. They are not a veterinary diagnosis.
            </Text>
          </View>
        </View>

        <View style={styles.askPrivacyCard}>
          <Text style={styles.askPrivacyTitle}>Using {petName}'s Pawso memory</Text>
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
                label: 'Care records',
                value: careRecordCount,
                icon: '📅',
                tone: 'neutral',
              },
            ]}
          />
        </View>

        <Text style={styles.sectionTitle}>Try asking</Text>

        <View style={styles.askSuggestions}>
          {suggestedQuestions.map((question) => (
            <Pressable
              key={question}
              style={styles.askSuggestionChip}
              disabled={askLoading}
              accessibilityRole="button"
              accessibilityLabel={`Ask: ${question}`}
              onPress={() => {
                setAskQuestion(question);
                askPawso(question);
              }}
            >
              <Text style={styles.askSuggestionText}>{question}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Your question</Text>

        <Input
          value={askQuestion}
          onChangeText={setAskQuestion}
          placeholder={`Ask something about ${petName}…`}
          multiline
        />

        <PrimaryButton
          title={askLoading ? 'Checking Pawso Memory…' : 'Ask Pawso'}
          disabled={askLoading || !askQuestion.trim()}
          onPress={() => askPawso()}
        />

        {askError !== '' && (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Pawso could not answer</Text>
            <Text style={styles.errorText}>{askError}</Text>
          </View>
        )}

        {askLoading && (
          <View style={styles.askLoadingCard}>
            <ActivityIndicator size="small" color="#2F6F63" />
            <Text style={styles.cardMuted}>
              Reading confirmed records for {petName}…
            </Text>
          </View>
        )}

        {askAnswer && !askLoading && (
          <View style={styles.askAnswerCard}>
            <View style={styles.askAnswerHeader}>
              <Text style={styles.askAnswerBadge}>PAWSO AI</Text>
              <Text style={styles.askGroundedBadge}>Grounded in records</Text>
            </View>

            {askAnswer.safety_category === 'urgent' && (
              <View style={styles.askUrgentCard}>
                <Text style={styles.askUrgentTitle}>Urgent safety note</Text>
                <Text style={styles.askUrgentText}>
                  If {petName} is having an emergency or rapidly worsening symptoms, contact a veterinarian or emergency clinic now.
                </Text>
              </View>
            )}

            <Text style={styles.askAnswerText}>{askAnswer.answer}</Text>

            {uniqueAnswerSourceIds.length > 0 ? (
              <>
                <Text style={styles.askSourcesTitle}>Sources used</Text>

                {uniqueAnswerSourceIds.map((sourceId) => (
                  <View key={sourceId} style={styles.askSourceRow}>
                    <Text style={styles.askSourceIcon}>↗</Text>
                    <Text style={styles.askSourceText}>
                      {getAskSourceLabel(sourceId)}
                    </Text>
                  </View>
                ))}
              </>
            ) : (
              <Text style={styles.askNoSources}>
                Pawso did not find a confirmed record that directly supports this answer.
              </Text>
            )}

            <Text style={styles.safetyText}>
              Pawso can organize and summarize records, but it cannot diagnose or change treatment.
            </Text>
          </View>
        )}

        <SecondaryButton title="Back to Today" onPress={() => setScreen('today')} />
      </Page>
    );
}
