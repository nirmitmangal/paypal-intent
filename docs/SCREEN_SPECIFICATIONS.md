# PayPal Intent — Screen Specifications & Functional Blueprints
**Document Version:** 1.0.0
**Status:** Approved Functional Specifications
**Deliverable:** Master Prompt 3

---

## 1. Overview of Application Screens

The PayPal Intent application is organized into nine interconnected, fully functional screens (A through I) accessible via a clean, persistent top-level navigation shell:

```
[NAVBAR] PayPal Intent (Logo)  [Home] [Workspace] [Discovery] [Cart (N)] [History] [Settings]
```

---

## 2. Screen A: Landing / Home

### 2.1 Purpose & User Context
The entry point that introduces the core proposition of intention-driven commerce, showcases goal archetypes, and provides an immediate natural language launchpad.

### 2.2 Layout & Key Components
1. **Hero Banner:**
   - Headline: *"Tell the system what you want to accomplish. AI handles the complexity of commerce while you remain in control of every payment."*
   - Subtitle: Clear explanation of goal decomposition, multi-product knapsack optimization, and PayPal Sandbox execution.
   - Badge: `AI Agentic Commerce • Independent Hackathon Prototype`.
2. **Central Intent Input Portal:**
   - Spacious multiline text input with placeholder: *"e.g., Set up a 2-person podcast recording studio under $400..."*
   - Currency and budget extraction preview pill.
   - Primary Action Button: `[Analyze & Plan Goal]`.
3. **Suggested Goal Archetype Chips:**
   - *"WFH Ergonomic Desk under $400"*
   - *"Solo Creator YouTube Studio under $350"*
   - *"Weekend Backpacking Gear under $300"*
   - *"Home Barista Coffee Station under $200"*
   - Clicking any chip pre-populates the input and triggers the intent workflow.
4. **"How PayPal Intent Works" Feature Cards:**
   - 4-step progressive card grid: (1) State Your Goal, (2) AI Goal Decomposition, (3) Mathematical Knapsack Optimization, (4) Governed PayPal Checkout.
5. **System Readiness Indicator:** Live pill showing SQLite database status, local Ollama engine status, and PayPal Sandbox configuration.

---

## 3. Screen B: Intent Workspace

### 3.1 Purpose & User Context
The active workspace where a user’s raw prompt is analyzed, displaying extracted entities and tracking the AI planning workflow.

### 3.2 Layout & Key Components
1. **Goal Header Card:** Displays verbatim user prompt, extracted primary objective, and assigned session token.
2. **Extracted Parameters Matrix:**
   - **Budget Ceiling:** Numeric budget with currency badge and "Strict Ceiling" guarantee.
   - **Identified Constraints:** List of detected requirements (e.g. "Low noise floor", "Ergonomic support").
   - **Urgency & Delivery:** Standard delivery timeline estimation.
3. **Planning Progress Timeline:**
   - Step 1: Semantic Intent Ingestion (Complete).
   - Step 2: Category Role Decomposition (Complete).
   - Step 3: Catalog Discovery & Compatibility Matrix (In Progress / Complete).
   - Step 4: Multi-Product Knapsack Optimization (Complete).
4. **Action Triggers:** `[View Execution Plan]`, `[Refine Constraints]`.

---

## 4. Screen C: Planning Interface

### 4.1 Purpose & User Context
Enables users to inspect and customize the AI's structural decomposition of their goal before product selection.

### 4.2 Layout & Key Components
1. **Category Requirement Cards:**
   - Displays each decomposed functional role (e.g. "Dynamic Broadcast Mic", "Suspension Boom Arm", "Studio Headphones").
   - Priority Tag: `Essential` vs `Recommended` vs `Optional`.
   - Estimated Budget Share: Visual percentage allocation meter (e.g. 40%, 20%, 25%, 15%).
2. **Interactive Priority Editor:**
   - Users can toggle priorities or adjust target budget share sliders.
3. **Execution Controls:**
   - `[Re-Balance Plan]`, `[Proceed to Product Selection]`.

---

## 5. Screen D: Product Discovery & Comparison

### 5.1 Purpose & User Context
Allows users to browse catalog inventory, filter by specifications, and perform side-by-side technical comparisons.

### 5.2 Layout & Key Components
1. **Discovery Toolbar:**
   - Category filter tabs (`All`, `Audio/Video`, `Ergonomics`, `Outdoor`, `Fitness`, `Smart Home`, `Coffee`).
   - Keyword search bar (`title`, `brand`, `specs`).
   - Price slider filter ($\le \text{Max Price}$).
2. **Product Grid:**
   - Responsive cards with high-contrast imagery, brand badge, SKU, rating stars, price in financial monospace, and stock status.
   - Interactive buttons: `[Add to Cart]`, `[Compare]`.
3. **Side-by-Side Comparison Drawer:**
   - Slide-over panel activated when 2+ items are selected.
   - Shows attributes side-by-side: Price, Brand, Rating, Dimensions, Connection types, Compatibility tags.
   - Clear winner indicator highlighting best value per dollar.

