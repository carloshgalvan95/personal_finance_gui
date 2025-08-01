import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
} from '@mui/material';
import { Add, Receipt } from '@mui/icons-material';
import { PageHeader } from '../components/common/PageHeader';
import { TransactionForm } from '../components/features/TransactionForm';
import { TransactionList } from '../components/features/TransactionList';
import { useAuth } from '../hooks/useAuth';
import { TransactionService } from '../services/transactionService';
import type {
  Transaction,
  TransactionForm as TransactionFormData,
} from '../types';

export const Transactions: React.FC = () => {
  const { state } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(
    null
  );

  // Snackbar state
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Load transactions on component mount and when user changes
  useEffect(() => {
    if (state.user) {
      loadTransactions();
    }
  }, [state.user]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadTransactions = () => {
    if (!state.user) return;

    try {
      const userTransactions = TransactionService.getTransactions(
        state.user.id
      );
      setTransactions(userTransactions);
    } catch {
      showSnackbar('Failed to load transactions', 'error');
    }
  };

  const showSnackbar = (
    message: string,
    severity: 'success' | 'error' | 'info'
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleAddTransaction = () => {
    setEditingTransaction(null);
    setIsFormOpen(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingTransaction(null);
  };

  const handleSubmitTransaction = async (formData: TransactionFormData) => {
    if (!state.user) return;

    setIsLoading(true);

    try {
      const transactionData = {
        type: formData.type,
        amount: parseFloat(formData.amount),
        category: formData.category,
        description: formData.description.trim(),
        date: new Date(formData.date),
      };

      if (editingTransaction) {
        // Update existing transaction
        const updatedTransaction = TransactionService.updateTransaction(
          editingTransaction.id,
          transactionData
        );

        if (updatedTransaction) {
          setTransactions((prev) =>
            prev.map((t) =>
              t.id === editingTransaction.id ? updatedTransaction : t
            )
          );
          showSnackbar('Transaction updated successfully', 'success');
        } else {
          showSnackbar('Failed to update transaction', 'error');
        }
      } else {
        // Create new transaction
        const newTransaction = TransactionService.createTransaction(
          state.user.id,
          transactionData
        );

        setTransactions((prev) => [newTransaction, ...prev]);
        showSnackbar('Transaction added successfully', 'success');
      }

      handleCloseForm();
    } catch {
      showSnackbar('Failed to save transaction', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTransaction = (transactionId: string) => {
    setTransactionToDelete(transactionId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!transactionToDelete) return;

    try {
      const success = TransactionService.deleteTransaction(transactionToDelete);

      if (success) {
        setTransactions((prev) =>
          prev.filter((t) => t.id !== transactionToDelete)
        );
        showSnackbar('Transaction deleted successfully', 'success');
      } else {
        showSnackbar('Failed to delete transaction', 'error');
      }
    } catch {
      showSnackbar('Failed to delete transaction', 'error');
    }

    setDeleteDialogOpen(false);
    setTransactionToDelete(null);
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setTransactionToDelete(null);
  };

  return (
    <Box>
      <PageHeader
        title="Transactions"
        subtitle="Track your income and expenses"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Transactions' },
        ]}
        primaryAction={{
          label: 'Add Transaction',
          onClick: handleAddTransaction,
          icon: <Add />,
        }}
      />

      {/* Transaction List */}
      <TransactionList
        transactions={transactions}
        onEdit={handleEditTransaction}
        onDelete={handleDeleteTransaction}
        isLoading={isLoading}
      />

      {/* Transaction Form Dialog */}
      <TransactionForm
        open={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={handleSubmitTransaction}
        transaction={editingTransaction || undefined}
        isLoading={isLoading}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={cancelDelete}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Receipt />
            Confirm Delete
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this transaction? This action cannot
            be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDelete} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            variant="contained"
            color="error"
            sx={{ minWidth: 100 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
