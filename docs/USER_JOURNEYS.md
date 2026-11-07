# PayPal Intent — Comprehensive User Journeys & Interaction Design
**Document Version:** 1.0.0
**Status:** Frozen MVP Architecture
**Deliverable:** Master Prompt 1

---

## 1. Journey Architecture Overview

The core philosophy of **PayPal Intent** is to shift the user experience from *tedious catalog micro-management* to *strategic goal delegation with governed financial authorization*.

The interaction is modeled as a 7-stage state machine:
```
  [1. INTENT INPUT]
          │
          ▼
  [2. AGENT DECOMPOSITION]
          │
          ▼
  [3. CONSTRAINT OPTIMIZATION]
          │
          ▼
  [4. PROPOSAL & EXPLANATION] ◄────┐ (Interactive
          │                        │  Refinement Loop)
          ▼                        │
  [5. CART PREPARATION & LOCK] ────┘
          │
          ▼
  [6. PAYPAL SANDBOX AUTH]
          │
          ▼
  [7. TRANSACTION RECEIPT & AUDIT]
```

---

## 2. Journey 1: The Golden Path — High-Level Goal to PayPal Capture

**User Persona:** Maya, an independent voice actor and audio storyteller.
**Objective:** Set up a clean, broadcast-ready desktop audio recording station with a hard budget of $350.

### Step 1: Entry & Prompting
- Maya navigates to the PayPal Intent web interface (`http://localhost:3000`).
- The interface greets her with a clean, high-focus intent input portal, featuring quick archetype suggestions:
  - *"Ergonomic WFH Desk Setup under $400"*
  - *"Solo Creator YouTube Studio under $350"*
  - *"Cold-Weather Camping Gear under $300"*
- Maya types:
  `"I need to start recording professional voiceover audio at my desk. My hard budget is $350. I need broadcast quality and low background noise."`

### Step 2: Intent Deconstruction & Entity Extraction
- Within 1.5 seconds, the local Ollama LLM analyzes the prompt and extracts the core parameters:
  - **Objective:** Professional Voiceover Desktop Setup
  - **Budget Ceiling:** $350.00 USD (Strict)
  - **Identified Constraints:** High dynamic range, noise rejection (cardioid/dynamic), desk-mounted.
  - **Decomposed Sub-Goals:**
    1. Dynamic Microphone with cardioid polar pattern.
    2. Adjustable suspension boom arm with cable management.
    3. Dual-layer mesh pop filter & shock mount.
    4. Closed-back studio monitoring headphones.

### Step 3: Catalog Discovery & Multi-Product Optimization
- The Catalog Engine scans available inventory across the *Audio/Video Production* category.
- The Constraint Optimization Solver evaluates candidates against the $350 budget ceiling:
  - Candidate 1: Shure-style Dynamic XLR Mic ($149.99) vs USB Broadcast Mic ($99.99) vs Entry USB Condenser ($49.99).
  - The solver evaluates total bundle compatibility. If it selects an XLR mic, it also needs an audio interface (which would break the $350 ceiling).
  - Therefore, the solver selects a premium broadcast-grade USB dynamic mic with built-in DSP, staying within budget while preserving studio quality.
- Selected Optimal Bundle:
  1. **AuraVoice Pro USB Broadcast Dynamic Mic** — $129.99
  2. **Articulated Low-Profile Desk Boom Arm** — $69.99
  3. **AcoustiShield Metal/Mesh Dual Pop Filter** — $29.99
  4. **StudioPure 40mm Closed-Back Reference Headphones** — $89.99
  - **Subtotal:** $319.96
  - **Estimated Tax (8%):** $25.60
  - **Grand Total:** $345.56 (Under $350 budget by $4.44)

### Step 4: Proposal Presentation & Transparent Explainability
- The UI transitions smoothly to the **Proposal Studio**:
  - **Budget Allocation Gauge:** Visualizes $345.56 / $350.00 with green "Within Budget" badge.
  - **Goal Breakdown Tree:** Shows the 4 essential categories mapped to the selected items.
  - **AI Rationale Accordion:** Explains *why* each item was picked:
    - *"Chose the AuraVoice Dynamic Mic over condenser alternatives to reject ambient room reverb and avoid needing an external audio interface, saving $110."*
    - *"Paired with closed-back headphones to prevent headphone bleed into the microphone during active tracking."*
  - **Alternative Comparisons:** For each item, shows 1 budget alternative and 1 premium alternative with instant swap previews.

### Step 5: User Review & Cart Preparation
- Maya reviews the bundle. She is impressed by the compatibility reasoning and agrees with the selections.
- She clicks **"Prepare PayPal Order"**.
- The backend validates the live inventory, freezes the prices, constructs a cryptographic server-side payload, and requests an order token from PayPal Sandbox.

