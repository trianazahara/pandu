// routes/document.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const documentController = require('../controllers/documentController');
const { authMiddleware } = require('../middleware/auth');

// Buat direktori uploads jika belum ada
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Konfigurasi multer untuk upload
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function(req, file, cb) {
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
        cb(null, Date.now() + '-' + safeName);
    }
});


// router.use(authMiddleware);


// Buat instance multer dengan konfigurasi
const upload = multer({
    storage: storage,
    limits: { fileSize: 5000000 }, // 5MB limit
    fileFilter: function(req, file, cb) {
        if (!file.originalname.match(/\.(pdf|doc|docx)$/)) {
            return cb(new Error('Hanya file PDF atau DOC yang diperbolehkan'));
        }
        cb(null, true);
    }
});


// Routes
router.post('/upload-template', upload.single('file'), documentController.uploadTemplate);
router.get('/templates', documentController.getTemplates);
router.delete('/template/:id', documentController.deleteTemplate);
router.get('/generate-sertifikat', documentController.generateSertifikatForm);
router.post('/generate-sertifikat', documentController.generateSertifikat);
router.get('/generate-receipt', documentController.generateReceiptForm);
router.post('/generate-receipt', documentController.generateReceipt);

module.exports = router;