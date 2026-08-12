const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

router.get('/', async (req, res, next) => {
  try {
    const bizId = req.business.business_id;
    const { from_date, to_date } = req.query;
    let sql = 'SELECT * FROM galla_entries WHERE business_id = ?';
    const params = [bizId];
    if (from_date) { sql += ' AND entry_date >= ?'; params.push(from_date); }
    if (to_date) { sql += ' AND entry_date <= ?'; params.push(to_date); }
    sql += ' ORDER BY entry_date DESC';
    const entries = await query(sql, params);
    res.json({ success: true, data: entries });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const bizId = req.business.business_id;
    const { entry_date, opening_cash, actual_closing, notes } = req.body;
    const date = entry_date || new Date().toISOString().split('T')[0];

    // Calculate cash sales and cash expenses for the day
    const [[cashSales]] = await query("SELECT COALESCE(SUM(paid_amount),0) as total FROM sales WHERE business_id = ? AND status = 'ACTIVE' AND DATE(sale_date) = ? AND payment_method = 'CASH'", [bizId, date]);
    const [[cashExpenses]] = await query("SELECT COALESCE(SUM(amount),0) as total FROM expenses WHERE business_id = ? AND expense_date = ? AND payment_method = 'CASH'", [bizId, date]);

    const opening = parseFloat(opening_cash) || 0;
    const cashSalesTotal = parseFloat(cashSales.total) || 0;
    const cashExpTotal = parseFloat(cashExpenses.total) || 0;
    const expectedClosing = opening + cashSalesTotal - cashExpTotal;
    const actual = parseFloat(actual_closing) || 0;
    const difference = actual - expectedClosing;

    const [result] = await query(
      'INSERT INTO galla_entries (business_id, entry_date, opening_cash, cash_sales, cash_expenses, expected_closing, actual_closing, difference, notes, created_by) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [bizId, date, opening, cashSalesTotal, cashExpTotal, expectedClosing, actual, difference, notes || null, req.user.id]
    );

    res.status(201).json({ success: true, data: { id: result.insertId, opening_cash: opening, cash_sales: cashSalesTotal, cash_expenses: cashExpTotal, expected_closing: expectedClosing, actual_closing: actual, difference } });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, error: { code: 'DUPLICATE', message: 'Galla entry for this date already exists' } });
    next(err);
  }
});

router.get('/today', async (req, res, next) => {
  try {
    const bizId = req.business.business_id;
    const today = new Date().toISOString().split('T')[0];
    const [[cashSales]] = await query("SELECT COALESCE(SUM(paid_amount),0) as total FROM sales WHERE business_id = ? AND status = 'ACTIVE' AND DATE(sale_date) = CURDATE()", [bizId]);
    const [[cashExpenses]] = await query('SELECT COALESCE(SUM(amount),0) as total FROM expenses WHERE business_id = ? AND expense_date = CURDATE()', [bizId]);
    const [[cashPayments]] = await query("SELECT COALESCE(SUM(sp.amount),0) as total FROM sale_payments sp JOIN sales s ON sp.sale_id = s.id WHERE s.business_id = ? AND s.status = 'ACTIVE' AND DATE(s.sale_date) = CURDATE() AND sp.payment_method = 'CASH'", [bizId]);
    res.json({ success: true, data: { total_sales: cashSales.total, total_expenses: cashExpenses.total, cash_sales: cashPayments.total } });
  } catch (err) { next(err); }
});

module.exports = router;
