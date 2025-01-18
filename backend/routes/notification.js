// routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authMiddleware, requireRole } = require('../middleware/auth');

// Middleware autentikasi untuk semua routes
router.use(authMiddleware);

// GET /api/notifications - Mengambil daftar notifikasi dengan pagination
router.get('/', notificationController.getNotifications);

// GET /api/notifications/unread-count - Mengambil jumlah notifikasi yang belum dibaca
router.get('/unread-count', notificationController.getUnreadCount);

// PUT /api/notifications/:id/read - Menandai satu notifikasi sebagai sudah dibaca
router.put('/:id/read', notificationController.markAsRead);

// PUT /api/notifications/mark-all-read - Menandai semua notifikasi sebagai sudah dibaca
router.put('/mark-all-read', notificationController.markAllAsRead);

module.exports = router;