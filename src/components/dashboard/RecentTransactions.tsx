import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  Button,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  ArrowForward,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { Transaction } from '../../types';
import { formatCurrency, formatDate } from '../../utils';

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  transactions,
}) => {
  const navigate = useNavigate();

  const handleViewAll = () => {
    navigate('/transactions');
  };

  if (transactions.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: 200,
          color: 'text.secondary',
        }}
      >
        <Typography variant="body2" gutterBottom>
          No transactions yet
        </Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={() => navigate('/transactions')}
        >
          Add your first transaction
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Recent Transactions</Typography>
        <Button
          size="small"
          endIcon={<ArrowForward />}
          onClick={handleViewAll}
        >
          View All
        </Button>
      </Box>

      <List sx={{ p: 0 }}>
        {transactions.slice(0, 8).map((transaction) => (
          <ListItem
            key={transaction.id}
            sx={{
              px: 0,
              py: 1,
              borderBottom: '1px solid',
              borderColor: 'divider',
              '&:last-child': {
                borderBottom: 'none',
              },
            }}
          >
            <ListItemAvatar>
              <Avatar
                sx={{
                  bgcolor: transaction.type === 'income' ? 'success.main' : 'error.main',
                  width: 32,
                  height: 32,
                }}
              >
                {transaction.type === 'income' ? (
                  <TrendingUp fontSize="small" />
                ) : (
                  <TrendingDown fontSize="small" />
                )}
              </Avatar>
            </ListItemAvatar>
            
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" fontWeight="medium">
                    {transaction.description}
                  </Typography>
                  <Typography
                    variant="body2"
                    fontWeight="medium"
                    color={transaction.type === 'income' ? 'success.main' : 'error.main'}
                  >
                    {transaction.type === 'income' ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </Typography>
                </Box>
              }
              secondary={
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                  <Chip
                    label={transaction.category}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.75rem', height: 20 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(new Date(transaction.date))}
                  </Typography>
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>

      {transactions.length > 8 && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button
            variant="outlined"
            size="small"
            onClick={handleViewAll}
            endIcon={<ArrowForward />}
          >
            View {transactions.length - 8} more transactions
          </Button>
        </Box>
      )}
    </Box>
  );
};