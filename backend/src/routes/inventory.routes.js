const express = require('express');
const router = express.Router();
const { query, transaction } = require('../config/database');

router.get('/', async (req, res, next) => {
  try {
    const bizId = req.business.business_id;
    const { search, page = 1, page_size = 20 } = req.query;
    let sql = 'SELECT i.*, p.name as product_name, p.unit, p.purchase_price, p.selling_price, p.min_stock FROM inventory i JOIN products p ON i.product_id = p.id WHERE i.business_id = ? AND p.status = ?';
    const params = [bizId, 'ACTIVE'];
    if (search) { sql += ' AND p.name LIKE ?'; params.push(`%${search}%`); }
    sql += ' ORDER BY p.name LIMIT ? OFFSET ?';
    params.push(parseInt(page_size), (parseInt(page) - 1) * parseInt(page_size));
    const items = await query(sql, params);
    res.json({ success: true, data: items });
  } catch (err) { next(err); }
});

router.post('/adjust', async (req, res, next) => {
  try {
    const bizId = req.business.business_id;
    const { product_id, new_quantity, reason, adjustment_type } = req.body;
    if (!product_id || new_quantity === undefined) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Product ID and new quantity required' } });
    }
    await transaction(async (conn) => {
      const [inv] = await conn.execute('SELECT * FROM inventory WHERE product_id = ? AND business_id = ? FOR UPDATE', [product_id, bizId]);
      if (!inv.length) throw Object.assign(new Error('Product not found'), { status: 404, code: 'NOT_FOUND' });
      const prevQty = parseFloat(inv[0].quantity);
      const newQty = parseFloat(new_quantity);
      const change = newQty - prevQty;
      await conn.execute('UPDATE inventory SET quantity = ? WHERE product_id = ? AND business_id = ?', [newQty, product_id, bizId]);
      await conn.execute(
        'INSERT INTO inventory_transactions (business_id, product_id, type, previous_quantity, quantity_change, new_quantity, reason, created_by) VALUES (?,?,?,?,?,?,?,?)',
        [bizId, product_id, 'ADJUSTMENT', prevQty, change, newQty, reason || 'Manual adjustment', req.user.id]
      );
    });
    res.json({ success: true, data: { message: 'Inventory adjusted' } });
  } catch (err) { next(err); }
});

router.get('/transactions', async (req, res, next) => {
  try {
    const bizId = req.business.business_id;
    const { product_id, page = 1, page_size = 50 } = req.query;
    let sql = 'SELECT it.*, p.name as product_name FROM inventory_transactions it JOIN products p ON it.product_id = p.id WHERE it.business_id = ?';
    const params = [bizId];
    if (product_id) { sql += ' AND it.product_id = ?'; params.push(product_id); }
    sql += ' ORDER BY it.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(page_size), (parseInt(page) - 1) * parseInt(page_size));
    const txns = await query(sql, params);
    res.json({ success: true, data: txns });
  } catch (err) { next(err); }
});

router.get('/product/:productId/history', async (req, res, next) => {
  try {
    const bizId = req.business.business_id;
    const txns = await query(
      'SELECT * FROM inventory_transactions WHERE product_id = ? AND business_id = ? ORDER BY created_at DESC',
      [req.params.productId, bizId]
    );
    res.json({ success: true, data: txns });
  } catch (err) { next(err); }
});

module.exports = router;
