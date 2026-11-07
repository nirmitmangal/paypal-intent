# PayPal Intent — Product Specification
**Document Version:** 1.0.0
**Status:** Frozen MVP Architecture
**Author:** Lead Product Architect & Engineering Team
**Project:** PayPal Intent (Independent Hackathon Prototype)

---

## 1. Executive Summary & Vision

### 1.1 The Problem
Modern e-commerce search engines and AI assistants are transactional and query-bound. When a user has a multifaceted goal—such as *"Set up an ergonomic home studio for remote podcasting under $450"* or *"Equip a 2-person weekend backpacking trip on a $350 budget"*—traditional commerce forces them to manually:
1. Deconstruct their objective into individual product queries (microphone, boom arm, audio interface, headphones, pop filter).
2. Manually search each item across catalogs.
3. Juggle individual prices and cross-item compatibilities (e.g., XLR vs. USB mic connectivity, clamp clearance).
4. Solve a multi-variable knapsack optimization problem in their head to stay within budget.
5. Add items one by one into disconnected checkouts.

Current AI shopping assistants merely act as natural language keyword generators or affiliate search bots. They lack **intent decomposition**, **holistic multi-item budget optimization**, **transparent decision rationales**, and **direct payment orchestration**.

### 1.2 The Vision
**PayPal Intent** is an AI-native, intention-driven commerce agent that turns natural language objectives into verified, optimized, multi-product carts executed through **PayPal Sandbox**.

> **Core Value Proposition:**
> *"Tell the system what you want to accomplish. Let AI handle the complexity of commerce while you remain in control of every payment."*

The application bridges human intent and financial execution:
- **Understands** high-level user goals, extracted constraints, and implicit requirements.
- **Decomposes** objectives into structured product categories.
- **Discovers and filters** compatible products from a catalog.
- **Optimizes** the multi-item bundle using mathematical constraint satisfaction (budget ceiling, utility, compatibility).
- **Explains** every recommendation with clear trade-off rationale.
- **Orchestrates** checkout via PayPal's official Orders v2 REST API upon explicit user authorization.

---

## 2. Product Categorization & Operational Guardrails

### 2.1 Product Category
**AI-Native Agentic Commerce & Financial Intent Orchestration**

### 2.2 Operational Constraints & Ground Rules
1. **Zero-Cost Local Execution:** Runs entirely on standard local hardware. Powered by **Ollama** (`qwen2.5:3b` or equivalent) for local neural inference. No OpenAI, Anthropic, or paid cloud AI API keys required.
2. **PayPal Sandbox Payment Integration:** Interacts directly with the official PayPal REST Orders v2 API in Sandbox mode (`api-m.sandbox.paypal.com`).
3. **No Transaction Simulation:** Successful transactions are never simulated or faked. Every completed purchase must originate from an authenticated PayPal Sandbox order lifecycle (Create $\rightarrow$ User Approval $\rightarrow$ Server-Side Capture $\rightarrow$ Verified Capture ID).
4. **Human-in-the-Loop Financial Control:** The AI agent acts strictly as an advisor and preparer. Autonomous execution of payments is strictly prohibited. The user must review itemized costs, taxes, totals, and click the explicit PayPal payment button to authorize funds.
5. **Zero Credential Exposure:** PayPal Client IDs and Secrets, session tokens, and system parameters are stored exclusively in backend environment variables and never exposed to the client bundle.
6. **Data Honesty:** The product catalog is clearly labeled as a curated demonstration catalog with realistic specs and pricing, not misrepresented as live web scraping of third-party retail inventory.

---

## 3. Target User Personas & Intent Archetypes

