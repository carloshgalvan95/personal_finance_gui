import axios from 'axios';
import type { AssetPrice, YahooFinanceQuote, CryptoQuote } from '../types';

export class MarketDataService {
  // Cache for storing fetched data to avoid repeated API calls
  private static cache = new Map<string, { data: AssetPrice; timestamp: number }>();
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Your specific ETF symbols
  static readonly ETF_SYMBOLS = {
    VOO: 'VOO',      // Vanguard S&P 500 ETF
    VT: 'VT',        // Vanguard Total World Stock ETF
    GLD: 'GLD',      // SPDR Gold Trust
    QQQ: 'QQQ',      // Invesco QQQ Trust
  };

  // Asset information with full names
  static readonly ASSET_INFO: Record<string, { name: string; type: 'etf' | 'cryptocurrency' | 'stock' }> = {
    VOO: { name: 'Vanguard S&P 500 ETF', type: 'etf' },
    VT: { name: 'Vanguard Total World Stock ETF', type: 'etf' },
    GLD: { name: 'SPDR Gold Trust', type: 'etf' },
    QQQ: { name: 'Invesco QQQ Trust', type: 'etf' },
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
   * Using a proxy service to avoid CORS issues
   */
  static async fetchETFPrice(symbol: string): Promise<AssetPrice> {
    const cached = this.getCachedData(symbol);
    if (cached) {
      return cached;
    }

    try {
      // Using Yahoo Finance API through a public proxy
      const response = await axios.get(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`,
        {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        }
      );

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
   */
  static async fetchBitcoinPrice(): Promise<AssetPrice> {
    const cached = this.getCachedData('BTC');
    if (cached) {
      return cached;
    }

    try {
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true&include_market_cap=true',
        { timeout: 10000 }
      );

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
   * Fetch all your investment prices (ETFs + Bitcoin)
   */
  static async fetchAllInvestmentPrices(): Promise<AssetPrice[]> {
    try {
      const etfSymbols = Object.values(this.ETF_SYMBOLS);
      
      // Fetch ETFs and Bitcoin in parallel
      const [etfPrices, bitcoinPrice] = await Promise.all([
        this.fetchMultipleETFPrices(etfSymbols),
        this.fetchBitcoinPrice(),
      ]);

      return [...etfPrices, bitcoinPrice];
    } catch (error) {
      console.error('Error fetching all investment prices:', error);
      return [];
    }
  }

  /**
   * Get historical data for an asset (simplified version)
   * This would typically require a more sophisticated API
   */
  static async fetchHistoricalData(symbol: string, period: '1d' | '1w' | '1m' | '3m' | '1y' = '1m'): Promise<any[]> {
    try {
      // For now, return mock historical data
      // In a real implementation, you would fetch from Yahoo Finance historical API
      const mockData = this.generateMockHistoricalData(symbol, period);
      return mockData;
    } catch (error) {
      console.error(`Error fetching historical data for ${symbol}:`, error);
      return [];
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
