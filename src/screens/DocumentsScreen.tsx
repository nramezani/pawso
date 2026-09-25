import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';

import { usePawso } from '../context/PawsoContext';
import { FilterChipRow, MetricStrip } from '../components/VisualSummary';
import {
  Page,
  Header,
  Label,
  Input,
  SecondaryButton,
  styles,
} from '../components/ui';

type DocumentFilter = 'all' | 'review_required' | 'confirmed';

export function DocumentsScreen() {
  const [documentFilter, setDocumentFilter] = useState<DocumentFilter>('all');
  const [documentSearch, setDocumentSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const {
    setScreen,
    canViewMedical,
    canManageMedical,
    petName,
    petDocuments,
    archivedPetDocuments,
    documentsLoading,
    documentsError,
    openingDocumentId,
    deletingDocumentId,
    archiveDocument,
    restoreDocument,
    deleteDocumentPermanently,
    resumeExtractionReview,
    openOriginalDocument,
    formatDocumentDate,
    formatDocumentSize,
    pickVetRecord,
  } = usePawso();

  const confirmedDocuments = petDocuments.filter(
    (document) => document.status === 'confirmed'
  ).length;
  const documentsNeedingReview = petDocuments.filter(
    (document) => document.status === 'review_required'
  ).length;
  const linkedTimelineEvents = petDocuments.reduce(
    (total, document) => total + document.linked_events,
    0
  );
  const statusFilteredDocuments =
    documentFilter === 'all'
      ? petDocuments
      : petDocuments.filter((document) => document.status === documentFilter);
  const filteredDocuments = statusFilteredDocuments.filter((document) =>
    document.filename.toLowerCase().includes(documentSearch.trim().toLowerCase())
  );
  const documentFilterOptions: {
    value: DocumentFilter;
    label: string;
    count: number;
  }[] = [{ value: 'all', label: 'All', count: petDocuments.length }];
  if (documentsNeedingReview > 0) {
    documentFilterOptions.push({
      value: 'review_required',
      label: 'Needs review',
      count: documentsNeedingReview,
    });
  }
  if (confirmedDocuments > 0) {
    documentFilterOptions.push({
      value: 'confirmed',
      label: 'Confirmed',
      count: confirmedDocuments,
    });
  }

return (
      <Page scroll>
        <Header back={() => setScreen('today')} title="Medical Records" />

        <View style={styles.documentsHero}>
          <View style={styles.documentHeroIcon}>
            <Text style={styles.documentHeroEmoji}>📄</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.documentsTitle}>{petName}'s documents</Text>
            <Text style={styles.cardMuted}>
              Original veterinary records are stored privately and linked to the health history they created.
            </Text>
          </View>
        </View>

        {canViewMedical && petDocuments.length > 1 ? (
          <MetricStrip
            accessibilityLabel={`${petName}'s document library overview`}
            items={[
              {
                label: 'Records',
                value: petDocuments.length,
                icon: '📄',
                tone: 'neutral',
              },
              {
                label: 'Confirmed',
                value: confirmedDocuments,
                icon: '✓',
                tone: 'green',
              },
              {
                label: 'Review needed',
                value: documentsNeedingReview,
                icon: '!',
                tone: documentsNeedingReview > 0 ? 'amber' : 'neutral',
              },
              {
                label: 'Timeline links',
                value: linkedTimelineEvents,
                icon: '↗',
                tone: 'purple',
              },
            ]}
          />
        ) : null}

        {canManageMedical ? (
          <Pressable
            style={styles.outlineButton}
            onPress={pickVetRecord}
            accessibilityRole="button"
            accessibilityLabel="Upload veterinary record"
          >
            <Text style={styles.outlineButtonText}>＋ Upload veterinary record</Text>
          </Pressable>
        ) : canViewMedical ? (
          <View style={styles.infoCard}>
            <Text style={styles.cardStrong}>Medical records are read-only</Text>
            <Text style={styles.cardMuted}>
              Caregivers can review confirmed records; only the owner can upload or change them.
            </Text>
          </View>
        ) : (
          <View style={styles.infoCard}>
            <Text style={styles.cardStrong}>Medical records are private</Text>
            <Text style={styles.cardMuted}>
              Sitter access is limited to day-to-day care and medication instructions.
            </Text>
          </View>
        )}

        {canViewMedical && petDocuments.length > 0 ? (
          <>
            <Label text="Search records" />
            <Input
              value={documentSearch}
              onChangeText={setDocumentSearch}
              placeholder="Search by filename"
              autoCorrect={false}
            />
            <FilterChipRow
              label="Filter medical records"
              selected={documentFilter}
              onSelect={setDocumentFilter}
              options={documentFilterOptions}
            />
          </>
        ) : null}

        {documentsError !== '' && (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Medical records error</Text>
            <Text style={styles.errorText}>{documentsError}</Text>
          </View>
        )}

        {!canViewMedical ? null : documentsLoading ? (
          <View style={styles.documentsLoading}>
            <ActivityIndicator size="large" color="#2F6F63" />
            <Text style={styles.cardMuted}>Loading medical records…</Text>
          </View>
        ) : petDocuments.length === 0 ? (
          <View style={styles.emptyDocuments}>
            <Text style={styles.bigEmoji}>📁</Text>
            <Text style={styles.cardStrong}>No medical records yet</Text>
            <Text style={styles.cardMuted}>
              {canManageMedical
                ? `Upload a veterinary PDF or image to start ${petName}'s document library.`
                : 'The household owner has not added any confirmed records yet.'}
            </Text>
          </View>
        ) : filteredDocuments.length === 0 ? (
          <View style={styles.emptyDocuments}>
            <Text style={styles.bigEmoji}>🔎</Text>
            <Text style={styles.cardStrong}>No matching records</Text>
            <Text style={styles.cardMuted}>
              Choose another filter to see more of {petName}&apos;s document library.
            </Text>
          </View>
        ) : (
          filteredDocuments.map((document) => (
            <View key={document.id} style={styles.documentCard}>
              <View style={styles.documentCardHeader}>
                <View style={styles.documentIconBox}>
                  <Text style={styles.documentCardEmoji}>
                    {document.content_type?.includes('pdf') ? '📕' : '🖼️'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.documentCardTitle} numberOfLines={2}>
                    {document.filename}
                  </Text>
                  <Text style={styles.documentCardMeta}>
                    {formatDocumentDate(document.created_at)} · {formatDocumentSize(document.size_bytes)}
                  </Text>
                </View>
              </View>

              <View style={styles.documentStatusRow}>
                <View style={[
                  styles.documentStatusBadge,
                  document.status === 'confirmed'
                    ? styles.documentStatusConfirmed
                    : styles.documentStatusPending,
                ]}>
                  <Text style={[
                    styles.documentStatusText,
                    document.status === 'confirmed'
                      ? styles.documentStatusTextConfirmed
                      : styles.documentStatusTextPending,
                  ]}>
                    {document.status === 'confirmed'
                      ? '✓ Confirmed'
                      : document.status.replaceAll('_', ' ')}
                  </Text>
                </View>

                <Text style={styles.linkedEventsText}>
                  {document.linked_events} {document.linked_events === 1 ? 'timeline event' : 'timeline events'}
                </Text>
              </View>

              <Pressable
                style={[
                  styles.documentOpenButton,
                  (!document.storage_path || openingDocumentId === document.id) &&
                    styles.documentOpenButtonDisabled,
                ]}
                disabled={!document.storage_path || openingDocumentId === document.id}
                accessibilityRole="button"
                accessibilityLabel={`Open ${document.filename}`}
                accessibilityState={{
                  disabled: !document.storage_path || openingDocumentId === document.id,
                }}
                onPress={() => openOriginalDocument(document)}
              >
                <Text style={styles.documentOpenButtonText}>
                  {openingDocumentId === document.id
                    ? 'Opening secure file…'
                    : document.storage_path
                    ? 'Open original securely'
                    : 'Original file unavailable'}
                </Text>
              </Pressable>

              {document.status === 'review_required' && canManageMedical ? (
                <Pressable
                  style={styles.outlineButton}
                  accessibilityRole="button"
                  accessibilityLabel={`Continue reviewing ${document.filename}`}
                  onPress={() => resumeExtractionReview(document)}
                >
                  <Text style={styles.outlineButtonText}>Continue AI review</Text>
                </Pressable>
              ) : null}

              {canManageMedical ? (
                <View style={styles.compactActionRow}>
                  <Pressable
                    style={styles.compactActionButton}
                    accessibilityRole="button"
                    accessibilityLabel={`Archive ${document.filename}`}
                    disabled={deletingDocumentId === document.id}
                    onPress={() => archiveDocument(document)}
                  >
                    <Text style={styles.compactActionText}>Archive</Text>
                  </Pressable>
                  <Pressable
                    style={styles.compactActionButton}
                    accessibilityRole="button"
                    accessibilityLabel={`Delete ${document.filename} permanently`}
                    disabled={deletingDocumentId === document.id}
                    onPress={() =>
                      Alert.alert(
                        'Delete document permanently?',
                        'The original file, AI extraction, and document record will be deleted. Timeline items already confirmed remain but lose their document link.',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete permanently',
                            style: 'destructive',
                            onPress: () => deleteDocumentPermanently(document),
                          },
                        ]
                      )
                    }
                  >
                    <Text style={styles.compactActionText}>
                      {deletingDocumentId === document.id ? 'Working…' : 'Delete'}
                    </Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          ))
        )}

        {canManageMedical && archivedPetDocuments.length > 0 ? (
          <View style={{ marginTop: 12 }}>
            <Pressable
              style={styles.outlineButton}
              accessibilityRole="button"
              accessibilityLabel={`${showArchived ? 'Hide' : 'Show'} archived documents`}
              accessibilityState={{ expanded: showArchived }}
              onPress={() => setShowArchived((value) => !value)}
            >
              <Text style={styles.outlineButtonText}>
                {showArchived ? 'Hide' : 'Show'} archived records ({archivedPetDocuments.length})
              </Text>
            </Pressable>
            {showArchived
              ? archivedPetDocuments.map((document) => (
                  <View key={`archived-${document.id}`} style={styles.documentCard}>
                    <Text style={styles.documentCardTitle}>{document.filename}</Text>
                    <Text style={styles.documentCardMeta}>
                      Archived · {formatDocumentDate(document.created_at)}
                    </Text>
                    <View style={styles.compactActionRow}>
                      <Pressable
                        style={styles.compactActionButton}
                        accessibilityRole="button"
                        accessibilityLabel={`Restore ${document.filename}`}
                        disabled={deletingDocumentId === document.id}
                        accessibilityState={{ disabled: deletingDocumentId === document.id }}
                        onPress={() => restoreDocument(document)}
                      >
                        <Text style={styles.compactActionText}>Restore</Text>
                      </Pressable>
                      <Pressable
                        style={styles.compactActionButton}
                        accessibilityRole="button"
                        accessibilityLabel={`Delete ${document.filename} permanently`}
                        disabled={deletingDocumentId === document.id}
                        accessibilityState={{ disabled: deletingDocumentId === document.id }}
                        onPress={() =>
                          Alert.alert(
                            'Delete archived document?',
                            'The original file and document record will be permanently removed. This cannot be undone.',
                            [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Delete permanently',
                                style: 'destructive',
                                onPress: () => deleteDocumentPermanently(document),
                              },
                            ]
                          )
                        }
                      >
                        <Text style={styles.compactActionText}>Delete</Text>
                      </Pressable>
                    </View>
                  </View>
                ))
              : null}
          </View>
        ) : null}

        <SecondaryButton title="Back to Today" onPress={() => setScreen('today')} />
      </Page>
    );
}
