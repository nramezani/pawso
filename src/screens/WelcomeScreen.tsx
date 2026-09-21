import { Text, View } from 'react-native';

import { usePawso } from '../context/PawsoContext';
import { Page, PrimaryButton, SecondaryButton, styles } from '../components/ui';

export function WelcomeScreen() {
  const { setScreen } = usePawso();

  return (
    <Page>
      <View style={styles.centerPage}>
        <View style={styles.brandBadge}>
          <Text style={styles.bigEmoji}>🐾</Text>
        </View>

        <Text style={styles.logo}>Pawso</Text>
        <Text style={styles.heroTitle}>Smarter care for the pets you love.</Text>
        <Text style={styles.heroSubtitle}>
          Keep health records, medications, reminders and everyday care together
          for everyone helping your pet.
        </Text>

        <PrimaryButton
          title="Add my first pet"
          onPress={() => setScreen('addPet')}
        />
        <SecondaryButton
          title="I already have an account"
          onPress={() => setScreen('account')}
        />
      </View>
    </Page>
  );
}
