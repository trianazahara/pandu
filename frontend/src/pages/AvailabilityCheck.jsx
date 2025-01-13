// frontend/src/pages/AvailabilityCheck.jsx
import React from 'react';
import { Typography } from '@mui/material';
import AvailabilityCheckComponent from '../components/intern/AvailabilityCheck';

const AvailabilityCheck = () => {
    return (
        <div className="p-6">
            <Typography variant="h4" className="mb-6">
                Check Ketersediaan Anak Magang
            </Typography>
            <AvailabilityCheckComponent />
        </div>
    );
};

export default AvailabilityCheck; 