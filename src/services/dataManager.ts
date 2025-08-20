import type { User, Transaction, Budget, FinancialGoal, TransactionCategory, Investment, InvestmentTransaction } from '../types';
import { LocalStorageService, STORAGE_KEYS } from './localStorage';

// Data structure versioning for migrations
export const DATA_VERSION = '1.0.0';

// Enhanced data structure with metadata
export interface AppData {
  version: string;
  timestamp: string;
  user: User | null;
  transactions: Transaction[];
  budgets: Budget[];
  goals: FinancialGoal[];
  categories: TransactionCategory[];
  investments: Investment[];
  investmentTransactions: InvestmentTransaction[];
  settings: AppSettings;
  metadata: DataMetadata;
}

export interface AppSettings {
  currency: string;
  dateFormat: string;
  theme: 'light' | 'dark' | 'auto';
  notifications: {
    budgetAlerts: boolean;
    goalDeadlines: boolean;
    monthlyReports: boolean;
  };
  privacy: {
    analytics: boolean;
    crashReporting: boolean;
  };
}

export interface DataMetadata {
  totalTransactions: number;
  totalBudgets: number;
  totalGoals: number;
  totalInvestments: number;
  totalInvestmentTransactions: number;
  lastBackup: string | null;
  dataSize: number; // in bytes
  created: string;
  lastModified: string;
}

export interface BackupInfo {
  filename: string;
  timestamp: string;
  version: string;
  size: number;
  transactionCount: number;
  budgetCount: number;
  goalCount: number;
}

// Validation schemas
const USER_SCHEMA = {
  required: ['id', 'email', 'name'],
  types: {
    id: 'string',
    email: 'string',
    name: 'string',
    createdAt: 'date',
    updatedAt: 'date',
  },
};

const TRANSACTION_SCHEMA = {
  required: ['id', 'userId', 'type', 'amount', 'category', 'description', 'date'],
  types: {
    id: 'string',
    userId: 'string',
    type: 'string',
    amount: 'number',
    category: 'string',
    description: 'string',
    date: 'date',
    createdAt: 'date',
    updatedAt: 'date',
  },
};

const BUDGET_SCHEMA = {
  required: ['id', 'userId', 'categoryId', 'amount', 'period', 'startDate', 'endDate'],
  types: {
    id: 'string',
    userId: 'string',
    categoryId: 'string',
    amount: 'number',
    period: 'string',
    startDate: 'date',
    endDate: 'date',
    createdAt: 'date',
    updatedAt: 'date',
  },
};

const GOAL_SCHEMA = {
  required: ['id', 'userId', 'title', 'targetAmount', 'currentAmount', 'targetDate', 'status'],
  types: {
    id: 'string',
    userId: 'string',
    title: 'string',
    description: 'string',
    targetAmount: 'number',
    currentAmount: 'number',
    targetDate: 'date',
    status: 'string',
    createdAt: 'date',
    updatedAt: 'date',
  },
};

export class DataManager {
  private static readonly BACKUP_PREFIX = 'personal_finance_backup_';
  private static readonly MAX_BACKUPS = 10;

  // Get default app settings
  static getDefaultSettings(): AppSettings {
    return {
      currency: 'USD',
      dateFormat: 'MM/DD/YYYY',
      theme: 'auto',
      notifications: {
        budgetAlerts: true,
        goalDeadlines: true,
        monthlyReports: false,
      },
      privacy: {
        analytics: false,
        crashReporting: false,
      },
    };
  }

  // Get current app settings
  static getSettings(): AppSettings {
    const settings = LocalStorageService.get<AppSettings>('personal_finance_settings');
    return settings ? { ...this.getDefaultSettings(), ...settings } : this.getDefaultSettings();
  }

  // Update app settings
  static updateSettings(newSettings: Partial<AppSettings>): void {
    const currentSettings = this.getSettings();
    const updatedSettings = { ...currentSettings, ...newSettings };
    LocalStorageService.set('personal_finance_settings', updatedSettings);
  }

