# BizAI Architecture Documentation

## System Architecture

### High-Level
```
Flutter Android App (UI + State)
        ↓ HTTP REST + JWT
Node.js + Express Backend
        ↓ mysql2
MySQL Database
        ↓ Provider Abstraction
AI Providers (Gemini, DeepSeek, etc.)
```

### Layers

1. **Flutter App Layer**
   - UI rendering
   - State management (Riverpod)
   - API communication (Dio)
   - Secure token storage
   - Navigation (GoRouter)

2. **Backend API Layer**
   - Authentication (JWT)
   - Authorization (Business-scoped)
   - Validation
   - Business logic
   - AI orchestration
   - Receipt notifications

3. **Database Layer**
   - MySQL with InnoDB
   - Foreign keys and indexes
   - Transaction-safe operations
   - Business data isolation

4. **AI Layer**
   - Intent detection (deterministic)
   - Provider abstraction
   - Data grounding (no invented numbers)
   - Conversation storage

## Data Flow Examples

### Sale Creation Flow
```
Flutter POS → POST /api/v1/sales
    → Auth middleware validates token
    → Transaction starts
    → Validate products and stock
    → Create sale record
    → Create sale items
    → Decrease inventory
    → Record inventory transaction
    → Create payment record
    → Update customer balance if credit
    → Write audit log
    → Transaction commits
    → Receipt notification triggered (async)
    → Response returned to Flutter
```

### AI Query Flow
```
Flutter AI Chat → POST /api/v1/ai/conversations/:id/messages
    → Save user message
    → Intent detection on backend
    → Query MySQL for verified data
    → AI provider generates explanation
    → Save AI response
    → Return to Flutter
```

### Auto Receipt Flow
```
Sale completed → Receipt service triggered
    → Check customer consent
    → Check business settings
    → Create notification record
    → Send email via SMTP
    → Send WhatsApp via Cloud API
    → Update notification status
```

## Security Model

1. **Authentication**: JWT with access + refresh tokens
2. **Authorization**: All queries scoped by business_id
3. **Data Isolation**: No cross-business data access
4. **Financial Safety**: MySQL transactions with rollback
5. **Rate Limiting**: On auth and sensitive endpoints
6. **Secrets**: Backend only, never in Flutter

## Multi-Tenant Architecture

Every table includes `business_id`. Every query includes `WHERE business_id = ?`. This ensures complete data isolation between businesses.
