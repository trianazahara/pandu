// backend/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const internRoutes = require('./routes/intern');
const documentRoutes = require('./routes/document');
const adminRoutes = require('./routes/admin');
const profileRoutes = require('./routes/profile');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/intern', internRoutes);
app.use('/api/document', documentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);

// Error handling middleware - TAMBAHKAN INI
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({ 
        status: 'error',
        message: 'Terjadi kesalahan server'
    });
});

// Handle 404 - TAMBAHKAN INI
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'Route tidak ditemukan'
    });
});

const PORT = process.env.PORT || 5000;

// Improved error handling for server startup
const startServer = async () => {
    try {
        app.listen(PORT, () => {
            console.log(`Server berjalan di port ${PORT}`);
        });
    } catch (error) {
        console.error('Error starting server:', error);
        process.exit(1);
    }
};

startServer();