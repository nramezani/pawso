import { Text, View } from 'react-native';

import { usePawso } from '../context/PawsoContext';
import {
  Page,
  Header,
  Label,
  Input,
  OptionButton,
  PrimaryButton,
  styles,
} from '../components/ui';

export function AddCareTaskScreen() {
  const {
    setScreen,
    petName,
    careError,
    savingCareTask,
    newCareTitle,
    setNewCareTitle,
    newCareNotes,
    setNewCareNotes,
    newCareDate,
    setNewCareDate,
    newCareTime,
    setNewCareTime,
    newCareFrequency,
    setNewCareFrequency,
    newCareInterval,
    setNewCareInterval,
    newCareEndsOn,
    setNewCareEndsOn,
    createCareTask,
  } = usePawso();

return (
      <Page scroll keyboard>
        <Header back={() => setScreen('care')} title="Add Care Task" />

        <Text style={styles.pageTitle}>Add care task</Text>
        <Text style={styles.pageSubtitle}>
          Create a reminder for something you need to do for {petName}.
        </Text>

        <Label text="Task *" />
        <Input
          value={newCareTitle}
          onChangeText={setNewCareTitle}
          placeholder="e.g. Repeat urinalysis"
          maxLength={160}
        />

        <Text style={styles.sectionTitle}>Repeat</Text>
        <Text style={styles.cardMuted}>
          Pawso creates the next occurrence only after this one is completed or skipped.
        </Text>
        <View style={styles.scheduleWrap}>
          {(['none', 'daily', 'weekly', 'monthly'] as const).map((frequency) => (
            <OptionButton
              key={frequency}
              title={frequency === 'none' ? 'One time' : frequency[0].toUpperCase() + frequency.slice(1)}
              selected={newCareFrequency === frequency}
              onPress={() => setNewCareFrequency(frequency)}
            />
          ))}
        </View>
        {newCareFrequency !== 'none' ? (
          <>
            <Label text={`Repeat every how many ${newCareFrequency === 'daily' ? 'days' : newCareFrequency === 'weekly' ? 'weeks' : 'months'}?`} />
            <Input
              value={newCareInterval}
              onChangeText={setNewCareInterval}
              keyboardType="number-pad"
              placeholder="1"
              maxLength={2}
            />
            <Label text="Stop repeating after (optional)" />
            <Input
              value={newCareEndsOn}
              onChangeText={setNewCareEndsOn}
              placeholder="YYYY-MM-DD"
              keyboardType="numbers-and-punctuation"
              maxLength={10}
            />
          </>
        ) : null}

        <Label text="Notes" />
        <Input
          value={newCareNotes}
          onChangeText={setNewCareNotes}
          placeholder="Optional details"
          multiline
          maxLength={2000}
        />

        <Label text="Due date *" />
        <Input
          value={newCareDate}
          onChangeText={setNewCareDate}
          placeholder="YYYY-MM-DD"
          maxLength={10}
        />

        <Label text="Due time *" />
        <Input
          value={newCareTime}
          onChangeText={setNewCareTime}
          placeholder="09:00"
          maxLength={5}
        />

        <Text style={styles.safetyText}>
          Pawso will remind you about this task but will not change veterinary instructions.
        </Text>

        {careError !== '' && (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Could not save care task</Text>
            <Text style={styles.errorText}>{careError}</Text>
          </View>
        )}

        <PrimaryButton
          title={savingCareTask ? 'Saving Care Task…' : 'Save Care Task'}
          disabled={savingCareTask || !newCareTitle.trim() || !newCareDate.trim()}
          onPress={createCareTask}
        />
      </Page>
    );
}
