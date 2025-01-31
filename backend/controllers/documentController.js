// documentController 

const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs').promises;
const fsSync = require('fs');  // Untuk existsSyn
const path = require('path');
const libre = require('libreoffice-convert');
const { promisify } = require('util');
const convertAsync = promisify(libre.convert);
const pool = require('../config/database');
libre.convertAsync = require('util').promisify(libre.convert);


// Utility function untuk menghitung rata-rata nilai
const calculateAverageScore = (nilaiData) => {
    const nilaiFields = [
        'nilai_teamwork', 'nilai_komunikasi', 'nilai_pengambilan_keputusan',
        'nilai_kualitas_kerja', 'nilai_teknologi', 'nilai_disiplin',
        'nilai_tanggungjawab', 'nilai_kerjasama',
        'nilai_kejujuran', 'nilai_kebersihan'
    ];
   
    const values = nilaiFields.map(field => parseFloat(nilaiData[field] || 0));
    return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2);
};




//Tr
const calculateTotalScore = (nilaiData) => {
    const nilaiFields = [
        'nilai_teamwork', 'nilai_komunikasi', 'nilai_pengambilan_keputusan',
        'nilai_kualitas_kerja', 'nilai_teknologi', 'nilai_disiplin',
        'nilai_tanggungjawab', 'nilai_kerjasama',
        'nilai_kejujuran', 'nilai_kebersihan'
    ];
   
    return nilaiFields.map(field => parseFloat(nilaiData[field] || 0))
                     .reduce((a, b) => a + b, 0)
                     .toFixed(2);
};








// Fungsi untuk menentukan akreditasi berdasarkan rata-rata
const getAkreditasi = (rataRata) => {
    const nilai = parseFloat(rataRata);
    if (nilai > 90) return "Amat Baik";
    if (nilai > 80) return "Baik";
    if (nilai > 70) return "Cukup";
    if (nilai > 60) return "Sedang";
    return "Kurang";
};








// Fungsi untuk mengubah angka menjadi teks
const angkaKeTeks = (angka) => {
    const satuanTeks = [
        "", "Satu", "Dua", "Tiga", "Empat", "Lima",
        "Enam", "Tujuh", "Delapan", "Sembilan"
    ];
   
    const puluhan = Math.floor(angka);
    const desimal = Math.round((angka - puluhan) * 100);
   
    if (puluhan === 0) return "Nol";
   
    let hasil = "";
   
    // Handle thousands
    if (puluhan >= 1000) {
        const ribu = Math.floor(puluhan / 1000);
        if (ribu === 1) hasil += "Seribu ";
        else hasil += angkaKeTeks(ribu) + " Ribu ";
        angka = puluhan % 1000;
    }
   
    // Handle hundreds
    if (puluhan >= 100) {
        const ratus = Math.floor((puluhan % 1000) / 100);
        if (ratus === 1) hasil += "Seratus ";
        else if (ratus > 0) hasil += satuanTeks[ratus] + " Ratus ";
        angka = puluhan % 100;
    }
   
    // Handle tens and ones
    if (angka >= 20) {
        const sepuluh = Math.floor(angka / 10);
        hasil += satuanTeks[sepuluh] + " Puluh ";
        angka = angka % 10;
        if (angka > 0) hasil += satuanTeks[angka];
    } else if (angka >= 10) {
        if (angka === 10) hasil += "Sepuluh";
        else if (angka === 11) hasil += "Sebelas";
        else hasil += satuanTeks[angka - 10] + " Belas";
    } else if (angka > 0) {
        hasil += satuanTeks[angka];
    }
   
    if (desimal > 0) {
        hasil += ` Koma ${desimal}`;
    }
   
    return hasil.trim();
};












// Format tanggal ke dd/mm/yyyy
const formatTanggal = (tanggal) => {
    const date = new Date(tanggal);
    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).replace(/\./g, '/');
};








