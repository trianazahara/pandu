// backend/controllers/authController.js
const pool = require('../config/database');
const bcrypt = require('bcrypt');
const { generateToken } = require('../config/auth');

const authController = {
    login: async (req, res) => {
        try {
            const { username, password } = req.body;
            console.log('Login attempt:', { username }); // debug

            const [users] = await pool.execute(
                'SELECT * FROM users WHERE username = ?',
                [username]
            );
            console.log('Users found:', users.length); // debug

            if (users.length === 0) {
                return res.status(401).json({ message: 'Username atau password salah' });
            }

            const user = users[0];
            console.log('Comparing passwords...'); // debug
            const validPassword = await bcrypt.compare(password, user.password);
            console.log('Password valid:', validPassword); // debug

            if (!validPassword) {
                return res.status(401).json({ message: 'Username atau password salah' });
            }

            const token = generateToken(user.id_users, user.role);
            res.json({ 
                token, 
                user: { 
                    id: user.id_users,
                    username: user.username,
                    email: user.email,
                    nama: user.nama,
                    role: user.role
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ message: 'Terjadi kesalahan server' });
        }
    },

    getMe: async (req, res) => {
        try {
            const [users] = await pool.execute(
                'SELECT id_users, username, email, nama, role FROM users WHERE id_users = ?',
                [req.user.userId]
            );

            if (users.length === 0) {
                return res.status(404).json({ message: 'User tidak ditemukan' });
            }

            res.json(users[0]);
        } catch (error) {
            console.error('Get user error:', error);
            res.status(500).json({ message: 'Terjadi kesalahan server' });
        }
    }
};

module.exports = authController;