// backend/controllers/reportController.js
const pool = require('../config/database');
const XLSX = require('xlsx');

const reportController = {
    exportInternsScore: async (req, res) => {
        try {
            const { status, start_date, end_date, bidang } = req.query;
            let query = `
            SELECT 
                pm.nama,
                pm.jenis_peserta,
                CASE 
                    WHEN pm.jenis_peserta = 'mahasiswa' THEN m.nim
                    ELSE s.nisn
                END as nomor_induk,
                pm.nama_institusi,  
                b.nama_bidang,
                DATE_FORMAT(pm.tanggal_masuk, '%d-%m-%Y') as tanggal_masuk,
                DATE_FORMAT(pm.tanggal_keluar, '%d-%m-%Y') as tanggal_keluar,
                pm.status,
                CASE 
                    WHEN pm.jenis_peserta = 'mahasiswa' THEN m.fakultas
                    ELSE NULL
                END as fakultas,
                CASE 
                    WHEN pm.jenis_peserta = 'mahasiswa' THEN m.jurusan
                    ELSE s.jurusan
                END as jurusan,
                m.semester,
                s.kelas,
                COALESCE(p.nilai_teamwork, 0) as nilai_teamwork,
                COALESCE(p.nilai_komunikasi, 0) as nilai_komunikasi,
                COALESCE(p.nilai_pengambilan_keputusan, 0) as nilai_pengambilan_keputusan,
                COALESCE(p.nilai_kualitas_kerja, 0) as nilai_kualitas_kerja,
                COALESCE(p.nilai_teknologi, 0) as nilai_teknologi,
                COALESCE(p.nilai_disiplin, 0) as nilai_disiplin,
                COALESCE(p.nilai_tanggungjawab, 0) as nilai_tanggungjawab,
                COALESCE(p.nilai_kerjasama, 0) as nilai_kerjasama,
                COALESCE(p.nilai_inisiatif, 0) as nilai_inisiatif,
                COALESCE(p.nilai_kejujuran, 0) as nilai_kejujuran,
                COALESCE(p.nilai_kebersihan, 0) as nilai_kebersihan
            FROM peserta_magang pm
            LEFT JOIN bidang b ON pm.id_bidang = b.id_bidang
            LEFT JOIN data_mahasiswa m ON pm.id_magang = m.id_magang
            LEFT JOIN data_siswa s ON pm.id_magang = s.id_magang
            LEFT JOIN penilaian p ON pm.id_magang = p.id_magang
            WHERE 1=1
        `;
        
                const params = [];
        
                if (status) {
                    query += ` AND pm.status = ?`;
                    params.push(status);
                }
        
                if (start_date && start_date !== 'undefined') {
                    query += ` AND DATE(pm.tanggal_masuk) >= ?`;
                    params.push(start_date);
                }
        
                if (end_date && end_date !== 'undefined') {
                    query += ` AND DATE(pm.tanggal_keluar) <= ?`;
                    params.push(end_date);
                }
        
                if (bidang && bidang !== 'undefined') {
                    query += ` AND b.id_bidang = ?`;
                    params.push(bidang);
                }
        
                query += ` ORDER BY pm.created_at DESC`;
        
                const [rows] = await pool.execute(query, params);
        
                // Format data sebelum export
                const formattedData = rows.map(row => ({
                    'Nama': row.nama || '-',
                    'Jenis Peserta': row.jenis_peserta || '-',
                    'Nomor Induk': row.nomor_induk || '-',
                    'Institusi': row.nama_institusi || '-',
                    'Bidang': row.nama_bidang || '-',
                    'Tanggal Masuk': row.tanggal_masuk || '-',
                    'Tanggal Keluar': row.tanggal_keluar || '-',
                    'Status': row.status || '-',
                    'Fakultas': row.fakultas || '-',
                    'Jurusan': row.jurusan || '-',
                    'Semester': row.semester || '-',
                    'Kelas': row.kelas || '-',
                    'Nilai Teamwork': row.nilai_teamwork || '0',
                    'Nilai Komunikasi': row.nilai_komunikasi || '0',
                    'Nilai Pengambilan Keputusan': row.nilai_pengambilan_keputusan || '0',
                    'Nilai Kualitas Kerja': row.nilai_kualitas_kerja || '0',
                    'Nilai Teknologi': row.nilai_teknologi || '0',
                    'Nilai Disiplin': row.nilai_disiplin || '0',
                    'Nilai Tanggung Jawab': row.nilai_tanggungjawab || '0',
                    'Nilai Kerjasama': row.nilai_kerjasama || '0',
                    'Nilai Inisiatif': row.nilai_inisiatif || '0',
                    'Nilai Kejujuran': row.nilai_kejujuran || '0',
                    'Nilai Kebersihan': row.nilai_kebersihan || '0'
                }));
        
                // Create workbook
                const wb = XLSX.utils.book_new();
                
                // Create worksheet dari data yang sudah diformat
                const ws = XLSX.utils.json_to_sheet(formattedData);
        
                // Set column widths
                const colWidths = [
                    { wch: 30 }, // Nama
                    { wch: 15 }, // Jenis Peserta
                    { wch: 20 }, // Nomor Induk
                    { wch: 30 }, // Institusi
                    { wch: 20 }, // Bidang
                    { wch: 15 }, // Tanggal Masuk
                    { wch: 15 }, // Tanggal Keluar
                    { wch: 15 }, // Status
                    { wch: 20 }, // Fakultas
                    { wch: 25 }, // Jurusan
                    { wch: 10 }, // Semester
                    { wch: 10 }, // Kelas
                    { wch: 15 }, // Nilai Teamwork
                    { wch: 15 }, // Nilai Komunikasi
                    { wch: 25 }, // Nilai Pengambilan Keputusan
                    { wch: 20 }, // Nilai Kualitas Kerja
                    { wch: 15 }, // Nilai Teknologi
                    { wch: 15 }, // Nilai Disiplin
                    { wch: 20 }, // Nilai Tanggung Jawab
                    { wch: 15 }, // Nilai Kerjasama
                    { wch: 15 }, // Nilai Inisiatif
                    { wch: 15 }, // Nilai Kejujuran
                    { wch: 15 }  // Nilai Kebersihan
                ];
                ws['!cols'] = colWidths;
        
                // Add worksheet ke workbook
                XLSX.utils.book_append_sheet(wb, ws, 'Data Anak Magang');
        
                // Generate buffer
                const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        
                // Set response headers
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', 'attachment; filename=Data_Anak_Magang.xlsx');
                res.send(buffer);
        
            } catch (error) {
                console.error('Error exporting data:', error);
                res.status(500).json({
                    status: "error",
                    message: "Terjadi kesalahan saat export data",
                    error: error.message
                });
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
    }
};

module.exports = reportController;