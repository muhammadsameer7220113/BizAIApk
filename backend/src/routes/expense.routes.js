const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

router.get('/categories', async (req, res, next) => {
  try {
    const cats = await query('SELECT * FROM expense_categories WHERE business_id = ? AND is_active = TRUE ORDER BY name', [req.business.business_id]);
    res.json({ success: true, data: cats });
  } catch (err) { next(err); }
});

router.post('/categories', async (req, res, next) => {
  try {
    const bizId = req.business.business_id;
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Category name required' } });
    const [result] = await query('INSERT INTO expense_categories (business_id, name) VALUES (?,?)', [bizId, name]);
    res.status(201).json({ success: true, data: { id: result.insertId, name } });
  } catch (err) { next(err); }
});

router.get('/', async (req, res, next) => {
  try {
    const bizId = req.business.business_id;
    const { from_date, to_date, category_id, page = 1, page_size = 20 } = req.query;
    let sql = 'SELECT e.*, ec.name as category_name FROM expenses e JOIN expense_categories ec ON e.expense_category_id = ec.id WHERE e.business_id = ?';
    const params = [bizId];
    if (from_date) { sql += ' AND e.expense_date >= ?'; params.push(from_date); }
    if (to_date) { sql += ' AND e.expense_date <= ?'; params.push(to_date); }
    if (category_id) { sql += ' AND e.expense_category_id = ?'; params.push(category_id); }
    sql += ' ORDER BY e.expense_date DESC LIMIT ? OFFSET ?';
    params.push(parseInt(page_size), (parseInt(page) - 1) * parseInt(page_size));
    const expenses = await query(sql, params);
    res.json({ success: true, data: expenses });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const bizId = req.business.business_id;
    const { title, amount, expense_category_id, expense_date, payment_method, description } = req.body;
    if (!title || !amount || !expense_category_id) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Title, amount and category required' } });
    const [result] = await query(
      'INSERT INTO expenses (business_id, expense_category_id, title, amount, expense_date, payment_method, description, created_by) VALUES (?,?,?,?,?,?,?,?)',
      [bizId, expense_category_id, title, amount, expense_date || new Date().toISOString().split('T')[0], payment_method || 'CASH', description || null, req.user.id]
    );
    await query('INSERT INTO audit_logs (business_id, user_id, entity_type, entity_id, action, new_values) VALUES (?,?,?,?,?,?)',
      [bizId, req.user.id, 'expense', result.insertId, 'EXPENSE_CREATED', JSON.stringify({ amount })]);
    res.status(201).json({ success: true, data: { id: result.insertId, message: 'Expense recorded' } });
  } catch (err) { next(err); }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const { title, amount, expense_category_id, expense_date, payment_method, description } = req.body;
    const updates = []; const params = [];
    const fields = { title, amount, expense_category_id, expense_date, payment_method, description };
    for (const [key, val] of Object.entries(fields)) { if (val !== undefined) { updates.push(`${key} = ?`); params.push(val); } }
    if (updates.length) { params.push(req.params.id, req.business.business_id); await query(`UPDATE expenses SET ${updates.join(', ')} WHERE id = ? AND business_id = ?`, params); }
    res.json({ success: true, data: { message: 'Expense updated' } });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await query('DELETE FROM expenses WHERE id = ? AND business_id = ?', [req.params.id, req.business.business_id]);
    res.json({ success: true, data: { message: 'Expense deleted' } });
  } catch (err) { next(err); }
});

module.exports = router;
