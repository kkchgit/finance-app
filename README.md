# Finance App

Mobile-first personal finance app for **manual expense tracking** and **monthly category budgets**. Built with Expo (React Native) and local SQLite.

## Features (v1)

- Log expenses (amount, category, date, optional note)
- Edit and delete expenses
- Default categories (Food, Transport, Housing, Utilities, Health, Entertainment, Shopping, Other)
- Add, edit, and archive categories
- Set monthly budget limits per category
- Copy budgets from the previous month
- Dashboard with spend vs budget progress by category
- Month switcher across dashboard, expenses, and budgets

Data stays on-device (no account, no cloud sync).

## Stack

- Expo SDK 58 + Expo Router + TypeScript
- `expo-sqlite` for persistence (amounts stored as integer cents)
- `@react-native-community/datetimepicker` for expense dates

## Getting started

```bash
npm install
npx expo start
```

Then open in iOS Simulator, Android emulator, or Expo Go.

```bash
npx expo start --ios
npx expo start --android
```

## Project layout

```
app/                  # Expo Router screens
  (tabs)/             # Dashboard, Expenses, Budgets
  expense/[id].tsx    # Add / edit expense
  category/           # Manage categories
src/
  db/                 # SQLite schema + repositories
  domain/             # Types, money/month helpers
  components/         # Shared UI
  context/            # Selected month + refresh
constants/            # Theme + default categories
```

## Scripts

| Command | Description |
|---|---|
| `npm start` / `npx expo start` | Dev server |
| `npx tsc --noEmit` | Typecheck |

## Out of scope (later)

Bank sync, accounts/net worth, auth/cloud sync, recurring expenses, CSV import.
