#!/usr/bin/env python3
"""Reject empty input early; the model should never synthesize from nothing.

Usage: python3 validate-inputs.py <path-to-notes>
Exit 0 = input present, exit 1 = reject.
"""
import sys
import pathlib


def main(path: str) -> int:
    notes = pathlib.Path(path)
    if not notes.exists() or notes.stat().st_size == 0:
        print("REJECT: no interview material provided")
        return 1
    print("OK: input present")
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("usage: validate-inputs.py <path-to-notes>")
        raise SystemExit(2)
    raise SystemExit(main(sys.argv[1]))
