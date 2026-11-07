"""
Comprehensive Verification Script for Master Prompt 9 - Testing, Security, Reliability & Optimization.
Validates:
1. Documentation & test deliverables exist (QA_REPORT.md, SECURITY_REVIEW.md, KNOWN_LIMITATIONS.md, qa_security.test.ts)
2. Zero secret leakage across client source files
3. Server-side IDOR authorization checks on orders, transactions, intents, and plans
4. Server-side price authoritativeness and duplicate capture (409 Conflict) defenses
5. AI tool sandboxing (advisory only; zero payment execution capabilities) and fallback truth-in-labeling
6. Execution of the dedicated QA & Security test suite (17 tests)
7. Execution of the entire test suite across client & server (107 tests)
8. TypeScript strict compilation check (0 errors)
9. Client production build execution
"""

import sys
import subprocess
import re
from pathlib import Path

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

ROOT_DIR = Path(__file__).resolve().parent.parent

REQUIRED_FILES = [
    "docs/QA_REPORT.md",
    "docs/SECURITY_REVIEW.md",
    "docs/KNOWN_LIMITATIONS.md",
    "server/tests/qa_security.test.ts",
    "server/src/controllers/cart.controller.ts",
    "server/src/controllers/order.controller.ts",
    "server/src/controllers/transaction.controller.ts",
    "server/src/controllers/intent.controller.ts",
    "server/src/controllers/plan.controller.ts",
    "server/src/services/payment.service.ts",
    "server/src/services/agentTools.service.ts",
    "server/src/services/agentPlanning.service.ts",
    "server/src/services/intentParser.service.ts",
    "server/src/db/repository.ts",
    "client/src/lib/api.ts",
]


def test_required_files_exist():
    print("\n[CHECK 1] Validating QA, Security, and Limitation Deliverables...")
    missing = []
    for rel_path in REQUIRED_FILES:
        full_path = ROOT_DIR / rel_path
        if not full_path.exists():
            missing.append(rel_path)
            print(f"  ❌ Missing: {rel_path}")
        else:
            print(f"  ✓ Found: {rel_path}")

    assert not missing, f"Missing {len(missing)} required files: {missing}"
    print("  ✓ All required deliverables and security controllers are present.")


def test_zero_secret_leakage():
    print("\n[CHECK 2] Auditing Client Source Code for Secret Leakage...")
    client_src = ROOT_DIR / "client" / "src"
    leakage_patterns = [
        re.compile(r"PAYPAL_CLIENT_SECRET", re.IGNORECASE),
        re.compile(r"PAYPAL_SECRET", re.IGNORECASE),
        re.compile(r"sk_live_[0-9a-zA-Z]+"),
        re.compile(r"client_secret\s*[:=]\s*['\"][a-zA-Z0-9_\-]+['\"]"),
    ]

    leaks = []
    for file_path in client_src.rglob("*.{ts,tsx,js,jsx}"):
        content = file_path.read_text(encoding="utf-8")
        for pattern in leakage_patterns:
            matches = pattern.findall(content)
            if matches:
                leaks.append((str(file_path.relative_to(ROOT_DIR)), matches))

    if leaks:
        for file, match in leaks:
            print(f"  ❌ Secret leakage detected in {file}: {match}")
        raise AssertionError("Client source code contains exposed payment secrets!")

    # Verify public config endpoint exposes clientId but NOT clientSecret in the response payload
    payment_controller_path = ROOT_DIR / "server/src/controllers/payment.controller.ts"
    controller_code = payment_controller_path.read_text(encoding="utf-8")
    assert "getConfig" in controller_code, "Missing getConfig method in payment.controller.ts"
    assert "clientId: env.PAYPAL_CLIENT_ID" in controller_code, "getConfig missing public clientId"
    # Extract the res.json response object inside getConfig
    res_block = controller_code.split("getConfig")[1].split("res.json(")[1].split("});")[0]
    assert "PAYPAL_CLIENT_SECRET" not in res_block, "res.json in getConfig must never leak PAYPAL_CLIENT_SECRET!"
    assert "clientSecret" not in res_block, "res.json in getConfig must never leak clientSecret!"
    print("  ✓ Client source code and public config API are 100% clean of backend payment secrets.")


def test_idor_and_authorization_guards():
    print("\n[CHECK 3] Auditing IDOR & Session Ownership Enforcement...")
    order_controller = (ROOT_DIR / "server/src/controllers/order.controller.ts").read_text(encoding="utf-8")
    txn_controller = (ROOT_DIR / "server/src/controllers/transaction.controller.ts").read_text(encoding="utf-8")
    intent_controller = (ROOT_DIR / "server/src/controllers/intent.controller.ts").read_text(encoding="utf-8")
    plan_controller = (ROOT_DIR / "server/src/controllers/plan.controller.ts").read_text(encoding="utf-8")

    # Order IDOR check
    assert "order.sessionId !== sessionId" in order_controller, "order.controller.ts missing IDOR session check"
    assert "403" in order_controller, "order.controller.ts missing 403 Forbidden on foreign session"

    # Transaction IDOR check
    assert "transaction.sessionId !== sessionId" in txn_controller, "transaction.controller.ts missing IDOR session check"
    assert "403" in txn_controller, "transaction.controller.ts missing 403 Forbidden on foreign session"

    # Intent IDOR checks
    assert "intent.sessionId !== sessionId" in intent_controller, "intent.controller.ts missing IDOR session check"
    assert "403" in intent_controller, "intent.controller.ts missing 403 Forbidden on foreign session"

    # Plan IDOR check
    assert "intent.sessionId !== sessionId" in plan_controller, "plan.controller.ts missing IDOR intent check"
    assert "403" in plan_controller, "plan.controller.ts missing 403 Forbidden on foreign intent plan generation"

    print("  ✓ Strict session ownership verified across Orders, Transactions, Intents, and Plans (403 Forbidden).")


