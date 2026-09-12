import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type Screen = 'welcome' | 'addPet' | 'petProfile' | 'today';
type PetType = 'cat' | 'dog';
type PetSex = 'female' | 'male';
type AlteredStatus = 'yes' | 'no' | 'notSure';

export default function App() {
  const [screen, setScreen] = useState<Screen>('welcome');

  const [petName, setPetName] = useState('');
  const [petType, setPetType] = useState<PetType | null>(null);
  const [breed, setBreed] = useState('');
  const [petAge, setPetAge] = useState('');
  const [petSex, setPetSex] = useState<PetSex | null>(null);
  const [alteredStatus, setAlteredStatus] =
    useState<AlteredStatus | null>(null);

  const [weight, setWeight] = useState('');
  const [microchip, setMicrochip] = useState('');
  const [conditions, setConditions] = useState('');
  const [allergies, setAllergies] = useState('');
  const [medications, setMedications] = useState('');
  const [vetClinic, setVetClinic] = useState('');

  const canCreateProfile =
    petName.trim() !== '' && petType !== null;

  const petEmoji = petType === 'dog' ? '🐶' : '🐱';

  const alteredLabel =
    petSex === 'female'
      ? 'Spayed'
      : petSex === 'male'
      ? 'Neutered'
      : 'Spayed / Neutered';

  const alteredValue =
    alteredStatus === 'yes'
      ? 'Yes'
      : alteredStatus === 'no'
      ? 'No'
      : alteredStatus === 'notSure'
      ? 'Not sure'
      : 'Not provided';

  if (screen === 'welcome') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />

        <View style={styles.welcomeContent}>
          <View style={styles.brandBadge}>
            <Text style={styles.brandBadgeText}>🐾</Text>
          </View>

          <Text style={styles.logo}>Pawso</Text>

          <Text style={styles.heroTitle}>
            Smarter care for the pets you love.
          </Text>

          <Text style={styles.heroSubtitle}>
            Health records, medications, reminders, everyday care and AI
            insights — all in one place.
          </Text>

          <Pressable
            style={styles.primaryButton}
            onPress={() => setScreen('addPet')}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </Pressable>

          <Text style={styles.welcomeNote}>
            Your pet's story, remembered.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (screen === 'addPet') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.topRow}>
              <Pressable onPress={() => setScreen('welcome')}>
                <Text style={styles.backText}>← Back</Text>
              </Pressable>

              <Text style={styles.smallLogo}>Pawso</Text>
            </View>

            <Text style={styles.pageTitle}>Add your pet</Text>

            <Text style={styles.pageSubtitle}>
              Tell Pawso a little about your pet. You can update any of this
              later.
            </Text>

            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoEmoji}>
                {petType === 'dog'
                  ? '🐶'
                  : petType === 'cat'
                  ? '🐱'
                  : '🐾'}
              </Text>
            </View>

            <Text style={styles.photoHelper}>Pet photo coming next</Text>

            <Text style={styles.sectionTitle}>Basics</Text>

            <Text style={styles.label}>Pet name *</Text>

            <TextInput
              value={petName}
              onChangeText={setPetName}
              placeholder="e.g. Vicki"
              placeholderTextColor="#9AA5A1"
              style={styles.input}
            />

            <Text style={styles.label}>What kind of pet? *</Text>

            <View style={styles.twoColumnRow}>
              <OptionButton
                label="🐱 Cat"
                selected={petType === 'cat'}
                onPress={() => setPetType('cat')}
              />

              <OptionButton
                label="🐶 Dog"
                selected={petType === 'dog'}
                onPress={() => setPetType('dog')}
              />
            </View>

            <Text style={styles.label}>Breed</Text>

            <TextInput
              value={breed}
              onChangeText={setBreed}
              placeholder="e.g. Persian, Domestic Shorthair"
              placeholderTextColor="#9AA5A1"
              style={styles.input}
            />

            <Text style={styles.label}>Date of birth or approximate age</Text>

            <TextInput
              value={petAge}
              onChangeText={setPetAge}
              placeholder="e.g. May 2022 or about 4 years"
              placeholderTextColor="#9AA5A1"
              style={styles.input}
            />

            <Text style={styles.helperText}>
              Approximate age is completely fine.
            </Text>

            <Text style={styles.label}>Sex</Text>

            <View style={styles.twoColumnRow}>
              <OptionButton
                label="Female"
                selected={petSex === 'female'}
                onPress={() => setPetSex('female')}
              />

              <OptionButton
                label="Male"
                selected={petSex === 'male'}
                onPress={() => setPetSex('male')}
              />
            </View>

            <Text style={styles.label}>{alteredLabel}?</Text>

            <View style={styles.threeColumnRow}>
              <SmallOptionButton
                label="Yes"
                selected={alteredStatus === 'yes'}
                onPress={() => setAlteredStatus('yes')}
              />

              <SmallOptionButton
                label="No"
                selected={alteredStatus === 'no'}
                onPress={() => setAlteredStatus('no')}
              />

              <SmallOptionButton
                label="Not sure"
                selected={alteredStatus === 'notSure'}
                onPress={() => setAlteredStatus('notSure')}
              />
            </View>

            <Text style={styles.sectionTitle}>Health details</Text>

            <Text style={styles.label}>Weight</Text>

            <TextInput
              value={weight}
              onChangeText={setWeight}
              placeholder="e.g. 4 kg"
              placeholderTextColor="#9AA5A1"
              style={styles.input}
            />

            <Text style={styles.label}>Microchip number</Text>

            <TextInput
              value={microchip}
              onChangeText={setMicrochip}
              placeholder="Optional"
              placeholderTextColor="#9AA5A1"
              style={styles.input}
            />

            <Text style={styles.label}>Existing health conditions</Text>

            <TextInput
              value={conditions}
              onChangeText={setConditions}
              placeholder="e.g. Kidney disease, asthma"
              placeholderTextColor="#9AA5A1"
              multiline
              style={[styles.input, styles.textArea]}
            />

            <Text style={styles.label}>Allergies</Text>

            <TextInput
              value={allergies}
              onChangeText={setAllergies}
              placeholder="Food, medication or other allergies"
              placeholderTextColor="#9AA5A1"
              multiline
              style={[styles.input, styles.textArea]}
            />

            <Text style={styles.label}>Current medications</Text>

            <TextInput
              value={medications}
              onChangeText={setMedications}
              placeholder="Medication name, dose, frequency"
              placeholderTextColor="#9AA5A1"
              multiline
              style={[styles.input, styles.textArea]}
            />

            <Text style={styles.sectionTitle}>Veterinary care</Text>

            <Text style={styles.label}>Primary vet or clinic</Text>

            <TextInput
              value={vetClinic}
              onChangeText={setVetClinic}
              placeholder="e.g. Walnut Grove Animal Hospital"
              placeholderTextColor="#9AA5A1"
              style={styles.input}
            />

            <Pressable
              style={[
                styles.primaryButton,
                styles.createButton,
                !canCreateProfile && styles.disabledButton,
              ]}
              disabled={!canCreateProfile}
              onPress={() => setScreen('petProfile')}
            >
              <Text style={styles.primaryButtonText}>
                Create Pet Profile
              </Text>
            </Pressable>

            {!canCreateProfile && (
              <Text style={styles.requiredNote}>
                Pet name and type are required.
              </Text>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  if (screen === 'petProfile') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />

        <ScrollView
          contentContainerStyle={styles.profileContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topRow}>
            <Text style={styles.smallLogo}>Pawso</Text>

            <Pressable onPress={() => setScreen('addPet')}>
              <Text style={styles.editText}>Edit</Text>
            </Pressable>
          </View>

          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarEmoji}>{petEmoji}</Text>
            </View>

            <Text style={styles.profileName}>{petName}</Text>

            <Text style={styles.profileMeta}>
              {petType === 'cat' ? 'Cat' : 'Dog'}
              {breed.trim() !== '' ? ` · ${breed}` : ''}
            </Text>
          </View>

          <InfoCard title="About">
            <ProfileRow
              label="Age / DOB"
              value={petAge || 'Not provided'}
            />

            <ProfileRow
              label="Sex"
              value={
                petSex
                  ? petSex === 'female'
                    ? 'Female'
                    : 'Male'
                  : 'Not provided'
              }
            />

            <ProfileRow
              label={alteredLabel}
              value={alteredValue}
            />

            <ProfileRow
              label="Weight"
              value={weight || 'Not provided'}
              last
            />
          </InfoCard>

          <InfoCard title="Health">
            <ProfileRow
              label="Conditions"
              value={conditions || 'None added'}
            />

            <ProfileRow
              label="Allergies"
              value={allergies || 'None added'}
            />

            <ProfileRow
              label="Medications"
              value={medications || 'None added'}
              last
            />
          </InfoCard>

          <InfoCard title="Care">
            <ProfileRow
              label="Vet / Clinic"
              value={vetClinic || 'Not added'}
            />

            <ProfileRow
              label="Microchip"
              value={microchip || 'Not added'}
              last
            />
          </InfoCard>

          <View style={styles.aiCard}>
            <Text style={styles.aiBadge}>PAWSO AI</Text>

            <Text style={styles.aiTitle}>
              {petName}'s memory is ready to grow.
            </Text>

            <Text style={styles.aiText}>
              Add veterinary records, medications and health updates so Pawso
              can organize {petName}'s history over time.
            </Text>
          </View>

          <Pressable
            style={styles.primaryButton}
            onPress={() => setScreen('today')}
          >
            <Text style={styles.primaryButtonText}>
              Go to Today
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={styles.todayContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <View>
            <Text style={styles.todayGreeting}>Good morning</Text>
            <Text style={styles.todaySubtitle}>
              Here's what your pets need today.
            </Text>
          </View>

          <View style={styles.miniAvatar}>
            <Text>{petEmoji}</Text>
          </View>
        </View>

        <Text style={styles.smallLogo}>Pawso</Text>

        <View style={styles.petChip}>
          <Text style={styles.petChipText}>
            {petEmoji} {petName}
          </Text>
        </View>

        <Text style={styles.dashboardSectionTitle}>Today</Text>

        <View style={styles.emptyTaskCard}>
          <Text style={styles.emptyTaskIcon}>✓</Text>

          <View style={styles.flex}>
            <Text style={styles.emptyTaskTitle}>
              You're all caught up
            </Text>

            <Text style={styles.emptyTaskText}>
              No care tasks are due yet.
            </Text>
          </View>
        </View>

        <Text style={styles.dashboardSectionTitle}>
          Health overview
        </Text>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>0</Text>
            <Text style={styles.summaryLabel}>Due today</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>
              {medications.trim() ? '1' : '0'}
            </Text>
            <Text style={styles.summaryLabel}>Medications</Text>
          </View>
        </View>

        <View style={styles.aiCard}>
          <Text style={styles.aiBadge}>PAWSO AI</Text>

          <Text style={styles.aiTitle}>
            Build {petName}'s health timeline
          </Text>

          <Text style={styles.aiText}>
            Upload a veterinary record and Pawso will help organize the
            important details for you to review.
          </Text>

          <Pressable style={styles.outlineButton}>
            <Text style={styles.outlineButtonText}>
              Upload vet record
            </Text>
          </Pressable>
        </View>

        <Text style={styles.dashboardSectionTitle}>
          Quick actions
        </Text>

        <View style={styles.quickActions}>
          <QuickAction icon="💊" label="Medication" />
          <QuickAction icon="📄" label="Record" />
          <QuickAction icon="🩺" label="Symptom" />
          <QuickAction icon="⚖️" label="Weight" />
        </View>

        <Pressable
          style={styles.secondaryLargeButton}
          onPress={() => setScreen('petProfile')}
        >
          <Text style={styles.secondaryLargeButtonText}>
            View {petName}'s profile
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function OptionButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.optionButton,
        selected && styles.optionButtonSelected,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.optionText,
          selected && styles.optionTextSelected,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function SmallOptionButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.smallOptionButton,
        selected && styles.optionButtonSelected,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.smallOptionText,
          selected && styles.optionTextSelected,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.infoCard}>
      <Text style={styles.infoCardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function ProfileRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.profileRow,
        last && styles.profileRowLast,
      ]}
    >
      <Text style={styles.profileRowLabel}>{label}</Text>
      <Text style={styles.profileRowValue}>{value}</Text>
    </View>
  );
}

