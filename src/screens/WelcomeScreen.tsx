import { ActivityIndicator, Image, Text, View } from 'react-native';

import { usePawso } from '../context/PawsoContext';
import { Page, PrimaryButton, SecondaryButton, styles } from '../components/ui';

export function WelcomeScreen() {
  const {
    setScreen,
    authReady,
    setAuthReady,
    authError,
    initializeSupabase,
  } = usePawso();

  if (!authReady) {
    return (
      <Page>
        <View style={styles.centerPage}>
          <Image
            source={require('../../assets/icon.png')}
            style={[styles.brandImage, { alignSelf: 'center' }]}
            accessibilityLabel="Pawso logo"
          />
          <ActivityIndicator
            size="large"
            color="#53166F"
            style={{ marginTop: 24 }}
          />
          <Text style={styles.loadingText}>Opening your Pawso home…</Text>
        </View>
      </Page>
    );
  }

  if (authError) {
    return (
      <Page scroll>
        <View style={styles.centerPage}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.brandImage}
            accessibilityLabel="Pawso logo"
          />
          <Text style={styles.heroTitle}>Pawso could not open yet.</Text>
          <Text style={styles.heroSubtitle}>{authError}</Text>
          <PrimaryButton
            title="Try again"
            onPress={() => {
              setAuthReady(false);
              initializeSupabase();
            }}
          />
        </View>
      </Page>
    );
  }

  return (
    <Page scroll>
      <View style={styles.centerPage}>
        <Image
          source={require('../../assets/icon.png')}
          style={styles.brandImage}
          accessibilityLabel="Pawso logo"
        />

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
