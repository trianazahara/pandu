const pool = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Setup multer untuk upload file
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(__dirname, '..', 'public', 'arsip_sertifikat');
        
        // Buat folder jika belum ada
        try {
            await fs.access(uploadDir);
        } catch {
            await fs.mkdir(uploadDir, { recursive: true });
        }
        
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `arsip_sertifikat_${req.params.id_magang}_${uniqueSuffix}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    // Accept PDF, DOC, DOCX files
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('File type tidak diizinkan. Hanya PDF, DOC, dan DOCX yang diperbolehkan.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max file size
    }
});

const uploadController = {
    // Upload arsip sertifikat
    uploadArsipSertifikat: async (req, res) => {
        try {
            const { id_magang } = req.params;

            // Cek apakah peserta magang exists
            const [peserta] = await pool.execute(`
                SELECT nama, arsip_sertif 
                FROM peserta_magang 
                WHERE id_magang = ?
            `, [id_magang]);

            if (!peserta.length) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Peserta magang tidak ditemukan'
                });
            }

            // Hapus file lama jika ada
            if (peserta[0].arsip_sertif) {
                const oldFilePath = path.join(__dirname, '..', 'public', peserta[0].arsip_sertif);
                try {
                    await fs.access(oldFilePath);
                    await fs.unlink(oldFilePath);
                } catch (error) {
                    console.log('Old file not found or already deleted:', error.message);
                }
            }

            // File path relatif untuk disimpan di database
            const relativePath = `arsip_sertifikat/${req.file.filename}`;

            // Update database
            await pool.execute(`
                UPDATE peserta_magang 
                SET arsip_sertif = ? 
                WHERE id_magang = ?
            `, [relativePath, id_magang]);

            res.json({
                status: 'success',
                message: 'Arsip sertifikat berhasil diupload',
                data: {
                    id_magang,
                    filename: req.file.filename,
                    path: relativePath
                }
            });

        } catch (error) {
            console.error('Error uploading arsip sertifikat:', error);
            res.status(500).json({
                status: 'error',
                message: 'Terjadi kesalahan saat upload arsip sertifikat'
            });
        }
    },

    // Download arsip sertifikat
    downloadArsipSertifikat: async (req, res) => {
        try {
            const { id_magang } = req.params;

            const [rows] = await pool.execute(`
                SELECT nama, arsip_sertif 
                FROM peserta_magang 
                WHERE id_magang = ? AND arsip_sertif IS NOT NULL
            `, [id_magang]);

            if (!rows.length) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Arsip sertifikat tidak ditemukan'
                });
            }

            const filePath = path.join(__dirname, '..', 'public', rows[0].arsip_sertif);
            
            if (!await fs.access(filePath).then(() => true).catch(() => false)) {
                return res.status(404).json({
                    status: 'error',
                    message: 'File arsip sertifikat tidak ditemukan di server'
                });
            }

            const fileName = `arsip_sertifikat_${rows[0].nama.replace(/\s+/g, '_')}.pdf`;
            
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
            
            const fileBuffer = await fs.readFile(filePath);
            res.send(fileBuffer);

        } catch (error) {
            console.error('Error downloading arsip sertifikat:', error);
            res.status(500).json({
                status: 'error',
                message: 'Terjadi kesalahan saat mendownload arsip sertifikat'
            });
        }
    },

    // Delete arsip sertifikat
    deleteArsipSertifikat: async (req, res) => {
        try {
            const { id_magang } = req.params;

            const [rows] = await pool.execute(`
                SELECT arsip_sertif 
                FROM peserta_magang 
                WHERE id_magang = ?
            `, [id_magang]);

            if (!rows.length) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Data tidak ditemukan'
                });
            }

            // Delete physical file if exists
            if (rows[0].arsip_sertif) {
                const filePath = path.join(__dirname, '..', 'public', rows[0].arsip_sertif);
                
                try {
                    await fs.access(filePath);
                    await fs.unlink(filePath);
                } catch (error) {
                    console.log('File not found or already deleted:', error.message);
                }
            }

            // Update database - set arsip_sertif to NULL
            await pool.execute(`
                UPDATE peserta_magang 
                SET arsip_sertif = NULL 
                WHERE id_magang = ?
            `, [id_magang]);

            res.json({
                status: 'success',
                message: 'Arsip sertifikat berhasil dihapus'
            });

        } catch (error) {
            console.error('Error deleting arsip sertifikat:', error);
            res.status(500).json({
                status: 'error',
                message: 'Terjadi kesalahan saat menghapus arsip sertifikat'
            });
        }
    }
};

module.exports = { uploadController, upload };