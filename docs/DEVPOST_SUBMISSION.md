# Devpost Hackathon Submission: PayPal Intent
**AI-Powered Intention-Driven Commerce Agent**
*Submitted to the PayPal AI Hackathon 2026*

---

## 💡 Elevator Pitch

**PayPal Intent** revolutionizes online commerce by replacing tedious keyword searching and multi-tab cart juggling with an AI-driven, goal-oriented commerce agent. Users describe complex purchasing objectives in natural language; the agent understands their needs, discovers compatible products, algorithmically optimizes multi-item bundles under strict budget ceilings, explains trade-offs, and coordinates user-approved checkout through the genuine **PayPal Sandbox Orders v2 API**.

---

## 🛑 The Problem: E-Commerce Is Still Stuck in the 1990s

Online shopping today remains fundamentally **query-driven**, fragmented, and cognitively exhausting. When consumers attempt to achieve a complex, multi-item objective—such as *"setting up a home podcast studio under $600"* or *"equipping an ergonomic developer workstation under ₹50,000"*:

1. **Fragmented Search Experience**: Users must guess technical keywords and open dozens of browser tabs across disparate product categories (microphones, audio interfaces, boom arms, acoustic foam, headphones).
2. **Mental Arithmetic & Budget Creep**: Buyers must manually sum prices, calculate taxes, and make compromises on scrap paper, often blowing past their intended budget.
3. **Compatibility Anxiety**: Buyers are terrified of purchasing incompatible hardware (e.g., XLR microphones that require phantom power connected to USB-only laptops).
4. **Decision Paralysis & Abandonment**: Staring at hundreds of virtually identical search results with conflicting star ratings leads to high shopping cart abandonment.
5. **Disconnected Checkout**: After assembling a makeshift cart, users face opaque payment flows without clear, immutable audit trails.

---

## ✨ The Solution: PayPal Intent (Agentic Commerce)

**PayPal Intent** transforms commerce from *item hunting* into *goal fulfillment*:

1. **Intention Ingestion**: Users type or dictate real-world objectives in natural language, complete with budget limits and multi-currency preferences (USD `$`, INR `₹`, EUR `€`, GBP `£`).
2. **Structured Requirement Decomposition**: The system decomposes the goal into specific categories, spec constraints, priorities (essential vs. recommended), and target budget distributions.
3. **Multi-Tier Plan Synthesis**: The agent generates three tailored purchasing plans simultaneously:
   - 🟢 **Budget-Conscious**: Maximizes value while strictly minimizing out-of-pocket cost.
   - 🔵 **Balanced**: Optimizes the price-to-performance ratio across all components.
   - 🟣 **Performance**: Maximizes hardware capabilities while adhering to the budget ceiling.
4. **Deterministic Knapsack Optimization**: Rather than letting an LLM guess bundle prices, an algorithmic constraint solver strictly enforces hard budget ceilings, automatically swapping components if prices exceed the user's limit.
5. **Radical Explainability**: Every recommended item includes transparent selection rationales and trade-off explanations.
6. **Interactive Customization**: Users can lock favorite items, swap recommendations with catalog alternatives, and rebalance the bundle with a single click.
7. **Human-in-the-Loop PayPal Checkout**: The user inspects the authoritative, server-calculated totals and approves payment through the official PayPal Sandbox JavaScript SDK modal.
8. **Cryptographic Ledger**: Successful purchases generate an immutable receipt stamped with a **SHA-256 digital seal**.

---

## 🚀 Why the Idea Is Innovative

Most modern "AI shopping assistants" are superficial chatbots that simply call search APIs and return a list of affiliate links. PayPal Intent introduces three breakthrough innovations:

1. **Intent-to-Bundle Compilation**: PayPal Intent compiles a natural language objective into a cohesive, multi-item bill of materials that satisfies hardware compatibility, category completeness, and price ceilings.
2. **Neural Reasoning + Mathematical Precision**: We reject the naive practice of relying on LLMs for financial arithmetic. PayPal Intent couples local neural reasoning (intent extraction and qualitative trade-off explanation) with **deterministic knapsack constraint solvers** and integer minor-unit pricing. It is mathematically impossible for the agent to hallucinate a total.
3. **Governed Agentic Payments**: True agentic commerce requires agency without loss of control. The agent acts as an autonomous advisor and preparer, but payment execution is strictly gated behind an interactive, human-authorized PayPal modal.

---

## 🤖 How the AI Agent Works

The intelligence layer is engineered for zero-cost execution and 100% offline resilience:

- **Local Inference Engine**: Powered by **Ollama** running the `qwen2.5:3b` open-weight model locally on port 11434. No paid cloud tokens or subscriptions are required.
- **Controlled Agent Tools**: The agent orchestrator utilizes 4 strictly read-only tools:
  - `search_catalog`: Category, attribute, and stock filtering.
  - `get_product_details`: In-depth specification inspection.
  - `compare_products`: Multi-item matrix generation.
  - `calculate_budget`: Deterministic cost and tax computation.
