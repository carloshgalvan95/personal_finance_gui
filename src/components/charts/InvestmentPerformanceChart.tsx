import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { Box, Typography, useTheme } from '@mui/material';
import type { InvestmentPerformance } from '../../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface InvestmentPerformanceChartProps {
  data: InvestmentPerformance[];
  type: 'allocation' | 'performance' | 'returns';
  height?: number;
  title?: string;
}

export const InvestmentPerformanceChart: React.FC<InvestmentPerformanceChartProps> = ({
  data,
  type,
  height = 300,
  title,
}) => {
  const theme = useTheme();

  const colors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main,
  ];

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (percent: number): string => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  // Portfolio Allocation Chart (Doughnut)
  if (type === 'allocation') {
    const chartData = {
      labels: data.map(item => `${item.symbol} - ${item.name}`),
      datasets: [
        {
          data: data.map(item => item.currentValue),
          backgroundColor: colors.slice(0, data.length),
          borderWidth: 2,
          borderColor: theme.palette.background.paper,
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right' as const,
          labels: {
            color: theme.palette.text.primary,
            usePointStyle: true,
            padding: 20,
            font: {
              size: 12,
            },
          },
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const value = context.parsed;
              const total = data.reduce((sum, item) => sum + item.currentValue, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
            },
          },
        },
      },
    };

    return (
      <Box>
        {title && (
          <Typography variant="h6" gutterBottom sx={{ textAlign: 'center' }}>
            {title}
          </Typography>
        )}
        <Box sx={{ height, position: 'relative' }}>
          <Doughnut data={chartData} options={options} />
        </Box>
      </Box>
    );
  }

  // Performance Comparison Chart (Bar)
  if (type === 'performance') {
    const chartData = {
      labels: data.map(item => item.symbol),
      datasets: [
        {
          label: 'Current Value',
          data: data.map(item => item.currentValue),
          backgroundColor: colors[0],
          borderRadius: 4,
        },
        {
          label: 'Invested Value',
          data: data.map(item => item.investedValue),
          backgroundColor: colors[1],
          borderRadius: 4,
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: theme.palette.text.primary,
          },
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
            },
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: theme.palette.text.secondary,
          },
          grid: {
            color: theme.palette.divider,
          },
        },
        y: {
          ticks: {
            color: theme.palette.text.secondary,
            callback: (value: any) => formatCurrency(value),
          },
          grid: {
            color: theme.palette.divider,
          },
        },
      },
    };

    return (
      <Box>
        {title && (
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
        )}
        <Box sx={{ height }}>
          <Bar data={chartData} options={options} />
        </Box>
      </Box>
    );
  }

  // Returns Chart (Bar with positive/negative colors)
  if (type === 'returns') {
    const chartData = {
      labels: data.map(item => item.symbol),
      datasets: [
        {
          label: 'Return %',
          data: data.map(item => item.gainLossPercent),
          backgroundColor: data.map(item => 
            item.gainLossPercent >= 0 ? theme.palette.success.main : theme.palette.error.main
          ),
          borderRadius: 4,
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const value = context.parsed.y;
              const asset = data[context.dataIndex];
              return [
                `Return: ${formatPercent(value)}`,
                `Gain/Loss: ${formatCurrency(asset.gainLoss)}`,
              ];
            },
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: theme.palette.text.secondary,
          },
          grid: {
            color: theme.palette.divider,
          },
        },
        y: {
          ticks: {
            color: theme.palette.text.secondary,
            callback: (value: any) => `${value}%`,
          },
          grid: {
            color: theme.palette.divider,
          },
        },
      },
    };

    return (
      <Box>
        {title && (
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
        )}
        <Box sx={{ height }}>
          <Bar data={chartData} options={options} />
        </Box>
      </Box>
    );
  }

  return null;
};
