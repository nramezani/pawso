import { Alert, Image, Linking, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { countActiveVetUploadLinks, revokeVetUploadLinks, shareVetUploadLink } from '../services/vetUpload';

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
  const [vetShareBusy, setVetShareBusy] = useState(false);
  const [activeVetLinks, setActiveVetLinks] = useState<number | null>(null);
  async function contactClinic(kind: 'phone' | 'email', value: string) {
    const destination = kind === 'phone'
      ? `tel:${value.replace(/[^+\d]/g, '')}`
      : `mailto:${value.trim()}`;
    if (kind === 'phone' && value.replace(/\D/g, '').length < 7) {
      Alert.alert('Check clinic phone', 'Edit the clinic phone number before calling.');
      return;
    }
    if (kind === 'email' && !/^[^\s@/?#]+@[^\s@/?#]+\.[^\s@/?#]+$/.test(value.trim())) {
      Alert.alert('Check clinic email', 'Edit the clinic email address before writing.');
      return;
    }
    try {
      await Linking.openURL(destination);
    } catch {
      Alert.alert('Could not open contact', 'Check your device settings or edit the clinic details.');
    }
  }
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
    vetClinic,
    vetName,
    vetPhone,
    vetEmail,
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

  useEffect(() => {
    if (!canManageMedical || !currentPetId) return;
    let active = true;
    countActiveVetUploadLinks(currentPetId)
      .then((count) => { if (active) setActiveVetLinks(count); })
      .catch(() => { if (active) setActiveVetLinks(null); });
    return () => { active = false; };
  }, [canManageMedical, currentPetId]);

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

        {canViewMedical ? (
          <Card title="Veterinary clinic">
            <Info label="Clinic" value={vetClinic || 'Not added'} />
            {vetName ? <Info label="Veterinarian" value={vetName} /> : null}
            {vetPhone ? <Info label="Phone" value={vetPhone} /> : null}
            {vetEmail ? <Info label="Email" value={vetEmail} /> : null}
            {vetPhone ? <SecondaryButton title="Call clinic" onPress={() => contactClinic('phone', vetPhone)} /> : null}
            {vetEmail ? <SecondaryButton title="Email clinic" onPress={() => contactClinic('email', vetEmail)} /> : null}
            {canManageMedical && currentPetId ? (
              <SecondaryButton
                title={vetShareBusy ? 'Preparing link…' : 'Invite clinic to send a record'}
                disabled={vetShareBusy}
                onPress={async () => {
                  setVetShareBusy(true);
                  try {
                    await shareVetUploadLink(currentPetId, petName);
                    countActiveVetUploadLinks(currentPetId)
                      .then(setActiveVetLinks)
                      .catch(() => setActiveVetLinks(null));
                  } catch (error) {
                    Alert.alert('Could not share link', error instanceof Error ? error.message : 'Try again.');
                  } finally {
                    setVetShareBusy(false);
                  }
                }}
              />
            ) : null}
            {canManageMedical ? <Text style={styles.cardMuted}>Each link accepts one file within seven days. Sender identity is not verified. Review incoming records in Medical Records.</Text> : null}
            {canManageMedical && currentPetId && activeVetLinks !== null && activeVetLinks > 0 ? (
              <>
                <Text style={styles.cardMuted}>{activeVetLinks} unused clinic link{activeVetLinks === 1 ? '' : 's'} active.</Text>
                <SecondaryButton title="Revoke unused clinic links" disabled={vetShareBusy} onPress={() => Alert.alert(
                  'Revoke clinic links?',
                  'All unused links for this pet will stop working. You can create a new one afterward.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Revoke links', style: 'destructive', onPress: async () => {
                      setVetShareBusy(true);
                      try {
                        await revokeVetUploadLinks(currentPetId);
                        setActiveVetLinks(0);
                      } catch (error) {
                        Alert.alert('Could not revoke links', error instanceof Error ? error.message : 'Try again.');
                      } finally { setVetShareBusy(false); }
                    } },
                  ]
                )} />
              </>
            ) : null}
          </Card>
        ) : null}

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
