const express = require('express');
const router = express.Router();
const archiveController = require('../controllers/archiveController');
const auth = require('../middleware/auth'); // Uncomment jika pakai auth

// Get all archives with pagination and filters
 router.get('/', archiveController.getArchives);

 // Get bidang list for filter dropdown
router.get('/bidang', archiveController.getBidangList);

// // Download certificate
router.get('/download/:id_magang', archiveController.downloadCertificate);

// // Delete certificate
router.delete('/:id_magang', archiveController.deleteCertificate);

module.exports = router;