### Step 6: Governed PayPal Sandbox Checkout
- The official PayPal Smart Payment Button renders directly in the UI.
- Maya clicks the **PayPal Checkout** button.
- A secure PayPal Sandbox authentication modal opens:
  - Merchant: `PayPal Intent Demo Store`
  - Total: `$345.56 USD`
  - Itemized Breakdown: Shows all 4 items, shipping ($0.00), and sales tax ($25.60).
- Maya logs in using her designated PayPal Sandbox Buyer credentials and clicks **"Pay Now"**.

### Step 7: Server-Side Capture & Permanent Audit Record
- The PayPal modal closes. The frontend receives the authorization callback and calls `POST /api/orders/{orderId}/capture`.
- The backend executes the server-side capture against `api-m.sandbox.paypal.com`.
- PayPal returns `status: "COMPLETED"`, along with capture ID `CAP-8849201938`.
- The system persists the complete intent audit trace (Raw query, decomposed goals, bundle choices, trade-offs, and PayPal transaction ID).
- Maya is presented with a **Purchase Summary & Intent Completion Dashboard**:
  - Printable receipt with PayPal transaction verification code.
  - Breakdown of items and savings against her initial budget.
  - Estimated delivery timeline and fulfillment simulation.

---

## 3. Journey 2: Interactive Plan Modification & Real-Time Rebalancing

**User Persona:** Marcus, a remote software developer.
**Objective:** WFH Ergonomic Desk Setup with a $500 budget.

1. **Initial Proposal:**
   - Marcus inputs: `"Ergonomic desk accessories under $500 to relieve wrist and neck tension."`
   - Agent proposes:
     - Ergonomic Split Keyboard: $149.99
     - Vertical Ergonomic Mouse: $69.99
     - Dual Gas Spring Monitor Arm: $89.99
     - Memory Foam Standing Desk Mat: $59.99
     - Total: $369.96 (Remaining budget: $130.04).
2. **User Intervention:**
   - Marcus says: *"I already own a good mouse. Can we remove the mouse and get a motorized laptop riser instead?"*
   - Alternatively, Marcus directly clicks the **"Swap Item"** button on the Vertical Mouse card.
3. **Reactive Re-Optimization:**
   - The UI provides a catalog alternative drawer filtered for the category.
   - Marcus selects: **Motorized Stepless Laptop Riser** ($119.99).
   - The Constraint Engine instantly re-evaluates the mathematical balance:
     - Split Keyboard ($149.99) + Monitor Arm ($89.99) + Standing Mat ($59.99) + Laptop Riser ($119.99) = $419.96.
     - With tax: $453.56.
   - The Budget Gauge animates smoothly from $369.96 to $453.56, showing $46.44 still remaining under the $500 ceiling.
4. **Locking Selections:**
   - Marcus clicks the **"Lock"** icon on the Laptop Riser to prevent the AI from substituting it if he triggers further broad modifications.
   - He approves the adjusted plan and proceeds to PayPal checkout.

---

## 4. Journey 3: Budget Deficit & Trade-Off Mitigation

**User Persona:** Alex, a budget-conscious student.
**Objective:** Unrealistic expectation — `"Build a complete professional 4K video editing studio with cameras and lighting for $150."`

1. **Intent Analysis & Deficit Detection:**
   - The system parses the intent: Camera, lens, key light, microphone, tripod.
   - The Catalog Discovery Engine finds the minimum viable cost for these combined categories is approximately $480.
   - The Constraint Solver detects a **Budget Deficit**:
     $$\text{Deficit} = \text{Minimum Viable Cost} (\$480) - \text{User Budget} (\$150) = \$330 \text{ shortfall}.$$
2. **Graceful Agentic Negotiation:**
   - Rather than throwing an unhelpful error or hallucinating non-existent $20 4K cameras, the Agent presents a **Transparent Trade-Off Advisory**:
     > *"A full multi-component 4K studio setup requires a baseline of at least $450 to meet hardware requirements. With a $150 budget ceiling, we recommend one of two paths:"*
     - **Option A (Smartphone Studio Optimization):** Maximize your existing smartphone with a professional mobile rig, shotgun microphone, and 60W bi-color LED ring light. (Total: $138.50).
     - **Option B (Essential Audio First):** Focus 100% of the $150 on broadcast-grade microphone and acoustic treatment, since audio quality is 70% of perceived video production value. (Total: $142.00).
     - **Option C (Adjust Budget):** Raise budget to $480 to include dedicated optical 4K capture hardware.
