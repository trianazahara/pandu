// backend/routes/intern.js
const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const internController = require('../controllers/internController');

router.use(authMiddleware);

// Lihat semua anak magang (filtering)
router.get('/', internController.getAll);

// Check availability
router.get('/availability', internController.checkAvailability);

// Get intern statistics
router.get('/stats', internController.getAll);

// Add new intern
router.post('/add', requireRole(['superadmin', 'admin']), internController.add);

// Update intern
router.put('/:id', requireRole(['superadmin', 'admin']), internController.update);

// Get intern detail
router.get('/:id', internController.getDetail);


// Lihat history
router.get('/riwayat-data', internController.getHistory);

// Lihat rekap nilai
router.get('/rekap-nilai', );

router.get('/completing-soon', authMiddleware, internController.getCompletingSoon);
router.put('/intern/:id', authMiddleware, internController.update);
router.post('/intern', authMiddleware, internController.add);


module.exports = router;