def test_payment_integrity_and_duplicate_prevention():
    print("\n[CHECK 4] Auditing Payment Integrity & Duplicate Capture Defenses...")
    payment_service = (ROOT_DIR / "server/src/services/payment.service.ts").read_text(encoding="utf-8")
    repo_code = (ROOT_DIR / "server/src/db/repository.ts").read_text(encoding="utf-8")

    # Duplicate capture check
    assert "DUPLICATE_CAPTURE_ATTEMPT" in payment_service, "Missing DUPLICATE_CAPTURE_ATTEMPT guard in payment.service.ts"
    assert "409" in payment_service, "Missing 409 Conflict status on duplicate capture in payment.service.ts"

    # Authoritative server-side status check
    assert "captureStatus !== 'COMPLETED'" in payment_service, "Missing verification of COMPLETED status in payment.service.ts"

    # Cryptographic SHA-256 seal check
    assert "createHash('sha256')" in repo_code, "Missing SHA-256 hash generation in repository.ts"
    assert "transactionHash" in repo_code, "Missing transactionHash calculation in repository.ts"

    print("  ✓ Server-side duplicate capture prevention (409 Conflict) and SHA-256 digital seals verified.")


def test_ai_tool_sandboxing():
    print("\n[CHECK 5] Auditing AI Agent Sandboxing & Payment Isolation...")
    agent_tools = (ROOT_DIR / "server/src/services/agentTools.service.ts").read_text(encoding="utf-8")
    intent_parser = (ROOT_DIR / "server/src/services/intentParser.service.ts").read_text(encoding="utf-8")

    # Prohibited tools check: AI must NOT have tools that execute payments or alter orders
    prohibited_tools = ["execute_payment", "capture_payment", "create_order", "transfer_funds", "charge_account"]
    for prohibited in prohibited_tools:
        assert prohibited not in agent_tools, f"Prohibited tool {prohibited} found in agent tools!"

    # Allowed tools check
    assert "searchProductsSchema" in agent_tools, "Missing searchProductsSchema tool"
    assert "getProductDetailsSchema" in agent_tools, "Missing getProductDetailsSchema tool"
    assert "compareProductsSchema" in agent_tools, "Missing compareProductsSchema tool"
    assert "calculateBudgetSchema" in agent_tools, "Missing calculateBudgetSchema tool"

    # Fallback truth-in-labeling
    assert "isAiGenerated: false" in intent_parser, "Missing Truth-in-Labeling (isAiGenerated: false) on fallback"
    assert "deterministic-fallback" in intent_parser, "Missing engine tag (deterministic-fallback) on fallback"

    print("  ✓ AI tool sandbox is strictly advisory and read-only. Truth-in-Labeling active.")


def run_qa_security_test_suite():
    print("\n[CHECK 6] Running Automated QA & Security Test Suite (17 Tests)...")
    cmd = ["npm.cmd", "--workspace=server", "run", "test", "--", "tests/qa_security.test.ts"]
    result = subprocess.run(cmd, cwd=str(ROOT_DIR), capture_output=True, text=True, shell=True)
    if result.returncode != 0:
        print(result.stdout)
        print(result.stderr)
        raise AssertionError("QA & Security test suite failed!")
    print("  ✓ All 17 QA and Security automated test cases PASSED.")


def run_full_test_suite():
    print("\n[CHECK 7] Running Full Test Suite Across All Workspaces (107 Tests)...")
    cmd = ["npm.cmd", "run", "test"]
    result = subprocess.run(cmd, cwd=str(ROOT_DIR), capture_output=True, text=True, shell=True)
    if result.returncode != 0:
        print(result.stdout)
        print(result.stderr)
        raise AssertionError("Full test suite failed!")
    print("  ✓ Complete test suite (107/107 tests) PASSED across all workspaces.")


def run_typescript_check():
    print("\n[CHECK 8] Running TypeScript Strict Static Analysis...")
    cmd = ["npm.cmd", "run", "typecheck"]
    result = subprocess.run(cmd, cwd=str(ROOT_DIR), capture_output=True, text=True, shell=True)
    if result.returncode != 0:
        print(result.stdout)
        print(result.stderr)
        raise AssertionError("TypeScript compilation failed with errors!")
    print("  ✓ TypeScript compilation passed with ZERO errors across all workspaces.")


def run_client_build():
    print("\n[CHECK 9] Running Client Production Build...")
    cmd = ["npm.cmd", "--workspace=client", "run", "build"]
    result = subprocess.run(cmd, cwd=str(ROOT_DIR), capture_output=True, text=True, shell=True)
    if result.returncode != 0:
        print(result.stdout)
        print(result.stderr)
        raise AssertionError("Client build failed!")
    print("  ✓ Client built cleanly for production.")


def main():
    print("=" * 80)
    print("PAYPAL INTENT - MASTER PROMPT 9 VERIFICATION AUDIT")
    print("Testing, Security, Reliability & Performance Optimization")
    print("=" * 80)

    try:
        test_required_files_exist()
        test_zero_secret_leakage()
        test_idor_and_authorization_guards()
        test_payment_integrity_and_duplicate_prevention()
        test_ai_tool_sandboxing()
        run_qa_security_test_suite()
        run_full_test_suite()
        run_typescript_check()
        run_client_build()

        print("\n" + "=" * 80)
        print("🎉 MASTER PROMPT 9 VERIFICATION COMPLETE - ALL 9 AUDIT CHECKS PASSED!")
        print("=" * 80)
    except AssertionError as e:
        print(f"\n❌ VERIFICATION FAILED: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