- **Strict Anti-Hallucination Barrier**: Every recommended product must exist in the SQLite database. SQLite foreign key constraints reject any synthetic or hallucinated product IDs.
- **Dual-Engine Resilience & Truth-in-Labeling**: If Ollama is offline or times out (>15s), the platform seamlessly activates an algorithmic deterministic fallback engine. Every response transparently discloses whether it was generated by the neural model or the deterministic engine (`isAiGenerated: false`).

---

## 💳 How PayPal Is Integrated

Payment integration adheres strictly to modern PayPal Developer standards:

- **Official PayPal SDK**: Client-side buttons are rendered via `@paypal/react-paypal-js`.
- **PayPal Orders v2 REST API**: Order creation (`POST /v2/checkout/orders`) and capture (`POST /v2/checkout/orders/{id}/capture`) execute strictly server-to-server with bearer OAuth2 authentication against `api-m.sandbox.paypal.com`.
- **Zero Client Credential Exposure**: `PAYPAL_CLIENT_SECRET` remains securely isolated on the backend.
- **Authoritative Server-Side Pricing**: The server completely ignores frontend-supplied prices, looking up item unit costs directly from the database and calculating taxes and totals in integer minor units (cents).
- **Double-Spending Prevention**: Database uniqueness constraints on `paypal_order_id` and idempotency checks reject duplicate capture replays with `409 Conflict` (`DUPLICATE_CAPTURE_ATTEMPT`).
- **Cryptographic Audit Trail**: Each captured payment generates an immutable record in `transaction_records` stamped with a verifiable SHA-256 digital seal combining `orderId`, `paymentId`, `grossAmount`, `sessionId`, and timestamp.

---

## 🌐 Why Agentic Commerce Matters

Agentic commerce represents the single largest shift in retail since the inception of the web browser. As consumer attention becomes increasingly scarce, the burden of searching, comparing, and configuring must shift from human shoppers to autonomous agents.

However, **agentic commerce cannot succeed without trust**. Consumers will never grant autonomous agents blank-check access to their bank accounts. PayPal Intent demonstrates the winning paradigm: **Agentic preparation, deterministic optimization, and governed PayPal authorization.**

---

## 🏆 What Makes the Product Different

| Traditional Chatbots | Raw E-Commerce Sites | PayPal Intent |
| :--- | :--- | :--- |
| Hallucinates prices and non-existent products | Requires manual SKU search and comparison | 100% database-backed, anti-hallucination catalog |
| Basic text chat interface | Cluttered search grids with ads | Dedicated 9-screen visual fintech workspace |
| Ignores strict budget ceilings | Manual calculator math | Algorithmic knapsack optimization |
| "Autonomous" payment risks | Vulnerable to client-side tampering | Governed, human-authorized PayPal Sandbox modal |

---

## 🧗 Technical Challenges & Solutions

1. **Eliminating Arithmetic Hallucination in LLMs**:
   - *Challenge*: Open-weight 3B parameter models frequently make math errors when summing multi-item carts and applying tax rates.
   - *Solution*: Stripped all financial math out of the LLM prompt. The AI extracts requirements and qualitative priorities, while a deterministic TypeScript service performs all integer-cent knapsack optimization and tax calculation.
2. **Insecure Direct Object Reference (IDOR) Hardening**:
   - *Challenge*: In early iterations, session-less API calls could have allowed users to view or capture orders belonging to another session.
   - *Solution*: Implemented strict session scoping across all controllers (`order`, `transaction`, `intent`, `plan`), enforcing `403 Forbidden` on foreign session access attempts.
3. **Zero-Cost Local Execution Guarantee**:
   - *Challenge*: Building a production-grade AI system without incurring cloud API costs or requiring judges to input paid OpenAI/Anthropic API keys.
   - *Solution*: Architected a dual-engine system pairing local Ollama inference with a deterministic rule engine, achieving 100% zero-cost operation and zero external dependencies.
4. **Real PayPal Sandbox Capture Integrity**:
   - *Challenge*: Guaranteeing that the server never marks an order as paid without authoritative verification from PayPal's sandbox servers.
   - *Solution*: Built server-side capture verification requiring `status === 'COMPLETED'` from PayPal Orders v2, matching captured amounts against database totals, and enforcing idempotency locks.

---

## 📈 Potential Impact & Market Viability

- **For Shoppers**: Cuts purchase research time from hours to seconds; eliminates budget overruns; removes technical compatibility anxiety.
- **For Merchants**: Dramatically reduces multi-item cart abandonment; increases Average Order Value (AOV) by intelligently bundling complementary products; lowers return rates caused by compatibility mismatches.
- **For PayPal**: Positions PayPal as the indispensable, trusted payment and governance rails for the emerging agentic AI economy.

---

## 🛠️ Built With

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React, `@paypal/react-paypal-js`
- **Backend**: Node.js, Express, TypeScript, TSX, Zod, UUID
- **Database**: SQLite, `better-sqlite3`, Write-Ahead Logging (WAL)
- **AI Inference**: Ollama (`qwen2.5:3b`), Local Open Weights
- **Payments**: PayPal REST Orders v2 API, PayPal Sandbox
- **Testing**: Vitest, React Testing Library, Supertest (107 automated tests)
- **Security**: Cryptographic SHA-256 Digital Receipts, IDOR guards, Integer Minor-Unit Math
