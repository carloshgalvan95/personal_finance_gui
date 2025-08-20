import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Alert,
  InputAdornment,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import type { InvestmentForm } from '../../types';
import { MarketDataService } from '../../services/marketDataService';

interface InvestmentFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: InvestmentForm) => void;
  initialData?: Partial<InvestmentForm>;
}

const ASSET_OPTIONS = [
  { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', type: 'etf' as const },
  { symbol: 'VT', name: 'Vanguard Total World Stock ETF', type: 'etf' as const },
  { symbol: 'GLD', name: 'SPDR Gold Trust', type: 'etf' as const },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust', type: 'etf' as const },
  { symbol: 'BTC', name: 'Bitcoin', type: 'cryptocurrency' as const },
];

export const InvestmentForm: React.FC<InvestmentFormProps> = ({
  open,
  onClose,
  onSubmit,
  initialData = {},
}) => {
  const [formData, setFormData] = useState<InvestmentForm>({
    symbol: initialData.symbol || '',
    type: initialData.type || 'etf',
    name: initialData.name || '',
    quantity: initialData.quantity || '',
    purchasePrice: initialData.purchasePrice || '',
    purchaseDate: initialData.purchaseDate || new Date().toISOString().split('T')[0],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof InvestmentForm) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Auto-fill name when symbol is selected
    if (field === 'symbol') {
      const asset = ASSET_OPTIONS.find(option => option.symbol === value);
      if (asset) {
        setFormData(prev => ({ 
          ...prev, 
          symbol: value,
          name: asset.name, 
          type: asset.type 
        }));
      }
    }
  };

  const handleDateChange = (date: Date | null) => {
    if (date) {
      setFormData(prev => ({ 
        ...prev, 
        purchaseDate: date.toISOString().split('T')[0] 
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.symbol) {
      newErrors.symbol = 'Symbol is required';
    }

    if (!formData.name) {
      newErrors.name = 'Name is required';
    }

    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }

    if (!formData.purchasePrice || parseFloat(formData.purchasePrice) <= 0) {
      newErrors.purchasePrice = 'Purchase price must be greater than 0';
    }

    if (!formData.purchaseDate) {
      newErrors.purchaseDate = 'Purchase date is required';
    } else {
      const purchaseDate = new Date(formData.purchaseDate);
      const today = new Date();
      if (purchaseDate > today) {
        newErrors.purchaseDate = 'Purchase date cannot be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
      handleClose();
    }
  };

  const handleClose = () => {
    setFormData({
      symbol: '',
      type: 'etf',
      name: '',
      quantity: '',
      purchasePrice: '',
      purchaseDate: new Date().toISOString().split('T')[0],
    });
    setErrors({});
    onClose();
  };

  const selectedAsset = ASSET_OPTIONS.find(option => option.symbol === formData.symbol);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Add Investment</DialogTitle>
        
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={3}>
            {/* Asset Selection */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Asset</InputLabel>
                <Select
                  value={formData.symbol}
                  onChange={(e) => handleInputChange('symbol')({ target: { value: e.target.value } } as any)}
                  label="Asset"
                  error={!!errors.symbol}
                >
                  {ASSET_OPTIONS.map((option) => (
                    <MenuItem key={option.symbol} value={option.symbol}>
                      <div>
                        <div style={{ fontWeight: 'bold' }}>
                          {option.symbol} - {option.name}
                        </div>
                        <div style={{ fontSize: '0.8em', color: 'text.secondary' }}>
                          {option.type.toUpperCase()}
                        </div>
                      </div>
                    </MenuItem>
                  ))}
                </Select>
                {errors.symbol && (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    {errors.symbol}
                  </Alert>
                )}
              </FormControl>
            </Grid>

            {/* Asset Type (Read-only, auto-filled) */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Type"
                value={formData.type.toUpperCase()}
                InputProps={{
                  readOnly: true,
                }}
                variant="outlined"
              />
            </Grid>

            {/* Asset Name (Auto-filled, editable) */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Name"
                value={formData.name}
                onChange={handleInputChange('name')}
                error={!!errors.name}
                helperText={errors.name}
              />
            </Grid>

            {/* Quantity */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Quantity"
                type="number"
                value={formData.quantity}
                onChange={handleInputChange('quantity')}
                error={!!errors.quantity}
                helperText={errors.quantity}
                inputProps={{ 
                  min: 0,
                  step: formData.type === 'cryptocurrency' ? 0.00000001 : 0.001 
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      {formData.type === 'cryptocurrency' ? 'BTC' : 'shares'}
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Purchase Price */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Purchase Price"
                type="number"
                value={formData.purchasePrice}
                onChange={handleInputChange('purchasePrice')}
                error={!!errors.purchasePrice}
                helperText={errors.purchasePrice}
                inputProps={{ min: 0, step: 0.01 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>

            {/* Purchase Date */}
            <Grid item xs={12}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Purchase Date"
                  value={new Date(formData.purchaseDate)}
                  onChange={handleDateChange}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.purchaseDate,
                      helperText: errors.purchaseDate,
                    },
                  }}
                  maxDate={new Date()}
                />
              </LocalizationProvider>
            </Grid>

            {/* Investment Summary */}
            {formData.quantity && formData.purchasePrice && (
              <Grid item xs={12}>
                <Alert severity="info">
                  <strong>Total Investment:</strong> $
                  {(parseFloat(formData.quantity) * parseFloat(formData.purchasePrice)).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Alert>
              </Grid>
            )}

            {/* Asset Info */}
            {selectedAsset && (
              <Grid item xs={12}>
                <Alert severity="success">
                  You're adding <strong>{selectedAsset.name} ({selectedAsset.symbol})</strong> to your portfolio.
                  This is a {selectedAsset.type === 'etf' ? 'Exchange-Traded Fund' : 'Cryptocurrency'}.
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button 
            type="submit" 
            variant="contained"
            disabled={!formData.symbol || !formData.quantity || !formData.purchasePrice}
          >
            Add Investment
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
