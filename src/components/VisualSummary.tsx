import { StyleSheet, Text, View } from 'react-native';

export type MetricTone = 'purple' | 'green' | 'amber' | 'neutral';

export type MetricItem = {
  label: string;
  value: number | string;
  icon?: string;
  tone?: MetricTone;
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
});
