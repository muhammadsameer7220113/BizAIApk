const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

router.get('/', async (req, res, next) => {
  try {
    const bizId = req.business.business_id;
    const { search, page = 1, page_size = 20 } = req.query;
    let sql = `SELECT c.*, 
      COALESCE((SELECT SUM(s.total_amount) FROM sales s WHERE s.customer_id = c.id AND s.status = 'ACTIVE'), 0) as total_purchases,
      COALESCE((SELECT SUM(sp.amount) FROM customer_payments sp WHERE sp.customer_id = c.id), 0) as total_paid,
      COALESCE((SELECT SUM(s.credit_amount) FROM sales s WHERE s.customer_id = c.id AND s.status = 'ACTIVE'), 0) - 
      COALESCE((SELECT SUM(sp.amount) FROM customer_payments sp WHERE sp.customer_id = c.id), 0) as outstanding
      FROM customers c WHERE c.business_id = ? AND c.is_active = TRUE`;
    const params = [bizId];
    if (search) { sql += ' AND (c.name LIKE ? OR c.phone LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    sql += ' ORDER BY c.name LIMIT ? OFFSET ?';
    params.push(parseInt(page_size), (parseInt(page) - 1) * parseInt(page_size));
    const customers = await query(sql, params);
    res.json({ success: true, data: customers });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const bizId = req.business.business_id;
    const { name, phone, email, whatsapp_number, address, notes, credit_limit, send_receipt_by_whatsapp, send_receipt_by_email } = req.body;
    if (!name) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Customer name required' } });
    const [result] = await query(
      'INSERT INTO customers (business_id, name, phone, email, whatsapp_number, address, notes, credit_limit, send_receipt_by_whatsapp, send_receipt_by_email, whatsapp_opt_in_at, email_opt_in_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
      [bizId, name, phone || null, email || null, whatsapp_number || null, address || null, notes || null, credit_limit || 0, send_receipt_by_whatsapp || false, send_receipt_by_email || false, send_receipt_by_whatsapp ? new Date() : null, send_receipt_by_email ? new Date() : null]
    );
    res.status(201).json({ success: true, data: { id: result.insertId, name } });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const bizId = req.business.business_id;
    const customers = await query('SELECT * FROM customers WHERE id = ? AND business_id = ?', [req.params.id, bizId]);
    if (!customers.length) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Customer not found' } });
    res.json({ success: true, data: customers[0] });
  } catch (err) { next(err); }
});

router.get('/:id/summary', async (req, res, next) => {
  try {
    const bizId = req.business.business_id;
    const cid = req.params.id;
    const [[totalRow]] = await query('SELECT COALESCE(SUM(total_amount), 0) as total FROM sales WHERE customer_id = ? AND business_id = ? AND status = ?', [cid, bizId, 'ACTIVE']);
    const [[paidRow]] = await query('SELECT COALESCE(SUM(amount), 0) as total FROM customer_payments WHERE customer_id = ? AND business_id = ?', [cid, bizId]);
    const [[lastSale]] = await query('SELECT sale_date FROM sales WHERE customer_id = ? AND business_id = ? AND status = ? ORDER BY sale_date DESC LIMIT 1', [cid, bizId, 'ACTIVE']);
    const totalPurchases = totalRow.total;
    const totalPaid = paidRow.total;
    const outstanding = totalPurchases - totalPaid;
    res.json({ success: true, data: { total_purchases: totalPurchases, total_paid: totalPaid, outstanding, last_purchase: lastSale ? lastSale.sale_date : null } });
  } catch (err) { next(err); }
});

router.get('/:id/sales', async (req, res, next) => {
  try {
    const bizId = req.business.business_id;
    const sales = await query('SELECT * FROM sales WHERE customer_id = ? AND business_id = ? AND status = ? ORDER BY sale_date DESC', [req.params.id, bizId, 'ACTIVE']);
    res.json({ success: true, data: sales });
  } catch (err) { next(err); }
});

router.get('/:id/payments', async (req, res, next) => {
  try {
    const bizId = req.business.business_id;
    const payments = await query('SELECT * FROM customer_payments WHERE customer_id = ? AND business_id = ? ORDER BY created_at DESC', [req.params.id, bizId]);
    res.json({ success: true, data: payments });
  } catch (err) { next(err); }
});

router.post('/:id/payments', async (req, res, next) => {
  try {
    const bizId = req.business.business_id;
    const { amount, payment_method, reference_no, note } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Valid amount required' } });
    const [result] = await query(
      'INSERT INTO customer_payments (business_id, customer_id, amount, payment_method, reference_no, note, created_by) VALUES (?,?,?,?,?,?,?)',
      [bizId, req.params.id, amount, payment_method || 'CASH', reference_no || null, note || null, req.user.id]
    );
    res.status(201).json({ success: true, data: { id: result.insertId, message: 'Payment recorded' } });
  } catch (err) { next(err); }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const bizId = req.business.business_id;
    const { name, phone, email, whatsapp_number, address, notes, credit_limit, send_receipt_by_whatsapp, send_receipt_by_email } = req.body;
    const updates = []; const params = [];
    const fields = { name, phone, email, whatsapp_number, address, notes, credit_limit, send_receipt_by_whatsapp, send_receipt_by_email };
    for (const [key, val] of Object.entries(fields)) {
      if (val !== undefined) { updates.push(`${key} = ?`); params.push(val); }
    }
    if (!updates.length) return res.json({ success: true, data: { message: 'No changes' } });
    params.push(req.params.id, bizId);
    await query(`UPDATE customers SET ${updates.join(', ')} WHERE id = ? AND business_id = ?`, params);
    res.json({ success: true, data: { message: 'Customer updated' } });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await query('UPDATE customers SET is_active = FALSE WHERE id = ? AND business_id = ?', [req.params.id, req.business.business_id]);
    res.json({ success: true, data: { message: 'Customer deleted' } });
  } catch (err) { next(err); }
});

module.exports = router;
