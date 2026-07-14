import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CATEGORIES, SAMPLE_INCOME, SAMPLE_TRANSACTIONS, type Category, type Income, type Transaction } from "./budget-data";

interface BudgetState {
  month: string; // yyyy-mm
  categories: Category[];
  transactions: Transaction[];
  incomes: Income[];
  cashOnHand: number;
  bank: number;
  owed: number;
  addTransaction: (t: Omit<Transaction, "id">) => void;
  updateTransaction: (id: string, patch: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addIncome: (i: Omit<Income, "id">) => void;
  deleteIncome: (id: string) => void;
  updateCategoryBudget: (name: string, budget: number) => void;
  setBalances: (b: { cashOnHand?: number; bank?: number; owed?: number }) => void;
}

export const useBudget = create<BudgetState>()(
  persist(
    (set) => ({
      month: "2026-07",
      categories: CATEGORIES,
      transactions: SAMPLE_TRANSACTIONS,
      incomes: SAMPLE_INCOME,
      cashOnHand: 72,
      bank: 261,
      owed: 15,
      addTransaction: (t) =>
        set((s) => ({ transactions: [...s.transactions, { ...t, id: crypto.randomUUID() }] })),
      updateTransaction: (id, patch) =>
        set((s) => ({ transactions: s.transactions.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      deleteTransaction: (id) =>
        set((s) => ({ transactions: s.transactions.filter((x) => x.id !== id) })),
      addIncome: (i) =>
        set((s) => ({ incomes: [...s.incomes, { ...i, id: crypto.randomUUID() }] })),
      deleteIncome: (id) => set((s) => ({ incomes: s.incomes.filter((x) => x.id !== id) })),
      updateCategoryBudget: (name, budget) =>
        set((s) => ({ categories: s.categories.map((c) => (c.name === name ? { ...c, budget } : c)) })),
      setBalances: (b) => set((s) => ({ ...s, ...b })),
    }),
    { name: "budget-app-v1" }
  )
);
