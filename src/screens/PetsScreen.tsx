import { Pressable, Text, View } from 'react-native';

import { usePawso } from '../context/PawsoContext';
import { Page, Header, PrimaryButton, styles } from '../components/ui';

export function PetsScreen() {
  const {
    pets,
    currentPetId,
    selectPet,
    startAddPet,
    databaseError,
  } = usePawso();

  return (
    <Page scroll>
      <Header title="Pawso" />

      <Text style={styles.pageTitle}>Your pets</Text>
      <Text style={styles.pageSubtitle}>
        Switch pets anytime. Pawso keeps each pet's records, medications,
        care tasks, and AI memory separate.
      </Text>

      {databaseError !== '' ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Could not update pets</Text>
          <Text style={styles.errorText}>{databaseError}</Text>
        </View>
      ) : null}

      <View style={{ marginTop: 24 }}>
        {pets.map((pet) => {
          const selected = pet.id === currentPetId;
          const emoji = pet.species === 'dog' ? '🐶' : '🐱';

          return (
            <Pressable
              key={pet.id}
              onPress={() => selectPet(pet.id, 'petProfile')}
              style={[
                styles.petListCard,
                selected && styles.petListCardSelected,
              ]}
            >
              <View style={styles.petListAvatar}>
                <Text style={{ fontSize: 28 }}>{emoji}</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.cardStrong}>{pet.name}</Text>
                <Text style={styles.cardMuted}>
                  {pet.species === 'cat' ? 'Cat' : 'Dog'}
                  {pet.breed ? ` · ${pet.breed}` : ''}
                </Text>
              </View>

              <View style={styles.petListRight}>
                {selected ? (
                  <Text style={styles.selectedPetBadge}>Selected</Text>
                ) : null}
                <Text style={styles.petListChevron}>›</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <PrimaryButton title="+ Add another pet" onPress={startAddPet} />
    </Page>
  );
}
