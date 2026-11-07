# PayPal Intent — REST API Specification
**Document Version:** 1.0.0

**Status:** Approved Technical Architecture

**Deliverable:** Master Prompt 2

---

## 1. Global API Standards

### 1.1 Base URL & Content Negotiation
- **Base URL:** `/api`
- **Default Format:** `application/json`
- **Session Identification:** All endpoints accept and echo the `x-session-token` header.

### 1.2 Standard Response Envelope (`ApiResponse<T>`)
All responses return a uniform JSON envelope:
```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "meta": {
    "timestamp": "2026-11-05T17:15:00.000Z",
    "requestId": "req_abc123"
  }
}
```

In the event of an error:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Field 'prompt' is required and must be a string."
  },
  "meta": {
    "timestamp": "2026-11-05T17:15:00.000Z"
  }
}
```

---

## 2. System Health & Diagnostics Endpoints

### 2.1 Full System Health
- **Route:** `GET /api/health`
- **Description:** Verifies runtime readiness across Node.js server, SQLite database, Ollama AI engine, and PayPal Sandbox configuration.
- **Response:**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2026-11-05T17:15:00.000Z",
    "uptime": 142.8,
    "version": "1.0.0",
    "services": {
      "database": {
        "status": "connected",
        "path": "./data/paypal_intent.db",
        "latencyMs": 0
      },
      "aiEngine": {
        "status": "ready",
        "model": "qwen2.5:3b",
        "endpoint": "http://127.0.0.1:11434",
        "latencyMs": 12
      },
      "paypalGateway": {
        "status": "sandbox_ready",
        "mode": "sandbox",
        "clientIdConfigured": true
      }
    }
  }
}
```

### 2.2 Database Diagnostics
- **Route:** `GET /api/health/db`
- **Response:**
```json
{
  "success": true,
  "data": {
    "status": "connected",
    "tableCount": 13,
    "path": "./data/paypal_intent.db"
  }
}
```

### 2.3 AI Engine Diagnostics
- **Route:** `GET /api/health/ai`
- **Response:**
```json
{
  "success": true,
  "data": {
    "status": "ready",
    "model": "qwen2.5:3b",
    "endpoint": "http://127.0.0.1:11434",
    "availableModels": ["qwen2.5:3b"]
  }
}
```

---

## 3. Intent & Goal Planning Endpoints

### 3.1 Create Intent Session
- **Route:** `POST /api/intents`
- **Request Body:**
```json
{
  "prompt": "Set up a voiceover recording station at my desk under $350 with low background noise",
  "budgetCeiling": 350.00,
  "currency": "USD",
  "urgency": "standard"
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "int_a8f9b0c1d2e3f4a5",
    "sessionId": "ses_9a8b7c6d5e",
    "rawPrompt": "Set up a voiceover recording station at my desk under $350 with low background noise",
    "parsedObjective": "Voiceover Recording Station",
    "budgetAmount": 350.00,
    "budgetCurrency": "USD",
    "isHardCeiling": true,
    "urgency": "standard",
    "status": "pending",
    "createdAt": "2026-11-05T17:15:02.000Z",
    "updatedAt": "2026-11-05T17:15:02.000Z"
  }
}
```

### 3.2 Get Intent Session
- **Route:** `GET /api/intents/:id`
- **Response (200 OK):** Returns single `IntentSession` entity.

### 3.3 Generate Execution Plan
- **Route:** `POST /api/intents/plans`
- **Request Body:**
```json
{
  "intentSessionId": "int_a8f9b0c1d2e3f4a5",
  "preferredTier": "balanced"
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "pln_1029384756",
    "intentSessionId": "int_a8f9b0c1d2e3f4a5",
    "version": 1,
    "planTier": "balanced",
    "summary": "Optimized balanced plan matching goal requirements within budget.",
    "isActive": true,
    "totalEstimatedCost": 319.96,
    "currency": "USD",
    "items": [
      {
        "id": "rec_01",
        "productId": "prod_aud_01",
        "categoryId": "microphone",
        "quantity": 1,
        "unitPrice": 129.99,
        "compatibilityScore": 1.0,
        "selectionReason": "Optimal match in microphone category for balanced tier.",
        "isLocked": false
      }
    ]
  }
}
```

