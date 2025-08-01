// User and Authentication Types
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Transaction Types
export interface Transaction {
  id: string;
  userId: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon?: string;
}

// Budget Types
export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  amount: number;
  period: 'monthly' | 'yearly';
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Financial Goal Types
export interface FinancialGoal {
  id: string;
  userId: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  status: 'active' | 'completed' | 'paused';
  createdAt: Date;
  updatedAt: Date;
}

// Dashboard Types
export interface DashboardData {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  recentTransactions: Transaction[];
  budgetStatus: BudgetStatus[];
  goalProgress: GoalProgress[];
}

export interface BudgetStatus {
  categoryId: string;
  categoryName: string;
  budgetAmount: number;
  spentAmount: number;
  remainingAmount: number;
  percentageUsed: number;
}

export interface GoalProgress {
  goalId: string;
  title: string;
  progress: number;
  targetAmount: number;
  currentAmount: number;
  daysRemaining: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface TransactionForm {
  type: 'income' | 'expense';
  amount: string;
  category: string;
  description: string;
  date: string;
}

export interface BudgetForm {
  categoryId: string;
  amount: string;
  period: 'monthly' | 'yearly';
}

export interface GoalForm {
  title: string;
  description: string;
  targetAmount: string;
  targetDate: string;
}
