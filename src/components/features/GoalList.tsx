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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  MoreVert,
  Edit,
  Delete,
  PlayArrow,
  Pause,
  CheckCircle,
  Warning,
  TrendingUp,
  Add,
  Remove,
} from '@mui/icons-material';
import type { FinancialGoal } from '../../types';
import { formatCurrency, formatDate } from '../../utils';
import { GoalService } from '../../services/goalService';

interface GoalListProps {
  goals: FinancialGoal[];
  onEditGoal: (goal: FinancialGoal) => void;
  onDeleteGoal: (goalId: string) => void;
  onRefresh: () => void;
}

export const GoalList: React.FC<GoalListProps> = ({
  goals,
  onEditGoal,
  onDeleteGoal,
  onRefresh,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedGoal, setSelectedGoal] = useState<FinancialGoal | null>(null);
  const [showContributionDialog, setShowContributionDialog] = useState(false);
  const [contributionAmount, setContributionAmount] = useState('');
  const [contributionType, setContributionType] = useState<'add' | 'remove'>('add');

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, goal: FinancialGoal) => {
    setAnchorEl(event.currentTarget);
    setSelectedGoal(goal);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedGoal(null);
  };

  const handleEdit = () => {
    if (selectedGoal) {
      onEditGoal(selectedGoal);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    if (selectedGoal) {
      onDeleteGoal(selectedGoal.id);
    }
    handleMenuClose();
  };

  const handleStatusChange = (status: 'active' | 'paused') => {
    if (selectedGoal) {
      GoalService.updateGoal(selectedGoal.id, { status });
      onRefresh();
    }
    handleMenuClose();
  };

  const handleContribution = (type: 'add' | 'remove') => {
    setContributionType(type);
    setShowContributionDialog(true);
    handleMenuClose();
  };

  const handleContributionSubmit = () => {
    if (!selectedGoal || !contributionAmount) return;

    const amount = parseFloat(contributionAmount);
    if (isNaN(amount) || amount <= 0) return;

    if (contributionType === 'add') {
      GoalService.addContribution(selectedGoal.id, amount);
    } else {
      GoalService.removeContribution(selectedGoal.id, amount);
    }

    setShowContributionDialog(false);
    setContributionAmount('');
    onRefresh();
  };

  const getGoalStatus = (goal: FinancialGoal) => {
    const progress = (goal.currentAmount / goal.targetAmount) * 100;
    const daysRemaining = Math.ceil((goal.targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    if (goal.status === 'completed') {
      return { color: 'success', icon: CheckCircle, text: 'Completed' };
    }
    if (goal.status === 'paused') {
      return { color: 'default', icon: Pause, text: 'Paused' };
    }
    if (daysRemaining < 0) {
      return { color: 'error', icon: Warning, text: 'Overdue' };
    }
    if (daysRemaining <= 30) {
      return { color: 'warning', icon: Warning, text: 'Due Soon' };
    }
    if (progress >= 75) {
      return { color: 'info', icon: TrendingUp, text: 'Almost There' };
    }
    return { color: 'primary', icon: PlayArrow, text: 'In Progress' };
  };

  const getProgressColor = (goal: FinancialGoal): 'primary' | 'success' | 'warning' | 'error' => {
    const progress = (goal.currentAmount / goal.targetAmount) * 100;
    const daysRemaining = Math.ceil((goal.targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    if (goal.status === 'completed' || progress >= 100) return 'success';
    if (daysRemaining < 0) return 'error';
    if (daysRemaining <= 30) return 'warning';
    return 'primary';
  };

  if (goals.length === 0) {
    return (
      <Alert severity="info">
        No financial goals created yet. Set your first goal to start saving with purpose!
      </Alert>
    );
  }

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {goals.map((goal) => {
          const status = getGoalStatus(goal);
          const StatusIcon = status.icon;
          const progress = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
          const daysRemaining = Math.ceil((goal.targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          const recommendedMonthly = GoalService.getRecommendedMonthlyContribution(goal);
          
          return (
            <Card key={goal.id} sx={{ position: 'relative' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" component="h3">
                      {goal.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {goal.description}
                    </Typography>
                    <Chip
                      icon={<StatusIcon />}
                      label={status.text}
                      color={status.color as 'success' | 'warning' | 'error' | 'primary' | 'default' | 'info'}
                      size="small"
                    />
                  </Box>
                  
                  <IconButton
                    onClick={(e) => handleMenuOpen(e, goal)}
                    size="small"
                  >
                    <MoreVert />
                  </IconButton>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Progress: {formatCurrency(goal.currentAmount)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Target: {formatCurrency(goal.targetAmount)}
                    </Typography>
                  </Box>
                  
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    color={getProgressColor(goal)}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {progress.toFixed(1)}% complete
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatCurrency(goal.targetAmount - goal.currentAmount)} remaining
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Target Date
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(goal.targetDate)}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" color="text.secondary">
                      {daysRemaining > 0 ? `${daysRemaining} days left` : 'Overdue'}
                    </Typography>
                    {goal.status === 'active' && recommendedMonthly > 0 && (
                      <Typography variant="caption" color="primary">
                        {formatCurrency(recommendedMonthly)}/month suggested
                      </Typography>
                    )}
                  </Box>
                </Box>

                {progress >= 100 && goal.status !== 'completed' && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    🎉 Congratulations! You've reached your goal! Consider marking it as completed.
                  </Alert>
                )}

                {daysRemaining < 0 && goal.status === 'active' && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    This goal is past its target date. Consider extending the deadline or adjusting the target.
                  </Alert>
                )}

                {daysRemaining <= 30 && daysRemaining > 0 && goal.status === 'active' && progress < 90 && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    Time is running out! You may need to increase your monthly contributions.
                  </Alert>
                )}
              </CardContent>
            </Card>
          );
        })}
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <Edit sx={{ mr: 1 }} />
          Edit Goal
        </MenuItem>
        <MenuItem onClick={() => handleContribution('add')}>
          <Add sx={{ mr: 1 }} />
          Add Contribution
        </MenuItem>
        <MenuItem onClick={() => handleContribution('remove')}>
          <Remove sx={{ mr: 1 }} />
          Remove Contribution
        </MenuItem>
        {selectedGoal?.status === 'active' && (
          <MenuItem onClick={() => handleStatusChange('paused')}>
            <Pause sx={{ mr: 1 }} />
            Pause Goal
          </MenuItem>
        )}
        {selectedGoal?.status === 'paused' && (
          <MenuItem onClick={() => handleStatusChange('active')}>
            <PlayArrow sx={{ mr: 1 }} />
            Resume Goal
          </MenuItem>
        )}
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} />
          Delete Goal
        </MenuItem>
      </Menu>

      <Dialog open={showContributionDialog} onClose={() => setShowContributionDialog(false)}>
        <DialogTitle>
          {contributionType === 'add' ? 'Add Contribution' : 'Remove Contribution'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Amount"
            type="number"
            value={contributionAmount}
            onChange={(e) => setContributionAmount(e.target.value)}
            sx={{ mt: 1 }}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            inputProps={{
              min: 0,
              step: 0.01,
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowContributionDialog(false)}>Cancel</Button>
          <Button onClick={handleContributionSubmit} variant="contained">
            {contributionType === 'add' ? 'Add' : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};