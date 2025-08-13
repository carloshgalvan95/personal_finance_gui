import React from 'react';
import { Box, Typography } from '@mui/material';
import { TrendingUp, Analytics, Savings, AccountBalance, Receipt, PieChart } from '@mui/icons-material';

export const FinanceIllustration: React.FC = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        px: 6,
        py: 8,
        position: 'relative',
        overflow: 'hidden',
        background: '#f8fafc',
      }}
    >
      {/* Main content - Discord inspired minimal approach */}
      <Box sx={{ textAlign: 'center', mb: 6, position: 'relative', zIndex: 1 }}>
        <Typography
          variant="h2"
          sx={{
            mb: 3,
            fontWeight: 800,
            fontSize: { xs: '2.5rem', md: '3.5rem' },
            color: '#1e293b',
            lineHeight: 1.1,
            letterSpacing: '-0.02em'
          }}
        >
          Manage your money,
          <br />
          <Box component="span" sx={{ color: '#1976d2' }}>
            your way.
          </Box>
        </Typography>
        
        <Typography
          variant="h6"
          sx={{
            color: '#64748b',
            mb: 6,
            fontWeight: 400,
            fontSize: '1.1rem',
            lineHeight: 1.5,
            maxWidth: 480,
            mx: 'auto'
          }}
        >
          A simple, powerful personal finance tool that helps you track expenses, 
          create budgets, and reach your financial goals.
        </Typography>
      </Box>

      {/* Clean feature list - Discord inspired */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          mb: 6,
          position: 'relative',
          zIndex: 1,
          maxWidth: 400,
          width: '100%'
        }}
      >
        {[
          { icon: Receipt, label: 'Track every transaction', desc: 'Never lose sight of where your money goes' },
          { icon: PieChart, label: 'Smart budgeting', desc: 'Set budgets that actually work for you' },
          { icon: TrendingUp, label: 'Reach your goals', desc: 'Save for what matters most' },
          { icon: Analytics, label: 'Clear insights', desc: 'Understand your spending patterns' },
        ].map((item, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 3,
              p: 0,
              animation: `fadeIn 0.6s ease ${index * 0.1}s both`,
              '@keyframes fadeIn': {
                '0%': { opacity: 0, transform: 'translateY(20px)' },
                '100%': { opacity: 1, transform: 'translateY(0)' },
              },
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                background: '#1976d2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <item.icon sx={{ color: 'white', fontSize: 24 }} />
            </Box>
            <Box sx={{ flex: 1, pt: 0.5 }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 600,
                  color: '#1e293b',
                  mb: 0.5,
                  fontSize: '1rem'
                }}
              >
                {item.label}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: '#64748b',
                  fontSize: '0.9rem',
                  lineHeight: 1.4
                }}
              >
                {item.desc}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Simple footer message */}
      <Box
        sx={{
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
          mt: 4
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: '#94a3b8',
            fontSize: '0.85rem',
            fontWeight: 500,
          }}
        >
          Free • Secure • Built for you
        </Typography>
      </Box>
    </Box>
  );
};
