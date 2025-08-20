import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemButton,
  Divider,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  ExpandMore,
  FilterList,
  Clear,
  Save,
  Bookmark,
  Delete,
  Search,
  Analytics,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import type { Transaction } from '../../types';
import { CategoryService } from '../../services/transactionService';
import { FilterService, type TransactionFilters, type SavedFilter } from '../../services/filterService';
import { formatCurrency } from '../../utils';

interface AdvancedFiltersProps {
  transactions: Transaction[];
  onFiltersChange: (filters: TransactionFilters) => void;
  userId: string;
  initialFilters?: TransactionFilters;
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  transactions,
  onFiltersChange,
  userId,
  initialFilters = {}
}) => {
  const [filters, setFilters] = useState<TransactionFilters>(initialFilters);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showSavedFilters, setShowSavedFilters] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>(
    FilterService.getSavedFilters(userId)
  );

  const categories = CategoryService.getCategories();
  const stats = FilterService.getFilterStats(transactions, filters);
  const quickFilters = FilterService.getQuickFilters();

  const handleFilterChange = (newFilters: TransactionFilters) => {
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleDateRangeChange = (field: 'startDate' | 'endDate', value: Date | null) => {
    const newFilters = {
      ...filters,
      dateRange: {
        startDate: filters.dateRange?.startDate || null,
        endDate: filters.dateRange?.endDate || null,
        [field]: value
      }
    };
    handleFilterChange(newFilters);
  };

  const handleCategoriesChange = (selectedCategories: string[]) => {
    const newFilters = {
      ...filters,
      categories: selectedCategories.length > 0 ? selectedCategories : undefined
    };
    handleFilterChange(newFilters);
  };

  const handleAmountRangeChange = (field: 'min' | 'max', value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    const newFilters = {
      ...filters,
      amountRange: {
        min: filters.amountRange?.min || null,
        max: filters.amountRange?.max || null,
        [field]: numValue
      }
    };
    handleFilterChange(newFilters);
  };

  const handleTypesChange = (selectedTypes: string[]) => {
    const newFilters = {
      ...filters,
      types: selectedTypes.length > 0 ? selectedTypes as ('income' | 'expense')[] : undefined
    };
    handleFilterChange(newFilters);
  };

  const handleSearchChange = (value: string) => {
    const newFilters = {
      ...filters,
      searchText: value || undefined
    };
    handleFilterChange(newFilters);
  };

  const handleQuickFilter = (quickFilter: { name: string; filters: TransactionFilters }) => {
    handleFilterChange(quickFilter.filters);
  };

  const handleClearFilters = () => {
    const emptyFilters: TransactionFilters = {};
    setFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const handleSaveFilter = () => {
    if (filterName.trim()) {
      FilterService.saveFilter(userId, filterName.trim(), filters);
      setSavedFilters(FilterService.getSavedFilters(userId));
      setFilterName('');
      setShowSaveDialog(false);
    }
  };

  const handleLoadSavedFilter = (savedFilter: SavedFilter) => {
    FilterService.updateFilterLastUsed(userId, savedFilter.id);
    handleFilterChange(savedFilter.filters);
    setShowSavedFilters(false);
  };

  const handleDeleteSavedFilter = (filterId: string) => {
    FilterService.deleteFilter(userId, filterId);
    setSavedFilters(FilterService.getSavedFilters(userId));
  };

  const hasActiveFilters = Object.keys(filters).some(key => {
    const value = filters[key as keyof TransactionFilters];
    if (key === 'dateRange' && value && typeof value === 'object' && 'startDate' in value) {
      return value.startDate || value.endDate;
    }
    if (key === 'amountRange' && value && typeof value === 'object' && 'min' in value) {
      return value.min !== null || value.max !== null;
    }
    return value && (Array.isArray(value) ? value.length > 0 : true);
  });

  return (
    <>
      <Paper className="glass-card dashboard-chart-card slide-up" sx={{ mb: 3 }}>
        {/* Quick Filters Bar */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <FilterList color="primary" />
            <Typography variant="h6">Filters</Typography>
            {hasActiveFilters && (
              <Chip
                label={`${stats.filteredCount} of ${stats.totalCount}`}
                color="primary"
                size="small"
              />
            )}
            <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
              <Tooltip title="Save Current Filter">
                <IconButton 
                  onClick={() => setShowSaveDialog(true)}
                  disabled={!hasActiveFilters}
                  size="small"
                  aria-label="save current filter"
                >
                  <Save />
                </IconButton>
              </Tooltip>
              <Tooltip title="Saved Filters">
                <IconButton 
                  onClick={() => setShowSavedFilters(true)}
                  size="small"
                  aria-label="view saved filters"
                >
                  <Bookmark />
                </IconButton>
              </Tooltip>
              <Tooltip title="Clear All Filters">
                <IconButton 
                  onClick={handleClearFilters}
                  disabled={!hasActiveFilters}
                  size="small"
                  aria-label="clear all filters"
                >
                  <Clear />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Quick Filter Chips */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {quickFilters.map((quickFilter) => (
              <Chip
                key={quickFilter.name}
                label={quickFilter.name}
                onClick={() => handleQuickFilter(quickFilter)}
                variant="outlined"
                size="small"
              />
            ))}
          </Box>
        </Box>

        {/* Advanced Filters */}
        <Accordion expanded={isExpanded} onChange={(_, expanded) => setIsExpanded(expanded)}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography>Advanced Filters</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Row 1: Search and Transaction Types */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: '1 1 300px', minWidth: '200px' }}>
                  <TextField
                    fullWidth
                    label="Search Transactions"
                    value={filters.searchText || ''}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Search by description or category..."
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search />
                        </InputAdornment>
                      )
                    }}
                  />
                </Box>

                <Box sx={{ flex: '1 1 300px', minWidth: '200px' }}>
                  <FormControl fullWidth>
                    <InputLabel>Transaction Types</InputLabel>
                    <Select
                      multiple
                      value={filters.types || []}
                      onChange={(e) => handleTypesChange(e.target.value as string[])}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => (
                            <Chip key={value} label={value} size="small" />
                          ))}
                        </Box>
                      )}
                    >
                      <MenuItem value="income">
                        <Checkbox checked={filters.types?.includes('income') || false} />
                        <ListItemText primary="Income" />
                      </MenuItem>
                      <MenuItem value="expense">
                        <Checkbox checked={filters.types?.includes('expense') || false} />
                        <ListItemText primary="Expense" />
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>

              {/* Row 2: Date Range */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: '1 1 300px', minWidth: '200px' }}>
                  <DatePicker
                    label="Start Date"
                    value={filters.dateRange?.startDate}
                    onChange={(date) => handleDateRangeChange('startDate', date)}
                    enableAccessibleFieldDOMStructure={false}
                    slots={{
                      textField: (params) => <TextField {...params} fullWidth />
                    }}
                  />
                </Box>
                <Box sx={{ flex: '1 1 300px', minWidth: '200px' }}>
                  <DatePicker
                    label="End Date"
                    value={filters.dateRange?.endDate}
                    onChange={(date) => handleDateRangeChange('endDate', date)}
                    enableAccessibleFieldDOMStructure={false}
                    slots={{
                      textField: (params) => <TextField {...params} fullWidth />
                    }}
                  />
                </Box>
              </Box>

              {/* Row 3: Amount Range */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: '1 1 300px', minWidth: '200px' }}>
                  <TextField
                    fullWidth
                    label="Minimum Amount"
                    type="number"
                    value={filters.amountRange?.min || ''}
                    onChange={(e) => handleAmountRangeChange('min', e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>
                    }}
                  />
                </Box>
                <Box sx={{ flex: '1 1 300px', minWidth: '200px' }}>
                  <TextField
                    fullWidth
                    label="Maximum Amount"
                    type="number"
                    value={filters.amountRange?.max || ''}
                    onChange={(e) => handleAmountRangeChange('max', e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>
                    }}
                  />
                </Box>
              </Box>

              {/* Row 4: Categories */}
              <Box>
                <FormControl fullWidth>
                  <InputLabel>Categories</InputLabel>
                  <Select
                    multiple
                    value={filters.categories || []}
                    onChange={(e) => handleCategoriesChange(e.target.value as string[])}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => {
                          const category = categories.find(c => c.id === value);
                          return (
                            <Chip key={value} label={category?.name || value} size="small" />
                          );
                        })}
                      </Box>
                    )}
                  >
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        <Checkbox checked={filters.categories?.includes(category.id) || false} />
                        <ListItemText primary={category.name} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Filter Statistics */}
        {hasActiveFilters && (
          <Box sx={{ p: 2, bgcolor: 'background.default' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Analytics color="primary" />
                <Typography variant="body2" color="text.secondary">
                  Showing {stats.filteredCount} of {stats.totalCount} transactions
                </Typography>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Typography variant="body2" color="text.secondary">
                Net: <strong>{formatCurrency(stats.filteredAmount)}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Income: <strong>{stats.incomeCount}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Expenses: <strong>{stats.expenseCount}</strong>
              </Typography>
            </Box>
          </Box>
        )}
      </Paper>

      {/* Save Filter Dialog */}
      <Dialog open={showSaveDialog} onClose={() => setShowSaveDialog(false)}>
        <DialogTitle>Save Filter Preset</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Filter Name"
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            margin="dense"
            placeholder="e.g., Monthly Groceries"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSaveDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveFilter} disabled={!filterName.trim()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Saved Filters Dialog */}
      <Dialog 
        open={showSavedFilters} 
        onClose={() => setShowSavedFilters(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Saved Filter Presets</DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {savedFilters.length === 0 ? (
            <Alert severity="info" sx={{ m: 2 }}>
              No saved filters yet. Create some filters and save them for quick access!
            </Alert>
          ) : (
            <List>
              {savedFilters.map((savedFilter, index) => (
                <React.Fragment key={savedFilter.id}>
                  <ListItem
                    secondaryAction={
                      <IconButton
                        edge="end"
                        onClick={() => handleDeleteSavedFilter(savedFilter.id)}
                        aria-label={`delete saved filter ${savedFilter.name}`}
                      >
                        <Delete />
                      </IconButton>
                    }
                  >
                    <ListItemButton onClick={() => handleLoadSavedFilter(savedFilter)}>
                      <ListItemText
                        primary={savedFilter.name}
                        secondary={`Created: ${savedFilter.createdAt.toLocaleDateString()}`}
                      />
                    </ListItemButton>
                  </ListItem>
                  {index < savedFilters.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSavedFilters(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};