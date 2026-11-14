import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { BudgetBar } from '@/src/components/BudgetBar';
import { EmptyState } from '@/src/components/EmptyState';
import { Fab } from '@/src/components/Fab';
import { MonthSwitcher } from '@/src/components/MonthSwitcher';
import { useAppData } from '@/src/context/AppDataContext';
import { getCategoryBudgetSummaries } from '@/src/db/budgets';
import { totalsFromSummaries } from '@/src/domain/budgetCalculations';
import { formatCents } from '@/src/domain/money';
import type { CategoryBudgetSummary } from '@/src/domain/types';

export default function DashboardScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const { yearMonth, setYearMonth, refreshKey, refresh } = useAppData();
  const [summaries, setSummaries] = useState<CategoryBudgetSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCategoryBudgetSummaries(yearMonth);
      setSummaries(data);
    } finally {
      setLoading(false);
    }
  }, [yearMonth]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const totals = totalsFromSummaries(summaries);
  const active = summaries.filter((s) => s.spent_cents > 0 || s.limit_cents > 0);
  const remainingColor =
    totals.remaining_cents < 0 ? colors.danger : colors.success;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}>
        <MonthSwitcher yearMonth={yearMonth} onChange={setYearMonth} />

        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Spent</Text>
          <Text style={[styles.summarySpent, { color: colors.text }]}>
            {formatCents(totals.spent_cents)}
          </Text>
          <View style={styles.summaryRow}>
            <View>
              <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Budget</Text>
              <Text style={[styles.metaValue, { color: colors.text }]}>
                {formatCents(totals.budget_cents)}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Remaining</Text>
              <Text style={[styles.metaValue, { color: remainingColor }]}>
                {formatCents(totals.remaining_cents)}
              </Text>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>By category</Text>

        {loading && summaries.length === 0 ? (
          <ActivityIndicator color={colors.tint} style={{ marginTop: 24 }} />
        ) : active.length === 0 ? (
          <EmptyState
            title="No activity this month"
            subtitle="Add an expense or set category budgets to get started."
          />
        ) : (
          active.map((s) => (
            <BudgetBar
              key={s.category_id}
              name={s.category_name}
              color={s.category_color}
              spentCents={s.spent_cents}
              limitCents={s.limit_cents}
            />
          ))
        )}
      </ScrollView>

      <Fab onPress={() => router.push('/expense/new')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 100 },
  summaryCard: {
    marginTop: 12,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  summarySpent: {
    fontSize: 34,
    fontWeight: '700',
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  metaLabel: { fontSize: 12, fontWeight: '600' },
  metaValue: { fontSize: 16, fontWeight: '600', marginTop: 2, fontVariant: ['tabular-nums'] },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 10,
    fontSize: 17,
    fontWeight: '700',
  },
});
