import { Image, Text, View } from 'react-native';

import {
  Card,
  Header,
  Info,
  Page,
  PrimaryButton,
  SecondaryButton,
  styles,
} from '../components/ui';
import { usePawso } from '../context/PawsoContext';

export function EmergencyCardScreen() {
  const {
    setScreen,
    petName,
    petType,
    breed,
    petDateOfBirth,
    petAge,
    petSex,
    weight,
    microchip,
    conditions,
    allergies,
    medications,
    vetClinic,
    emergencyNotes,
    emergencyContactName,
    emergencyContactPhone,
    petPhotoUrl,
    medicationList,
    householdTimeZone,
    dataRightsBusy,
    dataRightsError,
    shareCurrentEmergencyCard,
    startEditPet,
  } = usePawso();
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: householdTimeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .formatToParts(new Date())
    .reduce<Record<string, string>>((parts, item) => {
      if (item.type !== 'literal') parts[item.type] = item.value;
      return parts;
    }, {});
  const todayValue = `${today.year}-${today.month}-${today.day}`;
  const currentMedications = medicationList
    .filter(
      (item) =>
        item.is_active &&
        !item.paused_at &&
        (!item.start_date || item.start_date <= todayValue) &&
        (!item.end_date || item.end_date >= todayValue)
    )
    .map((item) => [item.name, item.dose, item.unit].filter(Boolean).join(' '))
    .join(', ');

  return (
    <Page scroll>
      <Header title="Emergency card" back={() => setScreen('petProfile')} />
      <Text style={styles.pageTitle}>Ready-to-share pet handoff</Text>
      <Text style={styles.pageSubtitle}>
        Review this summary before sharing it with a sitter, caregiver, or veterinary team.
      </Text>

      <View style={styles.profileHeader}>
        {petPhotoUrl ? (
          <Image source={{ uri: petPhotoUrl }} style={styles.profilePhotoImage} />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarEmoji}>{petType === 'dog' ? '🐶' : '🐱'}</Text>
          </View>
        )}
        <Text style={styles.profileName}>{petName}</Text>
        <Text style={styles.profileMeta}>
          {petType === 'cat' ? 'Cat' : 'Dog'}{breed ? ` · ${breed}` : ''}
        </Text>
      </View>

      <Card title="Identity">
        <Info label="DOB / age" value={petDateOfBirth || petAge || 'Not provided'} />
        <Info label="Sex" value={petSex ?? 'Not provided'} />
        <Info label="Weight" value={weight || 'Not provided'} />
        <Info label="Microchip" value={microchip || 'Not provided'} />
      </Card>
      <Card title="Health handoff">
        <Info label="Conditions" value={conditions || 'None added'} />
        <Info label="Allergies" value={allergies || 'None added'} />
        <Info
          label="Current scheduled medications"
          value={currentMedications || 'None added'}
        />
        <Info label="Other medication notes" value={medications || 'None added'} />
        <Info label="Veterinary clinic" value={vetClinic || 'Not provided'} />
      </Card>
      <Card title="Emergency contact">
        <Info label="Name" value={emergencyContactName || 'Not provided'} />
        <Info label="Phone" value={emergencyContactPhone || 'Not provided'} />
        <Info label="Notes" value={emergencyNotes || 'None added'} />
      </Card>

      <View style={styles.warningCard}>
        <Text style={styles.warningTitle}>Confirm before sharing</Text>
        <Text style={styles.warningText}>
          This is a convenience summary, not medical advice. Contact a veterinarian for emergencies.
        </Text>
      </View>
      {dataRightsError ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Could not share card</Text>
          <Text style={styles.errorText}>{dataRightsError}</Text>
        </View>
      ) : null}
      <PrimaryButton
        title={dataRightsBusy ? 'Preparing PDF…' : 'Share emergency card PDF'}
        disabled={dataRightsBusy}
        onPress={shareCurrentEmergencyCard}
      />
      <SecondaryButton title="Edit pet details" onPress={startEditPet} />
    </Page>
  );
}
