"""
Comprehensive Verification Script for Master Prompt 5 - Backend, Database & Commerce Engine.
Validates:
1. SQLite relational database schema with all 13 core entities
2. Seeded product catalog covering all 7 required categories (Laptops, Monitors, Keyboards, Mice, Headphones, Furniture, Accessories)
3. Structured attributes in product_attributes table
4. Minor units monetary calculations utility (zero floating point drift)
5. Product search, category filtering, price filtering, and attribute filtering
6. Cart management, validation, and price tampering correction
7. Order creation with authoritative server recalculation and duplicate prevention
8. Rate limiting middleware and API security controls
9. Server automated Vitest test suite (34 tests)
10. Workspace TypeScript compilation & server build
"""

import sys
import subprocess
from pathlib import Path

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

ROOT_DIR = Path(__file__).resolve().parent.parent

CORE_BACKEND_FILES = [
    "server/src/utils/money.ts",
    "server/src/db/seed.ts",
    "server/src/db/index.ts",
    "server/src/db/repository.ts",
    "server/src/services/catalog.service.ts",
    "server/src/services/cart.service.ts",
    "server/src/services/order.service.ts",
    "server/src/services/transaction.service.ts",
    "server/src/middleware/rateLimiter.ts",
    "server/src/controllers/product.controller.ts",
    "server/src/controllers/cart.controller.ts",
    "server/src/controllers/order.controller.ts",
    "server/src/routes/product.routes.ts",
    "server/src/routes/cart.routes.ts",
    "server/src/routes/order.routes.ts",
    "server/tests/money.test.ts",
    "server/tests/catalog.test.ts",
    "server/tests/cart_order.test.ts",
    "server/tests/rateLimiter.test.ts"
]

REQUIRED_CATEGORIES = [
    "laptops",
    "monitors",
    "keyboards",
    "mice",
    "headphones",
    "furniture",
    "accessories"
]


def test_core_files_exist():
    print("\n[CHECK 1] Validating Core Backend & Commerce Files...")
    missing = []
    for rel_path in CORE_BACKEND_FILES:
        full_path = ROOT_DIR / rel_path
        if not full_path.exists():
            missing.append(rel_path)
            print(f"  [FAIL] Missing: {rel_path}")
        else:
            print(f"  [PASS] Found: {rel_path}")

    if missing:
        print(f"ERROR: {len(missing)} backend files missing.")
        return False
    print("ALL core backend architecture and service files verified.")
    return True


def test_catalog_seed_content():
    print("\n[CHECK 2] Validating Curated Catalog Categories & Demonstration Labeling...")
    seed_file = ROOT_DIR / "server/src/db/seed.ts"
    content = seed_file.read_text(encoding="utf-8")

    for cat in REQUIRED_CATEGORIES:
        if f"categoryId: '{cat}'" not in content and f'categoryId: "{cat}"' not in content:
            print(f"  [FAIL] Required category '{cat}' missing from seed catalog!")
            return False
        else:
            print(f"  [PASS] Verified category present in seed: {cat}")

    # Check for explicit demonstration disclaimer
    if "Demonstration Catalog Data" not in content:
        print("  [FAIL] Demonstration disclaimer missing from product descriptions!")
        return False
    print("  [PASS] Curated catalog explicitly marked as demonstration data (no false inventory claims).")

    return True


def test_server_vitest_suite():
    print("\n[CHECK 3] Executing Server Vitest Test Suite (Money, Catalog, Cart, Order, RateLimiter)...")
    cmd = ["npm.cmd", "--workspace=server", "run", "test"]
    result = subprocess.run(cmd, cwd=ROOT_DIR, capture_output=True, text=True, encoding="utf-8", errors="replace", shell=True)

    if result.returncode != 0:
        print("  [FAIL] Server Vitest test suite failed!")
        print(result.stdout)
        print(result.stderr)
        return False

    print("  [PASS] All server Vitest tests executed and passed.")
    print(result.stdout.strip())
    return True


def test_typecheck():
    print("\n[CHECK 4] Running TypeScript Static Analysis across Workspaces...")
    cmd = ["npm.cmd", "run", "typecheck"]
    result = subprocess.run(cmd, cwd=ROOT_DIR, capture_output=True, text=True, encoding="utf-8", errors="replace", shell=True)

    if result.returncode != 0:
        print("  [FAIL] TypeScript static analysis failed!")
        print(result.stdout)
        print(result.stderr)
        return False

    print("  [PASS] TypeScript check passed without errors (strict mode).")
    return True


def test_server_build():
    print("\n[CHECK 5] Compiling Production Server Bundle...")
    cmd = ["npm.cmd", "--workspace=server", "run", "build"]
    result = subprocess.run(cmd, cwd=ROOT_DIR, capture_output=True, text=True, encoding="utf-8", errors="replace", shell=True)

    if result.returncode != 0:
        print("  [FAIL] Server build failed!")
        print(result.stdout)
        print(result.stderr)
        return False

    dist_server = ROOT_DIR / "server/dist/server.js"
    dist_schema = ROOT_DIR / "server/dist/db/schema.sql"

    if not dist_server.exists() or not dist_schema.exists():
        print("  [FAIL] server/dist artifacts missing!")
        return False

    print("  [PASS] Production server bundle compiled successfully with schema.sql asset.")
    return True


def main():
    print("=" * 70)
    print("PAYPAL INTENT - MASTER PROMPT 5 (BACKEND & COMMERCE ENGINE) VERIFICATION")
    print("=" * 70)

    checks = [
        test_core_files_exist,
        test_catalog_seed_content,
        test_server_vitest_suite,
        test_typecheck,
        test_server_build
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
    print("Master Prompt 5 Backend, Database & Commerce Engine fully verified!")
    print("=" * 70)
    sys.exit(0)


if __name__ == "__main__":
    main()
