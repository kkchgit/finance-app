import type { CategoryBudgetSummary } from './types';

export function totalsFromSummaries(summaries: CategoryBudgetSummary[]): {
  spent_cents: number;
  budget_cents: number;
  remaining_cents: number;
} {
  const spent_cents = summaries.reduce((sum, s) => sum + s.spent_cents, 0);
  const budget_cents = summaries.reduce((sum, s) => sum + s.limit_cents, 0);
  return {
    spent_cents,
    budget_cents,
    remaining_cents: budget_cents - spent_cents,
  };
}

export function progressRatio(spent: number, limit: number): number {
  if (limit <= 0) return spent > 0 ? 1 : 0;
  return Math.min(spent / limit, 1);
}

export function isOverBudget(spent: number, limit: number): boolean {
  return limit > 0 && spent > limit;
}
