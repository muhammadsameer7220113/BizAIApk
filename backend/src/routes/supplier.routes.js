const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

router.get('/', async (req, res, next) => {
  try {
    const bizId = req.business.business_id;
    const { search } = req.query;
    let sql = `SELECT s.*,
      COALESCE((SELECT SUM(p.total_amount) FROM purchases p WHERE p.supplier_id = s.id AND p.status = 'ACTIVE'), 0) as total_purchases,
      COALESCE((SELECT SUM(sp.amount) FROM supplier_payments sp WHERE sp.supplier_id = s.id), 0) as total_paid,
      COALESCE((SELECT SUM(p.total_amount) FROM purchases p WHERE p.supplier_id = s.id AND p.status = 'ACTIVE'), 0) -
      COALESCE((SELECT SUM(sp.amount) FROM supplier_payments sp WHERE sp.supplier_id = s.id), 0) as outstanding
      FROM suppliers s WHERE s.business_id = ? AND s.is_active = TRUE`;
    const params = [bizId];
    if (search) { sql += ' AND (s.name LIKE ? OR s.company LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    sql += ' ORDER BY s.name';
    const suppliers = await query(sql, params);
    res.json({ success: true, data: suppliers });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const bizId = req.business.business_id;
    const { name, company, phone, address, notes } = req.body;
    if (!name) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Supplier name required' } });
    const [result] = await query('INSERT INTO suppliers (business_id, name, company, phone, address, notes) VALUES (?,?,?,?,?,?)', [bizId, name, company || null, phone || null, address || null, notes || null]);
    res.status(201).json({ success: true, data: { id: result.insertId, name } });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const suppliers = await query('SELECT * FROM suppliers WHERE id = ? AND business_id = ?', [req.params.id, req.business.business_id]);
    if (!suppliers.length) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Supplier not found' } });
    res.json({ success: true, data: suppliers[0] });
  } catch (err) { next(err); }
});

router.get('/:id/summary', async (req, res, next) => {
  try {
    const bizId = req.business.business_id;
    const sid = req.params.id;
    const [[totalRow]] = await query('SELECT COALESCE(SUM(total_amount), 0) as total FROM purchases WHERE supplier_id = ? AND business_id = ? AND status = ?', [sid, bizId, 'ACTIVE']);
    const [[paidRow]] = await query('SELECT COALESCE(SUM(amount), 0) as total FROM supplier_payments WHERE supplier_id = ? AND business_id = ?', [sid, bizId]);
    const outstanding = totalRow.total - paidRow.total;
    res.json({ success: true, data: { total_purchases: totalRow.total, total_paid: paidRow.total, outstanding } });
  } catch (err) { next(err); }
});

router.get('/:id/purchases', async (req, res, next) => {
  try {
    const purchases = await query('SELECT * FROM purchases WHERE supplier_id = ? AND business_id = ? AND status = ? ORDER BY purchase_date DESC', [req.params.id, req.business.business_id, 'ACTIVE']);
    res.json({ success: true, data: purchases });
  } catch (err) { next(err); }
});

router.post('/:id/payments', async (req, res, next) => {
  try {
    const bizId = req.business.business_id;
    const { amount, payment_method, reference_no, note } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Valid amount required' } });
    const [result] = await query('INSERT INTO supplier_payments (business_id, supplier_id, amount, payment_method, reference_no, note, created_by) VALUES (?,?,?,?,?,?,?)',
      [bizId, req.params.id, amount, payment_method || 'CASH', reference_no || null, note || null, req.user.id]);
    res.status(201).json({ success: true, data: { id: result.insertId, message: 'Payment recorded' } });
  } catch (err) { next(err); }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const bizId = req.business.business_id;
    const { name, company, phone, address, notes } = req.body;
    const updates = []; const params = [];
    const fields = { name, company, phone, address, notes };
    for (const [key, val] of Object.entries(fields)) { if (val !== undefined) { updates.push(`${key} = ?`); params.push(val); } }
    if (!updates.length) return res.json({ success: true, data: { message: 'No changes' } });
    params.push(req.params.id, bizId);
    await query(`UPDATE suppliers SET ${updates.join(', ')} WHERE id = ? AND business_id = ?`, params);
    res.json({ success: true, data: { message: 'Supplier updated' } });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await query('UPDATE suppliers SET is_active = FALSE WHERE id = ? AND business_id = ?', [req.params.id, req.business.business_id]);
    res.json({ success: true, data: { message: 'Supplier deleted' } });
  } catch (err) { next(err); }
});

module.exports = router;
