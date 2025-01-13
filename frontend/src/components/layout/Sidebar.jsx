import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    Home,
    History,
    People,
    Settings,
    LibraryBooks,
    KeyboardArrowDown,
    KeyboardArrowRight,
} from '@mui/icons-material';

export const Sidebar = () => {
    const location = useLocation();
    const [expandedMenus, setExpandedMenus] = useState({});

    const toggleMenu = (path) => {
        setExpandedMenus(prev => ({
            ...prev,
            [path]: !prev[path]
        }));
    };

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
                    path: '/intern/management',
                    label: 'Manajemen Data'
                },
                {
                    path: '/intern/availabilityCheck',
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
                <div className="flex items-center gap-3">
                    <img 
                        src="/images/logo.jpg" 
                        alt="Pandu Logo" 
                        className="w-12 h-12"
                    />
                    <div>
                        <span className="text-green-500 text-2xl">PANDU</span>
                        <div className="text-gray-700 text-sm">
                            Platform Anak Magang
                            <br />
                            Dinas Pendidikan Sumatera Barat
                        </div>
                    </div>
                </div>
            </div>

            <nav>
                {menuItems.map((item) => (
                    <div key={item.path} className="mb-4">
                        {item.subItems ? (
                            // Menu with dropdown
                            <div>
                                <button
                                    onClick={() => toggleMenu(item.path)}
                                    className={`w-full flex items-center justify-between p-2 rounded-lg hover:bg-green-100`}
                                >
                                    <div className="flex items-center">
                                        {item.icon}
                                        <span className="ml-3">{item.label}</span>
                                    </div>
                                    {expandedMenus[item.path] ? 
                                        <KeyboardArrowDown /> : 
                                        <KeyboardArrowRight />
                                    }
                                </button>
                                <div 
                                    className={`ml-8 mt-2 transition-all duration-300 ${
                                        expandedMenus[item.path] ? 'block' : 'hidden'
                                    }`}
                                >
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
                            </div>
                        ) : (
                            // Regular menu item
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
                        )}
                    </div>
                ))}
            </nav>
        </div>
    );
};

export default Sidebar;