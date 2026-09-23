import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { usePawso } from '../context/PawsoContext';
import {
  Page,
  Header,
  Label,
  Input,
  OptionButton,
  PrimaryButton,
  SecondaryButton,
  Card,
  Info,
  QuickAction,
  ReviewField,
  styles,
} from '../components/ui';

export function AskScreen() {
  const {
    setScreen,
    apiStatus,
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
    initializeSupabase,
    loadExistingPet,
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
    followUpEvents
  } = usePawso();

const suggestedQuestions = [
      `Summarize ${petName}'s health history.`,
      'What follow-up did the vet recommend?',
      `What medications are currently recorded for ${petName}?`,
    ];

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
          <Text style={styles.cardMuted}>
            {timelineEvents.length} health events · {medicationList.length} medications · {careTasks.length} care tasks
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Try asking</Text>

        <View style={styles.askSuggestions}>
          {suggestedQuestions.map((question) => (
            <Pressable
              key={question}
              style={styles.askSuggestionChip}
              disabled={askLoading}
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

            {askAnswer.source_ids.length > 0 ? (
              <>
                <Text style={styles.askSourcesTitle}>Sources used</Text>

                {askAnswer.source_ids.map((sourceId) => (
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
