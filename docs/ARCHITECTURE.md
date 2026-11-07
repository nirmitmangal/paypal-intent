# PayPal Intent — System Architecture & Foundation
**Document Version:** 1.0.0
**Status:** Approved Technical Architecture
**Deliverable:** Master Prompt 2

---

## 1. Executive Architectural Blueprint

PayPal Intent is structured as a **modular, multi-tier agentic commerce architecture**. The platform strictly decouples high-level user intention processing from financial payment execution while maintaining mathematical guarantees over budget constraints and system security.

```
+───────────────────────────────────────────────────────────────────────────────────+
|                           CLIENT PRESENTATION LAYER                               |
|                               (React 18 + Vite)                                   |
|   - Intent Input & Refinement Studio                                              |
|   - Real-Time Budget Gauge & Headroom Visualizer                                  |
|   - Transparent AI Decision Explainer                                             |
|   - Interactive Item Swapping & Locking                                           |
|   - Official PayPal Smart Buttons Container (PayPal JS SDK)                       |
+─────────────────────────────────────────▲─────────────────────────────────────────+
                                          │ HTTP / REST (/api)
+─────────────────────────────────────────▼─────────────────────────────────────────+
|                           BACKEND API & ORCHESTRATION LAYER                       |
|                                (Node.js + Express)                                |
|                                                                                   |
|  [Middleware Pipeline]                                                            |
|    - CORS & Origin Firewall                                                       |
|    - Request Logger & Duration Metrics                                            |
|    - Anonymous Session & IP Attribution Guard                                     |
|    - Centralized JSON Error Handler                                               |
|                                                                                   |
|  [Modular Subsystem Services]                                                     |
|    ├── AI Orchestration Service        (Ollama `qwen2.5:3b` REST Interface)       |
|    ├── Product Catalog Service         (Inverted Search & Multi-Vertical Filters) |
|    ├── Recommendation & Solver Engine  (Knapsack Bounded Budget Optimizer)        |
|    ├── Cart & Financial Engine         (Line Items, Tax Matrix, Idempotency)      |
|    ├── PayPal Payment Gateway Service  (OAuth2 Token, Orders v2 Create & Capture) |
|    └── Transaction & Audit Service     (Immutable SHA-256 Audit Trail)            |
+─────────────────────────────────────────▲─────────────────────────────────────────+
                                          │ Synchronous SQLite / WAL
+─────────────────────────────────────────▼─────────────────────────────────────────+
|                             DATABASE & PERSISTENCE LAYER                          |
|                         (SQLite via Node.js `node:sqlite`)                        |
|                                                                                   |
|   - 13 Relational Tables with Strict Foreign Keys & Query Indexes                 |
|   - Write-Ahead Logging (WAL) Mode for High Concurrency                           |
|   - Zero-Cloud, 100% Local, In-Process Privacy-Preserving Store                   |
+───────────────────────────────────────────────────────────────────────────────────+
```

---

## 2. Layered Architecture & Subsystem Boundaries

### 2.1 Frontend Presentation Layer
- **Technology:** React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons.
- **Role:** Pure presentation and user interaction. Renders state provided by the backend API.
- **Isolation Guarantee:** Contains zero PayPal client secrets, zero LLM prompts, and zero pricing computation logic. All financial calculations, order totals, and AI prompts are authored and validated server-side.

### 2.2 Backend API Layer
- **Technology:** Node.js 24, Express, TypeScript.
- **Role:** Exposes clean RESTful endpoints adhering to standard HTTP verbs and uniform envelope schemas (`ApiResponse<T>`).
- **Session Governance:** Every request passes through `sessionMiddleware`, which guarantees that clients without accounts receive a persistent, anonymous session token (`x-session-token`) valid for 30 days.

### 2.3 AI Orchestration Layer
- **Technology:** Ollama local daemon (`http://127.0.0.1:11434`), model `qwen2.5:3b`.
- **Role:** Ingests raw natural language goals, extracts parameters (budget, urgency, preferences), and decomposes goals into 3 to 5 discrete product categories.
- **Fail-Safe Fallback:** If Ollama is offline or experiences transient latency $> 5\text{ seconds}$, a rule-based heuristic fallback immediately activates to prevent client failure.

