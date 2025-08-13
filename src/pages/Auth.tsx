import React, { useState } from 'react';
import { Box, Container, Paper, Typography, Grid } from '@mui/material';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';
import { AppLogo } from '../components/common/AppLogo';
import { FinanceIllustration } from '../components/auth/FinanceIllustration';

type AuthMode = 'login' | 'register';

export const Auth: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');

  const handleSwitchToRegister = () => {
    setMode('register');
  };

  const handleSwitchToLogin = () => {
    setMode('login');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 0,
      }}
    >
      <Container maxWidth="lg" sx={{ height: '100vh', p: 0 }}>
        <Paper
          elevation={0}
          sx={{
            height: '100vh',
            borderRadius: 0,
            overflow: 'hidden',
            bgcolor: 'background.paper',
            display: 'flex',
          }}
        >
          <Grid container sx={{ height: '100%' }}>
            {/* Left side - Illustration */}
            <Grid item xs={12} md={7} sx={{ display: { xs: 'none', md: 'block' } }}>
              <FinanceIllustration />
            </Grid>
            
            {/* Right side - Login Form */}
            <Grid item xs={12} md={5}>
              <Box
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  p: { xs: 3, md: 6 },
                  background: '#ffffff',
                  borderLeft: { md: '1px solid #e2e8f0' },
                }}
              >
                {/* Logo and header for mobile */}
                <Box sx={{ textAlign: 'center', mb: 4, display: { xs: 'block', md: 'none' } }}>
                  <AppLogo size="large" showText={true} variant="primary" />
                </Box>

                {/* Desktop header */}
                <Box sx={{ textAlign: 'center', mb: 4, display: { xs: 'none', md: 'block' } }}>
                  <AppLogo size="medium" showText={true} variant="primary" />
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      mt: 3, 
                      mb: 1, 
                      color: 'text.primary', 
                      fontWeight: 600,
                    }}
                  >
                    Welcome Back
                  </Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      color: 'text.secondary', 
                      fontSize: '1rem',
                    }}
                  >
                    Sign in to continue to your financial dashboard
                  </Typography>
                </Box>
                
                {/* Form */}
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                  {mode === 'login' ? (
                    <LoginForm onSwitchToRegister={handleSwitchToRegister} />
                  ) : (
                    <RegisterForm onSwitchToLogin={handleSwitchToLogin} />
                  )}
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </Box>
  );
};
