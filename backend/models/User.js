// backend/models/User.js
const pool = require('../config/database');

class User {
    static async findByUsername(username) {
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );
        return users[0];
    }

    static async findById(id) {
        const [users] = await pool.execute(
            'SELECT id_users, username, email, nama, role FROM users WHERE id_users = ?',
            [id]
        );
        return users[0];
    }

    static async updateLastLogin(id) {
        await pool.execute(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id_users = ?',
            [id]
        );
    }
}

module.exports = User;