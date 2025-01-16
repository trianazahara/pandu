// backend/routes/document.js
const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const documentController = require('../controllers/documentController');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads/templates'));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage });

router.use(authMiddleware);

// Generate acceptance letter
router.get('/acceptance-letter', documentController.generateAcceptanceLetter);

// Generate certificate
router.get('/certificate/:id', documentController.generateCertificate);

// Upload template
router.post('/template', 
    requireRole(['superadmin']), 
    upload.single('template'),
    documentController.uploadTemplate
);

module.exports = router;