import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Box, Typography, Card, CardContent, Chip } from '@mui/material';
import { barChartOptions, colorPalettes, formatCurrency } from './ChartConfig';
import type { MonthlyComparisonData } from '../../services/analyticsService';

interface MonthlyComparisonChartProps {
  data: MonthlyComparisonData[];
  height?: number;
  title?: string;
}

export const MonthlyComparisonChart: React.FC<MonthlyComparisonChartProps> = ({
  data,
  height = 400,
  title = "Monthly Comparison",
}) => {
  const chartData = {
    labels: data.map(item => item.month),
    datasets: [
      {
        label: 'Income',
        data: data.map(item => item.income),
        backgroundColor: colorPalettes.income + '80',
        borderColor: colorPalettes.income,
        borderWidth: 2,
      },
      {
        label: 'Expenses',
        data: data.map(item => item.expenses),
        backgroundColor: colorPalettes.expense + '80',
        borderColor: colorPalettes.expense,
        borderWidth: 2,
      },
      {
        label: 'Budgeted',
        data: data.map(item => item.budgetedExpenses),
        backgroundColor: colorPalettes.budget + '40',
        borderColor: colorPalettes.budget,
        borderWidth: 2,
      },
    ],
  };

  const options = {
    ...barChartOptions,
    plugins: {
      ...barChartOptions.plugins,
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${formatCurrency(value)}`;
          },
        },
      },
    },
    scales: {
      ...barChartOptions.scales,
      y: {
        ...barChartOptions.scales?.y,
        ticks: {
          callback: function(value: any) {
            return formatCurrency(value);
          },
        },
      },
    },
  };

  // Calculate summary stats
  const avgIncome = data.length > 0 ? data.reduce((sum, item) => sum + item.income, 0) / data.length : 0;
  const avgExpenses = data.length > 0 ? data.reduce((sum, item) => sum + item.expenses, 0) / data.length : 0;
  const avgSavings = data.length > 0 ? data.reduce((sum, item) => sum + item.savings, 0) / data.length : 0;
  const avgSavingsRate = avgIncome > 0 ? (avgSavings / avgIncome) * 100 : 0;

  // Find best and worst months
  const bestMonth = data.reduce((best, current) => 
    current.savings > best.savings ? current : best, data[0] || { month: '', savings: 0 }
  );
  const worstMonth = data.reduce((worst, current) => 
    current.savings < worst.savings ? current : worst, data[0] || { month: '', savings: 0 }
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography 
        variant="h6" 
        gutterBottom 
        sx={{ 
          fontWeight: 700, 
          color: 'rgba(255, 255, 255, 0.9)',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
        }}
      >
        {title}
      </Typography>
        
        {/* Summary Stats */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Avg Monthly Income</Typography>
            <Typography variant="body2" fontWeight="bold" color="success.main">
              {formatCurrency(avgIncome)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Avg Monthly Expenses</Typography>
            <Typography variant="body2" fontWeight="bold" color="error.main">
              {formatCurrency(avgExpenses)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Avg Savings Rate</Typography>
            <Typography 
              variant="body2" 
              fontWeight="bold" 
              color={avgSavingsRate >= 0 ? "success.main" : "error.main"}
            >
              {avgSavingsRate.toFixed(1)}%
            </Typography>
          </Box>
        </Box>

        {/* Best/Worst Months */}
        {data.length > 1 && (
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <Chip
              label={`Best: ${bestMonth.month} (${formatCurrency(bestMonth.savings)})`}
              color="success"
              variant="outlined"
              size="small"
            />
            <Chip
              label={`Worst: ${worstMonth.month} (${formatCurrency(worstMonth.savings)})`}
              color="error"
              variant="outlined"
              size="small"
            />
          </Box>
        )}

        <Box sx={{ height }}>
          <Bar data={chartData} options={options} />
        </Box>
    </Box>
  );
};