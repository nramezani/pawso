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
  const [petType, setPetType] = useState<'cat' | 'dog' | null>(null);

  const canContinue = petName.trim() !== '' && petType !== null;

  if (screen === 'petSaved') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />

        <View style={styles.content}>
          <Text style={styles.logo}>Pawso</Text>

          <Text style={styles.title}>Welcome, {petName}! 🐾</Text>

          <Text style={styles.subtitle}>
            Your {petType} profile has been started.
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

          <Text style={styles.label}>What kind of pet?</Text>

          <View style={styles.petTypeRow}>
            <Pressable
              style={[
                styles.petTypeButton,
                petType === 'cat' && styles.petTypeButtonSelected,
              ]}
              onPress={() => setPetType('cat')}
            >
              <Text
                style={[
                  styles.petTypeText,
                  petType === 'cat' && styles.petTypeTextSelected,
                ]}
              >
                🐱 Cat
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.petTypeButton,
                petType === 'dog' && styles.petTypeButtonSelected,
              ]}
              onPress={() => setPetType('dog')}
            >
              <Text
                style={[
                  styles.petTypeText,
                  petType === 'dog' && styles.petTypeTextSelected,
                ]}
              >
                🐶 Dog
              </Text>
            </Pressable>
          </View>

          <Pressable
            style={[styles.button, !canContinue && styles.buttonDisabled]}
            disabled={!canContinue}
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

  label: {
    marginTop: 28,
    marginBottom: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2A27',
  },

  petTypeRow: {
    flexDirection: 'row',
    gap: 12,
  },

  petTypeButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8E0DD',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },

  petTypeButtonSelected: {
    backgroundColor: '#E2F0EB',
    borderColor: '#2F6F63',
  },

  petTypeText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#66736F',
  },

  petTypeTextSelected: {
    color: '#2F6F63',
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