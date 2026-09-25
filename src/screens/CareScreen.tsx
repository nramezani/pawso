import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';

import { usePawso } from '../context/PawsoContext';
import { ProgressOverview } from '../components/VisualSummary';
import {
  Page,
  Header,
  PrimaryButton,
  SecondaryButton,
  styles,
} from '../components/ui';

export function CareScreen() {
  const [showHistory, setShowHistory] = useState(false);
  const [historyLimit, setHistoryLimit] = useState(10);
  const {
    setScreen,
    canManageCare,
    petName,
    careTasks,
    taskCompletions,
    careLoading,
    careError,
    completingTaskId,
    completeCareTask,
    skipCareTask,
    setCareTaskState,
    deleteCareTask,
    deletingTaskId,
    formatDueLabel,
    activeCareTasks,
    overdueCareTasks,
    upcomingCareTasks,
    householdTimeZone,
  } = usePawso();

  const completedTaskIds = new Set(
    taskCompletions.map((completion) => completion.task_id)
  );
  const completedTaskEntries = careTasks
    .map((task) => ({
      task,
      completion: taskCompletions.find(
        (completion) => completion.task_id === task.id
      ),
    }))
    .filter(
      (entry): entry is typeof entry & { completion: NonNullable<typeof entry.completion> } =>
        Boolean(entry.completion)
    )
    .sort(
      (a, b) =>
        new Date(b.completion.completed_at).getTime() -
        new Date(a.completion.completed_at).getTime()
    );
  const completedCurrentTasks = completedTaskEntries.map((entry) => entry.task);
  const carePlanTasks = careTasks.filter(
    (task) => task.is_active || completedTaskIds.has(task.id)
  );
  const archivedTaskCount = careTasks.filter(
    (task) => !task.is_active && !completedTaskIds.has(task.id)
  ).length;
  const pausedTasks = careTasks.filter((task) => task.is_active && task.paused_at);

return (
      <Page scroll>
        <Header back={() => setScreen('today')} title="Care & Reminders" />

        <View style={styles.medicationHero}>
          <View style={styles.medicationHeroIcon}>
            <Text style={styles.medicationHeroEmoji}>📅</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.documentsTitle}>{petName}'s care</Text>
            <Text style={styles.cardMuted}>
              Add one-time care tasks and follow-ups. Pawso will surface them on Today when they matter.
            </Text>
          </View>
        </View>

        {carePlanTasks.length > 0 ? (
          <ProgressOverview
            title="Care task history"
            completed={completedCurrentTasks.length}
            total={carePlanTasks.length}
            detail={
              activeCareTasks.length === 0
                ? 'Every active task is complete.'
                : `${activeCareTasks.length} task${
                    activeCareTasks.length === 1 ? '' : 's'
                  } still need attention.`
            }
            breakdown={[
              {
                label: 'Completed',
                value: completedCurrentTasks.length,
                icon: '✓',
                tone: 'green',
              },
              {
                label: 'Upcoming',
                value: upcomingCareTasks.length,
                icon: '→',
                tone: 'purple',
              },
              {
                label: 'Overdue',
                value: overdueCareTasks.length,
                icon: '!',
                tone: 'amber',
              },
            ]}
          />
        ) : null}

        {canManageCare ? (
          <PrimaryButton title="Add Care Task" onPress={() => setScreen('addCareTask')} />
        ) : (
          <View style={styles.infoCard}>
            <Text style={styles.cardStrong}>Sitter view</Text>
            <Text style={styles.cardMuted}>
              You can complete existing care tasks, but only an owner or caregiver can create new ones.
            </Text>
          </View>
        )}

        {careError !== '' && (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Care task error</Text>
            <Text style={styles.errorText}>{careError}</Text>
          </View>
        )}

        {careLoading ? (
          <View style={styles.documentsLoading}>
            <ActivityIndicator size="large" color="#2F6F63" />
            <Text style={styles.cardMuted}>Loading care tasks…</Text>
          </View>
        ) : activeCareTasks.length === 0 ? (
          <View style={styles.emptyDocuments}>
            <Text style={styles.bigEmoji}>📅</Text>
            <Text style={styles.cardStrong}>
              {completedTaskEntries.length > 0
                ? 'All active tasks are complete'
                : 'No active care tasks'}
            </Text>
            <Text style={styles.cardMuted}>
              {completedTaskEntries.length > 0
                ? 'Open completion history below to see what was done and by whom.'
                : 'Add things like a urine recheck, water-filter change, nail trim, or vet follow-up.'}
            </Text>
          </View>
        ) : (
          activeCareTasks.map((task) => (
            <View key={task.id} style={styles.documentCard}>
              <View style={styles.medicationDueHeader}>
                <View style={styles.medicationIcon}><Text>📅</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.documentCardTitle}>{task.title}</Text>
                  <Text style={styles.documentCardMeta}>{formatDueLabel(task.due_at)}</Text>
                  {task.recurrence_frequency !== 'none' ? (
                    <Text style={styles.documentCardMeta}>
                      Repeats every {task.recurrence_interval > 1 ? `${task.recurrence_interval} ` : ''}
                      {task.recurrence_frequency === 'daily'
                        ? task.recurrence_interval > 1 ? 'days' : 'day'
                        : task.recurrence_frequency === 'weekly'
                        ? task.recurrence_interval > 1 ? 'weeks' : 'week'
                        : task.recurrence_interval > 1 ? 'months' : 'month'}
                      {task.recurrence_ends_on ? ` · through ${task.recurrence_ends_on}` : ''}
                    </Text>
                  ) : null}
                </View>

                {canManageCare ? (
                  <Pressable
                    style={styles.iconActionButton}
                    accessibilityRole="button"
                    accessibilityLabel={`Archive ${task.title}`}
                    disabled={deletingTaskId === task.id}
                    accessibilityState={{ disabled: deletingTaskId === task.id }}
                    onPress={() =>
                      Alert.alert(
                        'Archive care task?',
                        `This removes "${task.title}" from active tasks while preserving its history.`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Archive',
                            onPress: () => deleteCareTask(task),
                          },
                        ]
                      )
                    }
                  >
                    <Text style={{ fontSize: 18, opacity: deletingTaskId === task.id ? 0.4 : 1 }}>
                      📦
                    </Text>
                  </Pressable>
                ) : null}
              </View>

              {task.notes ? <Text style={styles.medicationInstructions}>{task.notes}</Text> : null}

              <Pressable
                style={styles.completeCareButton}
                disabled={completingTaskId === task.id}
                onPress={() => completeCareTask(task)}
                accessibilityRole="button"
                accessibilityLabel={`Mark ${task.title} complete`}
                accessibilityState={{ disabled: completingTaskId === task.id }}
              >
                <Text style={styles.completeCareButtonText}>
                  {completingTaskId === task.id ? 'Saving…' : '✓ Mark complete'}
                </Text>
              </Pressable>

              {canManageCare ? (
                <View style={styles.compactActionRow}>
                  <Pressable
                    style={styles.compactActionButton}
                    accessibilityRole="button"
                    accessibilityLabel={`Skip ${task.title}`}
                    onPress={() =>
                      Alert.alert(
                        'Skip this occurrence?',
                        'Pawso will record it as skipped and create the next occurrence if this task repeats.',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Skip', onPress: () => skipCareTask(task) },
                        ]
                      )
                    }
                  >
                    <Text style={styles.compactActionText}>Skip</Text>
                  </Pressable>
                  <Pressable
                    style={styles.compactActionButton}
                    accessibilityRole="button"
                    accessibilityLabel={`Snooze ${task.title} for one hour`}
                    onPress={() =>
                      setCareTaskState(task, 'snooze', new Date(Date.now() + 60 * 60 * 1000))
                    }
                  >
                    <Text style={styles.compactActionText}>Snooze 1 hour</Text>
                  </Pressable>
                  {task.recurrence_frequency !== 'none' ? (
                    <Pressable
                      style={styles.compactActionButton}
                      accessibilityRole="button"
                      accessibilityLabel={`Pause ${task.title} series`}
                      onPress={() => setCareTaskState(task, 'pause')}
                    >
                      <Text style={styles.compactActionText}>Pause series</Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}
            </View>
          ))
        )}

        {pausedTasks.length > 0 ? (
          <View style={styles.infoCard}>
            <Text style={styles.cardStrong}>Paused care schedules</Text>
            <Text style={styles.cardMuted}>
              Paused schedules stay out of Today until resumed.
            </Text>
            {pausedTasks.map((task) => (
              <View key={`paused-${task.id}`} style={styles.careListCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardStrong}>{task.title}</Text>
                  <Text style={styles.cardMuted}>{formatDueLabel(task.due_at)}</Text>
                </View>
                {canManageCare ? (
                  <Pressable
                    style={styles.compactActionButton}
                    accessibilityRole="button"
                    accessibilityLabel={`Resume ${task.title}`}
                    onPress={() => setCareTaskState(task, 'resume')}
                  >
                    <Text style={styles.compactActionText}>Resume</Text>
                  </Pressable>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}

        {completedTaskEntries.length > 0 || archivedTaskCount > 0 ? (
          <View style={styles.infoCard}>
            <Text style={styles.cardStrong}>Past care tasks</Text>
            <Text style={styles.cardMuted}>
              {completedTaskEntries.length} completed
              {archivedTaskCount > 0
                ? ` · ${archivedTaskCount} archived without completion`
                : ''}
            </Text>

            {completedTaskEntries.length > 0 ? (
              <SecondaryButton
                title={showHistory ? 'Hide completion history' : 'Show completion history'}
                onPress={() => setShowHistory((value) => !value)}
              />
            ) : null}

            {showHistory
              ? completedTaskEntries.slice(0, historyLimit).map(({ task, completion }) => (
                  <View key={`history-${task.id}`} style={styles.careListCard}>
                    <Text style={styles.careListIcon}>
                      {completion.outcome === 'skipped' ? '↷' : '✓'}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardStrong}>{task.title}</Text>
                      <Text style={styles.cardMuted}>
                        {completion.outcome === 'skipped' ? 'Skipped' : 'Completed'}{' '}
                        {new Date(completion.completed_at).toLocaleString([], {
                          timeZone: householdTimeZone,
                        })}
                        {completion.actor_name ? ` · ${completion.actor_name}` : ''}
                      </Text>
                    </View>
                  </View>
                ))
              : null}
            {showHistory && completedTaskEntries.length > historyLimit ? (
              <SecondaryButton
                title={`Show more (${completedTaskEntries.length - historyLimit} remaining)`}
                onPress={() => setHistoryLimit((value) => value + 10)}
              />
            ) : null}
          </View>
        ) : null}

        <SecondaryButton title="Back to Today" onPress={() => setScreen('today')} />
      </Page>
    );
}
