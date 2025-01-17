import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import AddInternPage from './pages/intern/add';



import {
    Dashboard,
    InternManagement,
    AvailabilityCheck,
    Assessment,
} from './pages';

import { Sidebar } from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Reports from './pages/Reports';
import Login from './pages/Login'; 
import AdminManagement from './pages/AdminManagement';
import RiwayatData from './pages/RiwayatData';
import RekapNilai from './pages/RekapNilai';
import Settings from './pages/Settings';
import NotificationPage from './pages/intern/NotificationPage';

const theme = createTheme({
    palette: {
        primary: {
            main: '#1976d2',
        },
        secondary: {
            main: '#dc004e',
        },
    },
});

// Komponen untuk protected routes
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    
    if (loading) return <div>Loading...</div>;
    
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

// Layout untuk halaman dengan sidebar
const DashboardLayout = ({ children }) => {
    return (
        <div className="flex h-screen overflow-hidden bg-gray-100">
            {/* Sidebar */}
            <Sidebar className="fixed left-0 h-full w-64" />
            
            {/* Main Content */}
            <div className="flex-1 pl-64">
                {/* Fixed Header */}
                <Header className="fixed top-0 right-0 left-64 z-10" />
                
                {/* Scrollable Content Area */}
                <main className="h-full pt-16 overflow-auto">
                    <div className="px-8 py-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

const App = () => {
    return (
        <Router>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <AuthProvider>
                    <Routes>
                        {/* Rute publik */}
                        <Route path="/login" element={<Login />} />

                         <Route path="/intern/add" element={
                            <ProtectedRoute>
                                <DashboardLayout>
                                    <AddInternPage />
                                </DashboardLayout>
                            </ProtectedRoute>
                        } />

                        {/* Rute yang dilindungi */}
                        <Route path="/dashboard" element={
                            <ProtectedRoute>
                                <DashboardLayout>
                                    <Dashboard />
                                </DashboardLayout>
                            </ProtectedRoute>
                        } />

                        <Route path="/intern/management" element={
                            <ProtectedRoute>
                                <DashboardLayout>
                                    <InternManagement />
                                </DashboardLayout>
                            </ProtectedRoute>
                        } />

                        <Route path="/intern/availabilityCheck" element={
                            <ProtectedRoute>
                                <DashboardLayout>
                                    <AvailabilityCheck />
                                </DashboardLayout>
                            </ProtectedRoute>
                        } />

                        <Route path="/assessment" element={
                            <ProtectedRoute>
                                <DashboardLayout>
                                    <Assessment />
                                </DashboardLayout>
                            </ProtectedRoute>
                        } />

                        <Route path="/admin/management" element={
                            <ProtectedRoute>
                                <DashboardLayout>
                                <AdminManagement />
                                </DashboardLayout>
                            </ProtectedRoute>
                        } />

                        <Route path="/history/data" element={
                            <ProtectedRoute>
                                <DashboardLayout>
                                    <RiwayatData />
                                </DashboardLayout>
                            </ProtectedRoute>
                        } />

                        <Route path="/history/score" element={
                            <ProtectedRoute>
                                <DashboardLayout>
                                    <RekapNilai />
                                </DashboardLayout>
                            </ProtectedRoute>
                        } />

                        <Route path="/settings" element={
                            <ProtectedRoute>
                                <DashboardLayout>
                                    <Settings />
                                </DashboardLayout>
                            </ProtectedRoute>
                        } />

                        <Route path="/notifications" element={
                            <ProtectedRoute>
                                <DashboardLayout>
                                    <NotificationPage />
                                </DashboardLayout>
                            </ProtectedRoute>
                        } />

                    </Routes>
                </AuthProvider>
            </ThemeProvider>
        </Router>
    );
};

export default App;