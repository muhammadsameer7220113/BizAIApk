const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

function dateFilter(from_date, to_date) {
  let sql = '';
  const params = [];
  if (from_date) { sql += ' AND date_col >= ?'; params.push(`${from_date} 00:00:00`); }
  if (to_date) { sql += ' AND date_col <= ?'; params.push(`${to_date} 23:59:59`); }
  return { sql, params };
}

router.get('/dashboard', async (req, res, next) => {
  try {
    const bizId = req.business.business_id;
    const { from_date, to_date } = req.query;
    const df = from_date ? ` AND sale_date >= '${from_date} 00:00:00'` : " AND DATE(sale_date) = CURDATE()";
    const dt = to_date ? ` AND sale_date <= '${to_date} 23:59:59'` : '';
    const edf = from_date ? ` AND expense_date >= '${from_date}'` : " AND expense_date = CURDATE()";
    const edt = to_date ? ` AND expense_date <= '${to_date}'` : '';

    const [[salesRow]] = await query(`SELECT COALESCE(SUM(total_amount),0) as total_sales, COALESCE(SUM(paid_amount),0) as total_paid, COALESCE(SUM(credit_amount),0) as total_credit, COUNT(*) as total_bills, COALESCE(SUM(cost_amount),0) as total_cogs FROM sales WHERE business_id = ? AND status = 'ACTIVE'${df}${dt}`, [bizId]);
    const [[expensesRow]] = await query(`SELECT COALESCE(SUM(amount),0) as total_expenses FROM expenses WHERE business_id = ?${edf}${edt}`, [bizId]);
    const [[customersRow]] = await query('SELECT COUNT(*) as total FROM customers WHERE business_id = ? AND is_active = TRUE', [bizId]);
    const [[productsRow]] = await query('SELECT COUNT(*) as total FROM products WHERE business_id = ? AND status = ?', [bizId, 'ACTIVE']);
    const [[lowStockRow]] = await query('SELECT COUNT(*) as total FROM products p LEFT JOIN inventory i ON p.id = i.product_id WHERE p.business_id = ? AND p.status = ? AND COALESCE(i.quantity,0) <= p.min_stock', [bizId, 'ACTIVE']);
    const [[udhaarRow]] = await query("SELECT COALESCE(SUM(credit_amount),0) - COALESCE((SELECT SUM(cp.amount) FROM customer_payments cp WHERE cp.business_id = ?),0) as total FROM sales s WHERE s.business_id = ? AND s.status = 'ACTIVE' AND s.payment_status != 'PAID'", [bizId, bizId]);
    const [[supplierPayables]] = await query("SELECT COALESCE(SUM(p.total_amount),0) - COALESCE((SELECT SUM(sp.amount) FROM supplier_payments sp WHERE sp.business_id = ?),0) as total FROM purchases p WHERE p.business_id = ? AND p.status = 'ACTIVE'", [bizId, bizId]);

    const grossProfit = salesRow.total_sales - salesRow.total_cogs;
    const netProfit = grossProfit - expensesRow.total_expenses;

    res.json({
      success: true,
      data: {
        today_sales: salesRow.total_sales,
        today_profit: grossProfit,
        today_expenses: expensesRow.total_expenses,
        net_profit: netProfit,
        bills_today: salesRow.total_bills,
        total_paid: salesRow.total_paid,
        total_credit: salesRow.total_credit,
        total_customers: customersRow.total,
        total_products: productsRow.total,
        low_stock_items: lowStockRow.total,
        customer_udhaar: Math.max(0, udhaarRow.total),
        supplier_payables: Math.max(0, supplierPayables.total)
      }
    });
  } catch (err) { next(err); }
});

router.get('/sales-trend', async (req, res, next) => {
  try {
    const bizId = req.business.business_id;
    const { from_date, to_date, group_by = 'day' } = req.query;
    const df = from_date || new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    const dt = to_date || new Date().toISOString().split('T')[0];
    const groupExpr = group_by === 'month' ? 'DATE_FORMAT(sale_date, "%Y-%m")' : 'DATE(sale_date)';
    const rows = await query(
      `SELECT ${groupExpr} as period, COALESCE(SUM(total_amount),0) as sales, COALESCE(SUM(cost_amount),0) as cogs, COUNT(*) as bills FROM sales WHERE business_id = ? AND status = 'ACTIVE' AND sale_date >= ? AND sale_date <= ? GROUP BY period ORDER BY period`,
      [bizId, `${df} 00:00:00`, `${dt} 23:59:59`]
    );
    res.json({ success: true, data: rows.map(r => ({ ...r, profit: r.sales - r.cogs })) });
  } catch (err) { next(err); }
});

