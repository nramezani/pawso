import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';

import { usePawso } from '../context/PawsoContext';
import { addDaysToDateInput, formatDateInputInTimeZone } from '../utils/dateTime';
import {
  ActivityBarChart,
  ProgressOverview,
} from '../components/VisualSummary';
import {
  Page,
  Header,
  PrimaryButton,
  SecondaryButton,
  styles,
} from '../components/ui';

export function MedicationsScreen() {
  const {
    setScreen,
    canManageMedical,
    accountUserId,
    petName,
    medicationList,
    deleteMedication,
    startAddMedication,
    startEditMedication,
    setMedicationState,
    deletingMedicationId,
    medicationSchedules,
    medicationHistoryLogs,
    medicationsLoading,
    medicationsError,
    loggingDoseId,
    buildScheduledDate,
    formatMedicationTime,
    logMedicationDose,
    todayMedicationDoses,
    pendingMedicationDoses,
    completedMedicationDoses,
    isOnline,
    householdTimeZone,
  } = usePawso();

  const givenToday = todayMedicationDoses.filter(
    (dose) => dose.log?.status === 'given'
  ).length;
  const skippedToday = todayMedicationDoses.filter(
    (dose) => dose.log?.status === 'skipped'
  ).length;
  const householdToday = formatDateInputInTimeZone(new Date(), householdTimeZone);
  const medicationActivityBuckets = Array.from({ length: 7 }, (_, index) => {
    const dateValue = addDaysToDateInput(householdToday, -(6 - index));
    const logs = medicationHistoryLogs.filter(
      (log) =>
        formatDateInputInTimeZone(
          new Date(log.scheduled_for),
          householdTimeZone
        ) === dateValue
    );

    return {
      key: dateValue,
      label:
        index === 6
          ? 'Today'
          : new Date(`${dateValue}T12:00:00Z`).toLocaleDateString([], {
              weekday: 'short',
              timeZone: 'UTC',
            }),
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
                  {dose.log?.corrected_at ? (
                    <Text style={styles.reminderFinePrint}>
                      Corrected {new Date(dose.log.corrected_at).toLocaleString()}
                      {dose.log.correction_reason
                        ? ` · ${dose.log.correction_reason}`
                        : ''}
                    </Text>
                  ) : null}
                </View>
                {canManageMedical || dose.log?.user_id === accountUserId ? (
                  <Pressable
                    style={styles.compactActionButton}
                    disabled={!isOnline || loggingDoseId === dose.schedule.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Correct ${dose.medication.name} to ${
                      dose.log?.status === 'given' ? 'skipped' : 'given'
                    }`}
                    onPress={() =>
                      Alert.alert(
                        'Correct dose record?',
                        `Change ${dose.medication.name} from ${dose.log?.status} to ${
                          dose.log?.status === 'given' ? 'skipped' : 'given'
                        }? Pawso keeps an audit record of this correction.`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Correct record',
                            onPress: () =>
                              logMedicationDose(
                                dose,
                                dose.log?.status === 'given' ? 'skipped' : 'given',
                                'Corrected an inaccurate dose outcome in Pawso.'
                              ),
                          },
                        ]
                      )
                    }
                  >
                    <Text style={styles.compactActionText}>Correct</Text>
                  </Pressable>
                ) : null}
              </View>
            ))}
          </>
        ) : null}

        {canManageMedical ? (
          <PrimaryButton
            title="Add Medication"
            onPress={startAddMedication}
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

                <Text style={styles.documentCardMeta}>
                  {medication.paused_at
                    ? 'Reminders paused'
                    : [
                        medication.start_date ? `Starts ${medication.start_date}` : null,
                        medication.end_date ? `Ends ${medication.end_date}` : null,
                        medication.refills_remaining !== null
                          ? `${medication.refills_remaining} refill${medication.refills_remaining === 1 ? '' : 's'} left`
                          : null,
                        medication.refill_due_date ? `Refill due ${medication.refill_due_date}` : null,
                      ].filter(Boolean).join(' · ') || 'Ongoing course'
                  }
                </Text>

                <View style={styles.scheduleWrap}>
                  {schedules.map((schedule) => (
                    <View key={schedule.id} style={styles.scheduleChip}>
                      <Text style={styles.scheduleChipText}>
                        {formatMedicationTime(buildScheduledDate(schedule.time_of_day))}
                      </Text>
                    </View>
                  ))}
                </View>

                {canManageMedical ? (
                  <View style={styles.compactActionRow}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Edit ${medication.name}`}
                      style={styles.compactActionButton}
                      onPress={() => startEditMedication(medication)}
                    >
                      <Text style={styles.compactActionText}>Edit</Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${medication.paused_at ? 'Resume' : 'Pause'} ${medication.name}`}
                      style={styles.compactActionButton}
                      disabled={deletingMedicationId === medication.id}
                      onPress={() =>
                        setMedicationState(
                          medication,
                          medication.paused_at ? 'resume' : 'pause'
                        )
                      }
                    >
                      <Text style={styles.compactActionText}>
                        {medication.paused_at ? 'Resume reminders' : 'Pause reminders'}
                      </Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            );
          })
        )}

        <SecondaryButton title="Back to Today" onPress={() => setScreen('today')} />
      </Page>
    );
}
