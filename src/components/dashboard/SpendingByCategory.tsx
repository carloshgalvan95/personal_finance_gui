import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Button,
} from '@mui/material';
import {
  ArrowForward,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../utils';

interface CategorySpending {
  category: string;
  amount: number;
  color: string;
}

interface SpendingByCategoryProps {
  categorySpending: CategorySpending[];
}

export const SpendingByCategory: React.FC<SpendingByCategoryProps> = ({
  categorySpending,
}) => {
  const navigate = useNavigate();

  const handleViewTransactions = () => {
    navigate('/transactions');
  };

  if (categorySpending.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: 200,
          color: 'text.secondary',
        }}
      >
        <Typography variant="body2" gutterBottom>
          No spending data this month
        </Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={handleViewTransactions}
        >
          Add transactions
        </Button>
      </Box>
    );
  }

  const totalSpending = categorySpending.reduce((sum, cat) => sum + cat.amount, 0);
  const maxAmount = Math.max(...categorySpending.map(cat => cat.amount));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Spending by Category</Typography>
        <Button
          size="small"
          endIcon={<ArrowForward />}
          onClick={handleViewTransactions}
        >
          View Details
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" gutterBottom>
        This month's total: {formatCurrency(totalSpending)}
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
        {categorySpending.map((category) => {
          const percentage = totalSpending > 0 ? (category.amount / totalSpending) * 100 : 0;
          const barWidth = maxAmount > 0 ? (category.amount / maxAmount) * 100 : 0;
          
          return (
            <Box key={category.category}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: category.color,
                    }}
                  />
                  <Typography variant="body2" fontWeight="medium">
                    {category.category}
                  </Typography>
                </Box>
                <Typography variant="body2" fontWeight="medium">
                  {formatCurrency(category.amount)}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ flex: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={barWidth}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: 'rgba(0, 0, 0, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: category.color,
                        borderRadius: 4,
                      },
                    }}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ minWidth: 'fit-content' }}>
                  {percentage.toFixed(1)}%
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>

      {categorySpending.length > 6 && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button
            variant="text"
            size="small"
            onClick={handleViewTransactions}
            endIcon={<ArrowForward />}
          >
            View all categories
          </Button>
        </Box>
      )}
    </Box>
  );
};