import { TransactionService, CategoryService } from './transactionService';
import { BudgetService } from './budgetService';
import { GoalService } from './goalService';

// Chart data interfaces
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface TimeSeriesDataPoint {
  date: string;
  income: number;
  expenses: number;
  net: number;
}

export interface CategorySpendingData {
  category: string;
  amount: number;
  percentage: number;
  color: string;
  transactionCount: number;
}

export interface MonthlyComparisonData {
  month: string;
  income: number;
  expenses: number;
  savings: number;
  budgetedExpenses: number;
}

export interface BudgetAnalysisData {
  categoryName: string;
  budgeted: number;
  spent: number;
  remaining: number;
  percentageUsed: number;
  status: 'under' | 'near' | 'over';
}

export interface GoalAnalysisData {
  goalTitle: string;
  targetAmount: number;
  currentAmount: number;
  progress: number;
  daysRemaining: number;
  monthlyTarget: number;
  onTrack: boolean;
}

export interface FinancialHealthScore {
  score: number; // 0-100
  category: 'excellent' | 'good' | 'fair' | 'poor';
  factors: {
    savingsRate: { score: number; value: number };
    budgetAdherence: { score: number; value: number };
    goalProgress: { score: number; value: number };
    expenseVariability: { score: number; value: number };
  };
  recommendations: string[];
}

export class AnalyticsService {
  // Get spending trends over time (last 12 months)
  static getSpendingTrends(userId: string): TimeSeriesDataPoint[] {
    const transactions = TransactionService.getTransactions(userId);
    const months: { [key: string]: { income: number; expenses: number } } = {};

    // Initialize last 12 months
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toISOString().slice(0, 7); // YYYY-MM
      months[monthKey] = { income: 0, expenses: 0 };
    }

    // Aggregate transactions by month
    transactions.forEach(transaction => {
      const transactionDate = new Date(transaction.date);
      const monthKey = transactionDate.toISOString().slice(0, 7);
      
      if (months[monthKey]) {
        if (transaction.type === 'income') {
          months[monthKey].income += transaction.amount;
        } else {
          months[monthKey].expenses += transaction.amount;
        }
      }
    });

