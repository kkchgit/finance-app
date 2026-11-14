import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { ExpenseForm, type ExpenseFormValues } from '@/src/components/ExpenseForm';
import { useAppData } from '@/src/context/AppDataContext';
import { listCategories } from '@/src/db/categories';
import { createExpense, deleteExpense, getExpense, updateExpense } from '@/src/db/expenses';
import type { Category, Expense } from '@/src/domain/types';

export default function ExpenseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const { refresh } = useAppData();

  const [categories, setCategories] = useState<Category[]>([]);
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cats = await listCategories(false);
        if (cancelled) return;
        setCategories(cats);
        if (!isNew) {
          const exp = await getExpense(Number(id));
          if (cancelled) return;
          if (!exp) {
            setError('Expense not found.');
          } else {
            setExpense(exp);
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isNew]);

  async function handleSubmit(values: ExpenseFormValues) {
    if (isNew) {
      await createExpense(values);
    } else {
      await updateExpense(Number(id), values);
    }
    refresh();
    router.back();
  }

  async function handleDelete() {
    await deleteExpense(Number(id));
    refresh();
    router.back();
  }

  return (
    <>
      <Stack.Screen options={{ title: isNew ? 'Add expense' : 'Edit expense' }} />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator color={colors.tint} style={{ marginTop: 40 }} />
        ) : error ? (
          <Text style={{ color: colors.danger, padding: 16 }}>{error}</Text>
        ) : categories.length === 0 ? (
          <View style={{ padding: 16 }}>
            <Text style={{ color: colors.text }}>
              No categories available. Add a category first.
            </Text>
          </View>
        ) : (
          <ExpenseForm
            categories={categories}
            initial={
              expense
                ? {
                    amount_cents: expense.amount_cents,
                    category_id: expense.category_id,
                    date: expense.date,
                    note: expense.note,
                  }
                : undefined
            }
            submitLabel={isNew ? 'Add expense' : 'Save changes'}
            onSubmit={handleSubmit}
            onDelete={isNew ? undefined : handleDelete}
          />
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 40 },
});
