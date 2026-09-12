import { Text, View } from 'react-native';
import { usePawso } from '../context/PawsoContext';
import { Page, PrimaryButton, SecondaryButton, styles } from '../components/ui';

export function AddMenuScreen() {
  const {
    petName,
    pickVetRecord,
    setScreen,
    householdRole,
    canManageMedical,
    canManageCare,
  } = usePawso();

  return (
    <Page scroll>
      <View style={{ marginTop: 18 }}>
        <Text style={styles.pageTitle}>Add to Pawso</Text>
        <Text style={styles.pageSubtitle}>
          Add a record or care item for {petName || 'your pet'}.
        </Text>
      </View>

      {canManageMedical ? (
        <>
          <PrimaryButton title="📄 Upload veterinary record" onPress={pickVetRecord} />
          <SecondaryButton title="💊 Add medication" onPress={() => setScreen('addMedication')} />
        </>
      ) : null}

      {canManageCare ? (
        <SecondaryButton title="📅 Add care task" onPress={() => setScreen('addCareTask')} />
      ) : null}

      {!canManageMedical && !canManageCare ? (
        <View style={styles.infoCard}>
          <Text style={styles.cardStrong}>Sitter access</Text>
          <Text style={styles.cardMuted}>
            You can follow existing care tasks and log completion, but cannot create medical records,
            medications, or new care plans.
          </Text>
        </View>
      ) : null}

      <Text style={styles.safetyText}>
        Signed in as {householdRole || 'household member'}.
      </Text>
    </Page>
  );
}
