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

export function AddPetScreen() {
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
    followUpEvents,
    pets,
    cancelAddPet
  } = usePawso();

return (
      <Page scroll keyboard>
        <Header
          back={cancelAddPet}
          title="Pawso"
        />

        <Text style={styles.pageTitle}>Add your pet</Text>

        <Text style={styles.pageSubtitle}>
          Tell Pawso a little about your pet. You can update this later.
        </Text>

        <View style={styles.petPhoto}>
          <Text style={styles.petPhotoEmoji}>
            {petType === 'dog'
              ? '🐶'
              : petType === 'cat'
              ? '🐱'
              : '🐾'}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Basics</Text>

        <Label text="Pet name *" />

        <Input
          value={petName}
          onChangeText={setPetName}
          placeholder="e.g. Vicki"
        />

        <Label text="What kind of pet? *" />

        <View style={styles.row}>
          <OptionButton
            title="🐱 Cat"
            selected={petType === 'cat'}
            onPress={() => setPetType('cat')}
          />

          <OptionButton
            title="🐶 Dog"
            selected={petType === 'dog'}
            onPress={() => setPetType('dog')}
          />
        </View>

        <Label text="Breed" />

        <Input
          value={breed}
          onChangeText={setBreed}
          placeholder="e.g. Persian"
        />

        <Label text="Date of birth or approximate age" />

        <Input
          value={petAge}
          onChangeText={setPetAge}
          placeholder="e.g. May 2022 or about 4 years"
        />

        <Label text="Sex" />

        <View style={styles.row}>
          <OptionButton
            title="Female"
            selected={petSex === 'female'}
            onPress={() => setPetSex('female')}
          />

          <OptionButton
            title="Male"
            selected={petSex === 'male'}
            onPress={() => setPetSex('male')}
          />
        </View>

        <Label text={`${alteredLabel}?`} />

        <View style={styles.row}>
          <OptionButton
            title="Yes"
            selected={alteredStatus === 'yes'}
            onPress={() => setAlteredStatus('yes')}
          />

          <OptionButton
            title="No"
            selected={alteredStatus === 'no'}
            onPress={() => setAlteredStatus('no')}
          />

          <OptionButton
            title="Not sure"
            selected={alteredStatus === 'notSure'}
            onPress={() => setAlteredStatus('notSure')}
          />
        </View>

        <Text style={styles.sectionTitle}>
          Health details
        </Text>

        <Label text="Weight" />

        <Input
          value={weight}
          onChangeText={setWeight}
          placeholder="e.g. 4 kg"
        />

        <Label text="Microchip number" />

        <Input
          value={microchip}
          onChangeText={setMicrochip}
          placeholder="Optional"
        />

        <Label text="Existing health conditions" />

        <Input
          value={conditions}
          onChangeText={setConditions}
          placeholder="e.g. kidney disease"
          multiline
        />

        <Label text="Allergies" />

        <Input
          value={allergies}
          onChangeText={setAllergies}
          placeholder="Optional"
          multiline
        />

        <Label text="Current medications" />

        <Input
          value={medications}
          onChangeText={setMedications}
          placeholder="Medication, dose, frequency"
          multiline
        />

        <Label text="Primary vet or clinic" />

        <Input
          value={vetClinic}
          onChangeText={setVetClinic}
          placeholder="Clinic name"
        />

        {databaseError !== '' && (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Could not save pet</Text>
            <Text style={styles.errorText}>{databaseError}</Text>
          </View>
        )}

        <PrimaryButton
          title={isSavingPet ? 'Saving Pet…' : 'Create Pet Profile'}
          disabled={!canCreateProfile || isSavingPet}
          onPress={createPetProfile}
        />
      </Page>
    );
}
