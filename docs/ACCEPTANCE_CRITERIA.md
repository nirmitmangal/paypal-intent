# PayPal Intent — Measurable Acceptance Criteria & Test Specifications
**Document Version:** 1.0.0
**Status:** Frozen MVP Architecture
**Deliverable:** Master Prompt 1

---

## 1. Acceptance Testing Framework

All features in the PayPal Intent MVP must satisfy concrete, quantifiable, and automated acceptance criteria. Tests are formulated using the standard **Given-When-Then (Gherkin)** behavioral specification and enforced via automated test suites.

---

## 2. Core Feature Acceptance Criteria

### AC-1: Natural Language Intent Parsing & Entity Extraction
- **Objective:** Reliably extract user objective, budget, and constraints from natural language inputs.
- **Criteria:**
  - **Given** a raw user input containing a goal and budget (e.g., *"Set up an ergonomic desk for remote work under $400"*),
  - **When** the intent parsing pipeline processes the text via Ollama,
  - **Then**:
    1. `objective` must be a non-empty string summarizing the intent.
    2. `budget.amount` must evaluate to exactly `400.00` with `budget.currency == "USD"`.
    3. `budget.isHardCeiling` must be `true`.
    4. Response latency must be $< 3.5\text{ seconds}$ on standard local hardware.
    5. In the absence of a stated budget, the parser must assign a reasonable default tier or flag `needs_budget_clarification: true`.

### AC-2: Goal Decomposition & Functional Role Assignment
- **Objective:** Break high-level objectives into balanced, non-overlapping product categories.
- **Criteria:**
  - **Given** a valid parsed intent (e.g., *"Podcast studio setup for 2 people under $500"*),
  - **When** the goal decomposition engine generates the execution plan,
  - **Then**:
    1. Output must produce between 3 and 5 distinct functional categories (e.g., `Microphones`, `Audio Interface`, `Boom Arms`, `Headphones`).
    2. Each category must have a defined priority: either `"essential"` or `"recommended"`.
    3. The sum of estimated budget shares across all essential categories must equal $\le 1.0$.
    4. Categories must directly align with available domains in the catalog.

### AC-3: Catalog Discovery & Attribute Filtering
- **Objective:** Retrieve candidate SKUs matching each decomposed category without missing compatible options.
- **Criteria:**
  - **Given** 3 to 5 decomposed categories,
  - **When** the catalog discovery engine queries the 120+ item catalog,
  - **Then**:
    1. Each category must return at least 2 distinct candidate SKUs (providing budget and premium alternatives).
    2. All returned items must have `inStock == true`.
    3. Every item must have valid numerical `price > 0`, non-empty `specifications`, and assigned `compatibilityTags`.

### AC-4: Deterministic Knapsack Budget Optimization
- **Objective:** Select a combination of items that strictly adheres to the budget ceiling while maximizing utility and compatibility.
- **Criteria:**
  - **Given** candidate items across all decomposed categories and a user budget ceiling $B$,
  - **When** the optimization solver executes,
  - **Then**:
    1. **Strict Budget Invariance:** The calculated grand total (including estimated tax of 8%) must satisfy:
       $$\text{Grand Total} = \sum_{i} \text{Price}_i \times 1.08 \le B$$
    2. **Zero Price Hallucination:** Every item price in the proposal must match the catalog's authoritative price down to the cent.
    3. **Completeness:** Exactly 1 primary item must be selected for each `"essential"` category.
    4. **Execution Speed:** The mathematical optimization must resolve in $< 50\text{ milliseconds}$.

### AC-5: Cross-Item Compatibility Verification
- **Objective:** Ensure selected products work together physically and technically.
- **Criteria:**
  - **Given** candidate combinations from the catalog,
  - **When** the compatibility checker evaluates cross-category constraints,
  - **Then**:
    1. If an XLR microphone is selected, an audio interface or XLR-to-USB converter must be included in the bundle.
    2. If a monitor arm is selected, the desk surface thickness must fall within the arm clamp's minimum and maximum clearance range.
    3. If any incompatibility is detected, the solver must reject the pairing and select a compatible alternate.

### AC-6: Explainable AI & Transparent Decision Rationales
- **Objective:** Provide clear, auditable justifications for product selections and trade-offs.
- **Criteria:**
  - **Given** an optimized product bundle,
  - **When** the proposal is rendered in the UI,
  - **Then**:
    1. Each item card must display a distinct `selectionReason` explaining why it was chosen.
    2. Items that required budget compromises must display a `tradeOffNotes` entry (e.g., *"Chose manual height adjustment to leave $120 for an ergonomic chair"*).
    3. The UI must render an inspectable comparison drawer showing at least 1 cheaper alternative and 1 premium alternative per item.

### AC-7: Interactive Customization (Swap, Lock & Rebalance)
- **Objective:** Allow the user to modify the plan while maintaining budget constraints.
- **Criteria:**
  - **Given** an active proposal bundle,
  - **When** a user clicks "Swap" on an item and chooses an alternate,
  - **Then**:
    1. The cart total and budget gauge must update immediately.
    2. If the swap causes $\text{Total} > B$, the UI must highlight the deficit in red, flag the excess amount, and suggest compensating downgrades in other non-locked categories.
  - **When** a user toggles the "Lock" icon on an item,
  - **Then**:
    1. That item cannot be replaced by any automated "Re-optimize" action.

