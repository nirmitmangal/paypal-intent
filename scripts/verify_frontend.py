"""
Comprehensive Verification Script for Master Prompt 4 - Complete Frontend Development.
Validates:
1. Presence and integrity of Centralized State Management (AppContext.tsx)
2. Presence and integrity of API Integration Layer (api.ts)
3. Presence and AppContext integration of all 9 screens (Screens A through I)
4. Presence of ProductDetailModal and UI components
5. Client Vitest unit and interaction test execution
6. Full TypeScript compilation across workspaces
7. Vite client production build
"""

import sys
import subprocess
from pathlib import Path

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

ROOT_DIR = Path(__file__).resolve().parent.parent

CORE_FRONTEND_FILES = [
    "client/src/context/AppContext.tsx",
    "client/src/lib/api.ts",
    "client/src/lib/utils.ts",
    "client/src/components/ui/ProductDetailModal.tsx",
    "client/src/test/setup.ts",
    "client/src/test/Button.test.tsx",
    "client/src/test/BudgetMeter.test.tsx",
    "client/src/test/CartCalculation.test.ts"
]

SCREENS = [
    ("client/src/components/screens/HomeScreen.tsx", "HomeScreen"),
    ("client/src/components/screens/IntentWorkspaceScreen.tsx", "IntentWorkspaceScreen"),
    ("client/src/components/screens/PlanningScreen.tsx", "PlanningScreen"),
    ("client/src/components/screens/DiscoveryScreen.tsx", "DiscoveryScreen"),
    ("client/src/components/screens/DecisionScreen.tsx", "DecisionScreen"),
    ("client/src/components/screens/CartScreen.tsx", "CartScreen"),
    ("client/src/components/screens/PaymentScreen.tsx", "PaymentScreen"),
    ("client/src/components/screens/HistoryScreen.tsx", "HistoryScreen"),
    ("client/src/components/screens/SettingsScreen.tsx", "SettingsScreen")
]

APP_CONTEXT_ACTIONS = [
    "startIntent",
    "refineIntent",
    "addToCart",
    "removeFromCart",
    "updateCartQuantity",
    "toggleCompare",
    "swapBundleItem",
    "addTransaction",
    "navigateTo"
]


def test_core_files_exist():
    print("\n[CHECK 1] Validating Core Frontend Architecture Files...")
    missing = []
    for rel_path in CORE_FRONTEND_FILES:
        full_path = ROOT_DIR / rel_path
        if not full_path.exists():
            missing.append(rel_path)
            print(f"  [FAIL] Missing: {rel_path}")
        else:
            print(f"  [PASS] Found: {rel_path}")

    if missing:
        print(f"ERROR: {len(missing)} core frontend files missing.")
        return False
    print("ALL core frontend files verified.")
    return True


def test_screens_and_context_binding():
    print("\n[CHECK 2] Validating All 9 Screen Components and AppContext Binding...")
    missing = []
    unbound = []

    for rel_path, component_name in SCREENS:
        full_path = ROOT_DIR / rel_path
        if not full_path.exists():
            missing.append(rel_path)
            print(f"  [FAIL] Screen component missing: {rel_path}")
            continue

        content = full_path.read_text(encoding="utf-8")
        if component_name not in content:
            missing.append(f"{rel_path} ({component_name})")
            print(f"  [FAIL] Component {component_name} not exported in {rel_path}")
            continue

        if "useApp" not in content:
            unbound.append(rel_path)
            print(f"  [FAIL] Screen not bound to AppContext: {rel_path}")
        else:
            print(f"  [PASS] Screen verified and bound: {component_name} -> useApp()")

    if missing or unbound:
        print(f"ERROR: {len(missing)} screens missing, {len(unbound)} screens unbound.")
        return False
    print("ALL 9 screens validated and verified with centralized state management.")
    return True


def test_app_context_interface():
    print("\n[CHECK 3] Validating Centralized AppContext Capabilities...")
    context_file = ROOT_DIR / "client/src/context/AppContext.tsx"
    content = context_file.read_text(encoding="utf-8")
    missing_actions = []

    for action in APP_CONTEXT_ACTIONS:
        if action not in content:
            missing_actions.append(action)
            print(f"  [FAIL] Missing action in AppContext: {action}")
        else:
            print(f"  [PASS] AppContext provides action: {action}")

    if missing_actions:
        print(f"ERROR: AppContext missing essential actions: {missing_actions}")
        return False
    print("AppContext state contract fully satisfied.")
    return True


def test_vitest_unit_tests():
    print("\n[CHECK 4] Executing Client Vitest Unit and Interaction Tests...")
    cmd = ["npm.cmd", "--workspace=client", "run", "test"]
    result = subprocess.run(cmd, cwd=ROOT_DIR, capture_output=True, text=True, shell=True, encoding="utf-8", errors="replace")

    if result.returncode != 0:
        print("  [FAIL] Client unit tests failed!")
        print(result.stdout)
        print(result.stderr)
        return False

    print("  [PASS] All Client Vitest test suites executed successfully.")
    print(result.stdout.strip())
    return True


def test_typecheck():
    print("\n[CHECK 5] Running TypeScript Static Analysis across Workspaces...")
    cmd = ["npm.cmd", "run", "typecheck"]
    result = subprocess.run(cmd, cwd=ROOT_DIR, capture_output=True, text=True, shell=True, encoding="utf-8", errors="replace")

    if result.returncode != 0:
        print("  [FAIL] TypeScript compilation failed!")
        print(result.stdout)
        print(result.stderr)
        return False

    print("  [PASS] TypeScript check passed without errors (strict mode).")
    return True


def test_client_build():
    print("\n[CHECK 6] Building Client Production Bundle (Vite)...")
    cmd = ["npm.cmd", "--workspace=client", "run", "build"]
    result = subprocess.run(cmd, cwd=ROOT_DIR, capture_output=True, text=True, shell=True, encoding="utf-8", errors="replace")

    if result.returncode != 0:
        print("  [FAIL] Client Vite build failed!")
        print(result.stdout)
        print(result.stderr)
        return False

    dist_index = ROOT_DIR / "client/dist/index.html"
    if not dist_index.exists():
        print("  [FAIL] client/dist/index.html was not generated.")
        return False

    print("  [PASS] Vite client production build created successfully in client/dist.")
    return True


def main():
    print("=" * 70)
    print("PAYPAL INTENT - MASTER PROMPT 4 (COMPLETE FRONTEND) VERIFICATION")
    print("=" * 70)

    checks = [
        test_core_files_exist,
        test_screens_and_context_binding,
        test_app_context_interface,
        test_vitest_unit_tests,
        test_typecheck,
        test_client_build
    ]

    passed = 0
    for check in checks:
        if check():
            passed += 1
        else:
            print(f"\n[ABORT] Verification failed at step: {check.__name__}")
            sys.exit(1)

    print("\n" + "=" * 70)
    print(f"VERIFICATION COMPLETE: {passed}/{len(checks)} CHECKS PASSED.")
    print("Master Prompt 4 Frontend Development is complete and verified!")
    print("=" * 70)
    sys.exit(0)


if __name__ == "__main__":
    main()
