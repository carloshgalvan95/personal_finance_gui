import type { Transaction, TransactionCategory } from '../types';
import { LocalStorageService, STORAGE_KEYS } from './localStorage';
import { generateId } from '../utils';

export class TransactionService {
  /**
   * Get all transactions for the current user
   */
  static getTransactions(userId: string): Transaction[] {
    const transactions =
      LocalStorageService.get<Transaction[]>(STORAGE_KEYS.TRANSACTIONS) || [];
    return transactions
      .filter((transaction) => transaction.userId === userId)
      .map((transaction) => ({
        ...transaction,
        // Ensure dates are properly converted back to Date objects
        date: new Date(transaction.date),
        createdAt: new Date(transaction.createdAt),
        updatedAt: new Date(transaction.updatedAt),
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  /**
   * Get transaction by ID
   */
  static getTransactionById(id: string): Transaction | null {
    const transactions =
      LocalStorageService.get<Transaction[]>(STORAGE_KEYS.TRANSACTIONS) || [];
    const transaction = transactions.find((transaction) => transaction.id === id);
    
    if (!transaction) return null;
    
    // Ensure dates are properly converted back to Date objects
    return {
      ...transaction,
      date: new Date(transaction.date),
      createdAt: new Date(transaction.createdAt),
      updatedAt: new Date(transaction.updatedAt),
    };
  }

  /**
   * Create a new transaction
   */
  static createTransaction(
    userId: string,
    transactionData: Omit<
      Transaction,
      'id' | 'userId' | 'createdAt' | 'updatedAt'
    >
  ): Transaction {
    const transactions =
      LocalStorageService.get<Transaction[]>(STORAGE_KEYS.TRANSACTIONS) || [];

    const newTransaction: Transaction = {
      ...transactionData,
      // Ensure date is stored as ISO string for consistent handling
      date: typeof transactionData.date === 'string' 
        ? new Date(transactionData.date) 
        : transactionData.date,
      id: generateId(),
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    transactions.push(newTransaction);
    LocalStorageService.set(STORAGE_KEYS.TRANSACTIONS, transactions);

    return newTransaction;
  }

  /**
   * Update an existing transaction
   */
  static updateTransaction(
    id: string,
    updates: Partial<Omit<Transaction, 'id' | 'userId' | 'createdAt'>>
  ): Transaction | null {
    const transactions =
      LocalStorageService.get<Transaction[]>(STORAGE_KEYS.TRANSACTIONS) || [];
    const index = transactions.findIndex(
      (transaction) => transaction.id === id
    );

    if (index === -1) {
      return null;
    }

    const updatedTransaction = {
      ...transactions[index],
      ...updates,
      updatedAt: new Date(),
    };

    transactions[index] = updatedTransaction;
    LocalStorageService.set(STORAGE_KEYS.TRANSACTIONS, transactions);

    return updatedTransaction;
  }

  /**
   * Delete a transaction
   */
  static deleteTransaction(id: string): boolean {
    const transactions =
      LocalStorageService.get<Transaction[]>(STORAGE_KEYS.TRANSACTIONS) || [];
    const filteredTransactions = transactions.filter(
      (transaction) => transaction.id !== id
    );

    if (filteredTransactions.length === transactions.length) {
      return false; // Transaction not found
    }

    LocalStorageService.set(STORAGE_KEYS.TRANSACTIONS, filteredTransactions);
    return true;
  }

  /**
   * Get transactions by date range
   */
  static getTransactionsByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Transaction[] {
    const transactions = this.getTransactions(userId);
    return transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
  }

  /**
   * Get transactions by category
   */
  static getTransactionsByCategory(
    userId: string,
    category: string
  ): Transaction[] {
    const transactions = this.getTransactions(userId);
    return transactions.filter(
      (transaction) => transaction.category === category
    );
  }

  /**
   * Get transactions by type
   */
  static getTransactionsByType(
    userId: string,
    type: 'income' | 'expense'
  ): Transaction[] {
    const transactions = this.getTransactions(userId);
    return transactions.filter((transaction) => transaction.type === type);
  }

  /**
   * Get total income for a user
   */
  static getTotalIncome(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): number {
    let transactions = this.getTransactionsByType(userId, 'income');

    if (startDate && endDate) {
      transactions = transactions.filter((transaction) => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= startDate && transactionDate <= endDate;
      });
    }

    return transactions.reduce(
      (total, transaction) => total + transaction.amount,
      0
    );
  }

  /**
   * Get total expenses for a user
   */
  static getTotalExpenses(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): number {
    let transactions = this.getTransactionsByType(userId, 'expense');

    if (startDate && endDate) {
      transactions = transactions.filter((transaction) => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= startDate && transactionDate <= endDate;
      });
    }

    return transactions.reduce(
      (total, transaction) => total + transaction.amount,
      0
    );
  }

  /**
   * Get net income (income - expenses) for a user
   */
  static getNetIncome(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): number {
    const totalIncome = this.getTotalIncome(userId, startDate, endDate);
    const totalExpenses = this.getTotalExpenses(userId, startDate, endDate);
    return totalIncome - totalExpenses;
  }

  /**
   * Search transactions by description
   */
  static searchTransactions(userId: string, searchTerm: string): Transaction[] {
    const transactions = this.getTransactions(userId);
    const lowercaseSearch = searchTerm.toLowerCase();

    return transactions.filter(
      (transaction) =>
        transaction.description.toLowerCase().includes(lowercaseSearch) ||
        transaction.category.toLowerCase().includes(lowercaseSearch)
    );
  }
}

export class CategoryService {
  /**
   * Get default categories
   */
  static getDefaultCategories(): TransactionCategory[] {
    return [
      {
        id: 'salary',
        name: 'Salary',
        type: 'income',
        color: '#4caf50',
        icon: 'Work',
      },
      {
        id: 'freelance',
        name: 'Freelance',
        type: 'income',
        color: '#2196f3',
        icon: 'BusinessCenter',
      },
      {
        id: 'investments',
        name: 'Investments',
        type: 'income',
        color: '#ff9800',
        icon: 'TrendingUp',
      },
      {
        id: 'other-income',
        name: 'Other Income',
        type: 'income',
        color: '#9c27b0',
        icon: 'AttachMoney',
      },

      {
        id: 'food',
        name: 'Food & Dining',
        type: 'expense',
        color: '#f44336',
        icon: 'Restaurant',
      },
      {
        id: 'transportation',
        name: 'Transportation',
        type: 'expense',
        color: '#3f51b5',
        icon: 'DirectionsCar',
      },
      {
        id: 'shopping',
        name: 'Shopping',
        type: 'expense',
        color: '#e91e63',
        icon: 'ShoppingCart',
      },
      {
        id: 'entertainment',
        name: 'Entertainment',
        type: 'expense',
        color: '#9c27b0',
        icon: 'Movie',
      },
      {
        id: 'utilities',
        name: 'Utilities',
        type: 'expense',
        color: '#607d8b',
        icon: 'ElectricBolt',
      },
      {
        id: 'healthcare',
        name: 'Healthcare',
        type: 'expense',
        color: '#4caf50',
        icon: 'LocalHospital',
      },
      {
        id: 'education',
        name: 'Education',
        type: 'expense',
        color: '#ff9800',
        icon: 'School',
      },
      {
        id: 'other-expense',
        name: 'Other Expenses',
        type: 'expense',
        color: '#795548',
        icon: 'Category',
      },
    ];
  }

  /**
   * Get all categories (default + custom)
   */
  static getCategories(): TransactionCategory[] {
    const customCategories =
      LocalStorageService.get<TransactionCategory[]>(STORAGE_KEYS.CATEGORIES) ||
      [];
    const defaultCategories = this.getDefaultCategories();

    return [...defaultCategories, ...customCategories];
  }

  /**
   * Get categories by type
   */
  static getCategoriesByType(
    type: 'income' | 'expense'
  ): TransactionCategory[] {
    return this.getCategories().filter((category) => category.type === type);
  }

  /**
   * Get category by ID
   */
  static getCategoryById(id: string): TransactionCategory | null {
    return this.getCategories().find((category) => category.id === id) || null;
  }

  /**
   * Create a custom category
   */
  static createCategory(
    categoryData: Omit<TransactionCategory, 'id'>
  ): TransactionCategory {
    const customCategories =
      LocalStorageService.get<TransactionCategory[]>(STORAGE_KEYS.CATEGORIES) ||
      [];

    const newCategory: TransactionCategory = {
      ...categoryData,
      id: generateId(),
    };

    customCategories.push(newCategory);
    LocalStorageService.set(STORAGE_KEYS.CATEGORIES, customCategories);

    return newCategory;
  }


}
