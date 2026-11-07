# PayPal Intent — Design System Specification
**Document Version:** 1.0.0
**Status:** Approved Design System
**Deliverable:** Master Prompt 3

---

## 1. Design Philosophy & Direction

The design system for **PayPal Intent** reflects a **modern, trustworthy, and human-governed fintech experience**. It feels at home within the broader PayPal financial ecosystem while remaining clearly identifiable as an independent agentic commerce application.

### Core Visual Principles
1. **Financial Trust & Clarity:** Prioritize crisp legibility, high visual hierarchy, and absolute transparency over decorative flair. Financial figures, taxes, and fees are unambiguous.
2. **Restrained, Professional Palette:** Built around PayPal’s signature deep blues, crisp whites, subtle slate neutrals, and intentional gold highlights for authorized actions.
3. **No Chatbot Tropes:** Replaces generic conversational chat bubbles with structured **workspace modules, goal decomposition graphs, and interactive decision matrices**.
4. **Subtle Elevation & Tactile Borders:** Avoids heavy neon gradients or glassmorphism. Uses clean 1px borders (`border-slate-200`) and soft, refined shadows (`shadow-sm`, `shadow-md`).
5. **Radical State Transparency:** Every interactive element has defined hover, focus, active, loading, disabled, empty, and error states.
6. **Accessible Contrast (WCAG 2.1 AA):** All text elements maintain $\ge 4.5:1$ contrast against their backgrounds.

---

## 2. Color Palette & Design Tokens

```
+─────────────────────────────────────────────────────────────────────────────+
|                         PRIMARY FINTECH PALETTE                             |
+─────────────────────────────────────────────────────────────────────────────+
| Name                 | Hex Code   | Tailwind Token      | Purpose           |
+──────────────────────+────────────+─────────────────────+───────────────────+
| PayPal Deep Navy     | #003087    | paypal-darkBlue     | Brand, headers    |
| PayPal Primary Blue  | #0070BA    | paypal-blue         | Primary CTAs, active|
| PayPal Light Blue    | #009CDE    | paypal-lightBlue    | Accents, focus    |
| PayPal Gold          | #FFC439    | paypal-yellow       | Payment button    |
| Navy Dark (Surface)  | #001C3D    | paypal-dark         | Deep accents      |
+──────────────────────+────────────+─────────────────────+───────────────────+

+─────────────────────────────────────────────────────────────────────────────+
|                         NEUTRALS & STATUS PALETTE                           |
+─────────────────────────────────────────────────────────────────────────────+
| Surface (White)      | #FFFFFF    | bg-white            | Primary cards     |
| Canvas Background    | #F8FAFC    | bg-slate-50         | Application canvas|
| Slate Border Subdued | #E2E8F0    | border-slate-200    | Structural divider|
| Slate Border Medium  | #CBD5E1    | border-slate-300    | Inputs, card edges|
| Text Primary (Dark)  | #0F172A    | text-slate-900      | Headings, metrics |
| Text Secondary       | #475569    | text-slate-600      | Subheadings, specs|
| Text Muted           | #94A3B8    | text-slate-400      | Captions, metadata|
| Success Green        | #059669    | text-emerald-600    | In budget, paid   |
| Warning Amber        | #D97706    | text-amber-600      | Near budget limit |
| Danger Red           | #DC2626    | text-red-600        | Over budget, error|
+─────────────────────────────────────────────────────────────────────────────+
```

---

## 3. Typography & Hierarchy

- **Primary Font Family:** `Plus Jakarta Sans`, system-ui, -apple-system, sans-serif.
- **Monospace Font Family:** `JetBrains Mono`, `Consolas`, monospace (used for SKUs, currency amounts, budget meters, and transaction hashes).

| Hierarchy Token | Font Size | Weight | Line Height | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Hero Title** | 36px / 2.25rem | Extrabold (800) | 1.2 | Landing page hero banner |
| **Page Title** | 24px / 1.5rem | Bold (700) | 1.25 | Screen headers, modal headers |
| **Section Header**| 18px / 1.125rem | Semibold (600) | 1.3 | Category sections, drawer titles |
| **Card Title** | 15px / 0.9375rem | Semibold (600) | 1.4 | Product names, step labels |
| **Body Regular** | 14px / 0.875rem | Regular (400) | 1.5 | Descriptions, explainers |
| **Body Semibold**| 14px / 0.875rem | Semibold (600) | 1.5 | Active tab text, button text |
| **Caption / Meta**| 12px / 0.75rem | Medium (500) | 1.4 | Timestamps, tags, badges |
| **Financial Monospace**| 15px / 0.9375rem | Semibold (600) | 1.0 | Prices, totals, calculations |

---

## 4. Layout Grid, Spacing & Elevation

