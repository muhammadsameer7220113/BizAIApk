const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

router.get('/', async (req, res, next) => {
  try {
    const bizId = req.business.business_id;
    const notifications = await query('SELECT * FROM notifications WHERE business_id = ? ORDER BY created_at DESC LIMIT 50', [bizId]);
    res.json({ success: true, data: notifications });
  } catch (err) { next(err); }
});

router.patch('/:id/read', async (req, res, next) => {
  try {
    await query('UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE id = ? AND business_id = ?', [req.params.id, req.business.business_id]);
    res.json({ success: true, data: { message: 'Marked as read' } });
  } catch (err) { next(err); }
});

router.patch('/read-all', async (req, res, next) => {
  try {
    await query('UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE business_id = ? AND is_read = FALSE', [req.business.business_id]);
    res.json({ success: true, data: { message: 'All marked as read' } });
  } catch (err) { next(err); }
});

module.exports = router;
