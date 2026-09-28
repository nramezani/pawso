import { Alert, Image, Text, View } from 'react-native';

import { usePawso } from '../context/PawsoContext';
import { WeightTrendCard } from '../components/WeightTrendCard';
import { formatPetAge } from '../utils/petProfile';
import {
  Page,
  Header,
  PrimaryButton,
  SecondaryButton,
  Card,
  Info,
  styles,
} from '../components/ui';

export function PetProfileScreen() {
  const {
    setScreen,
    petPhotoUrl,
    petPhotoPath,
    petPhotoBusy,
    updatePetPhoto,
    removePetPhoto,
    openHealthTrends,
    archiveCurrentPet,
    deleteCurrentPet,
    dataRightsBusy,
    dataRightsMessage,
    dataRightsError,
    currentPetId,
    petName,
    petType,
    breed,
    petAge,
    petDateOfBirth,
    petAdoptionDate,
    petSex,
    weight,
    weightUnit,
    conditions,
    allergies,
    medications,
    timelineEvents,
    canViewMedical,
    canManageMedical,
    startEditPet,
    openHealthCheckIn,
    petEmoji,
    alteredLabel,
    alteredValue,
    notificationsEnabled,
    insuranceCompany,
    insurancePolicyNumber,
    insuranceDeductible,
    insuranceCoveragePercent,
    insuranceClaimsContact,
    insuranceRenewalDate,
  } = usePawso();

return (
      <Page scroll>
        <Header back={() => setScreen('pets')} title="Pawso" />

        <View style={styles.profileHeader}>
          {petPhotoUrl ? (
            <Image
              source={{ uri: petPhotoUrl }}
              style={styles.profilePhotoImage}
              accessibilityLabel={`${petName}'s photo`}
            />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarEmoji}>{petEmoji}</Text>
            </View>
          )}

          <Text style={styles.profileName}>
            {petName}
          </Text>

          <Text style={styles.profileMeta}>
            {petType === 'cat' ? 'Cat' : 'Dog'}
            {breed ? ` · ${breed}` : ''}
          </Text>
        </View>

        {currentPetId && (
          <View style={styles.cloudSavedCard}>
            <Text style={styles.cloudSavedText}>
              ✓ Saved securely to Pawso
            </Text>
          </View>
        )}

        {canManageMedical ? (
          <>
            <SecondaryButton
              title={petPhotoBusy ? 'Updating photo…' : petPhotoPath ? 'Change photo' : 'Add photo'}
              disabled={petPhotoBusy}
              onPress={updatePetPhoto}
            />
            {petPhotoPath ? (
              <SecondaryButton
                title="Remove photo"
                disabled={petPhotoBusy}
                onPress={() =>
                  Alert.alert('Remove pet photo?', 'The stored photo will be permanently deleted.', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Remove', style: 'destructive', onPress: removePetPhoto },
                  ])
                }
              />
            ) : null}
          </>
        ) : null}

        <Card title="About">
          <Info
            label="Age / DOB"
            value={formatPetAge(petDateOfBirth || null, petAge || 'Not provided')}
          />

          <Info label="Gotcha / adoption day" value={petAdoptionDate || 'Not provided'} />

          <Info
            label="Sex"
            value={
              petSex
                ? petSex === 'female'
                  ? 'Female'
                  : 'Male'
                : 'Not provided'
            }
          />

          <Info
            label={alteredLabel}
            value={alteredValue}
          />

          <Info
            label="Weight"
            value={weight || 'Not provided'}
          />

          {petDateOfBirth ? (
            <Info
              label="Birthday reminder"
              value={
                notificationsEnabled
                  ? 'On · every year at 9:00 AM'
                  : 'Turn on Reminders in Account'
              }
            />
          ) : null}
        </Card>

        {insuranceCompany || insurancePolicyNumber ? (
          <Card title="Insurance">
            <Info label="Company" value={insuranceCompany || 'Not provided'} />
            <Info label="Policy" value={insurancePolicyNumber || 'Not provided'} />
            <Info label="Deductible" value={insuranceDeductible || 'Not provided'} />
            <Info label="Coverage" value={insuranceCoveragePercent ? `${insuranceCoveragePercent}%` : 'Not provided'} />
            <Info label="Claims contact" value={insuranceClaimsContact || 'Not provided'} />
            <Info label="Renewal" value={insuranceRenewalDate || 'Not provided'} />
          </Card>
        ) : null}

        {canViewMedical ? (
          <WeightTrendCard
            timelineEvents={timelineEvents}
            currentWeight={weight}
            weightUnit={weightUnit}
            petName={petName}
            onRecordWeight={
              canManageMedical ? () => openHealthCheckIn('weight') : undefined
            }
          />
        ) : null}

        <Card title="Health">
          <Info
            label="Conditions"
            value={conditions || 'None added'}
          />

          <Info
            label="Allergies"
            value={allergies || 'None added'}
          />

          <Info
            label="Medications"
            value={medications || 'None added'}
          />
        </Card>

        <PrimaryButton
          title="Go to Today"
          onPress={() => setScreen('today')}
        />

        {canViewMedical ? (
          <SecondaryButton title="Health trends" onPress={openHealthTrends} />
        ) : null}
        <SecondaryButton title="Emergency card & PDF" onPress={() => setScreen('emergencyCard')} />
        <SecondaryButton title="Reminder preferences" onPress={() => setScreen('notificationPreferences')} />
        <SecondaryButton title="Household upcoming calendar" onPress={() => setScreen('upcomingCalendar')} />

        {canManageMedical ? (
          <>
            <SecondaryButton title="Edit pet details" onPress={startEditPet} />
            <Text style={styles.sectionTitle}>Pet data</Text>
            <SecondaryButton
              title={dataRightsBusy ? 'Working…' : 'Archive pet'}
              disabled={dataRightsBusy}
              onPress={() =>
                Alert.alert(
                  'Archive this pet?',
                  'The pet will leave active views, but its records remain until you permanently delete it.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Archive', onPress: archiveCurrentPet },
                  ]
                )
              }
            />
            <SecondaryButton
              title={dataRightsBusy ? 'Working…' : 'Delete pet permanently'}
              disabled={dataRightsBusy}
              onPress={() =>
                Alert.alert(
                  `Delete ${petName}?`,
                  'This permanently deletes the pet, medical history, care records, photos, and stored veterinary files. This cannot be undone.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete permanently', style: 'destructive', onPress: deleteCurrentPet },
                  ]
                )
              }
            />
          </>
        ) : null}

        {dataRightsMessage ? (
          <View style={styles.infoCard}><Text style={styles.cardStrong}>{dataRightsMessage}</Text></View>
        ) : null}
        {dataRightsError ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Pet data action failed</Text>
            <Text style={styles.errorText}>{dataRightsError}</Text>
          </View>
        ) : null}
      </Page>
    );
}
