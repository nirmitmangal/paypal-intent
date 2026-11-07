# Complete Local Setup & Evaluator Guide
**PayPal Intent — Agentic AI Commerce Application**
*Reproducible Setup Instructions for Hackathon Judges & Evaluators*

---

## 💻 System Prerequisites

Before starting, ensure your local development environment meets the following requirements:

| Prerequisite | Minimum Version | Recommended | Notes |
| :--- | :--- | :--- | :--- |
| **Operating System** | Windows 10/11, macOS 12+, Ubuntu 20.04+ | Any 64-bit OS | Fully cross-platform |
| **Node.js** | `v18.0.0` | `v22.x LTS` | [Download Node.js](https://nodejs.org/) |
| **npm** | `v9.0.0` | `v10.x+` | Included with Node.js |
| **Python** | `v3.10` | `v3.11+` | For milestone verification scripts |
| **Ollama** *(Optional)* | `v0.5.0+` | Latest | [Download Ollama](https://ollama.com/) |

> [!NOTE]
> **Zero-Cost & Offline-First**: Ollama is optional for basic evaluation. If Ollama is not installed or running, PayPal Intent automatically activates its **deterministic fallback engine** with 100% functionality and transparent labeling (`isAiGenerated: false`).

---

## 🚀 Step-by-Step Installation Guide

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-username/paypal-intent.git
cd paypal-intent
```

### Step 2: Install Workspace Dependencies
PayPal Intent uses native npm workspaces managing three packages (`client`, `server`, and `shared`). Install all dependencies with a single command at the repository root:

```bash
npm install
```

### Step 3: Configure Environment Variables
Copy the template configuration file:
```bash
# On Linux / macOS
cp .env.example .env

# On Windows (PowerShell)
Copy-Item .env.example .env
```

Open `.env` in your text editor. The default configuration is immediately functional for local evaluation:
```ini
# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
LOG_LEVEL=info

# Database (SQLite)
DATABASE_PATH=./data/paypal_intent.db

# AI Inference (Local Ollama)
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5:3b

# PayPal Sandbox Integration
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=sandbox_client_id_placeholder
PAYPAL_CLIENT_SECRET=sandbox_client_secret_placeholder
```

> [!TIP]
> To test genuine PayPal Sandbox payment capture, supply your personal PayPal Sandbox credentials from the [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/). If left as placeholders, the application runs smoothly in demonstration mode.

### Step 4: Initialize and Seed SQLite Database
Populate the embedded SQLite database with the curated demonstration catalog (23 realistic workspace products across 7 categories):

```bash
npm --workspace=server run seed
```

Expected output:
```
✓ SQLite database initialized at ./data/paypal_intent.db
✓ Seeded 7 categories
✓ Seeded 23 curated catalog products
✓ Database ready for commerce sessions
```

### Step 5: (Optional) Set Up Local AI Model
If you wish to test genuine local neural inference:
1. Open a new terminal and pull the recommended open-weight model:
   ```bash
   ollama pull qwen2.5:3b
   ```
2. Start the Ollama server:
   ```bash
   ollama serve
   ```
3. Verify Ollama is accessible at `http://127.0.0.1:11434`.

---

## 🏃 Running the Application

Start both the backend server and frontend client concurrently with one command:

```bash
npm run dev
```

- **Frontend Application**: [http://localhost:5173](http://localhost:5173)
- **Backend API Server**: [http://localhost:5000](http://localhost:5000)
- **Backend Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🧪 Testing & Verification Commands

### 1. Execute All 107 Automated Tests
```bash
npm run test
```
Runs all 13 test suites across server and client workspaces. All 107 tests should pass cleanly.

### 2. Verify TypeScript Strict Compilation
```bash
npm run typecheck
```
Executes `tsc --noEmit` on all workspaces. Confirms 0 compile-time errors.

### 3. Build for Production
```bash
npm run build
```
Compiles shared packages, builds server TypeScript to `dist/`, and outputs an optimized Vite client bundle.

### 4. Run All 10 Milestone Verification Scripts
```bash
npm run verify:all
```
Sequentially runs:
- `scripts/verify_spec.py`
- `scripts/verify_foundation.py`
- `scripts/verify_ui.py`
- `scripts/verify_frontend.py`
- `scripts/verify_backend.py`
- `scripts/verify_paypal.py`
- `scripts/verify_agent.py`
- `scripts/verify_integration.py`
- `scripts/verify_qa_security.py`
- `scripts/verify_submission.py`

---

## 💳 Testing PayPal Sandbox Checkout

To experience the authentic PayPal Sandbox payment flow:
1. Obtain Sandbox credentials:
   - Go to [developer.paypal.com](https://developer.paypal.com) $\rightarrow$ **Dashboard** $\rightarrow$ **Apps & Credentials**.
   - Create or select a Sandbox App to obtain your `Client ID` and `Secret`.
   - Under **Sandbox Accounts**, note your Personal Buyer Account email and password.
2. Put `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` in `.env`.
3. Restart the dev server (`npm run dev`).
4. In the app:
   - Submit a purchasing goal on the home page (e.g., *"Podcasting studio under $700"*).
   - Select a plan and click **"Transfer to Cart"**.
   - Navigate to Cart and click **"Proceed to Checkout"**.
   - Click the yellow **PayPal** button.
   - In the popup, log in with your sandbox buyer credentials.
   - Click **"Complete Purchase"**.
   - Review your verified digital receipt and cryptographic SHA-256 seal!

---

## 🔧 Troubleshooting FAQ

### Port 5000 or 5173 Already in Use
Change the `PORT` variable in `.env` to another port (e.g. `PORT=5001`), or stop existing processes:
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux / macOS
lsof -ti:5000 | xargs kill -9
```

### Ollama Connection Refused
If Ollama is not running, PayPal Intent will log a warning and activate the deterministic fallback engine automatically. The UI will show `engine: deterministic-fallback`. To use the neural model, ensure `ollama serve` is active on port 11434.

### SQLite Database Reset
If you ever want to reset the database to a fresh state:
```bash
# Windows
Remove-Item -Path data/paypal_intent.db* -Force
npm --workspace=server run seed

# Linux / macOS
rm -f data/paypal_intent.db*
npm --workspace=server run seed
```
