import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
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
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  DialogContentText,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Refresh,
  Info,
  AccountBalance,
  CurrencyBitcoin,
  MoreVert,
  Delete,
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
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAsset, setSelectedAsset] = useState<InvestmentPerformance | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, asset: InvestmentPerformance) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedAsset(asset);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    // Clear selectedAsset only if no dialog is open
    if (!deleteDialogOpen) {
      setSelectedAsset(null);
    }
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    setMenuAnchorEl(null); // Close menu but keep selectedAsset
  };

  const handleDeleteConfirm = async () => {
    if (!selectedAsset) {
      console.error('No selectedAsset when trying to delete');
      return;
    }

    try {
      console.log('Attempting to delete investment:', selectedAsset.symbol);
      
      // Find the investment by symbol
      const investment = InvestmentService.getInvestmentBySymbol(userId, selectedAsset.symbol);
      if (!investment) {
        console.error('Investment not found for symbol:', selectedAsset.symbol);
        setError(`Investment ${selectedAsset.symbol} not found.`);
        return;
      }

      console.log('Found investment to delete:', investment);
      
      const success = InvestmentService.deleteInvestment(investment.id);
      if (success) {
        console.log('Investment deleted successfully');
        // Reload portfolio data
        await loadPortfolioData();
        if (onRefresh) {
          onRefresh();
        }
      } else {
        console.error('Delete operation returned false');
        setError('Failed to delete investment. Investment may not exist.');
      }
    } catch (error) {
      console.error('Error deleting investment:', error);
      setError('Failed to delete investment. Please try again.');
    } finally {
      setDeleteDialogOpen(false);
      setSelectedAsset(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedAsset(null);
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
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 3 }}>
        {/* Total Portfolio Value */}
        <Box>
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
        </Box>

        {/* Total Invested */}
        <Box>
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
        </Box>

        {/* Total Gain/Loss */}
        <Box>
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
        </Box>

        {/* Total Return % */}
        <Box>
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
                      aria-label="refresh portfolio data"
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
        </Box>
      </Box>

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
                  <TableCell align="center">Actions</TableCell>
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
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, asset)}
                        aria-label={`options for ${asset.symbol} investment`}
                      >
                        <MoreVert />
                      </IconButton>
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

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Delete Investment
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Investment</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete your <strong>{selectedAsset?.symbol}</strong> investment?
            <br />
            <br />
            This will permanently remove:
            <br />
            • {selectedAsset?.quantity.toLocaleString()} shares
            <br />
            • Current value: {selectedAsset ? formatCurrency(selectedAsset.currentValue) : ''}
            <br />
            • All related transaction history
            <br />
            <br />
            <strong>This action cannot be undone.</strong>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            startIcon={<Delete />}
          >
            Delete Investment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
