import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export default function App() {
  const [screen, setScreen] = useState<'welcome' | 'addPet' | 'petSaved'>(
    'welcome'
  );

  const [petName, setPetName] = useState('');

  if (screen === 'petSaved') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />

        <View style={styles.content}>
          <Text style={styles.logo}>Pawso</Text>

          <Text style={styles.title}>Welcome, {petName}! 🐾</Text>

          <Text style={styles.subtitle}>
            Your pet profile has been started.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (screen === 'addPet') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />

        <View style={styles.content}>
          <Text style={styles.logo}>Pawso</Text>

          <Text style={styles.title}>Add your first pet</Text>

          <Text style={styles.subtitle}>
            Start by telling Pawso a little about your pet.
          </Text>

          <TextInput
            placeholder="Pet name"
            placeholderTextColor="#9AA5A1"
            style={styles.input}
            value={petName}
            onChangeText={setPetName}
          />

          <Pressable
            style={[
              styles.button,
              petName.trim() === '' && styles.buttonDisabled,
            ]}
            disabled={petName.trim() === ''}
            onPress={() => setScreen('petSaved')}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={() => setScreen('welcome')}
          >
            <Text style={styles.secondaryButtonText}>Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.content}>
        <Text style={styles.logo}>Pawso</Text>

        <Text style={styles.title}>
          Smarter care for the pets you love.
        </Text>

        <Text style={styles.subtitle}>
          Keep health records, medications, reminders, and everyday care in one
          place.
        </Text>

        <Pressable
          style={styles.button}
          onPress={() => setScreen('addPet')}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F6F1',
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },

  logo: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 32,
    color: '#2F6F63',
  },

  title: {
    fontSize: 38,
    lineHeight: 44,
    fontWeight: '700',
    color: '#1F2A27',
    marginBottom: 18,
  },

  subtitle: {
    fontSize: 18,
    lineHeight: 27,
    color: '#66736F',
  },

  input: {
    marginTop: 32,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8E0DD',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 17,
    color: '#1F2A27',
  },

  button: {
    marginTop: 36,
    backgroundColor: '#2F6F63',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },

  buttonDisabled: {
    opacity: 0.4,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },

  secondaryButton: {
    marginTop: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },

  secondaryButtonText: {
    color: '#2F6F63',
    fontSize: 16,
    fontWeight: '600',
  },
});