import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
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

export function Page({
  children,
  scroll = false,
  keyboard = false,
}: {
  children: ReactNode;
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

export function Header({
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

export function Label({
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

export function Input(props: any) {
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

export function OptionButton({
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

export function PrimaryButton({
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

export function SecondaryButton({
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

export function Card({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
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

export function Info({
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

export function QuickAction({
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

export function ReviewField({
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
            ? '⚠️ Please check'
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

export const styles = StyleSheet.create({
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

  cloudSavedCard: {
    alignSelf: 'center',
    marginBottom: 18,
    backgroundColor: '#E2F0EB',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
  },

  cloudSavedText: {
    color: '#2F6F63',
    fontWeight: '700',
    fontSize: 13,
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

  askHero: {
    marginTop: 28,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  askHeroIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#E2F0EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  askHeroEmoji: {
    fontSize: 26,
  },
  askPrivacyCard: {
    marginTop: 18,
    backgroundColor: '#F4F8F6',
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: '#DFEAE5',
  },
  askPrivacyTitle: {
    color: '#284D45',
    fontWeight: '800',
    marginBottom: 4,
  },
  askSuggestions: {
    gap: 9,
  },
  askSuggestionChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE6E2',
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 13,
  },
  askSuggestionText: {
    color: '#385B53',
    fontWeight: '700',
    lineHeight: 19,
  },
  askLoadingCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F4F8F6',
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  askAnswerCard: {
    marginTop: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#DCE6E2',
  },
  askAnswerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  askAnswerBadge: {
    color: '#2F6F63',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  askGroundedBadge: {
    color: '#59736C',
    fontSize: 11,
    fontWeight: '700',
  },
  askAnswerText: {
    color: '#26332F',
    fontSize: 16,
    lineHeight: 24,
  },
  askSourcesTitle: {
    marginTop: 18,
    marginBottom: 8,
    color: '#284D45',
    fontWeight: '800',
  },
  askSourceRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    marginBottom: 7,
  },
  askSourceIcon: {
    color: '#2F6F63',
    fontWeight: '900',
  },
  askSourceText: {
    flex: 1,
    color: '#5E6E69',
    lineHeight: 19,
  },
  askNoSources: {
    marginTop: 16,
    color: '#866B5E',
    lineHeight: 20,
  },
  askUrgentCard: {
    marginBottom: 14,
    backgroundColor: '#FFF1ED',
    borderRadius: 14,
    padding: 13,
    borderWidth: 1,
    borderColor: '#E8C1B5',
  },
  askUrgentTitle: {
    color: '#9A4F3D',
    fontWeight: '900',
    marginBottom: 4,
  },
  askUrgentText: {
    color: '#74483C',
    lineHeight: 20,
  },

  attentionCard: {
    backgroundColor: '#FFF4EE',
    borderRadius: 18,
    padding: 17,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E9C6B5',
  },
  attentionIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#F8DED2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attentionTitle: {
    color: '#A85845',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 3,
  },
  careNotes: {
    marginTop: 8,
    color: '#66736F',
    lineHeight: 20,
  },
  careListCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E9E7',
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  careListIcon: {
    fontSize: 19,
  },
  completeCareButton: {
    marginTop: 14,
    backgroundColor: '#2F6F63',
    borderRadius: 13,
    paddingVertical: 12,
    alignItems: 'center',
  },
  completeCareButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  medicationDueCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 17,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E9E7',
  },
  medicationDueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  medicationIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#E2F0EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  medicationActionRow: {
    marginTop: 15,
    flexDirection: 'row',
    gap: 10,
  },
  givenButton: {
    flex: 1,
    backgroundColor: '#2F6F63',
    paddingVertical: 12,
    borderRadius: 13,
    alignItems: 'center',
  },
  givenButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  skipDoseButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#D8E0DD',
    alignItems: 'center',
  },
  skipDoseButtonText: {
    color: '#66736F',
    fontWeight: '800',
  },
  medicationHero: {
    marginTop: 28,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  medicationHeroIcon: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: '#E2F0EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  medicationHeroEmoji: {
    fontSize: 25,
  },
  medicationInstructions: {
    marginTop: 12,
    color: '#66736F',
    lineHeight: 20,
  },
  scheduleWrap: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scheduleChip: {
    backgroundColor: '#E2F0EB',
    borderRadius: 14,
    paddingVertical: 7,
    paddingHorizontal: 11,
  },
  scheduleChipText: {
    color: '#2F6F63',
    fontSize: 12,
    fontWeight: '800',
  },
  medicationDoseRow: {
    flexDirection: 'row',
    gap: 12,
  },

  documentsHero: {
    marginTop: 28,
    marginBottom: 8,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  documentHeroIcon: {
    width: 54, height: 54, borderRadius: 16, backgroundColor: '#E2F0EB',
    alignItems: 'center', justifyContent: 'center',
  },
  documentHeroEmoji: { fontSize: 25 },
  documentsTitle: { fontSize: 23, fontWeight: '800', color: '#1F2A27' },
  documentsLoading: { paddingVertical: 50, alignItems: 'center', gap: 12 },
  emptyDocuments: {
    marginTop: 24, backgroundColor: '#FFFFFF', borderRadius: 18, padding: 28,
    alignItems: 'center', borderWidth: 1, borderColor: '#E5E9E7',
  },
  documentCard: {
    marginTop: 14, backgroundColor: '#FFFFFF', borderRadius: 18, padding: 17,
    borderWidth: 1, borderColor: '#E5E9E7',
  },
  documentCardHeader: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  documentIconBox: {
    width: 46, height: 46, borderRadius: 13, backgroundColor: '#F2F5F3',
    alignItems: 'center', justifyContent: 'center',
  },
  documentCardEmoji: { fontSize: 22 },
  documentCardTitle: { fontSize: 15, fontWeight: '800', color: '#1F2A27' },
  documentCardMeta: { marginTop: 5, fontSize: 12, color: '#88938F' },
  documentStatusRow: {
    marginTop: 15, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', gap: 10,
  },
  documentStatusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  documentStatusConfirmed: { backgroundColor: '#E2F0EB' },
  documentStatusPending: { backgroundColor: '#FFF5DD' },
  documentStatusText: { fontSize: 11, fontWeight: '800', textTransform: 'capitalize' },
  documentStatusTextConfirmed: { color: '#2F6F63' },
  documentStatusTextPending: { color: '#8A682E' },
  linkedEventsText: { flex: 1, textAlign: 'right', fontSize: 12, color: '#66736F' },
  documentOpenButton: {
    marginTop: 15, borderWidth: 1, borderColor: '#2F6F63', borderRadius: 13,
    paddingVertical: 12, alignItems: 'center',
  },
  documentOpenButtonDisabled: { opacity: 0.4 },
  documentOpenButtonText: { color: '#2F6F63', fontWeight: '800', fontSize: 13 },

  emptyTimeline: {
    alignItems: 'center',
    paddingVertical: 40,
  },

  petListCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E9E7',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  petListCardSelected: {
    borderColor: '#2F6F63',
    backgroundColor: '#F2F8F5',
  },
  petListAvatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#E2F0EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  petListRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  selectedPetBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2F6F63',
    backgroundColor: '#E2F0EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  petListChevron: {
    fontSize: 28,
    color: '#9AA5A1',
    lineHeight: 28,
  },
  todayScopeRow: {
    marginTop: 22,
    flexDirection: 'row',
    gap: 10,
  },
  todayScopeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D8E0DD',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 11,
    alignItems: 'center',
  },
  todayScopeButtonSelected: {
    borderColor: '#2F6F63',
    backgroundColor: '#E2F0EB',
  },
  todayScopeText: {
    color: '#66736F',
    fontWeight: '700',
  },
  todayScopeTextSelected: {
    color: '#2F6F63',
    fontWeight: '800',
  },
  allPetsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E9E7',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  allPetsCardAttention: {
    borderColor: '#E9C6B5',
    backgroundColor: '#FFF9F6',
  },
  allPetsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  allPetsMeta: {
    marginTop: 6,
    color: '#88938F',
    fontSize: 12,
  },

  reminderHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reminderToggleButton: {
    borderWidth: 1,
    borderColor: '#B9C8C1',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  reminderToggleButtonEnabled: {
    backgroundColor: '#1F6B57',
    borderColor: '#1F6B57',
  },
  reminderToggleText: {
    color: '#48615A',
    fontSize: 13,
    fontWeight: '700',
  },
  reminderToggleTextEnabled: {
    color: '#FFFFFF',
  },
  reminderFinePrint: {
    marginTop: 10,
    color: '#73837D',
    fontSize: 12,
    lineHeight: 17,
  },

  inviteCodeText: {
    marginTop: 8,
    marginBottom: 8,
    fontSize: 16,
    fontWeight: '800',
    color: '#1F6B57',
    letterSpacing: 0.4,
  },
});