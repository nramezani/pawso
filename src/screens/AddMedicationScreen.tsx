import { Text, View } from 'react-native';

import { usePawso } from '../context/PawsoContext';
import {
  Page,
  Header,
  Label,
  Input,
  PrimaryButton,
  SecondaryButton,
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

  const hasValidTime = newMedicationTimes.some((time: string) => time.trim());

  return (
    <Page scroll keyboard>
      <Header back={() => setScreen('medications')} title="Add Medication" />

      <Text style={styles.pageTitle}>Add medication</Text>
      <Text style={styles.pageSubtitle}>
        Enter the medication exactly as prescribed. Pawso only schedules the
        times you confirm here.
      </Text>

      <Label text="Medication name *" />
      <Input
        value={newMedicationName}
        onChangeText={setNewMedicationName}
        placeholder="e.g. Clavamox"
      />

      <View style={styles.medicationDoseRow}>
        <View style={{ flex: 1 }}>
          <Label text="Dose" />
          <Input
            value={newMedicationDose}
            onChangeText={setNewMedicationDose}
            placeholder="e.g. 1"
          />
        </View>

        <View style={{ flex: 1 }}>
          <Label text="Unit" />
          <Input
            value={newMedicationUnit}
            onChangeText={setNewMedicationUnit}
            placeholder="e.g. mL"
          />
        </View>
      </View>

      <Label text="Instructions" />
      <Input
        value={newMedicationInstructions}
        onChangeText={setNewMedicationInstructions}
        placeholder="e.g. Give with food"
        multiline
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
          />
          {newMedicationTimes.length > 1 ? (
            <SecondaryButton
              title={`Remove time ${index + 1}`}
              onPress={() => removeTime(index)}
            />
          ) : null}
        </View>
      ))}

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
        title={isSavingMedication ? 'Saving medication…' : 'Save medication'}
        disabled={
          isSavingMedication || !newMedicationName.trim() || !hasValidTime
        }
        onPress={createMedication}
      />
    </Page>
  );
}