  // Validate data against schema
  static validateData(data: any, schema: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check required fields
    for (const field of schema.required) {
      if (!(field in data) || data[field] === null || data[field] === undefined) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Check types
    for (const [field, expectedType] of Object.entries(schema.types)) {
      if (field in data && data[field] !== null && data[field] !== undefined) {
        const value = data[field];
        let isValidType = false;

        switch (expectedType) {
          case 'string':
            isValidType = typeof value === 'string';
            break;
          case 'number':
            isValidType = typeof value === 'number' && !isNaN(value);
            break;
          case 'date':
            isValidType = value instanceof Date || !isNaN(new Date(value).getTime());
            break;
          case 'boolean':
            isValidType = typeof value === 'boolean';
            break;
          default:
            isValidType = true;
        }

        if (!isValidType) {
          errors.push(`Invalid type for field ${field}: expected ${expectedType}, got ${typeof value}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Validate all app data
  static validateAppData(): { isValid: boolean; errors: string[] } {
    const allErrors: string[] = [];

    try {
      // Validate user
      const user = LocalStorageService.get<User>(STORAGE_KEYS.USER);
      if (user) {
        const userValidation = this.validateData(user, USER_SCHEMA);
        if (!userValidation.isValid) {
          allErrors.push(...userValidation.errors.map(err => `User: ${err}`));
        }
      }

      // Validate transactions
      const transactions = LocalStorageService.get<Transaction[]>(STORAGE_KEYS.TRANSACTIONS) || [];
      transactions.forEach((transaction, index) => {
        const validation = this.validateData(transaction, TRANSACTION_SCHEMA);
        if (!validation.isValid) {
          allErrors.push(...validation.errors.map(err => `Transaction ${index}: ${err}`));
        }
      });

      // Validate budgets
      const budgets = LocalStorageService.get<Budget[]>('personal_finance_budgets') || [];
      budgets.forEach((budget, index) => {
        const validation = this.validateData(budget, BUDGET_SCHEMA);
        if (!validation.isValid) {
          allErrors.push(...validation.errors.map(err => `Budget ${index}: ${err}`));
        }
      });

      // Validate goals
      const goals = LocalStorageService.get<FinancialGoal[]>('personal_finance_goals') || [];
      goals.forEach((goal, index) => {
        const validation = this.validateData(goal, GOAL_SCHEMA);
        if (!validation.isValid) {
          allErrors.push(...validation.errors.map(err => `Goal ${index}: ${err}`));
        }
      });

    } catch (error) {
      allErrors.push(`Data validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
    };
  }

  // Get complete app data with metadata
  static getCompleteAppData(): AppData {
    const user = LocalStorageService.get<User>(STORAGE_KEYS.USER);
    const transactions = LocalStorageService.get<Transaction[]>(STORAGE_KEYS.TRANSACTIONS) || [];
    const budgets = LocalStorageService.get<Budget[]>('personal_finance_budgets') || [];
    const goals = LocalStorageService.get<FinancialGoal[]>('personal_finance_goals') || [];
    const categories = LocalStorageService.get<TransactionCategory[]>(STORAGE_KEYS.CATEGORIES) || [];
    const investments = LocalStorageService.get<Investment[]>('personal_finance_investments') || [];
    const investmentTransactions = LocalStorageService.get<InvestmentTransaction[]>('personal_finance_investment_transactions') || [];
    const settings = this.getSettings();

    const dataString = JSON.stringify({ user, transactions, budgets, goals, categories, investments, investmentTransactions, settings });
    const dataSize = new Blob([dataString]).size;

    const metadata: DataMetadata = {
      totalTransactions: transactions.length,
      totalBudgets: budgets.length,
      totalGoals: goals.length,
      totalInvestments: investments.length,
      totalInvestmentTransactions: investmentTransactions.length,
      lastBackup: LocalStorageService.get<string>('personal_finance_last_backup'),
      dataSize,
      created: LocalStorageService.get<string>('personal_finance_data_created') || new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };

    // Store metadata
    LocalStorageService.set('personal_finance_last_backup', metadata.lastBackup);
    if (!LocalStorageService.get('personal_finance_data_created')) {
      LocalStorageService.set('personal_finance_data_created', metadata.created);
    }

    return {
      version: DATA_VERSION,
      timestamp: new Date().toISOString(),
      user,
      transactions,
      budgets,
      goals,
      categories,
      investments,
      investmentTransactions,
      settings,
      metadata,
    };
  }

  // Create backup
  static createBackup(): { success: boolean; filename?: string; error?: string } {
    try {
      const appData = this.getCompleteAppData();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${this.BACKUP_PREFIX}${timestamp}.json`;
      
      // Create backup data
      const backupData = {
        ...appData,
        backupInfo: {
          filename,
          timestamp: appData.timestamp,
          version: appData.version,
          size: appData.metadata.dataSize,
          transactionCount: appData.metadata.totalTransactions,
          budgetCount: appData.metadata.totalBudgets,
          goalCount: appData.metadata.totalGoals,
        } as BackupInfo,
      };

      // Store backup in localStorage (for demo purposes)
      LocalStorageService.set(filename, backupData);

      // Update last backup timestamp
      LocalStorageService.set('personal_finance_last_backup', appData.timestamp);

      // Clean up old backups
      this.cleanupOldBackups();

      return { success: true, filename };
    } catch (error) {
      console.error('Backup creation failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred during backup' 
      };
    }
  }

  // Get available backups
  static getAvailableBackups(): BackupInfo[] {
    const backups: BackupInfo[] = [];
    
    // Get all localStorage keys that start with backup prefix
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.BACKUP_PREFIX)) {
        try {
          const backupData: any = LocalStorageService.get(key);
          if (backupData && backupData.backupInfo) {
            backups.push(backupData.backupInfo);
          }
        } catch (error) {
          console.warn(`Failed to read backup ${key}:`, error);
        }
      }
    }

    // Sort by timestamp (newest first)
    return backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // Restore from backup
  static restoreFromBackup(filename: string): { success: boolean; error?: string } {
    try {
      const backupData: any = LocalStorageService.get(filename);
      
      if (!backupData) {
        return { success: false, error: 'Backup file not found' };
      }

      // Validate backup data structure
      if (!backupData.version || !backupData.user || !Array.isArray(backupData.transactions)) {
        return { success: false, error: 'Invalid backup file format' };
      }

      // Create current backup before restore
      const currentBackup = this.createBackup();
      if (!currentBackup.success) {
        console.warn('Failed to create backup before restore:', currentBackup.error);
      }

      // Restore data
      if (backupData.user) {
        LocalStorageService.set(STORAGE_KEYS.USER, backupData.user);
      }
      
      LocalStorageService.set(STORAGE_KEYS.TRANSACTIONS, backupData.transactions || []);
      LocalStorageService.set('personal_finance_budgets', backupData.budgets || []);
      LocalStorageService.set('personal_finance_goals', backupData.goals || []);
      
      if (backupData.categories) {
        LocalStorageService.set(STORAGE_KEYS.CATEGORIES, backupData.categories);
      }
      
      if (backupData.settings) {
        LocalStorageService.set('personal_finance_settings', backupData.settings);
      }

      return { success: true };
    } catch (error) {
      console.error('Restore failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred during restore' 
      };
    }
  }

  // Export data for download
  static exportData(): { success: boolean; data?: string; filename?: string; error?: string } {
    try {
      const appData = this.getCompleteAppData();
      const dataString = JSON.stringify(appData, null, 2);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `personal-finance-export-${timestamp}.json`;

      return {
        success: true,
        data: dataString,
        filename,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Export failed',
      };
    }
  }

  // Import data from file
  static importData(jsonData: string): { success: boolean; error?: string; warnings?: string[] } {
    try {
      const data = JSON.parse(jsonData);
      const warnings: string[] = [];

      // Validate imported data structure
      if (!data.version) {
        warnings.push('No version information found in import data');
      }

      if (!data.user && !data.transactions && !data.budgets && !data.goals) {
        return { success: false, error: 'No valid data found in import file' };
      }

      // Create backup before import
      const backup = this.createBackup();
      if (!backup.success) {
        warnings.push('Failed to create backup before import');
      }

      // Import data with validation
      if (data.user) {
        const validation = this.validateData(data.user, USER_SCHEMA);
        if (validation.isValid) {
          LocalStorageService.set(STORAGE_KEYS.USER, data.user);
        } else {
          warnings.push(`User data validation failed: ${validation.errors.join(', ')}`);
        }
      }

      if (Array.isArray(data.transactions)) {
        const validTransactions = data.transactions.filter((t: any) => {
          const validation = this.validateData(t, TRANSACTION_SCHEMA);
          if (!validation.isValid) {
            warnings.push(`Invalid transaction skipped: ${validation.errors.join(', ')}`);
            return false;
          }
          return true;
        });
        LocalStorageService.set(STORAGE_KEYS.TRANSACTIONS, validTransactions);
      }

      if (Array.isArray(data.budgets)) {
        const validBudgets = data.budgets.filter((b: any) => {
          const validation = this.validateData(b, BUDGET_SCHEMA);
          if (!validation.isValid) {
            warnings.push(`Invalid budget skipped: ${validation.errors.join(', ')}`);
            return false;
          }
          return true;
        });
        LocalStorageService.set('personal_finance_budgets', validBudgets);
      }

      if (Array.isArray(data.goals)) {
        const validGoals = data.goals.filter((g: any) => {
          const validation = this.validateData(g, GOAL_SCHEMA);
          if (!validation.isValid) {
            warnings.push(`Invalid goal skipped: ${validation.errors.join(', ')}`);
            return false;
          }
          return true;
        });
        LocalStorageService.set('personal_finance_goals', validGoals);
      }

      if (data.settings) {
        LocalStorageService.set('personal_finance_settings', data.settings);
      }

      return { success: true, warnings: warnings.length > 0 ? warnings : undefined };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse import data',
      };
    }
  }

  // Clean up old backups
  private static cleanupOldBackups(): void {
    const backups = this.getAvailableBackups();
    
    if (backups.length > this.MAX_BACKUPS) {
      const backupsToDelete = backups.slice(this.MAX_BACKUPS);
      
      backupsToDelete.forEach(backup => {
        try {
          LocalStorageService.remove(backup.filename);
        } catch (error) {
          console.warn(`Failed to delete old backup ${backup.filename}:`, error);
        }
      });
    }
  }

  // Clear all data (with confirmation)
  static clearAllData(): { success: boolean; error?: string } {
    try {
      // Create final backup
      const backup = this.createBackup();
      if (!backup.success) {
        console.warn('Failed to create final backup before clearing data');
      }

      // Clear all app data
      LocalStorageService.remove(STORAGE_KEYS.USER);
      LocalStorageService.remove(STORAGE_KEYS.TRANSACTIONS);
      LocalStorageService.remove('personal_finance_budgets');
      LocalStorageService.remove('personal_finance_goals');
      LocalStorageService.remove(STORAGE_KEYS.CATEGORIES);
      LocalStorageService.remove('personal_finance_settings');
      LocalStorageService.remove('personal_finance_data_created');
      LocalStorageService.remove('personal_finance_last_backup');

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to clear data',
      };
    }
  }

  // Get data statistics
  static getDataStatistics(): DataMetadata {
    const appData = this.getCompleteAppData();
    return appData.metadata;
  }

  // Check data integrity
  static checkDataIntegrity(): { isHealthy: boolean; issues: string[]; suggestions: string[] } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    try {
      // Check data validation
      const validation = this.validateAppData();
      if (!validation.isValid) {
        issues.push(...validation.errors);
      }

      // Check for orphaned data
      const user = LocalStorageService.get<User>(STORAGE_KEYS.USER);
      const transactions = LocalStorageService.get<Transaction[]>(STORAGE_KEYS.TRANSACTIONS) || [];
      const budgets = LocalStorageService.get<Budget[]>('personal_finance_budgets') || [];
      const goals = LocalStorageService.get<FinancialGoal[]>('personal_finance_goals') || [];

      if (user) {
        const orphanedTransactions = transactions.filter(t => t.userId !== user.id);
        const orphanedBudgets = budgets.filter(b => b.userId !== user.id);
        const orphanedGoals = goals.filter(g => g.userId !== user.id);

        if (orphanedTransactions.length > 0) {
          issues.push(`Found ${orphanedTransactions.length} orphaned transactions`);
          suggestions.push('Consider cleaning up orphaned transactions');
        }

        if (orphanedBudgets.length > 0) {
          issues.push(`Found ${orphanedBudgets.length} orphaned budgets`);
          suggestions.push('Consider cleaning up orphaned budgets');
        }

        if (orphanedGoals.length > 0) {
          issues.push(`Found ${orphanedGoals.length} orphaned goals`);
          suggestions.push('Consider cleaning up orphaned goals');
        }
      }

      // Check backup status
      const lastBackup = LocalStorageService.get<string>('personal_finance_last_backup');
      if (!lastBackup) {
        suggestions.push('Consider creating your first backup');
      } else {
        const daysSinceBackup = Math.floor(
          (new Date().getTime() - new Date(lastBackup).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceBackup > 7) {
          suggestions.push(`Last backup was ${daysSinceBackup} days ago - consider creating a new backup`);
        }
      }

      // Check data size
      const stats = this.getDataStatistics();
      if (stats.dataSize > 1024 * 1024) { // 1MB
        suggestions.push('Data size is getting large - consider exporting and archiving old data');
      }

    } catch (error) {
      issues.push(`Integrity check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      isHealthy: issues.length === 0,
      issues,
      suggestions,
    };
  }
}