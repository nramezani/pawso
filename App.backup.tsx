import { StatusBar } from 'expo-status-bar';
import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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

type Screen =
  | 'welcome'
  | 'addPet'
  | 'petProfile'
  | 'today'
  | 'processing'
  | 'review'
  | 'timeline';

type PetType = 'cat' | 'dog';
type PetSex = 'female' | 'male';
type AlteredStatus = 'yes' | 'no' | 'notSure';

type TimelineEvent = {
  id: number;
  date: string;
  type: string;
  title: string;
  detail: string;
  source: string;
};

const API_BASE_URL = 'http://192.168.1.85:8000';

export default function App() {
  const [screen, setScreen] = useState<Screen>('welcome');

  const [apiStatus, setApiStatus] = useState('Checking backend...');

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

  const [documentName, setDocumentName] = useState('');
  const [documentSize, setDocumentSize] = useState<number | null>(null);

  const [uploadError, setUploadError] = useState('');

  const [visitDate, setVisitDate] = useState('');
  const [clinic, setClinic] = useState('');
  const [finding, setFinding] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [followUp, setFollowUp] = useState('');

  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    checkBackend();
  }, []);

  async function checkBackend() {
    try {
      setApiStatus('Checking backend...');

      const response = await fetch(`${API_BASE_URL}/health`);

      if (!response.ok) {
        throw new Error('Backend response failed');
      }

      const data = await response.json();

      if (data.status === 'ok') {
        setApiStatus('Backend connected');
      } else {
        setApiStatus('Backend unavailable');
      }
    } catch (error) {
      console.log('Backend connection error:', error);
      setApiStatus('Backend unavailable');
    }
  }

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

  async function pickVetRecord() {
  try {
    setUploadError('');

    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];

    setDocumentName(asset.name);
    setDocumentSize(asset.size ?? null);
    setScreen('processing');

    const uploadResult = await FileSystem.uploadAsync(
      `${API_BASE_URL}/api/v1/documents/extract`,
      asset.uri,
      {
        httpMethod: 'POST',
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: 'file',
        mimeType:
          asset.mimeType || 'application/octet-stream',
      }
    );

    if (
      uploadResult.status < 200 ||
      uploadResult.status >= 300
    ) {
      throw new Error(
        `Upload failed (${uploadResult.status}): ${uploadResult.body}`
      );
    }

    const data = JSON.parse(uploadResult.body);

    console.log('Document upload response:', data);

    setDocumentName(
      data.document?.filename || asset.name
    );

    setDocumentSize(
      data.document?.size_bytes ??
        asset.size ??
        null
    );

    setVisitDate(
      data.extraction?.visit_date || ''
    );

    setClinic(
      data.extraction?.clinic || ''
    );

    setFinding(
      data.extraction?.finding || ''
    );

    setDiagnosis(
      data.extraction?.diagnosis || ''
    );

    setFollowUp(
      data.extraction?.follow_up || ''
    );

    setScreen('review');
  } catch (error) {
    console.log('Document upload error:', error);

    setUploadError(
      error instanceof Error
        ? error.message
        : 'Something went wrong while uploading the file.'
    );

    setScreen('today');
  }
}

  function confirmExtraction() {
    const newEvents: TimelineEvent[] = [
      {
        id: Date.now(),
        date: visitDate || 'Date not found',
        type: 'Veterinary visit',
        title: finding || 'Veterinary record added',
        detail: diagnosis || 'No assessment provided.',
        source: documentName || 'Veterinary record',
      },
      {
        id: Date.now() + 1,
        date: visitDate || 'Date not found',
        type: 'Follow-up',
        title: 'Follow-up recommended',
        detail: followUp || 'No follow-up found.',
        source: documentName || 'Veterinary record',
      },
    ];

    setTimelineEvents((current) => [
      ...newEvents,
      ...current,
    ]);

    if (
      conditions.trim() === '' &&
      diagnosis.trim() !== ''
    ) {
      setConditions(diagnosis);
    }

    setScreen('timeline');
  }

  if (screen === 'welcome') {
    return (
      <Page>
        <View style={styles.centerPage}>
          <View style={styles.brandBadge}>
            <Text style={styles.bigEmoji}>🐾</Text>
          </View>

          <Text style={styles.logo}>Pawso</Text>

          <Text style={styles.heroTitle}>
            Smarter care for the pets you love.
          </Text>

          <Text style={styles.heroSubtitle}>
            Health records, medications, reminders, everyday care and AI
            insights — all in one place.
          </Text>

          <PrimaryButton
            title="Get Started"
            onPress={() => setScreen('addPet')}
          />
        </View>
      </Page>
    );
  }

  if (screen === 'addPet') {
    return (
      <Page scroll keyboard>
        <Header
          back={() => setScreen('welcome')}
          title="Pawso"
        />

        <Text style={styles.pageTitle}>Add your pet</Text>

        <Text style={styles.pageSubtitle}>
          Tell Pawso a little about your pet. You can update this later.
        </Text>

        <View style={styles.petPhoto}>
          <Text style={styles.petPhotoEmoji}>
            {petType === 'dog'
              ? '🐶'
              : petType === 'cat'
              ? '🐱'
              : '🐾'}
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

        <Input
          value={breed}
          onChangeText={setBreed}
          placeholder="e.g. Persian"
        />

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

        <Text style={styles.sectionTitle}>
          Health details
        </Text>

        <Label text="Weight" />

        <Input
          value={weight}
          onChangeText={setWeight}
          placeholder="e.g. 4 kg"
        />

        <Label text="Microchip number" />

        <Input
          value={microchip}
          onChangeText={setMicrochip}
          placeholder="Optional"
        />

        <Label text="Existing health conditions" />

        <Input
          value={conditions}
          onChangeText={setConditions}
          placeholder="e.g. kidney disease"
          multiline
        />

        <Label text="Allergies" />

        <Input
          value={allergies}
          onChangeText={setAllergies}
          placeholder="Optional"
          multiline
        />

        <Label text="Current medications" />

        <Input
          value={medications}
          onChangeText={setMedications}
          placeholder="Medication, dose, frequency"
          multiline
        />

        <Label text="Primary vet or clinic" />

        <Input
          value={vetClinic}
          onChangeText={setVetClinic}
          placeholder="Clinic name"
        />

        <PrimaryButton
          title="Create Pet Profile"
          disabled={!canCreateProfile}
          onPress={() => setScreen('petProfile')}
        />
      </Page>
    );
  }

  if (screen === 'petProfile') {
    return (
      <Page scroll>
        <Header title="Pawso" />

        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarEmoji}>
              {petEmoji}
            </Text>
          </View>

          <Text style={styles.profileName}>
            {petName}
          </Text>

          <Text style={styles.profileMeta}>
            {petType === 'cat' ? 'Cat' : 'Dog'}
            {breed ? ` · ${breed}` : ''}
          </Text>
        </View>

        <Card title="About">
          <Info
            label="Age / DOB"
            value={petAge || 'Not provided'}
          />

          <Info
            label="Sex"
            value={
              petSex
                ? petSex === 'female'
                  ? 'Female'
                  : 'Male'
                : 'Not provided'
            }
          />

          <Info
            label={alteredLabel}
            value={alteredValue}
          />

          <Info
            label="Weight"
            value={weight || 'Not provided'}
          />
        </Card>

        <Card title="Health">
          <Info
            label="Conditions"
            value={conditions || 'None added'}
          />

          <Info
            label="Allergies"
            value={allergies || 'None added'}
          />

          <Info
            label="Medications"
            value={medications || 'None added'}
          />
        </Card>

        <PrimaryButton
          title="Go to Today"
          onPress={() => setScreen('today')}
        />
      </Page>
    );
  }

  if (screen === 'today') {
    return (
      <Page scroll>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.todayTitle}>
              Good morning
            </Text>

            <Text style={styles.todaySubtitle}>
              Here's what {petName} needs today.
            </Text>
          </View>

          <View style={styles.smallAvatar}>
            <Text>{petEmoji}</Text>
          </View>
        </View>

        <Text style={styles.logo}>Pawso</Text>

        <Pressable
          style={[
            styles.apiStatus,
            apiStatus === 'Backend connected'
              ? styles.apiStatusConnected
              : styles.apiStatusDisconnected,
          ]}
          onPress={checkBackend}
        >
          <View
            style={[
              styles.apiDot,
              apiStatus === 'Backend connected'
                ? styles.apiDotConnected
                : styles.apiDotDisconnected,
            ]}
          />

          <Text
            style={[
              styles.apiStatusText,
              apiStatus === 'Backend connected'
                ? styles.apiStatusTextConnected
                : styles.apiStatusTextDisconnected,
            ]}
          >
            {apiStatus}
          </Text>

          <Text style={styles.apiRefresh}>
            Tap to refresh
          </Text>
        </Pressable>

        {uploadError !== '' && (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>
              Upload failed
            </Text>

            <Text style={styles.errorText}>
              {uploadError}
            </Text>
          </View>
        )}

        <View style={styles.petChip}>
          <Text style={styles.petChipText}>
            {petEmoji} {petName}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Today</Text>

        <View style={styles.successCard}>
          <Text style={styles.successIcon}>✓</Text>

          <View style={{ flex: 1 }}>
            <Text style={styles.cardStrong}>
              You're all caught up
            </Text>

            <Text style={styles.cardMuted}>
              No care tasks are due yet.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          Pawso AI
        </Text>

        <View style={styles.aiCard}>
          <Text style={styles.aiBadge}>
            AI PET MEMORY
          </Text>

          <Text style={styles.aiTitle}>
            Build {petName}'s health timeline
          </Text>

          <Text style={styles.aiText}>
            Upload a veterinary record. Pawso will send the file to the
            backend and organize the returned information for your review.
          </Text>

          <Pressable
            style={styles.outlineButton}
            onPress={pickVetRecord}
          >
            <Text style={styles.outlineButtonText}>
              📄 Upload vet record
            </Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>
          Quick actions
        </Text>

        <View style={styles.quickGrid}>
          <QuickAction
            icon="💊"
            label="Medication"
          />

          <QuickAction
            icon="📄"
            label="Record"
            onPress={pickVetRecord}
          />

          <QuickAction
            icon="🩺"
            label="Symptom"
          />

          <QuickAction
            icon="⚖️"
            label="Weight"
          />
        </View>

        {timelineEvents.length > 0 && (
          <PrimaryButton
            title="View Health Timeline"
            onPress={() => setScreen('timeline')}
          />
        )}

        <SecondaryButton
          title={`View ${petName}'s profile`}
          onPress={() => setScreen('petProfile')}
        />
      </Page>
    );
  }

  if (screen === 'processing') {
    return (
      <Page>
        <View style={styles.processingPage}>
          <ActivityIndicator
            size="large"
            color="#2F6F63"
          />

          <Text style={styles.processingTitle}>
            Uploading veterinary record
          </Text>

          <Text style={styles.processingStep}>
            Uploading → Backend processing → Ready to review
          </Text>

          <Text style={styles.documentName}>
            {documentName}
          </Text>

          {documentSize !== null && (
            <Text style={styles.documentMeta}>
              {(documentSize / 1024).toFixed(1)} KB
            </Text>
          )}

          <Text style={styles.safetyText}>
            Pawso will not save medical information until you review and
            confirm it.
          </Text>
        </View>
      </Page>
    );
  }

  if (screen === 'review') {
    return (
      <Page scroll keyboard>
        <Header
          back={() => setScreen('today')}
          title="AI Review"
        />

        <View style={styles.reviewHero}>
          <Text style={styles.reviewCheck}>✓</Text>

          <View style={{ flex: 1 }}>
            <Text style={styles.reviewHeroTitle}>
              File received by Pawso
            </Text>

            <Text style={styles.cardMuted}>
              Pawso organized the backend response. You remain in control.
            </Text>
          </View>
        </View>

        <View style={styles.uploadSuccessCard}>
          <Text style={styles.uploadSuccessTitle}>
            Backend upload successful
          </Text>

          <Text style={styles.uploadSuccessText}>
            {documentName}
          </Text>

          {documentSize !== null && (
            <Text style={styles.uploadSuccessMeta}>
              {(documentSize / 1024).toFixed(1)} KB received
            </Text>
          )}
        </View>


        <Text style={styles.sectionTitle}>
          Visit
        </Text>

        <ReviewField
          label="Visit date"
          value={visitDate}
          setValue={setVisitDate}
        />

        <ReviewField
          label="Clinic"
          value={clinic}
          setValue={setClinic}
        />

        <Text style={styles.sectionTitle}>
          Finding
        </Text>

        <ReviewField
          label="Finding"
          value={finding}
          setValue={setFinding}
          multiline
        />

        <Text style={styles.sourceText}>
          🏥 Source: Uploaded veterinary record
        </Text>

        <Text style={styles.sectionTitle}>
          Assessment
        </Text>

        <ReviewField
          label="Diagnosis / assessment"
          value={diagnosis}
          setValue={setDiagnosis}
          multiline
          warning
        />

        <Text style={styles.warningText}>
          ⚠ Please check — Pawso preserves uncertainty and does not diagnose.
        </Text>

        <Text style={styles.sectionTitle}>
          Suggested action
        </Text>

        <ReviewField
          label="Follow-up"
          value={followUp}
          setValue={setFollowUp}
          multiline
        />

        <View style={styles.confirmCard}>
          <Text style={styles.cardStrong}>
            When you confirm
          </Text>

          <Text style={styles.confirmItem}>
            ✓ Veterinary visit added to timeline
          </Text>

          <Text style={styles.confirmItem}>
            ✓ Finding saved to {petName}'s history
          </Text>

          <Text style={styles.confirmItem}>
            ✓ Follow-up added to health timeline
          </Text>

          <Text style={styles.confirmItem}>
            ✓ Original document stays linked as evidence
          </Text>
        </View>

        <PrimaryButton
          title="Confirm & Add to Health History"
          onPress={confirmExtraction}
        />

        <SecondaryButton
          title="Cancel"
          onPress={() => setScreen('today')}
        />
      </Page>
    );
  }

  return (
    <Page scroll>
      <Header
        back={() => setScreen('today')}
        title="Health Timeline"
      />

      <View style={styles.timelineHeader}>
        <View style={styles.smallAvatar}>
          <Text>{petEmoji}</Text>
        </View>

        <View>
          <Text style={styles.timelineTitle}>
            {petName}'s health history
          </Text>

          <Text style={styles.cardMuted}>
            {timelineEvents.length} recorded events
          </Text>
        </View>
      </View>

      {timelineEvents.length === 0 ? (
        <View style={styles.emptyTimeline}>
          <Text style={styles.bigEmoji}>📋</Text>

          <Text style={styles.cardStrong}>
            No health events yet
          </Text>
        </View>
      ) : (
        timelineEvents.map((event) => (
          <View
            key={event.id}
            style={styles.timelineEvent}
          >
            <View style={styles.timelineDot} />

            <View style={styles.timelineBody}>
              <Text style={styles.timelineDate}>
                {event.date}
              </Text>

              <Text style={styles.timelineType}>
                {event.type}
              </Text>

              <Text style={styles.timelineEventTitle}>
                {event.title}
              </Text>

              <Text style={styles.timelineDetail}>
                {event.detail}
              </Text>

              <Text style={styles.timelineSource}>
                🏥 {event.source}
              </Text>
            </View>
          </View>
        ))
      )}

      <PrimaryButton
        title="Upload Another Record"
        onPress={pickVetRecord}
      />

      <SecondaryButton
        title="Back to Today"
        onPress={() => setScreen('today')}
      />
    </Page>
  );
}

