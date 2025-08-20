import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
  Avatar,
} from '@mui/material';
import {
  Dashboard,
  AccountBalance,
  TrendingUp,
  Category,
  Settings,
  Assessment,
  AccountBalanceWallet,
  GpsFixed,
  ShowChart,
} from '@mui/icons-material';
import { AppLogo } from '../common/AppLogo';

interface SidebarProps {
  onItemClick?: () => void;
}

interface NavigationItem {
  text: string;
  icon: React.ReactElement;
  path: string;
  section?: string;
}

const navigationItems: NavigationItem[] = [
  {
    text: 'Dashboard',
    icon: <Dashboard />,
    path: '/dashboard',
    section: 'main',
  },
  {
    text: 'Transactions',
    icon: <AccountBalance />,
    path: '/transactions',
    section: 'main',
  },
  {
    text: 'Budgets',
    icon: <AccountBalanceWallet />,
    path: '/budgets',
    section: 'main',
  },
  {
    text: 'Goals',
    icon: <GpsFixed />,
    path: '/goals',
    section: 'main',
  },
  {
    text: 'Investments',
    icon: <ShowChart />,
    path: '/investments',
    section: 'main',
  },
  {
    text: 'Categories',
    icon: <Category />,
    path: '/categories',
    section: 'manage',
  },
  {
    text: 'Reports',
    icon: <Assessment />,
    path: '/reports',
    section: 'analyze',
  },
  {
    text: 'Analytics',
    icon: <TrendingUp />,
    path: '/analytics',
    section: 'analyze',
  },
  {
    text: 'Settings',
    icon: <Settings />,
    path: '/settings',
    section: 'system',
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ onItemClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedItem = location.pathname;

  const handleItemClick = (path: string) => {
    navigate(path);
    onItemClick?.();
  };

  const renderNavigationSection = (sectionItems: NavigationItem[]) => (
    <List>
      {sectionItems.map((item) => (
        <ListItem key={item.path} disablePadding>
          <ListItemButton
            selected={selectedItem === item.path}
            onClick={() => handleItemClick(item.path)}
            className="sidebar-nav-button"
          >
            <ListItemIcon>
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.text}
            />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );

  const mainItems = navigationItems.filter((item) => item.section === 'main');
  const manageItems = navigationItems.filter(
    (item) => item.section === 'manage'
  );
  const analyzeItems = navigationItems.filter(
    (item) => item.section === 'analyze'
  );
  const systemItems = navigationItems.filter(
    (item) => item.section === 'system'
  );

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Toolbar sx={{ py: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <AppLogo size="medium" showText={true} variant="primary" />
        </Box>
      </Toolbar>

      <Divider />

      {/* Navigation */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', py: 1 }}>
        {/* Main Navigation */}
        <Box sx={{ mb: 1 }}>
          <Typography
            variant="overline"
            sx={{
              px: 2,
              py: 1,
              display: 'block',
              color: 'text.secondary',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
            Overview
          </Typography>
          {renderNavigationSection(mainItems)}
        </Box>

        <Divider sx={{ mx: 2, my: 1 }} />

        {/* Management */}
        <Box sx={{ mb: 1 }}>
          <Typography
            variant="overline"
            sx={{
              px: 2,
              py: 1,
              display: 'block',
              color: 'text.secondary',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
            Manage
          </Typography>
          {renderNavigationSection(manageItems)}
        </Box>

        <Divider sx={{ mx: 2, my: 1 }} />

        {/* Analytics */}
        <Box sx={{ mb: 1 }}>
          <Typography
            variant="overline"
            sx={{
              px: 2,
              py: 1,
              display: 'block',
              color: 'text.secondary',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
            Analyze
          </Typography>
          {renderNavigationSection(analyzeItems)}
        </Box>

        <Divider sx={{ mx: 2, my: 1 }} />

        {/* System */}
        {renderNavigationSection(systemItems)}
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary" align="center">
          © 2024 Personal Finance
        </Typography>
      </Box>
    </Box>
  );
};
