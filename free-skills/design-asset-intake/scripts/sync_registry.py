#!/usr/bin/env python3
"""Sync the canonical design-assets.json registry to the local consumer repo.

Usage:
  python3 sync_registry.py          # download and overwrite local copy
  python3 sync_registry.py --check  # check if local copy is up to date (exits 1 if drifted)
"""
import json
import os
import sys
import urllib.request

CANONICAL_URL = os.environ.get("CANONICAL_URL", "https://raw.githubusercontent.com/frankxai/claude-skills-library/main/registries/design-assets.json")
LOCAL_PATH = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "registries", "design-assets.json"))

def main() -> int:
    check_only = "--check" in sys.argv

    if not check_only:
        print(f"Fetching canonical registry from {CANONICAL_URL}...")
    try:
        with urllib.request.urlopen(CANONICAL_URL) as response:
            if response.status != 200:
                print(f"Failed to fetch: HTTP {response.status}")
                return 1
            data = response.read().decode('utf-8')
    except Exception as e:
        print(f"Error fetching canonical registry: {e}")
        return 1

    try:
        parsed = json.loads(data)
    except json.JSONDecodeError as e:
        print(f"Canonical registry is not valid JSON: {e}")
        return 1

    if check_only:
        if not os.path.exists(LOCAL_PATH):
            print("DRIFT: Local registry is missing.")
            return 1
        with open(LOCAL_PATH, "r", encoding="utf-8") as f:
            local_data = f.read()
        if data.strip() != local_data.strip():
            print("DRIFT: Local registry has drifted from canonical.")
            return 1
        print("OK: Local registry is in sync with canonical.")
        return 0

    os.makedirs(os.path.dirname(LOCAL_PATH), exist_ok=True)
    with open(LOCAL_PATH, "w", encoding="utf-8") as f:
        f.write(data)

    print(f"Successfully synced to {LOCAL_PATH}")
    return 0

if __name__ == "__main__":
    sys.exit(main())
