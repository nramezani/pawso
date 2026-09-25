import { Text, View } from 'react-native';

import { pawsoColor, styles } from './ui';

export type NumericTrendPoint = {
  id: string;
  label: string;
  value: number;
};

export function NumericTrendCard({
  title,
  detail,
  points,
  unit = '',
  minimum,
  maximum,
  note,
}: {
  title: string;
  detail: string;
  points: NumericTrendPoint[];
  unit?: string;
  minimum?: number | null;
  maximum?: number | null;
  note: string;
}) {
  if (points.length === 0) return null;
  const values = points.map((point) => point.value);
  const observedMinimum = Math.min(...values, minimum ?? Infinity);
  const observedMaximum = Math.max(...values, maximum ?? -Infinity);
  const floor = Number.isFinite(observedMinimum) ? observedMinimum : 0;
  const ceiling = Number.isFinite(observedMaximum) ? observedMaximum : 1;
  const range = Math.max(ceiling - floor, Math.abs(ceiling) * 0.1, 1);
  const latest = points[points.length - 1];
  const accessibility = points
    .map((point) => `${point.label}: ${point.value}${unit ? ` ${unit}` : ''}`)
    .join('; ');

  return (
    <View style={styles.infoCard}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardMuted}>{detail}</Text>
      <Text style={[styles.profileName, { marginTop: 12, textAlign: 'left' }]}>
        {latest.value}{unit ? ` ${unit}` : ''}
      </Text>

      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={`${title}. ${accessibility}`}
        style={{
          height: 142,
          marginTop: 14,
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: 7,
        }}
      >
        {points.map((point, index) => {
          const height = 24 + ((point.value - floor) / range) * 72;
          const isLatest = index === points.length - 1;
          return (
            <View key={point.id} style={{ flex: 1, height: '100%', alignItems: 'center' }}>
              <Text style={styles.chartValueLabel}>{Number(point.value.toFixed(2))}</Text>
              <View style={{ flex: 1, justifyContent: 'flex-end', paddingVertical: 4 }}>
                <View
                  style={{
                    width: isLatest ? 16 : 13,
                    minHeight: 8,
                    height,
                    borderRadius: 8,
                    backgroundColor: isLatest
                      ? pawsoColor('#53166F', '#D7A5EF')
                      : pawsoColor('#9CCFC0', '#68A895'),
                  }}
                />
              </View>
              <Text style={styles.chartAxisLabel} numberOfLines={1}>
                {point.label}
              </Text>
            </View>
          );
        })}
      </View>

      {minimum !== null && minimum !== undefined || maximum !== null && maximum !== undefined ? (
        <Text style={styles.reminderFinePrint}>
          Reference range: {minimum ?? '—'}–{maximum ?? '—'}{unit ? ` ${unit}` : ''}
        </Text>
      ) : null}
      <Text style={styles.reminderFinePrint}>{note}</Text>
    </View>
  );
}
