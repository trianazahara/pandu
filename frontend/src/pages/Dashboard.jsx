// frontend/src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { StatCards } from '../components/dashboard/statCards';
import { Typography } from '@mui/material';

const Dashboard = () => {
    const [stats, setStats] = useState({
        activeInterns: 0,
        completedInterns: 0,
        totalInterns: 0,
        completingSoon: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch('/api/intern/stats');
                const data = await response.json();
                setStats(data);
            } catch (error) {
                console.error('Error fetching stats:', error);
            }
        };

        fetchStats();
    }, []);

    return (
        <div className="p-6">
            <Typography variant="h4" className="mb-6">
                Dashboard
            </Typography>
            <StatCards stats={stats} />
            
            <div className="mt-8">
                <Typography variant="h5" className="mb-4">
                    Anak Magang yang Akan Selesai
                </Typography>
                {/* Implementasi tabel atau list anak magang yang akan selesai */}
            </div>
        </div>
    );
};

export default Dashboard;