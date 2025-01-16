import React from 'react';
import AvailabilityCheck from '../components/intern/AvailabilityCheck';
import {
  Typography,
  Box
} from '@mui/material';

const AvailabilityCheckPage = () => {
  return (
    <Box sx={{ width: '100%', minWidth: 0 }}>
      {/* Header */}
      <Box sx={{ 
        width: '100%',
        background: 'linear-gradient(to right, #BCFB69, #26BBAC)',
        borderRadius: '12px',
        mb: 4,
        p: 3
      }}>
        <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
          Cek Ketersediaan Posisi Anak Magang
        </Typography>
      </Box>
      <AvailabilityCheck />
</Box>
  );
};

export default AvailabilityCheckPage;