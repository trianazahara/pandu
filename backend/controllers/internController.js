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
        // 1. Ambil data user yang melakukan aksi (ubah dari username ke nama)
        const [userData] = await conn.execute(
            'SELECT nama FROM users WHERE id_users = ?',  // Ubah username menjadi nama
            [userId]
        );
        const nama = userData[0]?.nama || 'Unknown User';  // Gunakan nama alih-alih username
       
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
                `${nama} telah ${action} data peserta magang: ${internName}`,  // Gunakan nama di sini
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

getMentors: async (req, res) => {
    try {
      let query;
      const params = [];
  
      if (req.user.role === 'superadmin') {
        // Superadmin bisa lihat semua mentor
        query = `SELECT id_users, nama FROM users WHERE role = 'admin' AND is_active = 1`;
      } else {
        // Admin hanya bisa lihat dirinya sendiri
        query = `SELECT id_users, nama FROM users WHERE id_users = ? AND is_active = 1`;
        params.push(req.user.userId);
      }
  
      const [mentors] = await pool.execute(query, params);
      res.json(mentors);
    } catch (error) {
      console.error('Error getting mentors:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },


getDetailedStats: async (req, res) => {
    const conn = await pool.getConnection();
    try {
        // Update status terlebih dahulu
        await updateInternStatuses(conn);

        // Base query parts
        let baseWhere = 'WHERE 1=1';
        const params = [];

        // Add mentor filter for admin role
        if (req.user.role === 'admin') {
            baseWhere += ' AND p.mentor_id = ?';
            params.push(req.user.userId);
        }

        // 1. Get basic stats with role-based filtering
        const [basicStats] = await conn.execute(`
            SELECT
                COUNT(CASE WHEN status IN ('aktif', 'almost') THEN 1 END) as active_count,
                COUNT(CASE WHEN status = 'selesai' THEN 1 END) as completed_count,
                COUNT(CASE WHEN status = 'almost' THEN 1 END) as completing_soon_count,
                COUNT(CASE WHEN status = 'missing' THEN 1 END) as missing_count,
                COUNT(*) as total_count
            FROM peserta_magang p
            ${baseWhere}
        `, params);

        // 2. Get education stats with role-based filtering
        const [educationStats] = await conn.execute(`
            SELECT
                jenis_peserta,
                COUNT(*) as count
            FROM peserta_magang p
            ${baseWhere}
            AND status IN ('aktif', 'almost')
            GROUP BY jenis_peserta
        `, params);

        // 3. Get department stats with role-based filtering
        const [departmentStats] = await conn.execute(`
            SELECT
                b.nama_bidang,
                COUNT(*) as count
            FROM peserta_magang p
            JOIN bidang b ON p.id_bidang = b.id_bidang
            ${baseWhere}
            AND p.status IN ('aktif', 'almost')
            GROUP BY b.id_bidang, b.nama_bidang
        `, params);

        // 4. Get completing soon data with role-based filtering
        const [completingSoon] = await conn.execute(`
            SELECT
                p.nama,
                p.nama_institusi,
                b.nama_bidang,
                p.tanggal_keluar,
                p.id_magang
            FROM peserta_magang p
            LEFT JOIN bidang b ON p.id_bidang = b.id_bidang
            ${baseWhere}
            AND p.status = 'almost'
            ORDER BY p.tanggal_keluar ASC
        `, params);

        // Format response
        const response = {
            activeInterns: {
                total: basicStats[0].active_count,
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
            p.*,
            b.nama_bidang,
            CASE 
              WHEN p.email IS NULL 
              OR p.no_hp IS NULL
              OR p.nama_pembimbing IS NULL
              OR p.telp_pembimbing IS NULL
              OR (
                CASE 
                  WHEN p.jenis_peserta = 'mahasiswa' THEN 
                    EXISTS(
                      SELECT 1 FROM data_mahasiswa m 
                      WHERE m.id_magang = p.id_magang 
                      AND (m.fakultas IS NULL OR m.semester IS NULL)
                    )
                  ELSE 
                    EXISTS(
                      SELECT 1 FROM data_siswa s 
                      WHERE s.id_magang = p.id_magang 
                      AND s.kelas IS NULL
                    )
                END
              )
              THEN true 
              ELSE false 
            END as has_incomplete_data
          FROM peserta_magang p
          LEFT JOIN bidang b ON p.id_bidang = b.id_bidang
          WHERE 1=1
        `;
    
        const params = [];
    
        // Add mentor filter for admin role
        if (req.user.role === 'admin') {
          query += ` AND p.mentor_id = ?`;
          params.push(req.user.userId);
        }


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
            query += ` AND (p.nama LIKE ? OR p.nama_institusi LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
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

getMentors: async (req, res) => {
    try {
      let query;
      const params = [];
  
      if (req.user.role === 'superadmin') {
        // Superadmin bisa lihat semua mentor
        query = `SELECT id_users, nama FROM users WHERE role = 'admin' AND is_active = 1`;
      } else {
        // Admin hanya bisa lihat dirinya sendiri
        query = `SELECT id_users, nama FROM users WHERE id_users = ? AND is_active = 1`;
        params.push(req.user.userId);
      }
  
      const [mentors] = await pool.execute(query, params);
      res.json(mentors);
    } catch (error) {
      console.error('Error getting mentors:', error);
      res.status(500).json({ message: 'Internal server error' });
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

        // Hitung total yang aktif dan yang akan datang
        const totalActive = parseInt(activeInterns[0].count);
        const totalUpcoming = parseInt(upcomingInterns[0].count);
        const totalOccupied = totalActive + totalUpcoming;

        // Siapkan pesan
        let message = '';
        if (totalOccupied >= SLOT_LIMIT) {
            message = `Saat ini terisi: ${totalOccupied} dari ${SLOT_LIMIT} slot`;
        } else {
            const availableSlots = SLOT_LIMIT - totalOccupied;
            message = `Tersedia ${availableSlots} slot dari total ${SLOT_LIMIT} slot`;
        }

        // Kirim response
        return res.status(200).json({
            success: true,
            available: totalOccupied < SLOT_LIMIT,
            totalOccupied,
            currentActive: totalActive,
            upcomingInterns: totalUpcoming,
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




    // Modifikasi pada fungsi add
    add : async (req, res) => {
        const conn = await pool.getConnection();
        try {
            if (!req.user || !req.user.userId) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Unauthorized: User authentication required'
                });
            }
    
    
            await conn.beginTransaction();
            const created_by = req.user.userId;
    
    
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
                nama_pembimbing,
                telp_pembimbing
            } = req.body;
    
    
            // Validasi field yang wajib diisi
            const requiredFields = {
                nama: 'Nama',
                jenis_peserta: 'Jenis peserta',
                nama_institusi: 'Nama institusi',
                jenis_institusi: 'Jenis institusi',
                // bidang_id: 'Ruang penempatan',
                tanggal_masuk: 'Tanggal masuk',
                tanggal_keluar: 'Tanggal keluar'
            };
    
    
            // Validasi detail peserta (NIM/NISN dan jurusan wajib)
            if (!detail_peserta) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Detail peserta wajib diisi'
                });
            }
    
    
            if (jenis_peserta === 'mahasiswa') {
                if (!detail_peserta.nim || !detail_peserta.jurusan) {
                    return res.status(400).json({
                        status: 'error',
                        message: 'NIM dan jurusan wajib diisi untuk mahasiswa'
                    });
                }
            } else if (jenis_peserta === 'siswa') {
                if (!detail_peserta.nisn || !detail_peserta.jurusan) {
                    return res.status(400).json({
                        status: 'error',
                        message: 'NISN dan jurusan wajib diisi untuk siswa'
                    });
                }
            }
    
    
            // Status determination remains the same
            const status = determineStatus(tanggal_masuk, tanggal_keluar);
    
    
            // Generate ID dan insert ke tabel peserta_magang
            const id_magang = uuidv4();
            const pesertaMagangQuery = `
            INSERT INTO peserta_magang (
                id_magang, nama, jenis_peserta, nama_institusi,
                jenis_institusi, email, no_hp, id_bidang,
                tanggal_masuk, tanggal_keluar, status,
                nama_pembimbing, telp_pembimbing, mentor_id,          
                created_by, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `;
    
        const pesertaMagangValues = [
            id_magang, nama, jenis_peserta, nama_institusi,
            jenis_institusi, email || null, no_hp || null, bidang_id || null,  // Tambahkan || null di sini
            tanggal_masuk, tanggal_keluar, status,
            nama_pembimbing || null, telp_pembimbing || null,
            req.body.mentor_id || null,              
            created_by
        ];
    
    
            await conn.execute(pesertaMagangQuery, pesertaMagangValues);
    
    
            // Insert detail peserta
            if (jenis_peserta === 'mahasiswa') {
                const { nim, fakultas, jurusan, semester } = detail_peserta;
                await conn.execute(`
                    INSERT INTO data_mahasiswa (
                        id_mahasiswa, id_magang, nim, fakultas, jurusan, semester, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                `, [uuidv4(), id_magang, nim, fakultas || null, jurusan, semester || null]);
            } else if (jenis_peserta === 'siswa') {
                const { nisn, jurusan, kelas } = detail_peserta;
                await conn.execute(`
                    INSERT INTO data_siswa (
                        id_siswa, id_magang, nisn, jurusan, kelas, created_at
                    ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                `, [uuidv4(), id_magang, nisn, jurusan, kelas || null]);
            }
    
    
            // Create notification and commit
            await createInternNotification(conn, {
                userId: req.user.userId,
                internName: nama,
                action: 'menambah'
            });
    
    
            await conn.commit();
    
    
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
    
    
            if (error.code === 'ER_DUP_ENTRY') {
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
                    p.nama_pembimbing,    
                    p.telp_pembimbing,
                    p.mentor_id,   
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
   
            console.log('Request Body:', req.body);
   
            await conn.beginTransaction();
           
            const { id } = req.params;
            const updated_by = req.user.userId;
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

            // 1. Validasi data yang diperlukan
            if (!id || !nama || !nama_institusi || !tanggal_masuk || !tanggal_keluar) {
                throw new Error('Data wajib tidak lengkap');
            }

            // 2. Cek apakah peserta magang ada
            const [existingIntern] = await conn.execute(
                `SELECT pm.*,
                        dm.nim, dm.fakultas, dm.jurusan as mhs_jurusan, dm.semester,

                        ds.nisn, ds.jurusan as siswa_jurusan, ds.kelas
                 FROM peserta_magang pm
                 LEFT JOIN data_mahasiswa dm ON pm.id_magang = dm.id_magang
                 LEFT JOIN data_siswa ds ON pm.id_magang = ds.id_magang

                 WHERE pm.id_magang = ?`,
                [id]
            );
   
            if (existingIntern.length === 0) {
                throw new Error('Data peserta magang tidak ditemukan');
            }

            // 3. Validasi bidang
            if (bidang_id && bidang_id.trim() !== '') {
                const [bidangExists] = await conn.execute(
                    'SELECT id_bidang FROM bidang WHERE id_bidang = ?',
                    [bidang_id]
                );
            
                if (bidangExists.length === 0) {
                    throw new Error('Bidang yang dipilih tidak valid');
                }
            }
            const newStatus = determineStatus(tanggal_masuk, tanggal_keluar);
            // 4. Update tabel peserta_magang
            const updateQuery = `
                UPDATE peserta_magang

                SET nama = ?,
                    jenis_peserta = ?,
                    nama_institusi = ?,
                    jenis_institusi = ?,
                    email = ?,
                    no_hp = ?,
                    id_bidang = ?,
                    tanggal_masuk = ?,
                    tanggal_keluar = ?,
                    status = ?,
                    nama_pembimbing = ?,
                    telp_pembimbing = ?,
                    mentor_id = ?,
                    updated_by = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id_magang = ?
            `;

            const updateValues = [
                nama,
                jenis_peserta || existingIntern[0].jenis_peserta,
                nama_institusi,
                jenis_institusi,
                email,
                no_hp,
                bidang_id || null,
                tanggal_masuk,
                tanggal_keluar,
                newStatus,
                nama_pembimbing,
                telp_pembimbing,
                req.body.mentor_id || null,
                updated_by,
                id
            ];
    
            const [updateResult] = await conn.execute(updateQuery, updateValues);
    
            // 5. Update detail peserta (mahasiswa/siswa)
            const currentJenisPeserta = jenis_peserta || existingIntern[0].jenis_peserta;
    
            // Hapus data lama
            await conn.execute('DELETE FROM data_mahasiswa WHERE id_magang = ?', [id]);
            await conn.execute('DELETE FROM data_siswa WHERE id_magang = ?', [id]);
    
            if (currentJenisPeserta === 'mahasiswa') {
                const { nim, fakultas, jurusan, semester } = detail_peserta || {};
                
                if (!nim || !jurusan) {
                    throw new Error('NIM dan jurusan wajib diisi untuk mahasiswa');
                }
    
                await conn.execute(`
                    INSERT INTO data_mahasiswa 
                    (id_mahasiswa, id_magang, nim, fakultas, jurusan, semester, created_at, updated_at)
                    VALUES (UUID(), ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                `, [id, nim, fakultas, jurusan, semester]);
    
            } else if (currentJenisPeserta === 'siswa') {
                const { nisn, jurusan, kelas } = detail_peserta || {};
                
                if (!nisn || !jurusan) {
                    throw new Error('NISN dan jurusan wajib diisi untuk siswa');
                }
    
                await conn.execute(`
                    INSERT INTO data_siswa 
                    (id_siswa, id_magang, nisn, jurusan, kelas, created_at, updated_at)
                    VALUES (UUID(), ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                `, [id, nisn, jurusan, kelas]);
            }

            // 6. Buat notifikasi
            await createInternNotification(conn, {
                userId: req.user.userId,
                internName: nama,
                action: 'mengupdate'
            });

   
            // 7. Commit transaksi
            await conn.commit();

            // 8. Ambil data terbaru
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

            // 9. Kirim response
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

            // Handle specific errors
            if (error.message.includes('wajib')) {
                res.status(400).json({
                    status: 'error',
                    message: error.message
                });
            } else if (error.code === 'ER_DUP_ENTRY') {
                res.status(400).json({
                    status: 'error',
                    message: 'NIM/NISN sudah terdaftar'
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
            
            // Ambil data peserta sebelum dihapus untuk notifikasi
            const [internData] = await conn.execute(
                'SELECT nama, jenis_peserta FROM peserta_magang WHERE id_magang = ?',
                [id]
            );
    
            if (internData.length === 0) {
                await conn.rollback();
                return res.status(404).json({
                    status: 'error',
                    message: 'Data peserta magang tidak ditemukan'
                });
            }
    
            const internName = internData[0].nama;
    
            // Hapus data terkait berdasarkan jenis_peserta
            if (internData[0].jenis_peserta === 'mahasiswa') {
                await conn.execute(
                    'DELETE FROM data_mahasiswa WHERE id_magang = ?',
                    [id]
                );
            } else if (internData[0].jenis_peserta === 'siswa') {
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
    
            // Buat notifikasi setelah berhasil menghapus
            await createInternNotification(conn, {
                userId: req.user.userId,
                internName: internName,
                action: 'menghapus'
            });
    
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
                status = 'selesai,missing',
                bidang,
                search
            } = req.query;
    
            const offset = (page - 1) * limit;
            const statusArray = status.split(','); 
            const statusPlaceholders = statusArray.map(() => '?').join(',');
    
            // Inisialisasi params di awal
            const params = [...statusArray];
            const countParams = [...statusArray];
    
            // Modified query to include has_scores field
            let query = `
                SELECT 
                    pm.id_magang, 
                    pm.nama, 
                    pm.nama_institusi, 
                    b.nama_bidang, 
                    pm.status, 
                    pm.tanggal_masuk, 
                    pm.tanggal_keluar,
                    EXISTS (
                        SELECT 1 FROM penilaian p 
                        WHERE p.id_magang = pm.id_magang
                    ) as has_scores
                FROM peserta_magang pm
                LEFT JOIN bidang b ON pm.id_bidang = b.id_bidang
                WHERE pm.status IN (${statusPlaceholders})
            `;
    
            // Base query for counting total records
            let countQuery = `
                SELECT COUNT(*) AS total 
                FROM peserta_magang pm
                LEFT JOIN bidang b ON pm.id_bidang = b.id_bidang
                WHERE pm.status IN (${statusPlaceholders})
            `;
    
            // Add mentor_id filter for admin role
            if (req.user.role === 'admin') {
                query += ` AND pm.mentor_id = ?`;
                countQuery += ` AND pm.mentor_id = ?`;
                params.push(req.user.userId);
                countParams.push(req.user.userId);
            }
    
            // Add filter for bidang
            if (bidang) {
                query += ` AND pm.id_bidang = ?`;
                countQuery += ` AND pm.id_bidang = ?`;
                params.push(bidang);
                countParams.push(bidang);
            }
    
            // Add search filter
            if (search) {
                query += ` AND (pm.nama LIKE ? OR pm.nama_institusi LIKE ?)`;
                countQuery += ` AND (pm.nama LIKE ? OR pm.nama_institusi LIKE ?)`;
                params.push(`%${search}%`, `%${search}%`);
                countParams.push(`%${search}%`, `%${search}%`);
            }
            
            // Add sorting and pagination
            query += ` ORDER BY pm.tanggal_keluar DESC LIMIT ? OFFSET ?`;
            params.push(parseInt(limit), parseInt(offset));
    
            console.log('Query:', query); // Debug log
            console.log('Params:', params);
    
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