### AC-8: PayPal Sandbox Server-Side Order Creation
- **Objective:** Formulate and transmit compliant PayPal Orders v2 requests from the backend.
- **Criteria:**
  - **Given** a frozen cart reviewed and approved by the user,
  - **When** the user clicks "Proceed to PayPal Checkout",
  - **Then**:
    1. The backend must acquire a valid OAuth2 bearer token from `https://api-m.sandbox.paypal.com/v1/oauth2/token` using cached token management.
    2. The backend must dispatch `POST /v2/checkout/orders` with:
       - `intent: "CAPTURE"`
       - Accurate `purchase_units` with line items, tax breakdown, and currency code (`USD`).
       - Custom intent metadata stored in `custom_id` or invoice ID.
    3. The endpoint must return HTTP 201 with a valid PayPal Order ID (`id` matching PayPal format, e.g. `8RG...`).
    4. **Zero Frontend Secrets:** No PayPal Client Secret may ever appear in network payloads sent to the client browser.

### AC-9: Governed User Approval & Server-Side Payment Capture
- **Objective:** Guarantee that payments are only captured upon interactive user authorization in the PayPal Sandbox popup.
- **Criteria:**
  - **Given** an active PayPal Sandbox order ID,
  - **When** the user approves the payment inside the PayPal modal,
  - **Then**:
    1. The client invokes `POST /api/orders/{orderId}/capture`.
    2. The backend dispatches `POST /v2/checkout/orders/{orderId}/capture` to PayPal Sandbox.
    3. The response must contain `status: "COMPLETED"` and a non-empty `capture_id`.
    4. Under no circumstance may the system capture an order without prior interactive approval (HTTP 422 / error handled gracefully).
    5. Duplicate capture attempts for the same order must be blocked by idempotency guards.

### AC-10: Transaction Audit Logging & Summary Receipt
- **Objective:** Permanently record the transaction and present a comprehensive purchase receipt.
- **Criteria:**
  - **Given** a successfully captured PayPal order,
  - **When** the confirmation view is rendered,
  - **Then**:
    1. The system must display:
       - PayPal Order ID & PayPal Capture ID.
       - Itemized list of purchased SKUs, quantities, and prices.
       - Original user intent query and summary of goals met.
       - Financial breakdown (Subtotal, Tax, Total, Budget Savings).
    2. An immutable record must be written to the local audit store containing the full intent-to-payment lifecycle trace.
    3. The transaction must appear in the "Past Orders" drawer upon subsequent visits.

### AC-11: Zero-Cost Execution & Error Resilience
- **Objective:** Ensure the entire application runs locally without external paid dependencies or unhandled crashes.
- **Criteria:**
  - **Given** a clean development machine with Node.js, Python, and Ollama installed,
  - **When** the application is started via standard commands,
  - **Then**:
    1. No paid API keys (OpenAI, Anthropic, AWS, etc.) are requested or required.
    2. If Ollama is offline or fails to respond within 5 seconds, the application must display a clear, helpful warning and fall back to structured heuristics rather than crashing.
    3. All TypeScript / Python type checks and test suites must pass with zero fatal errors.

---

## 3. Verification & Compliance Matrix

| Acceptance Criterion | Verification Method | Automated Test File (Prompt 9 Target) |
| :--- | :--- | :--- |
| **AC-1 (Intent Extraction)** | Automated Jest/PyTest unit tests with 20 sample intent prompts. | `tests/intent-parser.test.ts` |
| **AC-2 (Goal Decomposition)** | Schema validation test verifying 3-5 categories and priority rules. | `tests/goal-planner.test.ts` |
| **AC-3 (Catalog Discovery)** | Catalog integrity suite ensuring 100% of SKUs have specs & pricing. | `tests/catalog-engine.test.ts` |
| **AC-4 (Knapsack Optimizer)** | Mathematical boundary tests verifying total $\le$ budget across 50 runs. | `tests/optimizer.test.ts` |
| **AC-5 (Compatibility)** | Rule matrix tests checking hardware connection constraints. | `tests/compatibility.test.ts` |
| **AC-6 (Explainability)** | Rationale existence tests asserting non-empty reasons and trade-offs. | `tests/explainability.test.ts` |
| **AC-7 (Cart Customization)** | State machine tests verifying dynamic recalculation on item swap/lock. | `tests/cart-state.test.ts` |
| **AC-8 (PayPal Order Creation)** | Integration test against PayPal Sandbox API checking 201 response. | `tests/paypal-order.test.ts` |
| **AC-9 (Payment Capture)** | End-to-end sandbox capture test verifying COMPLETED status. | `tests/paypal-capture.test.ts` |
| **AC-10 (Audit Logging)** | Database integrity test verifying intent-to-receipt persistent trace. | `tests/audit-history.test.ts` |
| **AC-11 (Zero-Cost & Fallback)** | Offline test verifying heuristic fallback when Ollama is mocked down. | `tests/resilience.test.ts` |
