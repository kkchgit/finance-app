import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { EmptyState } from '@/src/components/EmptyState';
import { MonthSwitcher } from '@/src/components/MonthSwitcher';
import { useAppData } from '@/src/context/AppDataContext';
import {
  copyBudgetsFromPreviousMonth,
  getCategoryBudgetSummaries,
  upsertBudget,
} from '@/src/db/budgets';
import { centsToInputString, formatCents, parseAmountToCents } from '@/src/domain/money';
import type { CategoryBudgetSummary } from '@/src/domain/types';

export default function BudgetsScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const { yearMonth, setYearMonth, refreshKey, refresh } = useAppData();
  const [summaries, setSummaries] = useState<CategoryBudgetSummary[]>([]);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCategoryBudgetSummaries(yearMonth);
      setSummaries(data);
      const next: Record<number, string> = {};
      for (const s of data) {
        next[s.category_id] = s.limit_cents > 0 ? centsToInputString(s.limit_cents) : '';
      }
      setDrafts(next);
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

  async function saveLimit(categoryId: number) {
    const raw = drafts[categoryId] ?? '';
    const cents = raw.trim() === '' ? 0 : parseAmountToCents(raw);
    if (cents == null || cents < 0) {
      Alert.alert('Invalid amount', 'Enter a valid budget amount.');
      return;
    }
    setSavingId(categoryId);
    try {
      await upsertBudget(categoryId, yearMonth, cents);
      refresh();
      await load();
    } finally {
      setSavingId(null);
    }
  }

  async function copyPrevious() {
    const count = await copyBudgetsFromPreviousMonth(yearMonth);
    if (count === 0) {
      Alert.alert('Nothing to copy', 'No budgets found for the previous month.');
      return;
    }
    refresh();
    await load();
    Alert.alert('Copied', `Copied ${count} budget${count === 1 ? '' : 's'} from last month.`);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <MonthSwitcher yearMonth={yearMonth} onChange={setYearMonth} />

        <View style={styles.actions}>
          <Pressable
            onPress={copyPrevious}
            style={({ pressed }) => [
              styles.actionBtn,
              { borderColor: colors.border, backgroundColor: colors.card, opacity: pressed ? 0.7 : 1 },
            ]}>
            <Text style={{ color: colors.tint, fontWeight: '600' }}>Copy from last month</Text>
          </Pressable>
          <Link href="/category" asChild>
            <Pressable
              style={({ pressed }) => [
                styles.actionBtn,
                { borderColor: colors.border, backgroundColor: colors.card, opacity: pressed ? 0.7 : 1 },
              ]}>
              <Text style={{ color: colors.text, fontWeight: '600' }}>Manage categories</Text>
            </Pressable>
          </Link>
        </View>

        {loading && summaries.length === 0 ? (
          <ActivityIndicator color={colors.tint} style={{ marginTop: 24 }} />
        ) : summaries.length === 0 ? (
          <EmptyState title="No categories" subtitle="Add categories to set budgets." />
        ) : (
          summaries.map((s) => (
            <View
              key={s.category_id}
              style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.rowTop}>
                <View style={[styles.dot, { backgroundColor: s.category_color }]} />
                <Text style={[styles.name, { color: colors.text }]}>{s.category_name}</Text>
                <Text style={[styles.spent, { color: colors.textSecondary }]}>
                  Spent {formatCents(s.spent_cents)}
                </Text>
              </View>
              <View style={styles.inputRow}>
                <Text style={{ color: colors.textSecondary, fontSize: 16 }}>$</Text>
                <TextInput
                  value={drafts[s.category_id] ?? ''}
                  onChangeText={(t) =>
                    setDrafts((prev) => ({ ...prev, [s.category_id]: t }))
                  }
                  placeholder="0.00"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="decimal-pad"
                  style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                />
                <Pressable
                  disabled={savingId === s.category_id}
                  onPress={() => saveLimit(s.category_id)}
                  style={({ pressed }) => [
                    styles.save,
                    {
                      backgroundColor: colors.tint,
                      opacity: pressed || savingId === s.category_id ? 0.7 : 1,
                    },
                  ]}>
                  <Text style={styles.saveText}>
                    {savingId === s.category_id ? '…' : 'Save'}
                  </Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 12 },
  actionBtn: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  row: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    marginBottom: 10,
  },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  name: { flex: 1, fontSize: 15, fontWeight: '600' },
  spent: { fontSize: 12 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontVariant: ['tabular-nums'],
  },
  save: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  saveText: { color: '#fff', fontWeight: '700' },
});
