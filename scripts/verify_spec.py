"""
Verification Script for Master Prompt 1 - Product Intelligence & Specifications.
Validates the presence, structural integrity, section coverage, and completeness
of all Master Prompt 1 deliverables.
"""

import os
import sys
from pathlib import Path

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

REQUIRED_DOCS = {
    "docs/PRODUCT_SPECIFICATION.md": [
        "Executive Summary",
        "Product Categorization",
        "Target User Personas",
        "System Architecture",
        "End-to-End System Data Flow",
        "Core Data Schemas",
        "Security, Privacy & Integrity",
        "Master 10-Prompt Roadmap",
        "Conclusion & Scope Freeze"
    ],
    "docs/USER_JOURNEYS.md": [
        "Journey Architecture Overview",
        "The Golden Path",
        "Interactive Plan Modification",
        "Budget Deficit & Trade-Off Mitigation",
        "Ambiguous Intent",
        "Transaction History & Order Audit",
        "UI Wireframe"
    ],
    "docs/FEATURE_SCOPE.md": [
        "Scope Governance",
        "Frozen MVP Feature Matrix",
        "Strict Boundary Defense",
        "Curated Catalog Domain Verticals",
        "Post-MVP Extensibility Architecture",
        "Scope Freeze Statement"
    ],
    "docs/INNOVATION_STRATEGY.md": [
        "Critique of Traditional Shopping Assistants",
        "5 CORE INNOVATION PILLARS",
        "Alignment with PayPal AI Hackathon Evaluation Criteria",
        "Competitive Landscape Analysis"
    ],
    "docs/ACCEPTANCE_CRITERIA.md": [
        "Acceptance Testing Framework",
        "AC-1: Natural Language Intent Parsing",
        "AC-2: Goal Decomposition",
        "AC-3: Catalog Discovery",
        "AC-4: Deterministic Knapsack Budget Optimization",
        "AC-5: Cross-Item Compatibility",
        "AC-6: Explainable AI",
        "AC-7: Interactive Customization",
        "AC-8: PayPal Sandbox Server-Side Order Creation",
        "AC-9: Governed User Approval & Server-Side Payment Capture",
        "AC-10: Transaction Audit Logging",
        "AC-11: Zero-Cost Execution",
        "Verification & Compliance Matrix"
    ]
}

def verify_specifications():
    base_dir = Path(__file__).resolve().parent.parent
    all_passed = True
    total_checks = 0
    passed_checks = 0

    print("=================================================================")
    print("PAYPAL INTENT - MASTER PROMPT 1 SPECIFICATION VERIFICATION SUITE")
    print(f"Base Directory: {base_dir}")
    print("=================================================================\n")

    for rel_path, required_sections in REQUIRED_DOCS.items():
        doc_path = base_dir / rel_path
        print(f"Checking deliverable: [{rel_path}]")
        total_checks += 1

        if not doc_path.exists():
            print(f"  [FAIL] File not found: {rel_path}")
            all_passed = False
            continue

        content = doc_path.read_text(encoding="utf-8")
        word_count = len(content.split())
        print(f"  [PASS] Found file ({word_count} words)")
        passed_checks += 1

        if word_count < 300:
            print(f"  [FAIL] File too short ({word_count} words). Minimum 300 words required.")
            all_passed = False

        missing_sections = []
        for section in required_sections:
            total_checks += 1
            if section.lower() in content.lower():
                passed_checks += 1
            else:
                missing_sections.append(section)
                all_passed = False

        if missing_sections:
            print(f"  [FAIL] Missing required section headers:")
            for s in missing_sections:
                print(f"     - {s}")
        else:
            print(f"  [PASS] All {len(required_sections)} required section headings verified.")

        print()

    print("-----------------------------------------------------------------")
    print(f"Verification Summary: {passed_checks}/{total_checks} checks passed.")
    if all_passed:
        print("RESULT: ALL MASTER PROMPT 1 SPECIFICATION DELIVERABLES VERIFIED!")
        print("-----------------------------------------------------------------")
        return 0
    else:
        print("RESULT: VERIFICATION FAILED - Incomplete specifications detected.")
        print("-----------------------------------------------------------------")
        return 1

if __name__ == "__main__":
    sys.exit(verify_specifications())
