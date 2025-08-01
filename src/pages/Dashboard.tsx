import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  Avatar,
  Alert,
  Button,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  GpsFixed,
  Add,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { RecentTransactions } from '../components/dashboard/RecentTransactions';
import { BudgetOverview } from '../components/dashboard/BudgetOverview';
import { GoalsProgress } from '../components/dashboard/GoalsProgress';
import { SpendingByCategory } from '../components/dashboard/SpendingByCategory';
import { DashboardService } from '../services/dashboardService';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency } from '../utils';
import type { DashboardData } from '../types';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  changeType,
  icon,
  color,
  onClick,
}) => {
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive':
        return 'success.main';
      case 'negative':
        return 'error.main';
      default:
        return 'text.secondary';
    }
  };

  const getChangeIcon = () => {
    switch (changeType) {
      case 'positive':
        return <TrendingUp fontSize="small" />;
      case 'negative':
        return <TrendingDown fontSize="small" />;
      default:
        return null;
    }
  };

  return (
    <Card 
      sx={{ 
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? { boxShadow: 2 } : {},
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: color, mr: 2 }}>{icon}</Avatar>
          <Typography variant="h6" color="text.secondary">
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" component="div" gutterBottom>
          {value}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            color: getChangeColor(),
          }}
        >
          {getChangeIcon()}
          <Typography variant="body2" sx={{ ml: 0.5 }}>
            {change}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export const Dashboard: React.FC = () => {
  const { state } = useAuth();
  const user = state.user;
  const navigate = useNavigate();
  
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [insights, setInsights] = useState<{ alerts: string[]; insights: string[] }>({
    alerts: [],
    insights: [],
  });

  const loadDashboardData = useCallback(() => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // Load all dashboard data
      const data = DashboardService.getDashboardData(user.id);
      const financialInsights = DashboardService.getFinancialInsights(user.id);
      
      setDashboardData(data);
      setInsights(financialInsights);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (isLoading || !dashboardData) {
    return <LoadingSpinner />;
  }

  // Calculate monthly comparison for percentage changes
  const monthlyComparison = user ? DashboardService.getMonthlyComparison(user.id) : null;
  const categorySpending = user ? DashboardService.getSpendingByCategory(user.id) : [];

  // Calculate overall goal progress
  const totalGoalProgress = dashboardData.goalProgress.length > 0
    ? dashboardData.goalProgress.reduce((sum, goal) => sum + goal.progress, 0) / dashboardData.goalProgress.length
    : 0;

  const stats: StatCardProps[] = [
    {
      title: 'Net Worth',
      value: formatCurrency(dashboardData.netIncome),
      change: dashboardData.netIncome >= 0 ? 'Positive balance' : 'Negative balance',
      changeType: (dashboardData.netIncome >= 0 ? 'positive' : 'negative'),
      icon: <AccountBalance />,
      color: 'primary.main',
      onClick: () => navigate('/transactions'),
    },
    {
      title: 'Monthly Income',
      value: formatCurrency(monthlyComparison?.currentMonth.income || 0),
      change: monthlyComparison 
        ? `${monthlyComparison.change.income >= 0 ? '+' : ''}${monthlyComparison.change.income.toFixed(1)}% from last month`
        : 'No comparison data',
      changeType: ((monthlyComparison?.change.income || 0) >= 0 ? 'positive' : 'negative'),
      icon: <TrendingUp />,
      color: 'success.main',
      onClick: () => navigate('/transactions'),
    },
    {
      title: 'Monthly Expenses',
      value: formatCurrency(monthlyComparison?.currentMonth.expenses || 0),
      change: monthlyComparison 
        ? `${monthlyComparison.change.expenses >= 0 ? '+' : ''}${monthlyComparison.change.expenses.toFixed(1)}% from last month`
        : 'No comparison data',
      changeType: ((monthlyComparison?.change.expenses || 0) >= 0 ? 'negative' : 'positive'),
      icon: <TrendingDown />,
      color: 'error.main',
      onClick: () => navigate('/transactions'),
    },
    {
      title: 'Goals Progress',
      value: `${totalGoalProgress.toFixed(0)}%`,
      change: dashboardData.goalProgress.length > 0 
        ? `${dashboardData.goalProgress.length} active ${dashboardData.goalProgress.length === 1 ? 'goal' : 'goals'}`
        : 'No goals set',
      changeType: (totalGoalProgress >= 75 ? 'positive' : totalGoalProgress >= 50 ? 'neutral' : 'negative'),
      icon: <GpsFixed />,
      color: 'info.main',
      onClick: () => navigate('/goals'),
    },
  ];

  return (
    <Box>
      <PageHeader
        title={`Welcome back${user?.name ? `, ${user.name}` : ''}!`}
        subtitle="Here's your financial overview"
        actions={
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/transactions')}
          >
            Add Transaction
          </Button>
        }
      />

      {/* Financial Alerts */}
      {insights.alerts.length > 0 && (
        <Box sx={{ mb: 3 }}>
          {insights.alerts.map((alert, index) => (
            <Alert key={index} severity="warning" sx={{ mb: 1 }}>
              {alert}
            </Alert>
          ))}
        </Box>
      )}

      {/* Financial Insights */}
      {insights.insights.length > 0 && (
        <Box sx={{ mb: 3 }}>
          {insights.insights.slice(0, 2).map((insight, index) => (
            <Alert key={index} severity="info" sx={{ mb: 1 }}>
              {insight}
            </Alert>
          ))}
        </Box>
      )}

      {/* Stats Grid */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        {stats.map((stat, index) => (
          <Box
            key={index}
            sx={{
              flex: {
                xs: '1 1 100%',
                sm: '1 1 calc(50% - 12px)',
                md: '1 1 calc(25% - 18px)',
              },
            }}
          >
            <StatCard {...stat} />
          </Box>
        ))}
      </Box>

      {/* Dashboard Content */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {/* Recent Transactions */}
        <Box sx={{ flex: { xs: '1 1 100%', lg: '1 1 calc(40% - 12px)' } }}>
          <Paper sx={{ p: 3, height: 'fit-content' }}>
            <RecentTransactions transactions={dashboardData.recentTransactions} />
          </Paper>
        </Box>

        {/* Budget Overview */}
        <Box sx={{ flex: { xs: '1 1 100%', lg: '1 1 calc(30% - 12px)' } }}>
          <Paper sx={{ p: 3, height: 'fit-content' }}>
            <BudgetOverview budgetStatuses={dashboardData.budgetStatus} />
          </Paper>
        </Box>

        {/* Goals Progress */}
        <Box sx={{ flex: { xs: '1 1 100%', lg: '1 1 calc(30% - 12px)' } }}>
          <Paper sx={{ p: 3, height: 'fit-content' }}>
            <GoalsProgress goalProgresses={dashboardData.goalProgress} />
          </Paper>
        </Box>

        {/* Spending by Category */}
        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(50% - 12px)' } }}>
          <Paper sx={{ p: 3, height: 'fit-content' }}>
            <SpendingByCategory categorySpending={categorySpending} />
          </Paper>
        </Box>

        {/* Quick Actions */}
        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(50% - 12px)' } }}>
          <Paper sx={{ p: 3, height: 'fit-content' }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={() => navigate('/transactions')}
                fullWidth
              >
                Add Transaction
              </Button>
              <Button
                variant="outlined"
                startIcon={<AccountBalance />}
                onClick={() => navigate('/budgets')}
                fullWidth
              >
                Manage Budgets
              </Button>
              <Button
                variant="outlined"
                startIcon={<GpsFixed />}
                onClick={() => navigate('/goals')}
                fullWidth
              >
                Track Goals
              </Button>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};