function Page({
  children,
  scroll = false,
  keyboard = false,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  keyboard?: boolean;
}) {
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={styles.pageContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={styles.pageContentFlex}>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {keyboard ? (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={
            Platform.OS === 'ios'
              ? 'padding'
              : undefined
          }
        >
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

function Header({
  back,
  title,
}: {
  back?: () => void;
  title: string;
}) {
  return (
    <View style={styles.headerRow}>
      {back ? (
        <Pressable onPress={back}>
          <Text style={styles.backText}>
            ← Back
          </Text>
        </Pressable>
      ) : (
        <View />
      )}

      <Text style={styles.smallLogo}>
        {title}
      </Text>
    </View>
  );
}

function Label({
  text,
}: {
  text: string;
}) {
  return (
    <Text style={styles.label}>
      {text}
    </Text>
  );
}

function Input(props: any) {
  return (
    <TextInput
      {...props}
      placeholderTextColor="#9AA5A1"
      style={[
        styles.input,
        props.multiline && styles.textArea,
      ]}
    />
  );
}

function OptionButton({
  title,
  selected,
  onPress,
}: {
  title: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.optionButton,
        selected && styles.optionSelected,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.optionText,
          selected &&
            styles.optionTextSelected,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

function PrimaryButton({
  title,
  onPress,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      style={[
        styles.primaryButton,
        disabled &&
          styles.disabledButton,
      ]}
      disabled={disabled}
      onPress={onPress}
    >
      <Text style={styles.primaryButtonText}>
        {title}
      </Text>
    </Pressable>
  );
}

function SecondaryButton({
  title,
  onPress,
}: {
  title: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={styles.secondaryButton}
      onPress={onPress}
    >
      <Text style={styles.secondaryButtonText}>
        {title}
      </Text>
    </Pressable>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.infoCard}>
      <Text style={styles.cardTitle}>
        {title}
      </Text>

      {children}
    </View>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>
        {label}
      </Text>

      <Text style={styles.infoValue}>
        {value}
      </Text>
    </View>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon: string;
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      style={styles.quickAction}
      onPress={onPress}
    >
      <Text style={styles.quickIcon}>
        {icon}
      </Text>

      <Text style={styles.quickLabel}>
        {label}
      </Text>
    </Pressable>
  );
}

function ReviewField({
  label,
  value,
  setValue,
  multiline = false,
  warning = false,
}: {
  label: string;
  value: string;
  setValue: (value: string) => void;
  multiline?: boolean;
  warning?: boolean;
}) {
  return (
    <View style={styles.reviewField}>
      <View style={styles.reviewLabelRow}>
        <Text style={styles.reviewLabel}>
          {label}
        </Text>

        <Text
          style={
            warning
              ? styles.checkWarning
              : styles.checkClear
          }
        >
          {warning
            ? '⚠ Please check'
            : '✓ Clear'}
        </Text>
      </View>

      <TextInput
        value={value}
        onChangeText={setValue}
        multiline={multiline}
        style={[
          styles.reviewInput,
          multiline &&
            styles.reviewTextArea,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F6F1',
  },

  pageContent: {
    padding: 22,
    paddingBottom: 60,
  },

  pageContentFlex: {
    flex: 1,
    padding: 22,
  },

  centerPage: {
    flex: 1,
    justifyContent: 'center',
  },

  brandBadge: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: '#E2F0EB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  bigEmoji: {
    fontSize: 28,
  },

  logo: {
    marginTop: 18,
    fontSize: 23,
    fontWeight: '800',
    color: '#2F6F63',
  },

  smallLogo: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2F6F63',
  },

  heroTitle: {
    marginTop: 26,
    fontSize: 39,
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

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backText: {
    color: '#2F6F63',
    fontSize: 16,
    fontWeight: '700',
  },

  pageTitle: {
    marginTop: 32,
    fontSize: 34,
    fontWeight: '800',
    color: '#1F2A27',
  },

  pageSubtitle: {
    marginTop: 10,
    fontSize: 16,
    lineHeight: 24,
    color: '#66736F',
  },

  petPhoto: {
    marginTop: 28,
    alignSelf: 'center',
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: '#E2F0EB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  petPhotoEmoji: {
    fontSize: 45,
  },

  sectionTitle: {
    marginTop: 30,
    marginBottom: 12,
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2A27',
  },

  label: {
    marginTop: 20,
    marginBottom: 8,
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
    minHeight: 86,
    textAlignVertical: 'top',
  },

  row: {
    flexDirection: 'row',
    gap: 10,
  },

  optionButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8E0DD',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },

  optionSelected: {
    backgroundColor: '#E2F0EB',
    borderColor: '#2F6F63',
  },

  optionText: {
    color: '#66736F',
    fontWeight: '700',
  },

  optionTextSelected: {
    color: '#2F6F63',
  },

  primaryButton: {
    marginTop: 30,
    backgroundColor: '#2F6F63',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  disabledButton: {
    opacity: 0.35,
  },

  secondaryButton: {
    marginTop: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },

  secondaryButtonText: {
    color: '#2F6F63',
    fontSize: 15,
    fontWeight: '700',
  },

  profileHeader: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 26,
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
    marginTop: 14,
    fontSize: 30,
    fontWeight: '800',
    color: '#1F2A27',
  },

  profileMeta: {
    marginTop: 5,
    fontSize: 15,
    color: '#66736F',
  },

  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E9E7',
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2A27',
  },

  infoRow: {
    marginTop: 15,
  },

  infoLabel: {
    fontSize: 12,
    color: '#88938F',
  },

  infoValue: {
    marginTop: 4,
    fontSize: 15,
    color: '#34433E',
    fontWeight: '600',
  },

  todayTitle: {
    fontSize: 27,
    fontWeight: '800',
    color: '#1F2A27',
  },

  todaySubtitle: {
    marginTop: 4,
    color: '#66736F',
  },

  smallAvatar: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: '#E2F0EB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  apiStatus: {
    marginTop: 14,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  apiStatusConnected: {
    backgroundColor: '#E2F0EB',
  },

  apiStatusDisconnected: {
    backgroundColor: '#F7ECE8',
  },

  apiDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },

  apiDotConnected: {
    backgroundColor: '#2F6F63',
  },

  apiDotDisconnected: {
    backgroundColor: '#A85845',
  },

  apiStatusText: {
    fontWeight: '800',
    fontSize: 13,
  },

  apiStatusTextConnected: {
    color: '#2F6F63',
  },

  apiStatusTextDisconnected: {
    color: '#A85845',
  },

  apiRefresh: {
    marginLeft: 'auto',
    fontSize: 11,
    color: '#88938F',
  },

  errorCard: {
    marginTop: 14,
    backgroundColor: '#F7ECE8',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E7C9C1',
  },

  errorTitle: {
    color: '#A85845',
    fontWeight: '800',
  },

  errorText: {
    marginTop: 5,
    color: '#8E5D52',
    lineHeight: 19,
  },

  petChip: {
    marginTop: 24,
    alignSelf: 'flex-start',
    backgroundColor: '#E2F0EB',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },

  petChipText: {
    color: '#2F6F63',
    fontWeight: '700',
  },

  successCard: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E9E7',
  },

  successIcon: {
    fontSize: 22,
    color: '#2F6F63',
  },

  cardStrong: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2A27',
  },

  cardMuted: {
    marginTop: 4,
    color: '#7A8783',
    lineHeight: 20,
  },

  aiCard: {
    backgroundColor: '#EDF6F2',
    padding: 20,
    borderRadius: 18,
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
    marginTop: 8,
    fontSize: 19,
    fontWeight: '800',
    color: '#1F2A27',
  },

  aiText: {
    marginTop: 8,
    color: '#5E6E68',
    lineHeight: 22,
  },

  outlineButton: {
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#2F6F63',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },

  outlineButtonText: {
    color: '#2F6F63',
    fontWeight: '800',
  },

  quickGrid: {
    flexDirection: 'row',
    gap: 8,
  },

  quickAction: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E9E7',
  },

  quickIcon: {
    fontSize: 22,
  },

  quickLabel: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '700',
    color: '#66736F',
  },

  processingPage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  processingTitle: {
    marginTop: 24,
    fontSize: 23,
    fontWeight: '800',
    textAlign: 'center',
    color: '#1F2A27',
  },

  processingStep: {
    marginTop: 10,
    color: '#2F6F63',
    fontWeight: '700',
    textAlign: 'center',
  },

  documentName: {
    marginTop: 24,
    color: '#66736F',
    textAlign: 'center',
  },

  documentMeta: {
    marginTop: 6,
    color: '#88938F',
  },

  safetyText: {
    marginTop: 24,
    color: '#88938F',
    textAlign: 'center',
    lineHeight: 20,
  },

  reviewHero: {
    marginTop: 28,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },

  reviewCheck: {
    fontSize: 26,
    color: '#2F6F63',
  },

  reviewHeroTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#1F2A27',
  },

  uploadSuccessCard: {
    marginTop: 20,
    backgroundColor: '#E2F0EB',
    borderRadius: 16,
    padding: 16,
  },

  uploadSuccessTitle: {
    color: '#2F6F63',
    fontWeight: '800',
  },

  uploadSuccessText: {
    marginTop: 6,
    color: '#34433E',
    fontWeight: '600',
  },

  uploadSuccessMeta: {
    marginTop: 4,
    color: '#66736F',
    fontSize: 12,
  },

  mockNotice: {
    marginTop: 14,
    backgroundColor: '#FFF5DD',
    borderRadius: 16,
    padding: 16,
  },

  mockNoticeTitle: {
    color: '#8A682E',
    fontWeight: '800',
  },

  mockNoticeText: {
    marginTop: 6,
    color: '#7A6845',
    lineHeight: 20,
  },

  reviewField: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E9E7',
    marginBottom: 12,
  },

  reviewLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },

  reviewLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#66736F',
  },

  checkClear: {
    fontSize: 12,
    color: '#2F6F63',
    fontWeight: '700',
  },

  checkWarning: {
    fontSize: 12,
    color: '#A56D1A',
    fontWeight: '700',
  },

  reviewInput: {
    marginTop: 10,
    fontSize: 16,
    color: '#1F2A27',
    padding: 0,
  },

  reviewTextArea: {
    minHeight: 62,
    textAlignVertical: 'top',
  },

  sourceText: {
    fontSize: 12,
    color: '#88938F',
  },

  warningText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#8A682E',
  },

  confirmCard: {
    marginTop: 28,
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E9E7',
  },

  confirmItem: {
    marginTop: 10,
    color: '#5E6E68',
    lineHeight: 20,
  },

  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 28,
    marginBottom: 30,
  },

  timelineTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2A27',
  },

  timelineEvent: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 20,
  },

  timelineDot: {
    marginTop: 6,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: '#2F6F63',
  },

  timelineBody: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 17,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E9E7',
  },

  timelineDate: {
    fontSize: 12,
    color: '#88938F',
  },

  timelineType: {
    marginTop: 7,
    fontSize: 12,
    fontWeight: '800',
    color: '#2F6F63',
    textTransform: 'uppercase',
  },

  timelineEventTitle: {
    marginTop: 8,
    fontSize: 17,
    fontWeight: '800',
    color: '#1F2A27',
  },

  timelineDetail: {
    marginTop: 7,
    lineHeight: 21,
    color: '#5E6E68',
  },

  timelineSource: {
    marginTop: 12,
    fontSize: 12,
    color: '#88938F',
  },

  emptyTimeline: {
    alignItems: 'center',
    paddingVertical: 40,
  },
});