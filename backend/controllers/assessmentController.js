// backend/controllers/assessmentController.js
const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const notificationController = require('./notificationController');

const createInternNotification = async (conn, {userId, judul, pesan}) => {
    const query = `
        INSERT INTO notifikasi (
            id_notifikasi,
            user_id,
            judul,
            pesan,
            dibaca,
            created_at
        ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;

    const values = [
        uuidv4(),
        userId,
        judul,
        pesan,
        0
    ];

    await conn.execute(query, values);
};

const assessmentController = {
    addScore: async (req, res) => {
        const conn = await pool.getConnection();
        try {
            // 1. Validasi autentikasi user
            if (!req.user || !req.user.userId) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Unauthorized: User authentication required'
                });
            }

            await conn.beginTransaction();

            // 2. Validasi data yang diperlukan
            const {
                id_magang,
                nilai_teamwork,
                nilai_komunikasi,
                nilai_pengambilan_keputusan,
                nilai_kualitas_kerja,
                nilai_teknologi,
                nilai_disiplin,
                nilai_tanggungjawab,
                nilai_kerjasama,
                nilai_inisiatif,
                nilai_kejujuran,
                nilai_kebersihan
            } = req.body;
            
            // Validasi input
            const isEmpty = (val) => val === undefined || val === null || val === '';
            if (
                !id_magang ||
                [nilai_teamwork, nilai_komunikasi, nilai_pengambilan_keputusan, nilai_kualitas_kerja, nilai_teknologi,
                 nilai_disiplin, nilai_tanggungjawab, nilai_kerjasama, nilai_inisiatif, nilai_kejujuran, nilai_kebersihan]
                    .some((val) => val === undefined)
            ) {
                return res.status(400).json({ message: 'Semua nilai harus diisi.' });
            }

            if (!req.user || !req.user.userId) {
                return res.status(403).json({ message: 'User tidak valid.' });
            }

            if (!id_magang) {
                return res.status(400).json({
                    status: 'error',
                    message: 'ID Magang harus diisi'
                });
            }

            // 3. Cek apakah peserta magang ada
            const [pesertaExists] = await conn.execute(
                'SELECT nama FROM peserta_magang WHERE id_magang = ?',
                [id_magang]
            );

            if (pesertaExists.length === 0) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Data peserta magang tidak ditemukan'
                });
            }

            // 4. Cek apakah sudah ada penilaian sebelumnya
            const [existingScore] = await conn.execute(
                'SELECT id_penilaian FROM penilaian WHERE id_magang = ?',
                [id_magang]
            );

            if (existingScore.length > 0) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Penilaian untuk peserta ini sudah ada'
                });
            }

            // 5. Insert penilaian
            const id_penilaian = uuidv4();

            const [existingPenilaian] = await conn.execute(`
                SELECT id_penilaian FROM penilaian WHERE id_magang = ?
            `, [id_magang]);

            if (existingPenilaian.length > 0) {
                // Jika sudah ada, kembalikan error
                return res.status(400).json({ 
                    message: 'Penilaian sudah ada untuk peserta magang ini.' 
                });
            }
            await conn.execute(`
                INSERT INTO penilaian (
                    id_penilaian,
                    id_magang,
                    id_users,
                    nilai_teamwork,
                    nilai_komunikasi,
                    nilai_pengambilan_keputusan,
                    nilai_kualitas_kerja,
                    nilai_teknologi,
                    nilai_disiplin,
                    nilai_tanggungjawab,
                    nilai_kerjasama,
                    nilai_inisiatif,
                    nilai_kejujuran,
                    nilai_kebersihan,
                    created_by,
                    created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `, [
                id_penilaian,
                id_magang,
                req.user.userId,
                nilai_teamwork || 0,
                nilai_komunikasi || 0,
                nilai_pengambilan_keputusan || 0,
                nilai_kualitas_kerja || 0,
                nilai_teknologi || 0,
                nilai_disiplin || 0,
                nilai_tanggungjawab || 0,
                nilai_kerjasama || 0,
                nilai_inisiatif || 0,
                nilai_kejujuran || 0,
                nilai_kebersihan || 0,
                req.user.userId
            ]);

            // 6. Update status peserta magang
            await conn.execute(`
                UPDATE peserta_magang
                SET status = 'selesai',
                    updated_by = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id_magang = ?
            `, [req.user.userId, id_magang]);

            // 7. Buat notifikasi
            await createInternNotification(conn, {
                userId: req.user.userId,
                judul: 'Penilaian Baru',
                pesan: `${req.user.username} telah menambahkan penilaian untuk peserta magang: ${pesertaExists[0].nama}`
            });

            // 8. Commit transaction
            await conn.commit();

            // 9. Kirim response sukses
            res.status(201).json({
                status: 'success',
                message: 'Penilaian berhasil disimpan',
                data: {
                    id_penilaian,
                    id_magang,
                    created_by: req.user.userId,
                    created_at: new Date().toISOString()
                }
            });

        } catch (error) {
            await conn.rollback();
            console.error('Error creating assessment:', error);
            res.status(500).json({
                status: 'error',
                message: 'Terjadi kesalahan server',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        } finally {
            conn.release();
        }
    },

    getRekapNilai: async (req, res) => {
        try {
            const {
                page = 1,
                limit = 10,
                bidang,
                search
            } = req.query;
    
            console.log('=== DEBUG INFO ===');
            console.log('Page:', page);
            console.log('Limit:', limit);
            console.log('Bidang:', bidang);
            console.log('Search:', search);
    
            const offset = (page - 1) * limit;
            const params = [];
            
            let query = `
                SELECT 
                    pm.nama,
                    pm.nama_institusi,
                    b.nama_bidang,
                    p.*
                FROM penilaian p
                INNER JOIN peserta_magang pm ON p.id_magang = pm.id_magang
                INNER JOIN bidang b ON pm.id_bidang = b.id_bidang
                WHERE 1=1
            `;
    
            if (bidang && bidang !== '') {
                query += ` AND b.nama_bidang = ?`;
                params.push(bidang);
            }
    
            if (search && search !== '') {
                query += ` AND (pm.nama LIKE ? OR pm.nama_institusi LIKE ?)`;
                params.push(`%${search}%`, `%${search}%`);
            }
    
            // Eksekusi query sederhana dulu untuk debug
            let debugQuery = `
                SELECT COUNT(*) as total
                FROM penilaian p
                INNER JOIN peserta_magang pm ON p.id_magang = pm.id_magang
                INNER JOIN bidang b ON pm.id_bidang = b.id_bidang
            `;
            const [debugResult] = await pool.execute(debugQuery);
            console.log('Debug Query Result:', debugResult);
    
            query += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
            params.push(parseInt(limit), parseInt(offset));
    
            console.log('=== QUERY INFO ===');
            console.log('Final Query:', query);
            console.log('Parameters:', params);
    
            // Eksekusi query utama
            const [rows] = await pool.execute(query, params);
            console.log('=== RESULT INFO ===');
            console.log('Number of rows returned:', rows ? rows.length : 0);
            console.log('First row:', rows && rows.length > 0 ? rows[0] : 'No data');
    
            // Jika tidak ada data
            if (!rows || rows.length === 0) {
                console.log('No data found in query result');
                return res.status(200).json({
                    status: "success",
                    data: [],
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: 0,
                        totalData: 0,
                        limit: parseInt(limit),
                    },
                });
            }
    
            // Count total records (tanpa pagination)
            const countQuery = `
                SELECT COUNT(*) as total 
                FROM penilaian p
                INNER JOIN peserta_magang pm ON p.id_magang = pm.id_magang
                INNER JOIN bidang b ON pm.id_bidang = b.id_bidang
                WHERE 1=1
                ${bidang && bidang !== '' ? ' AND b.nama_bidang = ?' : ''}
                ${search && search !== '' ? ' AND (pm.nama LIKE ? OR pm.nama_institusi LIKE ?)' : ''}
            `;
            const countParams = [...params];
            countParams.pop(); // Remove LIMIT
            countParams.pop(); // Remove OFFSET
            
            const [countRows] = await pool.execute(countQuery, countParams);
            const totalData = countRows[0]?.total || 0;
            const totalPages = Math.ceil(totalData / limit);
    
            console.log('=== PAGINATION INFO ===');
            console.log('Total Data:', totalData);
            console.log('Total Pages:', totalPages);
    
            return res.status(200).json({
                status: "success",
                data: rows,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalData,
                    limit: parseInt(limit),
                },
            });
    
        } catch (error) {
            console.error('=== ERROR INFO ===');
            console.error('Error Message:', error.message);
            console.error('Error Stack:', error.stack);
            return res.status(500).json({
                status: "error",
                message: 'Terjadi kesalahan server',
                error: error.message,
            });
        }
    },

     updateScore: async (req, res) => {
        const conn = await pool.getConnection();
        try {
            // 1. Validasi autentikasi user
            if (!req.user || !req.user.userId) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Unauthorized: User authentication required'
                });
            }

            await conn.beginTransaction();
            const { id } = req.params;

            // 2. Cek data existing dan ambil data peserta
            const [existing] = await conn.execute(`
                SELECT p.*, pm.nama 
                FROM penilaian p
                JOIN peserta_magang pm ON p.id_magang = pm.id_magang
                WHERE p.id_penilaian = ?
            `, [id]);

            if (!existing || existing.length === 0) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Data penilaian tidak ditemukan'
                });
            }

            // 3. Validasi dan persiapan data update
            const currentData = existing[0];
            const updatedValues = {
                nilai_teamwork: req.body.nilai_teamwork ?? currentData.nilai_teamwork,
                nilai_komunikasi: req.body.nilai_komunikasi ?? currentData.nilai_komunikasi,
                nilai_pengambilan_keputusan: req.body.nilai_pengambilan_keputusan ?? currentData.nilai_pengambilan_keputusan,
                nilai_kualitas_kerja: req.body.nilai_kualitas_kerja ?? currentData.nilai_kualitas_kerja,
                nilai_teknologi: req.body.nilai_teknologi ?? currentData.nilai_teknologi,
                nilai_disiplin: req.body.nilai_disiplin ?? currentData.nilai_disiplin,
                nilai_tanggungjawab: req.body.nilai_tanggungjawab ?? currentData.nilai_tanggungjawab,
                nilai_kerjasama: req.body.nilai_kerjasama ?? currentData.nilai_kerjasama,
                nilai_inisiatif: req.body.nilai_inisiatif ?? currentData.nilai_inisiatif,
                nilai_kejujuran: req.body.nilai_kejujuran ?? currentData.nilai_kejujuran,
                nilai_kebersihan: req.body.nilai_kebersihan ?? currentData.nilai_kebersihan
            };

            // 4. Build query update
            let updateQuery = `
                UPDATE penilaian 
                SET updated_at = CURRENT_TIMESTAMP,
                    updated_by = ?
            `;
            const values = [req.user.userId];

            Object.entries(updatedValues).forEach(([key, value]) => {
                if (value !== undefined) {
                    updateQuery += `, ${key} = ?`;
                    values.push(value);
                }
            });

            updateQuery += ' WHERE id_penilaian = ?';
            values.push(id);

            // 5. Eksekusi update
            await conn.execute(updateQuery, values);

            // 6. Buat notifikasi
            await createInternNotification(conn, {
                userId: req.user.userId,
                judul: 'Update Penilaian',
                pesan: `${req.user.username} telah mengupdate penilaian untuk peserta magang: ${existing[0].nama}`
            });

            // 7. Commit transaction
            await conn.commit();

            // 8. Ambil data yang sudah diupdate
            const [updatedData] = await conn.execute(`
                SELECT 
                    p.*,
                    pm.nama,
                    pm.nama_institusi,
                    b.nama_bidang
                FROM penilaian p
                INNER JOIN peserta_magang pm ON p.id_magang = pm.id_magang
                INNER JOIN bidang b ON pm.id_bidang = b.id_bidang
                WHERE p.id_penilaian = ?
            `, [id]);

            // 9. Kirim response sukses
            return res.status(200).json({
                status: 'success',
                message: 'Nilai berhasil diupdate',
                data: updatedData[0]
            });

        } catch (error) {
            await conn.rollback();
            console.error('Error updating nilai:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Terjadi kesalahan saat mengupdate nilai',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        } finally {
            if (conn) conn.release();
        }
    },

    getByInternId: async (req, res) => {
        try {
            const { id_magang } = req.params;

            const [assessment] = await pool.execute(`
                SELECT p.*, pm.nama, pm.jenis_peserta,
                       i.nama_institusi, b.nama_bidang,
                       CASE 
                           WHEN pm.jenis_peserta = 'mahasiswa' THEN m.nim
                           ELSE s.nisn
                       END as nomor_induk,
                       m.fakultas, m.jurusan as jurusan_mahasiswa,
                       s.jurusan as jurusan_siswa, s.kelas
                FROM penilaian p
                JOIN peserta_magang pm ON p.id_magang = pm.id_magang
                LEFT JOIN institusi i ON pm.id_institusi = i.id_institusi
                LEFT JOIN bidang b ON pm.id_bidang = b.id_bidang
                LEFT JOIN data_mahasiswa m ON pm.id_magang = m.id_magang
                LEFT JOIN data_siswa s ON pm.id_magang = s.id_magang
                WHERE p.id_magang = ?
            `, [id_magang]);

            if (!assessment.length) {
                return res.status(404).json({
                    message: 'Penilaian tidak ditemukan'
                });
            }

            res.json(assessment[0]);
        } catch (error) {
            console.error('Error getting assessment:', error);
            res.status(500).json({ message: 'Terjadi kesalahan server' });
        }
    },

    generateCertificate: async (req, res) => {
        try {
            const { id_magang } = req.params;

            // Get assessment and intern data
            const [assessment] = await pool.execute(`
                SELECT p.*, pm.nama, pm.jenis_peserta,
                       i.nama_institusi, b.nama_bidang,
                       CASE 
                           WHEN pm.jenis_peserta = 'mahasiswa' THEN m.nim
                           ELSE s.nisn
                       END as nomor_induk,
                       m.fakultas, m.jurusan as jurusan_mahasiswa,
                       s.jurusan as jurusan_siswa, s.kelas,
                       pm.tanggal_masuk, pm.tanggal_keluar
                FROM penilaian p
                JOIN peserta_magang pm ON p.id_magang = pm.id_magang
                LEFT JOIN institusi i ON pm.id_institusi = i.id_institusi
                LEFT JOIN bidang b ON pm.id_bidang = b.id_bidang
                LEFT JOIN data_mahasiswa m ON pm.id_magang = m.id_magang
                LEFT JOIN data_siswa s ON pm.id_magang = s.id_magang
                WHERE p.id_magang = ?
            `, [id_magang]);

            if (!assessment.length) {
                return res.status(404).json({
                    message: 'Data tidak ditemukan'
                });
            }

            // Get certificate template
            const [template] = await pool.execute(`
                SELECT file_path
                FROM dokumen_template
                WHERE jenis = 'sertifikat'
                AND active = true
                LIMIT 1
            `);

            if (!template.length) {
                return res.status(404).json({
                    message: 'Template sertifikat tidak ditemukan'
                });
            }

            // Generate certificate using PDF lib
            const templatePath = path.join(__dirname, '..', template[0].file_path);
            const templateBytes = await fs.readFile(templatePath);
            const pdfDoc = await PDFDocument.load(templateBytes);
            const pages = pdfDoc.getPages();
            const firstPage = pages[0];

            // Add details to certificate
            // Note: Exact positions would depend on your template
            const data = assessment[0];
            const { width, height } = firstPage.getSize();

            firstPage.drawText(data.nama, {
                x: width / 2,
                y: height - 200,
                size: 24,
                font: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
                color: rgb(0, 0, 0)
            });

            // Add more text fields as needed

            const pdfBytes = await pdfDoc.save();
            
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=sertifikat.pdf');
            res.send(Buffer.from(pdfBytes));
        } catch (error) {
            console.error('Error generating certificate:', error);
            res.status(500).json({ message: 'Terjadi kesalahan server' });
        }
    },
};


const cron = require('node-cron');
const Notification = require('../models/Notification');

// Hapus notifikasi lama setiap hari
cron.schedule('0 0 * * *', async () => {
    await Notification.deleteOldNotifications();
});

module.exports = assessmentController;