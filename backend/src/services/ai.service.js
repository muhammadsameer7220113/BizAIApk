const { query } = require('../config/database');

async function processMessage(businessId, message) {
  const msg = message.toLowerCase().trim();

  // Intent detection - deterministic for business queries
  try {
    // Today's sales
    if (msg.match(/today.*sale|aaj.*sale|aaj.*sale|sale.*today|aaj ki sale/i)) {
      const [[row]] = await query("SELECT COALESCE(SUM(total_amount),0) as total, COUNT(*) as bills FROM sales WHERE business_id = ? AND status = 'ACTIVE' AND DATE(sale_date) = CURDATE()", [businessId]);
      return `Aaj ki total sales Rs. ${numberFormat(row.total)} hai. Total ${row.bills} bills bane.`;
    }

    // Today's profit
    if (msg.match(/today.*profit|aaj.*profit|profit.*today|munafa/i)) {
      const [[row]] = await query("SELECT COALESCE(SUM(total_amount - cost_amount),0) as profit FROM sales WHERE business_id = ? AND status = 'ACTIVE' AND DATE(sale_date) = CURDATE()", [businessId]);
      return `Aaj ka gross profit Rs. ${numberFormat(row.profit)} hai.`;
    }

    // Today's expenses
    if (msg.match(/today.*expense|aaj.*expense|aaj.*kharcha|kharcha|expense.*today/i)) {
      const [[row]] = await query('SELECT COALESCE(SUM(amount),0) as total FROM expenses WHERE business_id = ? AND expense_date = CURDATE()', [businessId]);
      return `Aaj ke total expenses Rs. ${numberFormat(row.total)} hain.`;
    }

    // Bills today
    if (msg.match(/bills today|aaj.*bill|kitne bill/i)) {
      const [[row]] = await query("SELECT COUNT(*) as total FROM sales WHERE business_id = ? AND status = 'ACTIVE' AND DATE(sale_date) = CURDATE()", [businessId]);
      return `Aaj ${row.total} bills bane hain.`;
    }

    // Who owes money / udhaar
    if (msg.match(/udhaar|owes|receivable|lena|baki.*customer|customer.*baki/i)) {
      const rows = await query(`SELECT c.name, COALESCE(SUM(s.credit_amount),0) - COALESCE((SELECT SUM(cp.amount) FROM customer_payments cp WHERE cp.customer_id = c.id),0) as outstanding FROM sales s JOIN customers c ON s.customer_id = c.id WHERE s.business_id = ? AND s.status = 'ACTIVE' AND s.payment_status != 'PAID' GROUP BY c.id HAVING outstanding > 0 ORDER BY outstanding DESC LIMIT 10`, [businessId]);
      if (!rows.length) return 'Kisi ka bhi udhaar pending nahi hai. Sab clear hai!';
      let response = 'Yeh customers ka udhaar pending hai:\n';
      rows.forEach(r => { response += `• ${r.name}: Rs. ${numberFormat(r.outstanding)}\n`; });
      return response;
    }

    // Low stock
    if (msg.match(/low stock|kam stock|stock.*kam|restock/i)) {
      const rows = await query('SELECT p.name, COALESCE(i.quantity,0) as stock, p.min_stock FROM products p LEFT JOIN inventory i ON p.id = i.product_id WHERE p.business_id = ? AND p.status = ? AND COALESCE(i.quantity,0) <= p.min_stock ORDER BY COALESCE(i.quantity,0) ASC LIMIT 10', [businessId, 'ACTIVE']);
      if (!rows.length) return 'Sab products ka stock theek hai. Koi low stock nahi.';
      let response = `${rows.length} products low stock hain:\n`;
      rows.forEach(r => { response += `• ${r.name}: ${r.stock} remaining (min: ${r.min_stock})\n`; });
      return response;
    }

    // Best selling product
    if (msg.match(/best.*product|top.*product|zyada.*bik|best selling/i)) {
      const rows = await query("SELECT si.product_name, SUM(si.quantity) as total_qty, SUM(si.line_total) as total_revenue FROM sale_items si JOIN sales s ON si.sale_id = s.id WHERE s.business_id = ? AND s.status = 'ACTIVE' GROUP BY si.product_id, si.product_name ORDER BY total_revenue DESC LIMIT 5", [businessId]);
      if (!rows.length) return 'Abhi tak koi sale nahi hui.';
      let response = 'Top selling products:\n';
      rows.forEach(r => { response += `• ${r.product_name}: ${r.total_qty} sold (Rs. ${numberFormat(r.total_revenue)})\n`; });
      return response;
    }

    // Inventory value
    if (msg.match(/inventory.*value|stock.*value|total.*inventory|total.*stock/i)) {
      const [[row]] = await query('SELECT COALESCE(SUM(i.quantity * p.purchase_price),0) as value FROM inventory i JOIN products p ON i.product_id = p.id WHERE i.business_id = ? AND p.status = ?', [businessId, 'ACTIVE']);
      return `Total inventory ki value Rs. ${numberFormat(row.value)} hai.`;
    }

    // Month comparison
    if (msg.match(/compare|comparison|last month|pichle.*month/i)) {
      const [[thisMonth]] = await query("SELECT COALESCE(SUM(total_amount),0) as total FROM sales WHERE business_id = ? AND status = 'ACTIVE' AND MONTH(sale_date) = MONTH(CURDATE()) AND YEAR(sale_date) = YEAR(CURDATE())", [businessId]);
      const [[lastMonth]] = await query("SELECT COALESCE(SUM(total_amount),0) as total FROM sales WHERE business_id = ? AND status = 'ACTIVE' AND sale_date >= DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 1 MONTH) AND sale_date < DATE_FORMAT(CURDATE(), '%Y-%m-01')", [businessId]);
      const diff = thisMonth.total - lastMonth.total;
      const pct = lastMonth.total > 0 ? ((diff / lastMonth.total) * 100).toFixed(1) : 'N/A';
      return `Is month ki sales: Rs. ${numberFormat(thisMonth.total)}\nPichle month ki sales: Rs. ${numberFormat(lastMonth.total)}\nDifference: ${diff >= 0 ? '+' : ''}Rs. ${numberFormat(Math.abs(diff))} (${pct}%)`;
    }

    // Customer-specific query
    const customerMatch = msg.match(/(?:ka|ki|ko)\s+(\w+)\s+(?:udhaar|baki|outstanding|balance)/i) || msg.match(/(\w+)\s+(?:ka|ki|ko)\s+(?:udhaar|baki)/i);
    if (customerMatch) {
      const name = customerMatch[1];
      const customers = await query("SELECT c.id, c.name FROM customers c WHERE c.business_id = ? AND c.name LIKE ? AND c.is_active = TRUE", [businessId, `%${name}%`]);
      if (!customers.length) return `"${name}" naam ka koi customer nahi mila.`;
      const c = customers[0];
      const [[row]] = await query(`SELECT COALESCE(SUM(s.total_amount),0) as purchases, COALESCE((SELECT SUM(cp.amount) FROM customer_payments cp WHERE cp.customer_id = c.id),0) as paid FROM sales s JOIN customers c ON s.customer_id = c.id WHERE c.id = ? AND s.status = 'ACTIVE'`, [c.id]);
      const outstanding = row.purchases - row.paid;
      return `${c.name} ka total purchase: Rs. ${numberFormat(row.purchases)}\nTotal paid: Rs. ${numberFormat(row.paid)}\nOutstanding: Rs. ${numberFormat(outstanding)}`;
    }

    // Product stock query
    const stockMatch = msg.match(/(?:stock|quantity)\s+(?:of\s+)?(\w+)/i) || msg.match(/(\w+)\s+(?:ka|ki|ki)\s+stock/i);
    if (stockMatch) {
      const name = stockMatch[1];
      const products = await query('SELECT p.name, COALESCE(i.quantity,0) as stock FROM products p LEFT JOIN inventory i ON p.id = i.product_id WHERE p.business_id = ? AND p.name LIKE ? AND p.status = ?', [businessId, `%${name}%`, 'ACTIVE']);
      if (!products.length) return `"${name}" naam ka koi product nahi mila.`;
      let response = 'Stock details:\n';
      products.forEach(p => { response += `• ${p.name}: ${p.stock} units\n`; });
      return response;
    }

    // Biggest expenses
    if (msg.match(/biggest.*expense|top.*expense|sabse.*zyada.*kharcha|expense.*category/i)) {
      const rows = await query('SELECT ec.name as category, COALESCE(SUM(e.amount),0) as total FROM expenses e JOIN expense_categories ec ON e.expense_category_id = ec.id WHERE e.business_id = ? GROUP BY ec.name ORDER BY total DESC LIMIT 5', [businessId]);
      if (!rows.length) return 'Koi expense record nahi hai.';
      let response = 'Top expense categories:\n';
      rows.forEach(r => { response += `• ${r.category}: Rs. ${numberFormat(r.total)}\n`; });
      return response;
    }

    // Total sales / revenue
    if (msg.match(/total.*sale|total.*revenue|kul.*sale|sab.*sale/i)) {
      const [[row]] = await query("SELECT COALESCE(SUM(total_amount),0) as total, COUNT(*) as bills FROM sales WHERE business_id = ? AND status = 'ACTIVE'", [businessId]);
      return `Total sales: Rs. ${numberFormat(row.total)} (${row.bills} bills)`;
    }

    // Fallback - try to provide a helpful response
    return `Main aapki business ke baare mein yeh sawalaat ka jawab de sakta hoon:\n• Today's sales / profit / expenses\n• Bills today\n• Udhaar / customer outstanding\n• Low stock products\n• Best selling products\n• Inventory value\n• Month comparison\n• Customer specific queries\n• Expense breakdown\n\nPlease apna sawaal dobara poochein.`;
  } catch (err) {
    console.error('AI processing error:', err);
    return 'Sorry, ek error aa gaya. Please dobara try karein.';
  }
}

function numberFormat(num) {
  return parseFloat(num || 0).toLocaleString('en-PK');
}

module.exports = { processMessage };
