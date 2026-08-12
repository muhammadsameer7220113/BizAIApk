const { query } = require('../config/database');
const axios = require('axios');

async function triggerReceipt(businessId, saleId, customerId, sendWhatsApp = false, sendEmail = false) {
  const results = { email: null, whatsapp: null };

  // Get sale, customer, business data
  const [sale] = await query('SELECT s.*, c.name as customer_name, c.email, c.whatsapp_number, c.send_receipt_by_email, c.send_receipt_by_whatsapp FROM sales s LEFT JOIN customers c ON s.customer_id = c.id WHERE s.id = ? AND s.business_id = ?', [saleId, businessId]);
  if (!sale.length) return results;

  const saleData = sale[0];
  const [business] = await query('SELECT * FROM businesses WHERE id = ?', [businessId]);
  const [settings] = await query('SELECT * FROM business_settings WHERE business_id = ?', [businessId]);
  const items = await query('SELECT * FROM sale_items WHERE sale_id = ?', [saleId]);
  const biz = business[0];
  const set = settings[0];

  // Email receipt
  if (sendEmail && saleData.email && saleData.send_receipt_by_email && set.email_receipt_enabled) {
    try {
      await query(
        'INSERT INTO receipt_notifications (business_id, sale_id, customer_id, channel, recipient, status, idempotency_key) VALUES (?,?,?,?,?,?)',
        [businessId, saleId, customerId, 'EMAIL', saleData.email, 'PENDING', `email-${saleId}-${Date.now()}`]
      );
      // Send email via configured provider
      if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT) || 587,
          secure: false,
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        });
        const emailBody = buildEmailBody(biz, saleData, items);
        await transporter.sendMail({
          from: `"${process.env.EMAIL_FROM_NAME || biz.name}" <${process.env.EMAIL_FROM_ADDRESS}>`,
          to: saleData.email,
          subject: set.receipt_email_subject || `Thank you for shopping at ${biz.name}`,
          html: emailBody
        });
        await query("UPDATE receipt_notifications SET status = 'SENT', sent_at = NOW(), attempts = attempts + 1 WHERE business_id = ? AND sale_id = ? AND channel = 'EMAIL'", [businessId, saleId]);
        results.email = { status: 'SENT', recipient: saleData.email };
      } else {
        await query("UPDATE receipt_notifications SET status = 'SKIPPED', error_message = ? WHERE business_id = ? AND sale_id = ? AND channel = 'EMAIL'", ['Email provider not configured', businessId, saleId]);
        results.email = { status: 'SKIPPED', reason: 'Provider not configured' };
      }
    } catch (err) {
      await query("UPDATE receipt_notifications SET status = 'FAILED', error_message = ?, attempts = attempts + 1 WHERE business_id = ? AND sale_id = ? AND channel = 'EMAIL'", [err.message, businessId, saleId]);
      results.email = { status: 'FAILED', error: err.message };
    }
  } else if (sendEmail) {
    results.email = { status: 'SKIPPED', reason: 'No email or consent' };
  }

  // WhatsApp receipt
  if (sendWhatsApp && saleData.whatsapp_number && saleData.send_receipt_by_whatsapp && set.whatsapp_receipt_enabled) {
    try {
      const normalizedPhone = normalizePhone(saleData.whatsapp_number);
      await query(
        'INSERT INTO receipt_notifications (business_id, sale_id, customer_id, channel, provider, recipient, status, idempotency_key) VALUES (?,?,?,?,?,?,?,?)',
        [businessId, saleId, customerId, 'WHATSAPP', 'WHATSAPP_CLOUD', normalizedPhone, 'PENDING', `wa-${saleId}-${Date.now()}`]
      );
      if (process.env.WHATSAPP_API_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
        const waMessage = buildWhatsAppMessage(biz, saleData, items);
        await axios.post(
          `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
          {
            messaging_product: 'whatsapp',
            to: normalizedPhone.replace('+', ''),
            type: 'text',
            text: { body: waMessage }
          },
          { headers: { Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`, 'Content-Type': 'application/json' } }
        );
        await query("UPDATE receipt_notifications SET status = 'SENT', sent_at = NOW(), attempts = attempts + 1 WHERE business_id = ? AND sale_id = ? AND channel = 'WHATSAPP'", [businessId, saleId]);
        results.whatsapp = { status: 'SENT', recipient: normalizedPhone };
      } else {
        await query("UPDATE receipt_notifications SET status = 'SKIPPED', error_message = ? WHERE business_id = ? AND sale_id = ? AND channel = 'WHATSAPP'", ['WhatsApp provider not configured', businessId, saleId]);
        results.whatsapp = { status: 'SKIPPED', reason: 'Provider not configured' };
      }
    } catch (err) {
      await query("UPDATE receipt_notifications SET status = 'FAILED', error_message = ?, attempts = attempts + 1 WHERE business_id = ? AND sale_id = ? AND channel = 'WHATSAPP'", [err.message, businessId, saleId]);
      results.whatsapp = { status: 'FAILED', error: err.message };
    }
  } else if (sendWhatsApp) {
    results.whatsapp = { status: 'SKIPPED', reason: 'No WhatsApp number or consent' };
  }

  return results;
}

