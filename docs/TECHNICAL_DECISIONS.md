# PayPal Intent — Architectural Decision Records (ADRs)
**Document Version:** 1.0.0
**Status:** Approved Technical Architecture
**Deliverable:** Master Prompt 2

---

## 1. Overview & Context

This document captures the strategic technical decisions, trade-off evaluations, and architectural justifications established for the **PayPal Intent** platform. Every choice balances **production-grade engineering**, **zero-cost local reproducibility**, and **strict adherence to hackathon constraints**.

---

## 2. Architectural Decision Records

### ADR-1: Node.js 24 + Express + TypeScript for Backend Service
- **Status:** Accepted.
- **Context:** We require a robust, asynchronous server capable of handling high-speed REST endpoints, coordinating AI REST calls, executing cryptographic hashing, and communicating with PayPal Sandbox APIs.
- **Decision:** Build the backend using Node.js 24 LTS, Express, and strict TypeScript.
- **Consequences:**
  - *Positive:* Excellent developer ergonomics, comprehensive type safety across frontend and backend, instant startup time, and native support for modern web standards (e.g. `fetch`, `node:sqlite`).
  - *Negative:* Express requires explicit middleware for error handling and session tracking (implemented cleanly in `src/middleware`).

### ADR-2: Native `node:sqlite` vs External Database Daemon
- **Status:** Accepted.
- **Context:** An AI commerce agent requires relational persistence for intent sessions, decomposed requirements, catalog products, and transaction records. Demanding Docker, PostgreSQL, or cloud databases violates the **zero-cost, runnable locally out-of-the-box** constraint.
- **Decision:** Utilize Node.js 24's built-in `node:sqlite` engine configured in `WAL` (Write-Ahead Logging) mode.
- **Consequences:**
  - *Positive:* Zero installation friction, zero C++ compilation or node-gyp issues, 0ms network latency for database queries, strict relational ACID compliance, and complete local privacy.
  - *Negative:* Lacks distributed multi-server clustering, which is completely unnecessary for a local agentic application.

### ADR-3: Ollama (`qwen2.5:3b`) for Zero-Cost Local Neural Inference
- **Status:** Accepted.
- **Context:** Commercial LLM APIs (OpenAI GPT-4, Anthropic Claude, Google Cloud Vertex) require billing accounts, paid API tokens, and internet availability.
- **Decision:** Deploy **Ollama** running locally on standard developer hardware with `qwen2.5:3b`.
- **Consequences:**
  - *Positive:* 100% free execution, zero token cost, complete privacy (prompts never leave local machine), fast local inference with 32k context and tool-calling capabilities.
  - *Negative:* Smaller local models require defensive prompt engineering and schema constraints (addressed via structured JSON mode and deterministic heuristic fallbacks).

### ADR-4: Deterministic Knapsack Constraint Solver vs Pure LLM Combinatorics
- **Status:** Accepted.
- **Context:** Large language models are probabilistic text predictors. When tasked with arithmetic, currency totals, or multi-item budget balancing ($\sum \text{price}_i \le \text{budget}$), LLMs frequently hallucinate prices, miscalculate tax, or exceed budget limits.
- **Decision:** Pair Ollama with a **deterministic constraint solver** (multi-choice knapsack algorithm). The LLM handles semantic understanding and goal decomposition; the mathematical engine selects items and computes exact financials.
- **Consequences:**
  - *Positive:* 100% mathematical certainty. Budget ceilings are never violated. Prices match catalog records down to the cent.
  - *Negative:* Requires maintaining structured product metadata (implemented via our catalog repository and attribute tables).

### ADR-5: Official PayPal REST Orders v2 API vs Mock Payment Simulation
- **Status:** Accepted.
- **Context:** The prompt strictly states: *"Never simulate successful PayPal transactions... Use PayPal Sandbox for payment integration."*
- **Decision:** Integrate directly with PayPal Sandbox Orders v2 (`https://api-m.sandbox.paypal.com/v2/checkout/orders`), acquiring server-side OAuth2 bearer tokens and capturing payments only upon explicit user approval in the official PayPal JS SDK modal.
- **Consequences:**
  - *Positive:* 100% authentic integration, valid PayPal Capture IDs, compliant with PayPal developer guidelines, and production-ready for live merchant transition.
  - *Negative:* Requires valid PayPal Sandbox credentials for live capture; handled gracefully with clear diagnostic indicators in the health endpoints.

### ADR-6: Anonymous Cryptographic Sessions vs Mandatory User Accounts
- **Status:** Accepted.
- **Context:** Forcing users to register, verify emails, and manage passwords creates severe friction in a hackathon demonstration and violates privacy principles by harvesting unnecessary PII.
- **Decision:** Implement tokenized anonymous sessions (`x-session-token`) with 30-day expiration, linking intent histories and transactions without requiring personal identity data.
- **Consequences:**
  - *Positive:* Zero onboarding friction. Instant time-to-value for evaluators. Complete privacy preservation.
  - *Negative:* Users must keep their local session storage to retain cross-device order histories.

### ADR-7: Monorepo Workspaces Structure (`shared`, `server`, `client`)
- **Status:** Accepted.
- **Context:** The project spans client UI, backend server, and shared contracts. Maintaining fragmented repositories creates type duplication and build drift.
- **Decision:** Organize as an npm workspace monorepo with `shared` (domain types), `server` (Express API), and `client` (Vite + React).
- **Consequences:**
  - *Positive:* Single `npm.cmd install` setup, synchronized TypeScript interfaces, atomic commits, and centralized verification scripts.
  - *Negative:* Requires path alias configuration across TypeScript and Vite (configured cleanly in `tsconfig.json`).
