import { useState } from 'react';
import { Text, View } from 'react-native';

import { usePawso } from '../context/PawsoContext';
import {
  Page,
  Header,
  Label,
  Input,
  OptionButton,
  PrimaryButton,
  SecondaryButton,
  styles,
} from '../components/ui';

export function AddPetScreen() {
  const {
    cancelAddPet,
    petName,
    setPetName,
    petType,
    setPetType,
    breed,
    setBreed,
    petAge,
    setPetAge,
    petDateOfBirth,
    setPetDateOfBirth,
    petSex,
    setPetSex,
    alteredStatus,
    setAlteredStatus,
    alteredLabel,
    weight,
    setWeight,
    microchip,
    setMicrochip,
    conditions,
    setConditions,
    allergies,
    setAllergies,
    medications,
    setMedications,
    vetClinic,
    setVetClinic,
    emergencyNotes,
    setEmergencyNotes,
    emergencyContactName,
    setEmergencyContactName,
    emergencyContactPhone,
    setEmergencyContactPhone,
    databaseError,
    isSavingPet,
    isEditingPet,
    canCreateProfile,
    createPetProfile,
  } = usePawso();
  const [showHealthDetails, setShowHealthDetails] = useState(isEditingPet);

  return (
    <Page scroll keyboard>
      <Header back={cancelAddPet} title="Pawso" />

      <Text style={styles.pageTitle}>
        {isEditingPet ? 'Edit pet details' : 'Add your pet'}
      </Text>
      <Text style={styles.pageSubtitle}>
        {isEditingPet
          ? 'Update the information your household uses for care.'
          : 'Start with the basics. Everything else can be added now or later.'}
      </Text>

      <View style={styles.petPhoto}>
        <Text style={styles.petPhotoEmoji}>
          {petType === 'dog' ? '🐶' : petType === 'cat' ? '🐱' : '🐾'}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Basics</Text>
      <Label text="Pet name *" />
      <Input
        value={petName}
        onChangeText={setPetName}
        placeholder="e.g. Vicki"
        maxLength={120}
      />

      <Label text="What kind of pet? *" />
      <View style={styles.row}>
        <OptionButton
          title="🐱 Cat"
          selected={petType === 'cat'}
          onPress={() => setPetType('cat')}
        />
        <OptionButton
          title="🐶 Dog"
          selected={petType === 'dog'}
          onPress={() => setPetType('dog')}
        />
      </View>

      <Label text="Breed" />
      <Input value={breed} onChangeText={setBreed} placeholder="Optional" maxLength={120} />

      <Label text="Date of birth" />
      <Input
        value={petDateOfBirth}
        onChangeText={setPetDateOfBirth}
        placeholder="YYYY-MM-DD"
        keyboardType="numbers-and-punctuation"
        maxLength={10}
      />

      <Label text="Approximate age (if DOB is unknown)" />
      <Input
        value={petAge}
        onChangeText={setPetAge}
        placeholder="e.g. about 4 years"
        maxLength={80}
      />

      <Label text="Sex" />
      <View style={styles.row}>
        <OptionButton
          title="Female"
          selected={petSex === 'female'}
          onPress={() => setPetSex('female')}
        />
        <OptionButton
          title="Male"
          selected={petSex === 'male'}
          onPress={() => setPetSex('male')}
        />
      </View>

      <Label text={`${alteredLabel}?`} />
      <View style={styles.row}>
        <OptionButton
          title="Yes"
          selected={alteredStatus === 'yes'}
          onPress={() => setAlteredStatus('yes')}
        />
        <OptionButton
          title="No"
          selected={alteredStatus === 'no'}
          onPress={() => setAlteredStatus('no')}
        />
        <OptionButton
          title="Not sure"
          selected={alteredStatus === 'notSure'}
          onPress={() => setAlteredStatus('notSure')}
        />
      </View>

      <SecondaryButton
        title={showHealthDetails ? 'Hide optional health details' : 'Add health details (optional)'}
        onPress={() => setShowHealthDetails((value) => !value)}
      />

      {showHealthDetails ? (
        <>
          <Text style={styles.sectionTitle}>Health details</Text>
          <Text style={styles.cardMuted}>
            Add what you know. You can complete or change these details from the
            pet profile later.
          </Text>

          <Label text="Weight" />
          <Input value={weight} onChangeText={setWeight} placeholder="e.g. 4 kg" maxLength={32} />

          <Label text="Microchip number" />
          <Input value={microchip} onChangeText={setMicrochip} placeholder="Optional" maxLength={80} />

          <Label text="Existing health conditions" />
          <Input
            value={conditions}
            onChangeText={setConditions}
            placeholder="e.g. kidney disease"
            multiline
            maxLength={2000}
          />

          <Label text="Allergies" />
          <Input value={allergies} onChangeText={setAllergies} placeholder="Optional" multiline maxLength={2000} />

          <Label text="Current medications" />
          <Input
            value={medications}
            onChangeText={setMedications}
            placeholder="Medication, dose, frequency"
            multiline
            maxLength={2000}
          />

          <Label text="Primary vet or clinic" />
          <Input value={vetClinic} onChangeText={setVetClinic} placeholder="Clinic name" maxLength={200} />

          <Text style={styles.sectionTitle}>Emergency handoff</Text>
          <Label text="Emergency contact name" />
          <Input
            value={emergencyContactName}
            onChangeText={setEmergencyContactName}
            placeholder="Pet owner or backup contact"
            maxLength={120}
          />
          <Label text="Emergency contact phone" />
          <Input
            value={emergencyContactPhone}
            onChangeText={setEmergencyContactPhone}
            placeholder="Phone number"
            keyboardType="phone-pad"
            maxLength={80}
          />
          <Label text="Emergency notes" />
          <Input
            value={emergencyNotes}
            onChangeText={setEmergencyNotes}
            placeholder="Important handling or emergency instructions"
            multiline
            maxLength={2000}
          />
        </>
      ) : null}

      {databaseError ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Could not save pet</Text>
          <Text style={styles.errorText}>{databaseError}</Text>
        </View>
      ) : null}

      <PrimaryButton
        title={
          isSavingPet
            ? 'Saving pet…'
            : isEditingPet
            ? 'Save changes'
            : 'Create pet profile'
        }
        disabled={!canCreateProfile || isSavingPet}
        onPress={createPetProfile}
      />
    </Page>
  );
}
