const express = require('express');
const router = express.Router();
const { query, transaction } = require('../config/database');

router.get('/', async (req, res, next) => {
  try {
    const bizId = req.business.business_id;
    const { from_date, to_date, customer_id, payment_status, status, page = 1, page_size = 20 } = req.query;
    let sql = `SELECT s.*, c.name as customer_name, c.phone as customer_phone FROM sales s LEFT JOIN customers c ON s.customer_id = c.id WHERE s.business_id = ?`;
    const params = [bizId];
    if (from_date) { sql += ' AND s.sale_date >= ?'; params.push(`${from_date} 00:00:00`); }
    if (to_date) { sql += ' AND s.sale_date <= ?'; params.push(`${to_date} 23:59:59`); }
    if (customer_id) { sql += ' AND s.customer_id = ?'; params.push(customer_id); }
    if (payment_status) { sql += ' AND s.payment_status = ?'; params.push(payment_status); }
    if (status) { sql += ' AND s.status = ?'; params.push(status); } else { sql += " AND s.status = 'ACTIVE'"; }
    sql += ' ORDER BY s.sale_date DESC LIMIT ? OFFSET ?';
    params.push(parseInt(page_size), (parseInt(page) - 1) * parseInt(page_size));
    const sales = await query(sql, params);
    res.json({ success: true, data: sales });
  } catch (err) { next(err); }
});