| Persona Archetype | Scenario / Intent | Extracted Constraints | Agent Role |
| :--- | :--- | :--- | :--- |
| **The Ergonomic Remote Worker** | *"I need to upgrade my desk for WFH to stop my back pain under $400."* | Budget: $400. Preference: Ergonomics, lumbar support, adjustability. Category: Furniture & Tech. | Deconstructs into: Ergonomic chair, laptop riser, split mechanical keyboard, gel wrist rest. Optimizes for physical support while capping cost under $400. |
| **The Emerging Content Creator** | *"I want to launch a 2-person podcast on YouTube with a $500 hard budget."* | Budget: $500. Category: Audio/Visual. Constraint: 2-person capture, USB/XLR compatibility. | Deconstructs into: 2x dynamic mics, dual-channel audio interface, 2x boom arms, monitoring headphones. Ensures audio protocol compatibility. |
| **The Weekend Adventurer** | *"I'm going camping for the first time in autumn for 3 days, budget $300."* | Budget: $300. Weather: Cold/Autumn. Needs: Warmth, shelter, cooking. | Deconstructs into: 2-person cold-rated tent, 20°F sleeping bag, portable stove, LED headlamp. Balances thermal rating with total budget. |
| **The Marathon Starter** | *"Training for my first half-marathon, have $250 to spend on essentials."* | Budget: $250. Needs: Footwear, hydration, recovery, apparel. | Deconstructs into: Cushioned running shoes, anti-chafing gear, hydration handheld, electrolyte pack. Prioritizes shoe quality as primary budget allocation. |

---

## 4. System Architecture & Component Topology

```
+-----------------------------------------------------------------------------------+
|                                 USER BROWSER / CLIENT                             |
|  +---------------------+   +---------------------+   +-------------------------+  |
|  | Natural Intent Bar  |   | Dynamic Plan Graph  |   | Multi-Product Cart View |  |
|  +---------------------+   +---------------------+   +-------------------------+  |
|  +---------------------+   +---------------------+   +-------------------------+  |
|  | Trade-off Inspector |   | Budget Metric Gauge |   | PayPal Smart Buttons    |  |
|  +---------------------+   +---------------------+   +-------------------------+  |
+-----------------------------------------|-----------------------------------------+
                                          | HTTPS / REST & WebSocket
+-----------------------------------------v-----------------------------------------+
|                              APPLICATION BACKEND ENGINE                           |
|  +-----------------------------------------------------------------------------+  |
|  | Agentic Workflow Orchestrator                                              |  |
|  |  - Session & Context State Machine                                          |  |
|  |  - Execution Graph Coordinator (Intent -> Plan -> Match -> Optimize -> Cart)|  |
|  +-------------------|-----------------------------------|---------------------+  |
|                      |                                   |                        |
|  +-------------------v---------------+   +---------------v---------------------+  |
|  | Local AI Inference Bridge (Ollama) |   | Deterministic Optimization Engine   |  |
|  |  - Model: qwen2.5:3b (REST 11434) |   |  - Multi-Choice Knapsack Optimizer  |  |
|  |  - Structured JSON Schemas        |   |  - Category Cross-Compatibility     |  |
|  |  - Few-shot Intent Extraction     |   |  - Utility vs Price Pareto Scoring  |  |
|  +-----------------------------------+   +-------------------------------------+  |
|                      |                                   |                        |
|  +-------------------v---------------+   +---------------v---------------------+  |
|  | Curated Mock Catalog & Search     |   | PayPal Sandbox Gateway              |  |
|  |  - 120+ Curated Products across 6 |   |  - OAuth2 Server-to-Server Token    |  |
|  |    Verticals with Specs & Badges  |   |  - Orders v2 Creation & Validation  |  |
|  |  - Inverted Index & Semantic Filter|  |  - Server-Side Capture & Receipt    |  |
|  +-----------------------------------+   +-------------------------------------+  |
|                      |                                   |                        |
|  +-------------------v-----------------------------------v---------------------+  |
|  | Local Persistence Layer (SQLite / JSON Audit Store)                          |  |
|  |  - Saved Intent Sessions, Plan Versions, Orders, Payment Audit Receipts     |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
                                          |
                                          v External Sandbox Outbound
                            +---------------------------+
                            |   PayPal Sandbox API      |
                            | (api-m.sandbox.paypal.com)|
                            +---------------------------+
```

