// backend/routes/intern.js
const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const internController = require('../controllers/internController');

router.use(authMiddleware);

// Get all interns with filters
router.get('/', internController.getAll);

// Check availability
router.get('/availability', internController.checkAvailability);

// Get intern statistics
router.get('/stats', internController.getAll);

// Add new intern
router.post('/', requireRole(['superadmin', 'admin']), internController.add);

// Update intern
router.put('/:id', requireRole(['superadmin', 'admin']), internController.update);

// Get intern detail
router.get('/:id', internController.getDetail);

module.exports = router;