### 2.4 Catalog & Recommendation Engine
- **Role:** Manages the curated inventory across 6 domains (Audio/Video, WFH Ergonomics, Camping, Fitness, Smart Home, Artisan Coffee).
- **Mathematical Optimization:** Evaluates candidates using a bounded multi-choice knapsack algorithm that maximizes total utility and compatibility score while strictly enforcing the hard budget ceiling ($\sum \text{Price}_i \times 1.08 \le \text{Budget}$).

### 2.5 PayPal Payment Gateway
- **Technology:** PayPal Sandbox REST API (`api-m.sandbox.paypal.com`).
- **Role:**
  - Manages short-lived OAuth2 bearer tokens via Client Credentials grant.
  - Formulates compliant `POST /v2/checkout/orders` payloads with itemized line items.
  - Verifies and captures funds via `POST /v2/checkout/orders/{id}/capture` upon explicit user consent in the PayPal popup.
- **Anti-Fraud & Idempotency:** Orders are tagged with server-generated unique request IDs and linked to the session ID.

### 2.6 Persistence Layer
- **Technology:** SQLite 3 utilizing Node 24's native `node:sqlite` engine.
- **Role:** Persists all 13 core domain entities with zero external database processes or network overhead.
- **Concurrency:** Operates in `WAL` (Write-Ahead Logging) mode, enabling concurrent non-blocking reads during active transaction writes.

---

## 3. Strict Decoupling & Isolation Guarantees

```
+─────────────────────────────────────────────────────────────────────────────+
|                             ISOLATION MATRIX                                |
+───────────────────────+───────────────────────────+─────────────────────────+
| Concern               | Client UI Responsibility  | Server Responsibility   |
+───────────────────────+───────────────────────────+─────────────────────────+
| AI Prompting          | NONE (only submits prompt)| Authors system prompts, |
|                       |                           | schema constraints,     |
|                       |                           | and Ollama integration. |
+───────────────────────+───────────────────────────+─────────────────────────+
| Price Computation     | Display only              | Authoritative catalog   |
|                       |                           | pricing, tax, totals.   |
+───────────────────────+───────────────────────────+─────────────────────────+
| PayPal Secret Auth    | NONE (only loads client ID| Stores secret in .env;  |
|                       | for official JS SDK)      | executes OAuth2 grants. |
+───────────────────────+───────────────────────────+─────────────────────────+
| Payment Authorization | Explicit click on PayPal  | Validates capture state |
|                       | Smart Button              | and issues receipt.     |
+───────────────────────+───────────────────────────+─────────────────────────+
```

---

## 4. End-to-End Sequence Flows

### 4.1 System Health & Self-Diagnostic Flow
```
Client                      Server                      SQLite          Ollama
  │                           │                            │               │
  │── GET /api/health ───────►│                            │               │
  │                           │── SELECT 1 ───────────────►│               │
  │                           │◄── Result (0ms) ───────────│               │
  │                           │                                            │
  │                           │── GET /api/tags ──────────────────────────►│
  │                           │◄── { models: ["qwen2.5:3b"] } ─────────────│
  │                           │                                            │
  │◄── 200 OK (Health JSON) ──│                                            │
```

### 4.2 Intent Creation & Plan Generation Flow
```
Client                      Server                      Ollama          SQLite
  │                           │                            │               │
  │── POST /api/intents ─────►│                            │               │
  │   { prompt, budget }      │── Insert intent_sessions ─────────────────►│
  │◄── 201 Created (Intent) ──│                                            │
  │                           │                                            │
  │── POST /api/intents/plans►│                                            │
  │   { intentSessionId }     │── Generate Decomposed Categories ─────────►│
  │                           │◄── JSON Categories ────────────────────────│
  │                           │                                            │
  │                           │── Run Knapsack Optimizer ──│               │
  │                           │── Persist Plan & Recs ────────────────────►│
  │◄── 201 Created (Plan) ────│                                            │
```

---

## 5. Architectural Quality Attributes

1. **Zero-Cost Operation:** 100% free open-source dependencies (FOSS). Local Ollama inference avoids recurring LLM API bills.
2. **Deterministic Arithmetic:** Separates probabilistic LLM reasoning (categorization, rationale generation) from deterministic mathematics (knapsack budget optimization).
3. **Defense-in-Depth Security:** Secrets never touch the browser; payment capture requires multi-step cryptographic verification.
4. **Instant Startup & Portability:** Single-command local startup on standard developer machines.
