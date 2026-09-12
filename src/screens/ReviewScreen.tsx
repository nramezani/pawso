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

export function ReviewScreen() {
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
    newMedicationTime1,
    setNewMedicationTime1,
    newMedicationTime2,
    setNewMedicationTime2,
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

return (
      <Page scroll keyboard>
        <Header
          back={() => setScreen('today')}
          title="AI Review"
        />

        <View style={styles.reviewHero}>
          <Text style={styles.reviewCheck}>✓</Text>

          <View style={{ flex: 1 }}>
            <Text style={styles.reviewHeroTitle}>
              File received by Pawso
            </Text>

            <Text style={styles.cardMuted}>
              Pawso organized the backend response. You remain in control.
            </Text>
          </View>
        </View>

        <View style={styles.uploadSuccessCard}>
          <Text style={styles.uploadSuccessTitle}>
            Backend upload successful
          </Text>

          <Text style={styles.uploadSuccessText}>
            {documentName}
          </Text>

          {documentSize !== null && (
            <Text style={styles.uploadSuccessMeta}>
              {(documentSize / 1024).toFixed(1)} KB received
            </Text>
          )}

          {currentDocumentId && currentExtractionId && (
            <>
              <Text style={styles.uploadSuccessMeta}>
                Original file stored securely
              </Text>

              <Text style={styles.uploadSuccessMeta}>
                AI proposal saved for review
              </Text>
            </>
          )}
        </View>


        <Text style={styles.sectionTitle}>
          Visit
        </Text>

        <ReviewField
          label="Visit date"
          value={visitDate}
          setValue={setVisitDate}
        />

        <ReviewField
          label="Clinic"
          value={clinic}
          setValue={setClinic}
        />

        <Text style={styles.sectionTitle}>
          Finding
        </Text>

        <ReviewField
          label="Finding"
          value={finding}
          setValue={setFinding}
          multiline
        />

        <Text style={styles.sourceText}>
          🏥 Source: Uploaded veterinary record
        </Text>

        <Text style={styles.sectionTitle}>
          Assessment
        </Text>

        <ReviewField
          label="Diagnosis / assessment"
          value={diagnosis}
          setValue={setDiagnosis}
          multiline
          warning
        />

        <Text style={styles.warningText}>
          ⚠️ Please check — Pawso preserves uncertainty and does not diagnose.
        </Text>

        <Text style={styles.sectionTitle}>
          Suggested action
        </Text>

        <ReviewField
          label="Follow-up"
          value={followUp}
          setValue={setFollowUp}
          multiline
        />

        {databaseError !== '' && (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>
              Could not save health history
            </Text>

            <Text style={styles.errorText}>
              {databaseError}
            </Text>
          </View>
        )}

        <View style={styles.confirmCard}>
          <Text style={styles.cardStrong}>
            When you confirm
          </Text>

          <Text style={styles.confirmItem}>
            ✓ Veterinary visit added to timeline
          </Text>

          <Text style={styles.confirmItem}>
            ✓ Finding saved to {petName}'s history
          </Text>

          <Text style={styles.confirmItem}>
            ✓ Follow-up added to health timeline
          </Text>

          <Text style={styles.confirmItem}>
            ✓ Original document stays linked as evidence
          </Text>
        </View>

        <PrimaryButton
          title={
            isConfirmingExtraction
              ? 'Saving Health History…'
              : 'Confirm & Add to Health History'
          }
          disabled={isConfirmingExtraction}
          onPress={confirmExtraction}
        />

        <SecondaryButton
          title="Cancel"
          onPress={() => setScreen('today')}
        />
      </Page>
    );
}
