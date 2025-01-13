// backend/models/Intern.js
const pool = require('../config/database');

class Intern {
    static async findAll({ page = 1, limit = 10, status, bidang, search }) {
        let query = `
            SELECT 
                p.*,
                i.nama_institusi,
                b.nama_bidang,
                CASE 
                    WHEN p.jenis_peserta = 'mahasiswa' THEN m.nim
                    ELSE s.nisn
                END as nomor_induk
            FROM peserta_magang p
            LEFT JOIN institusi i ON p.id_institusi = i.id_institusi
            LEFT JOIN bidang b ON p.id_bidang = b.id_bidang
            LEFT JOIN data_mahasiswa m ON p.id_magang = m.id_magang
            LEFT JOIN data_siswa s ON p.id_magang = s.id_magang
            WHERE 1=1
        `;

        const params = [];

        if (status) {
            query += ` AND p.status = ?`;
            params.push(status);
        }

        if (bidang) {
            query += ` AND p.id_bidang = ?`;
            params.push(bidang);
        }

        if (search) {
            query += ` AND (p.nama LIKE ? OR i.nama_institusi LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
        }

        // Get total count
        const [countResult] = await pool.execute(
            `SELECT COUNT(*) as total FROM (${query}) as count_query`,
            params
        );
        const total = countResult[0].total;

        // Get paginated data
        const offset = (page - 1) * limit;
        query += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
        params.push(Number(limit), Number(offset));

        const [rows] = await pool.execute(query, params);

        return {
            data: rows,
            pagination: {
                total,
                page: Number(page),
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    static async findById(id) {
        const [interns] = await pool.execute(`
            SELECT 
                p.*,
                i.nama_institusi,
                b.nama_bidang,
                CASE 
                    WHEN p.jenis_peserta = 'mahasiswa' THEN m.nim
                    ELSE s.nisn
                END as nomor_induk,
                m.fakultas,
                m.jurusan as jurusan_mahasiswa,
                s.jurusan as jurusan_siswa,
                s.kelas
            FROM peserta_magang p
            LEFT JOIN institusi i ON p.id_institusi = i.id_institusi
            LEFT JOIN bidang b ON p.id_bidang = b.id_bidang
            LEFT JOIN data_mahasiswa m ON p.id_magang = m.id_magang
            LEFT JOIN data_siswa s ON p.id_magang = s.id_magang
            WHERE p.id_magang = ?
        `, [id]);

        return interns[0];
    }

    static async getStats() {
        const [activeCount] = await pool.execute(`
            SELECT COUNT(*) as count FROM peserta_magang 
            WHERE status = 'aktif'
        `);

        const [completedCount] = await pool.execute(`
            SELECT COUNT(*) as count FROM peserta_magang 
            WHERE status = 'selesai'
        `);

        const [totalCount] = await pool.execute(`
            SELECT COUNT(*) as count FROM peserta_magang
        `);

        const [completingSoon] = await pool.execute(`
            SELECT COUNT(*) as count FROM peserta_magang 
            WHERE status = 'aktif' 
            AND tanggal_keluar <= DATE_ADD(CURRENT_DATE, INTERVAL 7 DAY)
        `);

        return {
            activeInterns: activeCount[0].count,
            completedInterns: completedCount[0].count,
            totalInterns: totalCount[0].count,
            completingSoon: completingSoon[0].count
        };
    }
}

module.exports = Intern;