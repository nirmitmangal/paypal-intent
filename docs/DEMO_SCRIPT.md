# PayPal Intent — 3-Minute Hackathon Demonstration Script

> **Runtime Target**: 2 minutes 45 seconds (Strictly under 3 minutes)<br />
> **Target Audience**: PayPal AI Hackathon Judges, Evaluators, and Engineers<br />
> **Format**: Live Screen Recording of running application (`http://localhost:3000`) + Voiceover + Overlays<br />
> **Key Premise**: Transparent, governed agentic commerce where local AI plans, knapsack optimization defends budgets, and human approval strictly governs PayPal payments.

---

## ⏱️ Timeline Overview

```
0:00 ───┬─── 0:25 : The Problem: Friction, Multi-SKU Fatigue, and Budget Creep
0:25 ───┼─── 0:45 : Introducing PayPal Intent: Intention-Driven Commerce
0:45 ───┼─── 1:20 : Live Goal Decomposition: Natural Language to 4 Structured Requirements
1:20 ───┼─── 1:55 : Budget Ceiling Defense: Mathematical 0/1 Knapsack & Transparent Trade-Offs
1:55 ───┼─── 2:25 : Cart Staging & Governed PayPal Sandbox Checkout (Human-in-the-Loop)
2:25 ───┼─── 2:45 : Transaction Ledger & SHA-256 Snapshot Hash Verification
```

---

## 🎬 Turn-by-Turn Production Script

| Timestamp | Visual Action (On Screen) | Voiceover Narration | Visual Overlay / HUD |
|---|---|---|---|
| **0:00 – 0:25** | Start on a browser showing 15 messy tabs: Amazon, Best Buy, reddit recommendation threads, and a calculator trying to balance a student desk budget. | *"Shopping for a goal today is exhausting. When you need a complete setup—like a desk for college—you're forced to juggle dozens of tabs, guess hardware compatibility, and do manual arithmetic to prevent budget overruns. The result? Decision fatigue, budget creep, and abandoned carts."* | **Problem: Multi-Item Shopping Fragmentation & Budget Creep** |
| **0:25 – 0:45** | Switch to the sleek PayPal Intent Bento Dashboard running at `http://localhost:3000`. Show the midnight navy background, floating canvas, and active goal console. | *"This is PayPal Intent: an AI-native, intention-driven commerce platform built for the PayPal AI Hackathon. Instead of searching for individual SKUs, you enter what you want to achieve in plain English. The agent handles planning and compatibility, but human approval strictly governs every payment."* | **PayPal Intent • AI-Native Agentic Commerce** |
| **0:45 – 1:20** | **Live Action**: Type intention into the console:<br>`"Productive study desk setup for college: keyboard, wireless mouse, desk lamp, and headphones under $300."`<br>Click **Decompose Goal**. Show transition to Workspace. | *"Watch this: I enter our student intention with a strict $300 budget ceiling. Our local Ollama AI—running privately on device with qwen2.5:3b—decomposes the goal into exactly four structured requirements: keyboard, ergonomic wireless mouse, task lighting, and headphones. Zero arithmetic hallucination."* | **Local Ollama AI (qwen2.5:3b) • Structured Zod Validation** |
| **1:20 – 1:55** | Navigate to **Decision & Optimization Studio**. Show the $307.76 total exceeding the $300 ceiling by $7.76. Show the amber alert and the two transparent trade-offs (Option 1: increase to $308, Option 2: relax to on-ear headset at $264.56). | *"Here is where our system truly shines: radical budget honesty. The optimal 4-item bundle with reference over-ear headphones costs $307.76, exceeding our hard $300 ceiling by $7.76. Instead of silently removing a category or charging extra, our 0/1 knapsack engine locks checkout and presents transparent trade-offs. I click Option 2 to swap to an on-ear headset, immediately bringing our total to $264.56—safely under budget."* | **0/1 Knapsack Optimizer • Hard Ceiling Defense Active** |
| **1:55 – 2:25** | Click **Lock Proposal & Proceed to Cart**. Cart reconciles catalog items. Click **Proceed to PayPal**. Show the official PayPal JavaScript SDK button rendering. Click the button to launch the PayPal Sandbox window. | *"Satisfied with our bundle, we transfer to Cart. Server-authoritative SQLite pricing locks in subtotal, 8% simulated demo tax, and total in safe integer cents. Now comes checkout: the official PayPal JavaScript SDK renders. Notice the critical architectural boundary: AI can never create, authorize, or execute payments. Explicit human approval is mandatory."* | **Official PayPal Orders v2 Sandbox • Human Approval Required** |
| **2:25 – 2:45** | Review the exact PayPal Sandbox modal, approve, and show server-side capture callback triggering `200 OK`. Show the updated History screen with the transaction and SHA-256 snapshot hash. | *"Once the buyer approves, our backend captures the payment server-to-server and persists an auditable transaction record sealed with a canonical SHA-256 snapshot hash. PayPal Intent proves that agentic commerce can be autonomous, mathematically bounded, and human-governed. Thank you."* | **PayPal Sandbox Captured • SHA-256 Snapshot Hash Verified** |

---

## 🎙️ Recording Checklist for Presenters

1. **Prerequisites Checklist**:
   - [x] Node.js backend running on port 5000 (`http://localhost:5000`)
   - [x] Vite frontend running on port 3000 (`http://localhost:3000`)
   - [x] Local Ollama serving `qwen2.5:3b` (`ollama serve`)
   - [x] PayPal Sandbox credentials configured in `.env`
2. **Screen Capture Settings**:
   - Resolution: 1920 × 1080 (1080p, 60fps) or 1440 × 900
   - Clean browser window with URL bar visible (`http://localhost:3000`)
   - No external bookmarks, browser extensions, or private personal data visible
3. **Safety & Compliance**:
   - Never show real credit cards, bank accounts, or unredacted passwords.
   - Show authentic PayPal Sandbox URL (`sandbox.paypal.com`) during approval interaction.
   - All demonstrated products, prices, and totals must agree across every screen.
