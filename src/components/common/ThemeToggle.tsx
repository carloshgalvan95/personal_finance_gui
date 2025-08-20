import React from 'react';
import { IconButton, Tooltip, Box } from '@mui/material';
import { LightMode, DarkMode } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';

interface ThemeToggleProps {
  size?: 'small' | 'medium' | 'large';
  showTooltip?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  size = 'medium', 
  showTooltip = true 
}) => {
  const { toggleTheme, isLight } = useTheme();

  const iconButton = (
    <IconButton
      onClick={toggleTheme}
      size={size}
      aria-label={`Switch to ${isLight ? 'dark' : 'light'} mode`}
      sx={{
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(var(--blur-amount))',
        border: '1px solid var(--border-glass)',
        transition: 'all 0.2s ease',
        '&:hover': {
          background: 'var(--bg-glass-hover)',
          transform: 'translateY(-1px)',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.3s ease',
        }}
      >
        {isLight ? (
          <LightMode 
            sx={{ 
              color: '#f59e0b',
              fontSize: size === 'small' ? 20 : size === 'medium' ? 24 : 28,
            }} 
          />
        ) : (
          <DarkMode 
            sx={{ 
              color: '#6366f1',
              fontSize: size === 'small' ? 20 : size === 'medium' ? 24 : 28,
            }} 
          />
        )}
      </Box>
    </IconButton>
  );

  if (showTooltip) {
    return (
      <Tooltip title={`Switch to ${isLight ? 'dark' : 'light'} mode`}>
        {iconButton}
      </Tooltip>
    );
  }

  return iconButton;
};
