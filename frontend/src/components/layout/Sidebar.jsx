// frontend/src/components/layout/Sidebar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    Dashboard,
    People,
    History,
    Assessment,
    Settings,
    Notifications,
    AdminPanelSettings,
    AdminPanelSettingsRounded,
    Home,
    DatasetSharp,
    LibraryBooks
} from '@mui/icons-material';

export const Sidebar = () => {
    const location = useLocation();
    
    const menuItems = [
        {
            path: '/',
            icon: <Home />,
            label: 'Dashboard'
        },
        {
            path: '/intern',
            icon: <LibraryBooks />,
            label: 'Data Anak Magang',
            subItems: [
                {
                    path: '/intern/management-data',
                    label: 'Manajemen Data'
                },
                {
                    path: '/intern/availability',
                    label: 'Check Ketersediaan'
                }
            ]
        },
        {
            path: '/history',
            icon: <History />,
            label: 'Riwayat',
            subItems: [
                {
                    path: '/history/data',
                    label: 'Riwayat Data'
                },
                {
                    path: '/history/score',
                    label: 'Rekap Nilai'
                }
            ]
        },
        {
            path: '/manage-admin',
            icon: <People />,
            label: 'Manajemen Admin'
        },
        
        {
            path: '/settings',
            icon: <Settings />,
            label: 'Pengaturan'
        }
    ];

    return (
        <div className="w-64 h-screen bg-slate-50 text-green-600 fixed left-0 top-0">
            <div className="p-4">
                <h1 className="text-xl font-bold mb-8">PANDU</h1>
                <nav>
                    {menuItems.map((item) => (
                        <div key={item.path} className="mb-4">
                            <Link
                                to={item.path}
                                className={`flex items-center p-2 rounded-lg ${
                                    location.pathname === item.path
                                        ? 'bg-green-200'
                                        : 'hover:bg-green-100'
                                }`}
                            >
                                {item.icon}
                                <span className="ml-3">{item.label}</span>
                            </Link>
                            {item.subItems && (
                                <div className="ml-8 mt-2">
                                    {item.subItems.map((subItem) => (
                                        <Link
                                            key={subItem.path}
                                            to={subItem.path}
                                            className={`block p-2 rounded-lg ${
                                                location.pathname === subItem.path
                                                    ? 'bg-green-200'
                                                    : 'hover:bg-green-100'
                                            }`}
                                        >
                                            {subItem.label}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </nav>
            </div>
        </div>
    );
};

// export default Sidebar