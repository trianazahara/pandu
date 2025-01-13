// frontend/src/components/dashboard/StatCards.jsx
import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';

export const StatCards = ({ stats }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
                <CardContent>
                    <Typography variant="h6">Anak Magang Aktif</Typography>
                    <Typography variant="h4">{stats.activeInterns}</Typography>
                </CardContent>
            </Card>
            <Card>
                <CardContent>
                    <Typography variant="h6">Total Selesai</Typography>
                    <Typography variant="h4">{stats.completedInterns}</Typography>
                </CardContent>
            </Card>
            <Card>
                <CardContent>
                    <Typography variant="h6">Total Keseluruhan</Typography>
                    <Typography variant="h4">{stats.totalInterns}</Typography>
                </CardContent>
            </Card>
            <Card>
                <CardContent>
                    <Typography variant="h6">Selesai dalam 7 Hari</Typography>
                    <Typography variant="h4">{stats.completingSoon}</Typography>
                </CardContent>
            </Card>
        </div>
    );
};