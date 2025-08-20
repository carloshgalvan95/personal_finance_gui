import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Refresh,
  Info,
  AccountBalance,
  CurrencyBitcoin,
} from '@mui/icons-material';
import type { Portfolio, InvestmentPerformance } from '../../types';
import { InvestmentService } from '../../services/investmentService';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface PortfolioOverviewProps {
  userId: string;
  onRefresh?: () => void;
}

export const PortfolioOverview: React.FC<PortfolioOverviewProps> = ({ 
  userId,
  onRefresh 
}) => {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [performance, setPerformance] = useState<InvestmentPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPortfolioData = async () => {
    try {
      setError(null);
      const [portfolioData, performanceData] = await Promise.all([
        InvestmentService.getPortfolio(userId),
        InvestmentService.getInvestmentPerformance(userId),
      ]);

      setPortfolio(portfolioData);
      setPerformance(performanceData);
    } catch (error) {
      console.error('Error loading portfolio data:', error);
      setError('Failed to load portfolio data. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadPortfolioData();
  }, [userId]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadPortfolioData();
    if (onRefresh) {
      onRefresh();
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

  const getAssetIcon = (type: string, symbol: string) => {
    if (symbol === 'BTC' || type === 'cryptocurrency') {
      return <CurrencyBitcoin />;
    }
    return <AccountBalance />;
  };

  const getPerformanceColor = (value: number) => {
    if (value > 0) return 'success.main';
    if (value < 0) return 'error.main';
    return 'text.secondary';
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!portfolio || performance.length === 0) {
    return (
      <Box>
        <Alert severity="info">
          No investments found. Start by adding your first investment to track your portfolio performance.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Portfolio Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Total Portfolio Value */}
        <Grid item xs={12} sm={6} md={3}>
          <Card className="glass-card">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Portfolio Value
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {formatCurrency(portfolio.totalValue)}
                  </Typography>
                </Box>
                <AccountBalance color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Invested */}
        <Grid item xs={12} sm={6} md={3}>
          <Card className="glass-card">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Invested
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {formatCurrency(portfolio.totalInvested)}
                  </Typography>
                </Box>
                <TrendingUp color="action" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Gain/Loss */}
        <Grid item xs={12} sm={6} md={3}>
          <Card className="glass-card">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Gain/Loss
                  </Typography>
                  <Typography 
                    variant="h5" 
                    fontWeight="bold"
                    color={getPerformanceColor(portfolio.totalGainLoss)}
                  >
                    {formatCurrency(portfolio.totalGainLoss)}
                  </Typography>
                </Box>
                {portfolio.totalGainLoss >= 0 ? (
                  <TrendingUp color="success" />
                ) : (
                  <TrendingDown color="error" />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Return % */}
        <Grid item xs={12} sm={6} md={3}>
          <Card className="glass-card">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Return
                  </Typography>
                  <Typography 
                    variant="h5" 
                    fontWeight="bold"
                    color={getPerformanceColor(portfolio.totalGainLossPercent)}
                  >
                    {formatPercent(portfolio.totalGainLossPercent)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Tooltip title="Refresh portfolio data">
                    <IconButton 
                      onClick={handleRefresh} 
                      disabled={isRefreshing}
                      size="small"
                    >
                      {isRefreshing ? (
                        <CircularProgress size={20} />
                      ) : (
                        <Refresh />
                      )}
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Portfolio Holdings Table */}
      <Card className="glass-card">
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight="bold">
              Portfolio Holdings
            </Typography>
            <Chip 
              label={`${performance.length} Assets`} 
              variant="outlined" 
              size="small" 
            />
          </Box>

          <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Asset</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell align="right">Avg Cost</TableCell>
                  <TableCell align="right">Current Price</TableCell>
                  <TableCell align="right">Market Value</TableCell>
                  <TableCell align="right">Gain/Loss</TableCell>
                  <TableCell align="right">Return %</TableCell>
                  <TableCell align="right">Day Change</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {performance.map((asset) => (
                  <TableRow key={asset.symbol} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getAssetIcon('', asset.symbol)}
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {asset.symbol}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {asset.name}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      {asset.quantity.toLocaleString(undefined, {
                        minimumFractionDigits: asset.symbol === 'BTC' ? 8 : 3,
                        maximumFractionDigits: asset.symbol === 'BTC' ? 8 : 3,
                      })}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(asset.purchasePrice)}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(asset.currentPrice)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      {formatCurrency(asset.currentValue)}
                    </TableCell>
                    <TableCell 
                      align="right" 
                      sx={{ 
                        color: getPerformanceColor(asset.gainLoss),
                        fontWeight: 'bold' 
                      }}
                    >
                      {formatCurrency(asset.gainLoss)}
                    </TableCell>
                    <TableCell 
                      align="right" 
                      sx={{ 
                        color: getPerformanceColor(asset.gainLossPercent),
                        fontWeight: 'bold' 
                      }}
                    >
                      {formatPercent(asset.gainLossPercent)}
                    </TableCell>
                    <TableCell 
                      align="right" 
                      sx={{ 
                        color: getPerformanceColor(asset.dayChangePercent) 
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                        {asset.dayChangePercent >= 0 ? (
                          <TrendingUp fontSize="small" />
                        ) : (
                          <TrendingDown fontSize="small" />
                        )}
                        {formatPercent(asset.dayChangePercent)}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Last Updated Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
            <Info fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary">
              Last updated: {portfolio.lastUpdated.toLocaleString()}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
