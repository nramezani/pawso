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
    databaseError,
    isSavingPet,
    canCreateProfile,
    createPetProfile,
  } = usePawso();
  const [showHealthDetails, setShowHealthDetails] = useState(false);

  return (
    <Page scroll keyboard>
      <Header back={cancelAddPet} title="Pawso" />

      <Text style={styles.pageTitle}>Add your pet</Text>
      <Text style={styles.pageSubtitle}>
        Start with the basics. Everything else can be added now or later.
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
      <Input value={breed} onChangeText={setBreed} placeholder="Optional" />

      <Label text="Date of birth or approximate age" />
      <Input
        value={petAge}
        onChangeText={setPetAge}
        placeholder="e.g. May 2022 or about 4 years"
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
          <Input value={weight} onChangeText={setWeight} placeholder="e.g. 4 kg" />

          <Label text="Microchip number" />
          <Input value={microchip} onChangeText={setMicrochip} placeholder="Optional" />

          <Label text="Existing health conditions" />
          <Input
            value={conditions}
            onChangeText={setConditions}
            placeholder="e.g. kidney disease"
            multiline
          />

          <Label text="Allergies" />
          <Input value={allergies} onChangeText={setAllergies} placeholder="Optional" multiline />

          <Label text="Current medications" />
          <Input
            value={medications}
            onChangeText={setMedications}
            placeholder="Medication, dose, frequency"
            multiline
          />

          <Label text="Primary vet or clinic" />
          <Input value={vetClinic} onChangeText={setVetClinic} placeholder="Clinic name" />
        </>
      ) : null}

      {databaseError ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Could not save pet</Text>
          <Text style={styles.errorText}>{databaseError}</Text>
        </View>
      ) : null}

      <PrimaryButton
        title={isSavingPet ? 'Saving pet…' : 'Create pet profile'}
        disabled={!canCreateProfile || isSavingPet}
        onPress={createPetProfile}
      />
    </Page>
  );
}
