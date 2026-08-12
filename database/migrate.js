const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
  const conn = await mysql.createConnection({
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT || 3306,
    user: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || '',
    multipleStatements: true
  });

  await conn.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DATABASE_NAME || 'bizai'} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await conn.query(`USE ${process.env.DATABASE_NAME || 'bizai'}`);

  const tables = `

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(30) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS businesses (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  owner_name VARCHAR(120) NOT NULL,
  business_type VARCHAR(80) NOT NULL,
  phone VARCHAR(30) NULL,
  address TEXT NULL,
  logo_url VARCHAR(500) NULL,
  currency CHAR(3) NOT NULL DEFAULT 'PKR',
  timezone VARCHAR(60) NOT NULL DEFAULT 'Asia/Karachi',
  locale VARCHAR(10) NOT NULL DEFAULT 'en',
  created_by BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_businesses_created_by (created_by)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS business_members (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  business_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  role ENUM('OWNER','MANAGER','CASHIER','ACCOUNTANT') NOT NULL DEFAULT 'OWNER',
  pin_hash VARCHAR(255) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_business_user (business_id, user_id),
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS business_settings (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  business_id BIGINT UNSIGNED NOT NULL UNIQUE,
  invoice_prefix VARCHAR(20) NOT NULL DEFAULT 'INV-',
  next_invoice_number BIGINT UNSIGNED NOT NULL DEFAULT 1,
  tax_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  default_tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  discount_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  low_stock_threshold DECIMAL(12,2) NOT NULL DEFAULT 5,
  payment_methods JSON NULL,
  barcode_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  email_receipt_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  whatsapp_receipt_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  whatsapp_provider VARCHAR(50) NULL,
  whatsapp_template_name VARCHAR(120) NULL,
  whatsapp_template_language VARCHAR(10) NULL,
  email_provider VARCHAR(50) NULL,
  receipt_email_subject VARCHAR(255) NULL,
  receipt_message_template TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS categories (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  business_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(120) NOT NULL,
  parent_id BIGINT UNSIGNED NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_category_business_name (business_id, name),
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_categories_business (business_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS products (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  business_id BIGINT UNSIGNED NOT NULL,
  category_id BIGINT UNSIGNED NULL,
  name VARCHAR(160) NOT NULL,
  sku VARCHAR(80) NULL,
  barcode VARCHAR(120) NULL,
  brand VARCHAR(120) NULL,
  unit VARCHAR(30) NOT NULL DEFAULT 'pcs',
  purchase_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  selling_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  min_stock DECIMAL(12,2) NOT NULL DEFAULT 0,
  expiry_date DATE NULL,
  image_url VARCHAR(500) NULL,
  description TEXT NULL,
  status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_product_barcode (business_id, barcode),
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_products_business (business_id),
  INDEX idx_products_category (category_id),
  INDEX idx_products_name (name),
  INDEX idx_products_barcode (barcode)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS inventory (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  business_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL UNIQUE,
  quantity DECIMAL(12,2) NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_inventory_business (business_id),
  INDEX idx_inventory_product (product_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS inventory_transactions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  business_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  type ENUM('INITIAL','SALE','SALE_RETURN','PURCHASE','PURCHASE_RETURN','ADJUSTMENT') NOT NULL,
  reference_type VARCHAR(40) NULL,
  reference_id BIGINT UNSIGNED NULL,
  previous_quantity DECIMAL(12,2) NOT NULL,
  quantity_change DECIMAL(12,2) NOT NULL,
  new_quantity DECIMAL(12,2) NOT NULL,
  unit_cost DECIMAL(12,2) NULL,
  reason VARCHAR(255) NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_inventory_tx_business (business_id),
  INDEX idx_inventory_tx_product (product_id),
  INDEX idx_inventory_tx_created (created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS customers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  business_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(140) NOT NULL,
  phone VARCHAR(30) NULL,
  email VARCHAR(190) NULL,
  whatsapp_number VARCHAR(30) NULL,
  address TEXT NULL,
  notes TEXT NULL,
  credit_limit DECIMAL(12,2) NOT NULL DEFAULT 0,
  send_receipt_by_whatsapp BOOLEAN NOT NULL DEFAULT FALSE,
  send_receipt_by_email BOOLEAN NOT NULL DEFAULT FALSE,
  whatsapp_opt_in_at DATETIME NULL,
  email_opt_in_at DATETIME NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  INDEX idx_customers_business (business_id),
  INDEX idx_customers_name (name),
  INDEX idx_customers_phone (phone)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS suppliers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  business_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(140) NOT NULL,
  company VARCHAR(140) NULL,
  phone VARCHAR(30) NULL,
  address TEXT NULL,
  notes TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  INDEX idx_suppliers_business (business_id),
  INDEX idx_suppliers_name (name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sales (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  business_id BIGINT UNSIGNED NOT NULL,
  invoice_no VARCHAR(60) NOT NULL,
  customer_id BIGINT UNSIGNED NULL,
  client_id VARCHAR(100) NULL,
  sale_date DATETIME NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  credit_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_status ENUM('PAID','PARTIAL','UNPAID') NOT NULL DEFAULT 'PAID',
  status ENUM('ACTIVE','VOID') NOT NULL DEFAULT 'ACTIVE',
  cost_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  notes TEXT NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_sale_invoice (business_id, invoice_no),
  UNIQUE KEY uniq_sale_client (business_id, client_id),
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_sales_business (business_id),
  INDEX idx_sales_customer (customer_id),
  INDEX idx_sales_date (sale_date),
  INDEX idx_sales_status (status),
  INDEX idx_sales_payment_status (payment_status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sale_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sale_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NULL,
  product_name VARCHAR(160) NOT NULL,
  quantity DECIMAL(12,2) NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  cost_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  line_total DECIMAL(12,2) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  INDEX idx_sale_items_sale (sale_id),
  INDEX idx_sale_items_product (product_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sale_payments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sale_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  payment_method ENUM('CASH','BANK_TRANSFER','EASYPAISA','JAZZCASH','CARD','CREDIT','CUSTOM') NOT NULL,
  reference_no VARCHAR(100) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  INDEX idx_sale_payments_sale (sale_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS customer_payments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  business_id BIGINT UNSIGNED NOT NULL,
  customer_id BIGINT UNSIGNED NOT NULL,
  sale_id BIGINT UNSIGNED NULL,
  amount DECIMAL(12,2) NOT NULL,
  payment_method ENUM('CASH','BANK_TRANSFER','EASYPAISA','JAZZCASH','CARD','CUSTOM') NOT NULL DEFAULT 'CASH',
  reference_no VARCHAR(100) NULL,
  note TEXT NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_customer_payments_business (business_id),
  INDEX idx_customer_payments_customer (customer_id),
  INDEX idx_customer_payments_sale (sale_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS purchases (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  business_id BIGINT UNSIGNED NOT NULL,
  supplier_id BIGINT UNSIGNED NOT NULL,
  reference_no VARCHAR(100) NULL,
  purchase_date DATETIME NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  credit_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_status ENUM('PAID','PARTIAL','UNPAID') NOT NULL DEFAULT 'UNPAID',
  status ENUM('ACTIVE','VOID') NOT NULL DEFAULT 'ACTIVE',
  notes TEXT NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_purchases_business (business_id),
  INDEX idx_purchases_supplier (supplier_id),
  INDEX idx_purchases_date (purchase_date)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS purchase_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  purchase_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NULL,
  product_name VARCHAR(160) NOT NULL,
  quantity DECIMAL(12,2) NOT NULL,
  unit_cost DECIMAL(12,2) NOT NULL,
  discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  line_total DECIMAL(12,2) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  INDEX idx_purchase_items_purchase (purchase_id),
  INDEX idx_purchase_items_product (product_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS purchase_payments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  purchase_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  payment_method ENUM('CASH','BANK_TRANSFER','EASYPAISA','JAZZCASH','CARD','CREDIT','CUSTOM') NOT NULL,
  reference_no VARCHAR(100) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
  INDEX idx_purchase_payments_purchase (purchase_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS supplier_payments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  business_id BIGINT UNSIGNED NOT NULL,
  supplier_id BIGINT UNSIGNED NOT NULL,
  purchase_id BIGINT UNSIGNED NULL,
  amount DECIMAL(12,2) NOT NULL,
  payment_method ENUM('CASH','BANK_TRANSFER','EASYPAISA','JAZZCASH','CARD','CUSTOM') NOT NULL DEFAULT 'CASH',
  reference_no VARCHAR(100) NULL,
  note TEXT NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
  FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_supplier_payments_business (business_id),
  INDEX idx_supplier_payments_supplier (supplier_id),
  INDEX idx_supplier_payments_purchase (purchase_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS expense_categories (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  business_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(120) NOT NULL,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_expense_category (business_id, name),
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  INDEX idx_expense_categories_business (business_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS expenses (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  business_id BIGINT UNSIGNED NOT NULL,
  expense_category_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(160) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  description TEXT NULL,
  expense_date DATE NOT NULL,
  payment_method ENUM('CASH','BANK_TRANSFER','EASYPAISA','JAZZCASH','CARD','CUSTOM') NOT NULL DEFAULT 'CASH',
  receipt_url VARCHAR(500) NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (expense_category_id) REFERENCES expense_categories(id),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_expenses_business (business_id),
  INDEX idx_expenses_date (expense_date),
  INDEX idx_expenses_category (expense_category_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS receipt_notifications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  business_id BIGINT UNSIGNED NOT NULL,
  sale_id BIGINT UNSIGNED NOT NULL,
  customer_id BIGINT UNSIGNED NULL,
  channel ENUM('EMAIL','WHATSAPP') NOT NULL,
  provider VARCHAR(60) NULL,
  recipient VARCHAR(190) NULL,
  status ENUM('PENDING','SENT','FAILED','SKIPPED') NOT NULL DEFAULT 'PENDING',
  template_name VARCHAR(120) NULL,
  payload JSON NULL,
  error_message TEXT NULL,
  attempts INT NOT NULL DEFAULT 0,
  idempotency_key VARCHAR(190) NULL,
  sent_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_receipt_idempotency (business_id, sale_id, channel, idempotency_key),
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  INDEX idx_receipt_business (business_id),
  INDEX idx_receipt_sale (sale_id),
  INDEX idx_receipt_status (status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  business_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NULL,
  type VARCHAR(60) NOT NULL,
  title VARCHAR(180) NOT NULL,
  body TEXT NULL,
  data JSON NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_notifications_business (business_id),
  INDEX idx_notifications_user (user_id),
  INDEX idx_notifications_read (is_read)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ai_settings (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  business_id BIGINT UNSIGNED NOT NULL UNIQUE,
  ai_name VARCHAR(80) NOT NULL DEFAULT 'BizAI Assistant',
  avatar_url VARCHAR(500) NULL,
  provider ENUM('GEMINI','DEEPSEEK','QWEN','GLM','HUGGINGFACE') NOT NULL DEFAULT 'GEMINI',
  model VARCHAR(120) NULL,
  language ENUM('ENGLISH','URDU','ROMAN_URDU','AUTO') NOT NULL DEFAULT 'AUTO',
  personality VARCHAR(80) NOT NULL DEFAULT 'professional',
  response_style VARCHAR(80) NOT NULL DEFAULT 'simple',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ai_conversations (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  business_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(180) NULL,
  provider VARCHAR(50) NULL,
  model VARCHAR(120) NULL,
  status ENUM('ACTIVE','ARCHIVED','DELETED') NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_ai_conversations_business (business_id),
  INDEX idx_ai_conversations_user (user_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ai_messages (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  conversation_id BIGINT UNSIGNED NOT NULL,
  sender ENUM('USER','AI','SYSTEM') NOT NULL,
  message TEXT NOT NULL,
  metadata JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id) ON DELETE CASCADE,
  INDEX idx_ai_messages_conversation (conversation_id),
  INDEX idx_ai_messages_created (created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS galla_entries (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  business_id BIGINT UNSIGNED NOT NULL,
  entry_date DATE NOT NULL,
  opening_cash DECIMAL(12,2) NOT NULL DEFAULT 0,
  cash_sales DECIMAL(12,2) NOT NULL DEFAULT 0,
  cash_expenses DECIMAL(12,2) NOT NULL DEFAULT 0,
  expected_closing DECIMAL(12,2) NOT NULL DEFAULT 0,
  actual_closing DECIMAL(12,2) NOT NULL DEFAULT 0,
  difference DECIMAL(12,2) NOT NULL DEFAULT 0,
  notes TEXT NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY uniq_galla_date (business_id, entry_date),
  INDEX idx_galla_business (business_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  business_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NULL,
  entity_type VARCHAR(60) NOT NULL,
  entity_id BIGINT UNSIGNED NULL,
  action VARCHAR(60) NOT NULL,
  old_values JSON NULL,
  new_values JSON NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_audit_business (business_id),
  INDEX idx_audit_entity (entity_type, entity_id),
  INDEX idx_audit_created (created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS reset_password_tokens (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_reset_token (token)
) ENGINE=InnoDB;
`;

  await conn.query(tables);
  console.log('✅ All migrations completed successfully!');
  await conn.end();
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
