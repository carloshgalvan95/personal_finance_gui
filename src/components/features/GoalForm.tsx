import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Alert,
  InputAdornment,
  Typography,
} from '@mui/material';
import type { GoalForm as GoalFormData, FinancialGoal } from '../../types';
import { GoalService } from '../../services/goalService';
import { formatCurrency } from '../../utils';
import { useAuth } from '../../hooks/useAuth';

interface GoalFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editGoal?: FinancialGoal | null; // Goal to edit (optional)
}

export const GoalForm: React.FC<GoalFormProps> = ({
  open,
  onClose,
  onSuccess,
  editGoal,
}) => {
  const { state } = useAuth();
  const user = state.user;
  
  const [formData, setFormData] = useState<GoalFormData>({
    title: editGoal?.title || '',
    description: editGoal?.description || '',
    targetAmount: editGoal?.targetAmount?.toString() || '',
    targetDate: editGoal?.targetDate ? editGoal.targetDate.toISOString().split('T')[0] : '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: keyof GoalFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Goal title is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Goal description is required';
    }
    
    if (!formData.targetAmount) {
      newErrors.targetAmount = 'Target amount is required';
    } else {
      const amount = parseFloat(formData.targetAmount);
      if (isNaN(amount) || amount <= 0) {
        newErrors.targetAmount = 'Target amount must be a positive number';
      }
    }
    
    if (!formData.targetDate) {
      newErrors.targetDate = 'Target date is required';
    } else {
      const targetDate = new Date(formData.targetDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (targetDate <= today) {
        newErrors.targetDate = 'Target date must be in the future';
      }
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
      
      if (editGoal) {
        GoalService.updateGoal(editGoal.id, formData);
      } else {
        GoalService.createGoal(user.id, formData);
      }
      
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error saving goal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      targetAmount: '',
      targetDate: '',
    });
    setErrors({});
    onClose();
  };

  const calculateRecommendedMonthly = () => {
    if (!formData.targetAmount || !formData.targetDate) return 0;
    
    const targetAmount = parseFloat(formData.targetAmount);
    const targetDate = new Date(formData.targetDate);
    const now = new Date();
    const monthsRemaining = Math.max(1, Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)));
    const currentAmount = editGoal?.currentAmount || 0;
    const remainingAmount = Math.max(0, targetAmount - currentAmount);
    
    return remainingAmount / monthsRemaining;
  };

  const recommendedMonthly = calculateRecommendedMonthly();

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {editGoal ? 'Edit Financial Goal' : 'Create New Financial Goal'}
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              fullWidth
              label="Goal Title"
              value={formData.title}
              onChange={handleChange('title')}
              error={!!errors.title}
              helperText={errors.title}
              placeholder="e.g., Emergency Fund, Vacation, New Car"
            />

            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={formData.description}
              onChange={handleChange('description')}
              error={!!errors.description}
              helperText={errors.description}
              placeholder="Describe your goal and why it's important to you..."
            />

            <TextField
              fullWidth
              label="Target Amount"
              type="number"
              value={formData.targetAmount}
              onChange={handleChange('targetAmount')}
              error={!!errors.targetAmount}
              helperText={errors.targetAmount}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              inputProps={{
                min: 0,
                step: 0.01,
              }}
            />

            <TextField
              fullWidth
              label="Target Date"
              type="date"
              value={formData.targetDate}
              onChange={handleChange('targetDate')}
              error={!!errors.targetDate}
              helperText={errors.targetDate}
              InputLabelProps={{
                shrink: true,
              }}
            />

            {editGoal && (
              <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Current Progress
                </Typography>
                <Typography variant="h6">
                  {formatCurrency(editGoal.currentAmount)} of {formatCurrency(editGoal.targetAmount)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {((editGoal.currentAmount / editGoal.targetAmount) * 100).toFixed(1)}% complete
                </Typography>
              </Box>
            )}

            {recommendedMonthly > 0 && (
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Recommended monthly savings:</strong> {formatCurrency(recommendedMonthly)}
                </Typography>
                <Typography variant="caption" display="block">
                  Based on your target date and {editGoal ? 'remaining' : 'target'} amount
                </Typography>
              </Alert>
            )}
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
            {isSubmitting ? 'Saving...' : editGoal ? 'Update Goal' : 'Create Goal'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};