### 3.4 Get Plans for Intent
- **Route:** `GET /api/intents/:intentId/plans`
- **Response (200 OK):** Returns array of `ExecutionPlan` entities.

---

## 4. Product Catalog & Comparison Endpoints

### 4.1 Discover & Filter Products
- **Route:** `GET /api/products`
- **Query Parameters:**
  - `category` (string, optional): e.g. `microphone`, `desk`, `lighting`.
  - `maxPrice` (number, optional): Filter items $\le \text{maxPrice}$.
  - `query` (string, optional): Search across title, brand, and description.
- **Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "prod_aud_01",
      "sku": "MIC-DYN-USB",
      "title": "AuraVoice Pro USB Broadcast Dynamic Microphone",
      "categoryId": "microphone",
      "brand": "AuraVoice",
      "basePrice": 129.99,
      "currency": "USD",
      "rating": 4.8,
      "reviewCount": 342,
      "inStock": true,
      "imageUrl": "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=500",
      "description": "Broadcast-grade cardioid dynamic USB microphone with internal shock mount."
    }
  ]
}
```

### 4.2 Get Product by ID
- **Route:** `GET /api/products/:id`

### 4.3 Multi-Product Attribute Comparison
- **Route:** `POST /api/products/compare`
- **Request Body:**
```json
{
  "productIds": ["prod_aud_01", "prod_aud_02"]
}
```
- **Response (200 OK):** Returns side-by-side spec comparison matrix.

---

## 5. Shopping Cart Endpoints

### 5.1 Get Active Cart
- **Route:** `GET /api/cart`
- **Query Parameter:** `intentSessionId` (optional)
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "crt_99283716",
    "sessionId": "ses_9a8b7c6d5e",
    "intentSessionId": "int_a8f9b0c1d2e3f4a5",
    "status": "active",
    "subtotal": 319.96,
    "estimatedTax": 25.60,
    "shippingFee": 0.00,
    "totalAmount": 345.56,
    "currency": "USD",
    "items": [
      {
        "id": "cit_01",
        "productId": "prod_aud_01",
        "quantity": 1,
        "unitPrice": 129.99,
        "isCustomSelection": false
      }
    ]
  }
}
```

### 5.2 Add Item to Cart
- **Route:** `POST /api/cart/items`
- **Request Body:**
```json
{
  "productId": "prod_aud_01",
  "quantity": 1,
  "intentSessionId": "int_a8f9b0c1d2e3f4a5"
}
```

### 5.3 Remove Item from Cart
- **Route:** `DELETE /api/cart/items/:itemId`

---

## 6. PayPal Payment Gateway Endpoints

### 6.1 Create PayPal Order
- **Route:** `POST /api/payments/create-order`
- **Description:** Server-side creation of official PayPal Orders v2 resource.
- **Request Body:**
```json
{
  "cartId": "crt_99283716"
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "paypalOrderId": "8RG83921KJ9102938",
    "orderId": "ord_55102938",
    "orderNumber": "PI-LX9821-442",
    "totalAmount": 345.56,
    "currency": "USD"
  }
}
```

### 6.2 Capture PayPal Order
- **Route:** `POST /api/payments/capture-order`
- **Description:** Executes server-side capture against `api-m.sandbox.paypal.com` after user approval in the PayPal popup.
- **Request Body:**
```json
{
  "paypalOrderId": "8RG83921KJ9102938",
  "orderId": "ord_55102938"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "captureId": "4NM09128LK0192837",
    "status": "completed",
    "transaction": {
      "id": "tx_77281938",
      "transactionHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "grossAmount": 345.56,
      "feeAmount": 12.55,
      "netAmount": 333.01,
      "currency": "USD"
    }
  }
}
```

---

## 7. Transaction Audit Endpoints

### 7.1 List Session Transactions
- **Route:** `GET /api/transactions`
- **Response (200 OK):** Returns array of past completed `TransactionRecord` items for the caller's session.

### 7.2 Get Transaction Audit Receipt
- **Route:** `GET /api/transactions/:id`
- **Response (200 OK):** Returns full transaction audit snapshot.
