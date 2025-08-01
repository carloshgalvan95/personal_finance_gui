import type { DashboardData } from '../types';
import { TransactionService } from './transactionService';
import { BudgetService } from './budgetService';
import { GoalService } from './goalService';

export class DashboardService {
  // Get comprehensive dashboard data for a user
  static getDashboardData(userId: string): DashboardData {
    const transactions = TransactionService.getTransactions(userId);

    // Calculate totals

    // Calculate all-time totals for balance
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const netIncome = totalIncome - totalExpenses;

    // Get recent transactions (last 10)
    const recentTransactions = transactions.slice(0, 10);

    // Get budget statuses
    const budgetStatus = BudgetService.getBudgetStatuses(userId, transactions);

    // Get goal progress
    const goalProgress = GoalService.getGoalProgresses(userId);

    return {
      totalIncome,
      totalExpenses,
      netIncome,
      recentTransactions,
      budgetStatus,
      goalProgress,
    };
  }

  // Calculate month-over-month percentage change
  static calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  // Get spending by category for current month
  static getSpendingByCategory(userId: string): { category: string; amount: number; color: string }[] {
    const transactions = TransactionService.getTransactions(userId);
    const categories = [
      // Expense categories
      { id: 'food', name: 'Food & Dining', type: 'expense' as const, color: '#ff6b6b' },
      { id: 'transportation', name: 'Transportation', type: 'expense' as const, color: '#4ecdc4' },
      { id: 'shopping', name: 'Shopping', type: 'expense' as const, color: '#45b7d1' },
      { id: 'entertainment', name: 'Entertainment', type: 'expense' as const, color: '#96ceb4' },
      { id: 'bills', name: 'Bills & Utilities', type: 'expense' as const, color: '#feca57' },
      { id: 'healthcare', name: 'Healthcare', type: 'expense' as const, color: '#ff9ff3' },
      { id: 'education', name: 'Education', type: 'expense' as const, color: '#54a0ff' },
      { id: 'travel', name: 'Travel', type: 'expense' as const, color: '#5f27cd' },
      { id: 'other-expense', name: 'Other Expenses', type: 'expense' as const, color: '#999999' },
    ];
    
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Filter to current month expenses only
    const currentMonthExpenses = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return t.type === 'expense' && 
             transactionDate >= currentMonthStart && 
             transactionDate <= currentMonthEnd;
    });

    // Group by category and sum amounts
    const categorySpending = currentMonthExpenses.reduce((acc, transaction) => {
      const category = transaction.category;
      acc[category] = (acc[category] || 0) + transaction.amount;
      return acc;
    }, {} as Record<string, number>);

    // Convert to array with category colors
    return Object.entries(categorySpending)
      .map(([categoryName, amount]) => {
        const categoryInfo = categories.find((cat: { name: string; color: string }) => cat.name === categoryName);
        return {
          category: categoryName,
          amount,
          color: categoryInfo?.color || '#999999',
        };
      })
      .sort((a, b) => b.amount - a.amount) // Sort by amount descending
      .slice(0, 6); // Top 6 categories
  }

  // Get financial insights and alerts
  static getFinancialInsights(userId: string): {
    alerts: string[];
    insights: string[];
  } {
    const dashboardData = this.getDashboardData(userId);
    const transactions = TransactionService.getTransactions(userId);
    const alerts: string[] = [];
    const insights: string[] = [];

    // Budget alerts
    const overBudgetCategories = dashboardData.budgetStatus.filter(status => status.percentageUsed > 100);
    const nearLimitCategories = dashboardData.budgetStatus.filter(status => 
      status.percentageUsed >= 80 && status.percentageUsed <= 100
    );

    if (overBudgetCategories.length > 0) {
      alerts.push(`You're over budget in ${overBudgetCategories.length} ${overBudgetCategories.length === 1 ? 'category' : 'categories'}`);
    }

    if (nearLimitCategories.length > 0) {
      alerts.push(`You're approaching budget limits in ${nearLimitCategories.length} ${nearLimitCategories.length === 1 ? 'category' : 'categories'}`);
    }

    // Goal alerts
    const overdueGoals = GoalService.getOverdueGoals(userId);
    const nearDeadlineGoals = GoalService.getGoalsNearDeadline(userId);

    if (overdueGoals.length > 0) {
      alerts.push(`You have ${overdueGoals.length} overdue ${overdueGoals.length === 1 ? 'goal' : 'goals'}`);
    }

    if (nearDeadlineGoals.length > 0) {
      alerts.push(`${nearDeadlineGoals.length} ${nearDeadlineGoals.length === 1 ? 'goal' : 'goals'} due within 30 days`);
    }

    // Financial insights
    if (dashboardData.netIncome > 0) {
      insights.push(`Your net worth has increased by $${dashboardData.netIncome.toFixed(2)}`);
    } else if (dashboardData.netIncome < 0) {
      insights.push(`You've spent $${Math.abs(dashboardData.netIncome).toFixed(2)} more than you've earned`);
    }

    // Calculate current month's savings rate
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const currentMonthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= currentMonthStart && transactionDate <= currentMonthEnd;
    });

    const monthlyIncome = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpenses = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    if (monthlyIncome > 0) {
      const savingsRate = ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100;
      if (savingsRate > 20) {
        insights.push(`Excellent! You're saving ${savingsRate.toFixed(1)}% of your income this month`);
      } else if (savingsRate > 10) {
        insights.push(`Good job! You're saving ${savingsRate.toFixed(1)}% of your income this month`);
      } else if (savingsRate > 0) {
        insights.push(`You're saving ${savingsRate.toFixed(1)}% of your income this month. Consider increasing your savings rate`);
      } else {
        insights.push(`You're spending more than you earn this month. Review your expenses`);
      }
    }

    return { alerts, insights };
  }

  // Get monthly comparison data for charts
  static getMonthlyComparison(userId: string): {
    currentMonth: { income: number; expenses: number };
    lastMonth: { income: number; expenses: number };
    change: { income: number; expenses: number };
  } {
    const transactions = TransactionService.getTransactions(userId);
    
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const currentMonthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= currentMonthStart && transactionDate <= currentMonthEnd;
    });

    const lastMonthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= lastMonthStart && transactionDate <= lastMonthEnd;
    });

    const currentMonthIncome = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const currentMonthExpenses = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const lastMonthIncome = lastMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const lastMonthExpenses = lastMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      currentMonth: {
        income: currentMonthIncome,
        expenses: currentMonthExpenses,
      },
      lastMonth: {
        income: lastMonthIncome,
        expenses: lastMonthExpenses,
      },
      change: {
        income: this.calculatePercentageChange(currentMonthIncome, lastMonthIncome),
        expenses: this.calculatePercentageChange(currentMonthExpenses, lastMonthExpenses),
      },
    };
  }
}