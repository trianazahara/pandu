// backend/controllers/assessmentController.js
const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const assessmentController = {
    create: async (req, res) => {
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

    getRekapNilai: async (req, res) => {
        try {
            const {
                id_magang,
                nama,
                id_institusi, 
                nama_institusi,
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
            } = req.query;

            

        } catch {

        }
    }
};

module.exports = assessmentController;