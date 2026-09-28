import { Pressable, Text, View } from 'react-native';

import { usePawso } from '../context/PawsoContext';
import { formatDateDigits } from '../utils/dateTime';
import {
  Page,
  Header,
  Label,
  Input,
  OptionButton,
  PrimaryButton,
  styles,
} from '../components/ui';

const ROUTINE_PRESETS = [
  {
    title: 'Nail trim',
    note: 'Adjust the timing to your pet’s nail growth and comfort.',
    frequency: 'monthly',
    interval: '1',
  },
  {
    title: 'Flea & tick prevention',
    note: 'Set the repeat schedule from the product label or your veterinarian.',
    frequency: 'none',
    interval: '1',
  },
  {
    title: 'Deworming',
    note: 'Set the repeat schedule recommended by your veterinarian.',
    frequency: 'none',
    interval: '1',
  },
  {
    title: 'Vaccine or booster',
    note: 'Use the next due date and interval provided by your veterinarian.',
    frequency: 'none',
    interval: '1',
  },
  {
    title: 'Annual wellness exam',
    note: 'Routine annual veterinary checkup.',
    frequency: 'monthly',
    interval: '12',
  },
  {
    title: 'Grooming',
    note: 'Adjust the timing for coat type and your groomer’s recommendation.',
    frequency: 'monthly',
    interval: '1',
  },
  {
    title: 'Medication refill',
    note: 'Confirm the refill timing from the prescription and remaining supply.',
    frequency: 'none',
    interval: '1',
  },
  {
    title: 'Dental care',
    note: 'Choose the home-care or professional follow-up schedule recommended for your pet.',
    frequency: 'none',
    interval: '1',
  },
] as const;

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
    newCareTaskType,
    setNewCareTaskType,
    newCareAssignedMemberId,
    setNewCareAssignedMemberId,
    householdMembers,
    createCareTask,
  } = usePawso();

return (
      <Page scroll keyboard>
        <Header back={() => setScreen('care')} title="Add Care Task" />

        <Text style={styles.pageTitle}>Add care task</Text>
        <Text style={styles.pageSubtitle}>
          Create a reminder for something you need to do for {petName}.
        </Text>

        <Text style={styles.sectionTitle}>Quick routine reminders</Text>
        <Text style={styles.cardMuted}>
          Pick a template, then confirm its first due date and repeat schedule.
        </Text>
        <View style={styles.askSuggestions}>
          {ROUTINE_PRESETS.map((preset) => (
            <Pressable
              key={preset.title}
              style={styles.askSuggestionChip}
              accessibilityRole="button"
              accessibilityLabel={`Use ${preset.title} reminder template`}
              onPress={() => {
                setNewCareTitle(preset.title);
                setNewCareNotes(preset.note);
                setNewCareFrequency(preset.frequency);
                setNewCareInterval(preset.interval);
                setNewCareEndsOn('');
                setNewCareTaskType(preset.title.startsWith('Vaccine') ? 'vaccine' : 'routine_care');
              }}
            >
              <Text style={styles.askSuggestionText}>{preset.title}</Text>
            </Pressable>
          ))}
        </View>

        <Label text="Task *" />
        <Input
          value={newCareTitle}
          onChangeText={setNewCareTitle}
          placeholder="e.g. Repeat urinalysis"
          maxLength={160}
        />

        <Label text="Category" />
        <View style={styles.row}>
          <OptionButton title="Care" selected={newCareTaskType !== 'vaccine'} onPress={() => setNewCareTaskType('general')} />
          <OptionButton title="Vaccine" selected={newCareTaskType === 'vaccine'} onPress={() => setNewCareTaskType('vaccine')} />
        </View>

        <Label text="Assign to" />
        <View style={styles.scheduleWrap}>
          <OptionButton title="Anyone" selected={!newCareAssignedMemberId} onPress={() => setNewCareAssignedMemberId(null)} />
          {householdMembers.map((member) => (
            <OptionButton
              key={member.id}
              title={member.display_name}
              selected={newCareAssignedMemberId === member.id}
              onPress={() => setNewCareAssignedMemberId(member.id)}
            />
          ))}
        </View>

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
              onChangeText={(value: string) => setNewCareEndsOn(formatDateDigits(value))}
              placeholder="YYYYMMDD"
              keyboardType="number-pad"
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
          onChangeText={(value: string) => setNewCareDate(formatDateDigits(value))}
          placeholder="YYYYMMDD"
          keyboardType="number-pad"
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
