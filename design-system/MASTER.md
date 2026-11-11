# PayPal Intent — Design System Master File (MASTER.md)

> **Source of Truth:** Design intelligence generated and validated via `ui-ux-pro-max` for PayPal Intent.
> **Aesthetic Archetype:** Premium Fintech AI Commerce (Stripe Dashboard + Linear + Mercury + PayPal Trust).

---

## 1. Visual Direction & Brand Philosophy

PayPal Intent is an AI-native intention-driven commerce platform. The interface must communicate three core values in every component:
1. **Intelligence:** Natural language purchasing reasoning, goal decomposition, and multi-tier optimization.
2. **Confidence:** Transparent math, authoritative catalog pricing, budget meter headroom, and decision rationale.
3. **Trust & Governance:** Explicit human-in-the-loop authorization, official PayPal Sandbox checkout, cryptographic SHA-256 audit seals, and strict budget ceilings.

### Design Principles
- **Restraint Over Decoration:** No flashy gimmicks, no neon glows, no gratuitous glassmorphism, no childish emojis.
- **Fintech Precision:** Sharp typography hierarchy, tabular figures for currencies, clear status indicators.
- **Spacious & Breathable:** Generous padding (`p-6` to `p-8`), comfortable line heights, clean surfaces.
- **Predictable Microinteractions:** 150ms–250ms smooth transitions, subtle card lifts (`-translate-y-0.5`), visible keyboard focus rings.

---

## 2. Color Palette & Design Tokens

| Role | Token / Class | Hex | Usage |
| :--- | :--- | :--- | :--- |
| **Primary Brand** | `bg-[#0070BA]`, `text-[#0070BA]` | `#0070BA` | PayPal Blue — Primary actions, active navigation, focus rings |
| **Primary Hover** | `bg-[#005ea6]` | `#005ea6` | Primary button hover |
| **Deep Navy** | `bg-[#003087]`, `text-[#003087]` | `#003087` | PayPal Deep Navy — High-emphasis headings, security seals |
| **Canvas Background**| `bg-[#F8FAFC]` | `#F8FAFC` | Slate-50 off-white background |
| **Surface (Cards)** | `bg-white` | `#FFFFFF` | Primary card and modal surfaces |
| **Subtle Surface** | `bg-slate-50` / `bg-slate-100` | `#F1F5F9` | Secondary card headers, code blocks, item trays |
| **Text Primary** | `text-slate-900` | `#0F172A` | Primary headlines, body text (Contrast > 10:1) |
| **Text Secondary** | `text-slate-600` | `#475569` | Explanations, item descriptions (Contrast > 5.5:1) |
| **Text Muted** | `text-slate-400` | `#94A3B8` | Captions, timestamps, disabled indicators |
| **Border Subtle** | `border-slate-200` | `#E2E8F0` | Default card borders, dividers |
| **Border Active** | `border-slate-300` | `#CBD5E1` | Input borders, interactive card borders |
| **Accent / Currency** | `text-amber-700`, `bg-amber-500` | `#F59E0B` | PayPal Gold accent, budget warnings, headroom callouts |
| **Success Emerald** | `text-emerald-700`, `bg-emerald-600`| `#059669` | Feasible budget, captured payments, verified badges |
| **Critical Red** | `text-red-700`, `bg-red-600` | `#DC2626` | Budget ceiling exceeded, blocked checkouts, error states |

---

## 3. Typography Scale & Hierarchies

