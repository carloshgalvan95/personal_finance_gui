import React, { createContext, useContext, useState, useEffect } from 'react';
import { createTheme, ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
  isLight: boolean;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Create custom MUI themes with glassmorphism support
const createCustomTheme = (mode: ThemeMode) => {
  const isLight = mode === 'light';
  
  return createTheme({
    palette: {
      mode,
      primary: {
        main: '#1976d2',
        light: '#42a5f5',
        dark: '#1565c0',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#2196f3',
        light: '#64b5f6',
        dark: '#1976d2',
      },
      background: {
        default: isLight ? '#f8fafc' : '#0f172a',
        paper: isLight ? 'rgba(255, 255, 255, 0.8)' : 'rgba(30, 41, 59, 0.7)',
      },
      text: {
        primary: isLight ? '#0f172a' : '#f1f5f9',
        secondary: isLight ? '#475569' : '#94a3b8',
      },
      action: {
        active: isLight ? '#1e293b' : '#f1f5f9',
        hover: isLight ? 'rgba(15, 23, 42, 0.04)' : 'rgba(255, 255, 255, 0.04)',
        selected: isLight ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.08)',
        disabled: isLight ? 'rgba(15, 23, 42, 0.26)' : 'rgba(255, 255, 255, 0.26)',
        disabledBackground: isLight ? 'rgba(15, 23, 42, 0.12)' : 'rgba(255, 255, 255, 0.12)',
      },
      divider: isLight ? 'rgba(71, 85, 105, 0.15)' : 'rgba(148, 163, 184, 0.1)',
    },
    typography: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      h1: {
        fontWeight: 800,
        letterSpacing: '-0.02em',
      },
      h2: {
        fontWeight: 700,
        letterSpacing: '-0.01em',
      },
      h3: {
        fontWeight: 600,
      },
      h4: {
        fontWeight: 600,
      },
      h5: {
        fontWeight: 600,
      },
      h6: {
        fontWeight: 600,
      },
    },
    shape: {
      borderRadius: 16,
    },
    shadows: isLight ? [
      'none',
      '0 1px 3px rgba(0, 0, 0, 0.05)',
      '0 4px 6px rgba(0, 0, 0, 0.05)',
      '0 10px 15px rgba(0, 0, 0, 0.05)',
      '0 20px 25px rgba(0, 0, 0, 0.05)',
      '0 25px 50px rgba(0, 0, 0, 0.1)',
      '0 25px 50px rgba(0, 0, 0, 0.1)',
      '0 25px 50px rgba(0, 0, 0, 0.1)',
      '0 25px 50px rgba(0, 0, 0, 0.1)',
      '0 25px 50px rgba(0, 0, 0, 0.1)',
      '0 25px 50px rgba(0, 0, 0, 0.1)',
      '0 25px 50px rgba(0, 0, 0, 0.1)',
      '0 25px 50px rgba(0, 0, 0, 0.1)',
      '0 25px 50px rgba(0, 0, 0, 0.1)',
      '0 25px 50px rgba(0, 0, 0, 0.1)',
      '0 25px 50px rgba(0, 0, 0, 0.1)',
      '0 25px 50px rgba(0, 0, 0, 0.1)',
      '0 25px 50px rgba(0, 0, 0, 0.1)',
      '0 25px 50px rgba(0, 0, 0, 0.1)',
      '0 25px 50px rgba(0, 0, 0, 0.1)',
      '0 25px 50px rgba(0, 0, 0, 0.1)',
      '0 25px 50px rgba(0, 0, 0, 0.1)',
      '0 25px 50px rgba(0, 0, 0, 0.1)',
      '0 25px 50px rgba(0, 0, 0, 0.1)',
      '0 25px 50px rgba(0, 0, 0, 0.1)',
    ] : [
      'none',
      '0 1px 3px rgba(0, 0, 0, 0.2)',
      '0 4px 6px rgba(0, 0, 0, 0.2)',
      '0 10px 15px rgba(0, 0, 0, 0.2)',
      '0 20px 25px rgba(0, 0, 0, 0.2)',
      '0 25px 50px rgba(0, 0, 0, 0.3)',
      '0 25px 50px rgba(0, 0, 0, 0.3)',
      '0 25px 50px rgba(0, 0, 0, 0.3)',
      '0 25px 50px rgba(0, 0, 0, 0.3)',
      '0 25px 50px rgba(0, 0, 0, 0.3)',
      '0 25px 50px rgba(0, 0, 0, 0.3)',
      '0 25px 50px rgba(0, 0, 0, 0.3)',
      '0 25px 50px rgba(0, 0, 0, 0.3)',
      '0 25px 50px rgba(0, 0, 0, 0.3)',
      '0 25px 50px rgba(0, 0, 0, 0.3)',
      '0 25px 50px rgba(0, 0, 0, 0.3)',
      '0 25px 50px rgba(0, 0, 0, 0.3)',
      '0 25px 50px rgba(0, 0, 0, 0.3)',
      '0 25px 50px rgba(0, 0, 0, 0.3)',
      '0 25px 50px rgba(0, 0, 0, 0.3)',
      '0 25px 50px rgba(0, 0, 0, 0.3)',
      '0 25px 50px rgba(0, 0, 0, 0.3)',
      '0 25px 50px rgba(0, 0, 0, 0.3)',
      '0 25px 50px rgba(0, 0, 0, 0.3)',
      '0 25px 50px rgba(0, 0, 0, 0.3)',
    ],
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backdropFilter: 'blur(20px)',
            border: isLight 
              ? '1px solid rgba(255, 255, 255, 0.2)' 
              : '1px solid rgba(255, 255, 255, 0.1)',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backdropFilter: 'blur(20px)',
            border: isLight 
              ? '1px solid rgba(255, 255, 255, 0.2)' 
              : '1px solid rgba(255, 255, 255, 0.1)',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backdropFilter: 'blur(20px)',
            backgroundColor: isLight 
              ? 'rgba(255, 255, 255, 0.85)' 
              : 'rgba(15, 23, 42, 0.8)',
            borderBottom: isLight 
              ? '1px solid rgba(71, 85, 105, 0.15)' 
              : '1px solid rgba(148, 163, 184, 0.1)',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundImage: 'none',
            backdropFilter: 'blur(20px)',
            backgroundColor: isLight 
              ? 'rgba(255, 255, 255, 0.85)' 
              : 'rgba(15, 23, 42, 0.8)',
            borderRight: isLight 
              ? '1px solid rgba(71, 85, 105, 0.15)' 
              : '1px solid rgba(148, 163, 184, 0.1)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 12,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 12,
              backdropFilter: 'blur(10px)',
              backgroundColor: isLight 
                ? 'rgba(255, 255, 255, 0.5)' 
                : 'rgba(30, 41, 59, 0.5)',
            },
          },
        },
      },
    },
  });
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    // Check localStorage first
    const savedTheme = localStorage.getItem('theme-mode') as ThemeMode;
    if (savedTheme) return savedTheme;
    
    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  });

  const toggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem('theme-mode', newMode);
  };

  // Update theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  const theme = createCustomTheme(mode);

  const contextValue: ThemeContextType = {
    mode,
    toggleTheme,
    isLight: mode === 'light',
    isDark: mode === 'dark',
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <MUIThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MUIThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
