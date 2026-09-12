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

export function AddMedicationScreen() {
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
        <Header back={() => setScreen('medications')} title="Add Medication" />

        <Text style={styles.pageTitle}>Add medication</Text>
        <Text style={styles.pageSubtitle}>
          Enter the medication exactly as prescribed. Pawso will only schedule what you confirm here.
        </Text>

        <Label text="Medication name *" />
        <Input
          value={newMedicationName}
          onChangeText={setNewMedicationName}
          placeholder="e.g. Clavamox"
        />

        <View style={styles.medicationDoseRow}>
          <View style={{ flex: 1 }}>
            <Label text="Dose" />
            <Input
              value={newMedicationDose}
              onChangeText={setNewMedicationDose}
              placeholder="e.g. 1"
            />
          </View>

          <View style={{ flex: 1 }}>
            <Label text="Unit" />
            <Input
              value={newMedicationUnit}
              onChangeText={setNewMedicationUnit}
              placeholder="e.g. mL"
            />
          </View>
        </View>

        <Label text="Instructions" />
        <Input
          value={newMedicationInstructions}
          onChangeText={setNewMedicationInstructions}
          placeholder="e.g. Give with food"
          multiline
        />

        <Text style={styles.sectionTitle}>Daily schedule</Text>
        <Text style={styles.cardMuted}>
          Use 24-hour time for now, for example 08:00 or 20:00.
        </Text>

        <Label text="Time 1 *" />
        <Input
          value={newMedicationTime1}
          onChangeText={setNewMedicationTime1}
          placeholder="08:00"
        />

        <Label text="Time 2 (optional)" />
        <Input
          value={newMedicationTime2}
          onChangeText={setNewMedicationTime2}
          placeholder="20:00"
        />

        {medicationsError !== '' && (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Could not save medication</Text>
            <Text style={styles.errorText}>{medicationsError}</Text>
          </View>
        )}

        <PrimaryButton
          title={isSavingMedication ? 'Saving Medication…' : 'Save Medication'}
          disabled={
            isSavingMedication ||
            !newMedicationName.trim() ||
            !newMedicationTime1.trim()
          }
          onPress={createMedication}
        />
      </Page>
    );
}