// Main controller object
const documentController = {
    async uploadTemplate(req, res) {
        try {
            // Deactivate current active template
            await pool.execute(
                'UPDATE dokumen_template SET active = 0 WHERE active = 1'
            );




            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'File template tidak ditemukan'
                });
            }




           
            // Setup paths
            const templateDir = path.join(__dirname, '..', 'public', 'templates');
            const filePath = path.join(templateDir, req.file.filename);
           
            // Ensure directory exists
            await fs.mkdir(templateDir, { recursive: true });
           
            // Move file
            await fs.rename(req.file.path, filePath);




            const templateData = {
                id_dokumen: Date.now().toString(),
                id_users: req.user?.id || null,
                file_path: filePath,
                active: 1,  // Set active here
                created_by: req.user?.id || null,
                created_at: new Date()
            };








            // Insert ke database
            const [result] = await pool.execute(
                `INSERT INTO dokumen_template
                (id_dokumen, id_users, file_path, active, created_by, created_at)
                VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    templateData.id_dokumen,
                    templateData.id_users,
                    templateData.file_path,
                    templateData.active,
                    templateData.created_by,
                    templateData.created_at
                ]
            );








            res.json({
                success: true,
                message: 'Template berhasil diupload',
                data: {
                    template_id: templateData.id_dokumen
                }
            });








        } catch (error) {
            console.error('Error uploading template:', error);
            res.status(500).json({
                success: false,
                message: 'Gagal mengupload template',
                error: error.message
            });
        }
    },








    async getTemplates(req, res) {
        try {
            const [templates] = await pool.execute(
                'SELECT * FROM dokumen_template WHERE active = 1'
            );








            res.json({
                success: true,
                data: templates
            });








        } catch (error) {
            console.error('Error fetching templates:', error);
            res.status(500).json({
                success: false,
                message: 'Gagal mengambil data template',
                error: error.message
            });
        }
    },


    async previewDocument(req, res) {
        try {
            const id = req.params.id;
            const [templates] = await pool.execute(
                'SELECT * FROM dokumen_template WHERE id_dokumen = ? AND active = 1',
                [id]
            );
   
            if (templates.length === 0) {
                return res.status(404).json({ success: false, message: 'Template tidak ditemukan' });
            }
   
            const filePath = templates[0].file_path;
            if (!fsSync.existsSync(filePath)) {
                return res.status(404).json({ success: false, message: 'File tidak ditemukan' });
            }
   
            // Convert DOCX to PDF
            const inputBuffer = await fs.readFile(filePath);
            const outputBuffer = await convertAsync(inputBuffer, '.pdf', undefined);
           
            res.setHeader('Content-Type', 'application/pdf');
            res.send(outputBuffer);
   
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({
                success: false,
                message: 'Gagal memuat preview dokumen',
                error: error.message
            });
        }
    },


    async deleteTemplate(req, res) {
        try {
            const { id } = req.params;
           
            await pool.execute(
                'UPDATE dokumen_template SET active = 0 WHERE id_dokumen = ?',
                [id]
            );








            res.json({
                success: true,
                message: 'Template berhasil dihapus'
            });








        } catch (error) {
            console.error('Error deleting template:', error);
            res.status(500).json({
                success: false,
                message: 'Gagal menghapus template',
                error: error.message
            });
        }
    },
    // Certificate Generation
    async generateSertifikat(req, res) {
        try {
            const id_magang = req.params.id;
            if (!id_magang) {
                return res.status(400).json({
                    success: false,
                    message: 'ID magang harus disediakan'
                });
            }
   
            // 1. Ambil template
            const [templates] = await pool.execute(
                'SELECT * FROM dokumen_template WHERE active = 1 ORDER BY created_at DESC LIMIT 1'
            );
   
            if (templates.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Template sertifikat tidak ditemukan'
                });
            }
   
            // 2. Ambil data peserta (kode sama seperti sebelumnya)
            const [peserta] = await pool.execute(`
                SELECT
                    pm.*,
                    p.*,
                    CASE
                        WHEN pm.jenis_peserta = 'mahasiswa' THEN dm.nim
                        WHEN pm.jenis_peserta = 'siswa' THEN ds.nisn
                    END as nomor_induk,
                    CASE
                        WHEN pm.jenis_peserta = 'mahasiswa' THEN dm.jurusan
                        WHEN pm.jenis_peserta = 'siswa' THEN ds.jurusan
                    END as jurusan
                FROM peserta_magang pm
                LEFT JOIN penilaian p ON pm.id_magang = p.id_magang
                LEFT JOIN data_mahasiswa dm ON pm.id_magang = dm.id_magang
                LEFT JOIN data_siswa ds ON pm.id_magang = ds.id_magang
                WHERE pm.id_magang = ?
            `, [id_magang]);
   
            if (!peserta || peserta.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Data peserta tidak ditemukan'
                });
            }
   
            // 3. Generate DOCX
            const templatePath = templates[0].file_path;
            console.log('Template path:', templatePath); // Debug log
   
            const content = await fs.readFile(templatePath);
            const zip = new PizZip(content);
           
            const doc = new Docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true,
            });
   
            // Data untuk template
            const tandaTangan = `\${ttd_pengirim}`;
            const nomorSertifikat = `\${nomor_naskah}`;
            const tanggalNaskah = new Date().toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
   
            // Render template
            doc.render({
                nomor_naskah: nomorSertifikat,
                nama: peserta[0].nama,
                nomor_induk: peserta[0].nomor_induk,
                institusi: peserta[0].nama_institusi,
                jurusan: peserta[0].jurusan,
                tanggal_masuk: formatTanggal(peserta[0].tanggal_masuk),
                tanggal_keluar: formatTanggal(peserta[0].tanggal_keluar),
                tanggal_naskah: tanggalNaskah,
                ttd_pengirim: tandaTangan,
                nilai_teamwork: peserta[0].nilai_teamwork,
                nilai_teamwork_teks: angkaKeTeks(parseFloat(peserta[0].nilai_teamwork)),
                nilai_komunikasi: peserta[0].nilai_komunikasi,
                nilai_komunikasi_teks: angkaKeTeks(parseFloat(peserta[0].nilai_komunikasi)),
                nilai_pengambilan_keputusan: peserta[0].nilai_pengambilan_keputusan,
                nilai_pengambilan_keputusan_teks: angkaKeTeks(parseFloat(peserta[0].nilai_pengambilan_keputusan)),
                nilai_kualitas_kerja: peserta[0].nilai_kualitas_kerja,
                nilai_kualitas_kerja_teks: angkaKeTeks(parseFloat(peserta[0].nilai_kualitas_kerja)),
                nilai_teknologi: peserta[0].nilai_teknologi,
                nilai_teknologi_teks: angkaKeTeks(parseFloat(peserta[0].nilai_teknologi)),
                nilai_disiplin: peserta[0].nilai_disiplin,
                nilai_disiplin_teks: angkaKeTeks(parseFloat(peserta[0].nilai_disiplin)),
                nilai_tanggungjawab: peserta[0].nilai_tanggungjawab,
                nilai_tanggungjawab_teks: angkaKeTeks(parseFloat(peserta[0].nilai_tanggungjawab)),
                nilai_kerjasama: peserta[0].nilai_kerjasama,
                nilai_kerjasama_teks: angkaKeTeks(parseFloat(peserta[0].nilai_kerjasama)),
                nilai_kebersihan: peserta[0].nilai_kebersihan,
                nilai_kebersihan_teks: angkaKeTeks(parseFloat(peserta[0].nilai_kebersihan)),
                nilai_kejujuran: peserta[0].nilai_kejujuran,
                nilai_kejujuran_teks: angkaKeTeks(parseFloat(peserta[0].nilai_kejujuran)),
                jumlah: calculateTotalScore(peserta[0]),
                jumlah_teks: angkaKeTeks(parseFloat(calculateTotalScore(peserta[0]))),
                rata_rata: calculateAverageScore(peserta[0]),
                rata_rata_teks: angkaKeTeks(parseFloat(calculateAverageScore(peserta[0]))),
                akreditasi: getAkreditasi(calculateAverageScore(peserta[0]))
            });
   
            // Generate buffer
            const buffer = doc.getZip().generate({
                type: 'nodebuffer',
                compression: 'DEFLATE'
            });
   
            // Setup paths
            const docxName = `sertifikat_${peserta[0].nama.replace(/\s+/g, '_')}_${Date.now()}.docx`;
            const certificatesDir = path.join(__dirname, '..', 'public', 'certificates');
            await fs.mkdir(certificatesDir, { recursive: true });
            const docxPath = path.join(certificatesDir, docxName);
   




            // Simpan file
            await fs.writeFile(docxPath, buffer);
           
            // Update database dengan path DOCX
            const dbPath = `/certificates/${docxName}`;
            await pool.execute(
                'UPDATE peserta_magang SET sertifikat_path = ? WHERE id_magang = ?',
                [dbPath, id_magang]
            );
   
            return res.json({
                success: true,
                message: 'Sertifikat berhasil dibuat',
                data: {
                    sertifikat_path: dbPath,
                    nama_peserta: peserta[0].nama
                }
            });
   
        } catch (error) {
            console.error('Error detail:', error);
            return res.status(500).json({
                success: false,
                message: 'Gagal membuat sertifikat',
                error: error.message
            });
        }
    },




    // Endpoint untuk download sertifikat
    async downloadSertifikat(req, res) {
        try {
            const { id_magang } = req.params;
           
            const [peserta] = await pool.execute(
                'SELECT sertifikat_path FROM peserta_magang WHERE id_magang = ?',
                [id_magang]
            );








            if (!peserta[0]?.sertifikat_path) {
                return res.status(404).json({
                    success: false,
                    message: 'Sertifikat tidak ditemukan'
                });
            }








            const filePath = path.join(__dirname, '..', 'public', peserta[0].sertifikat_path.replace(/^\//, ''));
            res.download(filePath);








        } catch (error) {
            console.error('Error downloading certificate:', error);
            res.status(500).json({
                success: false,
                message: 'Gagal mengunduh sertifikat',
                error: error.message
            });
        }
    },
    // Receipt Generation (if needed)
    async generateReceipt(req, res) {
        try {
            const { nomor_surat, tanggal, penerima, jabatan, departemen, daftar_barang } = req.body;
           
            // Implementation for receipt generation
            // Similar to generateSertifikat but with receipt-specific logic
           
            res.json({
                success: true,
                message: 'Receipt berhasil digenerate'
            });








        } catch (error) {
            console.error('Error generating receipt:', error);
            res.status(500).json({
                success: false,
                message: 'Gagal membuat receipt',
                error: error.message
            });
        }
    }
};




// Helper function untuk extract text dari PDF
async function extractTextFromPDF(pdfPath) {
    // Menggunakan pdf-parse package
    const pdf = require('pdf-parse');
    const dataBuffer = await fs.readFile(pdfPath);
    const data = await pdf(dataBuffer);
    return data.text;
}




module.exports = documentController;