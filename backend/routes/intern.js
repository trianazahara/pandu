// backend/routes/intern.js
const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const internController = require('../controllers/internController');
const assessmentController = require('../controllers/assessmentController');
const reportController = require('../controllers/reportController');

router.use(authMiddleware);

// Stats route should come before /:id route
router.get('/stats', internController.getStats);
router.get('/completing-soon', internController.getCompletingSoon);
router.get('/availability', internController.checkAvailability);
router.get('/riwayat-data', internController.getHistory);
router.get('/rekap-nilai', assessmentController.getRekapNilai);
router.post('/add-score/:id', assessmentController.addScore);
router.put('/update-nilai/:id', assessmentController.updateScore);

// export excel
router.get('/export', reportController.exportInternsScore);

// General CRUD routes
router.get('/', internController.getAll);
router.post('/add', requireRole(['superadmin', 'admin']), internController.add);
router.get('/:id', internController.getDetail);
router.put('/:id', requireRole(['superadmin', 'admin']), internController.update);

// Remove duplicate routes
// router.put('/:id', authMiddleware, internController.update);
// router.post('/add-new', authMiddleware, internController.add);

module.exports = router;