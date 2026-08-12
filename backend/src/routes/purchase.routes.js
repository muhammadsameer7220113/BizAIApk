const express = require('express');
const router = express.Router();
const { query, transaction } = require('../config/database');

router.get('/', async (req, res, next) => {
  try {
    const bizId = req.business.business_id;
    const { from_date, to_date, supplier_id, page = 1, page_size = 20 } = req.query;
    let sql = 'SELECT p.*, s.name as supplier_name FROM purchases p JOIN suppliers s ON p.supplier_id = s.id WHERE p.business_id = ?';
    const params = [bizId];
    if (from_date) { sql += ' AND p.purchase_date >= ?'; params.push(`${from_date} 00:00:00`); }
    if (to_date) { sql += ' AND p.purchase_date <= ?'; params.push(`${to_date} 23:59:59`); }
    if (supplier_id) { sql += ' AND p.supplier_id = ?'; params.push(supplier_id); }
    sql += " AND p.status = 'ACTIVE' ORDER BY p.purchase_date DESC LIMIT ? OFFSET ?";
    params.push(parseInt(page_size), (parseInt(page) - 1) * parseInt(page_size));
    const purchases = await query(sql, params);
    res.json({ success: true, data: purchases });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const bizId = req.business.business_id;
    const { supplier_id, purchase_date, discount_amount, tax_amount, paid_amount, items, reference_no, notes } = req.body;
    if (!supplier_id) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Supplier required' } });
    if (!items || !items.length) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'At least one item required' } });

    const result = await transaction(async (conn) => {
      let subtotal = 0;
      const itemDetails = [];
      for (const item of items) {
        const [products] = await conn.execute('SELECT * FROM products WHERE id = ? AND business_id = ?', [item.product_id, bizId]);
        if (!products.length) throw Object.assign(new Error(`Product not found`), { status: 400, code: 'PRODUCT_NOT_FOUND' });
        const product = products[0];
        const unitCost = item.unit_cost || item.unit_price || product.purchase_price;
        const lineDiscount = item.discount_amount || 0;
        const lineTotal = (unitCost * item.quantity) - lineDiscount;
        subtotal += lineTotal;
        itemDetails.push({ product_id: item.product_id, product_name: product.name, quantity: item.quantity, unit_cost: unitCost, discount_amount: lineDiscount, line_total: lineTotal });
      }
      const discount = discount_amount || 0;
      const tax = tax_amount || 0;
      const totalAmount = subtotal - discount + tax;
      const paid = paid_amount !== undefined ? paid_amount : 0;
      const creditAmount = totalAmount - paid;
      let paymentStatus = 'UNPAID';
      if (paid >= totalAmount) paymentStatus = 'PAID';
      else if (paid > 0) paymentStatus = 'PARTIAL';

      const [purchase] = await conn.execute(
        'INSERT INTO purchases (business_id, supplier_id, reference_no, purchase_date, subtotal, discount_amount, tax_amount, total_amount, paid_amount, credit_amount, payment_status, notes, created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
        [bizId, supplier_id, reference_no || null, purchase_date || new Date(), subtotal, discount, tax, totalAmount, paid, creditAmount, paymentStatus, notes || null, req.user.id]
      );
      const purchaseId = purchase.insertId;

      for (const item of itemDetails) {
        await conn.execute(
          'INSERT INTO purchase_items (purchase_id, product_id, product_name, quantity, unit_cost, discount_amount, line_total) VALUES (?,?,?,?,?,?,?)',
          [purchaseId, item.product_id, item.product_name, item.quantity, item.unit_cost, item.discount_amount, item.line_total]
        );
        // Update inventory
        const [inv] = await conn.execute('SELECT quantity FROM inventory WHERE product_id = ? FOR UPDATE', [item.product_id]);
        const prevQty = inv.length ? parseFloat(inv[0].quantity) : 0;
        const newQty = prevQty + item.quantity;
        if (inv.length) {
          await conn.execute('UPDATE inventory SET quantity = ? WHERE product_id = ?', [newQty, item.product_id]);
        } else {
          await conn.execute('INSERT INTO inventory (business_id, product_id, quantity) VALUES (?,?,?)', [bizId, item.product_id, newQty]);
        }
        await conn.execute(
          'INSERT INTO inventory_transactions (business_id, product_id, type, reference_type, reference_id, previous_quantity, quantity_change, new_quantity, unit_cost, created_by) VALUES (?,?,?,?,?,?,?,?,?,?)',
          [bizId, item.product_id, 'PURCHASE', 'purchase', purchaseId, prevQty, item.quantity, newQty, item.unit_cost, req.user.id]
        );
      }

      if (paid > 0) {
        await conn.execute('INSERT INTO purchase_payments (purchase_id, amount, payment_method) VALUES (?,?,?)', [purchaseId, paid, 'CASH']);
      }

      await conn.execute('INSERT INTO audit_logs (business_id, user_id, entity_type, entity_id, action, new_values) VALUES (?,?,?,?,?,?)',
        [bizId, req.user.id, 'purchase', purchaseId, 'PURCHASE_CREATED', JSON.stringify({ total: totalAmount })]);

      return { id: purchaseId, total_amount: totalAmount, paid_amount: paid, credit_amount: creditAmount, payment_status: paymentStatus };
    });

    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const bizId = req.business.business_id;
    const purchases = await query('SELECT p.*, s.name as supplier_name FROM purchases p JOIN suppliers s ON p.supplier_id = s.id WHERE p.id = ? AND p.business_id = ?', [req.params.id, bizId]);
    if (!purchases.length) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Purchase not found' } });
    const items = await query('SELECT * FROM purchase_items WHERE purchase_id = ?', [req.params.id]);
    res.json({ success: true, data: { ...purchases[0], items } });
  } catch (err) { next(err); }
});

module.exports = router;
