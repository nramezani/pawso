import { Text, View } from 'react-native';
import { usePawso } from '../context/PawsoContext';
import { Page, PrimaryButton, SecondaryButton, styles } from '../components/ui';

export function AddMenuScreen() {
  const {
    petName,
    pickVetRecord,
    setScreen,
  } = usePawso();

  return (
    <Page scroll>
      <View style={{ marginTop: 18 }}>
        <Text style={styles.pageTitle}>Add to Pawso</Text>
        <Text style={styles.pageSubtitle}>
          Add a record or care item for {petName || 'your pet'}.
        </Text>
      </View>

      <PrimaryButton title="📄 Upload veterinary record" onPress={pickVetRecord} />
      <SecondaryButton title="💊 Add medication" onPress={() => setScreen('addMedication')} />
      <SecondaryButton title="📅 Add care task" onPress={() => setScreen('addCareTask')} />

      <Text style={styles.safetyText}>
        Symptom and weight logging will be added as dedicated flows next.
      </Text>
    </Page>
  );
}
