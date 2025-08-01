/**
 * LocalStorage service for managing data persistence
 */

export class LocalStorageService {
  /**
   * Get data from localStorage
   */
  static get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      return JSON.parse(item);
    } catch (error) {
      console.error(`Error getting item from localStorage:`, error);
      return null;
    }
  }

  /**
   * Set data in localStorage
   */
  static set<T>(key: string, value: T): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error setting item in localStorage:`, error);
      return false;
    }
  }

  /**
   * Remove data from localStorage
   */
  static remove(key: string): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing item from localStorage:`, error);
      return false;
    }
  }

  /**
   * Clear all data from localStorage
   */
  static clear(): boolean {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error(`Error clearing localStorage:`, error);
      return false;
    }
  }

  /**
   * Check if key exists in localStorage
   */
  static exists(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }

  /**
   * Get all keys from localStorage
   */
  static getAllKeys(): string[] {
    try {
      return Object.keys(localStorage);
    } catch (error) {
      console.error(`Error getting localStorage keys:`, error);
      return [];
    }
  }
}

// Storage keys constants
export const STORAGE_KEYS = {
  USER: 'personal_finance_user',
  TRANSACTIONS: 'personal_finance_transactions',
  CATEGORIES: 'personal_finance_categories',
  BUDGETS: 'personal_finance_budgets',
  GOALS: 'personal_finance_goals',
  AUTH_TOKEN: 'personal_finance_auth_token',
} as const;
