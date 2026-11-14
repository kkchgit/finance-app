export type Category = {
  id: number;
  name: string;
  color: string;
  icon: string;
  archived: number;
  sort_order: number;
};

export type Expense = {
  id: number;
  amount_cents: number;
  category_id: number;
  date: string;
  note: string | null;
  created_at: string;
};

export type ExpenseWithCategory = Expense & {
  category_name: string;
  category_color: string;
};

export type Budget = {
  id: number;
  category_id: number;
  year_month: string;
  limit_cents: number;
};

export type CategoryBudgetSummary = {
  category_id: number;
  category_name: string;
  category_color: string;
  limit_cents: number;
  spent_cents: number;
};
