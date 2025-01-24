// routes/document.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const documentController = require('../controllers/documentController');
const { authMiddleware } = require('../middleware/auth');




// Konfigurasi direktori upload
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}




// Konfigurasi multer untuk upload file
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function(req, file, cb) {
        // Membersihkan nama file dari karakter yang tidak diinginkan
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
        cb(null, `${Date.now()}-${safeName}`);
    }
});




const fileFilter = (req, file, cb) => {
                if (file.mimetype === 'application/msword' || // .doc
                    file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') { // .docx
                    cb(null, true);
                } else {
                    cb(new Error('Format file tidak didukung. Gunakan .doc atau .docx'), false);
                }
            };






// Inisialisasi multer dengan konfigurasi
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // Batasan 5MB
    }
});




// Middleware untuk handling error multer
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'Ukuran file terlalu besar. Maksimal 5MB'
            });
        }
        return res.status(400).json({
            success: false,
            message: 'Error pada upload file',
            error: err.message
        });
    }
    if (err) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
    next();
};




// Routes untuk manajemen template
router.post(
    '/upload',
    // authMiddleware, // Uncomment jika ingin menggunakan autentikasi
    upload.single('file'),
    handleMulterError,
    documentController.uploadTemplate
);




router.get(
    '/templates',
    // authMiddleware,
    documentController.getTemplates
);

// routes/document.js 
router.get('/preview/:id', documentController.previewDocument);



router.delete(
    '/template/:id',
    // authMiddleware,
    documentController.deleteTemplate
);




// Routes untuk generasi sertifikat
router.post(
    '/generate-sertifikat/:id',
    documentController.generateSertifikat
 );


// Endpoint untuk mengakses file yang di-generate
router.get('/certificates/:filename', (req, res) => {
    const certificatePath = path.join(__dirname, '..', 'public', 'certificates', req.params.filename);
    res.sendFile(certificatePath, (err) => {
        if (err) {
            res.status(404).json({
                success: false,
                message: 'File tidak ditemukan'
            });
        }
    });
});




router.get('/download-sertifikat/:id_magang', documentController.downloadSertifikat);




// Akses file sertifikat
router.use('/certificates', express.static(path.join(__dirname, '..', 'public', 'certificates')));




// Route untuk preview template
router.get('/templates/:filename', (req, res) => {
    const templatePath = path.join(__dirname, '..', 'public', 'templates', req.params.filename);
    res.sendFile(templatePath, (err) => {
        if (err) {
            res.status(404).json({
                success: false,
                message: 'Template tidak ditemukan'
            });
        }
    });
});




router.get('/certificates/:filename', (req, res) => {
    const filePath = path.join(__dirname, '..', 'public', 'certificates', req.params.filename);
    res.sendFile(filePath, (err) => {
        if (err) {
            res.status(404).json({
                success: false,
                message: 'File sertifikat tidak ditemukan'
            });
        }
    });
});




// Error handler untuk route
router.use((err, req, res, next) => {
    console.error('Route error:', err);
    res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan pada server',
        error: err.message
    });
});




module.exports = router;



