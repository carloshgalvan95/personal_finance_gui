import React from 'react';
import { Line } from 'react-chartjs-2';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { lineChartOptions, colorPalettes, formatCurrency } from './ChartConfig';
import type { TimeSeriesDataPoint } from '../../services/analyticsService';

interface SpendingTrendsChartProps {
  data: TimeSeriesDataPoint[];
  height?: number;
  title?: string;
}

export const SpendingTrendsChart: React.FC<SpendingTrendsChartProps> = ({
  data,
  height = 400,
  title = "Spending Trends",
}) => {
  const chartData = {
    labels: data.map(point => {
      const date = new Date(point.date + '-01');
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }),
    datasets: [
      {
        label: 'Income',
        data: data.map(point => point.income),
        borderColor: colorPalettes.income,
        backgroundColor: colorPalettes.income + '20',
        fill: false,
        tension: 0.4,
      },
      {
        label: 'Expenses',
        data: data.map(point => point.expenses),
        borderColor: colorPalettes.expense,
        backgroundColor: colorPalettes.expense + '20',
        fill: false,
        tension: 0.4,
      },
      {
        label: 'Net Income',
        data: data.map(point => point.net),
        borderColor: colorPalettes.savings,
        backgroundColor: colorPalettes.savings + '20',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const options = {
    ...lineChartOptions,
    plugins: {
      ...lineChartOptions.plugins,
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
      ...lineChartOptions.scales,
      y: {
        ...lineChartOptions.scales?.y,
        ticks: {
          callback: function(value: any) {
            return formatCurrency(value);
          },
        },
      },
    },
  };

  // Calculate summary stats
  const totalIncome = data.reduce((sum, point) => sum + point.income, 0);
  const totalExpenses = data.reduce((sum, point) => sum + point.expenses, 0);
  const avgMonthlyNet = data.length > 0 ? data.reduce((sum, point) => sum + point.net, 0) / data.length : 0;

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
        <Box sx={{ display: 'flex', gap: 3, mb: 2, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Total Income</Typography>
            <Typography variant="body2" fontWeight="bold" color="success.main">
              {formatCurrency(totalIncome)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Total Expenses</Typography>
            <Typography variant="body2" fontWeight="bold" color="error.main">
              {formatCurrency(totalExpenses)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Avg Monthly Net</Typography>
            <Typography 
              variant="body2" 
              fontWeight="bold" 
              color={avgMonthlyNet >= 0 ? "success.main" : "error.main"}
            >
              {formatCurrency(avgMonthlyNet)}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ height }}>
          <Line data={chartData} options={options} />
        </Box>
    </Box>
  );
};