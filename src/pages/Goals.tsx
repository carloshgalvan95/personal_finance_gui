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
  Tabs,
  Tab,
  Card,
  CardContent,
} from '@mui/material';
import { Add, TrendingUp, CheckCircle, Pause } from '@mui/icons-material';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { GoalForm } from '../components/features/GoalForm';
import { GoalList } from '../components/features/GoalList';
import { GoalService } from '../services/goalService';
import { useAuth } from '../hooks/useAuth';
import type { FinancialGoal } from '../types';
import { formatCurrency } from '../utils';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`goals-tabpanel-${index}`}
      aria-labelledby={`goals-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export const Goals: React.FC = () => {
  const { state } = useAuth();
  const user = state.user;
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  const loadGoals = useCallback(() => {
    if (!user) return;

    try {
      setIsLoading(true);
      const userGoals = GoalService.getGoals(user.id);
      setGoals(userGoals);
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const handleCreateGoal = () => {
    setEditingGoal(null);
    setShowGoalForm(true);
  };

  const handleEditGoal = (goal: FinancialGoal) => {
    setEditingGoal(goal);
    setShowGoalForm(true);
  };

  const handleDeleteGoal = (goalId: string) => {
    setGoalToDelete(goalId);
    setShowDeleteDialog(true);
  };

  const confirmDeleteGoal = () => {
    if (!goalToDelete) return;

    GoalService.deleteGoal(goalToDelete);
    loadGoals();
    
    setShowDeleteDialog(false);
    setGoalToDelete(null);
  };

  const handleGoalFormSuccess = () => {
    loadGoals();
  };

  const handleCloseGoalForm = () => {
    setShowGoalForm(false);
    setEditingGoal(null);
  };

  const handleCloseDeleteDialog = () => {
    setShowDeleteDialog(false);
    setGoalToDelete(null);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Filter goals by status
  const activeGoals = goals.filter(goal => goal.status === 'active');
  const completedGoals = goals.filter(goal => goal.status === 'completed');
  const pausedGoals = goals.filter(goal => goal.status === 'paused');

  // Get statistics
  const statistics = user ? GoalService.getGoalStatistics(user.id) : null;
  const overdueGoals = user ? GoalService.getOverdueGoals(user.id) : [];
  const nearDeadlineGoals = user ? GoalService.getGoalsNearDeadline(user.id) : [];

  return (
    <Box>
      <PageHeader
        title="Financial Goals"
        subtitle="Set and track your savings goals"
        actions={
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateGoal}
          >
            Create Goal
          </Button>
        }
      />

      <Box sx={{ mt: 3 }}>
        {/* Goal Alerts */}
        {overdueGoals.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="subtitle2">Overdue Goals!</Typography>
            You have {overdueGoals.length} overdue {overdueGoals.length === 1 ? 'goal' : 'goals'}: {' '}
            {overdueGoals.map(goal => goal.title).join(', ')}
          </Alert>
        )}

        {nearDeadlineGoals.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="subtitle2">Goals Due Soon!</Typography>
            You have {nearDeadlineGoals.length} {nearDeadlineGoals.length === 1 ? 'goal' : 'goals'} due within 30 days: {' '}
            {nearDeadlineGoals.map(goal => goal.title).join(', ')}
          </Alert>
        )}

        {/* Goals Statistics */}
        {statistics && goals.length > 0 && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Goals Overview
              </Typography>
              <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Goals
                  </Typography>
                  <Typography variant="h4">
                    {statistics.totalGoals}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Active
                  </Typography>
                  <Typography variant="h4" color="primary.main">
                    {statistics.activeGoals}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Completed
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {statistics.completedGoals}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Progress
                  </Typography>
                  <Typography variant="h4">
                    {formatCurrency(statistics.totalCurrentAmount)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    of {formatCurrency(statistics.totalTargetAmount)} ({statistics.overallProgress.toFixed(1)}%)
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Goals Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="goals tabs">
            <Tab 
              icon={<TrendingUp />} 
              label={`Active (${activeGoals.length})`} 
              iconPosition="start"
            />
            <Tab 
              icon={<CheckCircle />} 
              label={`Completed (${completedGoals.length})`} 
              iconPosition="start"
            />
            <Tab 
              icon={<Pause />} 
              label={`Paused (${pausedGoals.length})`} 
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {/* Tab Panels */}
        <TabPanel value={activeTab} index={0}>
          <GoalList
            goals={activeGoals}
            onEditGoal={handleEditGoal}
            onDeleteGoal={handleDeleteGoal}
            onRefresh={loadGoals}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <GoalList
            goals={completedGoals}
            onEditGoal={handleEditGoal}
            onDeleteGoal={handleDeleteGoal}
            onRefresh={loadGoals}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <GoalList
            goals={pausedGoals}
            onEditGoal={handleEditGoal}
            onDeleteGoal={handleDeleteGoal}
            onRefresh={loadGoals}
          />
        </TabPanel>
      </Box>

      {/* Goal Form Dialog */}
      <GoalForm
        open={showGoalForm}
        onClose={handleCloseGoalForm}
        onSuccess={handleGoalFormSuccess}
        editGoal={editingGoal}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete Goal</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this goal? This action cannot be undone and all progress will be lost.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={confirmDeleteGoal} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};