3. **Resolution:**
   - Alex selects **Option A (Smartphone Studio)**.
   - The agent updates the plan, populates the cart with smartphone lighting and audio gear, and enables Alex to successfully checkout with PayPal under his $150 limit.

---

## 5. Journey 4: Ambiguous Intent & Domain Boundary Guidance

**User Persona:** Jordan, testing the system boundaries.
**Input:** `"Make my life better today."` or `"Book me a flight to Miami."`

1. **Boundary Recognition:**
   - The Intent Parser recognizes the input does not correspond to supported physical goods commerce verticals (or is hyper-ambiguous).
2. **Helpful Clarification & Category Discovery:**
   - The Agent responds:
     > *"PayPal Intent is an AI commerce agent specialized in physical setup and gear goals. I can't book flights or tickets yet, but I can help you equip your environment! Here are goals I can plan and execute for you right now:"*
     - [WFH & Ergonomics Setup]
     - [Content Creator Studio]
     - [Outdoor & Camping Excursion]
     - [Fitness & Athletic Training]
     - [Smart Home Automation]
     - [Artisan Coffee & Kitchen Barista]
   - Jordan clicks **"Artisan Coffee & Kitchen Barista"**, which pre-fills the prompt: `"Assemble a precision pour-over coffee bar with digital scale and burr grinder under $200."`

---

## 6. Journey 5: Transaction History & Order Audit Inspection

**User Persona:** Maya, returning to the app after 3 days.

1. **Navigation:**
   - Maya clicks the **"History / Receipts"** icon in the header.
2. **Audit Drawer Display:**
   - Shows chronological list of past transactions.
   - Entry: `Order #8RG83921KJ9102938` — *"Professional Voiceover Desktop Setup"* ($345.56 USD).
   - Date: November 5, 2026.
   - PayPal Capture Reference: `CAP-8849201938`.
3. **Deep-Dive Audit View:**
   - Clicking the order reveals:
     - Original prompt entered by Maya.
     - Exact AI rationale captured at the time of purchase.
     - Itemized SKU list with prices.
     - Direct PayPal receipt verification indicator.
     - One-click "Clone Intent" button to re-run or adapt the setup for a colleague.

---

## 7. UI Wireframe & State Transition Map

```
+-------------------------------------------------------------------------------+
|  PAYPAL INTENT           [ Archetypes ]  [ Past Orders (2) ]  [ Sandbox Active]|
+-------------------------------------------------------------------------------+
|                                                                               |
|   "What do you want to accomplish?"                                           |
|   +-----------------------------------------------------------------------+   |
|   | Enter your goal, budget, and constraints...                     [Go]  |   |
|   +-----------------------------------------------------------------------+   |
|                                                                               |
|   [State 1: Processing Intent... Analyzing budget and decomposing steps]      |
|                                                                               |
|   +-----------------------------------------------------------------------+   |
|   | PLAN OVERVIEW: Home Voiceover Studio                                  |   |
|   | Budget: [===========================.......] $345.56 / $350.00 (98%)  |   |
|   +-----------------------------------------------------------------------+   |
|                                                                               |
|   +-----------------------------------+   +-------------------------------+   |
|   | RECOMMENDED BUNDLE (4 Items)      |   | AI DECISION RATIONALE         |   |
|   |                                   |   |                               |   |
|   | [Microphone Card]          $129.99|   | Why USB Dynamic Mic?          |   |
|   |  - AuraVoice Pro USB Dynamic      |   | Eliminates need for audio     |   |
|   |  [Swap] [Lock] [Details]          |   | interface, saving $110 while  |   |
|   |                                   |   | rejecting ambient room noise. |   |
|   | [Boom Arm Card]            $69.99 |   |                               |   |
|   |  - Low-Profile Desk Arm           |   | Why Closed-Back Headphones?   |   |
|   |  [Swap] [Lock] [Details]          |   | Prevents monitor bleed into   |   |
|   |                                   |   | recordings during vocal takes.|   |
|   | [Pop Filter Card]          $29.99 |   |                               |   |
|   | [Studio Headphones Card]   $89.99 |   | Compatibility: 100% Verified  |   |
|   +-----------------------------------+   +-------------------------------+   |
|                                                                               |
|   +-----------------------------------------------------------------------+   |
|   | ORDER TOTAL: $345.56 (Items: $319.96 | Tax: $25.60 | Shipping: $0.00) |   |
|   |                                                                       |   |
|   |   [  Authorize & Pay with  PayPal  ]  <-- Official Sandbox Button     |   |
|   |   (Explicit approval required. No funds transferred without approval) |   |
|   +-----------------------------------------------------------------------+   |
+-------------------------------------------------------------------------------+
```
