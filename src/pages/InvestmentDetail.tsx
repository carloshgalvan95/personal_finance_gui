import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,

  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,

} from '@mui/material';
import {
  ArrowBack,
  TrendingUp,
  TrendingDown,
  AccountBalance,
  CurrencyBitcoin,
  ShowChart,
  Timeline,
  Assessment,
} from '@mui/icons-material';
import { InvestmentService } from '../services/investmentService';
import { MarketDataService } from '../services/marketDataService';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { InvestmentPriceChart } from '../components/charts/InvestmentPriceChart';
import { InvestmentPerformanceOverview } from '../components/charts/InvestmentPerformanceOverview';
import { useAuth } from '../hooks/useAuth';
import type { Investment, InvestmentTransaction, AssetPrice } from '../types';

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
      id={`investment-tabpanel-${index}`}
      aria-labelledby={`investment-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export const InvestmentDetail: React.FC = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const { state } = useAuth();
  const [investment, setInvestment] = useState<Investment | null>(null);
  const [transactions, setTransactions] = useState<InvestmentTransaction[]>([]);
  const [currentPrice, setCurrentPrice] = useState<AssetPrice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    if (!symbol || !state.user) return;
    loadInvestmentData();
  }, [symbol, state.user]);

  const loadInvestmentData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!state.user || !symbol) {
        setError('Missing user or symbol');
        return;
      }

      // Get investment data
      const investmentData = InvestmentService.getInvestmentBySymbol(state.user.id, symbol);
      if (!investmentData) {
        setError(`Investment ${symbol} not found`);
        return;
      }

      // Get transactions
      const transactionData = InvestmentService.getInvestmentTransactions(investmentData.id);

      // Get current price
      let priceData: AssetPrice | null = null;
      try {
        if (symbol === 'BTC') {
          priceData = await MarketDataService.fetchBitcoinPrice();
        } else {
          priceData = await MarketDataService.fetchETFPrice(symbol);
        }
      } catch (priceError) {
        console.warn('Could not fetch current price:', priceError);
      }

      setInvestment(investmentData);
      setTransactions(transactionData);
      setCurrentPrice(priceData);
    } catch (error) {
      console.error('Error loading investment data:', error);
      setError('Failed to load investment data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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

  const formatDate = (date: Date | string): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getPerformanceColor = (value: number) => {
    if (value > 0) return 'success.main';
    if (value < 0) return 'error.main';
    return 'text.secondary';
  };

  const getAssetIcon = (symbol: string) => {
    if (symbol === 'BTC') {
      return <CurrencyBitcoin sx={{ fontSize: 40 }} />;
    }
    return <AccountBalance sx={{ fontSize: 40 }} />;
  };

  const calculateMetrics = () => {
    if (!investment || !currentPrice) return null;

    const currentValue = investment.quantity * currentPrice.price;
    const totalInvested = investment.quantity * investment.purchasePrice;
    const totalGainLoss = currentValue - totalInvested;
    const totalReturn = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;
    const dayChange = currentPrice.change || 0;
    const dayChangePercent = currentPrice.changePercent || 0;
    const dayChangeValue = investment.quantity * dayChange;

    return {
      currentValue,
      totalInvested,
      totalGainLoss,
      totalReturn,
      dayChange,
      dayChangePercent,
      dayChangeValue,
    };
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading investment details..." />;
  }

  if (error || !investment) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || 'Investment not found'}</Alert>
      </Box>
    );
  }

  const metrics = calculateMetrics();
  const assetInfo = MarketDataService.getAssetInfo(symbol!);

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/investments')} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          {getAssetIcon(symbol!)}
          <Box>
            <Typography variant="h4" fontWeight="bold">
              {symbol}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {assetInfo?.name || investment.name}
            </Typography>
          </Box>
          <Chip 
            label={investment.type.toUpperCase()} 
            color="primary" 
            variant="outlined" 
            sx={{ ml: 'auto' }}
          />
        </Box>
      </Box>

      {/* Price Overview */}
      {currentPrice && metrics && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' }, gap: 3 }}>
              <Box>
                <Typography variant="h3" fontWeight="bold">
                  {formatCurrency(currentPrice.price)}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  {metrics.dayChangePercent >= 0 ? (
                    <TrendingUp sx={{ color: 'success.main' }} />
                  ) : (
                    <TrendingDown sx={{ color: 'error.main' }} />
                  )}
                  <Typography 
                    variant="h6" 
                    sx={{ color: getPerformanceColor(metrics.dayChange) }}
                  >
                    {formatCurrency(metrics.dayChange)} ({formatPercent(metrics.dayChangePercent)})
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Today's Change
                </Typography>
              </Box>

              <Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Your Shares
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {investment.quantity.toLocaleString(undefined, {
                        minimumFractionDigits: symbol === 'BTC' ? 8 : 3,
                        maximumFractionDigits: symbol === 'BTC' ? 8 : 3,
                      })}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Market Value
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {formatCurrency(metrics.currentValue)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Total Return
                    </Typography>
                    <Typography 
                      variant="h6" 
                      fontWeight="bold"
                      sx={{ color: getPerformanceColor(metrics.totalGainLoss) }}
                    >
                      {formatCurrency(metrics.totalGainLoss)}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ color: getPerformanceColor(metrics.totalGainLoss) }}
                    >
                      {formatPercent(metrics.totalReturn)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Avg Cost
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {formatCurrency(investment.purchasePrice)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab 
              icon={<ShowChart />} 
              label="Overview" 
              iconPosition="start"
            />
            <Tab 
              icon={<Timeline />} 
              label="Transactions" 
              iconPosition="start"
            />
            <Tab 
              icon={<Assessment />} 
              label="Statistics" 
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {/* Overview Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 3 }}>
            {/* Price Chart */}
            <Box sx={{ mb: 4 }}>
              <InvestmentPriceChart
                symbol={symbol!}
                currentPrice={currentPrice}
                averageCost={investment.purchasePrice}
                height={350}
              />
            </Box>

            <Typography variant="h6" gutterBottom>
              Position Summary
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
              <Box>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Invested
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {metrics ? formatCurrency(metrics.totalInvested) : '-'}
                  </Typography>
                </Box>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Current Value
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {metrics ? formatCurrency(metrics.currentValue) : '-'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    First Purchase
                  </Typography>
                  <Typography variant="h6">
                    {formatDate(investment.purchaseDate)}
                  </Typography>
                </Box>
              </Box>
              <Box>
                {currentPrice && (
                  <>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Today's P&L
                      </Typography>
                      <Typography 
                        variant="h5" 
                        fontWeight="bold"
                        sx={{ color: getPerformanceColor(metrics?.dayChangeValue || 0) }}
                      >
                        {metrics ? formatCurrency(metrics.dayChangeValue) : '-'}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Last Updated
                      </Typography>
                      <Typography variant="h6">
                        {formatDate(currentPrice.lastUpdated)}
                      </Typography>
                    </Box>
                  </>
                )}
              </Box>
            </Box>
          </Box>
        </TabPanel>

        {/* Transactions Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Transaction History
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{formatDate(transaction.date)}</TableCell>
                      <TableCell>
                        <Chip 
                          label={transaction.type.toUpperCase()} 
                          color={transaction.type === 'buy' ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        {transaction.quantity.toLocaleString(undefined, {
                          minimumFractionDigits: symbol === 'BTC' ? 8 : 3,
                          maximumFractionDigits: symbol === 'BTC' ? 8 : 3,
                        })}
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(transaction.price)}
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(transaction.quantity * transaction.price)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>

        {/* Statistics Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 3 }}>
            {/* Performance Overview Charts */}
            {metrics && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Performance Overview
                </Typography>
                <InvestmentPerformanceOverview
                  symbol={symbol!}
                  totalReturn={metrics.totalGainLoss}
                  totalReturnPercent={metrics.totalReturn}
                  dayChange={metrics.dayChange}
                  dayChangePercent={metrics.dayChangePercent}
                  totalInvested={metrics.totalInvested}
                  currentValue={metrics.currentValue}
                />
              </Box>
            )}

            <Typography variant="h6" gutterBottom>
              Investment Statistics
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
              <Box>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Performance Metrics
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2">Total Return:</Typography>
                      <Typography 
                        variant="body2" 
                        fontWeight="bold"
                        sx={{ color: getPerformanceColor(metrics?.totalReturn || 0) }}
                      >
                        {metrics ? formatPercent(metrics.totalReturn) : '-'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2">Total Transactions:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {transactions.length}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2">Asset Type:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {investment.type.toUpperCase()}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
              <Box>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Market Information
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2">Current Price:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {currentPrice ? formatCurrency(currentPrice.price) : 'Loading...'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2">Day Change:</Typography>
                      <Typography 
                        variant="body2" 
                        fontWeight="bold"
                        sx={{ color: getPerformanceColor(currentPrice?.changePercent || 0) }}
                      >
                        {currentPrice ? formatPercent(currentPrice.changePercent || 0) : 'Loading...'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2">Your Average Cost:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {formatCurrency(investment.purchasePrice)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Box>
          </Box>
        </TabPanel>
      </Card>
    </Box>
  );
};
