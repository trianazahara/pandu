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
                // Ubah URL sesuai dengan backend
                const response = await fetch('http://localhost:5000/api/intern/stats', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                const data = await response.json();
                setStats(data);
            } catch (error) {
                console.error('Error fetching stats:', error);
                // Set default values jika terjadi error
                setStats({
                    activeInterns: 0,
                    completedInterns: 0,
                    totalInterns: 0,
                    completingSoon: 0
                });
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
                    Anak Magang yang Akan Selesai dalam kurun waktu 7 hari
                </Typography>
                {/* Implementasi tabel atau list anak magang yang akan selesai */}
            </div>
        </div>
    );
};

export default Dashboard;