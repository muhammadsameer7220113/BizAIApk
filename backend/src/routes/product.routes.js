const express = require('express');
const router = express.Router();
const { query, transaction } = require('../config/database');

router.get('/', async (req, res, next) => {
  try {
    const bizId = req.business.business_id;
    const { search, category_id, status, page = 1, page_size = 20 } = req.query;
    let sql = 'SELECT p.*, c.name as category_name, COALESCE(i.quantity, 0) as stock FROM products p LEFT JOIN categories c ON p.category_id = c.id LEFT JOIN inventory i ON p.id = i.product_id WHERE p.business_id = ?';
    const params = [bizId];
    if (search) { sql += ' AND p.name LIKE ?'; params.push(`%${search}%`); }
    if (category_id) { sql += ' AND p.category_id = ?'; params.push(category_id); }
    if (status) { sql += ' AND p.status = ?'; params.push(status); }
    sql += ' ORDER BY p.name LIMIT ? OFFSET ?';
    params.push(parseInt(page_size), (parseInt(page) - 1) * parseInt(page_size));
    const products = await query(sql, params);
    let countSql = 'SELECT COUNT(*) as total FROM products p WHERE p.business_id = ?';
    const countParams = [bizId];
    if (search) { countSql += ' AND p.name LIKE ?'; countParams.push(`%${search}%`); }
    if (category_id) { countSql += ' AND p.category_id = ?'; countParams.push(category_id); }
    if (status) { countSql += ' AND p.status = ?'; countParams.push(status); }
    const [{ total }] = await query(countSql, countParams);
    res.json({ success: true, data: products, meta: { total, page: parseInt(page), page_size: parseInt(page_size) } });
  } catch (err) { next(err); }
});

router.get('/low-stock', async (req, res, next) => {
  try {
    const bizId = req.business.business_id;
    const products = await query(
      'SELECT p.*, COALESCE(i.quantity, 0) as stock FROM products p LEFT JOIN inventory i ON p.id = i.product_id WHERE p.business_id = ? AND p.status = ? AND COALESCE(i.quantity, 0) <= p.min_stock ORDER BY COALESCE(i.quantity, 0) ASC',
      [bizId, 'ACTIVE']
    );
    res.json({ success: true, data: products });
  } catch (err) { next(err); }
});

router.get('/search', async (req, res, next) => {
  try {
    const bizId = req.business.business_id;
    const { q } = req.query;
    if (!q) return res.json({ success: true, data: [] });
    const products = await query(
      'SELECT p.*, c.name as category_name, COALESCE(i.quantity, 0) as stock FROM products p LEFT JOIN categories c ON p.category_id = c.id LEFT JOIN inventory i ON p.id = i.product_id WHERE p.business_id = ? AND (p.name LIKE ? OR p.barcode = ? OR p.sku = ?) AND p.status = ? LIMIT 50',
      [bizId, `%${q}%`, q, q, 'ACTIVE']
    );
    res.json({ success: true, data: products });
  } catch (err) { next(err); }
});

router.get('/barcode/:barcode', async (req, res, next) => {
  try {
    const bizId = req.business.business_id;
    const products = await query(
      'SELECT p.*, COALESCE(i.quantity, 0) as stock FROM products p LEFT JOIN inventory i ON p.id = i.product_id WHERE p.business_id = ? AND p.barcode = ?',
      [bizId, req.params.barcode]
    );
    if (!products.length) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } });
    res.json({ success: true, data: products[0] });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const bizId = req.business.business_id;
    const { name, sku, barcode, category_id, brand, unit, purchase_price, selling_price, min_stock, expiry_date, description, image_url } = req.body;
    if (!name) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Product name required' } });
    const result = await transaction(async (conn) => {
      const [prod] = await conn.execute(
        'INSERT INTO products (business_id, name, sku, barcode, category_id, brand, unit, purchase_price, selling_price, min_stock, expiry_date, description, image_url) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
        [bizId, name, sku || null, barcode || null, category_id || null, brand || null, unit || 'pcs', purchase_price || 0, selling_price || 0, min_stock || 0, expiry_date || null, description || null, image_url || null]
      );
      await conn.execute('INSERT INTO inventory (business_id, product_id, quantity) VALUES (?, ?, ?)', [bizId, prod.insertId, 0]);
      await conn.execute(
        'INSERT INTO inventory_transactions (business_id, product_id, type, previous_quantity, quantity_change, new_quantity, reason, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [bizId, prod.insertId, 'INITIAL', 0, 0, 0, 'Product created', req.user.id]
      );
      return prod.insertId;
    });
    res.status(201).json({ success: true, data: { id: result, name } });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, error: { code: 'DUPLICATE', message: 'Product with this barcode already exists' } });
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const bizId = req.business.business_id;
    const products = await query(
      'SELECT p.*, c.name as category_name, COALESCE(i.quantity, 0) as stock FROM products p LEFT JOIN categories c ON p.category_id = c.id LEFT JOIN inventory i ON p.id = i.product_id WHERE p.id = ? AND p.business_id = ?',
      [req.params.id, bizId]
    );
    if (!products.length) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } });
    res.json({ success: true, data: products[0] });
  } catch (err) { next(err); }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const bizId = req.business.business_id;
    const { name, sku, barcode, category_id, brand, unit, purchase_price, selling_price, min_stock, expiry_date, description, image_url, status } = req.body;
    const updates = []; const params = [];
    const fields = { name, sku, barcode, category_id, brand, unit, purchase_price, selling_price, min_stock, expiry_date, description, image_url, status };
    for (const [key, val] of Object.entries(fields)) {
      if (val !== undefined) { updates.push(`${key} = ?`); params.push(val); }
    }
    if (!updates.length) return res.json({ success: true, data: { message: 'No changes' } });
    params.push(req.params.id, bizId);
    await query(`UPDATE products SET ${updates.join(', ')} WHERE id = ? AND business_id = ?`, params);
    res.json({ success: true, data: { message: 'Product updated' } });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const bizId = req.business.business_id;
    await query('UPDATE products SET status = ? WHERE id = ? AND business_id = ?', ['INACTIVE', req.params.id, bizId]);
    res.json({ success: true, data: { message: 'Product deleted' } });
  } catch (err) { next(err); }
});

module.exports = router;
