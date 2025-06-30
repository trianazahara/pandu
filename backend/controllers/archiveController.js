const pool = require('../config/database');
const path = require('path');
const fs = require('fs').promises; // Gunakan promises version

const archiveController = {
    // Get all certificates/documents
    getArchives: async (req, res) => {
        try {
            const { page = 1, limit = 10, search = '', bidang = '', bulan = '', tahun = '' } = req.query;
            const offset = (page - 1) * limit;

            // Base query - ubah untuk pakai arsip_sertif
            let query = `
                SELECT 
                    pm.id_magang,
                    pm.nama,
                    pm.jenis_peserta,
                    pm.nama_institusi,
                    b.nama_bidang,
                    DATE_FORMAT(pm.tanggal_masuk, '%d-%m-%Y') as tanggal_masuk,
                    DATE_FORMAT(pm.tanggal_keluar, '%d-%m-%Y') as tanggal_keluar,
                    pm.arsip_sertif,
                    pm.created_at,
                    CASE 
                        WHEN pm.jenis_peserta = 'mahasiswa' THEN m.nim
                        ELSE s.nisn
                    END as nomor_induk
                FROM peserta_magang pm
                LEFT JOIN bidang b ON pm.id_bidang = b.id_bidang
                LEFT JOIN data_mahasiswa m ON pm.id_magang = m.id_magang
                LEFT JOIN data_siswa s ON pm.id_magang = s.id_magang
                WHERE pm.status = 'selesai' 
                AND pm.arsip_sertif IS NOT NULL 
                AND pm.arsip_sertif != ''
            `;

            const queryParams = [];

            // Add search filter
            if (search) {
                query += ` AND (pm.nama LIKE ? OR pm.nama_institusi LIKE ?)`;
                queryParams.push(`%${search}%`, `%${search}%`);
            }

            // Add bidang filter
            if (bidang) {
                query += ` AND b.nama_bidang = ?`;
                queryParams.push(bidang);
            }

            // Add month filter
            if (bulan) {
                query += ` AND MONTH(pm.tanggal_keluar) = ?`;
                queryParams.push(bulan);
            }

            // Add year filter
            if (tahun) {
                query += ` AND YEAR(pm.tanggal_keluar) = ?`;
                queryParams.push(tahun);
            }

            // Count total records
            const countQuery = query.replace(
                /SELECT[\s\S]*?FROM/i, 
                'SELECT COUNT(*) as total FROM'
            );
            
            const [countResult] = await pool.execute(countQuery, queryParams);
            const total = countResult[0].total;

            // Add pagination
            query += ` ORDER BY pm.created_at DESC LIMIT ? OFFSET ?`;
            queryParams.push(parseInt(limit), parseInt(offset));

            const [rows] = await pool.execute(query, queryParams);

            // Format data
            const archives = await Promise.all(rows.map(async (row) => {
                let fileExists = false;
                if (row.arsip_sertif) {
                    const fullPath = path.join(__dirname, '..', 'public', row.arsip_sertif);
                    try {
                        await fs.access(fullPath);
                        fileExists = true;
                    } catch (error) {
                        fileExists = false;
                    }
                }
                
                return {
                    id_magang: row.id_magang,
                    nama: row.nama,
                    nomor_induk: row.nomor_induk,
                    jenis_peserta: row.jenis_peserta,
                    nama_institusi: row.nama_institusi,
                    nama_bidang: row.nama_bidang,
                    tanggal_masuk: row.tanggal_masuk,
                    tanggal_keluar: row.tanggal_keluar,
                    arsip_sertif: row.arsip_sertif,
                    created_at: row.created_at,
                    file_exists: fileExists
                };
            }));

            res.json({
                status: 'success',
                data: {
                    archives,
                    pagination: {
                        current_page: parseInt(page),
                        per_page: parseInt(limit),
                        total,
                        total_pages: Math.ceil(total / limit)
                    }
                }
            });

        } catch (error) {
            console.error('Error fetching archives:', error);
            res.status(500).json({
                status: 'error',
                message: 'Terjadi kesalahan saat mengambil data arsip'
            });
        }
    },

    // Get bidang list for filter
    getBidangList: async (req, res) => {
        try {
            const [rows] = await pool.execute(`
                SELECT DISTINCT b.nama_bidang 
                FROM bidang b
                INNER JOIN peserta_magang pm ON b.id_bidang = pm.id_bidang
                WHERE pm.status = 'selesai' 
                AND pm.arsip_sertif IS NOT NULL
                ORDER BY b.nama_bidang
            `);

            res.json({
                status: 'success',
                data: rows.map(row => row.nama_bidang)
            });

        } catch (error) {
            console.error('Error fetching bidang list:', error);
            res.status(500).json({
                status: 'error',
                message: 'Terjadi kesalahan saat mengambil data bidang'
            });
        }
    },

    // Download certificate - untuk arsip_sertif
    downloadCertificate: async (req, res) => {
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
            console.error('Error downloading certificate:', error);
            res.status(500).json({
                status: 'error',
                message: 'Terjadi kesalahan saat mendownload arsip sertifikat'
            });
        }
    },

    // Delete certificate
    deleteCertificate: async (req, res) => {
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
            console.error('Error deleting certificate:', error);
            res.status(500).json({
                status: 'error',
                message: 'Terjadi kesalahan saat menghapus sertifikat'
            });
        }
    }
};

module.exports = archiveController;