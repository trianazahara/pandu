// backend/controllers/adminController.js
const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

const adminController = {
    // create
    addAdmin: async (req, res) => {
        try {
            const { username, password, email, nama, role } = req.body;
    
            // Validasi input
            if (!username || !password || !email || !nama || !role) {
                return res.status(400).json({ message: 'Semua data (username, password, email, nama, role) harus diisi.' });
            }
    
            // Validasi email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ message: 'Format email tidak valid.' });
            }
    
            // Validasi role
            const validRoles = ['admin', 'superadmin'];
            if (!validRoles.includes(role)) {
                return res.status(400).json({ message: `Role tidak valid. Pilihan yang valid adalah: ${validRoles.join(', ')}` });
            }
    
            // Cek username atau email sudah ada
            const [existingUsers] = await pool.execute(
                'SELECT * FROM users WHERE username = ? OR email = ?',
                [username, email]
            );
            if (existingUsers.length > 0) {
                return res.status(400).json({ message: 'Username atau email sudah digunakan.' });
            }
    
            const hashedPassword = await bcrypt.hash(password, 10); // Enkripsi password
            const id_users = uuidv4(); // Generate ID baru
    
            // Query untuk insert admin baru
            await pool.execute(
                `INSERT INTO users (id_users, username, password, email, nama, role, is_active, created_at) 
                 VALUES (?, ?, ?, ?, ?, ?, true, NOW())`,
                [id_users, username, hashedPassword, email, nama, role]
            );
    
            res.status(201).json({
                message: 'Admin berhasil ditambahkan.',
                data: { id_users, username, email, nama, role },
            })
        } catch (error) {
            console.error('Add admin error:', error);
            res.status(500).json({ message: 'Terjadi kesalahan server.' });
        }
    },

     

    // delete
    // adminController.js 
    deleteAdmin: async (req, res) => {
        try {
            const { id } = req.params;
            
            // 1. Mulai transaction
            const connection = await pool.getConnection();
            await connection.beginTransaction();
            
            try {
                // 2. Hapus notifikasi
                await connection.execute(
                    'DELETE FROM notifikasi WHERE user_id = ?',
                    [id]
                );
                
                // 3. Update peserta_magang set created_by to NULL
                await connection.execute(
                    'UPDATE peserta_magang SET created_by = NULL WHERE created_by = ?',
                    [id]
                );
                
                // 4. Hapus user
                const [result] = await connection.execute(
                    'DELETE FROM users WHERE id_users = ? AND role = "admin"',
                    [id]
                );
                
                if (result.affectedRows === 0) {
                    await connection.rollback();
                    connection.release();
                    return res.status(404).json({ message: 'Admin tidak ditemukan atau tidak dapat dihapus.' });
                }
                
                // 5. Commit jika semua berhasil
                await connection.commit();
                connection.release();
                
                res.json({ message: 'Admin berhasil dihapus.' });
                
            } catch (error) {
                await connection.rollback();
                connection.release();
                throw error;
            }
            
        } catch (error) {
            console.error('Delete admin error:', error);
            res.status(500).json({ 
                message: 'Terjadi kesalahan server.',
                detail: error.message 
            });
        }    
    },

    // read
    getAdmin: async (req, res) => {
        try {
            const [admins] = await pool.execute(`
                SELECT id_users, username, email, nama, role, last_login, is_active, password, profile_picture
                FROM users WHERE role = 'admin'
                ORDER BY created_at DESC
            `);
            res.json(admins);
    
        } catch (error) {
            console.error('Error fetching admin data:', error);
            res.status(500).json({ message: 'Terjadi kesalahan server.' });
        }
    },

    // update
    editAdmin: async (req, res) => {
        try {
            const { id } = req.params;
            const { nama, username, email, password } = req.body;
            
            if (!username && !email && !nama && !password) {
                return res.status(400).json({ message: 'Setidaknya satu kolom harus diisi untuk diperbarui.' });
            }
    
            const updates = [];
            const params = [];
    
            if (username) {
                updates.push('username = ?');
                params.push(username);
            }
            if (email) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    return res.status(400).json({ message: 'Format email tidak valid.' });
                }
                updates.push('email = ?');
                params.push(email);
            }
            if (nama) {
                updates.push('nama = ?');
                params.push(nama);
            }
            if (password) {
                const bcrypt = require('bcrypt');
                const hashedPassword = await bcrypt.hash(password, 10);
                updates.push('password = ?');
                params.push(hashedPassword);
            }

            params.push(id);

            // Eksekusi query update
            const [result] = await pool.execute(
                `UPDATE users SET ${updates.join(', ')} WHERE id_users = ? AND role = "admin"`,
                params
            );
    
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Admin tidak ditemukan atau tidak dapat diupdate.' });
            }
    
            res.json({ message: 'Profil admin berhasil diperbarui.' });
            
        } catch (error) {
            console.error('Update admin error:', error);
            res.status(500).json({ message: 'Terjadi kesalahan server' });
        }
    },
};

module.exports = adminController;
