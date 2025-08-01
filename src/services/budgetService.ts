import type { Budget, BudgetForm, BudgetStatus, Transaction } from '../types';
import { LocalStorageService } from './localStorage';
import { generateId } from '../utils';

const BUDGETS_KEY = 'personal_finance_budgets';

export class BudgetService {
  // Get all budgets for a user
  static getBudgets(userId: string): Budget[] {
    const budgets = LocalStorageService.get<Budget[]>(BUDGETS_KEY) || [];
    return budgets
      .filter(budget => budget.userId === userId)
      .map(budget => ({
        ...budget,
        // Ensure dates are properly converted back to Date objects
        startDate: new Date(budget.startDate),
        endDate: new Date(budget.endDate),
        createdAt: new Date(budget.createdAt),
        updatedAt: new Date(budget.updatedAt),
      }));
  }

  // Get budget by ID
  static getBudgetById(budgetId: string): Budget | null {
    const budgets = LocalStorageService.get<Budget[]>(BUDGETS_KEY) || [];
    const budget = budgets.find(budget => budget.id === budgetId);
    
    if (!budget) return null;
    
    // Ensure dates are properly converted back to Date objects
    return {
      ...budget,
      startDate: new Date(budget.startDate),
      endDate: new Date(budget.endDate),
      createdAt: new Date(budget.createdAt),
      updatedAt: new Date(budget.updatedAt),
    };
  }

  // Create a new budget
  static createBudget(userId: string, budgetData: BudgetForm): Budget {
    const budgets = LocalStorageService.get<Budget[]>(BUDGETS_KEY) || [];
    
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = budgetData.period === 'monthly' 
      ? new Date(now.getFullYear(), now.getMonth() + 1, 0)
      : new Date(now.getFullYear() + 1, now.getMonth(), 0);

    const newBudget: Budget = {
      id: generateId(),
      userId,
      categoryId: budgetData.categoryId,
      amount: parseFloat(budgetData.amount),
      period: budgetData.period,
      startDate,
      endDate,
      createdAt: now,
      updatedAt: now,
    };

    budgets.push(newBudget);
    LocalStorageService.set(BUDGETS_KEY, budgets);
    
    return newBudget;
  }

  // Update an existing budget
  static updateBudget(budgetId: string, budgetData: Partial<BudgetForm>): Budget | null {
    const budgets = LocalStorageService.get<Budget[]>(BUDGETS_KEY) || [];
    const budgetIndex = budgets.findIndex(budget => budget.id === budgetId);
    
    if (budgetIndex === -1) return null;

    const updatedBudget = {
      ...budgets[budgetIndex],
      ...budgetData,
      amount: budgetData.amount ? parseFloat(budgetData.amount) : budgets[budgetIndex].amount,
      updatedAt: new Date(),
    };

    budgets[budgetIndex] = updatedBudget;
    LocalStorageService.set(BUDGETS_KEY, budgets);
    
    return updatedBudget;
  }

  // Delete a budget
  static deleteBudget(budgetId: string): boolean {
    const budgets = LocalStorageService.get<Budget[]>(BUDGETS_KEY) || [];
    const initialLength = budgets.length;
    const filteredBudgets = budgets.filter(budget => budget.id !== budgetId);
    
    if (filteredBudgets.length < initialLength) {
      LocalStorageService.set(BUDGETS_KEY, filteredBudgets);
      return true;
    }
    
    return false;
  }

  // Calculate budget status for all budgets
  static getBudgetStatuses(userId: string, transactions: Transaction[]): BudgetStatus[] {
    const budgets = this.getBudgets(userId);
    const categories = this.getCategories();
    
    return budgets.map(budget => {
      const category = categories.find(cat => cat.id === budget.categoryId);
      const categoryName = category?.name || 'Unknown Category';
      
      // Filter transactions for this category and period
      const categoryTransactions = transactions.filter(transaction => 
        transaction.category === categoryName &&
        transaction.type === 'expense' &&
        new Date(transaction.date) >= new Date(budget.startDate) &&
        new Date(transaction.date) <= new Date(budget.endDate)
      );
      
      const spentAmount = categoryTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
      const remainingAmount = Math.max(0, budget.amount - spentAmount);
      const percentageUsed = budget.amount > 0 ? (spentAmount / budget.amount) * 100 : 0;
      
      return {
        categoryId: budget.categoryId,
        categoryName,
        budgetAmount: budget.amount,
        spentAmount,
        remainingAmount,
        percentageUsed: Math.min(100, percentageUsed),
      };
    });
  }

  // Get budget status for a specific category
  static getBudgetStatusForCategory(userId: string, categoryId: string, transactions: Transaction[]): BudgetStatus | null {
    const budget = this.getBudgets(userId).find(b => b.categoryId === categoryId);
    if (!budget) return null;

    const categories = this.getCategories();
    const category = categories.find(cat => cat.id === categoryId);
    const categoryName = category?.name || 'Unknown Category';
    
    const categoryTransactions = transactions.filter(transaction => 
      transaction.category === categoryName &&
      transaction.type === 'expense' &&
      new Date(transaction.date) >= new Date(budget.startDate) &&
      new Date(transaction.date) <= new Date(budget.endDate)
    );
    
    const spentAmount = categoryTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
    const remainingAmount = Math.max(0, budget.amount - spentAmount);
    const percentageUsed = budget.amount > 0 ? (spentAmount / budget.amount) * 100 : 0;
    
    return {
      categoryId: budget.categoryId,
      categoryName,
      budgetAmount: budget.amount,
      spentAmount,
      remainingAmount,
      percentageUsed: Math.min(100, percentageUsed),
    };
  }

  // Get available categories (reusing from transaction service)
  private static getCategories() {
    return [
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
  }

  // Get expense categories only (for budget creation)
  static getExpenseCategories() {
    return this.getCategories().filter(category => category.type === 'expense');
  }

  // Check if user is over budget for any category
  static getOverBudgetCategories(userId: string, transactions: Transaction[]): BudgetStatus[] {
    const budgetStatuses = this.getBudgetStatuses(userId, transactions);
    return budgetStatuses.filter(status => status.percentageUsed > 100);
  }

  // Get budget alerts (categories approaching budget limit)
  static getBudgetAlerts(userId: string, transactions: Transaction[], threshold: number = 80): BudgetStatus[] {
    const budgetStatuses = this.getBudgetStatuses(userId, transactions);
    return budgetStatuses.filter(status => 
      status.percentageUsed >= threshold && status.percentageUsed <= 100
    );
  }


}