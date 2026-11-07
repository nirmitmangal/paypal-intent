# PayPal Intent — Feature Scope & Boundary Defense
**Document Version:** 1.0.0
**Status:** Frozen MVP Architecture
**Deliverable:** Master Prompt 1

---

## 1. Scope Governance & Architectural Boundaries

To ensure PayPal Intent is completed within 10 prompts as a competition-ready, zero-cost, robust hackathon prototype, a **strict scope boundary** is established. Every feature is categorized as **Frozen MVP (In-Scope)**, **Post-MVP Extensibility (Deferred)**, or **Strictly Out-of-Scope (Prohibited)**.

---

## 2. Frozen MVP Feature Matrix

The MVP implements **one complete, flawless, end-to-end commerce workflow**: Goal-based shopping and multi-item constraint optimization executed via PayPal Sandbox.

| Subsystem | Feature Name | Description | Status in MVP |
| :--- | :--- | :--- | :--- |
| **Intent Processing** | Natural Language Intent Ingestion | Multiline natural language input field accepting complex goals, budgets, and constraints. | **FROZEN MVP** |
| **Intent Processing** | Entity & Parameter Extraction | Local LLM parses raw text into structured schema: Objective, Budget (Numeric), Currency, Constraints (List), and Urgency. | **FROZEN MVP** |
| **Intent Processing** | Goal Decomposition Planner | Deconstructs abstract goals into 3 to 5 discrete product categories with functional priorities (Essential vs Recommended). | **FROZEN MVP** |
| **Catalog & Search** | Curated Local Mock Catalog | In-memory/SQLite database of 120+ realistic products across 6 target verticals with specifications, dimensions, tags, and prices. | **FROZEN MVP** |
| **Catalog & Search** | Attribute-Based Discovery | Keyword, category, and semantic filtering matching catalog items to decomposed category needs. | **FROZEN MVP** |
| **Optimization** | Knapsack Budget Optimizer | Deterministic solver finding the combination of items across categories that maximizes total utility while strictly $\le$ user budget. | **FROZEN MVP** |
| **Optimization** | Cross-Item Compatibility Check | Evaluates cross-item compatibility rules (e.g. VESA mount size matches monitor arm; audio connectors match interface). | **FROZEN MVP** |
| **Optimization** | Multi-Tier Proposals | Generates 3 cohesive bundles: *Value / Budget-Conscious*, *Balanced (Optimal)*, and *Performance / Pro-Grade*. | **FROZEN MVP** |
| **Explainable AI** | Transparent Decision Rationale | Local LLM generates human-readable explanations detailing why each item was selected and what trade-offs were made. | **FROZEN MVP** |
| **Explainable AI** | Alternative Trade-Off Explorer | Inspectable comparison matrix showing alternative items per category with price deltas and pros/cons. | **FROZEN MVP** |
| **Cart & Customization** | Interactive Item Swapping | User can replace any item in the plan with an alternative; optimizer dynamically updates remaining budget. | **FROZEN MVP** |
| **Cart & Customization** | Item Locking | User can "lock" preferred items to prevent the optimizer from replacing them during subsequent plan rebalancing. | **FROZEN MVP** |
| **Cart & Customization** | Budget Meter & Financial Summary | Visual gauge tracking subtotal, tax estimate, shipping, and remaining headroom against the user's hard ceiling. | **FROZEN MVP** |
| **Payment Gateway** | Server-Side PayPal OAuth2 Engine | Backend securely requests and caches short-lived PayPal Sandbox bearer tokens using Client Credentials. | **FROZEN MVP** |
| **Payment Gateway** | PayPal Orders v2 Creation | Creates official PayPal Sandbox order with line items, tax, and currency breakdown. Returns PayPal Order ID. | **FROZEN MVP** |
| **Payment Gateway** | PayPal Smart Buttons UI | Embeds official PayPal JavaScript SDK button for user authorization. Prevents mock/fake simulation. | **FROZEN MVP** |
| **Payment Gateway** | Server-Side Order Capture | Captures approved order via `POST /v2/checkout/orders/{id}/capture` and verifies transaction completion. | **FROZEN MVP** |
| **Audit & History** | Purchase Summary & Digital Receipt | Displays verified capture ID, merchant confirmation, itemized list, and savings metrics. | **FROZEN MVP** |
| **Audit & History** | Local Transaction Audit Log | Persists past intent sessions, execution plans, and PayPal capture records in local storage/SQLite for inspection. | **FROZEN MVP** |

---

## 3. Strict Boundary Defense (What is Deliberately NOT Built)

To prevent scope creep, maintain zero-cost execution, and adhere to hackathon guidelines, the following are strictly **prohibited**:

