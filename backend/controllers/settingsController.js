// backend/controllers/settingsController.js
const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs').promises;

const settingsController = {
    updateTemplate: async (req, res) => {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const { jenis } = req.body;
            const file = req.file;

            if (!file) {
                return res.status(400).json({
                    message: 'File template tidak ditemukan'
                });
            }

            await conn.execute(`
                UPDATE dokumen_template
                SET active = false
                WHERE jenis = ? AND active = true
            `, [jenis]);

            const id_dokumen = uuidv4();
            const filePath = `/uploads/templates/${file.filename}`;

            await conn.execute(`
                INSERT INTO dokumen_template (
                    id_dokumen,
                    jenis,
                    file_path,
                    active,
                    created_by
                ) VALUES (?, ?, ?, true, ?)
            `, [id_dokumen, jenis, filePath, req.user.userId]);

            await conn.commit();
            res.status(201).json({
                message: 'Template berhasil diperbarui',
                id_dokumen
            });
        } catch (error) {
            await conn.rollback();
            console.error('Error updating template:', error);
            res.status(500).json({ message: 'Terjadi kesalahan server' });
        } finally {
            conn.release();
        }
    },

    getTemplates: async (req, res) => {
        try {
            const [templates] = await pool.execute(`
                SELECT *
                FROM dokumen_template
                WHERE active = true
            `);

            res.json(templates);
        } catch (error) {
            console.error('Error getting templates:', error);
            res.status(500).json({ message: 'Terjadi kesalahan server' });
        }
    }
};
