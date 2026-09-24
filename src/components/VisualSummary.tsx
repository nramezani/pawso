import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export type MetricTone = 'purple' | 'green' | 'amber' | 'neutral';

export type MetricItem = {
  label: string;
  value: number | string;
  icon?: string;
  tone?: MetricTone;
};

export type ActivitySeries = {
  key: string;
  label: string;
  color: string;
};

export type ActivityBucket = {
  key: string;
  label: string;
  values: Record<string, number>;
};

export function MetricStrip({
  items,
  accessibilityLabel,
}: {
  items: MetricItem[];
  accessibilityLabel?: string;
}) {
  const spokenLabel =
    accessibilityLabel ??
    items.map((item) => `${item.label}: ${item.value}`).join(', ');

  return (
    <View
      accessible
      accessibilityLabel={spokenLabel}
      style={summaryStyles.metricStrip}
    >
      {items.map((item) => (
        <View
          key={item.label}
          style={[
            summaryStyles.metricTile,
            item.tone === 'purple' && summaryStyles.metricPurple,
            item.tone === 'green' && summaryStyles.metricGreen,
            item.tone === 'amber' && summaryStyles.metricAmber,
          ]}
        >
          {item.icon ? <Text style={summaryStyles.metricIcon}>{item.icon}</Text> : null}
          <Text style={summaryStyles.metricValue}>{item.value}</Text>
          <Text style={summaryStyles.metricLabel}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

export function ProgressOverview({
  title,
  completed,
  total,
  detail,
  breakdown = [],
}: {
  title: string;
  completed: number;
  total: number;
  detail: string;
  breakdown?: MetricItem[];
}) {
  const safeTotal = Math.max(0, total);
  const safeCompleted = Math.min(Math.max(0, completed), safeTotal);
  const percentage =
    safeTotal === 0 ? 0 : Math.round((safeCompleted / safeTotal) * 100);
  const breakdownSummary = breakdown
    .map((item) => `${item.label}: ${item.value}`)
    .join(', ');

  return (
    <View
      accessible
      accessibilityLabel={`${title}. ${safeCompleted} of ${safeTotal}, ${percentage} percent. ${detail}${
        breakdownSummary ? ` ${breakdownSummary}.` : ''
      }`}
      style={summaryStyles.progressCard}
    >
      <View style={summaryStyles.progressHeading}>
        <View style={summaryStyles.progressCopy}>
          <Text style={summaryStyles.progressTitle}>{title}</Text>
          <Text style={summaryStyles.progressDetail}>{detail}</Text>
        </View>
        <Text style={summaryStyles.progressPercent}>{percentage}%</Text>
      </View>

      <View style={summaryStyles.progressTrack}>
        <View style={[summaryStyles.progressFill, { width: `${percentage}%` }]} />
      </View>

      {breakdown.length > 0 ? <MetricStrip items={breakdown} /> : null}
    </View>
  );
}

export function ActivityBarChart({
  title,
  detail,
  buckets,
  series,
  note,
}: {
  title: string;
  detail: string;
  buckets: ActivityBucket[];
  series: ActivitySeries[];
  note?: string;
}) {
  const totals = buckets.map((bucket) =>
    series.reduce(
      (sum, item) => sum + Math.max(0, bucket.values[item.key] ?? 0),
      0
    )
  );
  const maximum = Math.max(1, ...totals);

  return (
    <View style={summaryStyles.activityCard}>
      <Text style={summaryStyles.activityTitle}>{title}</Text>
      <Text style={summaryStyles.activityDetail}>{detail}</Text>

      <View style={summaryStyles.activityChart}>
        {buckets.map((bucket, bucketIndex) => {
          const total = totals[bucketIndex];
          const spokenSegments = series
            .map(
              (item) =>
                `${item.label}: ${Math.max(0, bucket.values[item.key] ?? 0)}`
            )
            .join(', ');

          return (
            <View
              key={bucket.key}
              accessible
              accessibilityRole="image"
              accessibilityLabel={`${bucket.label}. Total ${total}. ${spokenSegments}.`}
              style={summaryStyles.activityColumn}
            >
              <Text style={summaryStyles.activityValue}>{total}</Text>
              <View style={summaryStyles.activityBarArea}>
                <View style={summaryStyles.activityBarStack}>
                  {series.map((item) => {
                    const value = Math.max(0, bucket.values[item.key] ?? 0);
                    if (value === 0) return null;

                    return (
                      <View
                        key={item.key}
                        style={{
                          height: Math.max(4, (value / maximum) * 76),
                          backgroundColor: item.color,
                        }}
                      />
                    );
                  })}
                </View>
              </View>
              <Text style={summaryStyles.activityLabel} numberOfLines={1}>
                {bucket.label}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={summaryStyles.activityLegend}>
        {series.map((item) => (
          <View key={item.key} style={summaryStyles.activityLegendItem}>
            <View
              style={[
                summaryStyles.activityLegendDot,
                { backgroundColor: item.color },
              ]}
            />
            <Text style={summaryStyles.activityLegendText}>{item.label}</Text>
          </View>
        ))}
      </View>

      {note ? <Text style={summaryStyles.activityNote}>{note}</Text> : null}
    </View>
  );
}

export function FilterChipRow<T extends string>({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: Array<{ value: T; label: string; count?: number }>;
  selected: T;
  onSelect: (value: T) => void;
}) {
  return (
    <View style={summaryStyles.filterGroup}>
      <Text style={summaryStyles.filterLabel}>{label}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={summaryStyles.filterRow}
      >
        {options.map((option) => {
          const isSelected = option.value === selected;
          const text =
            option.count === undefined
              ? option.label
              : `${option.label} ${option.count}`;

          return (
            <Pressable
              key={option.value}
              accessibilityRole="tab"
              accessibilityLabel={text}
              accessibilityState={{ selected: isSelected }}
              style={[
                summaryStyles.filterChip,
                isSelected && summaryStyles.filterChipSelected,
              ]}
              onPress={() => onSelect(option.value)}
            >
              <Text
                style={[
                  summaryStyles.filterChipText,
                  isSelected && summaryStyles.filterChipTextSelected,
                ]}
              >
                {text}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const summaryStyles = StyleSheet.create({
  metricStrip: {
    marginTop: 14,
    marginBottom: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricTile: {
    minWidth: 76,
    flexGrow: 1,
    flexBasis: '21%',
    minHeight: 82,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#F1F3F2',
  },
  metricPurple: {
    backgroundColor: '#F0E7F5',
  },
  metricGreen: {
    backgroundColor: '#E2F0EB',
  },
  metricAmber: {
    backgroundColor: '#FFF5DD',
  },
  metricIcon: {
    marginBottom: 3,
    fontSize: 16,
  },
  metricValue: {
    color: '#1F2A27',
    fontSize: 20,
    fontWeight: '800',
  },
  metricLabel: {
    marginTop: 3,
    color: '#56645F',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  progressCard: {
    marginBottom: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E9E7',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  progressHeading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  progressCopy: {
    flex: 1,
  },
  progressTitle: {
    color: '#1F2A27',
    fontSize: 17,
    fontWeight: '800',
  },
  progressDetail: {
    marginTop: 4,
    color: '#56645F',
    lineHeight: 19,
  },
  progressPercent: {
    color: '#53166F',
    fontSize: 22,
    fontWeight: '800',
  },
  progressTrack: {
    height: 10,
    marginTop: 16,
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: '#EAEDEA',
  },
  progressFill: {
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#53166F',
  },
  activityCard: {
    marginBottom: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E9E7',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  activityTitle: {
    color: '#1F2A27',
    fontSize: 17,
    fontWeight: '800',
  },
  activityDetail: {
    marginTop: 4,
    color: '#56645F',
    lineHeight: 19,
  },
  activityChart: {
    height: 128,
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 7,
  },
  activityColumn: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
  },
  activityValue: {
    color: '#56645F',
    fontSize: 10,
    fontWeight: '800',
  },
  activityBarArea: {
    flex: 1,
    width: '72%',
    minWidth: 16,
    maxWidth: 34,
    justifyContent: 'flex-end',
  },
  activityBarStack: {
    overflow: 'hidden',
    borderRadius: 7,
    backgroundColor: '#EDF0EE',
  },
  activityLabel: {
    width: '100%',
    marginTop: 6,
    color: '#66736F',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  activityLegend: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  activityLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activityLegendDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  activityLegendText: {
    color: '#56645F',
    fontSize: 12,
    fontWeight: '700',
  },
  activityNote: {
    marginTop: 12,
    color: '#66736F',
    fontSize: 11,
    lineHeight: 16,
  },
  filterGroup: {
    marginBottom: 14,
  },
  filterLabel: {
    marginBottom: 8,
    color: '#56645F',
    fontSize: 12,
    fontWeight: '800',
  },
  filterRow: {
    gap: 8,
    paddingRight: 12,
  },
  filterChip: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#D7DEDA',
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
  },
  filterChipSelected: {
    borderColor: '#53166F',
    backgroundColor: '#53166F',
  },
  filterChipText: {
    color: '#43514C',
    fontSize: 13,
    fontWeight: '700',
  },
  filterChipTextSelected: {
    color: '#FFFFFF',
  },
});
