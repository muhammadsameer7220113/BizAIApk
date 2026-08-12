const express = require('express');
const router = express.Router();

const { authMiddleware, requireBusiness } = require('../middleware/auth.middleware');

router.use('/auth', require('./auth.routes'));
router.use('/businesses', authMiddleware, require('./business.routes'));
router.use('/categories', authMiddleware, requireBusiness, require('./category.routes'));
router.use('/products', authMiddleware, requireBusiness, require('./product.routes'));
router.use('/inventory', authMiddleware, requireBusiness, require('./inventory.routes'));
router.use('/customers', authMiddleware, requireBusiness, require('./customer.routes'));
router.use('/suppliers', authMiddleware, requireBusiness, require('./supplier.routes'));
router.use('/sales', authMiddleware, requireBusiness, require('./sale.routes'));
router.use('/purchases', authMiddleware, requireBusiness, require('./purchase.routes'));
router.use('/expenses', authMiddleware, requireBusiness, require('./expense.routes'));
router.use('/reports', authMiddleware, requireBusiness, require('./report.routes'));
router.use('/ai', authMiddleware, requireBusiness, require('./ai.routes'));
router.use('/notifications', authMiddleware, requireBusiness, require('./notification.routes'));
router.use('/exports', authMiddleware, requireBusiness, require('./export.routes'));
router.use('/galla', authMiddleware, requireBusiness, require('./galla.routes'));

module.exports = router;
