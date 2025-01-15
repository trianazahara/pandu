// backend/controllers/assessmentController.js
const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const assessmentController = {
    addScore: async (req, res) => {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

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

            // Insert penilaian
            const id_penilaian = uuidv4();
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
                    created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                id_penilaian,
                id_magang,
                req.user.userId,
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
                req.user.userId
            ]);

            // Update status peserta magang
            await conn.execute(`
                UPDATE peserta_magang
                SET status = 'selesai'
                WHERE id_magang = ?
            `, [id_magang]);

            await conn.commit();
            res.status(201).json({
                message: 'Penilaian berhasil disimpan',
                id_penilaian
            });
        } catch (error) {
            await conn.rollback();
            console.error('Error creating assessment:', error);
            res.status(500).json({ message: 'Terjadi kesalahan server' });
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
        try {
            const { id } = req.params;
            
            // Cek data existing
            const [existing] = await pool.execute(
                "SELECT * FROM penilaian WHERE id_penilaian = ?", 
                [id]
            );
    
            if (!existing || existing.length === 0) {
                return res.status(404).json({
                    status: "error",
                    message: "Data penilaian tidak ditemukan"
                });
            }
    
            // Ambil data existing sebagai nilai default
            const currentData = existing[0];
            
            // Gabungkan nilai lama dengan nilai baru yang dikirim
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
    
            // Build query update secara dinamis
            let updateQuery = 'UPDATE penilaian SET updated_at = CURRENT_TIMESTAMP';
            const values = [];
            
            // Hanya update field yang dikirim dalam request
            Object.keys(req.body).forEach(key => {
                if (updatedValues.hasOwnProperty(key)) {
                    updateQuery += `, ${key} = ?`;
                    values.push(req.body[key]);
                }
            });
            
            updateQuery += ' WHERE id_penilaian = ?';
            values.push(id);
    
            await pool.execute(updateQuery, values);
    
            // Ambil data yang sudah diupdate
            const [updatedData] = await pool.execute(`
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
    
            return res.status(200).json({
                status: "success",
                message: "Nilai berhasil diupdate",
                data: updatedData[0]
            });
    
        } catch (error) {
            console.error('Error updating nilai:', error);
            return res.status(500).json({
                status: "error",
                message: "Terjadi kesalahan saat mengupdate nilai",
                error: error.message
            });
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

module.exports = assessmentController;