| Excluded Capability | Justification & Architectural Defense |
| :--- | :--- |
| **Real-Money Production Payments** | The application is a hackathon prototype. Exclusively PayPal Sandbox mode is permitted. Real funds must never be handled or charged. |
| **Unrestricted Autonomous Purchasing** | Allowing an AI agent to execute payments without explicit human authorization presents severe safety, financial, and legal hazards. The user must manually inspect the final cart and authorize the transaction via the PayPal SDK. |
| **Live Web Scraping of Third-Party Retailers** | Scraping Amazon, BestBuy, or Walmart at runtime introduces flaky selectors, anti-bot blocking (Cloudflare/CAPTCHA), unpredictable API costs, and severe latency. A deterministic, curated local catalog provides 100% reliability, instant response times, and realistic data. |
| **Cryptocurrency / Web3 Wallets** | Irrelevant to the core proposition of PayPal-centered commerce orchestration. Introduces unnecessary volatility and UX friction. |
| **Social Networking / User Profiles / Feeds** | Features like "Share intent on social media", comment sections, friend feeds, or social leaderboards add clutter without contributing to the core agentic commerce experience. |
| **Multi-Vendor Merchant Portal / Supplier Onboarding** | Building complex supplier onboarding, merchant inventory dashboards, and payout settlement pipelines is out-of-scope for a consumer-facing intent agent. |
| **Paid AI APIs (OpenAI / Anthropic / Gemini Cloud)** | The project enforces **zero-cost execution**. Reliance on paid API keys creates barrier-to-entry and billing risk. Local inference via Ollama (`qwen2.5:3b`) is completely free and private. |

---

## 4. Curated Catalog Domain Verticals (MVP Scope)

The MVP catalog is populated with 120+ high-fidelity items across six targeted commerce domains:

1. **Work From Home & Ergonomics** (Electric standing desks, split ergonomic keyboards, vertical mice, monitor arms, anti-fatigue mats, lumbar chairs).
2. **Audio & Content Creation** (Dynamic/condenser USB & XLR microphones, dual-channel audio interfaces, studio monitors, pop filters, low-profile boom arms, acoustic panels).
3. **Outdoor & Backpacking** (Ultralight tents, sleeping bags with temperature ratings, camp stoves, filtered water bottles, multi-tools, LED headlamps).
4. **Fitness & Athletic Training** (Adjustable dumbbells, resistance bands, running shoes, heart rate monitors, foam rollers, hydration packs).
5. **Smart Home Automation** (Zigbee/Matter hubs, smart ambient light bars, motion sensors, smart plugs, Wi-Fi smart thermostats).
6. **Artisan Coffee & Barista Gear** (Conical burr grinders, gooseneck temperature-controlled kettles, precision digital scales, pour-over drippers, espresso tampers).

These 6 verticals provide rich multi-component goals that rigorously stress-test cross-item compatibility and budget optimization.

---

## 5. Post-MVP Extensibility Architecture

The codebase will be designed with modular interfaces to ensure smooth evolution beyond the MVP:

```
                          [Intent Core Engine]
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         ▼                         ▼                         ▼
 [Physical Goods]         [Subscription Manager]    [Travel / Experiences]
 (MVP Implemented)         (Recurring Billing API)   (Multi-Leg Itinerary)
         │                         │                         │
         └─────────────────────────┼─────────────────────────┘
                                   │
                                   ▼
                   [PayPal Platform Orchestration]
                    - Orders v2 (One-Time)
                    - Subscriptions API (Recurring)
                    - Payouts / Multi-Party (Marketplaces)
```

1. **Subscription Intent Orchestration:** Future intent: *"Keep me stocked with artisan dark roast coffee every 2 weeks under $30/month"* $\rightarrow$ Maps to PayPal Subscriptions API (`/v1/billing/subscriptions`).
2. **Multi-Seller Marketplace Settlement:** Future intent: *"Buy the desk from Merchant A and the keyboard from Merchant B"* $\rightarrow$ Maps to PayPal Multiparty Payments & Split Capture.
3. **Live Inventory Connectors:** Decoupled `CatalogProvider` interface allowing interchangeable adapters (`LocalCatalogAdapter`, `ShopifyStorefrontAdapter`, `WooCommerceRestAdapter`).

---

## 6. Scope Freeze Statement

> **FROZEN MVP SCOPE DECLARATION:**
> The 19 core features designated as **FROZEN MVP** constitute the complete and sufficient requirement for the PayPal Intent application. No new architectural abstractions or ancillary feature sets will be added unless directly required to satisfy the Acceptance Criteria.
