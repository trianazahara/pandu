// backend/controllers/authController.js
const pool = require('../config/database');
const bcrypt = require('bcrypt');
const { generateToken } = require('../config/auth');
const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Simpan di .env
        pass: process.env.EMAIL_PASS  // Simpan di .env
    }
});

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};
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
    },
    checkUsername: async (req, res) => {
        try {
            // Validasi body request
            const { username } = req.body;
            
            if (!username) {
                return res.status(400).json({ 
                    exists: false,
                    message: 'Username harus diisi' 
                });
            }

            console.log('Checking username:', username);

            const [users] = await pool.execute(
                'SELECT email FROM users WHERE username = ?',
                [username]
            );

            if (users.length === 0) {
                return res.status(404).json({ 
                    exists: false,
                    message: 'Username tidak ditemukan' 
                });
            }

            // Mask email sebelum dikirim ke client
            const email = users[0].email;
            const maskedEmail = email.replace(/(.{3})(.*)(@.*)/, '$1***$3');

            // Langsung kirim OTP setelah username ditemukan
            const otp = generateOTP();
            
            // Simpan OTP ke database
            await pool.execute(
                'UPDATE users SET otp = ?, otp_expires_at = DATE_ADD(NOW(), INTERVAL 15 MINUTE) WHERE username = ?',
                [otp, username]
            );

            // Kirim email dengan OTP
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Reset Password OTP',
                html: `
                    <h2>Reset Password</h2>
                    <p>Berikut adalah kode OTP untuk reset password Anda:</p>
                    <h3>${otp}</h3>
                    <p>Kode ini akan kadaluarsa dalam 15 menit.</p>
                `
            });

            res.json({
                exists: true,
                maskedEmail,
                message: `OTP telah dikirim ke ${maskedEmail}`
            });

        } catch (error) {
            console.error('Check username error:', error);
            res.status(500).json({ 
                exists: false,
                message: 'Terjadi kesalahan server' 
            });
        }
    },
    forgotPassword: async (req, res) => {
        try {
            const { username } = req.body;
            console.log('Step 1: Received username:', username);

            // Get user email from username
            const [users] = await pool.execute(
                'SELECT * FROM users WHERE username = ?',
                [username]
            );
            console.log('Step 2: Database query result:', users.length);

            if (users.length === 0) {
                return res.status(404).json({ message: 'Username tidak ditemukan' });
            }

            const user = users[0];
            const otp = generateOTP();
            console.log('Step 3: Generated OTP:', otp);

            // Save OTP to database
            await pool.execute(
                'UPDATE users SET otp = ?, otp_expires_at = DATE_ADD(NOW(), INTERVAL 15 MINUTE) WHERE username = ?',
                [otp, username]
            );
            console.log('Step 4: OTP saved to database');

            // Check email configuration
            console.log('Step 5: Email configuration:', {
                host: process.env.EMAIL_USER,
                hasPassword: !!process.env.EMAIL_PASS
            });

            // Send email
            try {
                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: user.email,
                    subject: 'Reset Password OTP',
                    html: `
                        <h2>Reset Password</h2>
                        <p>Berikut adalah kode OTP untuk reset password Anda:</p>
                        <h3>${otp}</h3>
                        <p>Kode ini akan kadaluarsa dalam 15 menit.</p>
                    `
                });
                console.log('Step 6: Email sent successfully');

                // Mask email for response
                const maskedEmail = user.email.replace(/(.{3})(.*)(@.*)/, '$1***$3');
                
                res.json({ 
                    status: 'success',
                    message: `OTP telah dikirim ke ${maskedEmail}`,
                    maskedEmail
                });

            } catch (emailError) {
                console.error('Email sending error:', emailError);
                throw emailError;
            }

        } catch (error) {
            console.error('Detailed error:', error);
            console.error('Error stack:', error.stack);
            res.status(500).json({ 
                message: 'Terjadi kesalahan server',
                error: error.message 
            });
        }
    },

    resetPassword: async (req, res) => {
        try {
            const { username, otp, newPassword } = req.body;
            console.log('Reset password attempt:', { username });

            // Check valid OTP and not expired
            const [users] = await pool.execute(
                'SELECT * FROM users WHERE username = ? AND otp = ? AND otp_expires_at > NOW()',
                [username, otp]
            );

            if (users.length === 0) {
                return res.status(400).json({ message: 'OTP tidak valid atau sudah expired' });
            }

            // Hash new password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            // Update password and clear OTP
            await pool.execute(
                'UPDATE users SET password = ?, otp = NULL, otp_expires_at = NULL WHERE username = ?',
                [hashedPassword, username]
            );
            console.log('Password reset successful');

            res.json({ 
                status: 'success',
                message: 'Password berhasil direset' 
            });

        } catch (error) {
            console.error('Reset password error:', error);
            res.status(500).json({ message: 'Terjadi kesalahan server' });
        }
    }
};

module.exports = authController;