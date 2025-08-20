import React from 'react';
import { Box, Card, CardContent, Skeleton } from '@mui/material';

interface SkeletonLoaderProps {
  variant?: 'card' | 'list' | 'chart' | 'stats';
  count?: number;
  height?: number | string;
  width?: number | string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'card',
  count = 1,
  height = 120,
  width = '100%',
}) => {

  const renderCardSkeleton = () => (
    <Card
      sx={{
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(var(--blur-amount))',
        border: '1px solid var(--border-glass)',
        height,
        width,
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Skeleton variant="text" width="40%" height={24} />
          <Skeleton variant="circular" width={24} height={24} />
        </Box>
        <Skeleton variant="text" width="60%" height={32} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="80%" height={20} />
        <Box sx={{ mt: 2 }}>
          <Skeleton variant="rectangular" width="100%" height={8} sx={{ borderRadius: 1 }} />
        </Box>
      </CardContent>
    </Card>
  );

  const renderListSkeleton = () => (
    <Box sx={{ width, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
        <Skeleton variant="circular" width={40} height={40} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="60%" height={20} />
          <Skeleton variant="text" width="40%" height={16} />
        </Box>
        <Skeleton variant="text" width="80px" height={20} />
      </Box>
    </Box>
  );

  const renderChartSkeleton = () => (
    <Card
      sx={{
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(var(--blur-amount))',
        border: '1px solid var(--border-glass)',
        height,
        width,
      }}
    >
      <CardContent>
        <Skeleton variant="text" width="40%" height={24} sx={{ mb: 3 }} />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
          <Skeleton variant="circular" width={150} height={150} />
        </Box>
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Skeleton variant="text" width="30%" height={16} />
          <Skeleton variant="text" width="30%" height={16} />
          <Skeleton variant="text" width="30%" height={16} />
        </Box>
      </CardContent>
    </Card>
  );

  const renderStatsSkeleton = () => (
    <Card
      sx={{
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(var(--blur-amount))',
        border: '1px solid var(--border-glass)',
        height,
        width,
        minHeight: 120,
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Skeleton variant="circular" width={48} height={48} />
          <Skeleton variant="text" width="50%" height={20} />
        </Box>
        <Skeleton variant="text" width="80%" height={36} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="60%" height={20} />
      </CardContent>
    </Card>
  );

  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return renderCardSkeleton();
      case 'list':
        return renderListSkeleton();
      case 'chart':
        return renderChartSkeleton();
      case 'stats':
        return renderStatsSkeleton();
      default:
        return renderCardSkeleton();
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {Array.from({ length: count }, (_, index) => (
        <React.Fragment key={index}>
          {renderSkeleton()}
        </React.Fragment>
      ))}
    </Box>
  );
};
