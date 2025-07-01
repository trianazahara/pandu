const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs').promises;
const fsSync = require('fs');  
const path = require('path');
console.log("Lokasi file controller ini (__dirname):", __dirname);
const libre = require('libreoffice-convert');
const { promisify } = require('util');
const convertAsync = promisify(libre.convert);
const pool = require('../config/database');
libre.convertAsync = require('util').promisify(libre.convert);

// Cache untuk menyimpan PDF sementara (1 jam)
class PDFCache {
    constructor() {
        this.cache = new Map();
    }

    get(templateId) {
        const cached = this.cache.get(templateId);
        if (cached && Date.now() - cached.timestamp < 3600000) { 
            return cached.buffer;
        }
        return null;
    }

    set(templateId, buffer) {
        this.cache.set(templateId, {
            buffer,
            timestamp: Date.now()
        });
    }
};

// Hitung rata-rata nilai peserta
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

// Konversi nilai ke akreditasi
const getAkreditasi = (rataRata) => {
    const nilai = parseFloat(rataRata);
    if (nilai > 90) return "Amat Baik";
    if (nilai > 80) return "Baik";
    if (nilai > 70) return "Cukup";
    if (nilai > 60) return "Sedang";
    return "Kurang";
};

// Hitung total nilai peserta
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

