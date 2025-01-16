// controllers/documentController.js
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const pool = require('../config/database');
const path = require('path');
const fs = require('fs').promises;

// controllers/documentController.js
async function uploadTemplate(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'File tidak ditemukan' });
        }

        const { jenis, nomor_format } = req.body;
        const file = req.file;
        
        // Hapus referensi ke req.user.id
        const filePath = path.join(__dirname, '..', 'public', 'templates', file.filename);
        const previewPath = `/templates/${file.filename}`;

        // Pastikan direktori exists
        await fs.mkdir(path.join(__dirname, '..', 'public', 'templates'), { recursive: true });

        // Pindahkan file
        await fs.rename(file.path, filePath);

        // Simpan ke database tanpa user id
        const [result] = await pool.execute(
            `INSERT INTO dokumen_template 
            (jenis, nomor_format, file_path, preview_path, active, created_at) 
            VALUES (?, ?, ?, ?, 1, NOW())`,
            [jenis, nomor_format, filePath, previewPath]
        );

        res.json({ 
            message: 'Template berhasil diupload',
            template_id: result.insertId 
        });
    } catch (error) {
        console.error('Error uploading template:', error);
        res.status(500).json({ 
            message: 'Terjadi kesalahan server',
            detail: error.message 
        });
    }
}

