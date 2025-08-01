import React from 'react';
import { Box } from '@mui/material';
import { PageHeader } from '../components/common/PageHeader';
import { DataManagement } from '../components/features/DataManagement';

export const Settings: React.FC = () => {
  return (
    <Box>
      <PageHeader
        title="Settings"
        subtitle="Manage your app preferences and data"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Settings' },
        ]}
      />
      
      <DataManagement />
    </Box>
  );
};