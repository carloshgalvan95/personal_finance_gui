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
    generateMockPriceHistory();
  }, [symbol, timeFrame, currentPrice]);

  const generateMockPriceHistory = () => {
    setIsLoading(true);
    setError(null);

    try {
      // Generate mock historical data based on current price and timeframe
      const currentPriceValue = currentPrice?.price || averageCost;
      const dataPoints = getDataPointsForTimeFrame(timeFrame);
      let history: PricePoint[] = [];

      // Generate realistic price movement working backwards from current price
      const volatility = getVolatilityForSymbol(symbol);
      
      // Start from current price and work backwards to create smooth progression
      let basePrice = currentPriceValue;
      const priceHistory: PricePoint[] = [];

      for (let i = 0; i <= dataPoints; i++) {
        const date = getDateForTimeFrame(timeFrame, dataPoints - i);
        
        if (i === 0) {
          // Current/most recent data point
          priceHistory.push({
            date: date.toISOString(),
            price: currentPriceValue,
            change: currentPrice?.change || 0,
            changePercent: currentPrice?.changePercent || 0,
          });
        } else {
          // Generate realistic price variation for historical points
          const randomChange = (Math.random() - 0.5) * volatility;
          const trendFactor = getTrendFactor(symbol, timeFrame, dataPoints - i, dataPoints);
          
          // Work backwards: previous price should be slightly different
          basePrice = basePrice / (1 + randomChange + trendFactor);
          
          // Ensure price doesn't go negative
          basePrice = Math.max(basePrice, averageCost * 0.3);

          priceHistory.push({
            date: date.toISOString(),
            price: basePrice,
            change: 0,
            changePercent: 0,
          });
        }
      }

      // Reverse to get chronological order (oldest to newest)
      history = priceHistory.reverse();

      setPriceHistory(history);
    } catch (error) {
      console.error('Error generating price history:', error);
      setError('Failed to load price history');
    } finally {
      setIsLoading(false);
    }
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
