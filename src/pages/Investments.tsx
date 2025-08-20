import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Tabs,
  Tab,
  Alert,
  Chip,
  Fab,
} from '@mui/material';
import {
  Add,
  TrendingUp,
  PieChart,
  BarChart,
  AccountBalance,
  Timeline,
} from '@mui/icons-material';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { PortfolioOverview } from '../components/features/PortfolioOverview';
import { InvestmentForm } from '../components/features/InvestmentForm';
import { InvestmentPerformanceChart } from '../components/charts/InvestmentPerformanceChart';
import { useAuth } from '../hooks/useAuth';
import { InvestmentService } from '../services/investmentService';
import { MarketDataService } from '../services/marketDataService';
import type { InvestmentForm as InvestmentFormType, InvestmentPerformance, AssetPrice } from '../types';

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
      id={`investments-tabpanel-${index}`}
      aria-labelledby={`investments-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export const Investments: React.FC = () => {
  const { state } = useAuth();
  const user = state.user;

  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [performance, setPerformance] = useState<InvestmentPerformance[]>([]);
  const [marketData, setMarketData] = useState<AssetPrice[]>([]);
  const [stats, setStats] = useState({
    totalInvestments: 0,
    totalSymbols: 0,
    totalTransactions: 0,
    portfolioTypes: {} as Record<string, number>,
  });

  const loadInvestmentData = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Load performance data
      const performanceData = await InvestmentService.getInvestmentPerformance(user.id);
      setPerformance(performanceData);

      // Load market data for all your target assets
      const allMarketData = await MarketDataService.fetchAllInvestmentPrices();
      setMarketData(allMarketData);

      // Load statistics
      const statisticsData = InvestmentService.getInvestmentStatistics(user.id);
      setStats(statisticsData);

    } catch (error) {
      console.error('Error loading investment data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadInvestmentData();
  }, [loadInvestmentData]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleAddInvestment = async (formData: InvestmentFormType) => {
    if (!user) return;

    try {
      await InvestmentService.addInvestment(user.id, {
        symbol: formData.symbol,
        type: formData.type,
        name: formData.name,
        quantity: parseFloat(formData.quantity),
        purchasePrice: parseFloat(formData.purchasePrice),
        purchaseDate: new Date(formData.purchaseDate),
      });

      // Reload data after adding investment
      await loadInvestmentData();
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding investment:', error);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercent = (percent: number): string => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <Box>
        <Alert severity="error">Please log in to view your investments</Alert>
      </Box>
    );
  }

  const hasInvestments = performance.length > 0;
  const totalPortfolioValue = performance.reduce((sum, asset) => sum + asset.currentValue, 0);
  const totalGainLoss = performance.reduce((sum, asset) => sum + asset.gainLoss, 0);

  return (
    <Box>
      <PageHeader
        title="Investment Portfolio"
        subtitle="Track your ETFs, stocks, and cryptocurrency investments"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Investments' },
        ]}
      />

      {/* Quick Stats */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Chip
          icon={<AccountBalance />}
          label={`Portfolio Value: ${formatCurrency(totalPortfolioValue)}`}
          color={totalGainLoss >= 0 ? 'success' : 'error'}
          variant="outlined"
        />
        <Chip
          icon={<Timeline />}
          label={`${stats.totalSymbols} Assets`}
          variant="outlined"
        />
        <Chip
          icon={<TrendingUp />}
          label={`${stats.totalTransactions} Transactions`}
          variant="outlined"
        />
      </Box>

      {/* Market Overview List */}
      {marketData.length > 0 && (
        <Card className="glass-card" sx={{ mb: 3 }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" fontWeight="bold">
                Market Data
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Live prices for popular assets
              </Typography>
            </Box>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)', lg: 'repeat(6, 1fr)' }, 
              border: '1px solid',
              borderColor: 'divider',
              '& > *': {
                borderLeft: '1px solid',
                borderTop: '1px solid',
                borderColor: 'divider',
                position: 'relative',
              },
              '& > *:nth-of-type(1), & > *:nth-of-type(2)': { 
                borderTop: { xs: 'none' } 
              },
              '& > *:nth-of-type(1), & > *:nth-of-type(2), & > *:nth-of-type(3)': { 
                borderTop: { sm: 'none' } 
              },
              '& > *:nth-of-type(1), & > *:nth-of-type(2), & > *:nth-of-type(3), & > *:nth-of-type(4)': { 
                borderTop: { md: 'none' } 
              },
              '& > *:nth-of-type(1), & > *:nth-of-type(2), & > *:nth-of-type(3), & > *:nth-of-type(4), & > *:nth-of-type(5), & > *:nth-of-type(6)': { 
                borderTop: { lg: 'none' } 
              },
              '& > *:nth-of-type(2n+1)': { 
                borderLeft: { xs: 'none' } 
              },
              '& > *:nth-of-type(3n+1)': { 
                borderLeft: { sm: 'none' } 
              },
              '& > *:nth-of-type(4n+1)': { 
                borderLeft: { md: 'none' } 
              },
              '& > *:nth-of-type(6n+1)': { 
                borderLeft: { lg: 'none' } 
              },
            }}>
              {marketData.map((asset) => {
                const isPositive = asset.changePercent >= 0;
                const assetInfo = MarketDataService.getAssetInfo(asset.symbol);
                const assetType = assetInfo?.type || 'stock';
                
                // Color coding by asset type
                const getAssetColor = () => {
                  switch (assetType) {
                    case 'etf': return '#1976d2'; // Blue
                    case 'cryptocurrency': return '#ff9800'; // Orange  
                    case 'stock': return '#4caf50'; // Green
                    default: return '#9c27b0'; // Purple
                  }
                };

                return (
                  <Box 
                    key={asset.symbol}
                    sx={{ 
                      p: 2,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: 'action.hover',
                        transform: 'translateY(-1px)',
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Box 
                        sx={{ 
                          width: 8, 
                          height: 8, 
                          borderRadius: '50%', 
                          bgcolor: getAssetColor(),
                          flexShrink: 0
                        }} 
                      />
                      <Typography 
                        variant="body2" 
                        fontWeight="bold"
                        sx={{ 
                          color: getAssetColor(),
                          fontSize: '0.875rem'
                        }}
                      >
                        {asset.symbol}
                      </Typography>
                    </Box>
                    
                    <Typography 
                      variant="body1" 
                      fontWeight="bold" 
                      sx={{ mb: 0.5, fontSize: '1rem' }}
                    >
                      {formatCurrency(asset.price)}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 0.25,
                          color: isPositive ? '#4caf50' : '#f44336',
                          bgcolor: isPositive ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                          px: 0.75,
                          py: 0.25,
                          borderRadius: 1,
                          fontSize: '0.75rem'
                        }}
                      >
                        {isPositive ? (
                          <TrendingUp sx={{ fontSize: '0.875rem' }} />
                        ) : (
                          <TrendingUp sx={{ fontSize: '0.875rem', transform: 'rotate(180deg)' }} />
                        )}
                        <Typography variant="caption" fontWeight="bold">
                          {formatPercent(asset.changePercent)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </CardContent>
        </Card>
      )}

      {!hasInvestments ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Start Building Your Investment Portfolio
            </Typography>
            <Typography>
              Track your ETFs (VOO, VT, GLD, QQQ) and Bitcoin investments to monitor performance and gains.
            </Typography>
          </Alert>
          
          <Button
            variant="contained"
            size="large"
            startIcon={<Add />}
            onClick={() => setShowAddForm(true)}
          >
            Add Your First Investment
          </Button>

          {/* Show suggested assets */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Recommended Assets to Track
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2, justifyContent: 'center' }}>
              {['VOO', 'VT', 'GLD', 'QQQ', 'BTC'].map((symbol) => {
                const assetInfo = MarketDataService.getAssetInfo(symbol);
                const marketPrice = marketData.find(data => data.symbol === symbol);
                
                return (
                  <Box key={symbol}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" fontWeight="bold">
                          {symbol}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {assetInfo?.name || symbol}
                        </Typography>
                        {marketPrice && (
                          <Typography variant="body1" sx={{ mt: 1 }}>
                            {formatCurrency(marketPrice.price)}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>
      ) : (
        <>
          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={activeTab} onChange={handleTabChange} aria-label="investment tabs">
              <Tab icon={<TrendingUp />} label="Overview" />
              <Tab icon={<PieChart />} label="Allocation" />
              <Tab icon={<BarChart />} label="Performance" />
            </Tabs>
          </Box>

          {/* Tab Panels */}
          <TabPanel value={activeTab} index={0}>
            {/* Portfolio Overview */}
            <PortfolioOverview userId={user.id} onRefresh={loadInvestmentData} />
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            {/* Portfolio Allocation */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 3 }}>
              <Box>
                <Card className="glass-card">
                  <CardContent>
                    <InvestmentPerformanceChart
                      data={performance}
                      type="allocation"
                      height={400}
                      title="Portfolio Allocation"
                    />
                  </CardContent>
                </Card>
              </Box>
              <Box>
                <Card className="glass-card">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Asset Distribution
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {Object.entries(stats.portfolioTypes).map(([type, count]) => (
                        <Box key={type} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                            {type}s
                          </Typography>
                          <Chip label={count} size="small" />
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Box>
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            {/* Performance Charts */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
              <Box>
                <Card className="glass-card">
                  <CardContent>
                    <InvestmentPerformanceChart
                      data={performance}
                      type="performance"
                      height={300}
                      title="Current vs Invested Value"
                    />
                  </CardContent>
                </Card>
              </Box>
              <Box>
                <Card className="glass-card">
                  <CardContent>
                    <InvestmentPerformanceChart
                      data={performance}
                      type="returns"
                      height={300}
                      title="Return Percentage by Asset"
                    />
                  </CardContent>
                </Card>
              </Box>
            </Box>
          </TabPanel>

          {/* Floating Add Button */}
          <Fab
            color="primary"
            aria-label="add investment"
            sx={{ position: 'fixed', bottom: 32, right: 32 }}
            onClick={() => setShowAddForm(true)}
          >
            <Add />
          </Fab>
        </>
      )}

      {/* Add Investment Form */}
      <InvestmentForm
        open={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSubmit={handleAddInvestment}
      />
    </Box>
  );
};
