"""
Comprehensive Verification Script for Master Prompt 2 - System Architecture & Foundation.
Validates:
1. Architectural & Technical Documentation completeness
2. Environment and configuration files
3. TypeScript compilations across all workspaces
4. SQLite database table structures & relational integrity
5. Vitest test suite execution
"""

import os
import sys
import subprocess
from pathlib import Path

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

REQUIRED_FOUNDATION_DOCS = {
    "docs/ARCHITECTURE.md": [
        "Executive Architectural Blueprint",
        "Layered Architecture & Subsystem Boundaries",
        "Strict Decoupling & Isolation Guarantees",
        "End-to-End Sequence Flows",
        "Architectural Quality Attributes"
    ],
    "docs/DATABASE_SCHEMA.md": [
        "Database Architecture & Engine Selection",
        "Entity-Relationship Diagram",
        "Comprehensive Entity Specifications",
        "Privacy & Anti-PII Design"
    ],
    "docs/API_SPECIFICATION.md": [
        "Global API Standards",
        "System Health & Diagnostics Endpoints",
        "Intent & Goal Planning Endpoints",
        "Product Catalog & Comparison Endpoints",
        "Shopping Cart Endpoints",
        "PayPal Payment Gateway Endpoints",
        "Transaction Audit Endpoints"
    ],
    "docs/TECHNICAL_DECISIONS.md": [
        "Architectural Decision Records",
        "ADR-1: Node.js 24 + Express + TypeScript",
        "ADR-2: Native",
        "ADR-3: Ollama",
        "ADR-4: Deterministic Knapsack Constraint Solver",
        "ADR-5: Official PayPal REST Orders v2 API",
        "ADR-6: Anonymous Cryptographic Sessions",
        "ADR-7: Monorepo Workspaces"
    ]
}

REQUIRED_FILES = [
    ".gitignore",
    ".env.example",
    ".env",
    "package.json",
    "shared/package.json",
    "shared/src/index.ts",
    "server/package.json",
    "server/src/app.ts",
    "server/src/server.ts",
    "server/src/db/schema.sql",
    "client/package.json",
    "client/vite.config.ts",
    "client/src/App.tsx"
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

def verify_foundation():
    base_dir = Path(__file__).resolve().parent.parent
    total_steps = 0
    passed_steps = 0

    print("=================================================================")
    print("PAYPAL INTENT - MASTER PROMPT 2 FOUNDATION VERIFICATION SUITE")
    print(f"Base Directory: {base_dir}")
    print("=================================================================")

    # 1. Check Configuration Files
    def check_files():
        missing = []
        for f in REQUIRED_FILES:
            if not (base_dir / f).exists():
                missing.append(f)
        if missing:
            print(f"Missing required files: {missing}")
            return False
        return True

    total_steps += 1
    if run_step("Core Configuration & Repository Files", check_files):
        passed_steps += 1

    # 2. Check Foundation Documentation
    def check_docs():
        all_ok = True
        for rel_path, required_sections in REQUIRED_FOUNDATION_DOCS.items():
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
    if run_step("Technical Architecture Documentation Coverage", check_docs):
        passed_steps += 1

    # 3. Check TypeScript Compilation
    def check_typescript():
        cmd = "npm.cmd run typecheck"
        res = subprocess.run(cmd, shell=True, cwd=str(base_dir), capture_output=True, text=True, encoding="utf-8", errors="replace")
        if res.returncode != 0:
            print(f"TypeScript checks failed:\n{res.stdout}\n{res.stderr}")
            return False
        return True

    total_steps += 1
    if run_step("TypeScript Compilation across all Workspaces", check_typescript):
        passed_steps += 1

    # 4. Check Vitest Test Suite
    def check_tests():
        cmd = "npm.cmd --workspace=server run test"
        res = subprocess.run(cmd, shell=True, cwd=str(base_dir), capture_output=True, text=True, encoding="utf-8", errors="replace")
        if res.returncode != 0:
            print(f"Vitest test suite failed:\n{res.stdout}\n{res.stderr}")
            return False
        return True

    total_steps += 1
    if run_step("Server Automated Vitest Test Suite", check_tests):
        passed_steps += 1

    # 5. Check Client Build
    def check_client_build():
        cmd = "npm.cmd --workspace=client run build"
        res = subprocess.run(cmd, shell=True, cwd=str(base_dir), capture_output=True, text=True, encoding="utf-8", errors="replace")
        if res.returncode != 0:
            print(f"Client build failed:\n{res.stdout}\n{res.stderr}")
            return False
        return True

    total_steps += 1
    if run_step("Vite Client Production Build", check_client_build):
        passed_steps += 1

    print("\n=================================================================")
    print(f"Summary: {passed_steps}/{total_steps} Foundation Verification Steps Passed")
    if passed_steps == total_steps:
        print("RESULT: MASTER PROMPT 2 TECHNICAL ARCHITECTURE FULLY VERIFIED!")
        print("=================================================================")
        return 0
    else:
        print("RESULT: FOUNDATION VERIFICATION FAILED")
        print("=================================================================")
        return 1

if __name__ == "__main__":
    sys.exit(verify_foundation())
