import React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  SvgIcon,
  type SvgIconProps,
} from '@mui/material';
import { Add } from '@mui/icons-material';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ComponentType<SvgIconProps>;
  actionLabel?: string;
  onAction?: () => void;
  illustration?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon,
  actionLabel,
  onAction,
  illustration,
}) => {
  return (
    <Paper
      className="glass-card card-auto fade-in"
      sx={{
        p: { xs: 3, md: 6 },
        textAlign: 'center',
        border: '2px dashed rgba(255, 255, 255, 0.3)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
        }}
      >
        {/* Icon or Illustration */}
        {illustration || (
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              backgroundColor: 'grey.200',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {Icon && (
              <SvgIcon
                component={Icon}
                sx={{ fontSize: 40, color: 'grey.500' }}
              />
            )}
          </Box>
        )}

        {/* Content */}
        <Box>
          <Typography variant="h6" gutterBottom color="text.primary">
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {description}
          </Typography>
        </Box>

        {/* Action Button */}
        {actionLabel && onAction && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={onAction}
            sx={{ minWidth: 140 }}
          >
            {actionLabel}
          </Button>
        )}
      </Box>
    </Paper>
  );
};
