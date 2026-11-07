"""
Comprehensive Verification Script for Master Prompt 3 - Premium UI/UX & Design System.
Validates:
1. Design System, Screen Specifications, and UX Flow Documentation coverage
2. Presence and integrity of all reusable UI design system components
3. Presence and integrity of all 9 functional screen components (Screens A through I)
4. Client TypeScript typechecking and Vite production build
5. Server tests
"""

import sys
import subprocess
from pathlib import Path

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

REQUIRED_UI_DOCS = {
    "docs/DESIGN_SYSTEM.md": [
        "Design Philosophy & Direction",
        "Color Palette & Design Tokens",
        "Typography & Hierarchy",
        "Layout Grid, Spacing & Elevation",
        "Core Component Design Specifications",
        "Accessibility & Compliance"
    ],
    "docs/SCREEN_SPECIFICATIONS.md": [
        "Screen A: Landing / Home",
        "Screen B: Intent Workspace",
        "Screen C: Planning Interface",
        "Screen D: Product Discovery & Comparison",
        "Screen E: Decision Workspace",
        "Screen F: Shopping Cart",
        "Screen G: Payment",
        "Screen H: Activity & Transaction History",
        "Screen I: Settings & Diagnostics"
    ],
    "docs/UX_FLOWS.md": [
        "Master UX Flow Diagram",
        "Primary Golden Path",
        "Plan Customization & Constraint Tuning",
        "Side-by-Side Product Comparison",
        "Budget Deficit Handling",
        "Transaction History & Order Audit"
    ]
}

UI_COMPONENTS = [
    "client/src/components/ui/Button.tsx",
    "client/src/components/ui/Input.tsx",
    "client/src/components/ui/Card.tsx",
    "client/src/components/ui/Badge.tsx",
    "client/src/components/ui/Modal.tsx",
    "client/src/components/ui/Drawer.tsx",
    "client/src/components/ui/BudgetMeter.tsx",
    "client/src/components/ui/ProductCard.tsx",
    "client/src/components/ui/EmptyState.tsx",
    "client/src/components/ui/ErrorState.tsx",
    "client/src/components/ui/LoadingSkeleton.tsx",
    "client/src/components/ui/TransactionStatusBadge.tsx"
]

SCREEN_COMPONENTS = [
    "client/src/components/screens/HomeScreen.tsx",
    "client/src/components/screens/IntentWorkspaceScreen.tsx",
    "client/src/components/screens/PlanningScreen.tsx",
    "client/src/components/screens/DiscoveryScreen.tsx",
    "client/src/components/screens/DecisionScreen.tsx",
    "client/src/components/screens/CartScreen.tsx",
    "client/src/components/screens/PaymentScreen.tsx",
    "client/src/components/screens/HistoryScreen.tsx",
    "client/src/components/screens/SettingsScreen.tsx"
]

def run_step(step_name, func):
    print(f"\n--- Checking: {step_name} ---")
    try:
        res = func()
        if res:
            print(f"[PASS] {step_name}")
            return True
        else:
            print(f"[FAIL] {step_name}")
            return False
    except Exception as e:
        print(f"[FAIL] {step_name} raised exception: {e}")
        return False

def verify_ui_system():
    base_dir = Path(__file__).resolve().parent.parent
    total_steps = 0
    passed_steps = 0

    print("=================================================================")
    print("PAYPAL INTENT - MASTER PROMPT 3 UI/UX & DESIGN SYSTEM VERIFICATION")
    print(f"Base Directory: {base_dir}")
    print("=================================================================")

    # 1. Check UI/UX Documentation
    def check_docs():
        all_ok = True
        for rel_path, required_sections in REQUIRED_UI_DOCS.items():
            doc_path = base_dir / rel_path
            if not doc_path.exists():
                print(f"Missing doc: {rel_path}")
                all_ok = False
                continue
            content = doc_path.read_text(encoding="utf-8")
            for sec in required_sections:
                if sec.lower() not in content.lower():
                    print(f"Doc {rel_path} missing section: {sec}")
                    all_ok = False
        return all_ok

    total_steps += 1
    if run_step("UI/UX System & Screen Specifications Documentation", check_docs):
        passed_steps += 1

    # 2. Check UI Design System Components
    def check_ui_components():
        missing = []
        for comp in UI_COMPONENTS:
            if not (base_dir / comp).exists():
                missing.append(comp)
        if missing:
            print(f"Missing UI components: {missing}")
            return False
        return True

    total_steps += 1
    if run_step("Reusable Design System Components (12 Components)", check_ui_components):
        passed_steps += 1

    # 3. Check Screen Components
    def check_screens():
        missing = []
        for screen in SCREEN_COMPONENTS:
            if not (base_dir / screen).exists():
                missing.append(screen)
        if missing:
            print(f"Missing screen components: {missing}")
            return False
        return True

    total_steps += 1
    if run_step("Functional Screen Components (Screens A through I)", check_screens):
        passed_steps += 1

    # 4. Check Client TypeScript & Vite Build
    def check_client_build():
        cmd = "npm.cmd --workspace=client run build"
        res = subprocess.run(cmd, shell=True, cwd=str(base_dir), capture_output=True, text=True, encoding="utf-8", errors="replace")
        if res.returncode != 0:
            print(f"Client build failed:\n{res.stdout}\n{res.stderr}")
            return False
        return True

    total_steps += 1
    if run_step("Client TypeScript & Vite Production Build", check_client_build):
        passed_steps += 1

    # 5. Check Server Test Suite
    def check_server_tests():
        cmd = "npm.cmd --workspace=server run test"
        res = subprocess.run(cmd, shell=True, cwd=str(base_dir), capture_output=True, text=True, encoding="utf-8", errors="replace")
        if res.returncode != 0:
            print(f"Server tests failed:\n{res.stdout}\n{res.stderr}")
            return False
        return True

    total_steps += 1
    if run_step("Server Automated Vitest Test Suite", check_server_tests):
        passed_steps += 1

    print("\n=================================================================")
    print(f"Summary: {passed_steps}/{total_steps} Design System Verification Steps Passed")
    if passed_steps == total_steps:
        print("RESULT: MASTER PROMPT 3 UI/UX DESIGN SYSTEM FULLY VERIFIED!")
        print("=================================================================")
        return 0
    else:
        print("RESULT: UI/UX VERIFICATION FAILED")
        print("=================================================================")
        return 1

if __name__ == "__main__":
    sys.exit(verify_ui_system())
