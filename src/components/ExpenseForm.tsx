import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { CategoryPicker } from '@/src/components/CategoryPicker';
import type { Category } from '@/src/domain/types';
import { centsToInputString, parseAmountToCents } from '@/src/domain/money';
import { formatDisplayDate, parseISODate, toISODate } from '@/src/domain/month';

export type ExpenseFormValues = {
  amount_cents: number;
  category_id: number;
  date: string;
  note: string | null;
};

type Props = {
  categories: Category[];
  initial?: Partial<ExpenseFormValues> & { amount_cents?: number };
  submitLabel: string;
  onSubmit: (values: ExpenseFormValues) => Promise<void>;
  onDelete?: () => Promise<void>;
};

export function ExpenseForm({
  categories,
  initial,
  submitLabel,
  onSubmit,
  onDelete,
}: Props) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];

  const [amount, setAmount] = useState(
    initial?.amount_cents != null ? centsToInputString(initial.amount_cents) : ''
  );
  const [categoryId, setCategoryId] = useState<number | null>(
    initial?.category_id ?? categories[0]?.id ?? null
  );
  const [date, setDate] = useState(initial?.date ?? toISODate());
  const [note, setNote] = useState(initial?.note ?? '');
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    const cents = parseAmountToCents(amount);
    if (cents == null || cents <= 0) {
      setError('Enter a valid amount greater than zero.');
      return;
    }
    if (categoryId == null) {
      setError('Choose a category.');
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        amount_cents: cents,
        category_id: categoryId,
        date,
        note: note.trim() || null,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save expense.');
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete() {
    if (!onDelete) return;
    Alert.alert('Delete expense?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setSaving(true);
          try {
            await onDelete();
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Could not delete.');
            setSaving(false);
          }
        },
      },
    ]);
  }

  return (
    <View style={styles.form}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>Amount</Text>
      <TextInput
        value={amount}
        onChangeText={setAmount}
        placeholder="0.00"
        placeholderTextColor={colors.textSecondary}
        keyboardType="decimal-pad"
        style={[
          styles.amountInput,
          { color: colors.text, borderColor: colors.border, backgroundColor: colors.card },
        ]}
      />

      <Text style={[styles.label, { color: colors.textSecondary }]}>Category</Text>
      <CategoryPicker
        categories={categories}
        selectedId={categoryId}
        onSelect={setCategoryId}
      />

      <Text style={[styles.label, { color: colors.textSecondary, marginTop: 16 }]}>Date</Text>
      <Pressable
        onPress={() => setShowPicker(true)}
        style={[
          styles.dateBtn,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}>
        <Text style={{ color: colors.text, fontSize: 16 }}>{formatDisplayDate(date)}</Text>
      </Pressable>
      {showPicker ? (
        <DateTimePicker
          value={parseISODate(date)}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, selected) => {
            if (Platform.OS !== 'ios') setShowPicker(false);
            if (selected) setDate(toISODate(selected));
          }}
        />
      ) : null}
      {Platform.OS === 'ios' && showPicker ? (
        <Pressable onPress={() => setShowPicker(false)} style={styles.doneDate}>
          <Text style={{ color: colors.tint, fontWeight: '600' }}>Done</Text>
        </Pressable>
      ) : null}

      <Text style={[styles.label, { color: colors.textSecondary }]}>Note (optional)</Text>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="Coffee, groceries…"
        placeholderTextColor={colors.textSecondary}
        style={[
          styles.noteInput,
          { color: colors.text, borderColor: colors.border, backgroundColor: colors.card },
        ]}
      />

      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

      <Pressable
        disabled={saving}
        onPress={handleSave}
        style={({ pressed }) => [
          styles.saveBtn,
          { backgroundColor: colors.tint, opacity: pressed || saving ? 0.7 : 1 },
        ]}>
        <Text style={styles.saveText}>{saving ? 'Saving…' : submitLabel}</Text>
      </Pressable>

      {onDelete ? (
        <Pressable
          disabled={saving}
          onPress={confirmDelete}
          style={({ pressed }) => [{ marginTop: 16, opacity: pressed ? 0.6 : 1 }]}>
          <Text style={[styles.deleteText, { color: colors.danger }]}>Delete expense</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    padding: 16,
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  amountInput: {
    fontSize: 32,
    fontWeight: '700',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontVariant: ['tabular-nums'],
  },
  dateBtn: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  doneDate: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
  },
  noteInput: {
    fontSize: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  error: {
    marginTop: 12,
    fontSize: 14,
  },
  saveBtn: {
    marginTop: 24,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  deleteText: {
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
  },
});
