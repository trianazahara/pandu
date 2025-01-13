// backend/controllers/profileController
const pool = require('../config/database');
const bcrypt = require('bcrypt');

const profileController = {
    // create
    getProfile: async (req, res) => {
        try {
            const { userId } = req.user; // Ambil id_users dari token (middleware auth)

            // Query data user berdasarkan id_users
            const [rows] = await pool.execute(
                `SELECT id_users, username, email, nama, profile_picture, last_login, role 
                 FROM users WHERE id_users = ?`,
                [userId]
            );

            if (rows.length === 0) {
                return res.status(404).json({ message: 'Profil tidak ditemukan.' });
            }

            res.json(rows[0]);
        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({ message: 'Terjadi kesalahan server.' });
        }
    },

    //update
    editProfile: async (req, res) => {

        try {
            const { userId } = req.user; // Ambil `id_users` dari token (middleware auth)
            const { username, email, nama, profile_picture } = req.body;
    
            // Validasi input
            if (!username && !email && !nama && !profile_picture) {
                return res.status(400).json({ message: 'Setidaknya satu kolom harus diisi untuk diperbarui.' });
            }
    
            // Validasi format email (jika diberikan)
            if (email) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    return res.status(400).json({ message: 'Format email tidak valid.' });
                }
            }
    
            // Menyusun query dan parameter secara dinamis
            const updates = [];
            const params = [];
    
            if (username) {
                updates.push('username = ?');
                params.push(username);
            }
            if (email) {
                updates.push('email = ?');
                params.push(email);
            }
            if (nama) {
                updates.push('nama = ?');
                params.push(nama);
            }
            if (profile_picture) {
                updates.push('profile_picture = ?');
                params.push(profile_picture);
            }
    
            // Tambahkan id_users ke parameter
            params.push(userId);
    
            // Eksekusi query update
            const [result] = await pool.execute(
                `UPDATE users SET ${updates.join(', ')} WHERE id_users = ?`,
                params
            );
    
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Profil tidak ditemukan.' });
            }
    
            res.status(200).json({ message: 'Profil berhasil diperbarui.' });
        } catch (error) {
            console.error('Edit profile error:', error);
            res.status(500).json({ message: 'Terjadi kesalahan server.' });
        }
    },
    
    // ubah password
    changePassword: async (req, res) => {
        try {
            const { userId } = req.user; // Ambil id_users dari token (middleware auth)
            const { oldPassword, newPassword } = req.body;

            // Validasi input
            if (!oldPassword || !newPassword) {
                return res.status(400).json({ message: 'Password lama dan password baru wajib diisi.' });
            }

            // Ambil password lama dari database
            const [rows] = await pool.execute(
                `SELECT password FROM users WHERE id_users = ?`,
                [userId]
            );

            if (rows.length === 0) {
                return res.status(404).json({ message: 'User tidak ditemukan.' });
            }

            const isPasswordValid = await bcrypt.compare(oldPassword, rows[0].password);
            if (!isPasswordValid) {
                return res.status(400).json({ message: 'Password lama salah.' });
            }

            // Hash password baru
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // Update password di database
            const [result] = await pool.execute(
                `UPDATE users SET password = ? WHERE id_users = ?`,
                [hashedPassword, userId]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'User tidak ditemukan.' });
            }

            res.status(200).json({ message: 'Password berhasil diubah.' });
        } catch (error) {
            console.error('Change password error:', error);
            res.status(500).json({ message: 'Terjadi kesalahan server.' });
        }
    },

    // hapus foto profile
    deletePhoto: async (req, res) => {
        try {
            const { userId } = req.user; // Ambil id_users dari token (middleware auth)

            // Set profile_picture menjadi NULL
            const [result] = await pool.execute(
                `UPDATE users SET profile_picture = NULL WHERE id_users = ?`,
                [userId]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'User tidak ditemukan.' });
            }

            res.status(200).json({ message: 'Foto profil berhasil dihapus.' });
        } catch (error) {
            console.error('Delete photo error:', error);
            res.status(500).json({ message: 'Terjadi kesalahan server.' });
        }
    }
};

module.exports = profileController; 