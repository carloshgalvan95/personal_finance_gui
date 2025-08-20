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

      {/* Market Overview Cards */}
      {marketData.length > 0 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
          {marketData.map((asset) => {
            return (
              <Box key={asset.symbol}>
                <Card className="glass-card" sx={{ height: '100%' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {asset.symbol}
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {formatCurrency(asset.price)}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color={asset.changePercent >= 0 ? 'success.main' : 'error.main'}
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                    >
                      {asset.changePercent >= 0 ? <TrendingUp fontSize="small" /> : <TrendingUp fontSize="small" style={{ transform: 'rotate(180deg)' }} />}
                      {formatPercent(asset.changePercent)}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            );
          })}
        </Box>
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
