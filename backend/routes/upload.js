const express = require('express');
const router = express.Router();
const { uploadController, upload } = require('../controllers/uploadController');
// const auth = require('../middleware/auth'); // Uncomment jika pakai auth

// Upload arsip sertifikat
router.post('/arsip-sertifikat/:id_magang', 
    upload.single('arsip_sertifikat'), 
    uploadController.uploadArsipSertifikat
);

// Download arsip sertifikat  
router.get('/arsip-sertifikat/download/:id_magang', 
    uploadController.downloadArsipSertifikat
);

// Delete arsip sertifikat
router.delete('/arsip-sertifikat/:id_magang', 
    uploadController.deleteArsipSertifikat
);

module.exports = router;