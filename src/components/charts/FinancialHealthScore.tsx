import React from 'react';
import { 
  Typography, 
  Box, 
  LinearProgress, 
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert
} from '@mui/material';
import {
  TrendingUp,
  AccountBalance,
  GpsFixed,
  ShowChart,
  CheckCircle,
  Warning,
  Error,
  Lightbulb,
} from '@mui/icons-material';
import type { FinancialHealthScore as HealthScoreType } from '../../services/analyticsService';

interface FinancialHealthScoreProps {
  healthScore: HealthScoreType;
  title?: string;
}

export const FinancialHealthScore: React.FC<FinancialHealthScoreProps> = ({
  healthScore,
  title = "Financial Health Score",
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 65) return 'info';
    if (score >= 50) return 'warning';
    return 'error';
  };

  const getScoreIcon = (category: string) => {
    switch (category) {
      case 'excellent': return <CheckCircle color="success" />;
      case 'good': return <TrendingUp color="info" />;
      case 'fair': return <Warning color="warning" />;
      case 'poor': return <Error color="error" />;
      default: return <ShowChart />;
    }
  };

  const getFactorIcon = (factorName: string) => {
    switch (factorName) {
      case 'savingsRate': return <AccountBalance />;
      case 'budgetAdherence': return <ShowChart />;
      case 'goalProgress': return <GpsFixed />;
      case 'expenseVariability': return <TrendingUp />;
      default: return <ShowChart />;
    }
  };

  const getFactorLabel = (factorName: string) => {
    switch (factorName) {
      case 'savingsRate': return 'Savings Rate';
      case 'budgetAdherence': return 'Budget Adherence';
      case 'goalProgress': return 'Goal Progress';
      case 'expenseVariability': return 'Expense Stability';
      default: return factorName;
    }
  };

  const getFactorDescription = (factorName: string, value: number) => {
    switch (factorName) {
      case 'savingsRate': return `${value.toFixed(1)}% of income saved`;
      case 'budgetAdherence': return `${value.toFixed(1)}% budget compliance`;
      case 'goalProgress': return `${value.toFixed(1)}% average goal progress`;
      case 'expenseVariability': return `${value.toFixed(1)}% expense stability`;
      default: return `${value.toFixed(1)}%`;
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography 
        variant="h6" 
        gutterBottom 
        sx={{ 
          fontWeight: 700, 
          color: 'rgba(255, 255, 255, 0.9)',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
        }}
      >
        {title}
      </Typography>

        {/* Overall Score */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Box sx={{ mr: 2 }}>
            {getScoreIcon(healthScore.category)}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h4" fontWeight="bold">
                {healthScore.score}
              </Typography>
              <Chip 
                label={healthScore.category.charAt(0).toUpperCase() + healthScore.category.slice(1)}
                color={getScoreColor(healthScore.score) as any}
                variant="outlined"
              />
            </Box>
            <LinearProgress
              variant="determinate"
              value={healthScore.score}
              color={getScoreColor(healthScore.score) as any}
              sx={{ height: 8, borderRadius: 4 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              Financial Health Score out of 100
            </Typography>
          </Box>
        </Box>

        {/* Factor Breakdown */}
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
          Score Breakdown
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
          {Object.entries(healthScore.factors).map(([factorName, factor]) => (
            <Box key={factorName}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box sx={{ mr: 1.5, color: 'text.secondary' }}>
                  {getFactorIcon(factorName)}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" fontWeight="medium">
                      {getFactorLabel(factorName)}
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {factor.score.toFixed(0)}/100
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {getFactorDescription(factorName, factor.value)}
                  </Typography>
                </Box>
              </Box>
              <LinearProgress
                variant="determinate"
                value={factor.score}
                color={getScoreColor(factor.score) as any}
                sx={{ height: 4, borderRadius: 2 }}
              />
            </Box>
          ))}
        </Box>

        {/* Recommendations */}
        {healthScore.recommendations.length > 0 && (
          <>
            <Typography variant="subtitle1" gutterBottom>
              Recommendations
            </Typography>
            <List dense>
              {healthScore.recommendations.map((recommendation, index) => (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <Lightbulb color="primary" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body2">
                        {recommendation}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </>
        )}

        {/* Health Category Description */}
        <Alert 
          severity={getScoreColor(healthScore.score) as any} 
          sx={{ mt: 2 }}
        >
          <Typography variant="body2">
            {healthScore.category === 'excellent' && 
              'Outstanding financial health! You\'re managing your money exceptionally well.'
            }
            {healthScore.category === 'good' && 
              'Good financial health. You\'re on the right track with room for minor improvements.'
            }
            {healthScore.category === 'fair' && 
              'Fair financial health. Focus on the recommendations to improve your financial situation.'
            }
            {healthScore.category === 'poor' && 
              'Your financial health needs attention. Follow the recommendations to get back on track.'
            }
          </Typography>
        </Alert>
    </Box>
  );
};