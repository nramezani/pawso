import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';

import { usePawso } from '../context/PawsoContext';
import {
  ActivityBarChart,
  ProgressOverview,
} from '../components/VisualSummary';
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

export function MedicationsScreen() {
  const {
    setScreen,
    canManageMedical,
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
    deleteMedication,
    deletingMedicationId,
    setMedicationList,
    medicationSchedules,
    setMedicationSchedules,
    medicationLogs,
    setMedicationLogs,
    medicationHistoryLogs,
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

  const givenToday = todayMedicationDoses.filter(
    (dose) => dose.log?.status === 'given'
  ).length;
  const skippedToday = todayMedicationDoses.filter(
    (dose) => dose.log?.status === 'skipped'
  ).length;
  const medicationActivityBuckets = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    const dayStart = date.getTime();
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    const dayEnd = nextDate.getTime();
    const logs = medicationHistoryLogs.filter((log) => {
      const scheduledFor = new Date(log.scheduled_for).getTime();
      return scheduledFor >= dayStart && scheduledFor < dayEnd;
    });

    return {
      key: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
      label:
        index === 6
          ? 'Today'
          : date.toLocaleDateString([], { weekday: 'short' }),
      values: {
        given: logs.filter((log) => log.status === 'given').length,
        skipped: logs.filter((log) => log.status === 'skipped').length,
      },
    };
  });

return (
      <Page scroll>
        <Header back={() => setScreen('today')} title="Medications" />

        <View style={styles.medicationHero}>
          <View style={styles.medicationHeroIcon}>
            <Text style={styles.medicationHeroEmoji}>💊</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.documentsTitle}>{petName}'s medications</Text>
            <Text style={styles.cardMuted}>
              Track medication schedules and log each dose. Pawso never changes a dose or schedule on its own.
            </Text>
          </View>
        </View>

        {todayMedicationDoses.length > 0 ? (
          <ProgressOverview
            title="Today's dose log"
            completed={completedMedicationDoses.length}
            total={todayMedicationDoses.length}
            detail={
              pendingMedicationDoses.length === 0
                ? 'Every scheduled dose has been logged.'
                : `${pendingMedicationDoses.length} scheduled dose${
                    pendingMedicationDoses.length === 1 ? '' : 's'
                  } still need a status.`
            }
            breakdown={[
              { label: 'Given', value: givenToday, icon: '✓', tone: 'green' },
              { label: 'Skipped', value: skippedToday, icon: '↷', tone: 'amber' },
              {
                label: 'Pending',
                value: pendingMedicationDoses.length,
                icon: '○',
                tone: 'purple',
              },
            ]}
          />
        ) : null}

        {medicationHistoryLogs.length >= 2 ? (
          <ActivityBarChart
            title="Dose activity · 7 days"
            detail={`${medicationHistoryLogs.length} dose outcome${
              medicationHistoryLogs.length === 1 ? '' : 's'
            } logged during this period.`}
            buckets={medicationActivityBuckets}
            series={[
              { key: 'given', label: 'Given', color: '#2F6F63' },
              { key: 'skipped', label: 'Skipped', color: '#D98B2B' },
            ]}
            note="This chart shows recorded outcomes only. It does not judge adherence or infer unlogged doses."
          />
        ) : null}

        {completedMedicationDoses.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Today&apos;s logged doses</Text>
            {completedMedicationDoses.map((dose) => (
              <View
                key={`logged-${dose.schedule.id}`}
                style={styles.careListCard}
              >
                <Text style={styles.careListIcon}>
                  {dose.log?.status === 'given' ? '✓' : '↷'}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardStrong}>{dose.medication.name}</Text>
                  <Text style={styles.cardMuted}>
                    {dose.log?.status === 'given' ? 'Given' : 'Skipped'} ·{' '}
                    {formatMedicationTime(dose.scheduledFor)}
                    {dose.log?.actor_name ? ` · ${dose.log.actor_name}` : ''}
                  </Text>
                </View>
              </View>
            ))}
          </>
        ) : null}

        {canManageMedical ? (
          <PrimaryButton
            title="Add Medication"
            onPress={() => setScreen('addMedication')}
          />
        ) : (
          <View style={styles.infoCard}>
            <Text style={styles.cardStrong}>Medication details are read-only</Text>
            <Text style={styles.cardMuted}>
              You can log scheduled doses, but only the household owner can add or change medication instructions.
            </Text>
          </View>
        )}

        {medicationsError !== '' && (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Medication error</Text>
            <Text style={styles.errorText}>{medicationsError}</Text>
          </View>
        )}

        {medicationsLoading ? (
          <View style={styles.documentsLoading}>
            <ActivityIndicator size="large" color="#2F6F63" />
            <Text style={styles.cardMuted}>Loading medications…</Text>
          </View>
        ) : medicationList.length === 0 ? (
          <View style={styles.emptyDocuments}>
            <Text style={styles.bigEmoji}>💊</Text>
            <Text style={styles.cardStrong}>No medications yet</Text>
            <Text style={styles.cardMuted}>
              Add a medication and its daily time to make it appear on Today.
            </Text>
          </View>
        ) : (
          medicationList.map((medication) => {
            const schedules = medicationSchedules.filter(
              (schedule) => schedule.medication_id === medication.id
            );

            return (
              <View key={medication.id} style={styles.documentCard}>
                <View style={styles.medicationDueHeader}>
                  <View style={styles.medicationIcon}>
                    <Text>💊</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.documentCardTitle}>{medication.name}</Text>
                    <Text style={styles.documentCardMeta}>
                      {[medication.dose, medication.unit].filter(Boolean).join(' ') ||
                        'Dose not specified'}
                    </Text>
                  </View>

                  {canManageMedical ? (
                    <Pressable
                      style={styles.iconActionButton}
                      accessibilityRole="button"
                      accessibilityLabel={`Archive ${medication.name}`}
                      disabled={deletingMedicationId === medication.id}
                      accessibilityState={{ disabled: deletingMedicationId === medication.id }}
                      onPress={() =>
                        Alert.alert(
                          'Archive medication?',
                          `This removes "${medication.name}" from active schedules while keeping its dose history.`,
                          [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Archive',
                              onPress: () => deleteMedication(medication),
                            },
                          ]
                        )
                      }
                    >
                      <Text style={{ fontSize: 18, opacity: deletingMedicationId === medication.id ? 0.4 : 1 }}>
                        📦
                      </Text>
                    </Pressable>
                  ) : null}
                </View>

                {medication.instructions ? (
                  <Text style={styles.medicationInstructions}>
                    {medication.instructions}
                  </Text>
                ) : null}

                <View style={styles.scheduleWrap}>
                  {schedules.map((schedule) => (
                    <View key={schedule.id} style={styles.scheduleChip}>
                      <Text style={styles.scheduleChipText}>
                        {formatMedicationTime(buildScheduledDate(schedule.time_of_day))}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })
        )}

        <SecondaryButton title="Back to Today" onPress={() => setScreen('today')} />
      </Page>
    );
}
