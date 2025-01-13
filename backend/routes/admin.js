// backend/routes/admin.js
const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const pool = require('../config/database');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

router.use(authMiddleware);
router.use(requireRole(['superadmin']));

// Get all admins
router.get('/', async (req, res) => {
    try {
        const [admins] = await pool.execute(`
            SELECT id_users, username, email, nama, role, last_login, is_active
            FROM users WHERE role = 'admin'
            ORDER BY created_at DESC
        `);
        res.json(admins);
    } catch (error) {
        console.error('Get admins error:', error);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
});

// Add new admin
router.post('/', async (req, res) => {
    try {
        const { username, password, email, nama } = req.body;
        
        // Check existing username
        const [existingUsers] = await pool.execute(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ 
                message: 'Username atau email sudah digunakan' 
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const id_users = uuidv4();

        await pool.execute(`
            INSERT INTO users (
                id_users, username, password, email, 
                nama, role, is_active
            ) VALUES (?, ?, ?, ?, ?, 'admin', true)
        `, [id_users, username, hashedPassword, email, nama]);

        res.status(201).json({ 
            message: 'Admin berhasil ditambahkan',
            id_users
        });
    } catch (error) {
        console.error('Add admin error:', error);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
});

// Update admin status
router.patch('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;

        await pool.execute(
            'UPDATE users SET is_active = ? WHERE id_users = ? AND role = "admin"',
            [is_active, id]
        );

        res.json({ message: 'Status admin berhasil diupdate' });
    } catch (error) {
        console.error('Update admin status error:', error);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
});

module.exports = router;