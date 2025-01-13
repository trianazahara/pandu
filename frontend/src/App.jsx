import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';

import {
    Dashboard,
    InternManagement,
    AvailabilityCheck,
    Assessment,
} from './pages';

import { Sidebar } from './components/layout/Sidebar';
import Reports from './pages/Reports';
import Login from './pages/Login'; // Tambahkan import Login

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
        <div className="flex">
            <Sidebar />
            <main className="flex-1 ml-64">
                {children}
            </main>
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

                        <Route path="/intern/availability" element={
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

                        <Route path="/reports" element={
                            <ProtectedRoute>
                                <DashboardLayout>
                                    <Reports />
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