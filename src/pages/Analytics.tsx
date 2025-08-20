import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Tabs,
  Tab,
  Button,
  Grid,
} from '@mui/material';
import {
  TrendingUp,
  PieChart,
  BarChart,
  Assessment,
  Timeline,
  ShowChart,
} from '@mui/icons-material';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { SpendingTrendsChart } from '../components/charts/SpendingTrendsChart';
import { CategoryBreakdownChart } from '../components/charts/CategoryBreakdownChart';
import { MonthlyComparisonChart } from '../components/charts/MonthlyComparisonChart';
import { BudgetProgressChart } from '../components/charts/BudgetProgressChart';
import { FinancialHealthScore } from '../components/charts/FinancialHealthScore';
import { AnalyticsService } from '../services/analyticsService';
import { InvestmentService } from '../services/investmentService';
import { useAuth } from '../hooks/useAuth';

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
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export const Analytics: React.FC = () => {
  const { state } = useAuth();
  const user = state.user;

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [timeRange, setTimeRange] = useState<number>(12); // months

  // Analytics data state
  const [spendingTrends, setSpendingTrends] = useState<any[]>([]);
  const [categorySpending, setCategorySpending] = useState<any[]>([]);
  const [monthlyComparison, setMonthlyComparison] = useState<any[]>([]);
  const [budgetAnalysis, setBudgetAnalysis] = useState<any[]>([]);
  const [financialHealth, setFinancialHealth] = useState<any>(null);
  const [investmentStats, setInvestmentStats] = useState<any>(null);
  const [hasInvestments, setHasInvestments] = useState(false);

  const loadAnalyticsData = useCallback(() => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Load all analytics data
      const trends = AnalyticsService.getSpendingTrends(user.id);
      const categories = AnalyticsService.getCategorySpending(user.id, timeRange);
      const comparison = AnalyticsService.getMonthlyComparison(user.id, 6);
      const budgets = AnalyticsService.getBudgetAnalysis(user.id);
      const health = AnalyticsService.calculateFinancialHealthScore(user.id);
      
      // Load investment data
      const investments = InvestmentService.hasInvestments(user.id);
      const invStats = InvestmentService.getInvestmentStatistics(user.id);

      setSpendingTrends(trends);
      setCategorySpending(categories);
      setMonthlyComparison(comparison);
      setBudgetAnalysis(budgets);
      setFinancialHealth(health);
      setHasInvestments(investments);
      setInvestmentStats(invStats);

    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, timeRange]);

  useEffect(() => {
    loadAnalyticsData();
  }, [loadAnalyticsData]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleTimeRangeChange = (event: any) => {
    setTimeRange(event.target.value);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <Box>
        <Alert severity="error">Please log in to view analytics</Alert>
      </Box>
    );
  }

  // Quick stats for header
  const totalTransactions = spendingTrends.reduce((sum, month) => 
    sum + (month.income > 0 ? 1 : 0) + (month.expenses > 0 ? 1 : 0), 0
  );
  const topCategory = categorySpending.length > 0 ? categorySpending[0] : null;

  return (
    <Box>
      <PageHeader
        title="Analytics & Insights"
        subtitle="Comprehensive analysis of your financial data"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Analytics' },
        ]}
      />

      {/* Quick Stats */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        {financialHealth && (
          <Chip
            icon={<Assessment />}
            label={`Health Score: ${financialHealth.score}/100`}
            color={financialHealth.score >= 80 ? 'success' : 
                   financialHealth.score >= 65 ? 'info' : 
                   financialHealth.score >= 50 ? 'warning' : 'error'}
            variant="outlined"
          />
        )}
        <Chip
          icon={<Timeline />}
          label={`${totalTransactions} Transactions Analyzed`}
          variant="outlined"
        />
        {topCategory && (
          <Chip
            icon={<PieChart />}
            label={`Top Category: ${topCategory.category}`}
            variant="outlined"
          />
        )}
        {hasInvestments && investmentStats && (
          <Chip
            icon={<ShowChart />}
            label={`${investmentStats.totalSymbols} Investment Assets`}
            variant="outlined"
            color="primary"
          />
        )}
      </Box>

      {/* Time Range Selector */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={timeRange}
            onChange={handleTimeRangeChange}
            label="Time Range"
          >
            <MenuItem value={3}>Last 3 Months</MenuItem>
            <MenuItem value={6}>Last 6 Months</MenuItem>
            <MenuItem value={12}>Last 12 Months</MenuItem>
            <MenuItem value={24}>Last 2 Years</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="analytics tabs">
          <Tab icon={<TrendingUp />} label="Trends" />
          <Tab icon={<PieChart />} label="Categories" />
          <Tab icon={<BarChart />} label="Comparison" />
          <Tab icon={<Assessment />} label="Health Score" />
          {hasInvestments && <Tab icon={<ShowChart />} label="Investments" />}
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <TabPanel value={activeTab} index={0}>
        {/* Trends Tab */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 } }}>
          <Box className="glass-card dashboard-chart-card slide-up">
            <SpendingTrendsChart
              data={spendingTrends}
              height={400}
              title="Income vs Expenses Trend"
            />
          </Box>
          
          <Box 
            sx={{ 
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(auto-fit, minmax(350px, 1fr))',
              },
              gap: { xs: 2, md: 3 },
              gridAutoRows: 'auto',
            }}
          >
            <Box className="glass-card dashboard-chart-card slide-up">
              <MonthlyComparisonChart
                data={monthlyComparison}
                height={350}
                title="6-Month Comparison"
              />
            </Box>
            
            <Card className="glass-card dashboard-chart-card slide-up">
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                  <Typography 
                    variant="h6" 
                    gutterBottom 
                    sx={{ 
                      fontWeight: 700, 
                      color: 'rgba(255, 255, 255, 0.9)',
                      textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                    }}
                  >
                    Key Insights
                  </Typography>
                  
                  {spendingTrends.length > 0 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Average Monthly Net Income
                        </Typography>
                        <Typography variant="h6" color={
                          spendingTrends.reduce((sum, month) => sum + month.net, 0) >= 0 
                            ? 'success.main' 
                            : 'error.main'
                        }>
                          ${((spendingTrends.reduce((sum, month) => sum + month.net, 0)) / spendingTrends.length).toLocaleString()}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Best Performing Month
                        </Typography>
                        {(() => {
                          const bestMonth = spendingTrends.reduce((best, current) => 
                            current.net > best.net ? current : best
                          );
                          const date = new Date(bestMonth.date + '-01');
                          return (
                            <Typography variant="body1">
                              {date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} 
                              ({bestMonth.net >= 0 ? '+' : ''}${bestMonth.net.toLocaleString()})
                            </Typography>
                          );
                        })()}
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Box>
          </Box>
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        {/* Categories Tab */}
        <Box 
          sx={{ 
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              lg: '2fr 1fr',
            },
            gap: { xs: 2, md: 3 },
            gridAutoRows: 'auto',
          }}
        >
          <Box className="glass-card dashboard-chart-card slide-up">
            <CategoryBreakdownChart
              data={categorySpending}
              height={400}
              title="Spending by Category"
            />
          </Box>
          
          <Card className="glass-card dashboard-chart-card slide-up">
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Typography 
                  variant="h6" 
                  gutterBottom 
                  sx={{ 
                    fontWeight: 700, 
                    color: 'rgba(255, 255, 255, 0.9)',
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  Category Insights
                </Typography>
                
                {categorySpending.length > 0 && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Highest Spending Category
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {categorySpending[0].category}
                      </Typography>
                      <Typography variant="body2">
                        ${categorySpending[0].amount.toLocaleString()} 
                        ({categorySpending[0].percentage.toFixed(1)}% of total)
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Total Categories Used
                      </Typography>
                      <Typography variant="body1">
                        {categorySpending.length} categories
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Most Active Category
                      </Typography>
                      {(() => {
                        const mostActive = categorySpending.reduce((most, current) => 
                          current.transactionCount > most.transactionCount ? current : most
                        );
                        return (
                          <Typography variant="body1">
                            {mostActive.category} ({mostActive.transactionCount} transactions)
                          </Typography>
                        );
                      })()}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
        </Box>
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        {/* Comparison Tab */}
        <Box 
          sx={{ 
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: { xs: 2, md: 3 },
          }}
        >
          <Box className="glass-card dashboard-chart-card slide-up">
            <BudgetProgressChart
              data={budgetAnalysis}
              height={400}
              title="Budget Performance"
            />
          </Box>
          
          <Box className="glass-card dashboard-chart-card slide-up">
            <MonthlyComparisonChart
              data={monthlyComparison}
              height={400}
              title="Monthly Financial Performance"
            />
          </Box>
        </Box>
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        {/* Health Score Tab */}
        <Box 
          sx={{ 
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              lg: '2fr 1fr',
            },
            gap: { xs: 2, md: 3 },
            gridAutoRows: 'auto',
          }}
        >
          <Box className="glass-card dashboard-chart-card slide-up">
            {financialHealth && (
              <FinancialHealthScore
                healthScore={financialHealth}
                title="Financial Health Analysis"
              />
            )}
          </Box>
          
          <Card className="glass-card dashboard-chart-card slide-up">
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Typography 
                  variant="h6" 
                  gutterBottom 
                  sx={{ 
                    fontWeight: 700, 
                    color: 'rgba(255, 255, 255, 0.9)',
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  Health Score Breakdown
                </Typography>
                
                {financialHealth && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Alert severity={
                      financialHealth.score >= 80 ? 'success' : 
                      financialHealth.score >= 65 ? 'info' : 
                      financialHealth.score >= 50 ? 'warning' : 'error'
                    }>
                      Your financial health is <strong>{financialHealth.category}</strong> 
                      with a score of <strong>{financialHealth.score}/100</strong>.
                    </Alert>
                    
                    <Typography variant="body2" color="text.secondary">
                      The financial health score is calculated based on:
                    </Typography>
                    
                    <Box component="ul" sx={{ pl: 2, m: 0 }}>
                      <Typography component="li" variant="body2">
                        <strong>Savings Rate (30%)</strong> - How much you save relative to income
                      </Typography>
                      <Typography component="li" variant="body2">
                        <strong>Budget Adherence (25%)</strong> - How well you stick to budgets
                      </Typography>
                      <Typography component="li" variant="body2">
                        <strong>Goal Progress (25%)</strong> - Progress toward financial goals
                      </Typography>
                      <Typography component="li" variant="body2">
                        <strong>Expense Stability (20%)</strong> - Consistency of spending patterns
                      </Typography>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
        </Box>
      </TabPanel>

      {/* Investment Tab */}
      {hasInvestments && (
        <TabPanel value={activeTab} index={4}>
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Investment Analytics Integration
              </Typography>
              <Typography>
                You have {investmentStats?.totalSymbols || 0} investment assets being tracked. 
                For detailed investment analysis, visit the dedicated{' '}
                <Button 
                  variant="text" 
                  size="small" 
                  onClick={() => window.location.href = '/investments'}
                  sx={{ textTransform: 'none', p: 0, minWidth: 'auto' }}
                >
                  Investments page
                </Button>.
              </Typography>
            </Alert>

            {investmentStats && (
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card className="glass-card">
                    <CardContent>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Total Assets
                      </Typography>
                      <Typography variant="h4" fontWeight="bold">
                        {investmentStats.totalSymbols}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card className="glass-card">
                    <CardContent>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Total Investments
                      </Typography>
                      <Typography variant="h4" fontWeight="bold">
                        {investmentStats.totalInvestments}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card className="glass-card">
                    <CardContent>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Investment Transactions
                      </Typography>
                      <Typography variant="h4" fontWeight="bold">
                        {investmentStats.totalTransactions}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card className="glass-card">
                    <CardContent>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Asset Types
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {Object.entries(investmentStats.portfolioTypes).map(([type, count]) => (
                          <Chip 
                            key={type}
                            label={`${count} ${type.toUpperCase()}`}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </Box>
        </TabPanel>
      )}
    </Box>
  );
};