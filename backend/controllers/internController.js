// backend/controllers/internController.js
const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const internController = {
    // Get all interns with pagination and filters
    getAll: async (req, res) => {
        try {
            const {
                page = 1,
                limit = 10,
                status,
                bidang,
                search
            } = req.query;

            const offset = (page - 1) * limit;
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
            query += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
            params.push(Number(limit), Number(offset));

            const [rows] = await pool.execute(query, params);

            res.json({
                data: rows,
                pagination: {
                    total,
                    page: Number(page),
                    totalPages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            console.error('Error getting interns:', error);
            res.status(500).json({ message: 'Terjadi kesalahan server' });
        }
    },

    // Check availability for given date
    checkAvailability: async (req, res) => {
        try {
            const { date } = req.query;
            const SLOT_LIMIT = 50;

            // Get count of active interns for the date
            const [activeCount] = await pool.execute(`
                SELECT COUNT(*) as count
                FROM peserta_magang
                WHERE status = 'aktif'
                AND tanggal_masuk <= ?
                AND tanggal_keluar >= ?
                AND tanggal_keluar > DATE_ADD(?, INTERVAL 7 DAY)
            `, [date, date, date]);

            // Get interns leaving within 7 days
            const [leavingInterns] = await pool.execute(`
                SELECT p.*, i.nama_institusi, b.nama_bidang
                FROM peserta_magang p
                LEFT JOIN institusi i ON p.id_institusi = i.id_institusi
                LEFT JOIN bidang b ON p.id_bidang = b.id_bidang
                WHERE status = 'aktif'
                AND tanggal_keluar BETWEEN ? AND DATE_ADD(?, INTERVAL 7 DAY)
            `, [date, date]);

            // Get count of not_yet interns starting before or on the date
            const [upcomingCount] = await pool.execute(`
                SELECT COUNT(*) as count
                FROM peserta_magang
                WHERE status = 'not_yet'
                AND tanggal_masuk <= ?
            `, [date]);

            const totalOccupied = activeCount[0].count + upcomingCount[0].count;
            const availableSlots = SLOT_LIMIT - totalOccupied;

            res.json({
                available: availableSlots > 0,
                availableSlots,
                totalOccupied,
                leavingInterns,
                leavingCount: leavingInterns.length
            });
        } catch (error) {
            console.error('Error checking availability:', error);
            res.status(500).json({ message: 'Terjadi kesalahan server' });
        }
    },

    // Add new intern
    add: async (req, res) => {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const {
                nama,
                jenis_peserta,
                nomor_induk,
                institusi_id,
                email,
                no_hp,
                bidang_id,
                tanggal_masuk,
                tanggal_keluar,
                // Additional fields based on jenis_peserta
                fakultas,
                jurusan,
                semester,
                kelas
            } = req.body;

            // Insert peserta_magang
            const id_magang = uuidv4();
            await conn.execute(`
                INSERT INTO peserta_magang (
                    id_magang, nama, jenis_peserta, nomor_induk,
                    id_institusi, email, no_hp, id_bidang,
                    tanggal_masuk, tanggal_keluar, created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                id_magang, nama, jenis_peserta, nomor_induk,
                institusi_id, email, no_hp, bidang_id,
                tanggal_masuk, tanggal_keluar, req.user.userId
            ]);

            // Insert additional data based on jenis_peserta
            if (jenis_peserta === 'mahasiswa') {
                await conn.execute(`
                    INSERT INTO data_mahasiswa (
                        id_mahasiswa, id_magang, nim,
                        fakultas, jurusan, semester
                    ) VALUES (?, ?, ?, ?, ?, ?)
                `, [
                    uuidv4(), id_magang, nomor_induk,
                    fakultas, jurusan, semester
                ]);
            } else {
                await conn.execute(`
                    INSERT INTO data_siswa (
                        id_siswa, id_magang, nisn,
                        jurusan, kelas
                    ) VALUES (?, ?, ?, ?, ?)
                `, [
                    uuidv4(), id_magang, nomor_induk,
                    jurusan, kelas
                ]);
            }

            await conn.commit();
            res.status(201).json({
                message: 'Data peserta magang berhasil ditambahkan',
                id_magang
            });
        } catch (error) {
            await conn.rollback();
            console.error('Error adding intern:', error);
            res.status(500).json({ message: 'Terjadi kesalahan server' });
        } finally {
            conn.release();
        }
    },
    getDetail: async (req, res) => {
        try {
            const { id } = req.params;

            const [rows] = await pool.execute(`
                SELECT 
                    p.*,
                    i.nama_institusi,
                    b.nama_bidang,
                    CASE 
                        WHEN p.jenis_peserta = 'mahasiswa' THEN m.nim
                        ELSE s.nisn
                    END as nomor_induk,
                    CASE 
                        WHEN p.jenis_peserta = 'mahasiswa' THEN m.fakultas
                        ELSE NULL
                    END as fakultas,
                    m.semester,
                    CASE 
                        WHEN p.jenis_peserta = 'mahasiswa' THEN m.jurusan
                        ELSE s.jurusan
                    END as jurusan,
                    s.kelas
                FROM peserta_magang p
                LEFT JOIN institusi i ON p.id_institusi = i.id_institusi
                LEFT JOIN bidang b ON p.id_bidang = b.id_bidang
                LEFT JOIN data_mahasiswa m ON p.id_magang = m.id_magang
                LEFT JOIN data_siswa s ON p.id_magang = s.id_magang
                WHERE p.id_magang = ?
            `, [id]);

            if (rows.length === 0) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Data peserta magang tidak ditemukan'
                });
            }

            res.json({
                status: 'success',
                data: rows[0]
            });

        } catch (error) {
            console.error('Error getting intern detail:', error);
            res.status(500).json({ message: 'Terjadi kesalahan server' });
        }
    },

    // Update intern
    update: async (req, res) => {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const { id } = req.params;
            const {
                nama,
                jenis_peserta,
                nomor_induk,
                institusi_id,
                email,
                no_hp,
                bidang_id,
                tanggal_masuk,
                tanggal_keluar,
                status,
                fakultas,
                jurusan,
                semester,
                kelas
            } = req.body;

            // Update peserta_magang
            await conn.execute(`
                UPDATE peserta_magang 
                SET 
                    nama = ?,
                    jenis_peserta = ?,
                    id_institusi = ?,
                    email = ?,
                    no_hp = ?,
                    id_bidang = ?,
                    tanggal_masuk = ?,
                    tanggal_keluar = ?,
                    status = ?,
                    updated_at = CURRENT_TIMESTAMP,
                    updated_by = ?
                WHERE id_magang = ?
            `, [
                nama,
                jenis_peserta,
                institusi_id,
                email,
                no_hp,
                bidang_id,
                tanggal_masuk,
                tanggal_keluar,
                status,
                req.user.userId,
                id
            ]);

            // Update additional data based on jenis_peserta
            if (jenis_peserta === 'mahasiswa') {
                await conn.execute(`
                    UPDATE data_mahasiswa 
                    SET 
                        nim = ?,
                        fakultas = ?,
                        jurusan = ?,
                        semester = ?
                    WHERE id_magang = ?
                `, [
                    nomor_induk,
                    fakultas,
                    jurusan,
                    semester,
                    id
                ]);
            } else {
                await conn.execute(`
                    UPDATE data_siswa 
                    SET 
                        nisn = ?,
                        jurusan = ?,
                        kelas = ?
                    WHERE id_magang = ?
                `, [
                    nomor_induk,
                    jurusan,
                    kelas,
                    id
                ]);
            }

            await conn.commit();
            res.json({
                status: 'success',
                message: 'Data peserta magang berhasil diperbarui'
            });

        } catch (error) {
            await conn.rollback();
            console.error('Error updating intern:', error);
            res.status(500).json({ message: 'Terjadi kesalahan server' });
        } finally {
            conn.release();
        }
    },

    getHistory: async (req, res) => {
        try {
            const {
                page = 1,
                limit = 10,
                status = 'selesai',
                bidang,
                search
            } = req.query;
    
            const offset = (page - 1) * limit;
    
            // Base query for data retrieval
            let query = `
                SELECT 
                    pm.id_magang, 
                    pm.nama, 
                    pm.email, 
                    b.nama_bidang, 
                    pm.status, 
                    pm.tanggal_masuk, 
                    pm.tanggal_keluar
                FROM peserta_magang pm
                LEFT JOIN bidang b ON pm.id_bidang = b.id_bidang
                WHERE pm.status = ?
            `;
    
            // Base query for counting total records
            let countQuery = `
                SELECT COUNT(*) AS total 
                FROM peserta_magang pm
                LEFT JOIN bidang b ON pm.id_bidang = b.id_bidang
                WHERE pm.status = ?
            `;
    
            const params = [status];
            const countParams = [status];
    
            // Add filter for bidang
            if (bidang) {
                query += ` AND pm.id_bidang = ?`;
                countQuery += ` AND pm.id_bidang = ?`;
                params.push(bidang);
                countParams.push(bidang);
            }
    
            // Add search filter
            if (search) {
                query += ` AND (pm.nama LIKE ? OR pm.email LIKE ?)`;
                countQuery += ` AND (pm.nama LIKE ? OR pm.email LIKE ?)`;
                params.push(`%${search}%`, `%${search}%`);
                countParams.push(`%${search}%`, `%${search}%`);
            }
    
            // Add sorting and pagination
            query += ` ORDER BY pm.tanggal_keluar DESC LIMIT ? OFFSET ?`;
            params.push(parseInt(limit), parseInt(offset));
    
            // Execute the main query
            const [rows] = await pool.execute(query, params);
    
            // Execute the count query
            const [countRows] = await pool.execute(countQuery, countParams);
            const totalData = countRows[0]?.total || 0;
            const totalPages = Math.ceil(totalData / limit);
    
            // Response
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
            console.error('Error fetching history:', error);
            return res.status(500).json({
                status: "error",
                message: 'Terjadi kesalahan server',
                error: error.message,
            });
        }
    }
        
};


module.exports = internController;
