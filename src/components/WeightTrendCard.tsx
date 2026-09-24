import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { TimelineEvent } from '../types';

type WeightPoint = {
  id: string;
  date: Date;
  dateLabel: string;
  value: number;
};

function parseWeight(value: string) {
  const match = /(\d+(?:[.,]\d+)?)\s*kg\b/i.exec(value);
  if (!match) return null;

  const parsed = Number(match[1].replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseEventDate(value: string) {
  const localDate = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (localDate) {
    const date = new Date(
      Number(localDate[1]),
      Number(localDate[2]) - 1,
      Number(localDate[3])
    );

    if (!Number.isNaN(date.getTime())) return date;
  }

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : new Date(timestamp);
}

function shortDate(date: Date) {
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatWeight(value: number) {
  return `${Number(value.toFixed(2))} kg`;
}

function getWeightPoints(timelineEvents: TimelineEvent[], currentWeight: string) {
  const points = timelineEvents
    .filter((event) => event.type.toLowerCase() === 'weight')
    .map((event) => {
      const value = parseWeight(`${event.title} ${event.detail}`);
      const date = parseEventDate(event.date);
      if (value === null || !date) return null;

      return {
        id: event.id,
        date,
        dateLabel: shortDate(date),
        value,
      } satisfies WeightPoint;
    })
    .filter((point): point is WeightPoint => point !== null)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (points.length === 0) {
    const profileWeight = parseWeight(currentWeight);
    if (profileWeight !== null) {
      const today = new Date();
      points.push({
        id: 'current-profile-weight',
        date: today,
        dateLabel: 'Current',
        value: profileWeight,
      });
    }
  }

  return points.slice(-7);
}

export function WeightTrendCard({
  timelineEvents,
  currentWeight,
  petName,
  onRecordWeight,
}: {
  timelineEvents: TimelineEvent[];
  currentWeight: string;
  petName: string;
  onRecordWeight?: () => void;
}) {
  const points = getWeightPoints(timelineEvents, currentWeight);

  if (points.length === 0) {
    return (
      <View style={chartStyles.card}>
        <Text style={chartStyles.title}>Weight trend</Text>
        <Text style={chartStyles.emptyTitle}>No measurements yet</Text>
        <Text style={chartStyles.muted}>
          Record {petName}&apos;s weight to start a simple history you can share with your vet.
        </Text>
        {onRecordWeight ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Record ${petName}'s weight`}
            style={chartStyles.action}
            onPress={onRecordWeight}
          >
            <Text style={chartStyles.actionText}>+ Record weight</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  const values = points.map((point) => point.value);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const range = maximum - minimum;
  const first = points[0];
  const latest = points[points.length - 1];
  const change = latest.value - first.value;
  const changeLabel =
    points.length < 2
      ? 'Add another measurement to see change'
      : `${change > 0 ? '+' : ''}${Number(change.toFixed(2))} kg since ${first.dateLabel}`;
  const accessibilitySummary = points
    .map((point) => `${point.dateLabel}, ${formatWeight(point.value)}`)
    .join('; ');

  return (
    <View style={chartStyles.card}>
      <View style={chartStyles.headingRow}>
        <View>
          <Text style={chartStyles.title}>Weight trend</Text>
          <Text style={chartStyles.current}>{formatWeight(latest.value)}</Text>
        </View>
        <View style={chartStyles.changeBadge}>
          <Text style={chartStyles.changeText}>{changeLabel}</Text>
        </View>
      </View>

      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={`${petName}'s weight history. ${accessibilitySummary}`}
        style={chartStyles.chart}
      >
        {points.map((point, index) => {
          const normalized = range === 0 ? 0.5 : (point.value - minimum) / range;
          const barHeight = 32 + normalized * 58;
          const isLatest = index === points.length - 1;

          return (
            <View key={point.id} style={chartStyles.column}>
              <Text style={[chartStyles.value, isLatest && chartStyles.valueLatest]}>
                {Number(point.value.toFixed(1))}
              </Text>
              <View style={chartStyles.barArea}>
                <View
                  style={[
                    chartStyles.bar,
                    { height: barHeight },
                    isLatest && chartStyles.barLatest,
                  ]}
                />
              </View>
              <Text style={[chartStyles.date, isLatest && chartStyles.dateLatest]}>
                {point.dateLabel}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={chartStyles.footerRow}>
        <Text style={chartStyles.range}>
          Range {formatWeight(minimum)}–{formatWeight(maximum)}
        </Text>
        {onRecordWeight ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Record a new weight for ${petName}`}
            style={chartStyles.linkAction}
            onPress={onRecordWeight}
          >
            <Text style={chartStyles.link}>Record new</Text>
          </Pressable>
        ) : null}
      </View>

      <Text style={chartStyles.note}>
        Pawso shows the pattern only—it does not interpret whether a change is healthy.
      </Text>
    </View>
  );
}

const chartStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E9E7',
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2A27',
  },
  current: {
    marginTop: 4,
    fontSize: 24,
    fontWeight: '800',
    color: '#53166F',
  },
  changeBadge: {
    flexShrink: 1,
    maxWidth: '58%',
    backgroundColor: '#F0E7F5',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  changeText: {
    color: '#53166F',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    textAlign: 'right',
  },
  chart: {
    height: 132,
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 7,
  },
  column: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
  },
  value: {
    color: '#66736F',
    fontSize: 10,
    fontWeight: '700',
  },
  valueLatest: {
    color: '#53166F',
  },
  barArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingVertical: 4,
  },
  bar: {
    width: 13,
    minHeight: 10,
    borderRadius: 8,
    backgroundColor: '#9CCFC0',
  },
  barLatest: {
    width: 15,
    backgroundColor: '#53166F',
  },
  date: {
    minHeight: 18,
    color: '#66736F',
    fontSize: 9,
    textAlign: 'center',
  },
  dateLatest: {
    color: '#53166F',
    fontWeight: '800',
  },
  footerRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  range: {
    flex: 1,
    color: '#56645F',
    fontSize: 12,
  },
  link: {
    color: '#53166F',
    fontSize: 13,
    fontWeight: '800',
  },
  linkAction: {
    minHeight: 44,
    minWidth: 88,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  note: {
    marginTop: 10,
    color: '#66736F',
    fontSize: 11,
    lineHeight: 16,
  },
  emptyTitle: {
    marginTop: 14,
    color: '#34433E',
    fontSize: 16,
    fontWeight: '700',
  },
  muted: {
    marginTop: 6,
    color: '#56645F',
    lineHeight: 20,
  },
  action: {
    minHeight: 44,
    marginTop: 12,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  actionText: {
    color: '#53166F',
    fontWeight: '800',
  },
});