router.get('/summary', async (req, res, next) => {
  try {
    const bizId = req.business.business_id;
    const { from_date, to_date } = req.query;
    let sql = 'SELECT COUNT(*) as total_bills, COALESCE(SUM(total_amount),0) as total_sales, COALESCE(SUM(paid_amount),0) as total_paid, COALESCE(SUM(credit_amount),0) as total_credit, COALESCE(SUM(cost_amount),0) as total_cogs FROM sales WHERE business_id = ? AND status = ?';
    const params = [bizId, 'ACTIVE'];
    if (from_date) { sql += ' AND sale_date >= ?'; params.push(`${from_date} 00:00:00`); }
    if (to_date) { sql += ' AND sale_date <= ?'; params.push(`${to_date} 23:59:59`); }
    const [summary] = await query(sql, params);
    const grossProfit = summary.total_sales - summary.total_cogs;
    res.json({ success: true, data: { ...summary, gross_profit: grossProfit } });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const bizId = req.business.business_id;
    const { customer_id, sale_date, discount_amount, tax_amount, payment_method, paid_amount, items, notes, client_id, send_receipt_whatsapp, send_receipt_email } = req.body;

    if (!items || !items.length) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'At least one item required' } });

    const result = await transaction(async (conn) => {
      // Generate invoice number
      const [settings] = await conn.execute('SELECT * FROM business_settings WHERE business_id = ? FOR UPDATE', [bizId]);
      const invoiceNo = `${settings[0].invoice_prefix}${String(settings[0].next_invoice_number).padStart(6, '0')}`;
      await conn.execute('UPDATE business_settings SET next_invoice_number = next_invoice_number + 1 WHERE business_id = ?', [bizId]);

      // Calculate totals
      let subtotal = 0;
      let costAmount = 0;
      const itemDetails = [];

      for (const item of items) {
        const [products] = await conn.execute('SELECT * FROM products WHERE id = ? AND business_id = ? AND status = ?', [item.product_id, bizId, 'ACTIVE']);
        if (!products.length) throw Object.assign(new Error(`Product ${item.product_id} not found`), { status: 400, code: 'PRODUCT_NOT_FOUND' });
        const product = products[0];
        const [inv] = await conn.execute('SELECT * FROM inventory WHERE product_id = ? FOR UPDATE', [item.product_id]);
        const currentStock = parseFloat(inv[0].quantity);
        if (currentStock < item.quantity) throw Object.assign(new Error(`Insufficient stock for ${product.name}. Available: ${currentStock}`), { status: 400, code: 'INSUFFICIENT_STOCK' });
        const unitPrice = item.unit_price || product.selling_price;
        const lineDiscount = item.discount_amount || 0;
        const lineTotal = (unitPrice * item.quantity) - lineDiscount;
        const costPrice = product.purchase_price;
        subtotal += lineTotal;
        costAmount += costPrice * item.quantity;
        itemDetails.push({ product_id: item.product_id, product_name: product.name, quantity: item.quantity, unit_price: unitPrice, cost_price: costPrice, discount_amount: lineDiscount, line_total: lineTotal });
      }

      const discount = discount_amount || 0;
      const tax = tax_amount || 0;
      const totalAmount = subtotal - discount + tax;
      const paid = paid_amount !== undefined ? paid_amount : totalAmount;
      const creditAmount = totalAmount - paid;
      let paymentStatus = 'PAID';
      if (paid <= 0) paymentStatus = 'UNPAID';
      else if (paid < totalAmount) paymentStatus = 'PARTIAL';

      if (creditAmount > 0 && !customer_id) throw Object.assign(new Error('Customer required for credit sale'), { status: 400, code: 'VALIDATION_ERROR' });

      // Create sale
      const [sale] = await conn.execute(
        `INSERT INTO sales (business_id, invoice_no, customer_id, client_id, sale_date, subtotal, discount_amount, tax_amount, total_amount, paid_amount, credit_amount, payment_status, cost_amount, notes, created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [bizId, invoiceNo, customer_id || null, client_id || null, sale_date || new Date(), subtotal, discount, tax, totalAmount, paid, creditAmount, paymentStatus, costAmount, notes || null, req.user.id]
      );
      const saleId = sale.insertId;

      // Create sale items + update inventory
      for (const item of itemDetails) {
        await conn.execute(
          'INSERT INTO sale_items (sale_id, product_id, product_name, quantity, unit_price, cost_price, discount_amount, line_total) VALUES (?,?,?,?,?,?,?,?)',
          [saleId, item.product_id, item.product_name, item.quantity, item.unit_price, item.cost_price, item.discount_amount, item.line_total]
        );
        // Update inventory
        const [inv] = await conn.execute('SELECT quantity FROM inventory WHERE product_id = ? FOR UPDATE', [item.product_id]);
        const prevQty = parseFloat(inv[0].quantity);
        const newQty = prevQty - item.quantity;
        await conn.execute('UPDATE inventory SET quantity = ? WHERE product_id = ?', [newQty, item.product_id]);
        await conn.execute(
          'INSERT INTO inventory_transactions (business_id, product_id, type, reference_type, reference_id, previous_quantity, quantity_change, new_quantity, unit_cost, created_by) VALUES (?,?,?,?,?,?,?,?,?,?)',
          [bizId, item.product_id, 'SALE', 'sale', saleId, prevQty, -item.quantity, newQty, item.cost_price, req.user.id]
        );
      }

      // Create payment record
      if (paid > 0) {
        const pm = payment_method || (paid >= totalAmount ? 'CASH' : 'CASH');
        await conn.execute('INSERT INTO sale_payments (sale_id, amount, payment_method) VALUES (?,?,?)', [saleId, paid, pm]);
      }

      // Audit log
      await conn.execute(
        'INSERT INTO audit_logs (business_id, user_id, entity_type, entity_id, action, new_values) VALUES (?,?,?,?,?,?)',
        [bizId, req.user.id, 'sale', saleId, 'SALE_CREATED', JSON.stringify({ invoice_no: invoiceNo, total: totalAmount })]
      );

      return { id: saleId, invoice_no: invoiceNo, total_amount: totalAmount, paid_amount: paid, credit_amount: creditAmount, payment_status: paymentStatus };
    });

    // Trigger receipt notifications (non-blocking)
    try {
      if (customer_id && result.payment_status !== 'UNPAID') {
        const receiptService = require('../services/receipt.service');
        receiptService.triggerReceipt(bizId, result.id, customer_id, send_receipt_whatsapp, send_receipt_email).catch(() => {});
      }
    } catch (e) { /* non-critical */ }

    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const bizId = req.business.business_id;
    const sales = await query(`SELECT s.*, c.name as customer_name, c.phone as customer_phone FROM sales s LEFT JOIN customers c ON s.customer_id = c.id WHERE s.id = ? AND s.business_id = ?`, [req.params.id, bizId]);
    if (!sales.length) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Sale not found' } });
    const items = await query('SELECT * FROM sale_items WHERE sale_id = ?', [req.params.id]);
    const payments = await query('SELECT * FROM sale_payments WHERE sale_id = ?', [req.params.id]);
    res.json({ success: true, data: { ...sales[0], items, payments } });
  } catch (err) { next(err); }
});

router.get('/:id/invoice', async (req, res, next) => {
  try {
    const bizId = req.business.business_id;
    const sales = await query(`SELECT s.*, c.name as customer_name, c.phone as customer_phone FROM sales s LEFT JOIN customers c ON s.customer_id = c.id WHERE s.id = ? AND s.business_id = ?`, [req.params.id, bizId]);
    if (!sales.length) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Sale not found' } });
    const items = await query('SELECT * FROM sale_items WHERE sale_id = ?', [req.params.id]);
    const [business] = await query('SELECT * FROM businesses WHERE id = ?', [bizId]);
    res.json({ success: true, data: { sale: sales[0], items, business: business[0] } });
  } catch (err) { next(err); }
});

router.post('/:id/receipt/send', async (req, res, next) => {
  try {
    const bizId = req.business.business_id;
    const saleId = req.params.id;
    const { channels } = req.body;
    const sales = await query('SELECT * FROM sales WHERE id = ? AND business_id = ?', [saleId, bizId]);
    if (!sales.length) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Sale not found' } });
    if (!sales[0].customer_id) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'No customer linked to this sale' } });
    const receiptService = require('../services/receipt.service');
    const results = await receiptService.triggerReceipt(bizId, saleId, sales[0].customer_id, channels.includes('WHATSAPP'), channels.includes('EMAIL'));
    res.json({ success: true, data: results });
  } catch (err) { next(err); }
});

router.get('/:id/receipt/status', async (req, res, next) => {
  try {
    const bizId = req.business.business_id;
    const notifications = await query('SELECT channel, status, recipient, error_message, sent_at FROM receipt_notifications WHERE sale_id = ? AND business_id = ?', [req.params.id, bizId]);
    const result = { email: null, whatsapp: null };
    for (const n of notifications) {
      result[n.channel.toLowerCase()] = { status: n.status, recipient: n.recipient, sent_at: n.sent_at, error: n.error_message };
    }
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

module.exports = router;
