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
        name: 'Salary & Wages',
        type: 'income',
        color: '#4caf50',
        icon: 'Work',
      },
      {
        id: 'freelance',
        name: 'Freelance & Consulting',
        type: 'income',
        color: '#2196f3',
        icon: 'BusinessCenter',
      },
      {
        id: 'business',
        name: 'Business Income',
        type: 'income',
        color: '#ff9800',
        icon: 'Business',
      },
      {
        id: 'investments',
        name: 'Investments & Dividends',
        type: 'income',
        color: '#9c27b0',
        icon: 'TrendingUp',
      },
      {
        id: 'rental',
        name: 'Rental Income',
        type: 'income',
        color: '#607d8b',
        icon: 'Home',
      },
      {
        id: 'side-hustle',
        name: 'Side Hustle',
        type: 'income',
        color: '#e91e63',
        icon: 'Handyman',
      },
      {
        id: 'bonus',
        name: 'Bonus & Commission',
        type: 'income',
        color: '#00bcd4',
        icon: 'EmojiEvents',
      },
      {
        id: 'refunds',
        name: 'Refunds & Cashback',
        type: 'income',
        color: '#8bc34a',
        icon: 'MoneyOff',
      },
      {
        id: 'gifts-received',
        name: 'Gifts Received',
        type: 'income',
        color: '#f44336',
        icon: 'CardGiftcard',
      },
      {
        id: 'other-income',
        name: 'Other Income',
        type: 'income',
        color: '#795548',
        icon: 'AttachMoney',
      },

      // Housing & Living
      {
        id: 'housing',
        name: 'Housing & Rent',
        type: 'expense',
        color: '#8bc34a',
        icon: 'Home',
      },
      {
        id: 'utilities',
        name: 'Utilities',
        type: 'expense',
        color: '#607d8b',
        icon: 'ElectricBolt',
      },
      {
        id: 'internet-phone',
        name: 'Internet & Phone',
        type: 'expense',
        color: '#00bcd4',
        icon: 'Wifi',
      },
      {
        id: 'insurance',
        name: 'Insurance',
        type: 'expense',
        color: '#673ab7',
        icon: 'Security',
      },

      // Food & Groceries
      {
        id: 'groceries',
        name: 'Groceries',
        type: 'expense',
        color: '#4caf50',
        icon: 'ShoppingBasket',
      },
      {
        id: 'restaurants',
        name: 'Restaurants & Dining',
        type: 'expense',
        color: '#f44336',
        icon: 'Restaurant',
      },
      {
        id: 'coffee-snacks',
        name: 'Coffee & Snacks',
        type: 'expense',
        color: '#795548',
        icon: 'LocalCafe',
      },

      // Transportation
      {
        id: 'transportation',
        name: 'Transportation',
        type: 'expense',
        color: '#3f51b5',
        icon: 'DirectionsCar',
      },
      {
        id: 'gas-fuel',
        name: 'Gas & Fuel',
        type: 'expense',
        color: '#ff5722',
        icon: 'LocalGasStation',
      },
      {
        id: 'public-transport',
        name: 'Public Transport',
        type: 'expense',
        color: '#2196f3',
        icon: 'Train',
      },
      {
        id: 'car-maintenance',
        name: 'Car Maintenance',
        type: 'expense',
        color: '#9e9e9e',
        icon: 'Build',
      },

      // Health & Personal Care
      {
        id: 'healthcare',
        name: 'Healthcare & Medical',
        type: 'expense',
        color: '#e91e63',
        icon: 'LocalHospital',
      },
      {
        id: 'pharmacy',
        name: 'Pharmacy & Medications',
        type: 'expense',
        color: '#009688',
        icon: 'LocalPharmacy',
      },
      {
        id: 'fitness',
        name: 'Fitness & Gym',
        type: 'expense',
        color: '#ff9800',
        icon: 'FitnessCenter',
      },
      {
        id: 'personal-care',
        name: 'Personal Care',
        type: 'expense',
        color: '#e91e63',
        icon: 'Face',
      },

      // Shopping & Lifestyle
      {
        id: 'clothing',
        name: 'Clothing & Fashion',
        type: 'expense',
        color: '#9c27b0',
        icon: 'Checkroom',
      },
      {
        id: 'electronics',
        name: 'Electronics & Tech',
        type: 'expense',
        color: '#607d8b',
        icon: 'Devices',
      },
      {
        id: 'home-improvement',
        name: 'Home & Garden',
        type: 'expense',
        color: '#4caf50',
        icon: 'Yard',
      },
      {
        id: 'gifts',
        name: 'Gifts & Donations',
        type: 'expense',
        color: '#f44336',
        icon: 'CardGiftcard',
      },

      // Entertainment & Leisure
      {
        id: 'entertainment',
        name: 'Entertainment',
        type: 'expense',
        color: '#9c27b0',
        icon: 'Movie',
      },
      {
        id: 'subscriptions',
        name: 'Subscriptions & Streaming',
        type: 'expense',
        color: '#ff5722',
        icon: 'Subscriptions',
      },
      {
        id: 'hobbies',
        name: 'Hobbies & Sports',
        type: 'expense',
        color: '#00bcd4',
        icon: 'SportsBaseball',
      },
      {
        id: 'travel',
        name: 'Travel & Vacation',
        type: 'expense',
        color: '#ff9800',
        icon: 'Flight',
      },

      // Financial & Professional
      {
        id: 'education',
        name: 'Education & Learning',
        type: 'expense',
        color: '#2196f3',
        icon: 'School',
      },
      {
        id: 'bank-fees',
        name: 'Bank Fees & Charges',
        type: 'expense',
        color: '#795548',
        icon: 'AccountBalance',
      },
      {
        id: 'taxes',
        name: 'Taxes',
        type: 'expense',
        color: '#607d8b',
        icon: 'Receipt',
      },
      {
        id: 'savings-investment',
        name: 'Savings & Investments',
        type: 'expense',
        color: '#4caf50',
        icon: 'Savings',
      },

      // Miscellaneous
      {
        id: 'pet-care',
        name: 'Pet Care',
        type: 'expense',
        color: '#8bc34a',
        icon: 'Pets',
      },
      {
        id: 'childcare',
        name: 'Childcare & Kids',
        type: 'expense',
        color: '#ffc107',
        icon: 'ChildCare',
      },
      {
        id: 'other-expense',
        name: 'Other Expenses',
        type: 'expense',
        color: '#9e9e9e',
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
