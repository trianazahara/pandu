// backend/controllers/internController.js
const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const notificationController = require('./notificationController');

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

const createInternNotification = async (conn, {userId, internName, action = 'menambah'}) => {
    try {
        // 1. Ambil data user yang melakukan aksi
        const [userData] = await conn.execute(
            'SELECT username FROM users WHERE id_users = ?',
            [userId]
        );
        const username = userData[0]?.username || 'Unknown User';
        
        // 2. Ambil semua user yang terdaftar
        const [allUsers] = await conn.execute('SELECT id_users FROM users');
        
        // 3. Siapkan query untuk insert
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
        
        // 4. Insert notifikasi untuk setiap user
        for (const user of allUsers) {
            const values = [
                uuidv4(),
                user.id_users,
                'Aktivitas Peserta Magang',
                `${username} telah ${action} data peserta magang: ${internName}`,
                0
            ];
            
            await conn.execute(query, values);
        }
        
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};
// Fungsi untuk mengupdate status peserta magang
const updateInternStatuses = async (conn) => {
    const query = `
        UPDATE peserta_magang 
        SET status = CASE
            WHEN status = 'missing' THEN 'missing'
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

    // Tambahkan di internController.js
setMissingStatus: async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        
        const { id } = req.params;
        
        // Update status menjadi missing
        const [updateResult] = await conn.execute(
            `UPDATE peserta_magang 
             SET status = 'missing',
                 updated_by = ?,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id_magang = ?`,
            [req.user.userId, id]
        );

        if (updateResult.affectedRows === 0) {
            throw new Error('Gagal mengupdate status peserta magang');
        }

        // Buat notifikasi
        await createInternNotification(conn, {
            userId: req.user.userId,
            internName: (await conn.execute('SELECT nama FROM peserta_magang WHERE id_magang = ?', [id]))[0][0].nama,
            action: 'menandai sebagai missing'
        });

        await conn.commit();
        
        res.json({
            status: 'success',
            message: 'Status peserta magang berhasil diubah menjadi missing'
        });

    } catch (error) {
        await conn.rollback();
        console.error('Error setting missing status:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Terjadi kesalahan server'
        });
    } finally {
        conn.release();
    }
},

    getDetailedStats: async (req, res) => {
        const conn = await pool.getConnection();
        try {
            // Update status terlebih dahulu
            await updateInternStatuses(conn);
    
            // 1. Dapatkan statistik dasar - Perbaikan untuk menghitung aktif + almost
            const [basicStats] = await conn.execute(`
                SELECT
                    COUNT(CASE WHEN status IN ('aktif', 'almost') THEN 1 END) as active_count,
                    COUNT(CASE WHEN status = 'selesai' THEN 1 END) as completed_count,
                    COUNT(CASE WHEN status = 'almost' THEN 1 END) as completing_soon_count,
                    COUNT(CASE WHEN status = 'missing' THEN 1 END) as missing_count,
                    COUNT(*) as total_count
                FROM peserta_magang
            `);
    
            // 2. Dapatkan statistik berdasarkan jenis peserta untuk yang aktif + almost
            const [educationStats] = await conn.execute(`
                SELECT
                    jenis_peserta,
                    COUNT(*) as count
                FROM peserta_magang
                WHERE status IN ('aktif', 'almost')
                GROUP BY jenis_peserta
            `);
    
            // 3. Dapatkan statistik berdasarkan bidang untuk yang aktif + almost
            const [departmentStats] = await conn.execute(`
                SELECT
                    b.nama_bidang,
                    COUNT(*) as count
                FROM peserta_magang p
                JOIN bidang b ON p.id_bidang = b.id_bidang
                WHERE p.status IN ('aktif', 'almost')
                GROUP BY b.id_bidang, b.nama_bidang
            `);
    
            // 4. Dapatkan data peserta yang akan selesai dalam 7 hari (status almost)
            const [completingSoon] = await conn.execute(`
                SELECT 
                    p.nama,
                    p.nama_institusi,
                    b.nama_bidang,
                    p.tanggal_keluar,
                    p.id_magang
                FROM peserta_magang p
                LEFT JOIN bidang b ON p.id_bidang = b.id_bidang
                WHERE p.status = 'almost'
                ORDER BY p.tanggal_keluar ASC
            `);
    
            // Format response
            const response = {
                activeInterns: {
                    total: basicStats[0].active_count, // Sekarang termasuk aktif + almost
                    students: {
                        siswa: educationStats.find(stat => stat.jenis_peserta === 'siswa')?.count || 0,
                        mahasiswa: educationStats.find(stat => stat.jenis_peserta === 'mahasiswa')?.count || 0
                    },
                    byDepartment: departmentStats.reduce((acc, curr) => {
                        acc[curr.nama_bidang.toLowerCase()] = curr.count;
                        return acc;
                    }, {})
                },
                completedInterns: basicStats[0].completed_count,
                totalInterns: basicStats[0].total_count,
                completingSoon: {
                    count: basicStats[0].completing_soon_count,
                    interns: completingSoon
                }
            };
    
            res.json(response);
    
        } catch (error) {
            console.error('Error getting detailed stats:', error);
            res.status(500).json({ 
                status: 'error',
                message: 'Terjadi kesalahan server saat mengambil statistik detail'
            });
        } finally {
            conn.release();
        }
    },
    // Modifikasi fungsi getAll di internController.js
getAll: async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            status,
            bidang,
            search,
            excludeStatus
        } = req.query;

        const offset = (page - 1) * limit;
        let query = `
            SELECT 
                p.id_magang,
                p.nama,
                p.jenis_peserta,
                p.nama_institusi,
                p.jenis_institusi,
                p.email,
                p.no_hp,
                p.tanggal_masuk,
                p.tanggal_keluar,
                p.status,
                p.nama_pembimbing,
                p.telp_pembimbing,
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

        // Handle excludeStatus (untuk menyembunyikan status missing dan selesai)
        if (excludeStatus) {
            const statusesToExclude = excludeStatus.split(',');
            query += ` AND p.status NOT IN (${statusesToExclude.map(() => '?').join(',')})`;
            params.push(...statusesToExclude);
        }

        // Handle filter status
        if (status) {
            query += ` AND p.status = ?`;
            params.push(status);
        }

        // Handle filter bidang
        if (bidang) {
            query += ` AND p.id_bidang = ?`;
            params.push(bidang);
        }

        // Handle search
        if (search) {
            query += ` AND (p.nama LIKE ? OR p.email LIKE ? OR 
                CASE 
                    WHEN p.jenis_peserta = 'mahasiswa' THEN m.nim
                    ELSE s.nisn
                END LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        // Get total count first
        const countQuery = `SELECT COUNT(*) as total FROM (${query}) as count_query`;
        const [countResult] = await pool.execute(countQuery, params);
        const total = countResult[0].total;

        // Add order and pagination to main query
        query += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
        params.push(Number(limit), Number(offset));

        // Execute main query
        const [rows] = await pool.execute(query, params);

        // Send response
        res.json({
            status: 'success',
            data: rows,
            pagination: {
                total,
                totalPages: Math.ceil(total / limit),
                page: Number(page),
                limit: Number(limit)
            }
        });

    } catch (error) {
        console.error('Error getting interns:', error);
        res.status(500).json({ 
            status: 'error',
            message: 'Terjadi kesalahan server' 
        });
    }
},

    checkAvailability: async (req, res) => {
        try {
            res.setHeader('Content-Type', 'application/json');
            const inputDate = req.query.date;
            if (!inputDate) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Parameter tanggal diperlukan' 
                });
            }
    
            const formattedDate = inputDate;
            const SLOT_LIMIT = 50;
    
            // Query untuk peserta yang benar-benar aktif (tidak termasuk yang almost)
            const [activeInterns] = await pool.execute(`
                SELECT COUNT(*) as count
                FROM peserta_magang
                WHERE status = 'aktif'
                AND ? BETWEEN tanggal_masuk AND tanggal_keluar
            `, [formattedDate]);
    
            // Query untuk peserta yang akan datang
            const [upcomingInterns] = await pool.execute(`
                SELECT COUNT(*) as count
                FROM peserta_magang
                WHERE status = 'not_yet'
                AND tanggal_masuk <= ?
            `, [formattedDate]);
    
            // Query untuk peserta yang akan selesai dalam 7 hari
            const [leavingInterns] = await pool.execute(`
                SELECT 
                    p.id_magang,
                    p.nama,
                    DATE_FORMAT(p.tanggal_keluar, '%Y-%m-%d') as tanggal_keluar,
                    b.nama_bidang
                FROM peserta_magang p
                LEFT JOIN bidang b ON p.id_bidang = b.id_bidang
                WHERE p.status = 'almost'
                AND p.tanggal_keluar BETWEEN ? AND DATE_ADD(?, INTERVAL 7 DAY)
                ORDER BY p.tanggal_keluar ASC
            `, [formattedDate, formattedDate]);
    
            // Hitung total yang aktif (tidak termasuk yang almost)
            const totalOccupied = parseInt(activeInterns[0].count) + parseInt(upcomingInterns[0].count);
            const availableSlots = SLOT_LIMIT - totalOccupied;
    
            // Tambahkan slot yang akan tersedia dari peserta yang hampir selesai
            const soonAvailableSlots = leavingInterns.length;
            const totalAvailableSlots = availableSlots - soonAvailableSlots;
    
            // Tentukan apakah ada slot tersedia
            const isAvailable = totalAvailableSlots > 0;
    
            // Siapkan pesan yang lebih informatif
            let message = '';
            if (isAvailable) {
                if (availableSlots > 0) {
                    if (soonAvailableSlots > 0) {
                        message = `Tersedia ${availableSlots} slot langsung dengan ${soonAvailableSlots} slot tambahan dari peserta yang akan selesai dalam 7 hari ke depan (total ${totalAvailableSlots} dari ${SLOT_LIMIT} slot)`;
                    } else {
                        message = `Tersedia ${availableSlots} slot dari total ${SLOT_LIMIT} slot`;
                    }
                } else {
                    message = `Akan tersedia ${soonAvailableSlots} slot dari peserta yang akan selesai dalam 7 hari ke depan`;
                }
            } else {
                message = 'Saat ini semua slot telah terisi dan tidak ada peserta yang akan selesai dalam waktu dekat';
            }
    
            // Kirim response
            return res.status(200).json({
                success: true,
                available: isAvailable,
                availableSlots: Math.max(availableSlots, 0),
                soonAvailableSlots,
                totalAvailableSlots: Math.max(totalAvailableSlots, 0),
                totalOccupied,
                leavingInterns,
                leavingCount: leavingInterns.length,
                message,
                date: formattedDate
            });
    
        } catch (error) {
            console.error('Error pada pengecekan ketersediaan:', error);
            return res.status(500).json({ 
                success: false,
                message: 'Terjadi kesalahan saat mengecek ketersediaan',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    },
    
    // Fungsi untuk validasi format tanggal
    isValidDate : (dateString) => {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    },

    add : async (req, res) => {
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
            const created_by = req.user.userId;
    
            // 2. Destructure data dari request body
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
                detail_peserta,
                nama_pembimbing,    // tambahan
                telp_pembimbing 
            } = req.body;
    
            // 3. Validasi field yang required
            if (!nama || !jenis_peserta || !nama_institusi || !jenis_institusi || 
                !bidang_id || !tanggal_masuk || !tanggal_keluar || !detail_peserta ||
                !nama_pembimbing || !telp_pembimbing) {  // tambahan validasi
                return res.status(400).json({
                    status: 'error',
                    message: 'Semua field wajib diisi'
                });
            }
    
            // 4. Validasi keberadaan bidang
            const [bidangExists] = await conn.execute(
                'SELECT id_bidang FROM bidang WHERE id_bidang = ?',
                [bidang_id]
            );
    
            if (bidangExists.length === 0) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Bidang yang dipilih tidak valid'
                });
            }
    
            // 5. Tentukan status berdasarkan tanggal
            const status = determineStatus(tanggal_masuk, tanggal_keluar);
    
            // 6. Generate ID dan insert ke tabel peserta_magang
            const id_magang = uuidv4();
            const pesertaMagangQuery = `
                INSERT INTO peserta_magang (
                    id_magang, nama, jenis_peserta, nama_institusi,
                    jenis_institusi, email, no_hp, id_bidang,
                    tanggal_masuk, tanggal_keluar, status, 
                    nama_pembimbing, telp_pembimbing,           
                    created_by, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `;
    
            const pesertaMagangValues = [
                id_magang, nama, jenis_peserta, nama_institusi,
                jenis_institusi, email || null, no_hp || null, bidang_id,
                tanggal_masuk, tanggal_keluar, status,
                nama_pembimbing, telp_pembimbing,              
                created_by
            ];
    
            await conn.execute(pesertaMagangQuery, pesertaMagangValues);
    
            // 7. Insert data tambahan berdasarkan jenis peserta
            if (jenis_peserta === 'mahasiswa') {
                const { nim, fakultas, jurusan, semester } = detail_peserta;
                if (!nim || !jurusan) {
                    throw new Error('NIM dan jurusan wajib diisi untuk mahasiswa');
                }
    
                await conn.execute(`
                    INSERT INTO data_mahasiswa (
                        id_mahasiswa, id_magang, nim, fakultas, jurusan, semester, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                `, [uuidv4(), id_magang, nim, fakultas || null, jurusan, semester || null]);
    
            } else if (jenis_peserta === 'siswa') {
                const { nisn, jurusan, kelas } = detail_peserta;
                if (!nisn || !jurusan) {
                    throw new Error('NISN dan jurusan wajib diisi untuk siswa');
                }
    
                await conn.execute(`
                    INSERT INTO data_siswa (
                        id_siswa, id_magang, nisn, jurusan, kelas, created_at
                    ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                `, [uuidv4(), id_magang, nisn, jurusan, kelas || null]);
            }
    
            // 8. Buat notifikasi
            await createInternNotification(conn, {
                userId: req.user.userId,
                internName: nama,
                action: 'menambah'
            });
    
            // 9. Commit transaction
            await conn.commit();
    
            // 10. Kirim response sukses
            res.status(201).json({
                status: 'success',
                message: 'Data peserta magang berhasil ditambahkan',
                data: {
                    id_magang,
                    nama,
                    jenis_peserta,
                    nama_institusi,
                    status,
                    created_by,
                    created_at: new Date().toISOString()
                }
            });
    
        } catch (error) {
            await conn.rollback();
            console.error('Error adding intern:', error);
    
            if (error.message.includes('wajib diisi')) {
                res.status(400).json({
                    status: 'error',
                    message: error.message
                });
            } else if (error.code === 'ER_DUP_ENTRY') {
                res.status(400).json({
                    status: 'error',
                    message: 'Data sudah ada dalam sistem'
                });
            } else {
                res.status(500).json({
                    status: 'error',
                    message: 'Terjadi kesalahan server',
                    error: process.env.NODE_ENV === 'development' ? error.message : undefined
                });
            }
        } finally {
            if (conn) conn.release();
        }
    },

    getDetail : async (req, res) => {
        try {
            const { id } = req.params;
    
            const [rows] = await pool.execute(`
                SELECT 
                    p.*,
                    b.nama_bidang,
                    p.nama_pembimbing,    /* menggunakan comment style SQL yang benar */
                    p.telp_pembimbing,    /* menggunakan comment style SQL yang benar */
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
    update: async (req, res) => {
        let conn = null;
        try {
            conn = await pool.getConnection();
            
            // Validasi user authentication
            if (!req.user || !req.user.userId) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Unauthorized: User authentication required'
                });
            }
    
            // Set timeout untuk menghindari deadlock
            await conn.execute('SET SESSION innodb_lock_wait_timeout = 50');
            await conn.beginTransaction();
            
            const updated_by = req.user.userId;
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
                detail_peserta,
                nama_pembimbing,
                telp_pembimbing
            } = req.body;
    
            // Validasi ID
            if (!id) {
                throw new Error('ID peserta magang diperlukan');
            }
    
            // Check data peserta dengan lock dan ambil data detail
            const [existingIntern] = await conn.execute(
                `SELECT pm.*, 
                        dm.nim, dm.fakultas, dm.jurusan as mhs_jurusan, dm.semester,
                        ds.nisn, ds.jurusan as siswa_jurusan, ds.kelas 
                 FROM peserta_magang pm 
                 LEFT JOIN data_mahasiswa dm ON pm.id_magang = dm.id_magang 
                 LEFT JOIN data_siswa ds ON pm.id_magang = ds.id_magang 
                 WHERE pm.id_magang = ? FOR UPDATE`,
                [id]
            );
    
            if (existingIntern.length === 0) {
                await conn.rollback();
                return res.status(404).json({
                    status: 'error',
                    message: 'Data peserta magang tidak ditemukan'
                });
            }
    
            // Validasi bidang
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
    
            // Prepare update fields
            const updates = [];
            const values = [];
    
            const updateFields = {
                nama,
                jenis_peserta,
                nama_institusi,
                jenis_institusi,
                email,
                no_hp,
                id_bidang: bidang_id,
                tanggal_masuk,
                tanggal_keluar,
                status,
                nama_pembimbing,
                telp_pembimbing
            };
    
            // Build dynamic update query
            Object.entries(updateFields).forEach(([key, value]) => {
                if (value !== undefined) {
                    updates.push(`${key} = ?`);
                    values.push(value === '' ? null : value);
                }
            });
    
            updates.push('updated_by = ?', 'updated_at = CURRENT_TIMESTAMP');
            values.push(updated_by);
            values.push(id); // For WHERE clause
    
            // Update peserta_magang table
            if (updates.length > 0) {
                const updateQuery = `
                    UPDATE peserta_magang 
                    SET ${updates.join(', ')}
                    WHERE id_magang = ?
                `;
    
                const [updateResult] = await conn.execute(updateQuery, values);
                
                if (updateResult.affectedRows === 0) {
                    throw new Error('Gagal mengupdate data peserta magang');
                }
            }
    
            // Handle detail peserta update
            if (jenis_peserta || detail_peserta) {
                const currentJenisPeserta = jenis_peserta || existingIntern[0].jenis_peserta;
    
                // Hapus data lama di kedua tabel untuk menghindari konflik
                await conn.execute('DELETE FROM data_mahasiswa WHERE id_magang = ?', [id]);
                await conn.execute('DELETE FROM data_siswa WHERE id_magang = ?', [id]);
    
                if (currentJenisPeserta === 'mahasiswa') {
                    const { nim, fakultas, jurusan, semester } = detail_peserta || {};
                    
                    // Gunakan data lama jika data baru tidak ada
                    const finalNim = nim || existingIntern[0].nim;
                    const finalJurusan = jurusan || existingIntern[0].mhs_jurusan;
                    const finalFakultas = fakultas || existingIntern[0].fakultas;
                    const finalSemester = semester || existingIntern[0].semester;
    
                    // Validasi data mahasiswa
                    if (!finalNim || !finalJurusan) {
                        throw new Error('NIM dan jurusan wajib diisi untuk mahasiswa');
                    }
    
                    // Insert data mahasiswa
                    const [mahasiswaResult] = await conn.execute(`
                        INSERT INTO data_mahasiswa 
                        (id_magang, nim, fakultas, jurusan, semester, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    `, [id, finalNim, finalFakultas, finalJurusan, finalSemester]);
    
                    if (mahasiswaResult.affectedRows === 0) {
                        throw new Error('Gagal mengupdate data mahasiswa');
                    }
    
                } else if (currentJenisPeserta === 'siswa') {
                    const { nisn, jurusan, kelas } = detail_peserta || {};
                    
                    // Gunakan data lama jika data baru tidak ada
                    const finalNisn = nisn || existingIntern[0].nisn;
                    const finalJurusan = jurusan || existingIntern[0].siswa_jurusan;
                    const finalKelas = kelas || existingIntern[0].kelas;
    
                    // Validasi data siswa
                    if (!finalNisn || !finalJurusan) {
                        throw new Error('NISN dan jurusan wajib diisi untuk siswa');
                    }
    
                    // Insert data siswa
                    const [siswaResult] = await conn.execute(`
                        INSERT INTO data_siswa 
                        (id_magang, nisn, jurusan, kelas, created_at, updated_at)
                        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    `, [id, finalNisn, finalJurusan, finalKelas]);
    
                    if (siswaResult.affectedRows === 0) {
                        throw new Error('Gagal mengupdate data siswa');
                    }
                }
            }
    
            // Create notification
            await createInternNotification(conn, {
                userId: req.user.userId,
                internName: nama || existingIntern[0].nama,
                action: 'mengupdate'
            });
    
            // Commit transaction
            await conn.commit();
    
            // Get updated data for response
            const [updatedData] = await conn.execute(
                `SELECT pm.*, 
                        dm.nim, dm.fakultas, dm.jurusan as mhs_jurusan, dm.semester,
                        ds.nisn, ds.jurusan as siswa_jurusan, ds.kelas 
                 FROM peserta_magang pm 
                 LEFT JOIN data_mahasiswa dm ON pm.id_magang = dm.id_magang 
                 LEFT JOIN data_siswa ds ON pm.id_magang = ds.id_magang 
                 WHERE pm.id_magang = ?`,
                [id]
            );
    
            res.json({
                status: 'success',
                message: 'Data peserta magang berhasil diperbarui',
                data: updatedData[0]
            });
    
        } catch (error) {
            console.error('Error updating intern:', error);
            
            if (conn) {
                await conn.rollback();
            }
    
            if (error.message.includes('wajib diisi')) {
                res.status(400).json({
                    status: 'error',
                    message: error.message
                });
            } else if (error.code === 'ER_DUP_ENTRY') {
                res.status(400).json({
                    status: 'error',
                    message: 'Data sudah ada dalam sistem'
                });
            } else {
                res.status(500).json({
                    status: 'error',
                    message: 'Terjadi kesalahan server',
                    error: process.env.NODE_ENV === 'development' ? error.message : undefined
                });
            }
        } finally {
            if (conn) {
                conn.release();
            }
        }
    },
        delete: async (req, res) => {
            const conn = await pool.getConnection();
            try {
                await conn.beginTransaction();
                
                const { id } = req.params;
                
                // Cek apakah data magang ada
                const [existingIntern] = await conn.execute(
                    'SELECT jenis_peserta FROM peserta_magang WHERE id_magang = ?',
                    [id]
                );
        
                if (existingIntern.length === 0) {
                    await conn.rollback();
                    return res.status(404).json({
                        status: 'error',
                        message: 'Data peserta magang tidak ditemukan'
                    });
                }
        
                // Hapus data terkait berdasarkan jenis_peserta
                if (existingIntern[0].jenis_peserta === 'mahasiswa') {
                    await conn.execute(
                        'DELETE FROM data_mahasiswa WHERE id_magang = ?',
                        [id]
                    );
                } else if (existingIntern[0].jenis_peserta === 'siswa') {
                    await conn.execute(
                        'DELETE FROM data_siswa WHERE id_magang = ?',
                        [id]
                    );
                }
        
                // Hapus data utama dari tabel peserta_magang
                const [deleteResult] = await conn.execute(
                    'DELETE FROM peserta_magang WHERE id_magang = ?',
                    [id]
                );
        
                if (deleteResult.affectedRows === 0) {
                    throw new Error('Gagal menghapus data peserta magang');
                }
        
                await conn.commit();
                res.json({
                    status: 'success',
                    message: 'Data peserta magang berhasil dihapus'
                });
        
            } catch (error) {
                await conn.rollback();
                console.error('Error deleting intern:', error);
                res.status(500).json({
                    status: 'error',
                    message: error.message || 'Terjadi kesalahan server'
                });
            } finally {
                conn.release();
            }
        },
     // Modify getStats to use new status logic
    //  getStats: async (req, res) => {
    //     const conn = await pool.getConnection();
    //     try {
    //         // Update statuses first to ensure we have current data
    //         await updateInternStatuses(conn);
    
    //         // Get active interns count 
    //         const [activeCount] = await conn.execute(`
    //             SELECT COUNT(*) as count 
    //             FROM peserta_magang 
    //             WHERE status = 'aktif'
    //         `);
    
    //         // Get completed interns count
    //         const [completedCount] = await conn.execute(`
    //             SELECT COUNT(*) as count 
    //             FROM peserta_magang 
    //             WHERE status = 'selesai'
    //         `);
    
    //         // Get interns completing soon (status = 'almost')
    //         const [completingSoon] = await conn.execute(`
    //             SELECT COUNT(*) as count 
    //             FROM peserta_magang 
    //             WHERE status = 'almost'
    //         `);
    
    //         // Get total interns count
    //         const [totalCount] = await conn.execute(`
    //             SELECT COUNT(*) as count 
    //             FROM peserta_magang
    //         `);
    
    //         // Prepare response object
    //         const response = {
    //             activeInterns: activeCount[0].count,
    //             completedInterns: completedCount[0].count,
    //             totalInterns: totalCount[0].count,
    //             completingSoon: completingSoon[0].count
    //         };
    
    //         res.json(response);
    
    //     } catch (error) {
    //         console.error('Error getting stats:', error);
    //         res.status(500).json({ 
    //             status: 'error',
    //             message: 'Terjadi kesalahan server saat mengambil statistik'
    //         });
    //     } finally {
    //         conn.release();
    //     }
    // },

    

     // Modify getCompletingSoon to use 'almost' status
     getCompletingSoon: async (req, res) => {
        const conn = await pool.getConnection();
        try {
            // Update statuses first
            await updateInternStatuses(conn);
    
            // Modifikasi query untuk mencakup data yang akan selesai dalam 7 hari
            const [interns] = await conn.execute(`
                SELECT 
                    p.*,
                    b.nama_bidang
                FROM peserta_magang p
                LEFT JOIN bidang b ON p.id_bidang = b.id_bidang
                WHERE p.tanggal_keluar BETWEEN CURRENT_DATE AND DATE_ADD(CURRENT_DATE, INTERVAL 7 DAY)
                ORDER BY p.tanggal_keluar ASC
            `);
    
            if (interns.length === 0) {
                return res.json([]); // Kembalikan array kosong alih-alih error
            }
    
            res.json(interns);
        } catch (error) {
            console.error('Error getting completing soon interns:', error);
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
    },
    
        
};

module.exports = internController;