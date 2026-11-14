import type { Category } from '@/src/domain/types';

import { getDatabase } from './database';

export async function listCategories(includeArchived = false): Promise<Category[]> {
  const db = await getDatabase();
  if (includeArchived) {
    return db.getAllAsync<Category>(
      `SELECT * FROM categories ORDER BY archived ASC, sort_order ASC, name ASC`
    );
  }
  return db.getAllAsync<Category>(
    `SELECT * FROM categories WHERE archived = 0 ORDER BY sort_order ASC, name ASC`
  );
}

export async function getCategory(id: number): Promise<Category | null> {
  const db = await getDatabase();
  return db.getFirstAsync<Category>(`SELECT * FROM categories WHERE id = ?`, id);
}

export async function createCategory(input: {
  name: string;
  color: string;
  icon?: string;
}): Promise<number> {
  const db = await getDatabase();
  const max = await db.getFirstAsync<{ m: number }>(
    `SELECT COALESCE(MAX(sort_order), 0) AS m FROM categories`
  );
  const result = await db.runAsync(
    `INSERT INTO categories (name, color, icon, sort_order) VALUES (?, ?, ?, ?)`,
    input.name.trim(),
    input.color,
    input.icon ?? 'ellipsis.circle',
    (max?.m ?? 0) + 1
  );
  return result.lastInsertRowId;
}

export async function updateCategory(
  id: number,
  input: { name: string; color: string }
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`UPDATE categories SET name = ?, color = ? WHERE id = ?`, input.name.trim(), input.color, id);
}

export async function archiveCategory(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`UPDATE categories SET archived = 1 WHERE id = ?`, id);
}

export async function unarchiveCategory(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`UPDATE categories SET archived = 0 WHERE id = ?`, id);
}

export async function categoryHasExpenses(id: number): Promise<boolean> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ c: number }>(
    `SELECT COUNT(*) AS c FROM expenses WHERE category_id = ?`,
    id
  );
  return (row?.c ?? 0) > 0;
}

export async function deleteCategory(id: number): Promise<void> {
  const db = await getDatabase();
  const has = await categoryHasExpenses(id);
  if (has) {
    await archiveCategory(id);
    return;
  }
  await db.runAsync(`DELETE FROM budgets WHERE category_id = ?`, id);
  await db.runAsync(`DELETE FROM categories WHERE id = ?`, id);
}
