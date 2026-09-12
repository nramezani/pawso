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

export function TodayScreen() {
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
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.todayTitle}>
              Good morning
            </Text>

            <Text style={styles.todaySubtitle}>
              Here's what {petName} needs today.
            </Text>
          </View>

          <View style={styles.smallAvatar}>
            <Text>{petEmoji}</Text>
          </View>
        </View>

        <Text style={styles.logo}>Pawso</Text>

        <Pressable
          style={[
            styles.apiStatus,
            apiStatus === 'Backend connected'
              ? styles.apiStatusConnected
              : styles.apiStatusDisconnected,
          ]}
          onPress={checkBackend}
        >
          <View
            style={[
              styles.apiDot,
              apiStatus === 'Backend connected'
                ? styles.apiDotConnected
                : styles.apiDotDisconnected,
            ]}
          />

          <Text
            style={[
              styles.apiStatusText,
              apiStatus === 'Backend connected'
                ? styles.apiStatusTextConnected
                : styles.apiStatusTextDisconnected,
            ]}
          >
            {apiStatus}
          </Text>

          <Text style={styles.apiRefresh}>
            Tap to refresh
          </Text>
        </Pressable>

        {uploadError !== '' && (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>
              Upload failed
            </Text>

            <Text style={styles.errorText}>
              {uploadError}
            </Text>
          </View>
        )}

        <View style={styles.petChip}>
          <Text style={styles.petChipText}>
            {petEmoji} {petName}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Needs Attention</Text>

        {overdueMedicationDoses.map((dose) => (
          <View key={`overdue-${dose.schedule.id}`} style={styles.attentionCard}>
            <View style={styles.medicationDueHeader}>
              <View style={styles.attentionIcon}>
                <Text>💊</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.attentionTitle}>Medication overdue</Text>
                <Text style={styles.cardStrong}>{dose.medication.name}</Text>
                <Text style={styles.cardMuted}>
                  {[dose.medication.dose, dose.medication.unit].filter(Boolean).join(' ') ||
                    'Dose not specified'}
                  {' · '}
                  {formatMedicationTime(dose.scheduledFor)}
                </Text>
              </View>
            </View>

            <View style={styles.medicationActionRow}>
              <Pressable
                style={styles.givenButton}
                disabled={loggingDoseId === dose.schedule.id}
                onPress={() => logMedicationDose(dose, 'given')}
              >
                <Text style={styles.givenButtonText}>
                  {loggingDoseId === dose.schedule.id ? 'Saving…' : '✓ Given'}
                </Text>
              </Pressable>
              <Pressable
                style={styles.skipDoseButton}
                disabled={loggingDoseId === dose.schedule.id}
                onPress={() => logMedicationDose(dose, 'skipped')}
              >
                <Text style={styles.skipDoseButtonText}>Skip</Text>
              </Pressable>
            </View>
          </View>
        ))}

        {overdueCareTasks.map((task) => (
          <View key={`overdue-task-${task.id}`} style={styles.attentionCard}>
            <Text style={styles.attentionTitle}>Care task overdue</Text>
            <Text style={styles.cardStrong}>{task.title}</Text>
            <Text style={styles.cardMuted}>{formatDueLabel(task.due_at)}</Text>
            {task.notes ? <Text style={styles.careNotes}>{task.notes}</Text> : null}
            <Pressable
              style={styles.completeCareButton}
              disabled={completingTaskId === task.id}
              onPress={() => completeCareTask(task)}
            >
              <Text style={styles.completeCareButtonText}>
                {completingTaskId === task.id ? 'Saving…' : '✓ Mark complete'}
              </Text>
            </Pressable>
          </View>
        ))}

        {overdueMedicationDoses.length === 0 &&
        overdueCareTasks.length === 0 ? (
          <View style={styles.successCard}>
            <Text style={styles.successIcon}>✓</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardStrong}>Nothing overdue</Text>
              <Text style={styles.cardMuted}>You're on top of today's care.</Text>
            </View>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Today’s Care</Text>

        {dueSoonMedicationDoses.map((dose) => (
          <View key={`soon-${dose.schedule.id}`} style={styles.medicationDueCard}>
            <View style={styles.medicationDueHeader}>
              <View style={styles.medicationIcon}><Text>💊</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardStrong}>{dose.medication.name}</Text>
                <Text style={styles.cardMuted}>
                  {[dose.medication.dose, dose.medication.unit].filter(Boolean).join(' ') ||
                    'Dose not specified'}
                  {' · due '}
                  {formatMedicationTime(dose.scheduledFor)}
                </Text>
              </View>
            </View>
            <View style={styles.medicationActionRow}>
              <Pressable
                style={styles.givenButton}
                disabled={loggingDoseId === dose.schedule.id}
                onPress={() => logMedicationDose(dose, 'given')}
              >
                <Text style={styles.givenButtonText}>✓ Given</Text>
              </Pressable>
              <Pressable
                style={styles.skipDoseButton}
                disabled={loggingDoseId === dose.schedule.id}
                onPress={() => logMedicationDose(dose, 'skipped')}
              >
                <Text style={styles.skipDoseButtonText}>Skip</Text>
              </Pressable>
            </View>
          </View>
        ))}

        {laterMedicationDoses.map((dose) => (
          <View key={`later-${dose.schedule.id}`} style={styles.careListCard}>
            <Text style={styles.careListIcon}>💊</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardStrong}>{dose.medication.name}</Text>
              <Text style={styles.cardMuted}>
                Scheduled for {formatMedicationTime(dose.scheduledFor)}
              </Text>
            </View>
          </View>
        ))}

        {upcomingCareTasks
          .filter((task) => {
            const due = new Date(task.due_at);
            const end = new Date();
            end.setHours(23, 59, 59, 999);
            return due <= end;
          })
          .map((task) => (
            <View key={`today-task-${task.id}`} style={styles.medicationDueCard}>
              <View style={styles.medicationDueHeader}>
                <View style={styles.medicationIcon}><Text>✓</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardStrong}>{task.title}</Text>
                  <Text style={styles.cardMuted}>{formatDueLabel(task.due_at)}</Text>
                </View>
              </View>
              <Pressable
                style={styles.completeCareButton}
                disabled={completingTaskId === task.id}
                onPress={() => completeCareTask(task)}
              >
                <Text style={styles.completeCareButtonText}>
                  {completingTaskId === task.id ? 'Saving…' : '✓ Mark complete'}
                </Text>
              </Pressable>
            </View>
          ))}

        {dueSoonMedicationDoses.length === 0 &&
        laterMedicationDoses.length === 0 &&
        upcomingCareTasks.filter((task) => {
          const due = new Date(task.due_at);
          const end = new Date();
          end.setHours(23, 59, 59, 999);
          return due <= end;
        }).length === 0 ? (
          <View style={styles.successCard}>
            <Text style={styles.successIcon}>✓</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardStrong}>No more care due today</Text>
              <Text style={styles.cardMuted}>
                Completed doses: {completedMedicationDoses.length}
              </Text>
            </View>
          </View>
        ) : null}

        {(followUpEvents.length > 0 || upcomingCareTasks.length > 0) && (
          <>
            <Text style={styles.sectionTitle}>Coming Up</Text>

            {followUpEvents.slice(0, 2).map((event) => (
              <View key={`follow-${event.id}`} style={styles.careListCard}>
                <Text style={styles.careListIcon}>🩺</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardStrong}>{event.title}</Text>
                  <Text style={styles.cardMuted}>{event.detail}</Text>
                </View>
              </View>
            ))}

            {upcomingCareTasks.slice(0, 3).map((task) => (
              <View key={`upcoming-${task.id}`} style={styles.careListCard}>
                <Text style={styles.careListIcon}>📅</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardStrong}>{task.title}</Text>
                  <Text style={styles.cardMuted}>{formatDueLabel(task.due_at)}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {(medicationsError !== '' || careError !== '') && (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Today could not fully update</Text>
            <Text style={styles.errorText}>{medicationsError || careError}</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>
          Pawso AI
        </Text>

        <View style={styles.aiCard}>
          <Text style={styles.aiBadge}>
            AI PET MEMORY
          </Text>

          <Text style={styles.aiTitle}>
            Ask about {petName}
          </Text>

          <Text style={styles.aiText}>
            Pawso answers from {petName}'s confirmed health timeline,
            medications, and care records.
          </Text>

          <Pressable
            style={styles.outlineButton}
            onPress={openAskScreen}
          >
            <Text style={styles.outlineButtonText}>
              ✨ Ask Pawso
            </Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>
          Quick actions
        </Text>

        <View style={styles.quickGrid}>
          <QuickAction
            icon="💊"
            label="Medication"
            onPress={openMedicationsScreen}
          />

          <QuickAction
            icon="📄"
            label="Record"
            onPress={pickVetRecord}
          />

          <QuickAction
            icon="🩺"
            label="Symptom"
          />

          <QuickAction
            icon="⚖️"
            label="Weight"
          />

          <QuickAction
            icon="📅"
            label="Care task"
            onPress={openCareScreen}
          />

          <QuickAction
            icon="✨"
            label="Ask Pawso"
            onPress={openAskScreen}
          />
        </View>

        {timelineEvents.length > 0 && (
          <PrimaryButton
            title="View Health Timeline"
            onPress={() => setScreen('timeline')}
          />
        )}

        <SecondaryButton
          title={`Ask Pawso about ${petName}`}
          onPress={openAskScreen}
        />

        <SecondaryButton
          title="Care & Reminders"
          onPress={openCareScreen}
        />

        <SecondaryButton
          title="Medications & Doses"
          onPress={openMedicationsScreen}
        />

        <SecondaryButton
          title="Documents & Medical Records"
          onPress={openDocumentsScreen}
        />

        <SecondaryButton
          title={`View ${petName}'s profile`}
          onPress={() => setScreen('petProfile')}
        />
      </Page>
    );
}
