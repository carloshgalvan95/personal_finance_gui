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
  Alert,
  InputAdornment,
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import type { InvestmentForm as InvestmentFormType } from '../../types';

interface InvestmentFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: InvestmentFormType) => void;
  initialData?: Partial<InvestmentFormType>;
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
  const [formData, setFormData] = useState<InvestmentFormType>({
    symbol: initialData.symbol || '',
    type: initialData.type || 'etf',
    name: initialData.name || '',
    quantity: initialData.quantity || '',
    purchasePrice: initialData.purchasePrice || '',
    purchaseDate: initialData.purchaseDate || new Date().toISOString().split('T')[0],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inputMode, setInputMode] = useState<'total' | 'per_share'>('total');

  const handleInputChange = (field: keyof InvestmentFormType) => (
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
      newErrors.purchasePrice = inputMode === 'total' 
        ? 'Total investment amount must be greater than 0' 
        : 'Price per share must be greater than 0';
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      try {
        // Convert form data to ensure purchasePrice is always price per share
        const submissionData = { ...formData };
        
        if (inputMode === 'total') {
          // User entered total investment amount, calculate price per share
          const totalAmount = parseFloat(formData.purchasePrice);
          const quantity = parseFloat(formData.quantity);
          submissionData.purchasePrice = (totalAmount / quantity).toString();
        }
        // If inputMode is 'per_share', purchasePrice is already correct
        
        await onSubmit(submissionData);
        handleClose();
      } catch (error) {
        console.error('Error submitting investment:', error);
        // Handle error - could set an error state here
      } finally {
        setIsSubmitting(false);
      }
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
    setInputMode('total');
    onClose();
  };

  const selectedAsset = ASSET_OPTIONS.find(option => option.symbol === formData.symbol);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Add Investment</DialogTitle>
        
        <DialogContent sx={{ pt: 2 }}>
          {/* Improvement Notice */}
          <Alert severity="info" sx={{ mb: 3 }}>
            <strong>Improved Investment Entry!</strong> You can now enter your investment using either the total amount you invested or the price per share. The system will automatically calculate the correct values.
          </Alert>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
            {/* Asset Selection */}
            <Box sx={{ gridColumn: '1 / -1' }}>
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
            </Box>

            {/* Asset Type (Read-only, auto-filled) */}
            <Box>
              <TextField
                fullWidth
                label="Type"
                value={formData.type.toUpperCase()}
                InputProps={{
                  readOnly: true,
                }}
                variant="outlined"
              />
            </Box>

            {/* Asset Name (Auto-filled, editable) */}
            <Box>
              <TextField
                fullWidth
                label="Name"
                value={formData.name}
                onChange={handleInputChange('name')}
                error={!!errors.name}
                helperText={errors.name}
              />
            </Box>

            {/* Quantity */}
            <Box>
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
            </Box>

            {/* Input Mode Toggle */}
            <Box sx={{ gridColumn: '1 / -1' }}>
              <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                How would you like to enter your investment?
              </Typography>
              <ToggleButtonGroup
                value={inputMode}
                exclusive
                onChange={(_, value) => value && setInputMode(value)}
                size="small"
                sx={{ mb: 2 }}
              >
                <ToggleButton value="total">Total Amount Invested</ToggleButton>
                <ToggleButton value="per_share">Price Per Share</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {/* Purchase Price */}
            <Box>
              <TextField
                fullWidth
                label={inputMode === 'total' ? 'Total Amount Invested' : 'Price Per Share'}
                type="number"
                value={formData.purchasePrice}
                onChange={handleInputChange('purchasePrice')}
                error={!!errors.purchasePrice}
                helperText={
                  errors.purchasePrice || 
                  (inputMode === 'total' 
                    ? 'Enter the total USD amount you invested' 
                    : 'Enter the price you paid per share/unit')
                }
                inputProps={{ min: 0, step: 0.01 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Box>

            {/* Purchase Date */}
            <Box sx={{ gridColumn: '1 / -1' }}>
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
            </Box>

            {/* Investment Summary */}
            {formData.quantity && formData.purchasePrice && (
              <Box sx={{ gridColumn: '1 / -1' }}>
                <Alert severity="info">
                  {inputMode === 'total' ? (
                    <>
                      <strong>Price Per Share:</strong> $
                      {(parseFloat(formData.purchasePrice) / parseFloat(formData.quantity)).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 4,
                      })}
                      <br />
                      <strong>Total Investment:</strong> $
                      {parseFloat(formData.purchasePrice).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </>
                  ) : (
                    <>
                      <strong>Total Investment:</strong> $
                      {(parseFloat(formData.quantity) * parseFloat(formData.purchasePrice)).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                      <br />
                      <strong>Price Per Share:</strong> $
                      {parseFloat(formData.purchasePrice).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 4,
                      })}
                    </>
                  )}
                </Alert>
              </Box>
            )}

            {/* Asset Info */}
            {selectedAsset && (
              <Box sx={{ gridColumn: '1 / -1' }}>
                <Alert severity="success">
                  You're adding <strong>{selectedAsset.name} ({selectedAsset.symbol})</strong> to your portfolio.
                  This is a {selectedAsset.type === 'etf' ? 'Exchange-Traded Fund' : 'Cryptocurrency'}.
                </Alert>
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button 
            onClick={handleClose}
            disabled={isSubmitting}
            sx={{ minWidth: 100 }}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained"
            disabled={!formData.symbol || !formData.quantity || !formData.purchasePrice || isSubmitting}
            sx={{ minWidth: 140 }}
          >
            {isSubmitting ? 'Adding...' : 'Add Investment'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
