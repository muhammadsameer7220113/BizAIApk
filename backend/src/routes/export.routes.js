const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

router.post('/', async (req, res, next) => {
  try {
    const bizId = req.business.business_id;
    const { type, format = 'xlsx', from_date, to_date } = req.body;

    if (!type) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Export type required' } });

    let data = [];
    let columns = [];
    let filename = `BizAI_${type}_${from_date || 'all'}_to_${to_date || 'all'}`;

    switch (type) {
      case 'sales': {
        let sql = "SELECT s.invoice_no, s.sale_date, c.name as customer_name, c.phone as customer_phone, s.subtotal, s.discount_amount, s.tax_amount, s.total_amount, s.paid_amount, s.credit_amount, s.payment_status, s.payment_method FROM sales s LEFT JOIN customers c ON s.customer_id = c.id WHERE s.business_id = ? AND s.status = 'ACTIVE'";
        const params = [bizId];
        if (from_date) { sql += ' AND s.sale_date >= ?'; params.push(`${from_date} 00:00:00`); }
        if (to_date) { sql += ' AND s.sale_date <= ?'; params.push(`${to_date} 23:59:59`); }
        sql += ' ORDER BY s.sale_date DESC';
        const rows = await query(sql, params);
        columns = [
          { header: 'Invoice No', key: 'invoice_no', width: 15 },
          { header: 'Date', key: 'sale_date', width: 20 },
          { header: 'Customer', key: 'customer_name', width: 20 },
          { header: 'Phone', key: 'customer_phone', width: 15 },
          { header: 'Subtotal', key: 'subtotal', width: 12 },
          { header: 'Discount', key: 'discount_amount', width: 12 },
          { header: 'Tax', key: 'tax_amount', width: 10 },
          { header: 'Total', key: 'total_amount', width: 12 },
          { header: 'Paid', key: 'paid_amount', width: 12 },
          { header: 'Credit', key: 'credit_amount', width: 12 },
          { header: 'Status', key: 'payment_status', width: 12 }
        ];
        data = rows;
        break;
      }
      case 'sales_items': {
        let sql = "SELECT s.invoice_no, s.sale_date, si.product_name, si.quantity, si.unit_price, si.cost_price, si.line_total, si.quantity * si.cost_price as cost_total, si.line_total - (si.quantity * si.cost_price) as profit FROM sale_items si JOIN sales s ON si.sale_id = s.id WHERE s.business_id = ? AND s.status = 'ACTIVE'";
        const params = [bizId];
        if (from_date) { sql += ' AND s.sale_date >= ?'; params.push(`${from_date} 00:00:00`); }
        if (to_date) { sql += ' AND s.sale_date <= ?'; params.push(`${to_date} 23:59:59`); }
        sql += ' ORDER BY s.sale_date DESC';
        const rows = await query(sql, params);
        columns = [
          { header: 'Invoice No', key: 'invoice_no', width: 15 },
          { header: 'Date', key: 'sale_date', width: 20 },
          { header: 'Product', key: 'product_name', width: 25 },
          { header: 'Qty', key: 'quantity', width: 8 },
          { header: 'Unit Price', key: 'unit_price', width: 12 },
          { header: 'Cost Price', key: 'cost_price', width: 12 },
          { header: 'Line Total', key: 'line_total', width: 12 },
          { header: 'Cost Total', key: 'cost_total', width: 12 },
          { header: 'Profit', key: 'profit', width: 12 }
        ];
        data = rows;
        break;
      }
      case 'products': {
        const rows = await query('SELECT p.name, p.sku, p.barcode, c.name as category, p.brand, p.purchase_price, p.selling_price, COALESCE(i.quantity,0) as stock, p.min_stock, p.unit FROM products p LEFT JOIN categories c ON p.category_id = c.id LEFT JOIN inventory i ON p.id = i.product_id WHERE p.business_id = ? AND p.status = ? ORDER BY p.name', [bizId, 'ACTIVE']);
        columns = [
          { header: 'Product Name', key: 'name', width: 25 },
          { header: 'SKU', key: 'sku', width: 12 },
          { header: 'Barcode', key: 'barcode', width: 15 },
          { header: 'Category', key: 'category', width: 15 },
          { header: 'Brand', key: 'brand', width: 12 },
          { header: 'Purchase Price', key: 'purchase_price', width: 14 },
          { header: 'Selling Price', key: 'selling_price', width: 14 },
          { header: 'Stock', key: 'stock', width: 10 },
          { header: 'Min Stock', key: 'min_stock', width: 10 },
          { header: 'Unit', key: 'unit', width: 8 }
        ];
        data = rows;
        break;
      }
      case 'customers': {
        const rows = await query(`SELECT c.name, c.phone, c.email, c.whatsapp_number, c.address, c.credit_limit, COALESCE((SELECT SUM(s.total_amount) FROM sales s WHERE s.customer_id = c.id AND s.status = 'ACTIVE'),0) as total_purchases, COALESCE((SELECT SUM(cp.amount) FROM customer_payments cp WHERE cp.customer_id = c.id),0) as total_paid, COALESCE((SELECT SUM(s.credit_amount) FROM sales s WHERE s.customer_id = c.id AND s.status = 'ACTIVE'),0) - COALESCE((SELECT SUM(cp.amount) FROM customer_payments cp WHERE cp.customer_id = c.id),0) as outstanding FROM customers c WHERE c.business_id = ? AND c.is_active = TRUE ORDER BY c.name`, [bizId]);
        columns = [
          { header: 'Name', key: 'name', width: 20 },
          { header: 'Phone', key: 'phone', width: 15 },
          { header: 'Email', key: 'email', width: 25 },
          { header: 'WhatsApp', key: 'whatsapp_number', width: 15 },
          { header: 'Address', key: 'address', width: 25 },
          { header: 'Credit Limit', key: 'credit_limit', width: 12 },
          { header: 'Total Purchases', key: 'total_purchases', width: 14 },
          { header: 'Total Paid', key: 'total_paid', width: 12 },
          { header: 'Outstanding', key: 'outstanding', width: 12 }
        ];
        data = rows;
        break;
      }
      case 'expenses': {
        let sql = 'SELECT e.title, ec.name as category, e.amount, e.expense_date, e.payment_method, e.description FROM expenses e JOIN expense_categories ec ON e.expense_category_id = ec.id WHERE e.business_id = ?';
        const params = [bizId];
        if (from_date) { sql += ' AND e.expense_date >= ?'; params.push(from_date); }
        if (to_date) { sql += ' AND e.expense_date <= ?'; params.push(to_date); }
        sql += ' ORDER BY e.expense_date DESC';
        const rows = await query(sql, params);
        columns = [
          { header: 'Title', key: 'title', width: 25 },
          { header: 'Category', key: 'category', width: 15 },
          { header: 'Amount', key: 'amount', width: 12 },
          { header: 'Date', key: 'expense_date', width: 12 },
          { header: 'Payment Method', key: 'payment_method', width: 15 },
          { header: 'Description', key: 'description', width: 25 }
        ];
        data = rows;
        break;
      }
      case 'purchases': {
        let sql = 'SELECT p.reference_no, p.purchase_date, s.name as supplier, p.subtotal, p.discount_amount, p.total_amount, p.paid_amount, p.credit_amount, p.payment_status FROM purchases p JOIN suppliers s ON p.supplier_id = s.id WHERE p.business_id = ?';
        const params = [bizId];
        if (from_date) { sql += ' AND p.purchase_date >= ?'; params.push(`${from_date} 00:00:00`); }
        if (to_date) { sql += ' AND p.purchase_date <= ?'; params.push(`${to_date} 23:59:59`); }
        sql += " AND p.status = 'ACTIVE' ORDER BY p.purchase_date DESC";
        const rows = await query(sql, params);
        columns = [
          { header: 'Reference No', key: 'reference_no', width: 15 },
          { header: 'Date', key: 'purchase_date', width: 20 },
          { header: 'Supplier', key: 'supplier', width: 20 },
          { header: 'Subtotal', key: 'subtotal', width: 12 },
          { header: 'Discount', key: 'discount_amount', width: 12 },
          { header: 'Total', key: 'total_amount', width: 12 },
          { header: 'Paid', key: 'paid_amount', width: 12 },
          { header: 'Credit', key: 'credit_amount', width: 12 },
          { header: 'Status', key: 'payment_status', width: 12 }
        ];
        data = rows;
        break;
      }
      case 'inventory': {
        const rows = await query('SELECT p.name, c.name as category, COALESCE(i.quantity,0) as stock, p.min_stock, p.purchase_price, p.selling_price, COALESCE(i.quantity * p.purchase_price,0) as stock_value, p.unit FROM products p LEFT JOIN categories c ON p.category_id = c.id LEFT JOIN inventory i ON p.id = i.product_id WHERE p.business_id = ? AND p.status = ? ORDER BY p.name', [bizId, 'ACTIVE']);
        columns = [
          { header: 'Product', key: 'name', width: 25 },
          { header: 'Category', key: 'category', width: 15 },
          { header: 'Stock', key: 'stock', width: 10 },
          { header: 'Min Stock', key: 'min_stock', width: 10 },
          { header: 'Purchase Price', key: 'purchase_price', width: 14 },
          { header: 'Selling Price', key: 'selling_price', width: 14 },
          { header: 'Stock Value', key: 'stock_value', width: 14 },
          { header: 'Unit', key: 'unit', width: 8 }
        ];
        data = rows;
        break;
      }
      default:
        return res.status(400).json({ success: false, error: { code: 'INVALID_TYPE', message: 'Invalid export type' } });
    }

    if (format === 'xlsx') {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet(type);
      sheet.columns = columns;
      data.forEach(row => sheet.addRow(row));
      // Style header
      sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF97316' } };
      const buffer = await workbook.xlsx.writeBuffer();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
      res.send(buffer);
    } else if (format === 'csv') {
      const header = columns.map(c => c.header).join(',');
      const rows = data.map(row => columns.map(c => {
        let val = row[c.key];
        if (val === null || val === undefined) val = '';
        if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) val = `"${val.replace(/"/g, '""')}"`;
        return val;
      }).join(','));
      const csv = [header, ...rows].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      res.send(csv);
    } else {
      return res.status(400).json({ success: false, error: { code: 'INVALID_FORMAT', message: 'Format must be xlsx or csv' } });
    }
  } catch (err) { next(err); }
});

module.exports = router;
