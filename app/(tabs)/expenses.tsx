import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { EmptyState } from '@/src/components/EmptyState';
import { Fab } from '@/src/components/Fab';
import { MonthSwitcher } from '@/src/components/MonthSwitcher';
import { useAppData } from '@/src/context/AppDataContext';
import { deleteExpense, listExpensesForMonth } from '@/src/db/expenses';
import { formatCents } from '@/src/domain/money';
import { formatDisplayDate } from '@/src/domain/month';
import type { ExpenseWithCategory } from '@/src/domain/types';

export default function ExpensesScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const { yearMonth, setYearMonth, refreshKey, refresh } = useAppData();
  const [expenses, setExpenses] = useState<ExpenseWithCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setExpenses(await listExpensesForMonth(yearMonth));
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

  function confirmDelete(item: ExpenseWithCategory) {
    Alert.alert('Delete expense?', formatCents(item.amount_cents), [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteExpense(item.id);
          refresh();
          load();
        },
      },
    ]);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <MonthSwitcher yearMonth={yearMonth} onChange={setYearMonth} />
      </View>

      {loading && expenses.length === 0 ? (
        <ActivityIndicator color={colors.tint} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              title="No expenses yet"
              subtitle="Tap + to log your first expense for this month."
            />
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/expense/${item.id}`)}
              onLongPress={() => confirmDelete(item)}
              style={({ pressed }) => [
                styles.row,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}>
              <View style={[styles.dot, { backgroundColor: item.category_color }]} />
              <View style={styles.main}>
                <Text style={[styles.category, { color: colors.text }]}>
                  {item.category_name}
                </Text>
                <Text style={[styles.meta, { color: colors.textSecondary }]}>
                  {formatDisplayDate(item.date)}
                  {item.note ? ` · ${item.note}` : ''}
                </Text>
              </View>
              <Text style={[styles.amount, { color: colors.text }]}>
                {formatCents(item.amount_cents)}
              </Text>
            </Pressable>
          )}
        />
      )}

      <Fab onPress={() => router.push('/expense/new')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 8, paddingTop: 8 },
  list: { padding: 16, paddingBottom: 100 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    marginBottom: 8,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  main: { flex: 1 },
  category: { fontSize: 15, fontWeight: '600' },
  meta: { fontSize: 13, marginTop: 2 },
  amount: { fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'] },
});
