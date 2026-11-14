import { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAppData } from '@/src/context/AppDataContext';
import {
  createCategory,
  deleteCategory,
  listCategories,
  unarchiveCategory,
  updateCategory,
} from '@/src/db/categories';
import type { Category } from '@/src/domain/types';

const COLOR_OPTIONS = [
  '#EA580C',
  '#2563EB',
  '#7C3AED',
  '#0891B2',
  '#DC2626',
  '#DB2777',
  '#CA8A04',
  '#059669',
  '#64748B',
];

export default function CategoriesScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const { refresh } = useAppData();
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [editingId, setEditingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setCategories(await listCategories(true));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Name required', 'Enter a category name.');
      return;
    }
    if (editingId != null) {
      await updateCategory(editingId, { name: trimmed, color });
    } else {
      await createCategory({ name: trimmed, color });
    }
    setName('');
    setEditingId(null);
    setColor(COLOR_OPTIONS[0]);
    refresh();
    await load();
  }

  function startEdit(cat: Category) {
    setEditingId(cat.id);
    setName(cat.name);
    setColor(cat.color);
  }

  function confirmRemove(cat: Category) {
    Alert.alert(
      cat.archived ? 'Delete category?' : 'Archive category?',
      cat.archived
        ? 'Permanently remove this archived category if it has no expenses.'
        : 'Categories with expenses are archived instead of deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: cat.archived ? 'Delete' : 'Archive',
          style: 'destructive',
          onPress: async () => {
            await deleteCategory(cat.id);
            if (editingId === cat.id) {
              setEditingId(null);
              setName('');
            }
            refresh();
            await load();
          },
        },
      ]
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.form, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {editingId != null ? 'Edit category' : 'New category'}
        </Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Category name"
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
        />
        <View style={styles.colors}>
          {COLOR_OPTIONS.map((c) => (
            <Pressable
              key={c}
              onPress={() => setColor(c)}
              style={[
                styles.swatch,
                {
                  backgroundColor: c,
                  borderWidth: color === c ? 3 : 0,
                  borderColor: colors.text,
                },
              ]}
            />
          ))}
        </View>
        <View style={styles.formActions}>
          {editingId != null ? (
            <Pressable
              onPress={() => {
                setEditingId(null);
                setName('');
                setColor(COLOR_OPTIONS[0]);
              }}>
              <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
            </Pressable>
          ) : (
            <View />
          )}
          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [
              styles.saveBtn,
              { backgroundColor: colors.tint, opacity: pressed ? 0.7 : 1 },
            ]}>
            <Text style={styles.saveText}>{editingId != null ? 'Update' : 'Add'}</Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => startEdit(item)}
            onLongPress={() => confirmRemove(item)}
            style={[
              styles.row,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: item.archived ? 0.55 : 1,
              },
            ]}>
            <View style={[styles.dot, { backgroundColor: item.color }]} />
            <Text style={[styles.name, { color: colors.text }]}>
              {item.name}
              {item.archived ? ' (archived)' : ''}
            </Text>
            {item.archived ? (
              <Pressable
                onPress={async () => {
                  await unarchiveCategory(item.id);
                  refresh();
                  await load();
                }}>
                <Text style={{ color: colors.tint, fontWeight: '600' }}>Restore</Text>
              </Pressable>
            ) : (
              <Pressable onPress={() => confirmRemove(item)}>
                <Text style={{ color: colors.danger, fontWeight: '600' }}>Archive</Text>
              </Pressable>
            )}
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  form: {
    margin: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  colors: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  swatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  formActions: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saveBtn: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  saveText: { color: '#fff', fontWeight: '700' },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    marginBottom: 8,
  },
  dot: { width: 12, height: 12, borderRadius: 6 },
  name: { flex: 1, fontSize: 15, fontWeight: '600' },
});
