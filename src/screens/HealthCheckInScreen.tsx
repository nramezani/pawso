import { Text, View } from 'react-native';

import { usePawso } from '../context/PawsoContext';
import {
  Header,
  Input,
  Label,
  Page,
  OptionButton,
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
    symptomSeverity,
    setSymptomSeverity,
    symptomFrequency,
    setSymptomFrequency,
    symptomDuration,
    setSymptomDuration,
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
        maxLength={10}
      />

      {isSymptom ? (
        <>
          <Label text="Symptom or observation category" />
          <Input
            value={checkInTitle}
            onChangeText={setCheckInTitle}
            placeholder="Example: Vomiting, appetite, mobility"
            maxLength={80}
          />
          <Label text="Severity (your observation)" />
          <View style={styles.scheduleWrap}>
            {([1, 2, 3, 4, 5] as const).map((value) => (
              <OptionButton
                key={value}
                title={String(value)}
                selected={symptomSeverity === value}
                onPress={() => setSymptomSeverity(value)}
              />
            ))}
          </View>
          <Text style={styles.reminderFinePrint}>1 = mild · 5 = most severe you observed</Text>

          <Label text="Frequency" />
          <View style={styles.scheduleWrap}>
            {(['single', 'intermittent', 'frequent', 'constant'] as const).map((value) => (
              <OptionButton
                key={value}
                title={value[0].toUpperCase() + value.slice(1)}
                selected={symptomFrequency === value}
                onPress={() => setSymptomFrequency(value)}
              />
            ))}
          </View>

          <Label text="Duration in minutes (optional)" />
          <Input
            value={symptomDuration}
            onChangeText={setSymptomDuration}
            placeholder="Example: 15"
            keyboardType="number-pad"
            maxLength={6}
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
            maxLength={12}
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
        maxLength={2000}
      />

      {checkInError ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Could not save check-in</Text>
          <Text style={styles.errorText}>{checkInError}</Text>
        </View>
      ) : null}

      <PrimaryButton
        title={checkInSaving ? 'Saving…' : 'Save to health timeline'}
        disabled={
          checkInSaving ||
          !checkInDate.trim() ||
          (isSymptom ? !checkInTitle.trim() : !checkInWeight.trim())
        }
        onPress={saveHealthCheckIn}
      />
    </Page>
  );
}
