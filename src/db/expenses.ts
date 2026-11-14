import { monthDateRange } from '@/src/domain/month';
import type { Expense, ExpenseWithCategory } from '@/src/domain/types';

import { getDatabase } from './database';

export async function listExpensesForMonth(yearMonth: string): Promise<ExpenseWithCategory[]> {
  const db = await getDatabase();
  const { start, end } = monthDateRange(yearMonth);
  return db.getAllAsync<ExpenseWithCategory>(
    `SELECT e.*, c.name AS category_name, c.color AS category_color
     FROM expenses e
     JOIN categories c ON c.id = e.category_id
     WHERE e.date >= ? AND e.date <= ?
     ORDER BY e.date DESC, e.id DESC`,
    start,
    end
  );
}

export async function getExpense(id: number): Promise<Expense | null> {
  const db = await getDatabase();
  return db.getFirstAsync<Expense>(`SELECT * FROM expenses WHERE id = ?`, id);
}

export async function createExpense(input: {
  amount_cents: number;
  category_id: number;
  date: string;
  note?: string | null;
}): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO expenses (amount_cents, category_id, date, note)
     VALUES (?, ?, ?, ?)`,
    input.amount_cents,
    input.category_id,
    input.date,
    input.note?.trim() || null
  );
  return result.lastInsertRowId;
}

export async function updateExpense(
  id: number,
  input: {
    amount_cents: number;
    category_id: number;
    date: string;
    note?: string | null;
  }
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE expenses
     SET amount_cents = ?, category_id = ?, date = ?, note = ?
     WHERE id = ?`,
    input.amount_cents,
    input.category_id,
    input.date,
    input.note?.trim() || null,
    id
  );
}

export async function deleteExpense(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM expenses WHERE id = ?`, id);
}

export async function spendByCategoryForMonth(
  yearMonth: string
): Promise<{ category_id: number; spent_cents: number }[]> {
  const db = await getDatabase();
  const { start, end } = monthDateRange(yearMonth);
  return db.getAllAsync<{ category_id: number; spent_cents: number }>(
    `SELECT category_id, SUM(amount_cents) AS spent_cents
     FROM expenses
     WHERE date >= ? AND date <= ?
     GROUP BY category_id`,
    start,
    end
  );
}
