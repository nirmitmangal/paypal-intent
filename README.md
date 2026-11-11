# PayPal Intent — AI-Powered Agentic Commerce

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript: Strict](https://img.shields.io/badge/TypeScript-5.7%20Strict-blue)](https://www.typescriptlang.org/)
[![React: 18](https://img.shields.io/badge/React-18.3-61dafb)](https://react.dev/)
[![Node.js: 22+](https://img.shields.io/badge/Node.js-22%2B-green)](https://nodejs.org/)
[![Vite: 6](https://img.shields.io/badge/Vite-6.1-purple)](https://vitejs.dev/)
[![SQLite: WAL](https://img.shields.io/badge/Database-SQLite%20WAL-003B57)](https://sqlite.org/)
[![Inference: Ollama Local](https://img.shields.io/badge/AI-Ollama%20Local-black)](https://ollama.com/)
[![PayPal: Orders v2 Sandbox](https://img.shields.io/badge/PayPal-Orders%20v2%20Sandbox-003087)](https://developer.paypal.com/)
[![Tests: 125/125 Passed](https://img.shields.io/badge/Tests-125%2F125%20Passed-brightgreen)](server/tests)

> *"Tell the system what you want to accomplish. Let AI handle the complexity of commerce while you remain in full control of every payment."*

**PayPal Intent** is an AI-powered, intention-driven commerce agent developed for the **PayPal AI Hackathon**. Instead of manually searching for individual SKUs across dozens of browser tabs, calculating budgets on scratchpads, and guessing compatibility, users express real-world purchasing objectives in natural language.

The AI agent decomposes complex goals, discovers compatible products from a curated catalog, mathematically optimizes multi-item bundles under strict budget ceilings, explains trade-offs, and orchestrates user-approved payments via the **official PayPal Sandbox Orders v2 API**.

---

## 📌 Executive Overview

| Dimension | Traditional E-Commerce | PayPal Intent (Agentic Commerce) |
| :--- | :--- | :--- |
| **User Interaction** | Keyword searching & category browsing | High-level natural language intent |
| **Bundle Assembly** | Manual juggling across 15+ browser tabs | Automated multi-product goal decomposition |
| **Budget Management** | Trial-and-error manual cart math | Algorithmic knapsack optimization with strict ceilings |
| **Decision Support** | Biased star ratings & sponsored ads | Radical explainability & trade-off transparency |
| **Payment Execution** | Disconnected checkout redirects | Governed, human-in-the-loop PayPal Sandbox checkout |
| **Auditability** | Static email receipts | Immutable ledger with SHA-256 cryptographic receipt seals |

---

## ⚡ Core Features

- **Natural Language Intent Ingestion**: Decomposes free-form user goals (e.g., *"Equip a 2-person podcast studio under $1,200"* or *"Home workstation under ₹50,000"*) into structured category requirements, specifications, and priorities.
- **Multi-Currency Decomposition**: Understands intents expressed in USD (`$`), INR (`₹`), EUR (`€`), and GBP (`£`) with benchmark conversion into authoritative catalog currency.
- **Multi-Tier Plan Synthesis**: Synthesizes three distinct purchasing plans in parallel:
  - 🟢 **Budget-Conscious**: Maximizes value while strictly minimizing expenditure.
  - 🔵 **Balanced**: Optimizes the price-to-performance ratio across all categories.
  - 🟣 **Performance**: Selects top-tier specifications while respecting budget ceilings.
- **Mathematical Knapsack Optimization**: Enforces hard budget ceiling compliance algorithmically, swapping lower-priority items when budget overruns occur to prevent overspending.
- **Interactive Plan Customization**: Users can lock favorite items, swap individual recommendations with catalog alternatives, and rebalance the bundle with one click.
- **Side-by-Side Product Comparison**: Generates comprehensive specification matrices comparing technical attributes, value ratings, and trade-offs.
- **Atomic Cart Synchronization**: Synchronizes complete bundles to the server cart in a single network roundtrip (`POST /api/cart/sync`), avoiding race conditions.
- **Authoritative Server-Side Pricing**: Client-supplied prices are discarded. Subtotals, 8% sales tax, and grand totals are calculated server-side in integer minor units (cents).
- **Genuine PayPal Sandbox Integration**: Uses `@paypal/react-paypal-js` and the PayPal Orders v2 REST API (`api-m.sandbox.paypal.com`). Successful transactions are **never simulated**.
- **Double-Spending Prevention**: Enforces database uniqueness on `paypal_order_id` and rejects replay capture attempts with `409 Conflict` (`DUPLICATE_CAPTURE_ATTEMPT`).
- **Cryptographic Audit Trail**: Every captured payment generates an immutable record sealed with a tamper-evident **SHA-256 Snapshot Hash**.
- **Dual-Engine AI Resilience**: Seamlessly operates with local **Ollama** (`qwen2.5:3b`) or an algorithmic deterministic fallback with **100% Truth-in-Labeling** (`isAiGenerated: false`).

---

## 🏛️ System Architecture

PayPal Intent follows a clean, decoupled architecture with strict security boundaries between the presentation, backend, database, AI inference, and payment layers:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION LAYER (Vite + React 18)               │
│  - 9 Interactive Screens: Home, Intent Workspace, Planning, Decision Matrix,│
│    Cart, PayPal Checkout, Discovery, History Ledger, Settings               │
│  - Lucide Icons • Tailwind CSS Design System • Centralized AppContext       │
│  - Official PayPal JavaScript SDK Buttons (@paypal/react-paypal-js)         │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ REST / JSON (x-session-token)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     BACKEND API LAYER (Node.js + Express + TS)              │
│  - Controllers: Intent, Plan, Catalog, Cart, Order, Payment, Transaction    │
│  - Session Scoping & IDOR Verification (403 Forbidden on foreign access)    │
│  - Integer Minor-Unit Math (Money.toCents, Money.fromCents)                 │
│  - Atomic Cart Sync • Server-Side Price & Tax Authority                     │
└──────────────────┬───────────────────┬───────────────────┬──────────────────┘
                   │                   │                   │
                   ▼                   ▼                   ▼
┌──────────────────────┐  ┌────────────────────────┐  ┌───────────────────────┐
│ LOCAL AI INFERENCE   │  │   SQLITE DATABASE      │  │  PAYPAL SANDBOX REST  │
│ - Ollama Engine      │  │ - SQLite (WAL Mode)    │  │ - Orders v2 API       │
│ - Model: qwen2.5:3b  │  │ - Better-SQLite3 Driver│  │ - OAuth2 Bearer Token │
│ - Zod Schema Output  │  │ - 13 Relational Tables │  │ - Server Capture Flow │
│ - 4 Read-Only Tools  │  │ - Parameterized Queries│  │ - Idempotency Locks   │
│ - Zero Payment Tools │  │ - Immutable Ledger     │  │ - Double-Capture 409  │
└──────────────────────┘  └────────────────────────┘  └───────────────────────┘
```

### Subsystem Boundaries & Security Isolation
1. **AI Isolation**: The AI agent is strictly an **advisory planner**. It has zero tools to initiate, approve, or capture payments.
2. **Payment Gate**: Every transaction requires explicit human authorization via the official PayPal Sandbox popup modal.
3. **Price Authority**: SQLite is the sole source of truth for product prices. Client-supplied amounts are ignored.
4. **IDOR Defense**: All stateful endpoints verify that `entity.sessionId === req.sessionId`. Cross-session reads or writes return `403 Forbidden`.

---

## 🛠️ Technology Stack

| Layer | Technology | Version | Purpose & Rationale |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React | `^18.3.1` | Component-based UI with fast reconciliation |
| **Language** | TypeScript | `^5.7.3` | Strict type safety across client, server, and shared |
| **Build Tool** | Vite | `^6.1.0` | Ultra-fast HMR and optimized production bundling (~86 kB gzip) |
| **Styling** | Tailwind CSS | `^3.4.17` | Fintech-inspired design tokens, accessible contrast, responsive |
| **Icons** | Lucide React | `^0.475.0` | Clean, modern iconography |
| **Payments SDK** | `@paypal/react-paypal-js` | `^10.6.1` | Official PayPal client-side button component library |
| **Backend Framework**| Express | `^4.21.2` | Robust, lightweight HTTP routing and middleware |
| **Runtime** | Node.js / TSX | `22+` / `^4.19.3` | High-performance execution and native TypeScript execution |
| **Database** | SQLite + WAL Mode | `better-sqlite3` | Zero-latency, zero-cost, persistent embedded relational database |
| **Validation** | Zod | `^3.24.1` | Runtime schema validation on API payloads and AI outputs |
| **AI Inference** | Ollama | `^0.5.0+` | Zero-cost local execution of open-weight models (`qwen2.5:3b`) |
| **Payment Gateway** | PayPal Orders v2 API | `REST v2` | Official PayPal Sandbox checkout and capture endpoints |
| **Testing** | Vitest + RTL | `^3.0.5` | Fast unit, integration, and security test execution |

---

## 🤖 AI Agent Implementation

PayPal Intent implements a genuine agentic architecture rather than a superficial chatbot wrapper:

### 1. Dual-Engine Architecture
- **Primary Engine**: Local Ollama instance serving `qwen2.5:3b` via HTTP POST (`http://127.0.0.1:11434/api/generate`).
- **Deterministic Fallback Engine**: If Ollama is offline or times out (>15s), an algorithmic rule-based parser immediately processes the intent.
- **Truth-in-Labeling Guarantee**: Responses include full engine provenance (`isAiGenerated: false`, `engine: 'deterministic-fallback'`). The application never mislabels deterministic outputs as AI-generated.

### 2. Sandboxed Read-Only Agent Tools
The agent operates under strict least-privilege access using 4 controlled tools:
- `search_catalog`: Queries SQLite products table with category, price, and stock filters.
- `get_product_details`: Retrieves full product specifications and compatibility flags.
- `compare_products`: Synthesizes side-by-side comparison matrices across 2 to 4 items.
- `calculate_budget`: Pure mathematical validation of bundle costs, taxes, and shipping.

### 3. Anti-Hallucination Guarantees
- 100% of recommended products match valid IDs from the database.
- Foreign key constraints in SQLite enforce that invalid or hallucinated product IDs are rejected at the database layer.

---

## 💳 PayPal Sandbox Integration

PayPal Intent implements the official PayPal Developer standard for server-side order authorization and capture:

```
[Buyer]                [Client Frontend]             [Backend Server]             [PayPal Sandbox]
   │                           │                             │                            │
   │─── Click "PayPal" ───────>│                             │                            │
   │                           │─── POST /orders/checkout ──>│                            │
   │                           │    (Cart ID & Session)      │─── POST /v1/oauth2/token ─>│
   │                           │                             │<── Bearer Access Token ────│
   │                           │                             │─── POST /v2/checkout/orders│
   │                           │                             │    (Authoritative cents)   │
   │                           │                             │<── 201 Created (Order ID)──│
   │                           │<── Return paypalOrderId ────│                            │
   │<── Render PayPal Modal ───│                             │                            │
   │─── Approve Payment ──────>│                             │                            │
   │                           │─── POST /paypal/capture ───>│                            │
   │                           │    (orderId & ppOrderId)    │─── POST /orders/{id}/capture
   │                           │                             │<── 200 OK (COMPLETED) ─────│
   │                           │                             │─── Verify status & amount  │
   │                           │                             │─── Generate SHA-256 seal   │
   │                           │                             │─── Record in ledger        │
   │                           │<── Return Completed Payment─│                            │
   │<── Show Digital Receipt ──│                             │                            │
```

- **Server-Side Token Isolation**: `PAYPAL_CLIENT_SECRET` is never transmitted to the browser.
- **Double-Capture Lock**: If an already captured PayPal order ID is submitted, the server rejects it with `409 Conflict`.
- **Amount Verification**: Before marking an order as paid, the server verifies that `capturedAmount === order.totalAmount`.

---

## 🚀 Quickstart & Local Installation

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher
- **Python**: v3.10+ (for verification scripts)
- **Ollama** *(Optional for local AI)*: [Download Ollama](https://ollama.com/)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/paypal-intent.git
cd paypal-intent

# Install dependencies across all npm workspaces (shared, server, client)
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` in the repository root:
```bash
cp .env.example .env
```

Edit `.env` if you have PayPal Sandbox credentials:
```ini
PORT=5000
DATABASE_PATH=./data/paypal_intent.db
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5:3b
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=your_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_sandbox_client_secret
```
*(Note: If left as placeholders, the application runs smoothly in demo mode, allowing full navigation, AI planning, and cart operations).*

### 3. Initialize & Seed Database
```bash
npm --workspace=server run seed
```
This populates SQLite with 23 curated, realistic workspace products across 7 categories.

### 4. Setup Local AI (Optional)
If you wish to run the neural model locally:
```bash
# Pull the recommended model
ollama pull qwen2.5:3b

# Start Ollama
ollama serve
```
*(If Ollama is not running, the application automatically uses the deterministic fallback engine).*

### 5. Start Development Servers
Run both frontend and backend concurrently:
```bash
npm run dev
```
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🧪 Testing & Verification

The codebase includes comprehensive unit, integration, and security test suites:

### Run Complete Test Suite (107 Tests)
```bash
npm run test
```
- **Server Tests**: 98 passing tests across 10 suites (API contracts, Knapsack math, IDOR security, PayPal capture).
- **Client Tests**: 9 passing tests across 3 suites (Component rendering, state management, button interactions).

### Run TypeScript Strict Static Analysis
```bash
npm run typecheck
```
Confirmed **0 errors** across all workspaces.

### Run End-to-End Milestone Verifications
Execute all 10 automated milestone verification scripts:
```bash
npm run verify:all
```

---

## 💻 Sandbox Testing Instructions

To test genuine end-to-end payment capture:
1. Ensure your `.env` contains valid `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` from the [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/).
2. Launch the app and submit an intent (e.g., *"Podcasting setup under $600"*).
3. Select a plan and click **"Transfer to Cart"**.
4. In the Cart screen, click **"Proceed to Checkout"**.
5. Click the yellow **PayPal** button.
6. When the PayPal modal appears, log in using your personal Sandbox buyer credentials:
   - **Email**: `sb-buyer@business.example.com` (use your sandbox buyer account)
   - **Password**: *(Your sandbox buyer password)*
7. Click **"Complete Purchase"**.
8. Observe the real-time server capture, status transition to `COMPLETED`, and the cryptographic **SHA-256 digital receipt** displayed in the transaction history.

---

## 📱 Application Screens Walkthrough

```
[Screen A: Home / Intent Ingestion]
  │── Natural language purchasing prompt input
  │── Preset intent archetypes (Podcasting, WFH Ergonomics, Mobile Dev)
  ▼
[Screen B: Intent Workspace & Requirement Extraction]
  │── Visual decomposition of categories, constraints & budget share
  │── Multi-currency recognition & interactive requirement editing
  ▼
[Screen C: AI Multi-Tier Planning]
  │── Budget, Balanced, and Performance plan cards
  │── Budget ceiling adherence meter & explainable trade-off notes
  ▼
[Screen D: Decision Matrix & Customization]
  │── Lock preferred items, swap with catalog alternatives, live rebalance
  │── Side-by-side product specification comparison
  ▼
[Screen E: Shopping Cart]
  │── Authoritative line items, quantity adjustment, 8% tax calculation
  │── Single-roundtrip atomic server synchronization
  ▼
[Screen F: PayPal Checkout & Payment]
  │── Official PayPal JavaScript SDK buttons
  │── Server-side order generation & capture verification
  ▼
[Screen G: Transaction Record & Digital Receipt]
  │── Immutable transaction details with SHA-256 cryptographic seal
  ▼
[Screen H: Product Discovery Catalog] & [Screen I: Session History & Ledger]
```

---

## ⚠️ Known Limitations & Boundaries

- **Independent Prototype**: Built specifically for the PayPal AI Hackathon. Not an official PayPal product.
- **Demonstration Catalog**: Uses a curated 23-item catalog of premium electronics and workspace furniture. Does not web-scrape live retailer inventories.
- **Currency Conversion**: Catalog prices are denominated in USD. Multi-currency intents (INR, EUR, GBP) are converted using fixed indicative benchmark rates for knapsack calculation.
- **Local Inference Latency**: Dependent on host CPU/GPU speed (1.5s–4s on modern hardware).
- Detailed documentation: [docs/KNOWN_LIMITATIONS.md](docs/KNOWN_LIMITATIONS.md).

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

*Disclaimer: This is an independent hackathon prototype developed for the PayPal AI Hackathon and is not an official PayPal product.*
