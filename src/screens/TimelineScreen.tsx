import { useState } from 'react';
import { Text, View } from 'react-native';

import { usePawso } from '../context/PawsoContext';
import { parseLocalDateTime } from '../utils/dateTime';
import {
  ActivityBarChart,
  FilterChipRow,
  MetricStrip,
} from '../components/VisualSummary';
import {
  Page,
  Header,
  Label,
  Input,
  PrimaryButton,
  SecondaryButton,
  styles,
} from '../components/ui';

type TimelineFilter =
  | 'all'
  | 'Veterinary visit'
  | 'Owner observation'
  | 'Weight'
  | 'Lab result'
  | 'Follow-up';

export function TimelineScreen() {
  const [eventFilter, setEventFilter] = useState<TimelineFilter>('all');
  const [eventSearch, setEventSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [visibleCount, setVisibleCount] = useState(25);
  const {
    setScreen,
    canViewMedical,
    canManageMedical,
    petName,
    timelineEvents,
    petEmoji,
    pickVetRecord,
  } = usePawso();

  const countEvents = (type: string) =>
    timelineEvents.filter((event) => event.type === type).length;

  const typeFilteredEvents =
    eventFilter === 'all'
      ? timelineEvents
      : timelineEvents.filter((event) => event.type === eventFilter);
  const filteredEvents = typeFilteredEvents.filter((event) => {
    const query = eventSearch.trim().toLowerCase();
    const matchesSearch =
      !query || `${event.title} ${event.detail} ${event.source}`.toLowerCase().includes(query);
    const normalizedDate = /^\d{4}-\d{2}-\d{2}/.exec(event.date)?.[0] ?? '';
    const matchesStart = !startDate || !normalizedDate || normalizedDate >= startDate;
    const matchesEnd = !endDate || !normalizedDate || normalizedDate <= endDate;
    return matchesSearch && matchesStart && matchesEnd;
  });
  const visibleEvents = filteredEvents.slice(0, visibleCount);

  const activityBuckets = Array.from({ length: 6 }, (_, index) => {
    const month = new Date();
    month.setDate(1);
    month.setHours(0, 0, 0, 0);
    month.setMonth(month.getMonth() - (5 - index));

    const eventsThisMonth = timelineEvents.filter((event) => {
      const eventDate = parseLocalDateTime(event.date) ?? new Date(event.date);
      return (
        !Number.isNaN(eventDate.getTime()) &&
        eventDate.getFullYear() === month.getFullYear() &&
        eventDate.getMonth() === month.getMonth()
      );
    });

    const otherCount = eventsThisMonth.filter(
      (event) =>
        ![
          'Veterinary visit',
          'Owner observation',
          'Weight',
          'Lab result',
          'Follow-up',
        ].includes(event.type)
    ).length;

    return {
      key: `${month.getFullYear()}-${month.getMonth()}`,
      label: month.toLocaleDateString([], { month: 'short' }),
      values: {
        vet: eventsThisMonth.filter((event) => event.type === 'Veterinary visit')
          .length,
        observation: eventsThisMonth.filter(
          (event) => event.type === 'Owner observation'
        ).length,
        weight: eventsThisMonth.filter((event) => event.type === 'Weight').length,
        lab: eventsThisMonth.filter((event) => event.type === 'Lab result').length,
        followUp: eventsThisMonth.filter((event) => event.type === 'Follow-up')
          .length,
        other: otherCount,
      },
    };
  });
  const sixMonthEventCount = activityBuckets.reduce(
    (total, bucket) =>
      total + Object.values(bucket.values).reduce((sum, value) => sum + value, 0),
    0
  );
  const hasOtherEvents = activityBuckets.some((bucket) => bucket.values.other > 0);
  const timelineFilterOptions: {
    value: TimelineFilter;
    label: string;
    count: number;
  }[] = [{ value: 'all', label: 'All', count: timelineEvents.length }];

  for (const option of [
    { value: 'Veterinary visit', label: 'Vet' },
    { value: 'Owner observation', label: 'Notes' },
    { value: 'Weight', label: 'Weight' },
    { value: 'Lab result', label: 'Labs' },
    { value: 'Follow-up', label: 'Follow-ups' },
  ] as const) {
    const count = countEvents(option.value);
    if (count > 0) timelineFilterOptions.push({ ...option, count });
  }

  if (!canViewMedical) {
    return (
      <Page scroll>
        <Header back={() => setScreen('today')} title="Health Timeline" />
        <View style={styles.infoCard}>
          <Text style={styles.cardStrong}>Health history is private</Text>
          <Text style={styles.cardMuted}>
            Sitter access is limited to day-to-day care and medication instructions.
          </Text>
        </View>
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

      {timelineEvents.length > 0 ? (
        <MetricStrip
          accessibilityLabel={`${petName}'s health event overview`}
          items={[
            {
              label: 'Vet visits',
              value: countEvents('Veterinary visit'),
              icon: '🩺',
              tone: 'purple',
            },
            {
              label: 'Observations',
              value: countEvents('Owner observation'),
              icon: '👁',
              tone: 'green',
            },
            {
              label: 'Weights',
              value: countEvents('Weight'),
              icon: '⚖️',
              tone: 'neutral',
            },
            {
              label: 'Follow-ups',
              value: countEvents('Follow-up'),
              icon: '📅',
              tone: 'amber',
            },
          ]}
        />
      ) : null}

      {sixMonthEventCount >= 2 ? (
        <ActivityBarChart
          title="Health activity · 6 months"
          detail={`${sixMonthEventCount} recorded event${
            sixMonthEventCount === 1 ? '' : 's'
          } in this period.`}
          buckets={activityBuckets}
          series={[
            { key: 'vet', label: 'Vet visit', color: '#6F3C86' },
            { key: 'observation', label: 'Observation', color: '#2F6F63' },
            { key: 'weight', label: 'Weight', color: '#4E79A7' },
            { key: 'lab', label: 'Lab', color: '#9A4F3D' },
            { key: 'followUp', label: 'Follow-up', color: '#D98B2B' },
            ...(hasOtherEvents
              ? [{ key: 'other', label: 'Other', color: '#8A9691' }]
              : []),
          ]}
          note="This is a record-activity view, not a measure of health severity or improvement."
        />
      ) : null}

      {timelineEvents.length > 1 ? (
        <FilterChipRow
          label="Filter health history"
          selected={eventFilter}
          onSelect={setEventFilter}
          options={timelineFilterOptions}
        />
      ) : null}

      {timelineEvents.length > 0 ? (
        <View style={styles.infoCard}>
          <Label text="Search history" />
          <Input
            value={eventSearch}
            onChangeText={(value: string) => {
              setEventSearch(value);
              setVisibleCount(25);
            }}
            placeholder="Search titles, details, or source"
          />
          <View style={styles.medicationDoseRow}>
            <View style={{ flex: 1 }}>
              <Label text="From" />
              <Input
                value={startDate}
                onChangeText={setStartDate}
                placeholder="YYYY-MM-DD"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Label text="To" />
              <Input
                value={endDate}
                onChangeText={setEndDate}
                placeholder="YYYY-MM-DD"
              />
            </View>
          </View>
        </View>
      ) : null}

      {timelineEvents.length === 0 ? (
        <View style={styles.emptyTimeline}>
          <Text style={styles.bigEmoji}>📋</Text>

          <Text style={styles.cardStrong}>
            No health events yet
          </Text>
        </View>
      ) : filteredEvents.length === 0 ? (
        <View style={styles.emptyTimeline}>
          <Text style={styles.bigEmoji}>🔎</Text>
          <Text style={styles.cardStrong}>No matching events</Text>
          <Text style={styles.cardMuted}>
            Choose another filter to see more of {petName}&apos;s health history.
          </Text>
        </View>
      ) : (
        visibleEvents.map((event) => (
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

      {visibleEvents.length < filteredEvents.length ? (
        <SecondaryButton
          title={`Show ${Math.min(25, filteredEvents.length - visibleEvents.length)} more events`}
          onPress={() => setVisibleCount((count) => count + 25)}
        />
      ) : null}

      {canManageMedical ? (
        <PrimaryButton
          title="Upload Another Record"
          onPress={pickVetRecord}
        />
      ) : !canViewMedical ? (
        <View style={styles.infoCard}>
          <Text style={styles.cardStrong}>Medical timeline is limited</Text>
          <Text style={styles.cardMuted}>
            Sitter access does not include veterinary records or medical history.
          </Text>
        </View>
      ) : null}

      <SecondaryButton
        title="Back to Today"
        onPress={() => setScreen('today')}
      />
    </Page>
  );
}
