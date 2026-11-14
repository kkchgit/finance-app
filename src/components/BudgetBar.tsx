import { StyleSheet, Text, View } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { formatCents } from '@/src/domain/money';
import { isOverBudget, progressRatio } from '@/src/domain/budgetCalculations';

type Props = {
  name: string;
  color: string;
  spentCents: number;
  limitCents: number;
};

export function BudgetBar({ name, color, spentCents, limitCents }: Props) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const over = isOverBudget(spentCents, limitCents);
  const ratio = progressRatio(spentCents, limitCents);
  const trackColor = colors.border;
  const fillColor = over ? colors.danger : color;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={styles.nameRow}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {name}
          </Text>
        </View>
        <Text style={[styles.amounts, { color: over ? colors.danger : colors.textSecondary }]}>
          {formatCents(spentCents)}
          {limitCents > 0 ? ` / ${formatCents(limitCents)}` : ''}
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: trackColor }]}>
        <View
          style={[
            styles.fill,
            {
              backgroundColor: fillColor,
              width: `${Math.round(ratio * 100)}%`,
            },
          ]}
        />
      </View>
      {over && limitCents > 0 ? (
        <Text style={[styles.over, { color: colors.danger }]}>
          Over by {formatCents(spentCents - limitCents)}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    flexShrink: 1,
  },
  amounts: {
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  over: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '500',
  },
});