    // Convert to chart data
    return Object.entries(months).map(([monthKey, data]) => ({
      date: monthKey,
      income: data.income,
      expenses: data.expenses,
      net: data.income - data.expenses,
    }));
  }

  // Get category spending breakdown
  static getCategorySpending(userId: string, months: number = 12): CategorySpendingData[] {
    const transactions = TransactionService.getTransactions(userId);
    const categories = CategoryService.getCategoriesByType('expense');
    
    // Filter to last N months and expenses only
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - months);
    
    const recentExpenses = transactions.filter(t => 
      t.type === 'expense' && 
      new Date(t.date) >= cutoffDate
    );

    // Group by category
    const categoryTotals: { [category: string]: { amount: number; count: number } } = {};
    
    recentExpenses.forEach(transaction => {
      if (!categoryTotals[transaction.category]) {
        categoryTotals[transaction.category] = { amount: 0, count: 0 };
      }
      categoryTotals[transaction.category].amount += transaction.amount;
      categoryTotals[transaction.category].count += 1;
    });

    const totalSpent = Object.values(categoryTotals).reduce((sum, cat) => sum + cat.amount, 0);

    // Convert to chart data with colors
    return Object.entries(categoryTotals)
      .map(([categoryName, data]) => {
        const categoryInfo = categories.find((cat: { name: string; color: string }) => cat.name === categoryName);
        return {
          category: categoryName,
          amount: data.amount,
          percentage: totalSpent > 0 ? (data.amount / totalSpent) * 100 : 0,
          color: categoryInfo?.color || this.generateColor(categoryName),
          transactionCount: data.count,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }

  // Get monthly comparison data
  static getMonthlyComparison(userId: string, months: number = 6): MonthlyComparisonData[] {
    const transactions = TransactionService.getTransactions(userId);
    const budgets = BudgetService.getBudgets(userId);
    
    const monthlyData: MonthlyComparisonData[] = [];
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const monthTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= monthStart && transactionDate <= monthEnd;
      });

      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      // Get budgeted amount for this month
      const monthBudgets = budgets.filter(budget => {
        const budgetStart = new Date(budget.startDate);
        const budgetEnd = new Date(budget.endDate);
        return budgetStart <= monthEnd && budgetEnd >= monthStart;
      });

      const budgetedExpenses = monthBudgets.reduce((sum, budget) => sum + budget.amount, 0);

      monthlyData.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        income,
        expenses,
        savings: income - expenses,
        budgetedExpenses,
      });
    }

    return monthlyData;
  }

  // Get budget analysis
  static getBudgetAnalysis(userId: string): BudgetAnalysisData[] {
    const transactions = TransactionService.getTransactions(userId);
    const budgetStatuses = BudgetService.getBudgetStatuses(userId, transactions);

    return budgetStatuses.map(status => ({
      categoryName: status.categoryName,
      budgeted: status.budgetAmount,
      spent: status.spentAmount,
      remaining: status.remainingAmount,
      percentageUsed: status.percentageUsed,
      status: status.percentageUsed > 100 ? 'over' : 
               status.percentageUsed >= 80 ? 'near' : 'under',
    }));
  }

  // Get goal analysis
  static getGoalAnalysis(userId: string): GoalAnalysisData[] {
    const goals = GoalService.getGoals(userId);
    const goalProgresses = GoalService.getGoalProgresses(userId);

    return goals.map(goal => {
      const progress = goalProgresses.find(p => p.goalId === goal.id);
      const monthsRemaining = Math.max(1, Math.ceil(
        (new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30)
      ));
      
      const monthlyTarget = (goal.targetAmount - goal.currentAmount) / monthsRemaining;
      const expectedProgress = Math.max(0, 100 - (monthsRemaining / 12) * 100); // Assuming 1-year goals
      const onTrack = progress ? progress.progress >= expectedProgress * 0.8 : false; // 80% of expected

      return {
        goalTitle: goal.title,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        progress: progress ? progress.progress : 0,
        daysRemaining: progress ? progress.daysRemaining : 0,
        monthlyTarget,
        onTrack,
      };
    });
  }

  // Calculate financial health score
  static calculateFinancialHealthScore(userId: string): FinancialHealthScore {
    const budgetAnalysis = this.getBudgetAnalysis(userId);
    const goalAnalysis = this.getGoalAnalysis(userId);
    const monthlyData = this.getMonthlyComparison(userId, 6);

    // Calculate savings rate (last 6 months average)
    const totalIncome = monthlyData.reduce((sum, month) => sum + month.income, 0);
    const totalExpenses = monthlyData.reduce((sum, month) => sum + month.expenses, 0);
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

    // Calculate budget adherence
    const budgetAdherence = budgetAnalysis.length > 0 
      ? budgetAnalysis.reduce((sum, budget) => 
          sum + Math.min(100, Math.max(0, 100 - (budget.percentageUsed - 100))), 0
        ) / budgetAnalysis.length
      : 50; // Neutral if no budgets

    // Calculate goal progress
    const avgGoalProgress = goalAnalysis.length > 0
      ? goalAnalysis.reduce((sum, goal) => sum + goal.progress, 0) / goalAnalysis.length
      : 50; // Neutral if no goals

    // Calculate expense variability (lower is better)
    const expenseVariances = monthlyData.map(month => month.expenses);
    const avgExpense = expenseVariances.reduce((sum, exp) => sum + exp, 0) / expenseVariances.length;
    const variance = expenseVariances.reduce((sum, exp) => sum + Math.pow(exp - avgExpense, 2), 0) / expenseVariances.length;
    const standardDeviation = Math.sqrt(variance);
    const coefficientOfVariation = avgExpense > 0 ? (standardDeviation / avgExpense) * 100 : 0;
    const expenseStability = Math.max(0, 100 - coefficientOfVariation);

    // Score individual factors
    const factors = {
      savingsRate: {
        score: Math.min(100, Math.max(0, savingsRate * 5)), // 20% savings = 100 points
        value: savingsRate,
      },
      budgetAdherence: {
        score: budgetAdherence,
        value: budgetAdherence,
      },
      goalProgress: {
        score: avgGoalProgress,
        value: avgGoalProgress,
      },
      expenseVariability: {
        score: expenseStability,
        value: expenseStability,
      },
    };

    // Calculate overall score (weighted average)
    const overallScore = Math.round(
      (factors.savingsRate.score * 0.3) +
      (factors.budgetAdherence.score * 0.25) +
      (factors.goalProgress.score * 0.25) +
      (factors.expenseVariability.score * 0.2)
    );

    // Determine category
    let category: FinancialHealthScore['category'];
    if (overallScore >= 80) category = 'excellent';
    else if (overallScore >= 65) category = 'good';
    else if (overallScore >= 50) category = 'fair';
    else category = 'poor';

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (factors.savingsRate.score < 50) {
      recommendations.push('Increase your savings rate by reducing expenses or increasing income');
    }
    if (factors.budgetAdherence.score < 70) {
      recommendations.push('Improve budget adherence by tracking expenses more closely');
    }
    if (factors.goalProgress.score < 60) {
      recommendations.push('Focus on making consistent progress toward your financial goals');
    }
    if (factors.expenseVariability.score < 60) {
      recommendations.push('Work on stabilizing your monthly expenses');
    }
    if (overallScore >= 80) {
      recommendations.push('Excellent financial health! Consider exploring investment opportunities');
    }

    return {
      score: overallScore,
      category,
      factors,
      recommendations,
    };
  }

  // Get income vs expenses trend
  static getIncomeExpenseTrend(userId: string, days: number = 30): ChartDataPoint[] {
    const transactions = TransactionService.getTransactions(userId);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentTransactions = transactions.filter(t => new Date(t.date) >= cutoffDate);
    
    const dailyData: { [date: string]: { income: number; expenses: number } } = {};

    // Initialize days
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      const dateKey = date.toISOString().split('T')[0];
      dailyData[dateKey] = { income: 0, expenses: 0 };
    }

    // Aggregate transactions
    recentTransactions.forEach(transaction => {
      const dateKey = new Date(transaction.date).toISOString().split('T')[0];
      if (dailyData[dateKey]) {
        if (transaction.type === 'income') {
          dailyData[dateKey].income += transaction.amount;
        } else {
          dailyData[dateKey].expenses += transaction.amount;
        }
      }
    });

    return Object.entries(dailyData).map(([date, data]) => ({
      label: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: data.income - data.expenses,
      color: data.income >= data.expenses ? '#4caf50' : '#f44336',
    }));
  }

  // Generate consistent color for category
  private static generateColor(categoryName: string): string {
    const colors = [
      '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
      '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
      '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800',
      '#ff5722', '#795548', '#9e9e9e', '#607d8b'
    ];
    
    let hash = 0;
    for (let i = 0; i < categoryName.length; i++) {
      hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  }

  // Get top spending categories
  static getTopSpendingCategories(userId: string, limit: number = 5): CategorySpendingData[] {
    return this.getCategorySpending(userId).slice(0, limit);
  }

  // Get spending velocity (spending rate over time)
  static getSpendingVelocity(userId: string): { daily: number; weekly: number; monthly: number } {
    const transactions = TransactionService.getTransactions(userId);
    const expenses = transactions.filter(t => t.type === 'expense');
    
    if (expenses.length === 0) {
      return { daily: 0, weekly: 0, monthly: 0 };
    }

    // Calculate for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentExpenses = expenses.filter(t => new Date(t.date) >= thirtyDaysAgo);
    const totalSpent = recentExpenses.reduce((sum, t) => sum + t.amount, 0);
    
    const daily = totalSpent / 30;
    const weekly = daily * 7;
    const monthly = daily * 30;

    return { daily, weekly, monthly };
  }
}