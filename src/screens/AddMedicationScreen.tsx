import { Text, View } from 'react-native';

import { usePawso } from '../context/PawsoContext';
import {
  Page,
  Header,
  Label,
  Input,
  PrimaryButton,
  SecondaryButton,
  OptionButton,
  styles,
} from '../components/ui';

export function AddMedicationScreen() {
  const {
    setScreen,
    medicationsError,
    isSavingMedication,
    newMedicationName,
    setNewMedicationName,
    newMedicationDose,
    setNewMedicationDose,
    newMedicationUnit,
    setNewMedicationUnit,
    newMedicationInstructions,
    setNewMedicationInstructions,
    newMedicationTimes,
    setNewMedicationTimes,
    editingMedicationId,
    newMedicationStartDate,
    setNewMedicationStartDate,
    newMedicationEndDate,
    setNewMedicationEndDate,
    newMedicationRefills,
    setNewMedicationRefills,
    newMedicationRefillDate,
    setNewMedicationRefillDate,
    newMedicationPaused,
    setNewMedicationPaused,
    createMedication,
  } = usePawso();

  function updateTime(index: number, value: string) {
    setNewMedicationTimes((times: string[]) =>
      times.map((time: string, timeIndex: number) =>
        timeIndex === index ? value : time
      )
    );
  }

  function removeTime(index: number) {
    setNewMedicationTimes((times: string[]) =>
      times.filter((_: string, timeIndex: number) => timeIndex !== index)
    );
  }

  const validTimePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
  const allTimesValid =
    newMedicationTimes.length > 0 &&
    newMedicationTimes.every((time: string) =>
      validTimePattern.test(time.trim())
    );

  return (
    <Page scroll keyboard>
      <Header back={() => setScreen('medications')} title="Medication" />

      <Text style={styles.pageTitle}>
        {editingMedicationId ? 'Edit medication' : 'Add medication'}
      </Text>
      <Text style={styles.pageSubtitle}>
        Enter the medication exactly as prescribed. Pawso only schedules the
        times you confirm here.
      </Text>

      <Label text="Medication name *" />
      <Input
        value={newMedicationName}
        onChangeText={setNewMedicationName}
        placeholder="e.g. Clavamox"
        maxLength={120}
      />

      <Text style={styles.sectionTitle}>Course & refills</Text>
      <Text style={styles.cardMuted}>
        Optional dates keep reminders from appearing outside the prescribed course.
      </Text>
      <Label text="Start date" />
      <Input
        value={newMedicationStartDate}
        onChangeText={setNewMedicationStartDate}
        placeholder="YYYY-MM-DD"
        keyboardType="numbers-and-punctuation"
        maxLength={10}
      />
      <Label text="End date" />
      <Input
        value={newMedicationEndDate}
        onChangeText={setNewMedicationEndDate}
        placeholder="YYYY-MM-DD"
        keyboardType="numbers-and-punctuation"
        maxLength={10}
      />
      <View style={styles.medicationDoseRow}>
        <View style={{ flex: 1 }}>
          <Label text="Refills remaining" />
          <Input
            value={newMedicationRefills}
            onChangeText={setNewMedicationRefills}
            placeholder="e.g. 2"
            keyboardType="number-pad"
            maxLength={6}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Label text="Refill due" />
          <Input
            value={newMedicationRefillDate}
            onChangeText={setNewMedicationRefillDate}
            placeholder="YYYY-MM-DD"
            keyboardType="numbers-and-punctuation"
            maxLength={10}
          />
        </View>
      </View>
      <Label text="Reminder state" />
      <View style={styles.row}>
        <OptionButton
          title="Active"
          selected={!newMedicationPaused}
          onPress={() => setNewMedicationPaused(false)}
        />
        <OptionButton
          title="Paused"
          selected={newMedicationPaused}
          onPress={() => setNewMedicationPaused(true)}
        />
      </View>

      <View style={styles.medicationDoseRow}>
        <View style={{ flex: 1 }}>
          <Label text="Dose" />
          <Input
            value={newMedicationDose}
            onChangeText={setNewMedicationDose}
            placeholder="e.g. 1"
            maxLength={80}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Label text="Unit" />
          <Input
            value={newMedicationUnit}
            onChangeText={setNewMedicationUnit}
            placeholder="e.g. mL"
            maxLength={40}
          />
        </View>
      </View>

      <Label text="Instructions" />
      <Input
        value={newMedicationInstructions}
        onChangeText={setNewMedicationInstructions}
        placeholder="e.g. Give with food"
        multiline
        maxLength={2000}
      />

      <Text style={styles.sectionTitle}>Daily schedule</Text>
      <Text style={styles.cardMuted}>
        Add every prescribed daily time using 24-hour format, such as 08:00,
        14:00, or 20:00.
      </Text>

      {newMedicationTimes.map((time: string, index: number) => (
        <View key={index}>
          <Label text={`Time ${index + 1} *`} />
          <Input
            value={time}
            onChangeText={(value: string) => updateTime(index, value)}
            placeholder={index === 0 ? '08:00' : '20:00'}
            keyboardType="numbers-and-punctuation"
            maxLength={5}
          />
          {newMedicationTimes.length > 1 ? (
            <SecondaryButton
              title={`Remove time ${index + 1}`}
              onPress={() => removeTime(index)}
            />
          ) : null}
        </View>
      ))}

      <Text style={styles.reminderFinePrint}>
        {allTimesValid
          ? '✓ Daily times are ready.'
          : 'Each daily time must use HH:MM from 00:00 through 23:59.'}
      </Text>

      {newMedicationTimes.length < 6 ? (
        <SecondaryButton
          title="+ Add another daily time"
          onPress={() =>
            setNewMedicationTimes((times: string[]) => [...times, ''])
          }
        />
      ) : null}

      {medicationsError ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Could not save medication</Text>
          <Text style={styles.errorText}>{medicationsError}</Text>
        </View>
      ) : null}

      <PrimaryButton
        title={
          isSavingMedication
            ? 'Saving medication…'
            : editingMedicationId
            ? 'Save medication changes'
            : 'Save medication'
        }
        disabled={
          isSavingMedication || !newMedicationName.trim() || !allTimesValid
        }
        onPress={createMedication}
      />
    </Page>
  );
}
