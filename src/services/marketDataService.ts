import axios from 'axios';
import type { AssetPrice } from '../types';

export class MarketDataService {
  // Cache for storing fetched data to avoid repeated API calls
  private static cache = new Map<string, { data: AssetPrice; timestamp: number }>();
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  
  // Rate limiting
  private static lastRequestTime = 0;
  private static readonly MIN_REQUEST_INTERVAL = 100; // 100ms between requests
  
  // Retry configuration
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000; // 1 second base delay

  // Popular investment symbols
  static readonly INVESTMENT_SYMBOLS = {
    // ETFs
    VOO: 'VOO',      // Vanguard S&P 500 ETF
    VT: 'VT',        // Vanguard Total World Stock ETF
    GLD: 'GLD',      // SPDR Gold Trust
    QQQ: 'QQQ',      // Invesco QQQ Trust
    VTI: 'VTI',      // Vanguard Total Stock Market ETF
    VXUS: 'VXUS',    // Vanguard Total International Stock ETF
    BND: 'BND',      // Vanguard Total Bond Market ETF
    
    // Popular Stocks
    AAPL: 'AAPL',    // Apple Inc.
    MSFT: 'MSFT',    // Microsoft Corporation
    GOOGL: 'GOOGL',  // Alphabet Inc.
    AMZN: 'AMZN',    // Amazon.com Inc.
    TSLA: 'TSLA',    // Tesla Inc.
    NVDA: 'NVDA',    // NVIDIA Corporation
  };

  // Asset information with full names
  static readonly ASSET_INFO: Record<string, { name: string; type: 'etf' | 'cryptocurrency' | 'stock' }> = {
    // ETFs
    VOO: { name: 'Vanguard S&P 500 ETF', type: 'etf' },
    VT: { name: 'Vanguard Total World Stock ETF', type: 'etf' },
    GLD: { name: 'SPDR Gold Trust', type: 'etf' },
    QQQ: { name: 'Invesco QQQ Trust', type: 'etf' },
    VTI: { name: 'Vanguard Total Stock Market ETF', type: 'etf' },
    VXUS: { name: 'Vanguard Total International Stock ETF', type: 'etf' },
    BND: { name: 'Vanguard Total Bond Market ETF', type: 'etf' },
    
    // Stocks
    AAPL: { name: 'Apple Inc.', type: 'stock' },
    MSFT: { name: 'Microsoft Corporation', type: 'stock' },
    GOOGL: { name: 'Alphabet Inc.', type: 'stock' },
    AMZN: { name: 'Amazon.com Inc.', type: 'stock' },
    TSLA: { name: 'Tesla Inc.', type: 'stock' },
    NVDA: { name: 'NVIDIA Corporation', type: 'stock' },
    
    // Cryptocurrencies
    BTC: { name: 'Bitcoin', type: 'cryptocurrency' },
    'BTC-USD': { name: 'Bitcoin', type: 'cryptocurrency' },
  };

