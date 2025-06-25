// routes/institutions.js
const express = require('express');
const router = express.Router();
const institutionController = require('../controllers/institutionController');
const { authMiddleware } = require('../middleware/auth');

// Routes yang sudah ada
// router.get('/smk', authMiddleware, institutionController.searchSMK);
router.get('/browse', authMiddleware, institutionController.browseWilayah);
router.get('/universities', authMiddleware, institutionController.searchUniversities);
// router.get('/test-dapodik', institutionController.testDapodikAPI);
// router.post('/refresh-smk-cache', institutionController.refreshSMKCache);

// Routes tambahan yang disarankan
// router.get('/test-connection', institutionController.testConnection);
// router.get('/smk/all', authMiddleware, institutionController.getAllSMKSumbar);
// router.get('/smk/:npsn', authMiddleware, institutionController.getSMKDetail);
// router.get('/universities/:id', authMiddleware, institutionController.getUniversityDetail);
// router.post('/refresh-all-cache', authMiddleware, institutionController.refreshAllCache);

module.exports = router;