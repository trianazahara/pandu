// backend/controllers/internController.js
const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Fungsi helper untuk menentukan status berdasarkan tanggal
const determineStatus = (tanggal_masuk, tanggal_keluar) => {
    const current = new Date();
    const masuk = new Date(tanggal_masuk);
    const keluar = new Date(tanggal_keluar);
    const sevenDaysBefore = new Date(keluar);
    sevenDaysBefore.setDate(keluar.getDate() - 7);

    if (current < masuk) {
        return 'not_yet';
    } else if (current > keluar) {
        return 'selesai';
    } else if (current >= sevenDaysBefore && current <= keluar) {
        return 'almost';
    } else {
        return 'aktif';
    }
};

// Fungsi untuk mengupdate status peserta magang
const updateInternStatuses = async (conn) => {
    const query = `
        UPDATE peserta_magang 
        SET status = CASE
            WHEN CURRENT_DATE < tanggal_masuk THEN 'not_yet'
            WHEN CURRENT_DATE > tanggal_keluar THEN 'selesai'
            WHEN CURRENT_DATE BETWEEN DATE_SUB(tanggal_keluar, INTERVAL 7 DAY) AND tanggal_keluar THEN 'almost'
            ELSE 'aktif'
        END
        WHERE status != 'selesai'
    `;
    await conn.execute(query);
};
const internController = {
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
                    b.nama_bidang,
                    CASE 
                        WHEN p.jenis_peserta = 'mahasiswa' THEN m.nim
                        ELSE s.nisn
                    END as nomor_induk,
                    CASE 
                        WHEN p.jenis_peserta = 'mahasiswa' THEN m.fakultas
                        ELSE s.kelas
                    END as detail_pendidikan,
                    CASE 
                        WHEN p.jenis_peserta = 'mahasiswa' THEN m.jurusan
                        ELSE s.jurusan
                    END as jurusan
                FROM peserta_magang p
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
                query += ` AND (p.nama LIKE ? OR p.nama_institusi LIKE ? OR 
                    CASE 
                        WHEN p.jenis_peserta = 'mahasiswa' THEN m.nim
                        ELSE s.nisn
                    END LIKE ?)`;
                params.push(`%${search}%`, `%${search}%`, `%${search}%`);
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

    checkAvailability: async (req, res) => {
        try {
            const { date } = req.query;
            const SLOT_LIMIT = 50;

            const [activeCount] = await pool.execute(`
                SELECT COUNT(*) as count
                FROM peserta_magang
                WHERE status = 'aktif'
                AND tanggal_masuk <= ?
                AND tanggal_keluar >= ?
                AND tanggal_keluar > DATE_ADD(?, INTERVAL 7 DAY)
            `, [date, date, date]);

            const [leavingInterns] = await pool.execute(`
                SELECT p.*, b.nama_bidang
                FROM peserta_magang p
                LEFT JOIN bidang b ON p.id_bidang = b.id_bidang
                WHERE status = 'aktif'
                AND tanggal_keluar BETWEEN ? AND DATE_ADD(?, INTERVAL 7 DAY)
            `, [date, date]);

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

    add: async (req, res) => {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
        
            const created_by = req.user?.id_users;
            const {
                nama,
                jenis_peserta,
                nama_institusi,
                jenis_institusi,
                email,
                no_hp,
                bidang_id,
                tanggal_masuk,
                tanggal_keluar,
                detail_peserta
            } = req.body;

            // Validasi data yang diperlukan
            if (!nama || !jenis_peserta || !nama_institusi || !jenis_institusi || 
                !bidang_id || !tanggal_masuk || !tanggal_keluar || !detail_peserta) {
                return res.status(400).json({
                    message: 'Semua field wajib diisi'
                });
            }

            // Validasi keberadaan bidang_id
            const [bidangExists] = await conn.execute(
                'SELECT id_bidang FROM bidang WHERE id_bidang = ?',
                [bidang_id]
            );

            if (bidangExists.length === 0) {
                return res.status(400).json({
                    message: 'Bidang yang dipilih tidak valid'
                });
            }

            // Tentukan status awal berdasarkan tanggal
            const status = determineStatus(tanggal_masuk, tanggal_keluar);

            // Insert peserta_magang
            const id_magang = uuidv4();
            const pesertaMagangQuery = `
                INSERT INTO peserta_magang (
                    id_magang, nama, jenis_peserta, nama_institusi,
                    jenis_institusi, email, no_hp, id_bidang,
                    tanggal_masuk, tanggal_keluar, status, created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const pesertaMagangValues = [
                id_magang, nama, jenis_peserta, nama_institusi,
                jenis_institusi, email || null, no_hp || null, bidang_id,
                tanggal_masuk, tanggal_keluar, status, req.user?.id_users || null
            ];

            await conn.execute(pesertaMagangQuery, pesertaMagangValues);

            // Insert additional data based on jenis_peserta
            if (jenis_peserta === 'mahasiswa') {
                const { nim, fakultas, jurusan, semester } = detail_peserta;
                if (!nim || !jurusan) {
                    throw new Error('NIM dan jurusan wajib diisi untuk mahasiswa');
                }

                const mahasiswaQuery = `
                    INSERT INTO data_mahasiswa (
                        id_mahasiswa, id_magang, nim,
                        fakultas, jurusan, semester
                    ) VALUES (?, ?, ?, ?, ?, ?)
                `;

                const mahasiswaValues = [
                    uuidv4(),
                    id_magang,
                    nim,
                    fakultas || null,
                    jurusan,
                    semester || null
                ];

                await conn.execute(mahasiswaQuery, mahasiswaValues);
            } else if (jenis_peserta === 'siswa') {
                const { nisn, jurusan, kelas } = detail_peserta;
                if (!nisn || !jurusan) {
                    throw new Error('NISN dan jurusan wajib diisi untuk siswa');
                }

                const siswaQuery = `
                    INSERT INTO data_siswa (
                        id_siswa, id_magang, nisn,
                        jurusan, kelas
                    ) VALUES (?, ?, ?, ?, ?)
                `;

                const siswaValues = [
                    uuidv4(),
                    id_magang,
                    nisn,
                    jurusan,
                    kelas || null
                ];

                await conn.execute(siswaQuery, siswaValues);
            } else {
                throw new Error('Jenis peserta tidak valid');
            }

            await conn.commit();
            res.status(201).json({
                message: 'Data peserta magang berhasil ditambahkan',
                id_magang
            });
        } catch (error) {
            await conn.rollback();
            console.error('Error adding intern:', error);
            
            // Send more specific error message
            if (error.message.includes('wajib diisi')) {
                res.status(400).json({ message: error.message });
            } else {
                res.status(500).json({ message: 'Terjadi kesalahan server' });
            }
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
                    b.nama_bidang,
                    CASE 
                        WHEN p.jenis_peserta = 'mahasiswa' THEN (
                            SELECT JSON_OBJECT(
                                'nim', m.nim,
                                'fakultas', m.fakultas,
                                'jurusan', m.jurusan,
                                'semester', m.semester
                            )
                        )
                        ELSE (
                            SELECT JSON_OBJECT(
                                'nisn', s.nisn,
                                'jurusan', s.jurusan,
                                'kelas', s.kelas
                            )
                        )
                    END as detail_peserta
                FROM peserta_magang p
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

            if (rows[0].detail_peserta) {
                rows[0].detail_peserta = JSON.parse(rows[0].detail_peserta);
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

    updateStatuses: async (req, res) => {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            await updateInternStatuses(conn);
            await conn.commit();
            
            res.json({
                status: 'success',
                message: 'Status peserta magang berhasil diperbarui'
            });
        } catch (error) {
            await conn.rollback();
            console.error('Error updating statuses:', error);
            res.status(500).json({ message: 'Terjadi kesalahan server' });
        } finally {
            conn.release();
        }
    },

    update : async (req, res) => {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            const updated_by = req.user?.id_users; 
            const { id } = req.params;
            const {
                nama,
                jenis_peserta,
                nama_institusi,
                jenis_institusi,
                email,
                no_hp,
                bidang_id,
                tanggal_masuk,
                tanggal_keluar,
                status,
                detail_peserta
            } = req.body;
    
            // Check if intern exists
            const [existingIntern] = await conn.execute(
                'SELECT * FROM peserta_magang WHERE id_magang = ?',
                [id]
            );
    
            if (existingIntern.length === 0) {
                await conn.rollback();
                return res.status(404).json({
                    status: 'error',
                    message: 'Data peserta magang tidak ditemukan'
                });
            }
    
            // Check if bidang exists if bidang_id is provided
            if (bidang_id) {
                const [bidangExists] = await conn.execute(
                    'SELECT id_bidang FROM bidang WHERE id_bidang = ?',
                    [bidang_id]
                );
    
                if (bidangExists.length === 0) {
                    await conn.rollback();
                    return res.status(400).json({
                        status: 'error',
                        message: 'Bidang yang dipilih tidak valid'
                    });
                }
            }
    
            // Update peserta_magang
            const updateFields = [];
            const updateValues = [];
    
            if (nama) {
                updateFields.push('nama = ?');
                updateValues.push(nama);
            }
            if (jenis_peserta) {
                updateFields.push('jenis_peserta = ?');
                updateValues.push(jenis_peserta);
            }
            if (nama_institusi) {
                updateFields.push('nama_institusi = ?');
                updateValues.push(nama_institusi);
            }
            if (jenis_institusi) {
                updateFields.push('jenis_institusi = ?');
                updateValues.push(jenis_institusi);
            }
            if (email !== undefined) {
                updateFields.push('email = ?');
                updateValues.push(email || null);
            }
            if (no_hp !== undefined) {
                updateFields.push('no_hp = ?');
                updateValues.push(no_hp || null);
            }
            if (bidang_id) {
                updateFields.push('id_bidang = ?');
                updateValues.push(bidang_id);
            }
            if (tanggal_masuk) {
                updateFields.push('tanggal_masuk = ?');
                updateValues.push(tanggal_masuk);
            }
            if (tanggal_keluar) {
                updateFields.push('tanggal_keluar = ?');
                updateValues.push(tanggal_keluar);
            }
            if (status) {
                updateFields.push('status = ?');
                updateValues.push(status);
            }
    
            // Add updated_by and updated_at
            updateFields.push('updated_by = ?');
            updateValues.push(req.user?.id_users || null);
            updateFields.push('updated_at = CURRENT_TIMESTAMP');
    
            // Add id_magang to values array
            updateValues.push(id);
    
            if (updateFields.length > 0) {
                const updateQuery = `
                    UPDATE peserta_magang 
                    SET ${updateFields.join(', ')}
                    WHERE id_magang = ?
                `;
    
                const [updateResult] = await conn.execute(updateQuery, updateValues);
                
                if (updateResult.affectedRows === 0) {
                    throw new Error('Gagal mengupdate data peserta magang');
                }
            }
    
            // Handle detail_peserta update
            if (detail_peserta && jenis_peserta) {
                if (jenis_peserta === 'mahasiswa') {
                    const { nim, fakultas, jurusan, semester } = detail_peserta;
                    
                    // Check if mahasiswa data exists
                    const [existingMahasiswa] = await conn.execute(
                        'SELECT * FROM data_mahasiswa WHERE id_magang = ?',
                        [id]
                    );
    
                    if (existingMahasiswa.length > 0) {
                        const [updateMahasiswa] = await conn.execute(`
                            UPDATE data_mahasiswa 
                            SET 
                                nim = COALESCE(?, nim),
                                fakultas = COALESCE(?, fakultas),
                                jurusan = COALESCE(?, jurusan),
                                semester = COALESCE(?, semester)
                            WHERE id_magang = ?
                        `, [nim, fakultas, jurusan, semester, id]);
    
                        if (updateMahasiswa.affectedRows === 0) {
                            throw new Error('Gagal mengupdate data mahasiswa');
                        }
                    }
                } else if (jenis_peserta === 'siswa') {
                    const { nisn, jurusan, kelas } = detail_peserta;
                    
                    // Check if siswa data exists
                    const [existingSiswa] = await conn.execute(
                        'SELECT * FROM data_siswa WHERE id_magang = ?',
                        [id]
                    );
    
                    if (existingSiswa.length > 0) {
                        const [updateSiswa] = await conn.execute(`
                            UPDATE data_siswa 
                            SET 
                                nisn = COALESCE(?, nisn),
                                jurusan = COALESCE(?, jurusan),
                                kelas = COALESCE(?, kelas)
                            WHERE id_magang = ?
                        `, [nisn, jurusan, kelas, id]);
    
                        if (updateSiswa.affectedRows === 0) {
                            throw new Error('Gagal mengupdate data siswa');
                        }
                    }
                }
            }
    
            await conn.commit();
            res.json({
                status: 'success',
                message: 'Data peserta magang berhasil diperbarui'
            });
    
        } catch (error) {
            await conn.rollback();
            console.error('Error updating intern:', error);
            res.status(500).json({ 
                status: 'error',
                message: error.message || 'Terjadi kesalahan server'
            });
        } finally {
            conn.release();
        }},
     // Modify getStats to use new status logic
     getStats: async (req, res) => {
        const conn = await pool.getConnection();
        try {
            // Update statuses first
            await updateInternStatuses(conn);

            const [activeCount] = await conn.execute(`
                SELECT COUNT(*) as count 
                FROM peserta_magang 
                WHERE status = 'aktif'
            `);
            
            const [completedCount] = await conn.execute(`
                SELECT COUNT(*) as count 
                FROM peserta_magang 
                WHERE status = 'selesai'
            `);
            
            const [notYetCount] = await conn.execute(`
                SELECT COUNT(*) as count 
                FROM peserta_magang 
                WHERE status = 'not_yet'
            `);
            
            const [almostCount] = await conn.execute(`
                SELECT COUNT(*) as count 
                FROM peserta_magang 
                WHERE status = 'almost'
            `);

            res.json({
                activeInterns: activeCount[0].count,
                completedInterns: completedCount[0].count,
                notYetInterns: notYetCount[0].count,
                almostCompleteInterns: almostCount[0].count,
                totalInterns: activeCount[0].count + completedCount[0].count + notYetCount[0].count + almostCount[0].count
            });
        } catch (error) {
            console.error('Error getting stats:', error);
            res.status(500).json({ message: 'Terjadi kesalahan server' });
        } finally {
            conn.release();
        }
    },
     // Modify getCompletingSoon to use 'almost' status
     getCompletingSoon: async (req, res) => {
        const conn = await pool.getConnection();
        try {
            // Update statuses first
            await updateInternStatuses(conn);

            const [interns] = await conn.execute(`
                SELECT 
                    p.*,
                    b.nama_bidang,
                    CASE 
                        WHEN p.jenis_peserta = 'mahasiswa' THEN m.nim
                        ELSE s.nisn
                    END as nomor_induk,
                    CASE 
                        WHEN p.jenis_peserta = 'mahasiswa' THEN m.fakultas
                        ELSE s.kelas
                    END as detail_pendidikan
                FROM peserta_magang p
                LEFT JOIN bidang b ON p.id_bidang = b.id_bidang
                LEFT JOIN data_mahasiswa m ON p.id_magang = m.id_magang
                LEFT JOIN data_siswa s ON p.id_magang = s.id_magang
                WHERE p.status = 'almost'
                ORDER BY p.tanggal_keluar ASC
            `);

            res.json(interns);
        } catch (error) {
            console.error('Error getting completing soon interns:', error);
            res.status(500).json({ message: 'Terjadi kesalahan server' });
        } finally {
            conn.release();
        }
    }
};

module.exports = internController;