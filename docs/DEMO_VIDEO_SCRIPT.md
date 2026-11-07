# Demonstration Video Script: PayPal Intent
**Runtime**: 2 minutes 55 seconds (Under 3-Minute Hackathon Limit)
**Target Audience**: PayPal AI Hackathon Judges, Product Evaluators, Engineers
**Production Format**: Screen Recording of Real Working Application + Synchronized Voiceover + Clean Visual Overlays

---

## ⏱️ Video Timeline & Sequence Overview

```
0:00 ───┬─── 0:20 : The E-Commerce Friction Problem
0:20 ───┼─── 0:40 : Introducing PayPal Intent
0:40 ───┼─── 1:35 : Live Demo: Intent Decomposition, Planning & Customization
1:35 ───┼─── 2:15 : Live Demo: Atomic Cart Sync & PayPal Sandbox Checkout
2:15 ───┼─── 2:40 : Digital Receipt, SHA-256 Seal & Architectural Innovation
2:40 ───┴─── 2:55 : Vision: Governed Agentic Commerce with PayPal
```

---

## 🎬 Detailed Turn-by-Turn Production Script

| Timestamp | Visual Action / On-Screen Recording | Spoken Voiceover (Narrator) | Text Graphic / HUD Overlay |
| :--- | :--- | :--- | :--- |
| **0:00 – 0:10** | Open on a screen showing 20 chaotic e-commerce browser tabs, multiple open calculators, and an overflowing shopping cart exceeding a budget. | *"Online shopping today is fundamentally broken. When you want to equip a home studio or set up a developer workstation, you’re forced to search across dozens of tabs, guess compatibility, and do manual math."* | **Problem: Fragmented Shopping & Budget Creep** |
| **0:10 – 0:20** | Show a user abandoning a cart at checkout due to unexpected costs and compatibility uncertainty. | *"The result? Decision paralysis, budget overruns, and abandoned carts. What if you didn't have to search for individual SKUs at all?"* | **68% Average Cart Abandonment in Multi-Item Retail** |
| **0:20 – 0:30** | Cut to the clean, minimal PayPal Intent landing page ([http://localhost:5173](http://localhost:5173)). Smooth zoom into the hero intent input box. | *"Meet PayPal Intent: an AI-powered, intention-driven commerce agent designed for the PayPal AI Hackathon."* | **PayPal Intent: AI-Native Agentic Commerce** |
| **0:30 – 0:40** | Show the tagline and quick preset cards (Podcasting, WFH Ergonomics, Mobile Dev). | *"Instead of hunting for products, you simply tell the system what you want to accomplish in plain English. The agent handles the complexity while you remain in full control of every payment."* | **Intent-Driven • Zero Hallucination • Governed Payments** |
| **0:40 – 0:55** | **Live Action**: Narrator types into the intent box:  <br>`"Equip a home podcasting studio under $800. I need broadcast quality and low background noise."` <br>Click **"Analyze Intent"**. Fast transition to Intent Workspace. | *"Watch this. I'll type: 'Equip a home podcasting studio under $800 with low background noise.' Instantly, our local Ollama AI decomposes the goal into specific categories: microphones, audio interfaces, boom arms, and closed-back headphones."* | **Local Ollama Inference (qwen2.5:3b) • Zod Validated** |
| **0:55 – 1:15** | Screen shows the extracted requirements with priority badges (`Essential`, `Recommended`) and estimated budget shares. User clicks **"Generate Purchasing Plans"**. Three distinct plan cards animate into view:  <br>🟢 Budget-Conscious ($629)  <br>🔵 Balanced ($749)  <br>🟣 Performance ($799) | *"Our planning engine synthesizes three distinct plans: Budget-Conscious, Balanced, and Performance. Notice the budget adherence meter—our knapsack constraint solver guarantees that the bundle never exceeds our $800 hard ceiling. Zero arithmetic hallucination."* | **Multi-Tier Plan Synthesis • Knapsack Optimization** |
| **1:15 – 1:35** | Narrator selects the **Balanced Plan**. Shows the Decision Matrix: expands an item to reveal the **Why This Was Chosen** trade-off rationale. Clicks **"Lock Item"** on the microphone, then swaps headphones with an alternative pick and clicks **"Rebalance Bundle"**. | *"Every single recommendation provides radical explainability, detailing why it was chosen. If I prefer a different pair of headphones, I can lock my favorite microphone, swap the headphones, and rebalance the bundle with one click."* | **Radical Explainability • Interactive Customization** |
| **1:35 – 1:50** | User clicks **"Transfer to Cart"**. Screen transitions to the Shopping Cart. Show line items, subtotal, 8% sales tax calculation, and final grand total ($788.38). | *"Satisfied with our bundle, I click 'Transfer to Cart.' In a single atomic network roundtrip, the server locks in authoritative prices directly from SQLite. Client prices are completely ignored, and tax is computed to the exact integer cent."* | **Atomic Cart Sync • Authoritative Server-Side Pricing** |
| **1:50 – 2:05** | User clicks **"Proceed to Checkout"**. The official PayPal Sandbox button renders via `@paypal/react-paypal-js`. User clicks the yellow **PayPal** button. The authentic PayPal Sandbox popup modal appears. | *"Now comes the payment. We click 'Proceed to Checkout,' and the official PayPal JavaScript SDK renders our button. Notice the AI cannot touch our funds—payment execution strictly requires explicit human authorization."* | **Official PayPal Sandbox Orders v2 API Integration** |
| **2:05 – 2:15** | User enters sandbox buyer credentials (`sb-buyer@business.example.com`), reviews the exact $788.38 charge, and clicks **"Complete Purchase"**. | *"We log into our PayPal Sandbox personal account and approve the transaction. The popup closes, and our backend captures the payment securely server-to-server."* | **Server-Side Capture • Status Verified: COMPLETED** |
| **2:15 – 2:30** | Screen automatically transitions to the **Payment Confirmation & Digital Receipt** screen. Displays Order Number, PayPal Capture ID, Itemized Breakdown, and green **Payment Verified** badge. | *"Instantly, we see our digital receipt! Our server verified that PayPal returned a 'COMPLETED' status, and our database locked the order against duplicate capture attempts."* | **Double-Spending Prevention • Idempotent Capture** |
| **2:30 – 2:40** | Camera zooms into the bottom of the receipt highlighting the cryptographic **SHA-256 Digital Receipt Seal** with copy button. | *"Every transaction is sealed with an immutable SHA-256 cryptographic hash combining the order ID, payment ID, amount, and timestamp. It’s a tamper-evident audit trail designed for modern fintech."* | **Cryptographic SHA-256 Digital Seal: Tamper-Evident** |
| **2:40 – 2:55** | Cut back to the application navigation bar showing the full purchase ledger in **History**, then transition to the closing splash screen with repository link and badges. | *"PayPal Intent proves that agentic commerce doesn't mean giving up control. By combining local AI reasoning, mathematical optimization, and PayPal's trusted payment rails, we've built the future of commerce. Thank you."* | **PayPal Intent • The Future of Agentic Commerce** |

---

## 🎙️ Recording Checklist for Presenters

1. **Local Environment Prep**:
   - Ensure Ollama is running (`ollama serve`) with `qwen2.5:3b`.
   - Ensure the server and client are running (`npm run dev`).
   - Have the PayPal Sandbox personal buyer email and password ready on clipboard.
2. **Audio & Screen Settings**:
   - Record at 1920x1080 (1080p, 60fps) for crisp typography.
   - Use a clean browser profile without bookmarks or distracting browser extensions.
   - Speak with clear, steady pacing aligned with the timestamp markers above.
3. **Strict Compliance**:
   - Do not display real credit cards, personal bank accounts, or unredacted passwords.
   - Show the authentic PayPal Sandbox URL (`sandbox.paypal.com`) during modal interaction.
