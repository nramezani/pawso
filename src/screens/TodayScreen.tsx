import { Pressable, Text, View } from 'react-native';

import { usePawso } from '../context/PawsoContext';
import {
  Page,
  PrimaryButton,
  SecondaryButton,
  QuickAction,
  styles,
} from '../components/ui';

export function TodayScreen() {
  const {
    apiStatus,
    checkBackend,
    uploadError,
    petName,
    petEmoji,
    pets,
    currentPetId,
    todayView,
    setTodayView,
    allPetsToday,
    selectPet,
    startAddPet,
    medicationsError,
    careError,
    overdueMedicationDoses,
    overdueCareTasks,
    dueSoonMedicationDoses,
    laterMedicationDoses,
    upcomingCareTasks,
    completedMedicationDoses,
    followUpEvents,
    loggingDoseId,
    completingTaskId,
    logMedicationDose,
    completeCareTask,
    formatMedicationTime,
    formatDueLabel,
    openAskScreen,
    openVetVisitPrep,
    openHealthCheckIn,
    openSmartCarePlan,
    openMedicationsScreen,
    pickVetRecord,
    openCareScreen,
    openDocumentsScreen,
    timelineEvents,
    setScreen,
    canManageMedical,
    notificationPermission,
    notificationsEnabled,
    notificationSyncing,
    scheduledNotificationCount,
    notificationError,
    enableNotifications,
    disableNotifications,
  } = usePawso();

  const showAllPets = pets.length > 1 && todayView === 'all';

  async function openPetToday(petId: string) {
    await selectPet(petId);
    setTodayView('pet');
  }

  return (
    <Page scroll>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.todayTitle}>Good morning</Text>
          <Text style={styles.todaySubtitle}>
            {showAllPets
              ? `Here's what your ${pets.length} pets need today.`
              : `Here's what ${petName} needs today.`}
          </Text>
        </View>

        <View style={styles.smallAvatar}>
          <Text>{showAllPets ? '🐾' : petEmoji}</Text>
        </View>
      </View>

      <Text style={styles.logo}>Pawso</Text>

      {apiStatus !== 'Backend connected' ? (
      <Pressable
          style={[
            styles.apiStatus,
            apiStatus === 'Backend connected'
              ? styles.apiStatusConnected
              : styles.apiStatusDisconnected,
          ]}
          onPress={checkBackend}
          accessibilityRole="button"
          accessibilityLabel={`API status: ${apiStatus}. Tap to refresh.`}
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
          <Text style={styles.apiRefresh}>Tap to refresh</Text>
        </Pressable>
      ) : null}

      <View style={styles.infoCard}>
        <View style={styles.reminderHeaderRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardStrong}>🔔 Pawso reminders</Text>
            <Text style={styles.cardMuted}>
              {notificationsEnabled && notificationPermission === 'granted'
                ? `${scheduledNotificationCount} local reminder${
                    scheduledNotificationCount === 1 ? '' : 's'
                  } scheduled across your pets.`
                : notificationPermission === 'denied'
                ? 'Notifications are blocked in your device settings.'
                : 'Get medication and care-task reminders on this device.'}
            </Text>
          </View>

          <Pressable
            style={[
              styles.reminderToggleButton,
              notificationsEnabled &&
                notificationPermission === 'granted' &&
                styles.reminderToggleButtonEnabled,
            ]}
            disabled={notificationSyncing}
            accessibilityRole="switch"
            accessibilityLabel="Pawso reminders"
            accessibilityState={{
              checked: notificationsEnabled && notificationPermission === 'granted',
              disabled: notificationSyncing,
            }}
            onPress={
              notificationsEnabled
                ? disableNotifications
                : enableNotifications
            }
          >
            <Text
              style={[
                styles.reminderToggleText,
                notificationsEnabled &&
                  notificationPermission === 'granted' &&
                  styles.reminderToggleTextEnabled,
              ]}
            >
              {notificationSyncing
                ? 'Working…'
                : notificationsEnabled
                ? 'On'
                : 'Enable'}
            </Text>
          </Pressable>
        </View>

        {notificationError ? (
          <Text style={styles.errorText}>{notificationError}</Text>
        ) : null}

        <Text style={styles.reminderFinePrint}>
          Medication times and care-task due dates are scheduled directly from
          your confirmed Pawso records. Pawso does not change medication timing
          or dosing.
        </Text>
      </View>

      {uploadError !== '' ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Upload failed</Text>
          <Text style={styles.errorText}>{uploadError}</Text>
        </View>
      ) : null}

      {pets.length > 1 ? (
        <View style={styles.todayScopeRow}>
          <Pressable
            style={[
              styles.todayScopeButton,
              showAllPets && styles.todayScopeButtonSelected,
            ]}
            onPress={() => setTodayView('all')}
            accessibilityRole="tab"
            accessibilityLabel="Show all pets"
            accessibilityState={{ selected: showAllPets }}
          >
            <Text
              style={[
                styles.todayScopeText,
                showAllPets && styles.todayScopeTextSelected,
              ]}
            >
              All Pets
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.todayScopeButton,
              !showAllPets && styles.todayScopeButtonSelected,
            ]}
            onPress={() => setTodayView('pet')}
            accessibilityRole="tab"
            accessibilityLabel={`Show ${petName} only`}
            accessibilityState={{ selected: !showAllPets }}
          >
            <Text
              style={[
                styles.todayScopeText,
                !showAllPets && styles.todayScopeTextSelected,
              ]}
            >
              {petEmoji} {petName}
            </Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.petChip}>
          <Text style={styles.petChipText}>
            {petEmoji} {petName}
          </Text>
        </View>
      )}

      {showAllPets ? (
        <>
          <Text style={styles.sectionTitle}>All Pets Today</Text>

          {allPetsToday.map((summary) => {
            const pet = pets.find((item) => item.id === summary.pet_id);
            const emoji = summary.species === 'dog' ? '🐶' : '🐱';
            const dueTotal =
              summary.care_due_today + summary.medication_doses_pending;

            return (
              <Pressable
                key={summary.pet_id}
                style={[
                  styles.allPetsCard,
                  summary.overdue_count > 0 && styles.allPetsCardAttention,
                ]}
                onPress={() => openPetToday(summary.pet_id)}
                accessibilityRole="button"
                accessibilityLabel={`View ${summary.name}'s today`}
              >
                <View style={styles.petListAvatar}>
                  <Text style={{ fontSize: 27 }}>{emoji}</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <View style={styles.allPetsTitleRow}>
                    <Text style={styles.cardStrong}>{summary.name}</Text>
                    {summary.pet_id === currentPetId ? (
                      <Text style={styles.selectedPetBadge}>Selected</Text>
                    ) : null}
                  </View>

                  <Text style={styles.cardMuted}>
                    {summary.overdue_count > 0
                      ? `${summary.overdue_count} overdue · `
                      : ''}
                    {dueTotal === 0
                      ? 'Nothing pending today'
                      : `${summary.medication_doses_pending} medication dose${
                          summary.medication_doses_pending === 1 ? '' : 's'
                        } pending · ${summary.care_due_today} care task${
                          summary.care_due_today === 1 ? '' : 's'
                        }`}
                  </Text>

                  {summary.medication_doses_today > 0 ? (
                    <Text style={styles.allPetsMeta}>
                      {summary.medication_doses_today} scheduled medication dose
                      {summary.medication_doses_today === 1 ? '' : 's'} today
                    </Text>
                  ) : null}
                </View>

                <Text style={styles.petListChevron}>›</Text>
              </Pressable>
            );
          })}

          <PrimaryButton title="+ Add another pet" onPress={startAddPet} />

        </>
      ) : (
        <>
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
                    {[dose.medication.dose, dose.medication.unit]
                      .filter(Boolean)
                      .join(' ') || 'Dose not specified'}
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
                  accessibilityRole="button"
                  accessibilityLabel={`Mark ${dose.medication.name} as given`}
                >
                  <Text style={styles.givenButtonText}>
                    {loggingDoseId === dose.schedule.id ? 'Saving…' : '✓ Given'}
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.skipDoseButton}
                  disabled={loggingDoseId === dose.schedule.id}
                  onPress={() => logMedicationDose(dose, 'skipped')}
                  accessibilityRole="button"
                  accessibilityLabel={`Skip ${dose.medication.name} dose`}
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
              {task.notes ? (
                <Text style={styles.careNotes}>{task.notes}</Text>
              ) : null}
              <Pressable
                style={styles.completeCareButton}
                disabled={completingTaskId === task.id}
                onPress={() => completeCareTask(task)}
                accessibilityRole="button"
                accessibilityLabel={`Mark ${task.title} complete`}
              >
                <Text style={styles.completeCareButtonText}>
                  {completingTaskId === task.id
                    ? 'Saving…'
                    : '✓ Mark complete'}
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
                <Text style={styles.cardMuted}>
                  You're on top of today's care.
                </Text>
              </View>
            </View>
          ) : null}

          <Text style={styles.sectionTitle}>Today’s Care</Text>

          {dueSoonMedicationDoses.map((dose) => (
            <View key={`soon-${dose.schedule.id}`} style={styles.medicationDueCard}>
              <View style={styles.medicationDueHeader}>
                <View style={styles.medicationIcon}>
                  <Text>💊</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardStrong}>{dose.medication.name}</Text>
                  <Text style={styles.cardMuted}>
                    {[dose.medication.dose, dose.medication.unit]
                      .filter(Boolean)
                      .join(' ') || 'Dose not specified'}
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
                  accessibilityRole="button"
                  accessibilityLabel={`Mark ${dose.medication.name} as given`}
                >
                  <Text style={styles.givenButtonText}>✓ Given</Text>
                  {dose.log?.actor_name ? (
                    <Text style={styles.cardMuted}>
                      by {dose.log.actor_name}
                    </Text>
                  ) : null}
                </Pressable>
                <Pressable
                  style={styles.skipDoseButton}
                  disabled={loggingDoseId === dose.schedule.id}
                  onPress={() => logMedicationDose(dose, 'skipped')}
                  accessibilityRole="button"
                  accessibilityLabel={`Skip ${dose.medication.name} dose`}
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
                  <View style={styles.medicationIcon}>
                    <Text>✓</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardStrong}>{task.title}</Text>
                    <Text style={styles.cardMuted}>
                      {formatDueLabel(task.due_at)}
                    </Text>
                  </View>
                </View>
                <Pressable
                  style={styles.completeCareButton}
                  disabled={completingTaskId === task.id}
                  onPress={() => completeCareTask(task)}
                  accessibilityRole="button"
                  accessibilityLabel={`Mark ${task.title} complete`}
                >
                  <Text style={styles.completeCareButtonText}>
                    {completingTaskId === task.id
                      ? 'Saving…'
                      : '✓ Mark complete'}
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
                    <Text style={styles.cardMuted}>
                      {formatDueLabel(task.due_at)}
                    </Text>
                  </View>
                </View>
              ))}
            </>
          )}

          {(medicationsError !== '' || careError !== '') && (
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle}>
                Today could not fully update
              </Text>
              <Text style={styles.errorText}>
                {medicationsError || careError}
              </Text>
            </View>
          )}

          <Text style={styles.sectionTitle}>Pawso AI</Text>
          <View style={styles.aiCard}>
            <Text style={styles.aiBadge}>AI PET MEMORY</Text>
            <Text style={styles.aiTitle}>Ask about {petName}</Text>
            <Text style={styles.aiText}>
              Pawso answers from {petName}'s confirmed health timeline,
              medications, and care records.
            </Text>
            <Pressable
              style={styles.outlineButton}
              onPress={openAskScreen}
              accessibilityRole="button"
              accessibilityLabel="Ask Pawso"
            >
              <Text style={styles.outlineButtonText}>✨ Ask Pawso</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionTitle}>Quick actions</Text>
          <View style={styles.quickGrid}>
            <QuickAction
              icon="💊"
              label="Medication"
              onPress={openMedicationsScreen}
            />
            {canManageMedical ? <QuickAction icon="📄" label="Record" onPress={pickVetRecord} /> : null}
            {canManageMedical ? (
              <>
                <QuickAction
                  icon="🩺"
                  label="Symptom"
                  onPress={() => openHealthCheckIn('symptom')}
                />
                <QuickAction
                  icon="⚖️"
                  label="Weight"
                  onPress={() => openHealthCheckIn('weight')}
                />
              </>
            ) : null}
            <QuickAction icon="📅" label="Care task" onPress={openCareScreen} />
          </View>

          <Text style={styles.sectionTitle}>More for {petName}</Text>
          <SecondaryButton
            title="Health timeline"
            onPress={() => setScreen('timeline')}
          />
          <SecondaryButton
            title="Veterinary documents"
            onPress={openDocumentsScreen}
          />
          <SecondaryButton
            title="Prepare for a vet visit"
            onPress={openVetVisitPrep}
          />
          <SecondaryButton
            title="Smart Care Plan"
            onPress={openSmartCarePlan}
          />
          <SecondaryButton
            title="View pet profile"
            onPress={() => setScreen('petProfile')}
          />
        </>
      )}
    </Page>
  );
}
