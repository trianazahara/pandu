const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const { WebSocketServer } = require('ws');




const authRoutes = require('./routes/auth');
const internRoutes = require('./routes/intern');
const documentRoutes = require('./routes/document');
const adminRoutes = require('./routes/admin');
const profileRoutes = require('./routes/profile');
const notificationRoutes = require('./routes/notification');
const NotificationCron = require('./cron/notificationCron');
const bidangRoutes = require('./routes/bidang');








const app = express();
const server = require('http').createServer(app); // Create HTTP server




// Initialize WebSocket server
const wsServer = new WebSocketServer({ server });




// Initialize and start cron jobs
const notificationCron = new NotificationCron(wsServer);
notificationCron.start();




// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/notifications', notificationRoutes); // Ensure the base path is correct
app.use('/certificates', express.static(path.join(__dirname, 'public', 'certificates')));




// Routes
app.use('/api/auth', authRoutes);
app.use('/api/intern', internRoutes);
app.use('/api/document', documentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/bidang', bidangRoutes);




// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan server'
    });
});




// Handle 404
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
        server.listen(PORT, () => {
            console.log(`Server berjalan di port ${PORT}`);
        });
    } catch (error) {
        console.error('Error starting server:', error);
        process.exit(1);
    }
};
app.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    next();
});




startServer();