---

## 6. Screen E: Decision Workspace (AI Optimization Studio)

### 6.1 Purpose & User Context
The centerpiece of PayPal Intent: where optimized multi-product bundles are reviewed, customized, and verified against the budget ceiling.

### 6.2 Layout & Key Components
1. **Tier Selection Tabs:**
   - `[Budget-Conscious]` (Focuses on extreme cost savings).
   - `[Balanced (Recommended)]` (Optimal utility-to-cost ratio).
   - `[Performance / Pro]` (Maximizes durability and features within budget).
2. **Real-Time Budget Allocation Meter:**
   - Visual gauge showing subtotal, estimated 8% tax, and remaining headroom.
   - Color-coded: Emerald for healthy headroom, deep blue for optimal utilization, red for deficit.
3. **Interactive Recommended Bundle Cards:**
   - Itemized list of chosen SKUs across each category.
   - `[Swap Item]` action: Opens drawer to select alternate catalog items with instant price delta preview.
   - `[Lock Item]` action: Pins item so automated re-optimization leaves it untouched.
4. **Transparent AI Decision Explainer:**
   - Distinct callout box detailing *why* each item was selected.
   - Explains trade-offs made (e.g., *"Selected USB dynamic mic over XLR to eliminate need for $110 audio interface"*).
5. **Proceed Action:** `[Lock Bundle & Review Cart]`.

---

## 7. Screen F: Shopping Cart

### 7.1 Purpose & User Context
The staged order review screen where final quantities, line-item totals, and tax breakdowns are verified before initiating payment.

### 7.2 Layout & Key Components
1. **Line-Item Table:**
   - Product thumbnail, title, SKU, unit price, quantity stepper, line total, and remove icon.
2. **Order Summary Card:**
   - Subtotal.
   - Estimated Sales Tax (8.0%).
   - Shipping & Handling ($0.00 — Complimentary Standard).
   - **Grand Total Amount** in prominent typography.
   - Comparison against user's original budget ceiling (e.g., *"Saved $14.44 against your $350 budget"*).
3. **Checkout Initiation Button:**
   - `[Proceed to PayPal Checkout]`.
   - Security disclaimer: *"Payment processed securely via official PayPal Sandbox. Explicit approval required."*

---

## 8. Screen G: Payment (PayPal Sandbox Checkout)

### 8.1 Purpose & User Context
The governed payment execution screen featuring official PayPal Sandbox interaction.

### 8.2 Layout & Key Components
1. **Order Summary Verification Box:**
   - Merchant Name: `PayPal Intent Demo Store`.
   - Order Number: `PI-XXXXX-XXX`.
   - Verified Total Amount: `$XXX.XX USD`.
2. **Payment Lifecycle States:**
   - **State 1 (Ready for Approval):** Renders official PayPal Smart Buttons container or Sandbox Interactive Approval Trigger.
   - **State 2 (Authorizing):** Displays active authorization spinner with Sandbox user feedback.
   - **State 3 (Server Capturing):** Displays server-side capture verification against `api-m.sandbox.paypal.com`.
   - **State 4 (Success Receipt):** Shows verified PayPal Capture ID (`CAP-...`), payment breakdown, immutable transaction hash, and printable receipt.
   - **State 5 (Failure / Retry):** Actionable error state with clear recovery instructions if credentials or sandbox network fail.

---

## 9. Screen H: Activity & Transaction History

### 9.1 Purpose & User Context
Permanent audit trail where users can inspect past purchasing intents, view itemized receipts, and verify PayPal capture records.

### 9.2 Layout & Key Components
1. **Transaction Ledger Cards:**
   - Chronological list of orders with Order Number, Date, Status Badge (`CAPTURED / COMPLETED`), and Amount.
   - Original Intent Prompt display.
2. **Deep-Dive Receipt Modal:**
   - Clicking any transaction opens a detailed digital receipt showing itemized SKUs, quantities, fees, and the SHA-256 transaction hash.
   - `[Clone Intent]` action to re-run or adapt a previous goal.

---

## 10. Screen I: Settings & Diagnostics

### 10.1 Purpose & User Context
Transparency and configuration dashboard showing system health, local AI parameters, and user preferences.

### 10.2 Layout & Key Components
1. **Local AI Engine Status:**
   - Connection status indicator (`Ready` / `Offline`).
   - Active Model Name (`qwen2.5:3b`).
   - Endpoint URL (`http://127.0.0.1:11434`).
   - Test Ping button with latency metric.
2. **PayPal Sandbox Configuration:**
   - Environment Mode (`sandbox`).
   - Client ID configured flag.
   - API Base URL (`api-m.sandbox.paypal.com`).
3. **Database Diagnostics:**
   - SQLite Path (`./data/paypal_intent.db`).
   - Total Relational Tables (13).
   - Journal Mode (`WAL`).
4. **User Preferences Editor:**
   - Preferred Currency (`USD`).
   - Default Quality Tier (`balanced`).
   - Clear local session cache action.
