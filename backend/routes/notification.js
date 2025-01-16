const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authMiddleware } = require('../middleware/auth'); // sesuaikan dengan middleware Anda

// Gunakan authMiddleware Anda
router.use(authMiddleware);

// Definisikan routes
router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.put('/:id/read', notificationController.markAsRead);
router.post('/check-internship', notificationController.createNotifications); // Ensure this method is defined

module.exports = router;