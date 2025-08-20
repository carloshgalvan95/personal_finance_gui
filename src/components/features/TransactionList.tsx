import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  Divider,
} from '@mui/material';
import {
  MoreVert,
  Edit,
  Delete,
  Search,
  TrendingUp,
  TrendingDown,
  FilterList,
} from '@mui/icons-material';
import type { Transaction } from '../../types';
import { formatCurrency, formatDate } from '../../utils';
import { CategoryService } from '../../services/transactionService';
import { EmptyState } from '../common/EmptyState';

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (transactionId: string) => void;
  isLoading?: boolean;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onEdit,
  onDelete,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>(
    'all'
  );
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    transaction: Transaction
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedTransaction(transaction);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTransaction(null);
  };

  const handleEdit = () => {
    if (selectedTransaction) {
      onEdit(selectedTransaction);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    if (selectedTransaction) {
      onDelete(selectedTransaction.id);
    }
    handleMenuClose();
  };

  // Filter transactions based on search and filters
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      searchTerm === '' ||
      transaction.description
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      transaction.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'all' || transaction.type === filterType;

    const matchesCategory =
      filterCategory === 'all' || transaction.category === filterCategory;

    return matchesSearch && matchesType && matchesCategory;
  });

  const categories = CategoryService.getCategories();
  const uniqueCategories = Array.from(
    new Set(transactions.map((t) => t.category))
  )
    .map((categoryId) => categories.find((c) => c.id === categoryId))
    .filter(Boolean);

  const getCategoryInfo = (categoryId: string) => {
    return CategoryService.getCategoryById(categoryId);
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>Loading transactions...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Search and Filter Controls */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search transactions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 250, flex: 1 }}
        />

        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Type</InputLabel>
          <Select
            value={filterType}
            onChange={(e) =>
              setFilterType(e.target.value as 'all' | 'income' | 'expense')
            }
            label="Type"
            startAdornment={<FilterList sx={{ mr: 1 }} />}
          >
            <MenuItem value="all">All Types</MenuItem>
            <MenuItem value="income">Income</MenuItem>
            <MenuItem value="expense">Expense</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            label="Category"
          >
            <MenuItem value="all">All Categories</MenuItem>
            {uniqueCategories.map((category) => (
              <MenuItem key={category?.id} value={category?.id}>
                {category?.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Transaction List */}
      {filteredTransactions.length === 0 ? (
        <EmptyState
          title="No transactions found"
          description={
            searchTerm || filterType !== 'all' || filterCategory !== 'all'
              ? 'No transactions match your current filters. Try adjusting your search criteria.'
              : "You haven't added any transactions yet. Start by adding your first transaction."
          }
          icon={
            searchTerm || filterType !== 'all' || filterCategory !== 'all'
              ? Search
              : TrendingUp
          }
        />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredTransactions.map((transaction) => {
            const category = getCategoryInfo(transaction.category);
            const isIncome = transaction.type === 'income';

            return (
              <Card
                key={transaction.id}
                sx={{
                  '&:hover': {
                    boxShadow: (theme) => theme.shadows[4],
                    transform: 'translateY(-1px)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {/* Transaction Type Icon */}
                    <Avatar
                      sx={{
                        bgcolor: isIncome ? 'success.main' : 'error.main',
                        width: 40,
                        height: 40,
                      }}
                    >
                      {isIncome ? <TrendingUp /> : <TrendingDown />}
                    </Avatar>

                    {/* Transaction Details */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mb: 0.5,
                        }}
                      >
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: 600,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {transaction.description}
                        </Typography>
                        <Chip
                          label={category?.name || transaction.category}
                          size="small"
                          sx={{
                            backgroundColor: category?.color || '#gray',
                            color: 'white',
                            fontSize: '0.75rem',
                          }}
                        />
                      </Box>

                      <Typography variant="body2" color="text.secondary">
                        {formatDate(new Date(transaction.date))}
                      </Typography>
                    </Box>

                    {/* Amount */}
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography
                        variant="h6"
                        sx={{
                          color: isIncome ? 'success.main' : 'error.main',
                          fontWeight: 600,
                        }}
                      >
                        {isIncome ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </Typography>
                    </Box>

                    {/* Actions Menu */}
                    <IconButton
                      onClick={(e) => handleMenuOpen(e, transaction)}
                      size="small"
                      aria-label={`options for transaction ${transaction.description}`}
                    >
                      <MoreVert />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { minWidth: 150 },
        }}
      >
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <Delete fontSize="small" sx={{ color: 'error.main' }} />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};
