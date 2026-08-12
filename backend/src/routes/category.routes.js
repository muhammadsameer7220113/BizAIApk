const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

router.get('/', async (req, res, next) => {
  try {
    const bizId = req.business.business_id;
    const cats = await query('SELECT * FROM categories WHERE business_id = ? AND is_active = TRUE ORDER BY name', [bizId]);
    res.json({ success: true, data: cats });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const bizId = req.business.business_id;
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Category name required' } });
    const [result] = await query('INSERT INTO categories (business_id, name) VALUES (?, ?)', [bizId, name]);
    res.status(201).json({ success: true, data: { id: result.insertId, name } });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, error: { code: 'DUPLICATE', message: 'Category already exists' } });
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const { name, is_active } = req.body;
    const updates = []; const params = [];
    if (name) { updates.push('name = ?'); params.push(name); }
    if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active); }
    params.push(req.params.id, req.business.business_id);
    await query(`UPDATE categories SET ${updates.join(', ')} WHERE id = ? AND business_id = ?`, params);
    res.json({ success: true, data: { message: 'Category updated' } });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await query('UPDATE categories SET is_active = FALSE WHERE id = ? AND business_id = ?', [req.params.id, req.business.business_id]);
    res.json({ success: true, data: { message: 'Category deleted' } });
  } catch (err) { next(err); }
});

module.exports = router;
