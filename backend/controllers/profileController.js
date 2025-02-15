const pool = require('../config/database');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// Buat direktori untuk foto profil jika belum ada
const uploadDir = path.join(__dirname, '../uploads/profile_pictures');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Konfigurasi penyimpanan file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const filename = `${uuidv4()}${ext}`;
        cb(null, filename);
    }
});

// Filter jenis file yang diizinkan
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error('Only .png, .jpg and .jpeg format allowed!'), false);
    }
};

// Konfigurasi upload file dengan multer
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Batasan ukuran 5MB
    fileFilter: fileFilter
}).single('profile_picture');

// Generate URL lengkap untuk foto profil
const getFullUrl = (req, relativePath) => {
    if (!relativePath) return null;
    return `${req.protocol}://${req.get('host')}${relativePath}`;
};

const profileController = {
    // Ambil data profil user
    getProfile: async (req, res) => {
        try {
            const { userId } = req.user;
            const [rows] = await pool.execute(
                `SELECT id_users, username, email, nama, profile_picture, last_login, role 
                 FROM users WHERE id_users = ?`,
                [userId]
            );

            if (rows.length === 0) {
                return res.status(404).json({ message: 'Profil tidak ditemukan.' });
            }
            const userData = rows[0];
            if (userData.profile_picture) {
                userData.profile_picture = getFullUrl(req, userData.profile_picture);
            }

            res.json(userData);
        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({ message: 'Terjadi kesalahan server.' });
        }
    },

    // Edit data profil user
    editProfile: async (req, res) => {
        try {
            const { userId } = req.user;
            const { username, email, nama } = req.body;
    
            // Validasi minimal satu field diisi
            if (!username && !email && !nama) {
                return res.status(400).json({ message: 'Setidaknya satu kolom harus diisi untuk diperbarui.' });
            }
    
            // Cek duplikasi email
            if (email) {
                const [existingEmail] = await pool.execute(
                    'SELECT id_users FROM users WHERE email = ? AND id_users != ?',
                    [email, userId]
                );
                if (existingEmail.length > 0) {
                    return res.status(400).json({ message: 'Email sudah digunakan.' });
                }
            }

            // Cek duplikasi username
            if (username) {
                const [existingUsername] = await pool.execute(
                    'SELECT id_users FROM users WHERE username = ? AND id_users != ?',
                    [username, userId]
                );
                if (existingUsername.length > 0) {
                    return res.status(400).json({ message: 'Username sudah digunakan.' });
                }
            }
    
            // Siapkan query update
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
    
            params.push(userId);
    
            // Update profil
            const [result] = await pool.execute(
                `UPDATE users SET ${updates.join(', ')} WHERE id_users = ?`,
                params
            );
    
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Profil tidak ditemukan.' });
            }

            // Ambil data profil terbaru
            const [updatedProfile] = await pool.execute(
                `SELECT id_users, username, email, nama, profile_picture FROM users WHERE id_users = ?`,
                [userId]
            );
    
            res.status(200).json({ 
                message: 'Profil berhasil diperbarui.',
                profile: {
                    ...updatedProfile[0],
                    profile_picture: updatedProfile[0].profile_picture ? 
                        getFullUrl(req, updatedProfile[0].profile_picture) : null
                }
            });
        } catch (error) {
            console.error('Edit profile error:', error);
            res.status(500).json({ message: 'Terjadi kesalahan server.' });
        }
    },

    // Upload foto profil baru
    uploadProfilePicture: async (req, res) => {
        upload(req, res, async (err) => {
            if (err) {
                if (err instanceof multer.MulterError) {
                    return res.status(400).json({ 
                        message: err.code === 'LIMIT_FILE_SIZE' 
                            ? 'File too large, maximum size is 5MB' 
                            : err.message 
                    });
                }
                return res.status(400).json({ message: err.message });
            }

            try {
                if (!req.file) {
                    return res.status(400).json({ message: 'Please upload a file' });
                }

                const { userId } = req.user;

                // Hapus foto lama jika ada
                const [currentUser] = await pool.execute(
                    'SELECT profile_picture FROM users WHERE id_users = ?',
                    [userId]
                );

                if (currentUser[0]?.profile_picture) {
                    const oldPath = path.join(__dirname, '..', currentUser[0].profile_picture);
                    if (fs.existsSync(oldPath)) {
                        fs.unlinkSync(oldPath);
                    }
                }

                // Simpan path foto baru
                const relativePath = `/uploads/profile_pictures/${req.file.filename}`;

                const [result] = await pool.execute(
                    'UPDATE users SET profile_picture = ? WHERE id_users = ?',
                    [relativePath, userId]
                );

                if (result.affectedRows === 0) {
                    fs.unlinkSync(req.file.path);
                    return res.status(404).json({ message: 'User not found' });
                }

                const fullUrl = getFullUrl(req, relativePath);

                res.status(200).json({
                    message: 'Profile picture uploaded successfully',
                    profile_picture: fullUrl
                });
            } catch (error) {
                if (req.file) {
                    fs.unlinkSync(req.file.path);
                }
                console.error('Upload profile picture error:', error);
                res.status(500).json({ message: 'Server error occurred' });
            }
        });
    },

    // Ganti password user
    changePassword: async (req, res) => {
        try {
            const { userId } = req.user;
            const { oldPassword, newPassword } = req.body;

            // Validasi input
            if (!oldPassword || !newPassword) {
                return res.status(400).json({ message: 'Password lama dan password baru wajib diisi.' });
            }

            // Verifikasi password lama
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

            // Update password baru
            const hashedPassword = await bcrypt.hash(newPassword, 10);

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

    // Hapus foto profil
    deletePhoto: async (req, res) => {
        try {
            const { userId } = req.user;

            // Cek foto profil yang ada
            const [user] = await pool.execute(
                'SELECT profile_picture FROM users WHERE id_users = ?',
                [userId]
            );

            if (user.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Hapus file foto jika ada
            if (user[0].profile_picture) {
                const fullPath = path.join(__dirname, '..', user[0].profile_picture);
                if (fs.existsSync(fullPath)) {
                    fs.unlinkSync(fullPath);
                }
            }

            // Reset path foto di database
            const [result] = await pool.execute(
                'UPDATE users SET profile_picture = NULL WHERE id_users = ?',
                [userId]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Failed to update user' });
            }

            res.status(200).json({ 
                message: 'Profile picture deleted successfully',
                profile_picture: null
            });
        } catch (error) {
            console.error('Delete photo error:', error);
            res.status(500).json({ message: 'Server error occurred' });
        }
    }
};

module.exports = profileController;