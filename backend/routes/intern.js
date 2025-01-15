// backend/routes/intern.js
const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const internController = require('../controllers/internController');
const assessmentController = require('../controllers/assessmentController');
const reportController = require('../controllers/reportController');


router.use(authMiddleware);


router.get('/stats', internController.getStats);
router.get('/riwayat-data', internController.getHistory);
router.get('/rekap-nilai', assessmentController.getRekapNilai);
router.post('/add-score/:id', assessmentController.addScore);
router.put('/update-nilai/:id', assessmentController.updateScore);
router.get('/check-availability', internController.checkAvailability);
router.get('/export', reportController.exportInternsScore);
router.get('/', internController.getAll);
router.post('/add', authMiddleware, requireRole(['superadmin', 'admin']), internController.add);
router.put('/:id', requireRole(['superadmin', 'admin']), internController.update);
router.get('/:id', internController.getDetail);
router.get('/completing-soon', authMiddleware, internController.getCompletingSoon);
router.delete('/:id', internController.delete);

module.exports = router;