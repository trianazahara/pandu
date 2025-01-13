// frontend/src/components/layout/Header.jsx
import React from 'react';
import { useAuth } from '../../contexts/authContext'; // Sesuaikan dengan path yang benar

const Header = () => {
    return (
        <div className="fixed top-0 right-0 left-64 bg-white border-b z-10">
            <div className="flex justify-end items-center p-1 mr-4"> {/* Tambahkan mr-6 di sini */}
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <p className="text-gray-700">Admin</p>
                        <p className="text-gray-500 text-sm">Admin</p>
                    </div>
                    <div className="relative">
                        <img 
                            src="/avatar.jpg" 
                            alt="Profile" 
                            className="w-10 h-10 rounded-full"
                        />
                        <button className="ml-1">
                            <svg 
                                className="w-4 h-4 text-gray-400" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={2} 
                                    d="M19 9l-7 7-7-7" 
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Header;