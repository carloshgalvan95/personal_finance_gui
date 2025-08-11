import type { Transaction } from '../types';
import { LocalStorageService } from './localStorage';

export interface TransactionFilters {
  dateRange?: {
    startDate: Date | null;
    endDate: Date | null;
  };
  categories?: string[];
  amountRange?: {
    min: number | null;
    max: number | null;
  };
  types?: ('income' | 'expense')[];
  searchText?: string;
}

export interface SavedFilter {
  id: string;
  name: string;
  filters: TransactionFilters;
  createdAt: Date;
  lastUsed: Date;
}

const STORAGE_KEYS = {
  SAVED_FILTERS: 'saved_filters',
} as const;

export class FilterService {
  /**
   * Apply filters to a list of transactions
   */
  static applyFilters(transactions: Transaction[], filters: TransactionFilters): Transaction[] {
    let filtered = [...transactions];

    // Date range filter
    if (filters.dateRange?.startDate || filters.dateRange?.endDate) {
      filtered = filtered.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        const startDate = filters.dateRange?.startDate;
        const endDate = filters.dateRange?.endDate;

        if (startDate && transactionDate < startDate) {
          return false;
        }
        if (endDate && transactionDate > endDate) {
          return false;
        }
        return true;
      });
    }

    // Category filter
    if (filters.categories && filters.categories.length > 0) {
      filtered = filtered.filter(transaction =>
        filters.categories!.includes(transaction.category)
      );
    }

    // Amount range filter
    if (filters.amountRange?.min !== null || filters.amountRange?.max !== null) {
      filtered = filtered.filter(transaction => {
        const amount = transaction.amount;
        const min = filters.amountRange?.min;
        const max = filters.amountRange?.max;

        if (min !== null && min !== undefined && amount < min) {
          return false;
        }
        if (max !== null && max !== undefined && amount > max) {
          return false;
        }
        return true;
      });
    }

    // Transaction type filter
    if (filters.types && filters.types.length > 0) {
      filtered = filtered.filter(transaction =>
        filters.types!.includes(transaction.type)
      );
    }

    // Search text filter
    if (filters.searchText && filters.searchText.trim()) {
      const searchTerm = filters.searchText.toLowerCase().trim();
      filtered = filtered.filter(transaction =>
        transaction.description.toLowerCase().includes(searchTerm) ||
        transaction.category.toLowerCase().includes(searchTerm)
      );
    }

    return filtered;
  }

  /**
   * Get quick filter presets
   */
  static getQuickFilters(): { name: string; filters: TransactionFilters }[] {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const last30Days = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const last7Days = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

    return [
      {
        name: 'This Month',
        filters: {
          dateRange: { startDate: startOfMonth, endDate: now }
        }
      },
      {
        name: 'Last Month',
        filters: {
          dateRange: { startDate: lastMonth, endDate: endOfLastMonth }
        }
      },
      {
        name: 'Last 30 Days',
        filters: {
          dateRange: { startDate: last30Days, endDate: now }
        }
      },
      {
        name: 'Last 7 Days',
        filters: {
          dateRange: { startDate: last7Days, endDate: now }
        }
      },
      {
        name: 'This Year',
        filters: {
          dateRange: { startDate: startOfYear, endDate: now }
        }
      },
      {
        name: 'Income Only',
        filters: {
          types: ['income']
        }
      },
      {
        name: 'Expenses Only',
        filters: {
          types: ['expense']
        }
      },
      {
        name: 'Large Expenses (>$500)',
        filters: {
          types: ['expense'],
          amountRange: { min: 500, max: null }
        }
      }
    ];
  }

  /**
   * Save a filter preset
   */
  static saveFilter(userId: string, name: string, filters: TransactionFilters): SavedFilter {
    const savedFilters = this.getSavedFilters(userId);
    const newFilter: SavedFilter = {
      id: `filter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      filters,
      createdAt: new Date(),
      lastUsed: new Date()
    };

    savedFilters.push(newFilter);
    LocalStorageService.set(`${STORAGE_KEYS.SAVED_FILTERS}_${userId}`, savedFilters);
    return newFilter;
  }

  /**
   * Get saved filters for a user
   */
  static getSavedFilters(userId: string): SavedFilter[] {
    const filters = LocalStorageService.get<SavedFilter[]>(`${STORAGE_KEYS.SAVED_FILTERS}_${userId}`) || [];
    // Deserialize dates
    return filters.map(filter => ({
      ...filter,
      createdAt: new Date(filter.createdAt),
      lastUsed: new Date(filter.lastUsed),
      filters: {
        ...filter.filters,
        dateRange: filter.filters.dateRange ? {
          startDate: filter.filters.dateRange.startDate ? new Date(filter.filters.dateRange.startDate) : null,
          endDate: filter.filters.dateRange.endDate ? new Date(filter.filters.dateRange.endDate) : null
        } : undefined
      }
    }));
  }

  /**
   * Update last used timestamp for a saved filter
   */
  static updateFilterLastUsed(userId: string, filterId: string): void {
    const savedFilters = this.getSavedFilters(userId);
    const filterIndex = savedFilters.findIndex(f => f.id === filterId);
    
    if (filterIndex !== -1) {
      savedFilters[filterIndex].lastUsed = new Date();
      LocalStorageService.set(`${STORAGE_KEYS.SAVED_FILTERS}_${userId}`, savedFilters);
    }
  }

  /**
   * Delete a saved filter
   */
  static deleteFilter(userId: string, filterId: string): void {
    const savedFilters = this.getSavedFilters(userId);
    const filteredFilters = savedFilters.filter(f => f.id !== filterId);
    LocalStorageService.set(`${STORAGE_KEYS.SAVED_FILTERS}_${userId}`, filteredFilters);
  }

  /**
   * Get filter statistics
   */
  static getFilterStats(transactions: Transaction[], filters: TransactionFilters): {
    totalCount: number;
    filteredCount: number;
    totalAmount: number;
    filteredAmount: number;
    incomeCount: number;
    expenseCount: number;
  } {
    const filtered = this.applyFilters(transactions, filters);
    
    const filteredIncome = filtered.filter(t => t.type === 'income');
    const filteredExpenses = filtered.filter(t => t.type === 'expense');
    
    return {
      totalCount: transactions.length,
      filteredCount: filtered.length,
      totalAmount: transactions.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0),
      filteredAmount: filtered.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0),
      incomeCount: filteredIncome.length,
      expenseCount: filteredExpenses.length
    };
  }
}