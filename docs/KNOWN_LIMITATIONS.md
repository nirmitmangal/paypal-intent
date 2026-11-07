# Known Limitations & Prototype Boundaries
**PayPal Intent — Agentic AI Commerce Application**
*Independent Hackathon Prototype for the PayPal AI Hackathon*

---

## 1. Prototype Scope & Disclaimer

- **Independent Hackathon Prototype**: PayPal Intent is an independent project developed specifically for the PayPal AI Hackathon. It is not an official PayPal product, nor is it endorsed, certified, or maintained by PayPal Inc.
- **Design Inspiration**: The interface utilizes a clean, minimal fintech aesthetic inspired by modern financial platforms while prominently identifying as an independent prototype with dedicated disclaimer banners and watermarks.
- **Zero-Cost Architectural Constraint**: Built entirely using free, open-source technologies (React, Vite, Express, SQLite, Ollama, PayPal Sandbox) without mandatory paid SaaS subscriptions or commercial LLM APIs.

---

## 2. Product Catalog & Inventory Scope

- **Demonstration Catalog**: The application includes a curated, realistic demonstration catalog of 23 premium workspace products spanning 7 categories:
  - Laptops (Dell XPS, MacBook Pro, ThinkPad, Asus ROG)
  - Monitors (Dell UltraSharp, LG UltraWide, BenQ Designer)
  - Keyboards (Keychron, Logitech MX Mechanical, NuPhy)
  - Mice (Logitech MX Master 3S, Razer Pro Click)
  - Headphones (Sony WH-1000XM5, Bose QuietComfort, Audio-Technica)
  - Furniture (Jarvis Standing Desk, Herman Miller Aeron, Steelcase Gesture)
  - Accessories (Anker Docking Station, CalDigit TS4, BenQ ScreenBar)
- **Zero Web Scraping**: The system does not scrape e-commerce websites or pretend to access live merchant inventory. All catalog items contain realistic demonstration specifications, model identifiers, stock levels, and local asset references.
- **Future Production Roadmap**: In a commercial deployment, the catalog service would connect to live merchant catalog feeds, inventory management APIs (Shopify, WooCommerce, BigCommerce), or multi-merchant aggregators via Google Merchant Center APIs.

---

## 3. Currency Conversion & Pricing Model

- **Base Currency**: Authoritative database pricing is stored in **USD minor units (cents)**.
- **Multi-Currency Decomposition**: The AI intent parser recognizes multi-currency requirements in natural language:
  - United States Dollar (`USD`, `$`)
  - Indian Rupee (`INR`, `₹`)
  - Euro (`EUR`, `€`)
  - British Pound (`GBP`, `£`)
- **Indicative Benchmark Rates**: For non-USD intents, the system converts the budget constraint to USD cents using fixed indicative conversion factors (e.g., $1 \text{ USD} \approx 83 \text{ INR}$, $1 \text{ EUR} \approx 1.08 \text{ USD}$, $1 \text{ GBP} \approx 1.25 \text{ USD}$) for catalog matching and knapsack optimization.
- **Payment Gateway Currency**: Orders processed through the PayPal Sandbox Orders API are charged in USD. Production scaling would incorporate a live foreign exchange rate feed (e.g., Open Exchange Rates, European Central Bank API) and dynamic PayPal multi-currency capture.

---

## 4. Local AI & Inference Environment

- **Local Inference Engine**: Powered by **Ollama** running the `qwen2.5:3b` open-weight model locally on port 11434.
- **Hardware Dependencies**: Inference speed is contingent on the host machine's CPU/GPU capabilities. Typical response latencies range from 1.5 seconds on modern GPU-accelerated workstations to 4–6 seconds on CPU-only machines.
- **Dual-Engine Graceful Fallback**: If Ollama is not installed, offline, or times out (>15s), the platform seamlessly activates an algorithmic deterministic fallback engine.
- **Truth-in-Labeling Guarantee**: Fallback responses are explicitly flagged with `isAiGenerated: false` and `engine: 'deterministic-fallback'`. The system never misrepresents rule-based outputs as neural-network completions.

---

## 5. PayPal Sandbox Environment

- **Sandbox Boundary**: All financial transactions run against the official PayPal Sandbox (`https://api-m.sandbox.paypal.com`).
- **No Real Funds Transferred**: Payments use simulated buyer accounts and sandbox wallet balances. No real fiat money or credit card charges occur.
- **Buyer Test Account Required**: Approving payments in the PayPal modal requires logging into a PayPal Sandbox personal buyer account. Setup instructions and default test credentials are provided in [docs/PAYPAL_SANDBOX_SETUP.md](file:///d:/paypal-intent/docs/PAYPAL_SANDBOX_SETUP.md).
- **No Simulation of Payment Success**: The application never fakes or mocks successful checkout. If a buyer cancels in the PayPal modal or closes the window, the payment status reflects `CANCELLED` and no transaction record is minted.

---

## 6. Architecture & State Persistence

- **Database Engine**: Uses **SQLite with Write-Ahead Logging (WAL)** mode enabled. This provides high-speed, zero-configuration local persistence with zero external service dependencies.
- **Single-Node Design**: The SQLite database (`server/data/paypal_intent.db`) is hosted on the local file system. In an enterprise cloud deployment, this layer would migrate to a horizontally-scalable managed relational database such as PostgreSQL, Google Cloud Spanner, or Amazon Aurora.
- **Session Lifecycles**: Sessions are tied to persistent tokens (`x-session-token`) stored in the browser's `localStorage`. Clearing browser cookies or localStorage resets the active session identifier.

---

## 7. Out-of-Scope Features for Hackathon Prototype

To maintain high software craftsmanship, zero-cost operation, and strict security within the hackathon timeline, the following non-core capabilities were intentionally excluded from this prototype:
- **Physical Shipping & Warehouse Logistics**: Freight carrier integration (FedEx, UPS, DHL), barcode tracking, and physical dispatching.
- **Returns & RMA Processing**: Dispute mediation and refund return management.
- **Multi-Merchant Split Payments**: Distributing a single order across multiple merchant PayPal wallets (requires PayPal Marketplace platform onboarding).
- **Continuous User Accounts**: Traditional email/password signup with OAuth login (replaced by frictionless instant cryptographic sessions).
