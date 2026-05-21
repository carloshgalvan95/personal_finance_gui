import type {
  Budget,
  FinancialGoal,
  Transaction,
  TransactionCategory,
  User,
} from "../types";
import { LocalStorageService, STORAGE_KEYS } from "./localStorage";
import { generateId } from "../utils";

const DEMO_FLAG = "personal_finance_demo_seeded";

export function isDemoSeeded(): boolean {
  return LocalStorageService.get<boolean>(DEMO_FLAG) === true;
}

export function seedDemoData(user: User): void {
  if (isDemoSeeded()) return;

  const categories: TransactionCategory[] = [
    { id: "cat-food", name: "Food", type: "expense", color: "#f97316" },
    { id: "cat-rent", name: "Housing", type: "expense", color: "#6366f1" },
    { id: "cat-salary", name: "Salary", type: "income", color: "#22c55e" },
    { id: "cat-fun", name: "Entertainment", type: "expense", color: "#ec4899" },
  ];

  const now = new Date();
  const transactions: Transaction[] = [
    {
      id: generateId(),
      userId: user.id,
      type: "income",
      amount: 5200,
      category: "Salary",
      description: "Monthly salary",
      date: new Date(now.getFullYear(), now.getMonth(), 1),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      userId: user.id,
      type: "expense",
      amount: 1450,
      category: "Housing",
      description: "Rent",
      date: new Date(now.getFullYear(), now.getMonth(), 3),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      userId: user.id,
      type: "expense",
      amount: 86.4,
      category: "Food",
      description: "Groceries",
      date: new Date(now.getFullYear(), now.getMonth(), 8),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      userId: user.id,
      type: "expense",
      amount: 42,
      category: "Entertainment",
      description: "Streaming services",
      date: new Date(now.getFullYear(), now.getMonth(), 12),
      createdAt: now,
      updatedAt: now,
    },
  ];

  const budgets: Budget[] = [
    {
      id: generateId(),
      userId: user.id,
      categoryId: "cat-food",
      amount: 400,
      period: "monthly",
      startDate: new Date(now.getFullYear(), now.getMonth(), 1),
      endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      userId: user.id,
      categoryId: "cat-rent",
      amount: 1500,
      period: "monthly",
      startDate: new Date(now.getFullYear(), now.getMonth(), 1),
      endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0),
      createdAt: now,
      updatedAt: now,
    },
  ];

  const goals: FinancialGoal[] = [
    {
      id: generateId(),
      userId: user.id,
      title: "Emergency fund",
      description: "6 months of expenses",
      targetAmount: 15000,
      currentAmount: 4200,
      targetDate: new Date(now.getFullYear() + 1, 0, 1),
      status: "active",
      createdAt: now,
      updatedAt: now,
    },
  ];

  LocalStorageService.set(STORAGE_KEYS.CATEGORIES, categories);
  LocalStorageService.set(STORAGE_KEYS.TRANSACTIONS, transactions);
  LocalStorageService.set("personal_finance_budgets", budgets);
  LocalStorageService.set("personal_finance_goals", goals);
  LocalStorageService.set(DEMO_FLAG, true);
}
