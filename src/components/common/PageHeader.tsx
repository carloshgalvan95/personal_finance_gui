import React from 'react';
import {
  Box,
  Typography,
  Breadcrumbs,
  Link,
  Button,
  Stack,
} from '@mui/material';
import { NavigateNext, Add } from '@mui/icons-material';

interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  actions,
  primaryAction,
}) => {
  return (
    <Box sx={{ mb: 4 }}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs
          separator={<NavigateNext fontSize="small" />}
          sx={{ mb: 2 }}
        >
          {breadcrumbs.map((crumb, index) => (
            <Link
              key={index}
              color={
                index === breadcrumbs.length - 1 ? 'text.primary' : 'inherit'
              }
              href={crumb.href}
              onClick={crumb.onClick}
              sx={{
                cursor: crumb.href || crumb.onClick ? 'pointer' : 'default',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration:
                    crumb.href || crumb.onClick ? 'underline' : 'none',
                },
              }}
            >
              {crumb.label}
            </Link>
          ))}
        </Breadcrumbs>
      )}

      {/* Header Content */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 2,
        }}
      >
        {/* Title and Subtitle */}
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body1" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>

        {/* Actions */}
        <Stack direction="row" spacing={2} alignItems="center">
          {actions}
          {primaryAction && (
            <Button
              variant="contained"
              startIcon={primaryAction.icon || <Add />}
              onClick={primaryAction.onClick}
            >
              {primaryAction.label}
            </Button>
          )}
        </Stack>
      </Box>
    </Box>
  );
};
