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

// Investment Types
export interface Investment {
  id: string;
  userId: string;
  symbol: string;
  type: 'etf' | 'cryptocurrency' | 'stock';
  name: string;
  quantity: number;
  purchasePrice: number;
  purchaseDate: Date;
  currentPrice?: number;
  lastUpdated?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssetPrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  marketCap?: number;
  lastUpdated: Date;
}

export interface Portfolio {
  id: string;
  userId: string;
  totalValue: number;
  totalInvested: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  investments: Investment[];
  lastUpdated: Date;
}

export interface InvestmentTransaction {
  id: string;
  userId: string;
  investmentId: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  fees: number;
  date: Date;
  createdAt: Date;
}

export interface InvestmentPerformance {
  symbol: string;
  name: string;
  currentPrice: number;
  purchasePrice: number;
  quantity: number;
  currentValue: number;
  investedValue: number;
  gainLoss: number;
  gainLossPercent: number;
  dayChange: number;
  dayChangePercent: number;
}

// Investment Form Types
export interface InvestmentForm {
  symbol: string;
  type: 'etf' | 'cryptocurrency' | 'stock';
  name: string;
  quantity: string;
  purchasePrice: string;
  purchaseDate: string;
}

// API Types for external financial data
export interface YahooFinanceQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

export interface CryptoQuote {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  marketCap: number;
  volume24h: number;
}
