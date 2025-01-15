const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const pool = require('../config/database');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const profileController = require('../controllers/profileController')

router.use(authMiddleware);
router.use(requireRole(['superadmin', 'admin']));

// Menampilkan profile pengguna
router.get('/', profileController.getProfile);

// Edit profile
router.patch('/', profileController.editProfile);

// Ubah password 
router.patch('/change-password', profileController.changePassword);

// Hapus photo profile 
router.delete('/photo-profile', profileController.deletePhoto);

// Upload photo profile 
router.post('/photo-profile', profileController.uploadProfilePicture);

module.exports = router;