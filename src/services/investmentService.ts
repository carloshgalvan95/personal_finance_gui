import type { 
  Investment, 
  InvestmentTransaction, 
  Portfolio, 
  InvestmentPerformance, 
  AssetPrice 
} from '../types';
import { LocalStorageService } from './localStorage';
import { MarketDataService } from './marketDataService';

export class InvestmentService {
  private static readonly INVESTMENTS_KEY = 'personal_finance_investments';
  private static readonly INVESTMENT_TRANSACTIONS_KEY = 'personal_finance_investment_transactions';

  /**
   * Get all investments for a user
   */
  static getInvestments(userId: string): Investment[] {
    const investments = LocalStorageService.get<Investment[]>(this.INVESTMENTS_KEY) || [];
    return investments
      .filter(investment => investment.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Get investment by ID
   */
  static getInvestmentById(id: string): Investment | null {
    const investments = LocalStorageService.get<Investment[]>(this.INVESTMENTS_KEY) || [];
    return investments.find(investment => investment.id === id) || null;
  }

  /**
   * Add a new investment or consolidate with existing one
   */
  static addInvestment(userId: string, investmentData: {
    symbol: string;
    type: 'etf' | 'cryptocurrency' | 'stock';
    name: string;
    quantity: number;
    purchasePrice: number;
    purchaseDate: Date;
  }): Investment {
    const investments = LocalStorageService.get<Investment[]>(this.INVESTMENTS_KEY) || [];
    
    // Check if user already owns this symbol
    const existingInvestment = investments.find(
      inv => inv.userId === userId && inv.symbol === investmentData.symbol
    );

    if (existingInvestment) {
      // Consolidate with existing investment
      // First, add the new transaction
      this.addInvestmentTransaction(userId, {
        investmentId: existingInvestment.id,
        type: 'buy',
        quantity: investmentData.quantity,
        price: investmentData.purchasePrice,
        fees: 0,
        date: investmentData.purchaseDate,
      });

      // The updateInvestmentFromTransactions method will recalculate the average price
      // and total quantity based on all transactions
      return existingInvestment;
    } else {
      // Create new investment for first-time purchase
      const newInvestment: Investment = {
        id: this.generateId(),
        userId,
        ...investmentData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      investments.push(newInvestment);
      LocalStorageService.set(this.INVESTMENTS_KEY, investments);

      // Create initial investment transaction
      this.addInvestmentTransaction(userId, {
        investmentId: newInvestment.id,
        type: 'buy',
        quantity: investmentData.quantity,
        price: investmentData.purchasePrice,
        fees: 0,
        date: investmentData.purchaseDate,
      });

      return newInvestment;
    }
  }

  /**
   * Update an investment
   */
  static updateInvestment(id: string, updates: Partial<Investment>): Investment | null {
    const investments = LocalStorageService.get<Investment[]>(this.INVESTMENTS_KEY) || [];
    const index = investments.findIndex(investment => investment.id === id);
    
    if (index === -1) {
      return null;
    }

    investments[index] = {
      ...investments[index],
      ...updates,
      updatedAt: new Date(),
    };

    LocalStorageService.set(this.INVESTMENTS_KEY, investments);
    return investments[index];
  }

  /**
   * Delete an investment
   */
  static deleteInvestment(id: string): boolean {
    const investments = LocalStorageService.get<Investment[]>(this.INVESTMENTS_KEY) || [];
    const filteredInvestments = investments.filter(investment => investment.id !== id);
    
    if (filteredInvestments.length === investments.length) {
      return false; // Investment not found
    }

    LocalStorageService.set(this.INVESTMENTS_KEY, filteredInvestments);

    // Also delete related transactions
    const transactions = LocalStorageService.get<InvestmentTransaction[]>(this.INVESTMENT_TRANSACTIONS_KEY) || [];
    const filteredTransactions = transactions.filter(transaction => transaction.investmentId !== id);
    LocalStorageService.set(this.INVESTMENT_TRANSACTIONS_KEY, filteredTransactions);

    return true;
  }

  /**
   * Add investment transaction (buy/sell)
   */
  static addInvestmentTransaction(userId: string, transactionData: {
    investmentId: string;
    type: 'buy' | 'sell';
    quantity: number;
    price: number;
    fees: number;
    date: Date;
  }): InvestmentTransaction {
    const transactions = LocalStorageService.get<InvestmentTransaction[]>(this.INVESTMENT_TRANSACTIONS_KEY) || [];
    
    const newTransaction: InvestmentTransaction = {
      id: this.generateId(),
      userId,
      ...transactionData,
      createdAt: new Date(),
    };

    transactions.push(newTransaction);
    LocalStorageService.set(this.INVESTMENT_TRANSACTIONS_KEY, transactions);

    // Update investment quantity and average price
    this.updateInvestmentFromTransactions(transactionData.investmentId);

    return newTransaction;
  }

  /**
   * Get investment transactions for a specific investment
   */
  static getInvestmentTransactions(investmentId: string): InvestmentTransaction[] {
    const transactions = LocalStorageService.get<InvestmentTransaction[]>(this.INVESTMENT_TRANSACTIONS_KEY) || [];
    return transactions
      .filter(transaction => transaction.investmentId === investmentId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  /**
   * Update investment based on all its transactions
   */
  private static updateInvestmentFromTransactions(investmentId: string): void {
    const transactions = this.getInvestmentTransactions(investmentId);
    const investment = this.getInvestmentById(investmentId);
    
    if (!investment) return;

    let totalQuantity = 0;
    let totalCost = 0;

    transactions.forEach(transaction => {
      if (transaction.type === 'buy') {
        totalQuantity += transaction.quantity;
        totalCost += transaction.quantity * transaction.price + transaction.fees;
      } else if (transaction.type === 'sell') {
        totalQuantity -= transaction.quantity;
        totalCost -= transaction.quantity * transaction.price - transaction.fees;
      }
    });

    const averagePrice = totalQuantity > 0 ? totalCost / totalQuantity : 0;

    this.updateInvestment(investmentId, {
      quantity: totalQuantity,
      purchasePrice: averagePrice,
    });
  }

  /**
   * Get portfolio overview for a user
   */
  static async getPortfolio(userId: string): Promise<Portfolio> {
    const investments = this.getInvestments(userId);
    
    if (investments.length === 0) {
      return {
        id: userId,
        userId,
        totalValue: 0,
        totalInvested: 0,
        totalGainLoss: 0,
        totalGainLossPercent: 0,
        investments: [],
        lastUpdated: new Date(),
      };
    }

    // Fetch current prices for all investments
    const uniqueSymbols = [...new Set(investments.map(inv => inv.symbol))];
    const currentPrices = await this.getCurrentPrices(uniqueSymbols);
    const priceMap = new Map(currentPrices.map(price => [price.symbol, price]));

    // Update investments with current prices
    const updatedInvestments = investments.map(investment => {
      const currentPriceData = priceMap.get(investment.symbol);
      return {
        ...investment,
        currentPrice: currentPriceData?.price || 0,
        lastUpdated: currentPriceData?.lastUpdated || new Date(),
      };
    });

    // Calculate portfolio totals
    let totalValue = 0;
    let totalInvested = 0;

    updatedInvestments.forEach(investment => {
      const currentValue = investment.quantity * (investment.currentPrice || 0);
      const investedValue = investment.quantity * investment.purchasePrice;
      
      totalValue += currentValue;
      totalInvested += investedValue;
    });

    const totalGainLoss = totalValue - totalInvested;
    const totalGainLossPercent = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

    return {
      id: userId,
      userId,
      totalValue,
      totalInvested,
      totalGainLoss,
      totalGainLossPercent,
      investments: updatedInvestments,
      lastUpdated: new Date(),
    };
  }

  /**
   * Get detailed performance for all investments
   */
  static async getInvestmentPerformance(userId: string): Promise<InvestmentPerformance[]> {
    const investments = this.getInvestments(userId);
    
    if (investments.length === 0) {
      return [];
    }

    // Get current prices
    const uniqueSymbols = [...new Set(investments.map(inv => inv.symbol))];
    const currentPrices = await this.getCurrentPrices(uniqueSymbols);
    const priceMap = new Map(currentPrices.map(price => [price.symbol, price]));

    return investments.map(investment => {
      const currentPriceData = priceMap.get(investment.symbol);
      const currentPrice = currentPriceData?.price || 0;
      const currentValue = investment.quantity * currentPrice;
      const investedValue = investment.quantity * investment.purchasePrice;
      const gainLoss = currentValue - investedValue;
      const gainLossPercent = investedValue > 0 ? (gainLoss / investedValue) * 100 : 0;
      
      const assetInfo = MarketDataService.getAssetInfo(investment.symbol);

      return {
        symbol: investment.symbol,
        name: assetInfo?.name || investment.name,
        currentPrice,
        purchasePrice: investment.purchasePrice,
        quantity: investment.quantity,
        currentValue,
        investedValue,
        gainLoss,
        gainLossPercent,
        dayChange: currentPriceData?.change || 0,
        dayChangePercent: currentPriceData?.changePercent || 0,
      };
    });
  }

  /**
   * Get current prices for multiple symbols
   */
  private static async getCurrentPrices(symbols: string[]): Promise<AssetPrice[]> {
    const etfSymbols = symbols.filter(symbol => symbol !== 'BTC');
    const hasBitcoin = symbols.includes('BTC');

    const promises: Promise<AssetPrice>[] = [];

    // Fetch ETF prices
    if (etfSymbols.length > 0) {
      promises.push(...etfSymbols.map(symbol => MarketDataService.fetchETFPrice(symbol)));
    }

    // Fetch Bitcoin price
    if (hasBitcoin) {
      promises.push(MarketDataService.fetchBitcoinPrice());
    }

    try {
      const results = await Promise.allSettled(promises);
      return results
        .filter((result): result is PromiseFulfilledResult<AssetPrice> => result.status === 'fulfilled')
        .map(result => result.value);
    } catch (error) {
      console.error('Error fetching current prices:', error);
      return [];
    }
  }

  /**
   * Get investment by symbol for a user
   */
  static getInvestmentBySymbol(userId: string, symbol: string): Investment | null {
    const investments = this.getInvestments(userId);
    return investments.find(investment => investment.symbol === symbol) || null;
  }

  /**
   * Check if user has any investments
   */
  static hasInvestments(userId: string): boolean {
    const investments = this.getInvestments(userId);
    return investments.length > 0;
  }

  /**
   * Get investment statistics
   */
  static getInvestmentStatistics(userId: string): {
    totalInvestments: number;
    totalSymbols: number;
    totalTransactions: number;
    portfolioTypes: Record<string, number>;
  } {
    const investments = this.getInvestments(userId);
    const transactions = LocalStorageService.get<InvestmentTransaction[]>(this.INVESTMENT_TRANSACTIONS_KEY) || [];
    const userTransactions = transactions.filter(t => t.userId === userId);

    const portfolioTypes = investments.reduce((acc, investment) => {
      acc[investment.type] = (acc[investment.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalInvestments: investments.length,
      totalSymbols: new Set(investments.map(inv => inv.symbol)).size,
      totalTransactions: userTransactions.length,
      portfolioTypes,
    };
  }

  /**
   * Generate unique ID
   */
  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Clear all investment data (for testing/reset)
   */
  static clearAllData(): void {
    LocalStorageService.remove(this.INVESTMENTS_KEY);
    LocalStorageService.remove(this.INVESTMENT_TRANSACTIONS_KEY);
  }

  /**
   * Export investment data
   */
  static exportInvestmentData(userId: string): {
    investments: Investment[];
    transactions: InvestmentTransaction[];
  } {
    const investments = this.getInvestments(userId);
    const allTransactions = LocalStorageService.get<InvestmentTransaction[]>(this.INVESTMENT_TRANSACTIONS_KEY) || [];
    const transactions = allTransactions.filter(t => t.userId === userId);

    return {
      investments,
      transactions,
    };
  }

  /**
   * Get suggested assets based on user's current portfolio
   */
  static getSuggestedAssets(userId: string): string[] {
    const investments = this.getInvestments(userId);
    const currentSymbols = new Set(investments.map(inv => inv.symbol));
    
    // Your specific investment targets
    const recommendedSymbols = ['VOO', 'VT', 'GLD', 'QQQ', 'BTC'];
    
    // Return symbols not yet in portfolio
    return recommendedSymbols.filter(symbol => !currentSymbols.has(symbol));
  }

  /**
   * Fix investment data that was entered with total amount instead of per-share price
   * Call this method if you suspect an investment has incorrect price calculation
   */
  static fixInvestmentPricing(investmentId: string, totalAmountInvested: number): boolean {
    const investment = this.getInvestmentById(investmentId);
    if (!investment) {
      return false;
    }

    // Calculate the correct price per share
    const correctPricePerShare = totalAmountInvested / investment.quantity;
    
    // Update the investment
    this.updateInvestment(investmentId, {
      purchasePrice: correctPricePerShare,
    });

    // Also update the related transaction
    const transactions = this.getInvestmentTransactions(investmentId);
    const initialTransaction = transactions.find(t => t.type === 'buy');
    if (initialTransaction) {
      const allTransactions = LocalStorageService.get<InvestmentTransaction[]>(this.INVESTMENT_TRANSACTIONS_KEY) || [];
      const transactionIndex = allTransactions.findIndex(t => t.id === initialTransaction.id);
      if (transactionIndex !== -1) {
        allTransactions[transactionIndex].price = correctPricePerShare;
        LocalStorageService.set(this.INVESTMENT_TRANSACTIONS_KEY, allTransactions);
      }
    }

    return true;
  }

  /**
   * Detect potentially incorrect investment pricing
   * Returns investments that might have been entered with total amount instead of per-share price
   */
  static detectPotentialPricingIssues(userId: string): Array<{
    investment: Investment;
    suspectedTotalAmount: number;
    currentCalculatedValue: number;
  }> {
    const investments = this.getInvestments(userId);
    const potentialIssues: Array<{
      investment: Investment;
      suspectedTotalAmount: number;
      currentCalculatedValue: number;
    }> = [];

    investments.forEach(investment => {
      // If the purchase price seems too low for typical share prices, it might be a total amount
      const currentValue = investment.quantity * investment.purchasePrice;
      
      // For ETFs like VOO, VT, etc., typical share prices are $100-600
      // If the calculated investment value is very small, it's likely wrong
      if (investment.type === 'etf' && currentValue < 50 && investment.purchasePrice < 50) {
        potentialIssues.push({
          investment,
          suspectedTotalAmount: investment.purchasePrice, // The "price" might actually be the total amount
          currentCalculatedValue: currentValue,
        });
      }
    });

    return potentialIssues;
  }
}
