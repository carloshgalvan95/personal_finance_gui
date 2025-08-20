import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Box,
  Card,
  CardContent,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  Skeleton,
} from '@mui/material';
import { financialChartOptions } from './ChartConfig';
import { MarketDataService } from '../../services/marketDataService';
import type { AssetPrice } from '../../types';

interface InvestmentPriceChartProps {
  symbol: string;
  currentPrice?: AssetPrice | null;
  averageCost: number;
  height?: number;
}

type TimeFrame = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

interface PricePoint {
  date: string;
  price: number;
  change?: number;
  changePercent?: number;
}

export const InvestmentPriceChart: React.FC<InvestmentPriceChartProps> = ({
  symbol,
  currentPrice,
  averageCost,
  height = 400,
}) => {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('3M');
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPriceHistory();
  }, [symbol, timeFrame, currentPrice]);

  const loadPriceHistory = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Convert timeframe to API format
      const apiTimeframe = timeFrame === '1D' ? '1d' : 
                          timeFrame === '1W' ? '1w' : 
                          timeFrame === '1M' ? '1m' : 
                          timeFrame === '3M' ? '3m' : 
                          timeFrame === '6M' ? '3m' : 
                          timeFrame === '1Y' ? '1y' : '1m';

      // Try to get real historical data first
      let historicalData;
      try {
        historicalData = await MarketDataService.fetchHistoricalData(symbol, apiTimeframe);
      } catch (apiError) {
        console.warn(`Failed to fetch real data for ${symbol}, falling back to mock data:`, apiError);
        historicalData = generateFallbackData();
      }

      // Convert to our PricePoint format
      const history: PricePoint[] = historicalData.map((item: any) => ({
        date: item.date,
        price: item.price,
        change: 0, // Historical data doesn't include daily changes
        changePercent: 0,
      }));

      // Add current price as the most recent point if available
      if (currentPrice && history.length > 0) {
        // Update the last point with current data
        history[history.length - 1] = {
          date: new Date().toISOString().split('T')[0],
          price: currentPrice.price,
          change: currentPrice.change,
          changePercent: currentPrice.changePercent,
        };
      }

      setPriceHistory(history);
    } catch (error) {
      console.error('Error loading price history:', error);
      setError('Failed to load price history');
      
      // Fallback to mock data
      const fallbackData = generateFallbackData();
      const history: PricePoint[] = fallbackData.map((item: any) => ({
        date: item.date,
        price: item.price,
        change: 0,
        changePercent: 0,
      }));
      setPriceHistory(history);
    } finally {
      setIsLoading(false);
    }
  };

  const generateFallbackData = () => {
    // Generate mock historical data as fallback
    const currentPriceValue = currentPrice?.price || averageCost;
    const dataPoints = getDataPointsForTimeFrame(timeFrame);
    const volatility = getVolatilityForSymbol(symbol);
    
    const data = [];
    let basePrice = currentPriceValue;
    
    for (let i = dataPoints; i >= 0; i--) {
      const date = getDateForTimeFrame(timeFrame, i);
      
      if (i > 0) {
        const randomChange = (Math.random() - 0.5) * volatility;
        const trendFactor = getTrendFactor(symbol, timeFrame, i, dataPoints);
        basePrice = basePrice / (1 + randomChange + trendFactor);
        basePrice = Math.max(basePrice, averageCost * 0.3);
      } else {
        basePrice = currentPriceValue;
      }
      
      data.push({
        date: date.toISOString().split('T')[0],
        price: basePrice,
      });
    }
    
    return data;
  };

  const getDataPointsForTimeFrame = (tf: TimeFrame): number => {
    switch (tf) {
      case '1D': return 24; // Hourly data for 1 day
      case '1W': return 7;  // Daily data for 1 week
      case '1M': return 30; // Daily data for 1 month
      case '3M': return 90; // Daily data for 3 months
      case '6M': return 180; // Daily data for 6 months
      case '1Y': return 365; // Daily data for 1 year
      case 'ALL': return 730; // Daily data for 2 years
      default: return 90;
    }
  };

  const getDateForTimeFrame = (tf: TimeFrame, daysAgo: number): Date => {
    const now = new Date();
    switch (tf) {
      case '1D':
        return new Date(now.getTime() - daysAgo * 60 * 60 * 1000); // Hours ago
      default:
        return new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000); // Days ago
    }
  };

  const getVolatilityForSymbol = (symbol: string): number => {
    // Different assets have different volatility levels
    switch (symbol) {
      case 'BTC': return 0.05; // Bitcoin is very volatile
      case 'VOO':
      case 'VT':
      case 'QQQ': return 0.02; // ETFs are less volatile
      case 'GLD': return 0.015; // Gold is relatively stable
      default: return 0.02;
    }
  };

  const getTrendFactor = (_symbol: string, tf: TimeFrame, daysAgo: number, totalDays: number): number => {
    // Add slight upward trend for most assets over longer periods
    if (tf === '1Y' || tf === 'ALL') {
      const progress = (totalDays - daysAgo) / totalDays;
      return progress * 0.001; // Small upward trend
    }
    return 0;
  };

  const handleTimeFrameChange = (_event: React.MouseEvent<HTMLElement>, newTimeFrame: TimeFrame | null) => {
    if (newTimeFrame !== null) {
      setTimeFrame(newTimeFrame);
    }
  };

  const formatDateForTimeFrame = (dateString: string): string => {
    const date = new Date(dateString);
    switch (timeFrame) {
      case '1D':
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      case '1W':
      case '1M':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case '3M':
      case '6M':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case '1Y':
      case 'ALL':
        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      default:
        return date.toLocaleDateString();
    }
  };

  const getChartColor = (): { line: string; gradient: string[] } => {
    if (priceHistory.length < 2) return { line: '#6366f1', gradient: ['rgba(99, 102, 241, 0.1)', 'rgba(99, 102, 241, 0)'] };
    
    const firstPrice = priceHistory[0].price;
    const lastPrice = priceHistory[priceHistory.length - 1].price;
    const isPositive = lastPrice >= firstPrice;

    return {
      line: isPositive ? '#10b981' : '#ef4444',
      gradient: isPositive 
        ? ['rgba(16, 185, 129, 0.1)', 'rgba(16, 185, 129, 0)']
        : ['rgba(239, 68, 68, 0.1)', 'rgba(239, 68, 68, 0)']
    };
  };

  const chartData = {
    labels: priceHistory.map(point => formatDateForTimeFrame(point.date)),
    datasets: [
      {
        label: `${symbol} Price`,
        data: priceHistory.map(point => point.price),
        borderColor: getChartColor().line,
        backgroundColor: (context: any) => {
          if (!context.chart.chartArea) return;
          const { ctx, chartArea } = context.chart;
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          const colors = getChartColor().gradient;
          gradient.addColorStop(0, colors[0]);
          gradient.addColorStop(1, colors[1]);
          return gradient;
        },
        borderWidth: 1.5,
        fill: true,
        tension: 0, // Sharp lines, no smoothing
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: getChartColor().line,
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 2,
      },
      // Average cost line
      {
        label: 'Your Average Cost',
        data: priceHistory.map(() => averageCost),
        borderColor: '#f59e0b',
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderDash: [4, 4],
        pointRadius: 0,
        pointHoverRadius: 0,
        fill: false,
      }
    ],
  };

  const chartOptions = {
    ...financialChartOptions,
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    plugins: {
      ...financialChartOptions.plugins,
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 16,
          font: {
            size: 11,
          },
          filter: (legendItem: any) => legendItem.text !== 'Your Average Cost' || timeFrame !== '1D',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1f2937',
        bodyColor: '#374151',
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: (context: any) => {
            const index = context[0].dataIndex;
            const date = new Date(priceHistory[index].date);
            return date.toLocaleDateString('en-US', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              ...(timeFrame === '1D' && { hour: '2-digit', minute: '2-digit' })
            });
          },
          label: (context: any) => {
            if (context.datasetIndex === 0) {
              const price = context.parsed.y;
              return `Price: $${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
            } else {
              return `Average Cost: $${averageCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
            }
          },
        },
      },
    },
    scales: {
      ...financialChartOptions.scales,
      x: {
        display: true,
        grid: {
          display: false,
        },
        ticks: {
          maxTicksLimit: timeFrame === '1D' ? 6 : 8,
        },
      },
      y: {
        display: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          callback: function(value: any) {
            return '$' + value.toLocaleString();
          },
        },
      },
    },
  };

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight="bold">
            Price Chart
          </Typography>
          
          <ToggleButtonGroup
            value={timeFrame}
            exclusive
            onChange={handleTimeFrameChange}
            size="small"
            sx={{ 
              '& .MuiToggleButton-root': {
                px: 1.5,
                py: 0.5,
                fontSize: '0.75rem',
                minWidth: 'auto',
              }
            }}
          >
            <ToggleButton value="1D">1D</ToggleButton>
            <ToggleButton value="1W">1W</ToggleButton>
            <ToggleButton value="1M">1M</ToggleButton>
            <ToggleButton value="3M">3M</ToggleButton>
            <ToggleButton value="6M">6M</ToggleButton>
            <ToggleButton value="1Y">1Y</ToggleButton>
            <ToggleButton value="ALL">ALL</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Box sx={{ height, position: 'relative' }}>
          {isLoading ? (
            <Skeleton 
              variant="rectangular" 
              width="100%" 
              height="100%" 
              sx={{ borderRadius: 1 }}
            />
          ) : (
            <Line data={chartData} options={chartOptions} />
          )}
        </Box>

        {priceHistory.length > 0 && (
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              {timeFrame} performance • {priceHistory.length} data points
            </Typography>
            <Typography variant="caption" color="text.secondary">
              🟨 Dashed line shows your average cost basis
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
