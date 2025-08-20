import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Box, Typography, Card, CardContent, List, ListItem, ListItemText, Chip } from '@mui/material';
import { doughnutChartOptions, formatCurrency } from './ChartConfig';
import type { CategorySpendingData } from '../../services/analyticsService';

interface CategoryBreakdownChartProps {
  data: CategorySpendingData[];
  height?: number;
  title?: string;
  showLegend?: boolean;
}

export const CategoryBreakdownChart: React.FC<CategoryBreakdownChartProps> = ({
  data,
  height = 400,
  title = "Spending by Category",
  showLegend = true,
}) => {
  const chartData = {
    labels: data.map(item => item.category),
    datasets: [
      {
        data: data.map(item => item.amount),
        backgroundColor: data.map(item => item.color),
        borderColor: data.map(item => item.color),
        borderWidth: 2,
        hoverBorderWidth: 3,
      },
    ],
  };

  const options = {
    ...doughnutChartOptions,
    plugins: {
      ...doughnutChartOptions.plugins,
      legend: {
        display: false, // We'll create a custom legend
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${formatCurrency(value)} (${percentage}%)`;
          },
        },
      },
    },
  };

  const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);

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
        
        <Box sx={{ display: 'flex', gap: 2, height }}>
          {/* Chart */}
          <Box sx={{ flex: 1, minHeight: height }}>
            <Doughnut data={chartData} options={options} />
          </Box>

          {/* Custom Legend */}
          {showLegend && (
            <Box sx={{ flex: 1, maxWidth: 300 }}>
              <Typography variant="subtitle2" gutterBottom>
                Total: {formatCurrency(totalAmount)}
              </Typography>
              <List dense sx={{ maxHeight: height - 50, overflow: 'auto' }}>
                {data.map((item, index) => (
                  <ListItem key={index} sx={{ py: 0.5 }}>
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        backgroundColor: item.color,
                        mr: 1.5,
                        flexShrink: 0,
                      }}
                    />
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" noWrap sx={{ mr: 1 }}>
                            {item.category}
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {formatCurrency(item.amount)}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            {item.transactionCount} transactions
                          </Typography>
                          <Chip
                            label={`${item.percentage.toFixed(1)}%`}
                            size="small"
                            sx={{ 
                              fontSize: '0.7rem', 
                              height: 20,
                              backgroundColor: item.color + '20',
                              color: item.color,
                            }}
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </Box>
    </Box>
  );
};