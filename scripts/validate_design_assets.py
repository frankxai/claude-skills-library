#!/usr/bin/env python3
"""Validate registries/design-assets.json against its schema.

Wire into CI/validation hooks to ensure typos in the registry do not ship.
"""

import json
import os
import re

def validate_registry(filepath: str) -> list[str]:
    """Validate the design-assets registry. Returns a list of error strings."""
    errors = []

    if not os.path.exists(filepath):
        return [f"Registry not found: {filepath}"]

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        return [f"Invalid JSON: {e}"]

    if not isinstance(data, dict):
        return ["Root must be a JSON object"]

    if "description" not in data or not isinstance(data["description"], str):
        errors.append("Root must have a string 'description'")

    if "assets" not in data or not isinstance(data["assets"], list):
        errors.append("Root must have a list 'assets'")
        return errors

    for i, asset in enumerate(data["assets"]):
        prefix = f"Asset {i}"

        # Required strings
        for key in ["name", "source_url", "integration_type", "added_date", "brand_fit_notes"]:
            if key not in asset:
                errors.append(f"{prefix} is missing '{key}'")
            elif not isinstance(asset[key], str):
                errors.append(f"{prefix} '{key}' must be a string")

        # integration_type Enum
        if "integration_type" in asset and asset["integration_type"] not in ["npm-dependency", "vendor-copy", "reference-study"]:
            errors.append(f"{prefix} 'integration_type' must be 'npm-dependency', 'vendor-copy', or 'reference-study'")

        # package string or null
        if "package" not in asset:
            errors.append(f"{prefix} is missing 'package'")
        elif asset["package"] is not None and not isinstance(asset["package"], str):
            errors.append(f"{prefix} 'package' must be a string or null")

        # target_design_system list of strings
        if "target_design_system" not in asset:
            errors.append(f"{prefix} is missing 'target_design_system'")
        elif not isinstance(asset["target_design_system"], list):
            errors.append(f"{prefix} 'target_design_system' must be a list")
        else:
            for item in asset["target_design_system"]:
                if not isinstance(item, str):
                    errors.append(f"{prefix} 'target_design_system' items must be strings")

        # added_date format YYYY-MM-DD
        if "added_date" in asset and isinstance(asset["added_date"], str):
            if not re.match(r"^\d{4}-\d{2}-\d{2}$", asset["added_date"]):
                errors.append(f"{prefix} 'added_date' must be YYYY-MM-DD")

        # requires optional list of strings
        if "requires" in asset:
            if not isinstance(asset["requires"], list):
                errors.append(f"{prefix} 'requires' must be a list")
            else:
                for item in asset["requires"]:
                    if not isinstance(item, str):
                        errors.append(f"{prefix} 'requires' items must be strings")

    return errors

if __name__ == "__main__":
    import sys
    filepath = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "registries", "design-assets.json"))
    if len(sys.argv) > 1:
        filepath = sys.argv[1]

    errors = validate_registry(filepath)
    if errors:
        print(f"FAIL: {len(errors)} error(s) in {filepath}:")
        for err in errors:
            print(f"  - {err}")
        sys.exit(1)

    print(f"OK: {filepath} is spec-compliant.")
    sys.exit(0)