function normalizePhone(phone) {
  if (!phone) return '';
  let clean = phone.replace(/[\s\-\(\)]/g, '');
  if (clean.startsWith('0')) clean = '+92' + clean.substring(1);
  else if (clean.startsWith('92') && !clean.startsWith('+')) clean = '+' + clean;
  else if (!clean.startsWith('+')) clean = '+92' + clean;
  return clean;
}

function buildEmailBody(biz, sale, items) {
  let itemsHtml = items.map(i => `<tr><td style="padding:8px;border-bottom:1px solid #eee">${i.product_name}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">Rs. ${parseFloat(i.unit_price).toLocaleString()}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">Rs. ${parseFloat(i.line_total).toLocaleString()}</td></tr>`).join('');
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <div style="text-align:center;margin-bottom:24px">
        <h1 style="color:#F97316;margin:0">${biz.name}</h1>
        ${biz.phone ? `<p style="color:#666;margin:4px 0">${biz.phone}</p>` : ''}
        ${biz.address ? `<p style="color:#666;margin:4px 0">${biz.address}</p>` : ''}
      </div>
      <div style="background:#f9fafb;padding:16px;border-radius:8px;margin-bottom:16px">
        <p style="margin:0"><strong>Invoice:</strong> ${sale.invoice_no}</p>
        <p style="margin:4px 0"><strong>Date:</strong> ${new Date(sale.sale_date).toLocaleDateString()}</p>
        ${sale.customer_name ? `<p style="margin:4px 0"><strong>Customer:</strong> ${sale.customer_name}</p>` : ''}
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
        <thead><tr style="background:#f97316;color:white"><th style="padding:8px;text-align:left">Item</th><th style="padding:8px">Qty</th><th style="padding:8px;text-align:right">Price</th><th style="padding:8px;text-align:right">Total</th></tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <div style="text-align:right;padding:16px;background:#f9fafb;border-radius:8px">
        <p style="margin:4px 0">Subtotal: Rs. ${parseFloat(sale.subtotal).toLocaleString()}</p>
        ${sale.discount_amount > 0 ? `<p style="margin:4px 0">Discount: -Rs. ${parseFloat(sale.discount_amount).toLocaleString()}</p>` : ''}
        <p style="margin:4px 0;font-size:18px;font-weight:bold;color:#F97316">Total: Rs. ${parseFloat(sale.total_amount).toLocaleString()}</p>
        <p style="margin:4px 0">Paid: Rs. ${parseFloat(sale.paid_amount).toLocaleString()}</p>
        ${sale.credit_amount > 0 ? `<p style="margin:4px 0;color:#dc2626">Balance: Rs. ${parseFloat(sale.credit_amount).toLocaleString()}</p>` : ''}
      </div>
      <p style="text-align:center;margin-top:24px;color:#666;font-size:12px">Thank you for shopping with us!<br>Generated by BizAI</p>
    </div>`;
}

function buildWhatsAppMessage(biz, sale, items) {
  let itemsList = items.map(i => `• ${i.product_name} x${i.quantity} = Rs.${parseFloat(i.line_total).toLocaleString()}`).join('\n');
  return `Thank you, ${sale.customer_name || 'Customer'}!\n\nYour payment at *${biz.name}* was successful.\n\nInvoice: ${sale.invoice_no}\nDate: ${new Date(sale.sale_date).toLocaleDateString()}\n\nOrder:\n${itemsList}\n\n*Total: Rs. ${parseFloat(sale.total_amount).toLocaleString()}*\nPaid: Rs. ${parseFloat(sale.paid_amount).toLocaleString()}\n${sale.credit_amount > 0 ? `Balance: Rs. ${parseFloat(sale.credit_amount).toLocaleString()}` : ''}\n\nThank you for shopping with us! 🙏`;
}

module.exports = { triggerReceipt, normalizePhone, buildEmailBody, buildWhatsAppMessage };
