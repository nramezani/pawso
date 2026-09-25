import { useState } from 'react';
import { Alert, Image, Pressable, Text, View } from 'react-native';

import { usePawso } from '../context/PawsoContext';
import { MetricStrip } from '../components/VisualSummary';
import { Page, Header, PrimaryButton, styles } from '../components/ui';

export function PetsScreen() {
  const [showArchived, setShowArchived] = useState(false);
  const {
    pets,
    archivedPets,
    currentPetId,
    selectPet,
    startAddPet,
    databaseError,
    householdMembers,
    canManageMedical,
    setScreen,
    restoreArchivedPet,
    deleteArchivedPet,
    dataRightsBusy,
    dataRightsError,
    dataRightsMessage,
  } = usePawso();
  const catCount = pets.filter((pet) => pet.species === 'cat').length;
  const dogCount = pets.filter((pet) => pet.species === 'dog').length;

  return (
    <Page scroll>
      <Header title="Pawso" />

      <Text style={styles.pageTitle}>Your pets</Text>
      <Text style={styles.pageSubtitle}>
        Switch pets anytime. Pawso keeps each pet's records, medications,
        care tasks, and AI memory separate.
      </Text>

      {pets.length > 0 ? (
        <MetricStrip
          accessibilityLabel="Pawso household overview"
          items={[
            { label: 'Pets', value: pets.length, icon: '🐾', tone: 'purple' },
            { label: 'Cats', value: catCount, icon: '🐱', tone: 'green' },
            { label: 'Dogs', value: dogCount, icon: '🐶', tone: 'green' },
            {
              label: 'People',
              value: householdMembers.length,
              icon: '👥',
              tone: 'neutral',
            },
          ]}
        />
      ) : null}

      {databaseError !== '' ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Could not update pets</Text>
          <Text style={styles.errorText}>{databaseError}</Text>
        </View>
      ) : null}

      {dataRightsError ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Could not update archived pets</Text>
          <Text style={styles.errorText}>{dataRightsError}</Text>
        </View>
      ) : dataRightsMessage ? (
        <View style={styles.infoCard}>
          <Text style={styles.cardStrong}>✓ {dataRightsMessage}</Text>
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
              accessibilityRole="button"
              accessibilityLabel={`View ${pet.name}'s profile`}
              accessibilityState={{ selected }}
            >
              <View style={styles.petListAvatar}>
                {pet.photo_url ? (
                  <Image
                    source={{ uri: pet.photo_url }}
                    style={styles.petListPhoto}
                    accessibilityLabel={`${pet.name}'s photo`}
                  />
                ) : (
                  <Text style={{ fontSize: 28 }}>{emoji}</Text>
                )}
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

      {canManageMedical ? (
        <PrimaryButton title="+ Add another pet" onPress={startAddPet} />
      ) : null}

      {canManageMedical && archivedPets.length > 0 ? (
        <View style={{ marginTop: 12 }}>
          <Pressable
            style={styles.outlineButton}
            accessibilityRole="button"
            accessibilityLabel={`${showArchived ? 'Hide' : 'Show'} archived pets`}
            accessibilityState={{ expanded: showArchived }}
            onPress={() => setShowArchived((value) => !value)}
          >
            <Text style={styles.outlineButtonText}>
              {showArchived ? 'Hide' : 'Show'} archived pets ({archivedPets.length})
            </Text>
          </Pressable>
          {showArchived
            ? archivedPets.map((pet) => (
                <View key={`archived-${pet.id}`} style={styles.documentCard}>
                  <Text style={styles.cardStrong}>{pet.name}</Text>
                  <Text style={styles.cardMuted}>
                    Archived {pet.archived_at ? new Date(pet.archived_at).toLocaleDateString() : ''}
                  </Text>
                  <View style={styles.compactActionRow}>
                    <Pressable
                      style={styles.compactActionButton}
                      disabled={dataRightsBusy}
                      accessibilityRole="button"
                      accessibilityLabel={`Restore ${pet.name}`}
                      accessibilityState={{ disabled: dataRightsBusy }}
                      onPress={() => restoreArchivedPet(pet)}
                    >
                      <Text style={styles.compactActionText}>Restore</Text>
                    </Pressable>
                    <Pressable
                      style={styles.compactActionButton}
                      disabled={dataRightsBusy}
                      accessibilityRole="button"
                      accessibilityLabel={`Delete ${pet.name} permanently`}
                      accessibilityState={{ disabled: dataRightsBusy }}
                      onPress={() =>
                        Alert.alert(
                          `Delete ${pet.name} permanently?`,
                          'This removes the pet, records, documents, photos, medications, and care history. This cannot be undone.',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Delete permanently',
                              style: 'destructive',
                              onPress: () => deleteArchivedPet(pet),
                            },
                          ]
                        )
                      }
                    >
                      <Text style={styles.compactActionText}>Delete</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            : null}
        </View>
      ) : null}

      <View style={{ marginTop: 12 }}>
        <Pressable
          style={styles.infoCard}
          onPress={() => setScreen('household')}
          accessibilityRole="button"
          accessibilityLabel="Manage people and pet access"
        >
          <Text style={styles.cardStrong}>People & access</Text>
          <Text style={styles.cardMuted}>
            {householdMembers.length === 1
              ? 'Only you currently have access. Invite a caregiver or sitter.'
              : `${householdMembers.length} people have access. Manage caregivers and sitters.`}
          </Text>
        </Pressable>

        <Pressable
          style={styles.infoCard}
          onPress={() => setScreen('account')}
          accessibilityRole="button"
          accessibilityLabel="Open account and settings"
        >
          <Text style={styles.cardStrong}>Account & settings</Text>
          <Text style={styles.cardMuted}>
            Sign in or out, manage password recovery, privacy, and account data.
          </Text>
        </Pressable>
      </View>
    </Page>
  );
}
