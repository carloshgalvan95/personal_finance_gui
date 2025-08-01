import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Alert,
  InputAdornment,
} from '@mui/material';
import type { BudgetForm as BudgetFormData, Budget } from '../../types';
import { BudgetService } from '../../services/budgetService';
import { useAuth } from '../../hooks/useAuth';

interface BudgetFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editBudget?: Budget | null; // Budget to edit (optional)
}

export const BudgetForm: React.FC<BudgetFormProps> = ({
  open,
  onClose,
  onSuccess,
  editBudget,
}) => {
  const { state } = useAuth();
  const user = state.user;
  
  const [formData, setFormData] = useState<BudgetFormData>({
    categoryId: editBudget?.categoryId || '',
    amount: editBudget?.amount?.toString() || '',
    period: editBudget?.period || 'monthly',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = BudgetService.getExpenseCategories();

  const handleTextFieldChange = (field: keyof BudgetFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSelectChange = (field: keyof BudgetFormData) => (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    event: any
  ) => {
    const value = event.target.value as string;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
    }
    
    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        newErrors.amount = 'Amount must be a positive number';
      }
    }
    
    if (!formData.period) {
      newErrors.period = 'Period is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      if (!user) {
        console.error('No user found');
        return;
      }
      
      if (editBudget) {
        BudgetService.updateBudget(editBudget.id, formData);
      } else {
        BudgetService.createBudget(user.id, formData);
      }
      
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error saving budget:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      categoryId: '',
      amount: '',
      period: 'monthly',
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {editBudget ? 'Edit Budget' : 'Create New Budget'}
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <FormControl fullWidth error={!!errors.categoryId}>
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.categoryId}
                onChange={handleSelectChange('categoryId')}
                label="Category"
              >
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: category.color,
                        }}
                      />
                      {category.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              {errors.categoryId && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  {errors.categoryId}
                </Alert>
              )}
            </FormControl>

            <TextField
              fullWidth
              label="Budget Amount"
              type="number"
              value={formData.amount}
              onChange={handleTextFieldChange('amount')}
              error={!!errors.amount}
              helperText={errors.amount}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              inputProps={{
                min: 0,
                step: 0.01,
              }}
            />

            <FormControl fullWidth error={!!errors.period}>
              <InputLabel>Period</InputLabel>
              <Select
                value={formData.period}
                onChange={handleSelectChange('period')}
                label="Period"
              >
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="yearly">Yearly</MenuItem>
              </Select>
              {errors.period && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  {errors.period}
                </Alert>
              )}
            </FormControl>
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : editBudget ? 'Update Budget' : 'Create Budget'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};