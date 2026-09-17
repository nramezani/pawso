import { Text, View } from 'react-native';

import { usePawso } from '../context/PawsoContext';
import {
  Header,
  Input,
  Label,
  Page,
  PrimaryButton,
  styles,
} from '../components/ui';

export function HealthCheckInScreen() {
  const {
    setScreen,
    petName,
    checkInType,
    checkInDate,
    setCheckInDate,
    checkInTitle,
    setCheckInTitle,
    checkInDetails,
    setCheckInDetails,
    checkInWeight,
    setCheckInWeight,
    checkInSaving,
    checkInError,
    saveHealthCheckIn,
  } = usePawso();

  const isSymptom = checkInType === 'symptom';

  return (
    <Page scroll keyboard>
      <Header back={() => setScreen('today')} title="Health Check-In" />

      <Text style={styles.pageTitle}>
        {isSymptom ? `Add an observation for ${petName}` : `Record ${petName}'s weight`}
      </Text>
      <Text style={styles.pageSubtitle}>
        {isSymptom
          ? 'Record what you observed without turning it into a diagnosis.'
          : 'The new weight will update the profile and remain in the health timeline.'}
      </Text>

      <View style={styles.infoCard}>
        <Text style={styles.cardStrong}>Owner-reported entry</Text>
        <Text style={styles.cardMuted}>
          Pawso labels this as your observation so it stays distinct from veterinary records.
        </Text>
      </View>

      <Label text="Date" />
      <Input
        value={checkInDate}
        onChangeText={setCheckInDate}
        placeholder="YYYY-MM-DD"
        autoCapitalize="none"
      />

      {isSymptom ? (
        <>
          <Label text="What did you notice?" />
          <Input
            value={checkInTitle}
            onChangeText={setCheckInTitle}
            placeholder="Example: Vomited yellow liquid with hair"
          />
        </>
      ) : (
        <>
          <Label text="Weight (kg)" />
          <Input
            value={checkInWeight}
            onChangeText={setCheckInWeight}
            placeholder="Example: 4.2"
            keyboardType="decimal-pad"
          />
        </>
      )}

      <Label text={isSymptom ? 'Details (optional)' : 'Notes (optional)'} />
      <Input
        value={checkInDetails}
        onChangeText={setCheckInDetails}
        placeholder={
          isSymptom
            ? 'Frequency, appetite, behavior, bathroom habits, or anything else you observed'
            : 'Example: Weighed before breakfast on the home scale'
        }
        multiline
      />

      <PrimaryButton
        title={checkInSaving ? 'Saving…' : 'Save to health timeline'}
        disabled={checkInSaving}
        onPress={saveHealthCheckIn}
      />

      {checkInError ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Could not save check-in</Text>
          <Text style={styles.errorText}>{checkInError}</Text>
        </View>
      ) : null}
    </Page>
  );
}
