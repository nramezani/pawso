import { Text, View } from 'react-native';

import { usePawso } from '../context/PawsoContext';
import {
  Page,
  Header,
  OptionButton,
  PrimaryButton,
  SecondaryButton,
  ReviewField,
  styles,
} from '../components/ui';

const certaintyRows = [
  [
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'suspected', label: 'Suspected' },
  ],
  [
    { value: 'possible', label: 'Possible' },
    { value: 'rule_out', label: 'Rule out' },
  ],
  [
    { value: 'historical', label: 'Historical' },
    { value: 'unknown', label: 'Not stated' },
  ],
] as const;

export function ReviewScreen() {
  const {
    setScreen,
    databaseError,
    isConfirmingExtraction,
    petName,
    documentName,
    documentSize,
    currentDocumentId,
    currentExtractionId,
    visitDate,
    setVisitDate,
    clinic,
    setClinic,
    finding,
    setFinding,
    diagnosis,
    setDiagnosis,
    diagnosisCertainty,
    setDiagnosisCertainty,
    followUp,
    setFollowUp,
    extractedMedications,
    extractionWarnings,
    extractionModel,
    extractionPromptVersion,
    confirmExtraction,
  } = usePawso();

  return (
    <Page scroll keyboard>
      <Header back={() => setScreen('today')} title="Review record" />

      <View style={styles.reviewHero}>
        <Text style={styles.reviewCheck}>✓</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.reviewHeroTitle}>Ready for your review</Text>
          <Text style={styles.cardMuted}>
            Check the details below before anything is added to {petName}'s health history.
          </Text>
        </View>
      </View>

      <View style={styles.uploadSuccessCard}>
        <Text style={styles.uploadSuccessTitle}>File stored securely</Text>
        <Text style={styles.uploadSuccessText}>{documentName}</Text>
        {documentSize !== null ? (
          <Text style={styles.uploadSuccessMeta}>
            {(documentSize / 1024).toFixed(1)} KB · AI-assisted extraction
          </Text>
        ) : null}
        {currentDocumentId && currentExtractionId ? (
          <Text style={styles.uploadSuccessMeta}>
            Original file linked · owner confirmation required
          </Text>
        ) : null}
        {extractionModel ? (
          <Text style={styles.uploadSuccessMeta}>
            {extractionModel}
            {extractionPromptVersion ? ` · ${extractionPromptVersion}` : ''}
          </Text>
        ) : null}
      </View>

      {extractionWarnings.length > 0 ? (
        <View style={styles.mockNotice}>
          <Text style={styles.mockNoticeTitle}>Please check carefully</Text>
          {extractionWarnings.map((warning, index) => (
            <Text key={`${warning}-${index}`} style={styles.mockNoticeText}>
              • {warning}
            </Text>
          ))}
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Visit</Text>
      <ReviewField label="Visit date" value={visitDate} setValue={setVisitDate} />
      <ReviewField label="Clinic" value={clinic} setValue={setClinic} />

      <Text style={styles.sectionTitle}>Finding</Text>
      <ReviewField label="Finding" value={finding} setValue={setFinding} multiline />
      <Text style={styles.sourceText}>Source: uploaded veterinary record</Text>

      <Text style={styles.sectionTitle}>Assessment</Text>
      <ReviewField
        label="Diagnosis / assessment"
        value={diagnosis}
        setValue={setDiagnosis}
        multiline
        warning
      />

      <Text style={styles.reviewLabel}>How certain is the source record?</Text>
      {certaintyRows.map((row, rowIndex) => (
        <View key={rowIndex} style={[styles.row, { marginTop: 10 }]}>
          {row.map((option) => (
            <OptionButton
              key={option.value}
              title={option.label}
              selected={diagnosisCertainty === option.value}
              onPress={() => setDiagnosisCertainty(option.value)}
            />
          ))}
        </View>
      ))}
      <Text style={[styles.warningText, { marginTop: 12 }]}>
        Pawso keeps uncertainty visible and does not diagnose.
      </Text>

      {extractedMedications.length > 0 ? (
        <View style={[styles.infoCard, { marginTop: 22 }]}>
          <Text style={styles.cardStrong}>Medications mentioned in this file</Text>
          {extractedMedications.map((medication, index) => (
            <Text key={`${medication}-${index}`} style={styles.confirmItem}>
              • {medication}
            </Text>
          ))}
          <Text style={styles.cardMuted}>
            These are saved with the reviewed extraction only. Pawso will not create or change an active medication schedule automatically.
          </Text>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Suggested action</Text>
      <ReviewField
        label="Follow-up"
        value={followUp}
        setValue={setFollowUp}
        multiline
      />

      {databaseError ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Could not save health history</Text>
          <Text style={styles.errorText}>{databaseError}</Text>
        </View>
      ) : null}

      <View style={styles.confirmCard}>
        <Text style={styles.cardStrong}>When you confirm</Text>
        <Text style={styles.confirmItem}>✓ Visit and finding are added to the timeline</Text>
        <Text style={styles.confirmItem}>✓ Assessment certainty stays attached</Text>
        <Text style={styles.confirmItem}>✓ Follow-up is saved when present</Text>
        <Text style={styles.confirmItem}>✓ Original document stays linked as evidence</Text>
      </View>

      <PrimaryButton
        title={
          isConfirmingExtraction
            ? 'Saving health history…'
            : 'Confirm and add to health history'
        }
        disabled={isConfirmingExtraction}
        onPress={confirmExtraction}
      />
      <SecondaryButton title="Review later" onPress={() => setScreen('today')} />
    </Page>
  );
}