* **Primary Body & Headings:** `Inter`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`, `sans-serif`
* **Metrics & Pricing:** `Fira Code`, `JetBrains Mono`, `ui-monospace`, `monospace` (strictly for prices, hashes, SKUs, and tabular financial data)

| Element | Size / Weight | Line Height | Usage |
| :--- | :--- | :--- | :--- |
| **Display H1** | `text-3xl` / `font-bold` (30px) | `1.2` | Hero headlines, primary page titles |
| **Section H2** | `text-xl` / `font-semibold` (20px) | `1.3` | Studio titles, cart headings, section headers |
| **Card H3** | `text-base` / `font-semibold` (16px) | `1.4` | Product titles, category card titles |
| **Body Primary**| `text-sm` / `font-normal` (14px) | `1.5` | Standard copy, explanations, form inputs |
| **Body Small** | `text-xs` / `font-medium` (12px) | `1.4` | Badges, metadata, secondary timestamps |
| **Financial Monospace**| `font-mono` / `font-bold` | `1.0` | Prices (`$307.76`), budget limits, math breakdowns |

---

## 4. Spacing, Elevation & Corner Radii

* **Border Radii:**
  * Containers & Modals: `rounded-2xl` (`16px`)
  * Cards & Panels: `rounded-xl` (`12px`)
  * Buttons & Form Inputs: `rounded-lg` (`8px`)
  * Badges & Pills: `rounded-full` (`9999px`)
* **Shadows:**
  * Ambient Card: `shadow-[0_1px_3px_0_rgba(15,23,42,0.06),0_1px_2px_-1px_rgba(15,23,42,0.06)]`
  * Elevated Card: `shadow-[0_4px_12px_0_rgba(15,23,42,0.08)]`
  * Overlay / Modal: `shadow-[0_20px_35px_-10px_rgba(15,23,42,0.18)]`

---

## 5. Screen & Journey Specifications

### A. Global Navigation & App Shell
* Clean top navigation bar with PayPal Intent logo, active route pills, and shopping cart indicator.
* Responsive drawer/dropdown for mobile viewports (< 768px).
* Quick status indicator showing active session ID and PayPal Sandbox connection status.

### B. Homepage / Intent Command Center
* **Hero Section:** "Shop by intention. Decide with intelligence."
* **AI Command Interface:** Refined multi-line prompt box with contextual intent suggestions (e.g., "Complete Home Workstation", "College Study Desk under $300", "Podcasting Setup").
* **Parameters Bar:** Inline controls for budget ceiling ($), hard vs. soft ceiling toggle, and priority/urgency.
* **Instant Validation:** Helpful character counts, feedback, and seamless transition to workspace analysis.

### C. Workspace / Goal Decomposition
* Visual summary of extracted goals, target categories, detected constraints, and missing criteria.
* Category requirements table/cards with priority badges (Essential vs. Nice-to-Have).
* Inline edit/add category capabilities without leaving the workflow.

### D. Decision & Optimization Studio
* **Header / Budget Meter:** Live interactive budget bar showing subtotal, 8% tax, grand total vs. hard ceiling, and remaining headroom or deficit.
* **Tier Selector:** Seamless switching between "Budget-Conscious", "Balanced Choice", and "Performance Pick".
* **Selected Product Cards:** 4:3 high-quality product images, authoritative database pricing, compatibility rating, AI rationale ("Why this was selected"), and one-click "Swap" drawer.
* **Feasibility Alerts:** Unambiguous warning banner when a combination exceeds the ceiling, preventing checkout until solved.

### E. Catalog Discovery
* Premium e-commerce grid with category filter chips, search bar, and price range sliders.
* Product cards with stock badges, rating stars, specs overview, and "Add to Cart" / "Select for Intent" triggers.

### F. Shopping Cart
* Itemized review table with thumbnail, title, unit price, quantity steppers, and remove actions.
* Authoritative server price reconciliation breakdown (Subtotal, Estimated Tax at 8%, Shipping Free).
* Hard budget ceiling lock guarding the checkout CTA.

### G. Payment & Sandbox Review
* Official PayPal Sandbox Gateway badge and merchant identity (`PayPal Intent Demo Store`).
* Human-in-the-Loop Governance Notice emphasizing explicit user authorization.
* Official PayPal JavaScript SDK buttons with stable memoized options.
* Redirect fallback and retry recovery cards.

### H. Transaction History & Digital Receipts
* Ledger table of past purchases with SHA-256 cryptographic audit seal, PayPal capture ID, timestamp, and amount.
* Digital Receipt modal showing verified line items, breakdown, and exportable receipt snapshot.

### I. Settings
* System health monitoring: Ollama LLM status, PayPal Sandbox credentials status, SQLite database latency, and active session reset.

---

## 6. Pre-Delivery & Accessibility Checklist

- [x] No raw emojis as UI icons — exclusively Lucide SVG icons.
- [x] `cursor-pointer` on all clickable interactive items.
- [x] Smooth CSS transitions (`150ms` to `250ms`) on hovers and focus states.
- [x] Accessible color contrast (minimum 4.5:1 text, 3:1 graphical elements).
- [x] Visible focus rings (`focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0070BA]`).
- [x] Fully responsive from 390px mobile to 1440px desktop without horizontal clipping or scrollbar jumps.
- [x] Strict preservation of PayPal JavaScript SDK lifecycle and idempotency logic.