### 4.1 Spacing Scale
- Base grid unit: **4px** (`0.25rem`).
- Common spacing increments: `p-2` (8px), `p-3` (12px), `p-4` (16px), `p-6` (24px), `p-8` (32px).
- Maximum container width: `max-w-7xl` (1280px) centered with responsive padding (`px-4 sm:px-6 lg:px-8`).

### 4.2 Elevation & Border Tokens
- **Flat Surface:** `bg-white border border-slate-200/80`
- **Subtle Card:** `bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow`
- **Elevated Modal/Drawer:** `bg-white border border-slate-200 shadow-xl`
- **Rounded Corners:** `rounded-lg` (8px for inputs/badges), `rounded-xl` (12px for cards/buttons), `rounded-2xl` (16px for hero banners).

---

## 5. Core Component Design Specifications

### 5.1 Buttons (`Button`)
- **Primary:** Background `#0070BA` (`hover:bg-[#005ea6]`), text white, font weight 600.
- **Secondary:** Background `bg-slate-100` (`hover:bg-slate-200`), text `text-slate-800`.
- **Outline:** Transparent background, `border border-slate-300` (`hover:bg-slate-50`), text `text-slate-700`.
- **PayPal Action:** Background `#FFC439` (`hover:bg-[#f2b930]`), text `#003087` (bold navy), branded styling.
- **Destructive:** Background `bg-red-50 text-red-600 hover:bg-red-100 border border-red-200`.
- **States:** Hover, Active, Disabled (`opacity-50 cursor-not-allowed`), Loading (shows smooth inline SVG spinner).

### 5.2 Form Inputs (`Input`, `Textarea`)
- Border `border-slate-300`, background `bg-white`, text `text-slate-900`.
- Focus state: `focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 outline-none`.
- Error state: `border-red-500 focus:border-red-600 focus:ring-red-500/20`.
- Adornments: Supports left/right prefix icons (currency `$`, search magnifying glass).

### 5.3 Product Cards (`ProductCard`)
- 12px rounded borders, clean white card surface with subtle hover shadow.
- High-contrast 1:1 or 4:3 product thumbnail with fallback SVG placeholder.
- Brand pill badge, SKU label, rating stars with review count.
- Price displayed in bold financial monospace typography.
- Quick actions: "Swap / Replace", "Lock Selection", "Add to Cart", "Compare".

### 5.4 Budget Utilization Gauge (`BudgetMeter`)
- Visual horizontal progress bar indicating current subtotal vs hard ceiling.
- Color dynamics:
  - $< 85\%$ of budget: Blue/Emerald (`bg-emerald-500`) — Healthy headroom.
  - $85\% - 99\%$ of budget: Blue/Amber (`bg-blue-600`) — Optimal utilization.
  - $100\%$ of budget: Deep Blue (`bg-paypal-darkBlue`) — Maximized.
  - $> 100\%$ of budget: Vibrant Red (`bg-red-600`) — Deficit warning.
- Displays numeric headroom remaining (e.g. `"$54.44 remaining under $350.00 ceiling"`).

### 5.5 Modals & Drawers (`Modal`, `Drawer`)
- Modal: Centered dialog box with backdrop blur (`backdrop-blur-sm bg-slate-900/40`), clean header, scrollable body, and action footer.
- Drawer: Right-sliding panel (width `max-w-md` or `max-w-xl`) for alternative product selection and deep comparison matrices without losing workspace context.

### 5.6 Status Badges (`Badge`)
- **Success:** `bg-emerald-50 text-emerald-700 border-emerald-200`
- **Info / Sandbox:** `bg-blue-50 text-blue-700 border-blue-200`
- **Warning:** `bg-amber-50 text-amber-700 border-amber-200`
- **Error / Deficit:** `bg-red-50 text-red-700 border-red-200`
- **Neutral:** `bg-slate-100 text-slate-700 border-slate-200`

### 5.7 Empty & Error States (`EmptyState`, `ErrorState`)
- Illustrated with subtle iconography (Lucide SVG), clear headline, reassuring explanatory body copy, and a primary recovery action button.

---

## 6. Accessibility & Compliance (WCAG 2.1 AA)

1. **Color Contrast:** Every text color exceeds 4.5:1 ratio against white and slate-50 backgrounds. (E.g., `text-slate-900` on white is 16:1, `text-blue-700` is 5.2:1).
2. **Keyboard Navigation:** All interactive elements (buttons, inputs, tabs, drawer toggles) feature visible focus rings (`focus-visible:ring-2 focus-visible:ring-blue-600`).
3. **Screen Readers:** ARIA labels on all icon-only buttons (`aria-label="Close dialog"`). Modals include `role="dialog"` and `aria-modal="true"`.
4. **Form Semantics:** Labels programmatically linked to inputs with helper text and error descriptions.
