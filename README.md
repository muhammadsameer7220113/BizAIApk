# BizAI - AI-Powered Business Operating System

BizAI is a complete digital business manager for Pakistani small businesses and shopkeepers. It combines POS, Inventory, Customer Management, Supplier Management, Udhaar/Credit tracking, Expenses, Profit & Loss, Reports, AI Business Assistant, WhatsApp/Email auto-receipts, and more - all in one application.

## 🎯 Product Vision

> The shopkeeper should not need to understand accounting, inventory systems, or analytics. BizAI understands the business and tells them what they need to know.

## ✨ Features

### Core Business Management
- **POS / Billing** - Fast, simple billing with product search, cart, discounts, and multiple payment methods (Cash, Easypaisa, JazzCash, Bank, Udhaar)
- **Inventory Management** - Real-time stock tracking, low-stock alerts, stock adjustments with full history
- **Customer Management** - Customer profiles, purchase history, udhaar tracking
- **Supplier Management** - Supplier profiles, purchase history, payable tracking
- **Purchase Management** - Record purchases, auto-update inventory
- **Expense Tracking** - Categorized expenses that affect profit calculations
- **Udhaar/Credit** - Full credit management with partial payments, reminders, history

### Reports & Exports
- **Dashboard** - Today's sales, profit, expenses, bills, udhaar overview
- **Sales Reports** - Daily, weekly, monthly with date range filters
- **Profit Reports** - Gross profit (Sales - COGS) and Net Profit (after expenses)
- **Expense Reports** - By category, by date
- **Inventory Reports** - Stock value, movement history
- **Export** - Excel (.xlsx), CSV for all major data types

### AI Business Assistant
- Text-based AI chat that answers using real database data
- Answers questions about sales, profit, udhaar, stock, customers
- Never invents numbers - all data from verified MySQL queries
- Supports English and Roman Urdu queries

### Local Shopkeeper Features
- **Galla Patti** - Daily cash drawer tally with expected vs actual closing
- **Udhaar Recovery** - Pending udhaar list with WhatsApp reminders
- **Profit Leak Alerts** - Products selling below cost
- **Low Stock Alerts** - Reorder suggestions
- **WhatsApp Receipts** - Auto thank-you message after sale
- **Email Receipts** - Auto email with invoice details
- **Date Range Reports** - Custom date range with Excel/PDF export

### Auto Receipts
- WhatsApp receipt via official WhatsApp Business Cloud API
- Email receipt with invoice details
- Customer consent required (opt-in)
- Duplicate prevention with idempotency

## 🏗 Architecture

```
Flutter Android App
        ↓
Secure REST API (HTTP + JWT)
        ↓
Node.js + Express Backend
        ↓
MySQL Database
        ↓
AI Provider Abstraction (Gemini, DeepSeek, Qwen, HuggingFace)
```

## 📁 Project Structure

```
BizAIApk/
├── flutter_app/          # Flutter Android application
│   ├── lib/
│   │   ├── app/         # App config, theme, router
│   │   ├── core/        # Services, utils, constants
│   │   ├── providers/   # Riverpod state management
│   │   ├── models/      # Data models
│   │   └── screens/     # All UI screens
│   └── pubspec.yaml
├── backend/              # Node.js + Express API
│   ├── src/
│   │   ├── config/      # Database, env config
│   │   ├── routes/      # API routes
│   │   ├── middleware/   # Auth, validation, error handling
│   │   ├── services/    # Business logic, AI, receipts
│   │   └── utils/       # Helpers
│   ├── .env.example
│   └── package.json
├── database/             # MySQL migrations
│   └── migrate.js
└── docs/                 # Documentation
```

## 🚀 Setup & Installation

### Prerequisites
- Node.js 18+ 
- MySQL 8.0+
- Flutter 3.10+
- Android SDK

### 1. Backend Setup

```bash
cd backend
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env with your database credentials and API keys

# Create database and run migrations
node database/migrate.js

# Start development server
npm run dev
```

### 2. Database Setup

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE bizai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"

# Run migrations
cd backend && node ../database/migrate.js
```

### 3. Flutter Setup

```bash
cd flutter_app
flutter pub get

# Configure API URL (for Android emulator, use 10.0.2.2)
# For production, set your server URL

# Run in debug mode
flutter run

# Build release APK
flutter build apk --release
```

### 4. Environment Variables

See `backend/.env.example` for all required variables:

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_NAME=bizai
DATABASE_USER=root
DATABASE_PASSWORD=

# Authentication
JWT_SECRET=your-secret-key

# AI Provider
AI_DEFAULT_PROVIDER=GEMINI
GEMINI_API_KEY=your-key

# WhatsApp (Optional)
WHATSAPP_API_TOKEN=your-token
WHATSAPP_PHONE_NUMBER_ID=your-id

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASS=your-app-password
```

## 🔒 Security

- Password hashing with bcrypt (12 rounds)
- JWT token authentication with refresh token rotation
- All business queries scoped by business_id (multi-tenant isolation)
- Rate limiting on auth endpoints
- No secrets in Flutter app code
- Financial operations use MySQL transactions
- Audit logging for important actions

## 📊 Database Schema

The database includes 20+ tables:
- users, businesses, business_members, business_settings
- categories, products, inventory, inventory_transactions
- customers, customer_payments
- suppliers, supplier_payments
- sales, sale_items, sale_payments
- purchases, purchase_items, purchase_payments
- expenses, expense_categories
- receipt_notifications
- notifications
- ai_settings, ai_conversations, ai_messages
- galla_entries (cash drawer)
- audit_logs

## 🤖 AI Architecture

The AI system uses a hybrid approach:
1. **Deterministic Intent Detection** - For common business queries, the backend directly queries MySQL
2. **Provider Abstraction** - Supports Gemini, DeepSeek, Qwen, GLM, HuggingFace
3. **Data Grounding** - AI never invents numbers; all responses are based on verified database queries

## 📱 Target Business Types

General Store, Kiryana, Grocery, Garments, Shoes, Electronics, Mobile Shop, Furniture, Hardware, Cosmetics, Stationery, Bakery, Restaurant, Cafe, Pharmacy, Wholesale, Distributor

## 🏗 Building for Release

```bash
# Build APK
cd flutter_app
flutter build apk --release

# Output: build/app/outputs/flutter-apk/app-release.apk
# Rename to: BizAI-v1.0.apk
```

## 📄 License

This project is for educational and commercial use by the BizAI team.

## 🙏 Acknowledgments

Built for Pakistani small businesses and shopkeepers who deserve modern, simple tools to run their business.
