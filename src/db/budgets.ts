import type { Budget, CategoryBudgetSummary } from '@/src/domain/types';
import { shiftYearMonth } from '@/src/domain/month';

import { getDatabase } from './database';
import { spendByCategoryForMonth } from './expenses';
import { listCategories } from './categories';

export async function listBudgetsForMonth(yearMonth: string): Promise<Budget[]> {
  const db = await getDatabase();
  return db.getAllAsync<Budget>(
    `SELECT * FROM budgets WHERE year_month = ?`,
    yearMonth
  );
}

export async function upsertBudget(
  categoryId: number,
  yearMonth: string,
  limitCents: number
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO budgets (category_id, year_month, limit_cents)
     VALUES (?, ?, ?)
     ON CONFLICT(category_id, year_month)
     DO UPDATE SET limit_cents = excluded.limit_cents`,
    categoryId,
    yearMonth,
    Math.max(0, Math.round(limitCents))
  );
}

export async function deleteBudget(categoryId: number, yearMonth: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `DELETE FROM budgets WHERE category_id = ? AND year_month = ?`,
    categoryId,
    yearMonth
  );
}

export async function copyBudgetsFromPreviousMonth(yearMonth: string): Promise<number> {
  const previous = shiftYearMonth(yearMonth, -1);
  const db = await getDatabase();
  const prior = await listBudgetsForMonth(previous);
  if (prior.length === 0) return 0;

  await db.withTransactionAsync(async () => {
    for (const b of prior) {
      await db.runAsync(
        `INSERT INTO budgets (category_id, year_month, limit_cents)
         VALUES (?, ?, ?)
         ON CONFLICT(category_id, year_month)
         DO UPDATE SET limit_cents = excluded.limit_cents`,
        b.category_id,
        yearMonth,
        b.limit_cents
      );
    }
  });

  return prior.length;
}

export async function getCategoryBudgetSummaries(
  yearMonth: string
): Promise<CategoryBudgetSummary[]> {
  const categories = await listCategories(false);
  const budgets = await listBudgetsForMonth(yearMonth);
  const spend = await spendByCategoryForMonth(yearMonth);

  const budgetMap = new Map(budgets.map((b) => [b.category_id, b.limit_cents]));
  const spendMap = new Map(spend.map((s) => [s.category_id, s.spent_cents]));

  const summaries: CategoryBudgetSummary[] = categories.map((c) => ({
    category_id: c.id,
    category_name: c.name,
    category_color: c.color,
    limit_cents: budgetMap.get(c.id) ?? 0,
    spent_cents: spendMap.get(c.id) ?? 0,
  }));

  // Include spend on archived categories that still have expenses this month
  for (const s of spend) {
    if (!summaries.some((x) => x.category_id === s.category_id)) {
      const db = await getDatabase();
      const cat = await db.getFirstAsync<{ name: string; color: string }>(
        `SELECT name, color FROM categories WHERE id = ?`,
        s.category_id
      );
      if (cat) {
        summaries.push({
          category_id: s.category_id,
          category_name: cat.name,
          category_color: cat.color,
          limit_cents: budgetMap.get(s.category_id) ?? 0,
          spent_cents: s.spent_cents,
        });
      }
    }
  }

  return summaries.sort((a, b) => {
    const aActive = a.spent_cents > 0 || a.limit_cents > 0 ? 1 : 0;
    const bActive = b.spent_cents > 0 || b.limit_cents > 0 ? 1 : 0;
    if (aActive !== bActive) return bActive - aActive;
    return a.category_name.localeCompare(b.category_name);
  });
}
