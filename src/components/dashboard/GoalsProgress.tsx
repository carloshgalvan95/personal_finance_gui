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
  CheckCircle,
  Warning,
  TrendingUp,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { GoalProgress } from '../../types';
import { formatCurrency } from '../../utils';

interface GoalsProgressProps {
  goalProgresses: GoalProgress[];
}

export const GoalsProgress: React.FC<GoalsProgressProps> = ({
  goalProgresses,
}) => {
  const navigate = useNavigate();

  const handleViewAll = () => {
    navigate('/goals');
  };

  const handleCreateGoal = () => {
    navigate('/goals');
  };

  if (goalProgresses.length === 0) {
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
          No financial goals set yet
        </Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={handleCreateGoal}
        >
          Set your first goal
        </Button>
      </Box>
    );
  }

  const completedGoals = goalProgresses.filter(goal => goal.progress >= 100).length;
  const nearDeadlineGoals = goalProgresses.filter(goal => 
    goal.daysRemaining <= 30 && goal.daysRemaining > 0 && goal.progress < 100
  ).length;
  const overdueGoals = goalProgresses.filter(goal => 
    goal.daysRemaining <= 0 && goal.progress < 100
  ).length;

  const getProgressColor = (progress: number, daysRemaining: number): 'primary' | 'success' | 'warning' | 'error' => {
    if (progress >= 100) return 'success';
    if (daysRemaining <= 0) return 'error';
    if (daysRemaining <= 30) return 'warning';
    return 'primary';
  };

  const getStatusChip = (progress: number, daysRemaining: number) => {
    if (progress >= 100) {
      return (
        <Chip
          icon={<CheckCircle />}
          label="Completed"
          color="success"
          size="small"
          variant="outlined"
        />
      );
    }
    if (daysRemaining <= 0) {
      return (
        <Chip
          icon={<Warning />}
          label="Overdue"
          color="error"
          size="small"
          variant="outlined"
        />
      );
    }
    if (daysRemaining <= 30) {
      return (
        <Chip
          icon={<Warning />}
          label="Due Soon"
          color="warning"
          size="small"
          variant="outlined"
        />
      );
    }
    return (
      <Chip
        icon={<TrendingUp />}
        label="On Track"
        color="primary"
        size="small"
        variant="outlined"
      />
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Goals Progress</Typography>
        <Button
          size="small"
          endIcon={<ArrowForward />}
          onClick={handleViewAll}
        >
          View All
        </Button>
      </Box>

      {/* Goal Alerts */}
      {overdueGoals > 0 && (
        <Alert severity="error" sx={{ mb: 2, fontSize: '0.875rem' }}>
          {overdueGoals} {overdueGoals === 1 ? 'goal' : 'goals'} overdue
        </Alert>
      )}

      {nearDeadlineGoals > 0 && overdueGoals === 0 && (
        <Alert severity="warning" sx={{ mb: 2, fontSize: '0.875rem' }}>
          {nearDeadlineGoals} {nearDeadlineGoals === 1 ? 'goal' : 'goals'} due within 30 days
        </Alert>
      )}

      {completedGoals > 0 && overdueGoals === 0 && nearDeadlineGoals === 0 && (
        <Alert severity="success" sx={{ mb: 2, fontSize: '0.875rem' }}>
          🎉 {completedGoals} {completedGoals === 1 ? 'goal' : 'goals'} completed!
        </Alert>
      )}

      {/* Goals Progress List */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {goalProgresses.slice(0, 4).map((goal) => (
          <Box key={goal.goalId}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" fontWeight="medium" noWrap sx={{ mr: 1 }}>
                {goal.title}
              </Typography>
              {getStatusChip(goal.progress, goal.daysRemaining)}
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {formatCurrency(goal.currentAmount)} of {formatCurrency(goal.targetAmount)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {goal.progress.toFixed(1)}%
              </Typography>
            </Box>
            
            <LinearProgress
              variant="determinate"
              value={Math.min(goal.progress, 100)}
              color={getProgressColor(goal.progress, goal.daysRemaining)}
              sx={{ height: 6, borderRadius: 3 }}
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                {formatCurrency(goal.targetAmount - goal.currentAmount)} remaining
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {goal.daysRemaining > 0 
                  ? `${goal.daysRemaining} days left`
                  : goal.daysRemaining === 0
                  ? 'Due today'
                  : 'Overdue'
                }
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {goalProgresses.length > 4 && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button
            variant="outlined"
            size="small"
            onClick={handleViewAll}
            endIcon={<ArrowForward />}
          >
            View {goalProgresses.length - 4} more goals
          </Button>
        </Box>
      )}
    </Box>
  );
};