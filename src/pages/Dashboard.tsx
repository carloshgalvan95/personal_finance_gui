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
      className="modern-stat-card fade-in"
      sx={{ 
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': onClick ? { 
          transform: 'translateY(-8px) scale(1.02)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
        } : {},
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      onClick={onClick}
    >
      <CardContent 
        sx={{ 
          p: 3,
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'space-between',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* Top Section - Icon and Title */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'flex-start', 
          justifyContent: 'space-between', 
          mb: 2,
          minHeight: '48px',
          gap: 1,
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1.5,
            minWidth: 0,
            flex: 1,
          }}>
            <Avatar 
              sx={{ 
                bgcolor: 'transparent',
                background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
                boxShadow: `0 8px 25px ${color}40`,
                border: 'none',
                width: { xs: 40, sm: 48 },
                height: { xs: 40, sm: 48 },
                flexShrink: 0,
              }}
            >
              {icon}
            </Avatar>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600, 
                color: 'text.primary',
                fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                opacity: 0.8,
                lineHeight: 1.3,
              }}
            >
              {title}
            </Typography>
          </Box>
          
          {/* Change indicator icon - Fixed positioning */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: getChangeColor(),
            backgroundColor: changeType === 'positive' ? 'success.light' : 
                           changeType === 'negative' ? 'error.light' : 'grey.200',
            borderRadius: '50%',
            width: { xs: 28, sm: 32 },
            height: { xs: 28, sm: 32 },
            opacity: 0.15,
            flexShrink: 0,
          }}>
            <Box sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
              {getChangeIcon()}
            </Box>
          </Box>
        </Box>

        {/* Main Value */}
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center', 
          my: 1,
          minHeight: '44px',
          overflow: 'hidden',
        }}>
          <Typography 
            variant="h3" 
            component="div" 
            sx={{ 
              fontWeight: 800,
              lineHeight: 1.1,
              color: 'text.primary',
              fontSize: { xs: '1.5rem', sm: '1.8rem', md: '2rem' },
            }}
          >
            {value}
          </Typography>
        </Box>

        {/* Bottom Section - Change Information */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          minHeight: '28px',
          overflow: 'hidden',
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            color: getChangeColor(),
            backgroundColor: changeType === 'positive' ? 'success.light' : 
                           changeType === 'negative' ? 'error.light' : 'grey.200',
            borderRadius: '16px',
            px: { xs: 1, sm: 1.5 },
            py: 0.5,
            opacity: 0.9,
            minWidth: 0,
            flex: 1,
            maxWidth: '100%',
          }}>
            <Box sx={{ 
              fontSize: { xs: '0.8rem', sm: '0.9rem' },
              flexShrink: 0,
              mr: 0.5,
            }}>
              {getChangeIcon()}
            </Box>
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 600,
                fontSize: { xs: '0.7rem', sm: '0.8rem' },
                color: 'inherit',
                lineHeight: 1.3,
              }}
            >
              {change}
            </Typography>
          </Box>
        </Box>
      </CardContent>

      {/* Background gradient overlay */}
      <Box 
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '100%',
          height: '100%',
          background: `linear-gradient(135deg, transparent 0%, ${color}08 100%)`,
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />
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
    <Box 
      className="modern-dashboard-container"
      sx={{ 
        minHeight: '100vh',
        background: 'transparent',
        position: 'relative',
      }}
    >
      {/* Modern Header Section */}
      <Box className="dashboard-header-section">
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: { xs: 'flex-start', sm: 'center' },
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 2, sm: 0 },
            mb: 4,
          }}
        >
          <Box>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 800,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1,
                fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.5rem' },
              }}
            >
              Welcome back{user?.name ? `, ${user.name}` : ''}!
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'text.secondary',
                fontWeight: 400,
                fontSize: { xs: '0.9rem', sm: '1rem' },
              }}
            >
              Here's your financial overview for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Typography>
          </Box>
          
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/transactions')}
            className="modern-cta-button"
            sx={{
              borderRadius: '12px',
              px: 3,
              py: 1.5,
              fontWeight: 600,
              fontSize: '0.95rem',
              textTransform: 'none',
              boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                boxShadow: '0 12px 35px rgba(102, 126, 234, 0.4)',
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            Add Transaction
          </Button>
        </Box>

        {/* Alert Section */}
        {(insights.alerts.length > 0 || insights.insights.length > 0) && (
          <Box className="dashboard-alerts-section" sx={{ mb: 4 }}>
            {insights.alerts.map((alert, index) => (
              <Alert 
                key={`alert-${index}`}
                severity="warning" 
                sx={{ 
                  mb: 1.5,
                  borderRadius: '12px',
                  '& .MuiAlert-icon': { fontSize: '1.25rem' },
                  fontWeight: 500,
                }}
              >
                {alert}
              </Alert>
            ))}
            {insights.insights.slice(0, 2).map((insight, index) => (
              <Alert 
                key={`insight-${index}`}
                severity="info" 
                sx={{ 
                  mb: 1.5,
                  borderRadius: '12px',
                  '& .MuiAlert-icon': { fontSize: '1.25rem' },
                  fontWeight: 500,
                }}
              >
                {insight}
              </Alert>
            ))}
          </Box>
        )}
      </Box>

      {/* Modern Stats Grid */}
      <Box className="modern-stats-grid">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </Box>

      {/* Modern Dashboard Content Grid */}
      <Box className="modern-content-grid">
        {/* Recent Transactions - Full Width on Large Screens */}
        <Box className="modern-card-wrapper" sx={{ gridColumn: { lg: 'span 2' } }}>
          <Paper className="modern-dashboard-card slide-up">
            <RecentTransactions transactions={dashboardData.recentTransactions} />
          </Paper>
        </Box>

        {/* Budget Overview */}
        <Box className="modern-card-wrapper">
          <Paper className="modern-dashboard-card slide-up">
            <BudgetOverview budgetStatuses={dashboardData.budgetStatus} />
          </Paper>
        </Box>

        {/* Goals Progress */}
        <Box className="modern-card-wrapper">
          <Paper className="modern-dashboard-card slide-up">
            <GoalsProgress goalProgresses={dashboardData.goalProgress} />
          </Paper>
        </Box>

        {/* Spending by Category */}
        <Box className="modern-card-wrapper">
          <Paper className="modern-dashboard-card slide-up">
            <SpendingByCategory categorySpending={categorySpending} />
          </Paper>
        </Box>

        {/* Quick Actions */}
        <Box className="modern-card-wrapper">
          <Paper className="modern-dashboard-card slide-up">
            <Box sx={{ p: 3 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 700, 
                  mb: 3,
                  color: 'text.primary',
                  fontSize: '1.1rem',
                }}
              >
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  className="modern-action-button"
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={() => navigate('/transactions')}
                  fullWidth
                >
                  Add Transaction
                </Button>
                <Button
                  className="modern-action-button"
                  variant="outlined"
                  startIcon={<AccountBalance />}
                  onClick={() => navigate('/budgets')}
                  fullWidth
                >
                  Manage Budgets
                </Button>
                <Button
                  className="modern-action-button"
                  variant="outlined"
                  startIcon={<GpsFixed />}
                  onClick={() => navigate('/goals')}
                  fullWidth
                >
                  Track Goals
                </Button>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};