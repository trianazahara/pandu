// backend/controllers/documentController.js
const pool = require('../config/database');
const { PDFDocument } = require('pdf-lib');
const XLSX = require('xlsx');
const fs = require('fs').promises;
const path = require('path');

const documentController = {
    // Generate acceptance letter
    generateAcceptanceLetter: async (req, res) => {
        try {
            const { intern_ids, fields } = req.body;
            
            // Get template
            const [template] = await pool.execute(`
                SELECT file_path
                FROM dokumen_template
                WHERE jenis = 'surat_penerimaan'
                AND active = true
                LIMIT 1
            `);

            if (!template.length) {
                return res.status(404).json({
                    message: 'Template surat penerimaan tidak ditemukan'
                });
            }

            // Get intern data
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
                    m.semester,
                    s.kelas
                FROM peserta_magang p
                LEFT JOIN institusi i ON p.id_institusi = i.id_institusi
                LEFT JOIN bidang b ON p.id_bidang = b.id_bidang
                LEFT JOIN data_mahasiswa m ON p.id_magang = m.id_magang
                LEFT JOIN data_siswa s ON p.id_magang = s.id_magang
                WHERE p.id_magang IN (?)
            `, [intern_ids]);

            // Load template
            const templatePath = path.join(__dirname, '..', template[0].file_path);
            const templateBytes = await fs.readFile(templatePath);
            const pdfDoc = await PDFDocument.load(templateBytes);

            // Fill template with data
            // Note: Implementation depends on template structure
            
            // Save generated PDF
            const pdfBytes = await pdfDoc.save();
            
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=surat_penerimaan.pdf');
            res.send(Buffer.from(pdfBytes));
        } catch (error) {
            console.error('Error generating acceptance letter:', error);
            res.status(500).json({ message: 'Terjadi kesalahan server' });
        }
    },
    generateCertificate: async (req, res) => {
        try {
            const { intern_ids, fields } = req.body;
            
            // Get template
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
 
            // Get intern data
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
                    m.semester,
                    s.kelas,
                    DATEDIFF(p.tanggal_keluar, p.tanggal_masuk) as durasi_magang
                FROM peserta_magang p
                LEFT JOIN institusi i ON p.id_institusi = i.id_institusi
                LEFT JOIN bidang b ON p.id_bidang = b.id_bidang
                LEFT JOIN data_mahasiswa m ON p.id_magang = m.id_magang
                LEFT JOIN data_siswa s ON p.id_magang = s.id_magang
                WHERE p.id_magang IN (?)
                AND p.status = 'selesai' -- Hanya generate untuk yang sudah selesai
            `, [intern_ids]);
 
            if (!interns.length) {
                return res.status(404).json({
                    message: 'Data peserta magang tidak ditemukan atau belum selesai'
                });
            }
 
            // Load template
            const templatePath = path.join(__dirname, '..', template[0].file_path);
            const templateBytes = await fs.readFile(templatePath);
            const pdfDoc = await PDFDocument.load(templateBytes);
 
            // Get the first page of the template
            const page = pdfDoc.getPages()[0];
            
            // For each intern, create a new page from template and fill data
            for (const intern of interns) {
                // Clone template page if not the first intern
                if (intern !== interns[0]) {
                    const [templatePage] = await pdfDoc.copyPages(pdfDoc, [0]);
                    pdfDoc.addPage(templatePage);
                }
 
                // Format dates
                const tanggalMasuk = new Date(intern.tanggal_masuk).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                });
                const tanggalKeluar = new Date(intern.tanggal_keluar).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                });
 
                // Get education info based on jenis_peserta
                const pendidikan = intern.jenis_peserta === 'mahasiswa' 
                    ? `${intern.fakultas} - ${intern.jurusan_mahasiswa} (Semester ${intern.semester})`
                    : `${intern.jurusan_siswa} - Kelas ${intern.kelas}`;
 
                // Save generated certificate info to database
                const [result] = await pool.execute(`
                    INSERT INTO dokumen_sertifikat (
                        id_magang,
                        tanggal_terbit,
                        created_by
                    ) VALUES (?, CURRENT_TIMESTAMP, ?)
                `, [
                    intern.id_magang,
                    req.user.userId
                ]);
 
                // Note: Actual field placement would depend on the template structure
                // This is a placeholder for PDF text placement
                // You'll need to adjust coordinates based on your template
                
                /* Example field placement:
                page.drawText(intern.nama, {
                    x: 300,
                    y: 500,
                    size: 16
                });
                
                page.drawText(intern.nama_institusi, {
                    x: 300,
                    y: 450,
                    size: 12
                });
                
                page.drawText(`${tanggalMasuk} - ${tanggalKeluar}`, {
                    x: 300,
                    y: 400,
                    size: 12
                });
                
                page.drawText(pendidikan, {
                    x: 300,
                    y: 350,
                    size: 12
                });
                */
            }
 
            // Save generated PDF
            const pdfBytes = await pdfDoc.save();
            
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=sertifikat_magang.pdf');
            res.send(Buffer.from(pdfBytes));
 
        } catch (error) {
            console.error('Error generating certificate:', error);
            res.status(500).json({ message: 'Terjadi kesalahan server' });
        }
    },

   // Upload document template
   uploadTemplate: async (req, res) => {
       const conn = await pool.getConnection();
       try {
           const { jenis, keterangan } = req.body;

           // Validasi file
           if (!req.file) {
               return res.status(400).json({
                   status: 'error',
                   message: 'File template tidak ditemukan'
               });
           }

           // Validasi tipe file (PDF)
           if (req.file.mimetype !== 'application/pdf') {
               // Hapus file jika bukan PDF
               await fs.unlink(req.file.path);
               return res.status(400).json({
                   status: 'error',
                   message: 'File harus berupa PDF'
               });
           }

           await conn.beginTransaction();

           // Non-aktifkan template lama untuk jenis yang sama
           await conn.execute(`
               UPDATE dokumen_template 
               SET active = false,
                   updated_at = CURRENT_TIMESTAMP,
                   updated_by = ?
               WHERE jenis = ? 
               AND active = true
           `, [req.user.userId, jenis]);

           // Simpan template baru
           const [result] = await conn.execute(`
               INSERT INTO dokumen_template (
                   jenis,
                   keterangan,
                   file_path,
                   file_name,
                   file_size,
                   mime_type,
                   active,
                   created_by
               ) VALUES (?, ?, ?, ?, ?, ?, true, ?)
           `, [
               jenis,
               keterangan,
               req.file.path.replace(/\\/g, '/'), // Normalize path for Windows
               req.file.originalname,
               req.file.size,
               req.file.mimetype,
               req.user.userId
           ]);

           await conn.commit();

           res.status(201).json({
               status: 'success',
               message: 'Template berhasil diunggah',
               data: {
                   id: result.insertId,
                   jenis,
                   keterangan,
                   file_name: req.file.originalname
               }
           });

       } catch (error) {
           await conn.rollback();
           
           // Hapus file jika terjadi error
           if (req.file) {
               try {
                   await fs.unlink(req.file.path);
               } catch (unlinkError) {
                   console.error('Error deleting file:', unlinkError);
               }
           }

           console.error('Error uploading template:', error);
           res.status(500).json({ 
               status: 'error',
               message: 'Terjadi kesalahan server' 
           });
       } finally {
           conn.release();
       }
   },

   // Get all templates
   getTemplates: async (req, res) => {
       try {
           const [templates] = await pool.execute(`
               SELECT 
                   id_template,
                   jenis,
                   keterangan,
                   file_name,
                   file_size,
                   active,
                   created_at,
                   updated_at
               FROM dokumen_template
               ORDER BY created_at DESC
           `);

           res.json({
               status: 'success',
               data: templates
           });

       } catch (error) {
           console.error('Error getting templates:', error);
           res.status(500).json({ 
               status: 'error',
               message: 'Terjadi kesalahan server' 
           });
       }
   }

};


module.exports = documentController;