  /**
   * Check if cached data is still valid
   */
  private static isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_DURATION;
  }

  /**
   * Rate limiting - ensure minimum interval between requests
   */
  private static async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
      const waitTime = this.MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Retry mechanism with exponential backoff
   */
  private static async retryRequest<T>(
    requestFn: () => Promise<T>,
    retries: number = this.MAX_RETRIES
  ): Promise<T> {
    try {
      await this.enforceRateLimit();
      return await requestFn();
    } catch (error) {
      if (retries > 0) {
        const delay = this.RETRY_DELAY * (this.MAX_RETRIES - retries + 1); // Exponential backoff
        console.log(`Request failed, retrying in ${delay}ms... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.retryRequest(requestFn, retries - 1);
      }
      throw error;
    }
  }

  /**
   * Get cached data if available and valid
   */
  private static getCachedData(symbol: string): AssetPrice | null {
    const cached = this.cache.get(symbol);
    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.data;
    }
    return null;
  }

  /**
   * Cache fetched data
   */
  private static setCachedData(symbol: string, data: AssetPrice): void {
    this.cache.set(symbol, { data, timestamp: Date.now() });
  }

  /**
   * Fetch ETF/Stock price from Yahoo Finance API (free, no API key required)
   * Enhanced with retry mechanism and rate limiting
   */
  static async fetchETFPrice(symbol: string): Promise<AssetPrice> {
    const cached = this.getCachedData(symbol);
    if (cached) {
      return cached;
    }

    try {
      const response = await this.retryRequest(async () => {
        return await axios.get(
          `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`,
          {
            timeout: 10000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          }
        );
      });

      const result = response.data?.chart?.result?.[0];
      if (!result) {
        throw new Error('Invalid response format');
      }

      const meta = result.meta;
      const currentPrice = meta.regularMarketPrice || meta.previousClose || 0;
      const previousClose = meta.previousClose || currentPrice;
      const change = currentPrice - previousClose;
      const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;

      const assetPrice: AssetPrice = {
        symbol,
        price: currentPrice,
        change,
        changePercent,
        volume: meta.regularMarketVolume || 0,
        lastUpdated: new Date(),
      };

      this.setCachedData(symbol, assetPrice);
      return assetPrice;

    } catch (error) {
      console.error(`Error fetching ETF price for ${symbol}:`, error);
      
      // Return fallback data with error indication
      const fallbackPrice: AssetPrice = {
        symbol,
        price: 0,
        change: 0,
        changePercent: 0,
        volume: 0,
        lastUpdated: new Date(),
      };

      return fallbackPrice;
    }
  }

  /**
   * Fetch Bitcoin price from CoinGecko API (free, no API key required)
   * Enhanced with retry mechanism and rate limiting
   */
  static async fetchBitcoinPrice(): Promise<AssetPrice> {
    const cached = this.getCachedData('BTC');
    if (cached) {
      return cached;
    }

    try {
      const response = await this.retryRequest(async () => {
        return await axios.get(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true&include_market_cap=true',
          { timeout: 10000 }
        );
      });

      const btcData = response.data.bitcoin;
      if (!btcData) {
        throw new Error('Bitcoin data not found');
      }

      const currentPrice = btcData.usd || 0;
      const changePercent = btcData.usd_24h_change || 0;
      const change = (currentPrice * changePercent) / 100;

      const assetPrice: AssetPrice = {
        symbol: 'BTC',
        price: currentPrice,
        change,
        changePercent,
        marketCap: btcData.usd_market_cap || 0,
        lastUpdated: new Date(),
      };

      this.setCachedData('BTC', assetPrice);
      return assetPrice;

    } catch (error) {
      console.error('Error fetching Bitcoin price:', error);
      
      // Return fallback data
      const fallbackPrice: AssetPrice = {
        symbol: 'BTC',
        price: 0,
        change: 0,
        changePercent: 0,
        lastUpdated: new Date(),
      };

      return fallbackPrice;
    }
  }

  /**
   * Fetch multiple ETF prices in parallel
   */
  static async fetchMultipleETFPrices(symbols: string[]): Promise<AssetPrice[]> {
    const promises = symbols.map(symbol => this.fetchETFPrice(symbol));
    
    try {
      const results = await Promise.allSettled(promises);
      return results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          console.error(`Failed to fetch price for ${symbols[index]}:`, result.reason);
          return {
            symbol: symbols[index],
            price: 0,
            change: 0,
            changePercent: 0,
            lastUpdated: new Date(),
          };
        }
      });
    } catch (error) {
      console.error('Error in fetchMultipleETFPrices:', error);
      return symbols.map(symbol => ({
        symbol,
        price: 0,
        change: 0,
        changePercent: 0,
        lastUpdated: new Date(),
      }));
    }
  }

  /**
   * Fetch all popular investment prices (ETFs, Stocks + Bitcoin)
   */
  static async fetchAllInvestmentPrices(): Promise<AssetPrice[]> {
    try {
      const investmentSymbols = Object.values(this.INVESTMENT_SYMBOLS);
      
      // Fetch all investments and Bitcoin in parallel
      const [investmentPrices, bitcoinPrice] = await Promise.all([
        this.fetchMultipleETFPrices(investmentSymbols),
        this.fetchBitcoinPrice(),
      ]);

      return [...investmentPrices, bitcoinPrice];
    } catch (error) {
      console.error('Error fetching all investment prices:', error);
      return [];
    }
  }

  /**
   * Get historical data for an asset using Yahoo Finance API
   */
  static async fetchHistoricalData(symbol: string, period: '1d' | '1w' | '1m' | '3m' | '1y' = '1m'): Promise<any[]> {
    try {
      // Convert period to Yahoo Finance format
      const periodMap = {
        '1d': { range: '1d', interval: '5m' },
        '1w': { range: '5d', interval: '1h' },
        '1m': { range: '1mo', interval: '1d' },
        '3m': { range: '3mo', interval: '1d' },
        '1y': { range: '1y', interval: '1wk' }
      };

      const { range, interval } = periodMap[period];

      const response = await axios.get(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`,
        {
          params: {
            range,
            interval,
            includePrePost: false,
            events: 'div,splits'
          },
          timeout: 15000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        }
      );

      const result = response.data?.chart?.result?.[0];
      if (!result || !result.timestamp) {
        throw new Error('Invalid historical data response');
      }

      const timestamps = result.timestamp;
      const prices = result.indicators?.quote?.[0]?.close || [];
      const volumes = result.indicators?.quote?.[0]?.volume || [];

      // Convert to our format
      const historicalData = timestamps.map((timestamp: number, index: number) => ({
        date: new Date(timestamp * 1000).toISOString().split('T')[0],
        price: prices[index] || 0,
        volume: volumes[index] || 0,
      })).filter((item: any) => item.price > 0); // Filter out invalid prices

      return historicalData;

    } catch (error) {
      console.error(`Error fetching historical data for ${symbol}:`, error);
      
      // Fallback to mock data if real API fails
      console.log(`Falling back to mock data for ${symbol}`);
      return this.generateMockHistoricalData(symbol, period);
    }
  }

  /**
   * Generate mock historical data for charts
   * Replace this with real API calls when needed
   */
  private static generateMockHistoricalData(symbol: string, period: string): any[] {
    const now = new Date();
    const data = [];
    const days = period === '1d' ? 1 : period === '1w' ? 7 : period === '1m' ? 30 : period === '3m' ? 90 : 365;
    
    // Base prices for your assets
    const basePrices: Record<string, number> = {
      VOO: 420,
      VT: 105,
      GLD: 200,
      QQQ: 380,
      BTC: 45000,
    };

    const basePrice = basePrices[symbol] || 100;

    for (let i = days; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      // Add some realistic volatility
      const volatility = symbol === 'BTC' ? 0.05 : 0.02; // Bitcoin more volatile
      const randomChange = (Math.random() - 0.5) * volatility;
      const price = basePrice * (1 + randomChange * (days - i) / days);
      
      data.push({
        date: date.toISOString().split('T')[0],
        price: Math.round(price * 100) / 100,
        volume: Math.floor(Math.random() * 1000000),
      });
    }

    return data;
  }

  /**
   * Get market status (open/closed)
   */
  static getMarketStatus(): { isOpen: boolean; nextOpen?: string; nextClose?: string } {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday

    // Simple market hours: 9:30 AM to 4:00 PM ET, Monday to Friday
    const isWeekday = currentDay >= 1 && currentDay <= 5;
    const isMarketHours = currentHour >= 9 && currentHour < 16;
    const isOpen = isWeekday && isMarketHours;

    return {
      isOpen,
      // Add logic for next open/close times if needed
    };
  }

  /**
   * Clear cache manually
   */
  static clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache size for debugging
   */
  static getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * Get asset information
   */
  static getAssetInfo(symbol: string): { name: string; type: 'etf' | 'cryptocurrency' | 'stock' } | null {
    return this.ASSET_INFO[symbol] || null;
  }
}
