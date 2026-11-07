# Technology Stack & Architectural Tooling
**PayPal Intent — Agentic AI Commerce Application**
*Technical Deep Dive & Architectural Decision Rationale*

---

## 1. Architectural Philosophy: The Zero-Cost, Production-Grade Stack

PayPal Intent was architected under a non-negotiable constraint: **Zero-cost development and execution without sacrificing production fintech rigor.**

We deliberately avoided paid proprietary LLM APIs (OpenAI, Anthropic), subscription databases (MongoDB Atlas, AWS Aurora), and paid cloud orchestration platforms. Instead, we combined high-performance, open-source technologies into a cohesive, self-contained architecture.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND TIER                                  │
│   React 18.3 • TypeScript 5.7 • Vite 6.1 • Tailwind CSS 3.4 • Lucide Icons  │
│                   @paypal/react-paypal-js (Official SDK)                    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ RESTful HTTP / JSON
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                               BACKEND TIER                                  │
│   Node.js 22 LTS • Express 4.21 • TypeScript 5.7 • TSX Runtime • Zod 3.24   │
│          Integer Minor-Unit Money Utilities • Cryptographic Hashing         │
└──────────────────┬───────────────────┬───────────────────┬──────────────────┘
                   │                   │                   │
                   ▼                   ▼                   ▼
┌──────────────────────┐  ┌────────────────────────┐  ┌───────────────────────┐
│     AI REASONING     │  │   STORAGE & LEDGER     │  │   PAYMENT GATEWAY     │
│  - Ollama Engine     │  │ - SQLite 3             │  │ - PayPal Orders v2    │
│  - Model: qwen2.5:3b │  │ - WAL Mode Enabled     │  │ - REST Sandbox API    │
│  - Zero Cloud Costs  │  │ - better-sqlite3       │  │ - Bearer OAuth Token  │
│  - Local Inference   │  │ - Parameterized SQL    │  │ - Server-Side Capture │
└──────────────────────┘  └────────────────────────┘  └───────────────────────┘
```

---

## 2. Frontend Technology Stack

### React 18.3 & TypeScript 5.7
- **Why React 18**: Provides high-performance concurrent rendering, predictable unidirectional data flow, and native compatibility with the official PayPal React SDK.
- **Why TypeScript**: Full type coverage ensures compile-time validation between API contracts (`@paypal-intent/shared`) and UI components, eliminating runtime `undefined` property errors.

### Vite 6.1
- **Why Vite**: Replaced legacy Webpack tooling. Delivers instant Hot Module Replacement (HMR) under 50ms and compiles an optimized production bundle in ~13 seconds with tree-shaken chunks:
  - Total production JavaScript: **297.29 kB** (Only **86.06 kB** gzipped).
  - Total production CSS: **34.10 kB** (Only **6.38 kB** gzipped).

### Tailwind CSS 3.4 & Custom Design Tokens
- **Design Philosophy**: Built around an authentic, trustworthy fintech palette (PayPal Blues: `#003087`, `#0079C1`, `#00457C`; clean neutral whites and slates).
- **Zero Heavy UI Component Bloat**: Rather than pulling in massive component libraries that slow down rendering, components use lightweight, accessible, custom-styled primitives with Lucide icons.

### `@paypal/react-paypal-js` (Official SDK)
- **Official Compliance**: Embeds the official PayPal JavaScript SDK button directly into the checkout view.
- **Client-Side Isolation**: The client SDK only requests the public `clientId` from the backend and never handles sensitive OAuth secrets.

---

## 3. Backend Technology Stack

### Node.js 22 LTS & Express 4.21
- **Why Node.js 22**: Modern JavaScript runtime supporting native fetch, ES modules, robust stream handling, and cryptographic primitives.
- **Why Express**: Unopinionated, predictable middleware pipeline ideal for strictly controlling request authentication, session scoping, and error handling.

### TSX (TypeScript Execute)
- Enables rapid development execution without separate build watches, compiling TypeScript in-memory using esbuild.

### Zod Runtime Validation
- Every API endpoint validates incoming request payloads and query parameters using strict Zod schemas.
- AI model outputs are also validated through Zod before being ingested into the planning engine. Malformed JSON completions are immediately caught and routed through validation fallbacks.

### Integer Minor-Unit Currency Engine (`Money.ts`)
- **Eliminating Floating-Point Drift**: In JavaScript, `0.1 + 0.2 === 0.30000000000000004`. In financial software, floating-point math can lead to penny discrepancies during tax and subtotal calculations.
- **Implementation**: All monetary values in the database, backend business logic, and API contracts are stored and calculated as **integer cents** (minor units). Only the final presentation layer formats numbers as decimal currency strings (`$1,299.99`).

---

## 4. Local AI Inference: Ollama & `qwen2.5:3b`

### Local Open-Weight Inference
- **Zero Cloud Costs**: Powered by **Ollama**, allowing the system to run locally without incurring per-token charges or requiring credit card authorization on cloud model platforms.
- **Model Choice**: `qwen2.5:3b` was selected for its exceptional instruction-following capability, structured JSON output precision, and low latency on standard consumer laptops (1.5s–3s inference time).

### Dual-Engine Resilience & Truth-in-Labeling
- To protect against situations where Ollama is not installed or the local machine runs out of GPU memory, the backend includes an **algorithmic deterministic fallback parser**.
- **Transparency**: When the fallback engine is utilized, responses explicitly include `isAiGenerated: false` and `engine: 'deterministic-fallback'`. The application never mislabels deterministic outputs as AI-generated.

### Sandboxed Read-Only Agent Tools
The agent orchestrator operates under strict least-privilege constraints using 4 read-only tools:
1. `search_catalog`: Category, price, and stock filtering.
2. `get_product_details`: Technical specification queries.
3. `compare_products`: Multi-item matrix generation.
4. `calculate_budget`: Deterministic tax and subtotal computation.

**Crucially, no payment execution tools exist in the AI agent's tool registry.**

---

## 5. Storage Tier: SQLite with WAL Mode

### Better-SQLite3
- **Zero Setup**: Requires no separate database server, daemon, or external cloud service to provision.
- **Write-Ahead Logging (WAL)**: Configured with `PRAGMA journal_mode = WAL;` and `PRAGMA busy_timeout = 10000;`. WAL mode permits simultaneous read operations while a write transaction is executing, eliminating concurrency bottlenecks.
- **Foreign Key Integrity**: Enforced via `PRAGMA foreign_keys = ON;`. Hallucinated or non-existent product IDs are rejected at the database level.

---

## 6. Payment Integration: PayPal Sandbox Orders v2

### Server-to-Server REST Architecture
- Direct integration with `https://api-m.sandbox.paypal.com`.
- **OAuth2 Token Isolation**: The backend exchanges `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` for short-lived Bearer tokens. Secrets never touch the client.
- **Capture Verification**: When the buyer approves an order in the PayPal modal, the backend calls `/v2/checkout/orders/{id}/capture` directly, verifying that PayPal returned `COMPLETED` before marking the order as captured.
- **Idempotency & Double-Spending Prevention**: Database uniqueness constraints and status checks prevent duplicate capture replays, immediately returning `409 Conflict`.
- **Cryptographic Audit Trail**: Each transaction is stamped with an immutable SHA-256 seal combining order ID, payment ID, amount, session, and timestamp.