### 4.1 Layer Breakdown
1. **Frontend Presentation Layer:** Modern responsive UI featuring an intent input portal, interactive decomposition tree, product alternative selector, budget allocation meter, transparent reasoning drawer, and PayPal official JS SDK container.
2. **Agentic Workflow Orchestrator:** Manages the multi-phase lifecycle of an intent session, maintaining transactional state transitions and orchestrating sub-engines.
3. **Local AI Inference Engine:** Talks to local Ollama instance over HTTP (`localhost:11434`). Enforces JSON schema extraction for intent understanding, categorical decomposition, and natural language rationale generation.
4. **Deterministic Constraint Optimization Engine:** A mathematical solver that eliminates AI hallucinations regarding arithmetic and pricing. Guarantees that selected product combinations strictly respect the user's hard budget ceiling ($\sum \text{price}_i \le \text{budget}$) while maximizing composite quality/compatibility score.
5. **Curated Commerce Catalog:** A structured dataset with 120+ items across 6 commerce verticals (Home Office, Audio/Video Production, Outdoor & Camping, Fitness & Athletic, Smart Home, Coffee & Culinary), complete with SKU, technical specifications, dimensional attributes, rating, compatibility tags, and inventory status.
6. **PayPal Payment Gateway:** Handles server-to-server OAuth token generation, creates compliant PayPal v2 orders with precise line-item breakdowns, validates order state, securely captures funds in Sandbox mode, and persists immutable transaction receipts.

---

## 5. End-to-End System Data Flow

```
[User Input] "Build me a video editing desk setup under $600"
      │
      ▼
(Phase 1: Intent Understanding)
Agent calls Ollama with system prompt & intent extraction schema
Output: { objective: "Video editing desk setup", budget: 600.00, currency: "USD",
          constraints: ["large workspace", "color accuracy", "high weight capacity"],
          urgency: "standard" }
      │
      ▼
(Phase 2: Goal Decomposition & Planning)
Agent decomposes objective into necessary item categories:
Category 1: Desk / Work Surface (Weight: 35%)
Category 2: Ergonomic Monitor Mount or Arm (Weight: 15%)
Category 3: Color-accurate Lighting / Desk Lamp (Weight: 15%)
Category 4: Cable Management & Ergonomic Peripherals (Weight: 35%)
      │
      ▼
(Phase 3: Catalog Discovery & Compatibility Matrix)
Catalog engine retrieves candidate SKUs matching each category and spec requirement.
Cross-references compatibility tags (e.g., Mount clamping thickness <= Desk thickness).
      │
      ▼
(Phase 4: Multi-Product Knapsack Optimization)
Deterministic solver runs budget-bounded maximization:
Selects: SKU-DSK-04 ($249.99) + SKU-MNT-02 ($69.99) + SKU-LGT-01 ($79.99) + SKU-ACC-09 ($49.99)
Total: $449.96 (Under $600 budget by $150.04)
Generates upgrade options & budget tier variants (Budget, Balanced, Premium).
      │
      ▼
(Phase 5: Explainable AI Rationale Synthesis)
Ollama produces transparent rationale for why each item was selected,
what trade-offs were made, and how budget was conserved.
      │
      ▼
(Phase 6: User Review & Interactive Adjustment)
User adjusts selections (e.g., swaps monitor mount for higher-tier dual arm, +$40).
Optimizer recalculates budget meter in real-time.
      │
      ▼
(Phase 7: Intent Confirmation & Cart Freezing)
User clicks "Prepare PayPal Checkout". Cart is locked. Server generates order hash.
      │
      ▼
(Phase 8: PayPal Sandbox Order Creation)
Backend calls `POST /v2/checkout/orders` with client credentials.
Returns PayPal Order ID to frontend.
      │
      ▼
(Phase 9: Explicit User Authorization)
User completes PayPal Sandbox approval popup modal.
      │
      ▼
(Phase 10: Server-Side Capture & Receipt Generation)
Backend calls `POST /v2/checkout/orders/{orderId}/capture`.
Receives transaction ID, status COMPLETED, and fee details.
Database logs intent record + order receipt.
Frontend displays verified purchase summary with PayPal capture proof.
```

