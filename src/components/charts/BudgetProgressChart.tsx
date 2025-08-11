import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Box, Typography, Card, CardContent, LinearProgress, Alert } from '@mui/material';
import { barChartOptions, colorPalettes, formatCurrency } from './ChartConfig';
import type { BudgetAnalysisData } from '../../services/analyticsService';

interface BudgetProgressChartProps {
  data: BudgetAnalysisData[];
  height?: number;
  title?: string;
  showProgress?: boolean;
}

export const BudgetProgressChart: React.FC<BudgetProgressChartProps> = ({
  data,
  height = 400,
  title = "Budget vs Actual",
  showProgress = true,
}) => {
  const chartData = {
    labels: data.map(item => item.categoryName),
    datasets: [
      {
        label: 'Budgeted',
        data: data.map(item => item.budgeted),
        backgroundColor: colorPalettes.budget + '60',
        borderColor: colorPalettes.budget,
        borderWidth: 2,
      },
      {
        label: 'Spent',
        data: data.map(item => item.spent),
        backgroundColor: data.map(item => {
          if (item.status === 'over') return colorPalettes.expense + '80';
          if (item.status === 'near') return '#ff9800' + '80';
          return colorPalettes.income + '80';
        }),
        borderColor: data.map(item => {
          if (item.status === 'over') return colorPalettes.expense;
          if (item.status === 'near') return '#ff9800';
          return colorPalettes.income;
        }),
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
            const dataIndex = context.dataIndex;
            const budgetItem = data[dataIndex];
            
            if (label === 'Spent') {
              const percentage = budgetItem.percentageUsed.toFixed(1);
              return `${label}: ${formatCurrency(value)} (${percentage}% of budget)`;
            }
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
  const totalBudgeted = data.reduce((sum, item) => sum + item.budgeted, 0);
  const totalSpent = data.reduce((sum, item) => sum + item.spent, 0);
  const overallUsage = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
  const overBudgetCategories = data.filter(item => item.status === 'over').length;
  const nearLimitCategories = data.filter(item => item.status === 'near').length;

  if (data.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          <Alert severity="info">
            No budget data available. Create some budgets to see your spending analysis.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        
        {/* Overall Progress */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2">Overall Budget Usage</Typography>
            <Typography variant="body2" fontWeight="bold">
              {formatCurrency(totalSpent)} / {formatCurrency(totalBudgeted)}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min(overallUsage, 100)}
            color={overallUsage > 100 ? 'error' : overallUsage > 80 ? 'warning' : 'primary'}
            sx={{ height: 8, borderRadius: 4, mb: 1 }}
          />
          <Typography variant="caption" color="text.secondary">
            {overallUsage.toFixed(1)}% of total budget used
          </Typography>
        </Box>

        {/* Alerts */}
        {overBudgetCategories > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {overBudgetCategories} {overBudgetCategories === 1 ? 'category is' : 'categories are'} over budget
          </Alert>
        )}
        
        {nearLimitCategories > 0 && overBudgetCategories === 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {nearLimitCategories} {nearLimitCategories === 1 ? 'category is' : 'categories are'} approaching budget limits
          </Alert>
        )}

        {/* Progress Bars */}
        {showProgress && (
          <Box sx={{ mb: 3 }}>
            {data.map((item, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="body2" fontWeight="medium">
                    {item.categoryName}
                  </Typography>
                  <Typography variant="body2">
                    {formatCurrency(item.spent)} / {formatCurrency(item.budgeted)}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(item.percentageUsed, 100)}
                  color={item.status === 'over' ? 'error' : item.status === 'near' ? 'warning' : 'primary'}
                  sx={{ height: 6, borderRadius: 3 }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    {item.percentageUsed.toFixed(1)}% used
                  </Typography>
                  {item.remaining > 0 && (
                    <Typography variant="caption" color="success.main">
                      {formatCurrency(item.remaining)} remaining
                    </Typography>
                  )}
                  {item.remaining < 0 && (
                    <Typography variant="caption" color="error.main">
                      {formatCurrency(Math.abs(item.remaining))} over budget
                    </Typography>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        )}

        <Box sx={{ height }}>
          <Bar data={chartData} options={options} />
        </Box>
      </CardContent>
    </Card>
  );
};