// Konversi angka ke teks bahasa Indonesia
const angkaKeTeks = (angka) => {
    const satuanTeks = [
        "", "Satu", "Dua", "Tiga", "Empat", "Lima",
        "Enam", "Tujuh", "Delapan", "Sembilan"
    ];
    
    const puluhan = Math.floor(angka);
    const desimal = Math.round((angka - puluhan) * 100);
    
    if (puluhan === 0) return "Nol";
    
    let hasil = "";
    let tempPuluhan = puluhan; 
    
    // Proses ribuan
    if (tempPuluhan >= 1000) {
        const ribu = Math.floor(tempPuluhan / 1000);
        if (ribu === 1) hasil += "Seribu ";
        else hasil += angkaKeTeks(ribu) + " Ribu ";
        tempPuluhan = tempPuluhan % 1000;
    }
    
    // Proses ratusan
    if (tempPuluhan >= 100) {
        const ratus = Math.floor(tempPuluhan / 100);
        if (ratus === 1) hasil += "Seratus ";
        else if (ratus > 0) hasil += satuanTeks[ratus] + " Ratus ";
        tempPuluhan = tempPuluhan % 100;
    }
    
    // Proses puluhan dan satuan
    if (tempPuluhan >= 20) {
        const sepuluh = Math.floor(tempPuluhan / 10);
        hasil += satuanTeks[sepuluh] + " Puluh ";
        tempPuluhan = tempPuluhan % 10;
        if (tempPuluhan > 0) hasil += satuanTeks[tempPuluhan];
    } else if (tempPuluhan >= 10) {
        if (tempPuluhan === 10) hasil += "Sepuluh";
        else if (tempPuluhan === 11) hasil += "Sebelas";
        else hasil += satuanTeks[tempPuluhan - 10] + " Belas";
    } else if (tempPuluhan > 0) {
        hasil += satuanTeks[tempPuluhan];
    }
    
    // Tambah desimal jika ada
    if (desimal > 0) {
        hasil += " Koma " + angkaKeTeks(desimal);
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

const documentController = {
    // Upload template dokumen baru
    async uploadTemplate(req, res) {
        try {
            // Nonaktifkan template lama
            await pool.execute(
                'UPDATE dokumen_template SET active = 0 WHERE active = 1'
            );

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'File template tidak ditemukan'
                });
            }

            // Siapkan direktori dan pindahkan file
            const templateDir = path.join(__dirname, '..', 'public', 'templates');
            const filePath = path.join(templateDir, req.file.filename);

            await fs.mkdir(templateDir, { recursive: true });
            await fs.rename(req.file.path, filePath);

            // Simpan info template ke database
            const templateData = {
                id_dokumen: Date.now().toString(),
                id_users: req.user?.id || null,
                file_path: filePath,
                active: 1,  
                created_by: req.user?.id || null,
                created_at: new Date()
            };

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

    // Ambil daftar template aktif
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

    // Preview dokumen dalam format PDF
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

            // Konversi dokumen ke PDF
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

    // Hapus template (soft delete)
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

    // Generate sertifikat magang
    async generateSertifikat(req, res) {
        try {
            const id_magang = req.params.id;
            if (!id_magang) {
                return res.status(400).json({
                    success: false,
                    message: 'ID magang harus disediakan'
                });
            }
   
            // Ambil template aktif terbaru
            const [templates] = await pool.execute(
                'SELECT * FROM dokumen_template WHERE active = 1 ORDER BY created_at DESC LIMIT 1'
            );
   
            if (templates.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Template sertifikat tidak ditemukan'
                });
            }
   
            // Ambil data lengkap peserta
            const [peserta] = await pool.execute(`
                SELECT
                    pm.*,
                    p.*,
                    u.nama as nama_mentor,
                    u.nip as nip_mentor,
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
                LEFT JOIN users u ON pm.mentor_id = u.id_users
                WHERE pm.id_magang = ?
            `, [id_magang]);
   
            if (!peserta || peserta.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Data peserta tidak ditemukan'
                });
            }
   
            // Proses template dengan docxtemplater
            const templatePath = templates[0].file_path;
            console.log('Template path:', templatePath); 
   
            const content = await fs.readFile(templatePath);
            const zip = new PizZip(content);
           
            const doc = new Docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true,
            });
   
            const tandaTangan = `\${ttd_pengirim}`;
            const nomorSertifikat = `\${nomor_naskah}`;
            const tanggalNaskah = new Date().toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
   
            // Render template dengan data peserta
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
                akreditasi: getAkreditasi(calculateAverageScore(peserta[0])),
                // Opsional (Jika sewaktu2 diperlukan)
                email: peserta[0].email,
                nomor_telpon: peserta[0].no_hp,
                nama_mentor: peserta[0].nama_mentor,
                nip_mentor: peserta[0].nip_mentor
            });
   
            // Generate file docx
            const buffer = doc.getZip().generate({
                type: 'nodebuffer',
                compression: 'DEFLATE'
            });
   
            // Simpan file sertifikat
            const docxName = `sertifikat_${peserta[0].nama.replace(/\s+/g, '_')}_${Date.now()}.docx`;
            const certificatesDir = path.join(__dirname, '..', 'public', 'certificates');
            await fs.mkdir(certificatesDir, { recursive: true });
            const docxPath = path.join(certificatesDir, docxName);
   
            await fs.writeFile(docxPath, buffer);
           
            // Update path sertifikat di database
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

    // Download sertifikat peserta
    async downloadSertifikat(req, res) {
    console.log("\n--- MEMULAI PROSES DOWNLOAD SERTIFIKAT ---"); 
    try {
        const { id_magang } = req.params;

        // LOG 1: Lihat ID mentah yang diterima dan tipe datanya.
        // Tanda kutip akan membantu kita melihat spasi tersembunyi.
        console.log(`ID Magang yang diterima dari URL: '${id_magang}' (Tipe data: ${typeof id_magang})`);

        // LOG 2: Jalankan query ke database
        const [peserta] = await pool.execute(
            'SELECT sertifikat_path FROM peserta_magang WHERE id_magang = ?',
            [id_magang]
        );

        // LOG 3: Lihat hasil mentah dari database
        // Jika hasilnya [[]], artinya tidak ada data yang cocok.
        console.log('Hasil query dari database:', JSON.stringify(peserta));

        if (!peserta[0]?.sertifikat_path) {
            console.log("Kondisi '!peserta[0]?.sertifikat_path' bernilai TRUE. Mengirim 404.");
            if (peserta.length === 0) {
                console.log("Alasan: Query tidak menemukan satu baris pun dengan ID tersebut.");
            } else {
                console.log("Alasan: Baris ditemukan, tetapi kolom 'sertifikat_path' di baris itu kosong (NULL).");
            }
            
            return res.status(404).json({
                success: false,
                message: 'Sertifikat tidak ditemukan di DB untuk ID ini.'
            });
        }
        
        console.log("SUKSES: Path ditemukan:", peserta[0].sertifikat_path);
        const filePath = path.join(__dirname, '..', 'public', peserta[0].sertifikat_path.replace(/^\//, ''));
        console.log('Mencoba mengirim file dari path absolut:', filePath);

        res.download(filePath, (err) => {
            if (err) {
                console.error("ERROR SAAT res.download():", err);
            }
        });

    } catch (error) {
        console.error('FATAL ERROR di blok CATCH:', error);
        res.status(500).json({ message: 'Terjadi kesalahan internal server' });
    }
},

    // Generate tanda terima
    async generateReceipt(req, res) {
        try {
            const { nomor_surat, tanggal, penerima, jabatan, departemen, daftar_barang } = req.body;
           
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

// Ekstrak text dari file PDF
async function extractTextFromPDF(pdfPath) {
    const pdf = require('pdf-parse');
    const dataBuffer = await fs.readFile(pdfPath);
    const data = await pdf(dataBuffer);
    return data.text;
}

module.exports = documentController;