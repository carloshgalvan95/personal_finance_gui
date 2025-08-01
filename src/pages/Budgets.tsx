import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { BudgetForm } from '../components/features/BudgetForm';
import { BudgetList } from '../components/features/BudgetList';
import { BudgetService } from '../services/budgetService';
import { TransactionService } from '../services/transactionService';
import { useAuth } from '../hooks/useAuth';
import type { BudgetStatus, Budget } from '../types';

export const Budgets: React.FC = () => {
  const { state } = useAuth();
  const user = state.user;
  const [budgetStatuses, setBudgetStatuses] = useState<BudgetStatus[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<string | null>(null);

  const loadBudgets = useCallback(() => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // Load budgets and transactions
      const userBudgets = BudgetService.getBudgets(user.id);
      const transactions = TransactionService.getTransactions(user.id);
      
      // Calculate budget statuses
      const statuses = BudgetService.getBudgetStatuses(user.id, transactions);
      
      setBudgets(userBudgets);
      setBudgetStatuses(statuses);
    } catch (error) {
      console.error('Error loading budgets:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadBudgets();
  }, [user, loadBudgets]);

  const handleCreateBudget = () => {
    setEditingBudget(null);
    setShowBudgetForm(true);
  };

  const handleEditBudget = (categoryId: string) => {
    const budget = budgets.find(b => b.categoryId === categoryId);
    if (budget) {
      setEditingBudget(budget);
      setShowBudgetForm(true);
    }
  };

  const handleDeleteBudget = (categoryId: string) => {
    setBudgetToDelete(categoryId);
    setShowDeleteDialog(true);
  };

  const confirmDeleteBudget = () => {
    if (!budgetToDelete) return;

    const budget = budgets.find(b => b.categoryId === budgetToDelete);
    if (budget) {
      BudgetService.deleteBudget(budget.id);
      loadBudgets();
    }
    
    setShowDeleteDialog(false);
    setBudgetToDelete(null);
  };

  const handleBudgetFormSuccess = () => {
    loadBudgets();
  };

  const handleCloseBudgetForm = () => {
    setShowBudgetForm(false);
    setEditingBudget(null);
  };

  const handleCloseDeleteDialog = () => {
    setShowDeleteDialog(false);
    setBudgetToDelete(null);
  };

  // Get over-budget alerts
  const overBudgetCategories = budgetStatuses.filter(status => status.percentageUsed > 100);
  const nearLimitCategories = budgetStatuses.filter(status => 
    status.percentageUsed >= 80 && status.percentageUsed <= 100
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Box>
      <PageHeader
        title="Budget Management"
        subtitle="Track your spending against your budgets"
        actions={
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateBudget}
          >
            Create Budget
          </Button>
        }
      />

      <Box sx={{ mt: 3 }}>
        {/* Budget Alerts */}
        {overBudgetCategories.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="subtitle2">Over Budget Alert!</Typography>
            You have exceeded your budget in {overBudgetCategories.length} 
            {overBudgetCategories.length === 1 ? ' category' : ' categories'}: {' '}
            {overBudgetCategories.map(cat => cat.categoryName).join(', ')}
          </Alert>
        )}

        {nearLimitCategories.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="subtitle2">Budget Warning!</Typography>
            You're approaching your budget limit in {nearLimitCategories.length} 
            {nearLimitCategories.length === 1 ? ' category' : ' categories'}: {' '}
            {nearLimitCategories.map(cat => cat.categoryName).join(', ')}
          </Alert>
        )}

        {/* Budget Summary */}
        {budgetStatuses.length > 0 && (
          <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>
              Budget Overview
            </Typography>
            <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Total Budgets
                </Typography>
                <Typography variant="h4">
                  {budgetStatuses.length}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  On Track
                </Typography>
                <Typography variant="h4" color="success.main">
                  {budgetStatuses.filter(s => s.percentageUsed < 80).length}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Near Limit
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {nearLimitCategories.length}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Over Budget
                </Typography>
                <Typography variant="h4" color="error.main">
                  {overBudgetCategories.length}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}

        {/* Budget List */}
        <BudgetList
          budgetStatuses={budgetStatuses}
          onEditBudget={handleEditBudget}
          onDeleteBudget={handleDeleteBudget}
        />
      </Box>

      {/* Budget Form Dialog */}
      <BudgetForm
        open={showBudgetForm}
        onClose={handleCloseBudgetForm}
        onSuccess={handleBudgetFormSuccess}
        editBudget={editingBudget}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete Budget</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this budget? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={confirmDeleteBudget} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};