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

export function DocumentsScreen() {
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
      <Page scroll>
        <Header back={() => setScreen('today')} title="Medical Records" />

        <View style={styles.documentsHero}>
          <View style={styles.documentHeroIcon}>
            <Text style={styles.documentHeroEmoji}>📄</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.documentsTitle}>{petName}'s documents</Text>
            <Text style={styles.cardMuted}>
              Original veterinary records are stored privately and linked to the health history they created.
            </Text>
          </View>
        </View>

        <Pressable style={styles.outlineButton} onPress={pickVetRecord}>
          <Text style={styles.outlineButtonText}>＋ Upload veterinary record</Text>
        </Pressable>

        {documentsError !== '' && (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Medical records error</Text>
            <Text style={styles.errorText}>{documentsError}</Text>
          </View>
        )}

        {documentsLoading ? (
          <View style={styles.documentsLoading}>
            <ActivityIndicator size="large" color="#2F6F63" />
            <Text style={styles.cardMuted}>Loading medical records…</Text>
          </View>
        ) : petDocuments.length === 0 ? (
          <View style={styles.emptyDocuments}>
            <Text style={styles.bigEmoji}>📁</Text>
            <Text style={styles.cardStrong}>No medical records yet</Text>
            <Text style={styles.cardMuted}>
              Upload a veterinary PDF or image to start {petName}'s document library.
            </Text>
          </View>
        ) : (
          petDocuments.map((document) => (
            <View key={document.id} style={styles.documentCard}>
              <View style={styles.documentCardHeader}>
                <View style={styles.documentIconBox}>
                  <Text style={styles.documentCardEmoji}>
                    {document.content_type?.includes('pdf') ? '📕' : '🖼️'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.documentCardTitle} numberOfLines={2}>
                    {document.filename}
                  </Text>
                  <Text style={styles.documentCardMeta}>
                    {formatDocumentDate(document.created_at)} · {formatDocumentSize(document.size_bytes)}
                  </Text>
                </View>
              </View>

              <View style={styles.documentStatusRow}>
                <View style={[
                  styles.documentStatusBadge,
                  document.status === 'confirmed'
                    ? styles.documentStatusConfirmed
                    : styles.documentStatusPending,
                ]}>
                  <Text style={[
                    styles.documentStatusText,
                    document.status === 'confirmed'
                      ? styles.documentStatusTextConfirmed
                      : styles.documentStatusTextPending,
                  ]}>
                    {document.status === 'confirmed'
                      ? '✓ Confirmed'
                      : document.status.replaceAll('_', ' ')}
                  </Text>
                </View>

                <Text style={styles.linkedEventsText}>
                  {document.linked_events} {document.linked_events === 1 ? 'timeline event' : 'timeline events'}
                </Text>
              </View>

              <Pressable
                style={[
                  styles.documentOpenButton,
                  (!document.storage_path || openingDocumentId === document.id) &&
                    styles.documentOpenButtonDisabled,
                ]}
                disabled={!document.storage_path || openingDocumentId === document.id}
                onPress={() => openOriginalDocument(document)}
              >
                <Text style={styles.documentOpenButtonText}>
                  {openingDocumentId === document.id
                    ? 'Opening secure file…'
                    : document.storage_path
                    ? 'Open original securely'
                    : 'Original file unavailable'}
                </Text>
              </Pressable>
            </View>
          ))
        )}

        <SecondaryButton title="Back to Today" onPress={() => setScreen('today')} />
      </Page>
    );
}
