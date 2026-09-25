import { ActivityIndicator, Text, View } from 'react-native';

import { usePawso } from '../context/PawsoContext';
import {
  Page,
  styles,
} from '../components/ui';

export function ProcessingScreen() {
  const {
    documentName,
    documentSize,
  } = usePawso();

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
