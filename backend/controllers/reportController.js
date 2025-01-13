// backend/controllers/reportController.js
const pool = require('../config/database');
const XLSX = require('xlsx');

const reportController = {
    exportInterns: async (req, res) => {
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
                    i.nama_institusi,
                    b.nama_bidang,
                    pm.tanggal_masuk,
                    pm.tanggal_keluar,
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
                    p.nilai_teamwork,
                    p.nilai_komunikasi,
                    p.nilai_pengambilan_keputusan,
                    p.nilai_kualitas_kerja,
                    p.nilai_teknologi,
                    p.nilai_disiplin,
                    p.nilai_tanggungjawab,
                    p.nilai_kerjasama,
                    p.nilai_inisiatif,
                    p.nilai_kejujuran,
                    p.nilai_kebersihan
                FROM peserta_magang pm
                LEFT JOIN institusi i ON pm.id_institusi = i.id_institusi
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

            if (start_date) {
                query += ` AND pm.tanggal_masuk >= ?`;
                params.push(start_date);
            }

            if (end_date) {
                query += ` AND pm.tanggal_keluar <= ?`;
                params.push(end_date);
            }

            if (bidang) {
                query += ` AND pm.id_bidang = ?`;
                params.push(bidang);
            }

            query += ` ORDER BY pm.created_at DESC`;

            const [rows] = await pool.execute(query, params);

            // Create workbook and worksheet
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(rows);

            // Add column headers
            const headers = [
                'Nama',
                'Jenis Peserta',
                'Nomor Induk',
                'Institusi',
                'Bidang',
                'Tanggal Masuk',
                'Tanggal Keluar',
                'Status',
                'Fakultas',
                'Jurusan',
                'Semester',
                'Kelas',
                'Nilai Teamwork',
                'Nilai Komunikasi',
                'Nilai Pengambilan Keputusan',
                'Nilai Kualitas Kerja',
                'Nilai Teknologi',
                'Nilai Disiplin',
                'Nilai Tanggung Jawab',
                'Nilai Kerjasama',
                'Nilai Inisiatif',
                'Nilai Kejujuran',
                'Nilai Kebersihan'
            ];

            XLSX.utils.sheet_add_aoa(ws, [headers], { origin: 'A1' });

            // Set column widths
            const colWidths = headers.map(() => ({ wch: 15 }));
            ws['!cols'] = colWidths;

            // Add the worksheet to workbook
            XLSX.utils.book_append_sheet(wb, ws, 'Data Anak Magang');

            // Generate buffer
            const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

            // Send response
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=data_anak_magang.xlsx');
            res.send(Buffer.from(buffer));
        } catch (error) {
            console.error('Error exporting data:', error);
            res.status(500).json({ message: 'Terjadi kesalahan server' });
        }
    }
};