async function getTemplates(req, res) {
    try {
        const [templates] = await pool.execute(
            'SELECT * FROM dokumen_template WHERE active = 1'
        );
        res.json(templates);
    } catch (error) {
        console.error('Error fetching templates:', error);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
}

async function deleteTemplate(req, res) {
    try {
        const { id } = req.params;
        await pool.execute(
            'UPDATE dokumen_template SET active = 0 WHERE id_dokumen = ?',
            [id]
        );
        res.json({ message: 'Template berhasil dihapus' });
    } catch (error) {
        console.error('Error deleting template:', error);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
}

// Certificate Generation
async function generateSertifikatForm(req, res) {
    try {
        res.render('generate-sertifikat-form');
    } catch (error) {
        console.error('Error generating sertifikat form:', error);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
}

async function generateSertifikat(req, res) {
    try {
        const { 
            nama, nim, jurusan, universitas, 
            nilai_teamwork, nilai_komunikasi, nilai_pengambilan_keputusan,
            nilai_kualitas_kerja, nilai_teknologi, nilai_disiplin,
            nilai_tanggungjawab, nilai_kerjasama, nilai_inisiatif,
            nilai_kejujuran, nilai_kebersihan
        } = req.body;

        // Calculate average score
        const nilaiArray = [
            parseFloat(nilai_teamwork), parseFloat(nilai_komunikasi),
            parseFloat(nilai_pengambilan_keputusan), parseFloat(nilai_kualitas_kerja),
            parseFloat(nilai_teknologi), parseFloat(nilai_disiplin),
            parseFloat(nilai_tanggungjawab), parseFloat(nilai_kerjasama),
            parseFloat(nilai_inisiatif), parseFloat(nilai_kejujuran),
            parseFloat(nilai_kebersihan)
        ];

        const rata2Nilai = nilaiArray.reduce((a, b) => a + b, 0) / nilaiArray.length;
        const hurufNilai = getHurufNilai(rata2Nilai);

        // Create Certificate PDF
        const pdfDoc = await PDFDocument.create();
        const page1 = pdfDoc.addPage();
        const page2 = pdfDoc.addPage();

        // Generate certificate content
        generateCertificatePages(page1, page2, {
            nama, nim, jurusan, universitas,
            nilaiArray, rata2Nilai, hurufNilai
        });

        const pdfBytes = await pdfDoc.save();

        res.set({
            "Content-Disposition": `attachment;filename="sertifikat_${nama}.pdf"`,
            "Content-Type": "application/pdf"
        });
        res.send(pdfBytes);

    } catch (error) {
        console.error('Error generating sertifikat:', error);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
}

// Receipt Letter Generation
async function generateReceiptForm(req, res) {
    try {
        res.render('generate-receipt-form');
    } catch (error) {
        console.error('Error loading receipt form:', error);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
}

async function generateReceipt(req, res) {
    try {
        const { 
            nomor_surat,
            tanggal,
            penerima,
            jabatan,
            departemen,
            daftar_barang
        } = req.body;

        // Create Receipt PDF
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage();

        // Add receipt content
        page.drawText('SURAT TANDA TERIMA', { x: 200, y: 750, size: 20 });
        page.drawText(`Nomor: ${nomor_surat}`, { x: 100, y: 700, size: 12 });
        page.drawText(`Tanggal: ${tanggal}`, { x: 100, y: 680, size: 12 });
        page.drawText('Yang bertanda tangan di bawah ini:', { x: 100, y: 650, size: 12 });
        page.drawText(`Nama: ${penerima}`, { x: 120, y: 630, size: 12 });
        page.drawText(`Jabatan: ${jabatan}`, { x: 120, y: 610, size: 12 });
        page.drawText(`Departemen: ${departemen}`, { x: 120, y: 590, size: 12 });

        // Add items list
        let yPosition = 540;
        page.drawText('Telah menerima:', { x: 100, y: yPosition, size: 12 });
        
        const items = JSON.parse(daftar_barang);
        items.forEach((item, index) => {
            yPosition -= 25;
            page.drawText(`${index + 1}. ${item.nama} - ${item.jumlah} ${item.satuan}`, 
                { x: 120, y: yPosition, size: 12 });
        });

        // Add signature section
        yPosition -= 60;
        page.drawText('Penerima,', { x: 350, y: yPosition, size: 12 });
        page.drawText(penerima, { x: 350, y: yPosition - 60, size: 12 });

        const pdfBytes = await pdfDoc.save();

        res.set({
            "Content-Disposition": `attachment;filename="tanda_terima_${nomor_surat}.pdf"`,
            "Content-Type": "application/pdf"
        });
        res.send(pdfBytes);

    } catch (error) {
        console.error('Error generating receipt:', error);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
}

// Helper Functions
function getHurufNilai(nilai) {
    if (nilai >= 90) return 'A';
    if (nilai >= 80) return 'B';
    if (nilai >= 70) return 'C';
    if (nilai >= 60) return 'D';
    return 'E';
}

function generateCertificatePages(page1, page2, data) {
    // Page 1: Cover
    page1.drawText(`SERTIFIKAT`, { x: 250, y: 700, size: 24 });
    page1.drawText(`PELAKSANAAN MAGANG`, { x: 200, y: 650, size: 18 });
    page1.drawText(`NAMA: ${data.nama}`, { x: 100, y: 600, size: 16 });
    page1.drawText(`NIM: ${data.nim}`, { x: 100, y: 570, size: 16 });
    page1.drawText(`JURUSAN: ${data.jurusan}`, { x: 100, y: 540, size: 16 });
    page1.drawText(`UNIVERSITAS: ${data.universitas}`, { x: 100, y: 510, size: 16 });

    // Page 2: Grade Recap
    page2.drawText('REKAP NILAI', { x: 250, y: 750, size: 20 });
    const nilaiLabels = [
        'Teamwork', 'Komunikasi', 'Pengambilan Keputusan',
        'Kualitas Kerja', 'Teknologi', 'Disiplin',
        'Tanggung Jawab', 'Kerjasama', 'Inisiatif',
        'Kejujuran', 'Kebersihan'
    ];

    let yPosition = 700;
    data.nilaiArray.forEach((nilai, index) => {
        page2.drawText(`${index + 1}. ${nilaiLabels[index]}: ${nilai}`, 
            { x: 100, y: yPosition, size: 14 });
        yPosition -= 30;
    });

    page2.drawText(`Rata-rata Nilai: ${data.rata2Nilai.toFixed(2)}`, 
        { x: 100, y: 350, size: 16 });
    page2.drawText(`Predikat: ${data.hurufNilai}`, 
        { x: 100, y: 320, size: 16 });
}

module.exports = {
    uploadTemplate,
    getTemplates,
    deleteTemplate,
    generateSertifikatForm,
    generateSertifikat,
    generateReceiptForm,
    generateReceipt
};