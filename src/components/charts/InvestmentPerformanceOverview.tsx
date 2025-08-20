import React from 'react';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
} from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

interface InvestmentPerformanceOverviewProps {
  symbol: string;
  totalReturn: number;
  totalReturnPercent: number;
  dayChange: number;
  dayChangePercent: number;
  totalInvested: number;
  currentValue: number;
}

export const InvestmentPerformanceOverview: React.FC<InvestmentPerformanceOverviewProps> = ({
  symbol,
  totalReturn,
  totalReturnPercent,
  dayChangePercent,
  totalInvested,
}) => {

  // Performance comparison data
  const performanceData = {
    labels: ['Gains/Losses', 'Original Investment'],
    datasets: [
      {
        data: [Math.abs(totalReturn), totalInvested],
        backgroundColor: [
          totalReturn >= 0 ? '#10b981' : '#ef4444',
          '#e5e7eb'
        ],
        borderColor: [
          totalReturn >= 0 ? '#059669' : '#dc2626',
          '#d1d5db'
        ],
        borderWidth: 2,
      },
    ],
  };

  const performanceOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1f2937',
        bodyColor: '#374151',
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function(context: any) {
            const label = context.label;
            const value = context.parsed;
            const percentage = ((value / (totalInvested + Math.abs(totalReturn))) * 100).toFixed(1);
            return `${label}: $${value.toLocaleString()} (${percentage}%)`;
          },
        },
      },
    },
  };

  // Time-based performance metrics (mock data for demonstration)
  const timeMetrics = [
    { period: '1 Day', change: dayChangePercent },
    { period: '1 Week', change: dayChangePercent * 1.2 },
    { period: '1 Month', change: totalReturnPercent * 0.3 },
    { period: '3 Months', change: totalReturnPercent * 0.7 },
    { period: 'Total', change: totalReturnPercent },
  ];

  const timePerformanceData = {
    labels: timeMetrics.map(m => m.period),
    datasets: [
      {
        label: `${symbol} Performance`,
        data: timeMetrics.map(m => m.change),
        backgroundColor: timeMetrics.map(m => 
          m.change >= 0 ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)'
        ),
        borderColor: timeMetrics.map(m => 
          m.change >= 0 ? '#10b981' : '#ef4444'
        ),
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const timePerformanceOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1f2937',
        bodyColor: '#374151',
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function(context: any) {
            const value = context.parsed.y;
            return `Return: ${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          callback: function(value: any) {
            return value + '%';
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
      {/* Portfolio Composition */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Position Breakdown
          </Typography>
          <Box sx={{ height: 250, position: 'relative', mb: 2 }}>
            <Doughnut data={performanceData} options={performanceOptions} />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              icon={totalReturn >= 0 ? <TrendingUp /> : <TrendingDown />}
              label={`${totalReturn >= 0 ? '+' : ''}$${Math.abs(totalReturn).toLocaleString()}`}
              color={totalReturn >= 0 ? 'success' : 'error'}
              size="small"
            />
            <Chip
              label={`${totalReturnPercent >= 0 ? '+' : ''}${totalReturnPercent.toFixed(2)}%`}
              color={totalReturnPercent >= 0 ? 'success' : 'error'}
              variant="outlined"
              size="small"
            />
          </Box>
        </CardContent>
      </Card>

      {/* Performance Over Time */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Performance Timeline
          </Typography>
          <Box sx={{ height: 250, position: 'relative', mb: 2 }}>
            <Bar data={timePerformanceData} options={timePerformanceOptions} />
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', display: 'block' }}>
            Returns shown as percentages over different time periods
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};
