import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  Box,
  Alert,
  InputAdornment,
} from '@mui/material';
import {
  Add,
  TrendingUp,
  TrendingDown,
  AttachMoney,
} from '@mui/icons-material';
import type {
  Transaction,
  TransactionForm as TransactionFormData,
} from '../../types';
import { CategoryService } from '../../services/transactionService';
import { formatDateForInput } from '../../utils';

interface TransactionFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TransactionFormData) => void;
  transaction?: Transaction;
  isLoading?: boolean;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  open,
  onClose,
  onSubmit,
  transaction,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<TransactionFormData>({
    type: transaction?.type || 'expense',
    amount: transaction?.amount.toString() || '',
    category: transaction?.category || '',
    description: transaction?.description || '',
    date: transaction
      ? formatDateForInput(new Date(transaction.date))
      : formatDateForInput(new Date()),
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleTypeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newType: 'income' | 'expense' | null
  ) => {
    if (newType !== null) {
      setFormData((prev) => ({
        ...prev,
        type: newType,
        category: '', // Reset category when type changes
      }));

      // Clear category error when type changes
      if (errors.category) {
        setErrors((prev) => ({ ...prev, category: '' }));
      }
    }
  };

  const handleChange =
    (field: keyof TransactionFormData) =>
    (
      event:
        | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
        | { target: { value: unknown } }
    ) => {
      const value = event.target.value as string;
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));

      // Clear field error when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({
          ...prev,
          [field]: '',
        }));
      }
    };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Amount validation
    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        newErrors.amount = 'Please enter a valid amount greater than 0';
      }
    }

    // Category validation
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    // Date validation
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSubmit(formData);
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
      // Reset form when closing
      setFormData({
        type: 'expense',
        amount: '',
        category: '',
        description: '',
        date: formatDateForInput(new Date()),
      });
      setErrors({});
    }
  };

  const categories = CategoryService.getCategoriesByType(formData.type);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Add />
          {transaction ? 'Edit Transaction' : 'Add New Transaction'}
        </Box>
      </DialogTitle>

      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 2 }}>
          {/* Transaction Type Toggle */}
          <Box sx={{ mb: 3 }}>
            <ToggleButtonGroup
              value={formData.type}
              exclusive
              onChange={handleTypeChange}
              fullWidth
              sx={{ mb: 1 }}
            >
              <ToggleButton
                value="income"
                sx={{
                  py: 1.5,
                  '&.Mui-selected': {
                    backgroundColor: 'success.main',
                    color: 'success.contrastText',
                    '&:hover': {
                      backgroundColor: 'success.dark',
                    },
                  },
                }}
              >
                <TrendingUp sx={{ mr: 1 }} />
                Income
              </ToggleButton>
              <ToggleButton
                value="expense"
                sx={{
                  py: 1.5,
                  '&.Mui-selected': {
                    backgroundColor: 'error.main',
                    color: 'error.contrastText',
                    '&:hover': {
                      backgroundColor: 'error.dark',
                    },
                  },
                }}
              >
                <TrendingDown sx={{ mr: 1 }} />
                Expense
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Amount Field */}
          <TextField
            fullWidth
            label="Amount"
            value={formData.amount}
            onChange={handleChange('amount')}
            error={!!errors.amount}
            helperText={errors.amount}
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AttachMoney />
                </InputAdornment>
              ),
            }}
            placeholder="0.00"
          />

          {/* Category Field */}
          <FormControl fullWidth margin="normal" error={!!errors.category}>
            <InputLabel>Category</InputLabel>
            <Select
              value={formData.category}
              onChange={handleChange('category')}
              label="Category"
            >
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
            {errors.category && (
              <Box
                sx={{
                  color: 'error.main',
                  fontSize: '0.75rem',
                  mt: 0.5,
                  mx: 1.75,
                }}
              >
                {errors.category}
              </Box>
            )}
          </FormControl>

          {/* Description Field */}
          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={handleChange('description')}
            error={!!errors.description}
            helperText={errors.description}
            margin="normal"
            placeholder="Enter transaction description"
            multiline
            rows={2}
          />

          {/* Date Field */}
          <TextField
            fullWidth
            label="Date"
            type="date"
            value={formData.date}
            onChange={handleChange('date')}
            error={!!errors.date}
            helperText={errors.date}
            margin="normal"
            InputLabelProps={{
              shrink: true,
            }}
          />

          {/* Show loading or error state */}
          {isLoading && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Saving transaction...
            </Alert>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={handleClose} disabled={isLoading} variant="outlined">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading}
            sx={{ minWidth: 100 }}
          >
            {transaction ? 'Update' : 'Add'} Transaction
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};