router.get('/top-products', async (req, res, next) => {
  try {
    const bizId = req.business.business_id;
    const { from_date, to_date, limit = 10 } = req.query;
    let sql = "SELECT si.product_id, si.product_name, SUM(si.quantity) as total_qty, SUM(si.line_total) as total_revenue, SUM(si.quantity * si.cost_price) as total_cogs FROM sale_items si JOIN sales s ON si.sale_id = s.id WHERE s.business_id = ? AND s.status = 'ACTIVE'";
    const params = [bizId];
    if (from_date) { sql += ' AND s.sale_date >= ?'; params.push(`${from_date} 00:00:00`); }
    if (to_date) { sql += ' AND s.sale_date <= ?'; params.push(`${to_date} 23:59:59`); }
    sql += ' GROUP BY si.product_id, si.product_name ORDER BY total_revenue DESC LIMIT ?';
    params.push(parseInt(limit));
    const rows = await query(sql, params);
    res.json({ success: true, data: rows.map(r => ({ ...r, profit: r.total_revenue - r.total_cogs })) });
  } catch (err) { next(err); }
});

router.get('/profit-summary', async (req, res, next) => {
  try {
    const bizId = req.business.business_id;
    const { from_date, to_date } = req.query;
    let sql = "SELECT COALESCE(SUM(total_amount),0) as revenue, COALESCE(SUM(cost_amount),0) as cogs FROM sales WHERE business_id = ? AND status = 'ACTIVE'";
    const params = [bizId];
    if (from_date) { sql += ' AND sale_date >= ?'; params.push(`${from_date} 00:00:00`); }
    if (to_date) { sql += ' AND sale_date <= ?'; params.push(`${to_date} 23:59:59`); }
    const [salesData] = await query(sql, params);
    let expSql = 'SELECT COALESCE(SUM(amount),0) as total FROM expenses WHERE business_id = ?';
    const expParams = [bizId];
    if (from_date) { expSql += ' AND expense_date >= ?'; expParams.push(from_date); }
    if (to_date) { expSql += ' AND expense_date <= ?'; expParams.push(to_date); }
    const [expData] = await query(expSql, expParams);
    const grossProfit = salesData.revenue - salesData.cogs;
    res.json({ success: true, data: { revenue: salesData.revenue, cogs: salesData.cogs, gross_profit: grossProfit, expenses: expData.total, net_profit: grossProfit - expData.total } });
  } catch (err) { next(err); }
});