function QuickAction({
  icon,
  label,
}: {
  icon: string;
  label: string;
}) {
  return (
    <Pressable style={styles.quickActionCard}>
      <Text style={styles.quickActionIcon}>{icon}</Text>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  container: {
    flex: 1,
    backgroundColor: '#F8F6F1',
  },

  welcomeContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },

  brandBadge: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#E2F0EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  brandBadgeText: {
    fontSize: 26,
  },

  logo: {
    fontSize: 23,
    fontWeight: '800',
    color: '#2F6F63',
    marginBottom: 28,
  },

  smallLogo: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2F6F63',
  },

  heroTitle: {
    fontSize: 40,
    lineHeight: 46,
    fontWeight: '800',
    color: '#1F2A27',
  },

  heroSubtitle: {
    marginTop: 18,
    fontSize: 18,
    lineHeight: 28,
    color: '#66736F',
  },

  welcomeNote: {
    marginTop: 18,
    textAlign: 'center',
    color: '#88938F',
    fontSize: 14,
  },

  primaryButton: {
    marginTop: 34,
    backgroundColor: '#2F6F63',
    paddingVertical: 17,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },

  disabledButton: {
    opacity: 0.35,
  },

  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 50,
  },

  profileContent: {
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 50,
  },

  todayContent: {
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 50,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2F6F63',
  },

  editText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2F6F63',
  },

  pageTitle: {
    marginTop: 34,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
    color: '#1F2A27',
  },

  pageSubtitle: {
    marginTop: 10,
    fontSize: 16,
    lineHeight: 24,
    color: '#66736F',
  },

  photoPlaceholder: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#E2F0EB',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },

  photoEmoji: {
    fontSize: 42,
  },

  photoHelper: {
    textAlign: 'center',
    marginTop: 9,
    fontSize: 13,
    color: '#88938F',
  },

  sectionTitle: {
    marginTop: 34,
    marginBottom: 4,
    fontSize: 21,
    fontWeight: '800',
    color: '#1F2A27',
  },

  label: {
    marginTop: 22,
    marginBottom: 9,
    fontSize: 15,
    fontWeight: '700',
    color: '#34433E',
  },

  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8E0DD',
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2A27',
  },

  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },

  helperText: {
    marginTop: 7,
    fontSize: 13,
    color: '#88938F',
  },

  twoColumnRow: {
    flexDirection: 'row',
    gap: 12,
  },

  threeColumnRow: {
    flexDirection: 'row',
    gap: 8,
  },

  optionButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8E0DD',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },

  smallOptionButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8E0DD',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },

  optionButtonSelected: {
    backgroundColor: '#E2F0EB',
    borderColor: '#2F6F63',
    borderWidth: 1.5,
  },

  optionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#66736F',
  },

  smallOptionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#66736F',
  },

  optionTextSelected: {
    color: '#2F6F63',
  },

  createButton: {
    marginTop: 38,
  },

  requiredNote: {
    textAlign: 'center',
    marginTop: 10,
    color: '#88938F',
    fontSize: 13,
  },

  profileHeader: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 28,
  },

  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#E2F0EB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarEmoji: {
    fontSize: 50,
  },

  profileName: {
    marginTop: 16,
    fontSize: 30,
    fontWeight: '800',
    color: '#1F2A27',
  },

  profileMeta: {
    marginTop: 6,
    fontSize: 16,
    color: '#66736F',
  },

  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingTop: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E9E7',
  },

  infoCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2A27',
    marginBottom: 5,
  },

  profileRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF0EF',
  },

  profileRowLast: {
    borderBottomWidth: 0,
  },

  profileRowLabel: {
    fontSize: 13,
    color: '#88938F',
    marginBottom: 5,
  },

  profileRowValue: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    color: '#34433E',
  },

  aiCard: {
    marginTop: 8,
    backgroundColor: '#EDF6F2',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#D5E8E0',
  },

  aiBadge: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#2F6F63',
  },

  aiTitle: {
    marginTop: 9,
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '800',
    color: '#1F2A27',
  },

  aiText: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 23,
    color: '#5E6E68',
  },

  todayGreeting: {
    fontSize: 27,
    fontWeight: '800',
    color: '#1F2A27',
  },

  todaySubtitle: {
    marginTop: 4,
    fontSize: 15,
    color: '#66736F',
  },

  miniAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E2F0EB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  petChip: {
    alignSelf: 'flex-start',
    marginTop: 26,
    backgroundColor: '#E2F0EB',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },

  petChipText: {
    color: '#2F6F63',
    fontWeight: '700',
  },

  dashboardSectionTitle: {
    marginTop: 30,
    marginBottom: 12,
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2A27',
  },

  emptyTaskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: '#E5E9E7',
  },

  emptyTaskIcon: {
    width: 38,
    height: 38,
    lineHeight: 38,
    borderRadius: 19,
    backgroundColor: '#E2F0EB',
    textAlign: 'center',
    color: '#2F6F63',
    fontSize: 18,
    fontWeight: '800',
  },

  emptyTaskTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2A27',
  },

  emptyTaskText: {
    marginTop: 3,
    fontSize: 14,
    color: '#7A8783',
  },

  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
  },

  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E9E7',
  },

  summaryNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2F6F63',
  },

  summaryLabel: {
    marginTop: 5,
    fontSize: 14,
    color: '#66736F',
  },

  outlineButton: {
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#2F6F63',
    borderRadius: 13,
    paddingVertical: 12,
    alignItems: 'center',
  },

  outlineButtonText: {
    color: '#2F6F63',
    fontWeight: '700',
    fontSize: 15,
  },

  quickActions: {
    flexDirection: 'row',
    gap: 8,
  },

  quickActionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E9E7',
  },

  quickActionIcon: {
    fontSize: 24,
  },

  quickActionLabel: {
    marginTop: 7,
    fontSize: 11,
    fontWeight: '700',
    color: '#5E6E68',
  },

  secondaryLargeButton: {
    marginTop: 30,
    borderWidth: 1,
    borderColor: '#D2DAD7',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
  },

  secondaryLargeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2F6F63',
  },
});