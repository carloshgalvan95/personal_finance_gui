import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Button,
  Alert,
  Chip,
} from '@mui/material';
import {
  ArrowForward,
  Warning,
  CheckCircle,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { BudgetStatus } from '../../types';
import { formatCurrency } from '../../utils';

interface BudgetOverviewProps {
  budgetStatuses: BudgetStatus[];
}

export const BudgetOverview: React.FC<BudgetOverviewProps> = ({
  budgetStatuses,
}) => {
  const navigate = useNavigate();

  const handleViewAll = () => {
    navigate('/budgets');
  };

  const handleCreateBudget = () => {
    navigate('/budgets');
  };

  if (budgetStatuses.length === 0) {
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
          No budgets set up yet
        </Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={handleCreateBudget}
        >
          Create your first budget
        </Button>
      </Box>
    );
  }

  const overBudgetCount = budgetStatuses.filter(status => status.percentageUsed > 100).length;
  const nearLimitCount = budgetStatuses.filter(status => 
    status.percentageUsed >= 80 && status.percentageUsed <= 100
  ).length;

  const getProgressColor = (percentageUsed: number): 'primary' | 'warning' | 'error' => {
    if (percentageUsed > 100) return 'error';
    if (percentageUsed >= 80) return 'warning';
    return 'primary';
  };

  const getStatusChip = (percentageUsed: number) => {
    if (percentageUsed > 100) {
      return (
        <Chip
          icon={<Warning />}
          label="Over Budget"
          color="error"
          size="small"
          variant="outlined"
        />
      );
    }
    if (percentageUsed >= 80) {
      return (
        <Chip
          icon={<Warning />}
          label="Near Limit"
          color="warning"
          size="small"
          variant="outlined"
        />
      );
    }
    return (
      <Chip
        icon={<CheckCircle />}
        label="On Track"
        color="success"
        size="small"
        variant="outlined"
      />
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Budget Overview</Typography>
        <Button
          size="small"
          endIcon={<ArrowForward />}
          onClick={handleViewAll}
        >
          View All
        </Button>
      </Box>

      {/* Budget Alerts */}
      {overBudgetCount > 0 && (
        <Alert severity="error" sx={{ mb: 2, fontSize: '0.875rem' }}>
          {overBudgetCount} {overBudgetCount === 1 ? 'category' : 'categories'} over budget
        </Alert>
      )}

      {nearLimitCount > 0 && overBudgetCount === 0 && (
        <Alert severity="warning" sx={{ mb: 2, fontSize: '0.875rem' }}>
          {nearLimitCount} {nearLimitCount === 1 ? 'category' : 'categories'} approaching limit
        </Alert>
      )}

      {/* Budget Progress List */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {budgetStatuses.slice(0, 5).map((budget) => (
          <Box key={budget.categoryId}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" fontWeight="medium">
                {budget.categoryName}
              </Typography>
              {getStatusChip(budget.percentageUsed)}
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {formatCurrency(budget.spentAmount)} of {formatCurrency(budget.budgetAmount)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {budget.percentageUsed.toFixed(1)}%
              </Typography>
            </Box>
            
            <LinearProgress
              variant="determinate"
              value={Math.min(budget.percentageUsed, 100)}
              color={getProgressColor(budget.percentageUsed)}
              sx={{ height: 6, borderRadius: 3 }}
            />
            
            {budget.percentageUsed > 100 && (
              <Typography variant="caption" color="error.main" sx={{ mt: 0.5, display: 'block' }}>
                {formatCurrency(budget.spentAmount - budget.budgetAmount)} over budget
              </Typography>
            )}
          </Box>
        ))}
      </Box>

      {budgetStatuses.length > 5 && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button
            variant="outlined"
            size="small"
            onClick={handleViewAll}
            endIcon={<ArrowForward />}
          >
            View {budgetStatuses.length - 5} more budgets
          </Button>
        </Box>
      )}
    </Box>
  );
};