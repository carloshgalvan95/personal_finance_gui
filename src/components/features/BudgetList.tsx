import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Alert,
} from '@mui/material';
import {
  MoreVert,
  Edit,
  Delete,
  Warning,
  CheckCircle,
} from '@mui/icons-material';
import type { BudgetStatus } from '../../types';
import { formatCurrency } from '../../utils';

interface BudgetListProps {
  budgetStatuses: BudgetStatus[];
  onEditBudget: (categoryId: string) => void;
  onDeleteBudget: (categoryId: string) => void;
}

export const BudgetList: React.FC<BudgetListProps> = ({
  budgetStatuses,
  onEditBudget,
  onDeleteBudget,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedBudget, setSelectedBudget] = useState<BudgetStatus | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, budget: BudgetStatus) => {
    setAnchorEl(event.currentTarget);
    setSelectedBudget(budget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedBudget(null);
  };

  const handleEdit = () => {
    if (selectedBudget) {
      onEditBudget(selectedBudget.categoryId);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    if (selectedBudget) {
      onDeleteBudget(selectedBudget.categoryId);
    }
    handleMenuClose();
  };

  const getBudgetStatus = (percentageUsed: number) => {
    if (percentageUsed > 100) return { color: 'error', icon: Warning, text: 'Over Budget' };
    if (percentageUsed >= 80) return { color: 'warning', icon: Warning, text: 'Near Limit' };
    return { color: 'success', icon: CheckCircle, text: 'On Track' };
  };

  const getProgressColor = (percentageUsed: number): 'primary' | 'warning' | 'error' => {
    if (percentageUsed > 100) return 'error';
    if (percentageUsed >= 80) return 'warning';
    return 'primary';
  };

  if (budgetStatuses.length === 0) {
    return (
      <Alert severity="info">
        No budgets created yet. Create your first budget to start tracking your spending!
      </Alert>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {budgetStatuses.map((budget) => {
        const status = getBudgetStatus(budget.percentageUsed);
        const StatusIcon = status.icon;
        
        return (
          <Card key={budget.categoryId} sx={{ position: 'relative' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="h6" component="h3">
                    {budget.categoryName}
                  </Typography>
                  <Chip
                    icon={<StatusIcon />}
                    label={status.text}
                    color={status.color as 'success' | 'warning' | 'error'}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </Box>
                
                <IconButton
                  onClick={(e) => handleMenuOpen(e, budget)}
                  size="small"
                  aria-label={`options for budget ${budget.categoryName}`}
                >
                  <MoreVert />
                </IconButton>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Spent: {formatCurrency(budget.spentAmount)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Budget: {formatCurrency(budget.budgetAmount)}
                  </Typography>
                </Box>
                
                <LinearProgress
                  variant="determinate"
                  value={Math.min(budget.percentageUsed, 100)}
                  color={getProgressColor(budget.percentageUsed)}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {budget.percentageUsed.toFixed(1)}% used
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color={budget.remainingAmount > 0 ? 'success.main' : 'error.main'}
                  >
                    {budget.remainingAmount > 0 
                      ? `${formatCurrency(budget.remainingAmount)} remaining`
                      : `${formatCurrency(Math.abs(budget.remainingAmount))} over budget`
                    }
                  </Typography>
                </Box>
              </Box>

              {budget.percentageUsed > 100 && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  You've exceeded your budget by {formatCurrency(budget.spentAmount - budget.budgetAmount)}
                </Alert>
              )}

              {budget.percentageUsed >= 80 && budget.percentageUsed <= 100 && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  You're approaching your budget limit. {formatCurrency(budget.remainingAmount)} remaining.
                </Alert>
              )}
            </CardContent>
          </Card>
        );
      })}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <Edit sx={{ mr: 1 }} />
          Edit Budget
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} />
          Delete Budget
        </MenuItem>
      </Menu>
    </Box>
  );
};