---

## 6. Core Data Schemas & API Contracts

### 6.1 Intent Definition (`ParsedIntent`)
```json
{
  "sessionId": "ses_9a8b7c6d5e",
  "rawQuery": "Build me a video editing desk setup under $600",
  "objective": "Video Editing Desk Workspace",
  "budget": {
    "amount": 600.00,
    "currency": "USD",
    "isHardCeiling": true
  },
  "preferences": [
    "dual monitor capability",
    "color-neutral desk surface",
    "sturdy load capacity"
  ],
  "categoriesRequired": [
    {
      "categoryId": "desk_surface",
      "name": "Heavy Duty Work Desk",
      "priority": "essential",
      "estimatedBudgetShare": 0.50
    },
    {
      "categoryId": "monitor_mount",
      "name": "Dual Monitor Arm",
      "priority": "essential",
      "estimatedBudgetShare": 0.20
    },
    {
      "categoryId": "lighting",
      "name": "High CRI Task Light",
      "priority": "recommended",
      "estimatedBudgetShare": 0.15
    },
    {
      "categoryId": "ergonomics_power",
      "name": "Cable Management & Surge Protection",
      "priority": "recommended",
      "estimatedBudgetShare": 0.15
    }
  ]
}
```

### 6.2 Plan Proposal & Item Match (`ProposalBundle`)
```json
{
  "proposalId": "prop_1029384756",
  "sessionId": "ses_9a8b7c6d5e",
  "tier": "balanced_optimal",
  "summary": "High-durability solid core desk with heavy-duty dual pneumatic monitor arms and CRI95 task lighting, safely under the $600 ceiling.",
  "items": [
    {
      "sku": "DSK-WD-60",
      "title": "AeroDesk Pro 60x30 Solid Surface",
      "category": "desk_surface",
      "price": 279.99,
      "quantity": 1,
      "compatibilityScore": 0.98,
      "selectionReason": "Supports up to 220 lbs, ideal for dual heavy displays.",
      "tradeOffNotes": "Non-motorized manual height to preserve $180 for audio and arm peripherals."
    },
    {
      "sku": "MNT-DUAL-GAS",
      "title": "ErgoView Dual Gas Spring Monitor Mount",
      "category": "monitor_mount",
      "price": 89.99,
      "quantity": 1,
      "compatibilityScore": 1.0,
      "selectionReason": "Clamps securely on AeroDesk 1-inch desktop; VESA 75/100 compliant."
    },
    {
      "sku": "LGT-BAR-CRI",
      "title": "Lumeno Studio ScreenBar High CRI95",
      "category": "lighting",
      "price": 64.99,
      "quantity": 1,
      "compatibilityScore": 0.95,
      "selectionReason": "Zero-glare screen illumination preserving color accuracy during video grading."
    },
    {
      "sku": "PWR-CBL-TRAY",
      "title": "Under-Desk Steel Cable Trough & 8-Outlet Strip",
      "category": "ergonomics_power",
      "price": 39.99,
      "quantity": 1,
      "compatibilityScore": 1.0,
      "selectionReason": "Houses high-draw video workstation power adapters securely off the floor."
    }
  ],
  "financials": {
    "subtotal": 474.96,
    "estimatedTax": 38.00,
    "shipping": 0.00,
    "total": 512.96,
    "budgetCeiling": 600.00,
    "remainingBudget": 87.04
  }
}
```