router.get('/expense-summary', async (req, res, next) => {
  try {
    const bizId = req.business.business_id;
    const { from_date, to_date } = req.query;
    let sql = 'SELECT ec.name as category, COALESCE(SUM(e.amount),0) as total FROM expenses e JOIN expense_categories ec ON e.expense_category_id = ec.id WHERE e.business_id = ?';
    const params = [bizId];
    if (from_date) { sql += ' AND e.expense_date >= ?'; params.push(from_date); }
    if (to_date) { sql += ' AND e.expense_date <= ?'; params.push(to_date); }
    sql += ' GROUP BY ec.name ORDER BY total DESC';
    const rows = await query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

router.get('/inventory-value', async (req, res, next) => {
  try {
    const bizId = req.business.business_id;
    const rows = await query('SELECT COALESCE(SUM(i.quantity * p.purchase_price), 0) as total_value, COUNT(*) as total_products FROM inventory i JOIN products p ON i.product_id = p.id WHERE i.business_id = ? AND p.status = ?', [bizId, 'ACTIVE']);
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
});

router.get('/customer-receivables', async (req, res, next) => {
  try {
    const bizId = req.business.business_id;
    const rows = await query(`SELECT c.id, c.name, c.phone, COALESCE((SELECT SUM(s.total_amount) FROM sales s WHERE s.customer_id = c.id AND s.status = 'ACTIVE'),0) as total_purchases, COALESCE((SELECT SUM(cp.amount) FROM customer_payments cp WHERE cp.customer_id = c.id),0) as total_paid, COALESCE((SELECT SUM(s.credit_amount) FROM sales s WHERE s.customer_id = c.id AND s.status = 'ACTIVE'),0) - COALESCE((SELECT SUM(cp.amount) FROM customer_payments cp WHERE cp.customer_id = c.id),0) as outstanding FROM customers c WHERE c.business_id = ? AND c.is_active = TRUE HAVING outstanding > 0 ORDER BY outstanding DESC`, [bizId]);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

router.get('/supplier-payables', async (req, res, next) => {
  try {
    const bizId = req.business.business_id;
    const rows = await query(`SELECT s.id, s.name, s.company, COALESCE((SELECT SUM(p.total_amount) FROM purchases p WHERE p.supplier_id = s.id AND p.status = 'ACTIVE'),0) as total_purchases, COALESCE((SELECT SUM(sp.amount) FROM supplier_payments sp WHERE sp.supplier_id = s.id),0) as total_paid, COALESCE((SELECT SUM(p.total_amount) FROM purchases p WHERE p.supplier_id = s.id AND p.status = 'ACTIVE'),0) - COALESCE((SELECT SUM(sp.amount) FROM supplier_payments sp WHERE sp.supplier_id = s.id),0) as outstanding FROM suppliers s WHERE s.business_id = ? AND s.is_active = TRUE HAVING outstanding > 0 ORDER BY outstanding DESC`, [bizId]);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

router.get('/cash-flow', async (req, res, next) => {
  try {
    const bizId = req.business.business_id;
    const { from_date, to_date } = req.query;
    let salesSql = "SELECT COALESCE(SUM(paid_amount),0) as cash_in FROM sales WHERE business_id = ? AND status = 'ACTIVE' AND payment_status != 'UNPAID'";
    const salesParams = [bizId];
    if (from_date) { salesSql += " AND sale_date >= ?"; salesParams.push(`${from_date} 00:00:00`); }
    if (to_date) { salesSql += " AND sale_date <= ?"; salesParams.push(`${to_date} 23:59:59`); }
    const [[cashIn]] = await query(salesSql, salesParams);
    let expSql = 'SELECT COALESCE(SUM(amount),0) as cash_out_expenses FROM expenses WHERE business_id = ?';
    const expParams = [bizId];
    if (from_date) { expSql += ' AND expense_date >= ?'; expParams.push(from_date); }
    if (to_date) { expSql += ' AND expense_date <= ?'; expParams.push(to_date); }
    const [[cashOutExp]] = await query(expSql, expParams);
    let purchSql = "SELECT COALESCE(SUM(paid_amount),0) as cash_out_purchases FROM purchases WHERE business_id = ? AND status = 'ACTIVE'";
    const purchParams = [bizId];
    if (from_date) { purchSql += ' AND purchase_date >= ?'; purchParams.push(`${from_date} 00:00:00`); }
    if (to_date) { purchSql += ' AND purchase_date <= ?'; purchParams.push(`${to_date} 23:59:59`); }
    const [[cashOutPurch]] = await query(purchSql, purchParams);
    const totalCashOut = cashOutExp.cash_out_expenses + cashOutPurch.cash_out_purchases;
    res.json({ success: true, data: { cash_in: cashIn.cash_in, cash_out: totalCashOut, cash_out_expenses: cashOutExp.cash_out_expenses, cash_out_purchases: cashOutPurch.cash_out_purchases, net_cash_flow: cashIn.cash_in - totalCashOut } });
  } catch (err) { next(err); }
});

router.get('/payment-methods', async (req, res, next) => {
  try {
    const bizId = req.business.business_id;
    const { from_date, to_date } = req.query;
    let sql = "SELECT sp.payment_method, COALESCE(SUM(sp.amount),0) as total FROM sale_payments sp JOIN sales s ON sp.sale_id = s.id WHERE s.business_id = ? AND s.status = 'ACTIVE'";
    const params = [bizId];
    if (from_date) { sql += ' AND s.sale_date >= ?'; params.push(`${from_date} 00:00:00`); }
    if (to_date) { sql += ' AND s.sale_date <= ?'; params.push(`${to_date} 23:59:59`); }
    sql += ' GROUP BY sp.payment_method ORDER BY total DESC';
    const rows = await query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

module.exports = router;
