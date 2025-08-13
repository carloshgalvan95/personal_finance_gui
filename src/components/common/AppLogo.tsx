import React from 'react';
import { Box, Typography } from '@mui/material';
import { AccountBalance, TrendingUp } from '@mui/icons-material';

interface AppLogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  variant?: 'primary' | 'white' | 'dark';
}

export const AppLogo: React.FC<AppLogoProps> = ({ 
  size = 'medium', 
  showText = true,
  variant = 'primary'
}) => {
  const sizeConfig = {
    small: { 
      iconSize: 24, 
      fontSize: '1rem', 
      logoSize: 32,
      gap: 1
    },
    medium: { 
      iconSize: 32, 
      fontSize: '1.25rem', 
      logoSize: 40,
      gap: 1.5
    },
    large: { 
      iconSize: 48, 
      fontSize: '1.75rem', 
      logoSize: 64,
      gap: 2
    }
  };

  const config = sizeConfig[size];

  const getColors = () => {
    switch (variant) {
      case 'white':
        return {
          primary: '#ffffff',
          secondary: '#f5f5f5',
          text: '#ffffff'
        };
      case 'dark':
        return {
          primary: '#2c3e50',
          secondary: '#34495e',
          text: '#2c3e50'
        };
      default:
        return {
          primary: '#1976d2',
          secondary: '#42a5f5',
          text: '#1976d2'
        };
    }
  };

  const colors = getColors();

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: config.gap,
        userSelect: 'none'
      }}
    >
      {/* Logo Icon */}
      <Box
        sx={{
          position: 'relative',
          width: config.logoSize,
          height: config.logoSize,
          borderRadius: '12px',
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: '12px',
            background: 'linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 50%)',
            pointerEvents: 'none'
          }
        }}
      >
        <AccountBalance 
          sx={{ 
            fontSize: config.iconSize,
            color: 'white',
            position: 'relative',
            zIndex: 1
          }} 
        />
        <TrendingUp 
          sx={{ 
            fontSize: config.iconSize * 0.6,
            color: 'white',
            position: 'absolute',
            bottom: 4,
            right: 4,
            zIndex: 2
          }} 
        />
      </Box>

      {/* App Name */}
      {showText && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <Typography
            variant="h6"
            sx={{
              fontSize: config.fontSize,
              fontWeight: 700,
              color: colors.text,
              lineHeight: 1.2,
              letterSpacing: '-0.02em'
            }}
          >
            Personal Finance
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontSize: config.fontSize === '1rem' ? '0.7rem' : '0.75rem',
              color: colors.text,
              opacity: 0.7,
              lineHeight: 1,
              fontWeight: 500,
              letterSpacing: '0.05em',
              textTransform: 'uppercase'
            }}
          >
            GUI
          </Typography>
        </Box>
      )}
    </Box>
  );
};

// Compact version for smaller spaces
export const AppIcon: React.FC<{ size?: number; variant?: 'primary' | 'white' | 'dark' }> = ({ 
  size = 32,
  variant = 'primary'
}) => {
  const getColors = () => {
    switch (variant) {
      case 'white':
        return { primary: '#ffffff', secondary: '#f5f5f5' };
      case 'dark':
        return { primary: '#2c3e50', secondary: '#34495e' };
      default:
        return { primary: '#1976d2', secondary: '#42a5f5' };
    }
  };

  const colors = getColors();

  return (
    <Box
      sx={{
        position: 'relative',
        width: size,
        height: size,
        borderRadius: size > 24 ? '8px' : '6px',
        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: size > 24 ? '0 2px 8px rgba(0,0,0,0.15)' : '0 1px 4px rgba(0,0,0,0.1)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: size > 24 ? '8px' : '6px',
          background: 'linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 50%)',
          pointerEvents: 'none'
        }
      }}
    >
      <AccountBalance 
        sx={{ 
          fontSize: size * 0.6,
          color: 'white',
          position: 'relative',
          zIndex: 1
        }} 
      />
      <TrendingUp 
        sx={{ 
          fontSize: size * 0.35,
          color: 'white',
          position: 'absolute',
          bottom: size * 0.1,
          right: size * 0.1,
          zIndex: 2
        }} 
      />
    </Box>
  );
};