### 6.3 PayPal Order Execution Contract (`PayPalCaptureRecord`)
```json
{
  "intentSessionId": "ses_9a8b7c6d5e",
  "paypalOrderId": "8RG83921KJ9102938",
  "paypalCaptureId": "4NM09128LK0192837",
  "status": "COMPLETED",
  "createTime": "2026-11-05T17:05:32Z",
  "updateTime": "2026-11-05T17:06:14Z",
  "amount": {
    "currency_code": "USD",
    "value": "512.96"
  },
  "payer": {
    "name": "Sandbox Buyer",
    "email_address": "buyer-test@sandbox.paypal.com",
    "payer_id": "SANDBOXPAYER123"
  },
  "seller_receivable_breakdown": {
    "gross_amount": { "currency_code": "USD", "value": "512.96" },
    "paypal_fee": { "currency_code": "USD", "value": "17.78" },
    "net_amount": { "currency_code": "USD", "value": "495.18" }
  },
  "purchasedItems": [
    { "sku": "DSK-WD-60", "name": "AeroDesk Pro 60x30 Solid Surface", "quantity": 1, "unit_amount": "279.99" },
    { "sku": "MNT-DUAL-GAS", "name": "ErgoView Dual Gas Spring Monitor Mount", "quantity": 1, "unit_amount": "89.99" },
    { "sku": "LGT-BAR-CRI", "name": "Lumeno Studio ScreenBar High CRI95", "quantity": 1, "unit_amount": "64.99" },
    { "sku": "PWR-CBL-TRAY", "name": "Under-Desk Steel Cable Trough & 8-Outlet Strip", "quantity": 1, "unit_amount": "39.99" }
  ]
}
```

---

## 7. Security, Privacy & Integrity Standards

1. **Human-in-the-Loop Barrier:**
   Under no condition can the agent execute a transaction autonomously. Payment capture requires:
   - Dynamic user-initiated confirmation.
   - Interactive PayPal Sandbox popup authorization by the user.
   - Backend cryptographic signature verification of the PayPal order state.
2. **Backend-Enforced Price Invariance:**
   The client cannot modify product prices or tax rates. When checkout is initiated, the backend rebuilds the order directly from its internal catalog database and calculates the exact sum sent to PayPal.
3. **Environment Security:**
   - `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` reside solely in backend `.env` files.
   - The frontend receives only public client IDs (for the PayPal JS SDK script tag) and server-generated Order IDs.
   - All CORS policies restrict API endpoints to trusted localhost origins.
4. **Resilient Local AI Fallbacks:**
   If Ollama is temporarily slow or unformatted JSON is returned, the backend features a deterministic heuristic fallback parser to ensure the application never crashes or leaves the user stranded.

---

## 8. Master 10-Prompt Roadmap & Delivery Lifecycle

```
[Prompt 1] Product Intelligence & Complete Product Specification  <-- CURRENT PHASE
     │      (Frozen MVP Scope, User Journeys, Acceptance Criteria, Innovation Plan)
     ▼
[Prompt 2] System Architecture, Tech Stack Selection & Foundation Setup
     │      (Monorepo scaffolding, environment configuration, Ollama health harness)
     ▼
[Prompt 3] Domain Models, Mock Catalog Engine & Data Architecture
     │      (120+ SKU realistic catalog, attributes, search & filtering index)
     ▼
[Prompt 4] AI Intent Parsing & Goal Decomposition Engine
     │      (Structured Ollama prompts, intent deconstruction, schema validation)
     ▼
[Prompt 5] Constraint Optimization, Multi-Product Recommendation & Explainability
     │      (Knapsack budget solver, compatibility checker, transparent trade-off logic)
     ▼
[Prompt 6] PayPal Sandbox Integration & Server-Side Payment Orchestration
     │      (OAuth2 token manager, Orders v2 creation, capture, and verification)
     ▼
[Prompt 7] Modern, Premium UI/UX Implementation
     │      (High-contrast intent interface, plan graph, budget gauge, PayPal buttons)
     ▼
[Prompt 8] Interactive Plan Revision, Cart Management & Audit History
     │      (Live item swapping, locking, budget rebalancing, order history drawer)
     ▼
[Prompt 9] End-to-End Integration, Rigorous Automated Testing & Hardening
     │      (Integration test suite, validation of all acceptance criteria, edge tests)
     ▼
[Prompt 10] Final Polish, Hackathon Demo Suite, Performance & Documentation
            (Turnkey launch script, demo walkthrough video scripts, final audit)
```

---

## 9. Conclusion & Scope Freeze
The product specification defined in this document represents the **authoritative blueprint** for PayPal Intent. All subsequent prompts will execute against this architecture without introducing non-essential deviations.
