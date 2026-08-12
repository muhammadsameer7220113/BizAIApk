const express = require('express');
const router = express.Router();
const { query, transaction } = require('../config/database');

router.post('/', async (req, res, next) => {
  try {
    const { name, owner_name, business_type, phone, address, currency, invoice_prefix } = req.body;
    if (!name || !owner_name || !business_type) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Name, owner name and business type required' } });
    }
    const result = await transaction(async (conn) => {
      const [biz] = await conn.execute(
        'INSERT INTO businesses (name, owner_name, business_type, phone, address, currency, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, owner_name, business_type, phone || null, address || null, currency || 'PKR', req.user.id]
      );
      const bizId = biz.insertId;
      await conn.execute('INSERT INTO business_members (business_id, user_id, role) VALUES (?, ?, ?)', [bizId, req.user.id, 'OWNER']);
      await conn.execute('INSERT INTO business_settings (business_id, invoice_prefix) VALUES (?, ?)', [bizId, invoice_prefix || 'INV-']);
      await conn.execute('INSERT INTO ai_settings (business_id) VALUES (?)', [bizId]);
      const systemCategories = ['General', 'Beverages', 'Snacks', 'Dairy', 'Personal Care', 'Other'];
      for (const cat of systemCategories) {
        await conn.execute('INSERT IGNORE INTO categories (business_id, name) VALUES (?, ?)', [bizId, cat]);
      }
      const systemExpenseCategories = ['Rent', 'Electricity', 'Internet', 'Salary', 'Transport', 'Maintenance', 'Marketing', 'Utilities', 'Miscellaneous'];
      for (const cat of systemExpenseCategories) {
        await conn.execute('INSERT IGNORE INTO expense_categories (business_id, name, is_system) VALUES (?, ?, TRUE)', [bizId, cat]);
      }
      return bizId;
    });
    res.status(201).json({ success: true, data: { id: result, name, owner_name, business_type } });
  } catch (err) { next(err); }
});

router.get('/current', async (req, res, next) => {
  try {
    const businesses = await query(
      'SELECT b.*, bs.invoice_prefix, bs.tax_enabled, bs.default_tax_rate, bs.discount_enabled, bs.payment_methods FROM businesses b LEFT JOIN business_settings bs ON b.id = bs.business_id WHERE b.id = ?',
      [req.business.business_id]
    );
    if (!businesses.length) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Business not found' } });
    res.json({ success: true, data: businesses[0] });
  } catch (err) { next(err); }
});

router.patch('/current', async (req, res, next) => {
  try {
    const { name, phone, address, business_type, currency } = req.body;
    const bizId = req.business.business_id;
    const updates = [];
    const params = [];
    if (name) { updates.push('name = ?'); params.push(name); }
    if (phone) { updates.push('phone = ?'); params.push(phone); }
    if (address) { updates.push('address = ?'); params.push(address); }
    if (business_type) { updates.push('business_type = ?'); params.push(business_type); }
    if (currency) { updates.push('currency = ?'); params.push(currency); }
    if (updates.length) {
      params.push(bizId);
      await query(`UPDATE businesses SET ${updates.join(', ')} WHERE id = ?`, params);
    }
    res.json({ success: true, data: { message: 'Business updated' } });
  } catch (err) { next(err); }
});

router.patch('/settings', async (req, res, next) => {
  try {
    const bizId = req.business.business_id;
    const { invoice_prefix, tax_enabled, default_tax_rate, discount_enabled, low_stock_threshold, payment_methods, barcode_enabled, email_receipt_enabled, whatsapp_receipt_enabled } = req.body;
    const updates = [];
    const params = [];
    if (invoice_prefix !== undefined) { updates.push('invoice_prefix = ?'); params.push(invoice_prefix); }
    if (tax_enabled !== undefined) { updates.push('tax_enabled = ?'); params.push(tax_enabled); }
    if (default_tax_rate !== undefined) { updates.push('default_tax_rate = ?'); params.push(default_tax_rate); }
    if (discount_enabled !== undefined) { updates.push('discount_enabled = ?'); params.push(discount_enabled); }
    if (low_stock_threshold !== undefined) { updates.push('low_stock_threshold = ?'); params.push(low_stock_threshold); }
    if (payment_methods !== undefined) { updates.push('payment_methods = ?'); params.push(JSON.stringify(payment_methods)); }
    if (barcode_enabled !== undefined) { updates.push('barcode_enabled = ?'); params.push(barcode_enabled); }
    if (email_receipt_enabled !== undefined) { updates.push('email_receipt_enabled = ?'); params.push(email_receipt_enabled); }
    if (whatsapp_receipt_enabled !== undefined) { updates.push('whatsapp_receipt_enabled = ?'); params.push(whatsapp_receipt_enabled); }
    if (updates.length) {
      params.push(bizId);
      await query(`UPDATE business_settings SET ${updates.join(', ')} WHERE business_id = ?`, params);
    }
    res.json({ success: true, data: { message: 'Settings updated' } });
  } catch (err) { next(err); }
});

router.get('/settings', async (req, res, next) => {
  try {
    const settings = await query('SELECT * FROM business_settings WHERE business_id = ?', [req.business.business_id]);
    res.json({ success: true, data: settings[0] || {} });
  } catch (err) { next(err); }
});

module.exports = router;
