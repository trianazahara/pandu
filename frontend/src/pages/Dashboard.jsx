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
    const [completingInterns, setCompletingInterns] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch stats
                const statsResponse = await fetch('http://localhost:5000/api/intern/stats', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                const statsData = await statsResponse.json();
                setStats(statsData);

                // Fetch completing soon interns
                const completingResponse = await fetch('http://localhost:5000/api/intern/completing-soon', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                const completingData = await completingResponse.json();
                setCompletingInterns(completingData);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
        
        // Add an interval to refresh data periodically
        const interval = setInterval(fetchData, 50000); // Refresh every minute
        
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="p-6">
            <Typography variant="h4" className="mb-6">
                Dashboard
            </Typography>
            <StatCards stats={stats} completingInterns={completingInterns} />
        </div>
    );
};

export default Dashboard;