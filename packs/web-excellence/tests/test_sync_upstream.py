#!/usr/bin/env python3
"""Tests for sync-upstream.sh's licence gate and drift check.

    python3 packs/web-excellence/tests/test_sync_upstream.py

Zero dependencies beyond git. Builds mock upstream repositories under a
temporary directory and points the script at them through its two test hooks
(WEB_EXCELLENCE_UPSTREAM_BASE, WEB_EXCELLENCE_UPSTREAM_FILE), so no network
is needed and the real pack tree is never touched.

What must hold: a LICENSE file travels with the skill; a README-only licence
declaration becomes a record carrying the commit; anything unlicensed,
mismatched or refused aborts the run before a single skill is removed; and
--check reports a missing or stale UPSTREAM-LICENSE as drift.
"""
from __future__ import annotations

import os
import shutil
import subprocess
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
PACK = os.path.dirname(HERE)
SYNC = os.path.join(PACK, "sync-upstream.sh")

MIT = """MIT License

Copyright (c) 2026 Example

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT
WARRANTY OF ANY KIND, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY.
"""
GPL = """GNU GENERAL PUBLIC LICENSE
Version 3, 29 June 2007

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU General Public License. INCLUDING BUT NOT LIMITED TO THE
WARRANTIES OF MERCHANTABILITY.
"""

failures: list[str] = []


def check(name: str, condition: bool, detail: str = "") -> None:
    if condition:
        print(f"  ok   {name}")
    else:
        print(f"  FAIL {name}" + (f" — {detail}" if detail else ""))
        failures.append(name)


def git(repo: str, *args: str) -> str:
    return subprocess.run(
        ["git", "-C", repo, *args], capture_output=True, text=True, check=True
    ).stdout.strip()


def make_upstream(base: str, owner: str, name: str, files: dict[str, str]) -> str:
    """A committed repo at <base>/<owner>/<name>.git, cloneable over file://."""
    repo = os.path.join(base, owner, f"{name}.git")
    os.makedirs(repo)
    subprocess.run(["git", "init", "-q", "-b", "main", repo], check=True)
    for rel, body in files.items():
        path = os.path.join(repo, rel)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(body)
    git(repo, "add", "-A")
    git(repo, "-c", "user.name=t", "-c", "user.email=t@example.invalid", "commit", "-q", "-m", "init")
    return repo


def make_pack(root: str) -> str:
    """A throwaway pack dir holding only what the script reads and writes."""
    pack = os.path.join(root, "pack")
    os.makedirs(os.path.join(pack, "skills"))
    shutil.copy(SYNC, os.path.join(pack, "sync-upstream.sh"))
    with open(os.path.join(pack, "SOURCES.md"), "w", encoding="utf-8") as fh:
        fh.write("# Sources\n\n<!-- PINS:BEGIN -->\nold\n<!-- PINS:END -->\n")
    return pack


def run_sync(pack: str, base: str, entries: list[str], *flags: str) -> subprocess.CompletedProcess:
    upstream_file = os.path.join(pack, "upstream.txt")
    with open(upstream_file, "w", encoding="utf-8") as fh:
        fh.write("# test entries\n" + "\n".join(entries) + "\n")
    env = dict(os.environ)
    env["WEB_EXCELLENCE_UPSTREAM_BASE"] = "file://" + base
    env["WEB_EXCELLENCE_UPSTREAM_FILE"] = upstream_file
    return subprocess.run(
        ["bash", os.path.join(pack, "sync-upstream.sh"), *flags],
        capture_output=True, text=True, env=env,
    )


def read(path: str) -> str:
    with open(path, encoding="utf-8") as fh:
        return fh.read()


def main() -> int:
    with tempfile.TemporaryDirectory() as tmp:
        base = os.path.join(tmp, "upstreams")
        with_file = make_upstream(base, "acme", "with-file", {
            "LICENSE": MIT,
            "skills/alpha/SKILL.md": "---\nname: alpha\n---\nalpha\n",
        })
        readme_only = make_upstream(base, "acme", "readme-only", {
            "README.md": "# readme-only\n\nIntro.\n\n## License\n\nMIT\n\n## Credits\n\nnope\n",
            "skills/beta/SKILL.md": "---\nname: beta\n---\nbeta\n",
        })
        make_upstream(base, "acme", "unlicensed", {
            "README.md": "# unlicensed\n\nNo licence anywhere.\n",
            "skills/gamma/SKILL.md": "gamma\n",
        })
        make_upstream(base, "acme", "copyleft", {
            "LICENSE": GPL,
            "skills/delta/SKILL.md": "delta\n",
        })
        make_upstream(base, "acme", "apache-file", {
            "LICENSE": "Apache License\nVersion 2.0, January 2004\n",
            "skills/epsilon/SKILL.md": "epsilon\n",
        })
        make_upstream(base, "acme", "reserved-readme", {
            "README.md": "# r\n\n## License\n\nMIT. All rights reserved.\n",
            "skills/zeta/SKILL.md": "zeta\n",
        })
        make_upstream(base, "acme", "reserved-file", {
            "LICENSE": "MIT License\n\nCopyright (c) 2026 Example. All rights reserved.\n",
            "skills/eta/SKILL.md": "eta\n",
        })
        bsd3 = ("Copyright (c) 2026 NC State Example. All rights reserved.\n\n"
                "Redistribution and use in source and binary forms, with or without\n"
                "modification, are permitted provided that the following conditions are met.\n"
                "3. Neither the name of the copyright holder nor the names of its contributors\n"
                "   may be used to endorse or promote products derived from this software.\n")
        make_upstream(base, "acme", "bsd-file", {
            "LICENSE": bsd3,
            "skills/theta/SKILL.md": "theta\n",
        })
        outside = os.path.join(tmp, "outside.txt")
        with open(outside, "w", encoding="utf-8") as fh:
            fh.write("precious\n")
        make_upstream(base, "acme", "symlinked", {
            "README.md": "# s\n\n## License\n\nMIT\n",
            "skills/iota/SKILL.md": "iota\n",
        })
        os.symlink(outside, os.path.join(base, "acme", "symlinked.git", "skills", "iota", "UPSTREAM-LICENSE"))
        sym_repo = os.path.join(base, "acme", "symlinked.git")
        git(sym_repo, "add", "-A")
        git(sym_repo, "-c", "user.name=t", "-c", "user.email=t@example.invalid", "commit", "-q", "-m", "symlink")

        good = [
            "acme/with-file|MIT|skills/alpha|alpha",
            "acme/readme-only|MIT|skills/beta|beta",
        ]

        # ---- happy path: vendor, then --check is clean -------------------------
        pack = make_pack(os.path.join(tmp, "p1"))
        r = run_sync(pack, base, good)
        check("sync exits 0", r.returncode == 0, r.stderr)
        alpha_lic = os.path.join(pack, "skills", "alpha", "UPSTREAM-LICENSE")
        beta_lic = os.path.join(pack, "skills", "beta", "UPSTREAM-LICENSE")
        check("LICENSE file travels verbatim", os.path.isfile(alpha_lic) and read(alpha_lic) == MIT)
        check("README-only upstream gets a record", os.path.isfile(beta_lic) and read(beta_lic).startswith("UPSTREAM LICENCE RECORD"))
        sha = git(readme_only, "rev-parse", "HEAD")
        check("record carries the upstream commit", f"Commit:   {sha}" in read(beta_lic))
        check("record quotes the declaration", "\n    MIT\n" in read(beta_lic))
        check("record stops at the next heading", "nope" not in read(beta_lic))
        check("record names the declared licence", "Declared licence as recorded in SOURCES.md: MIT." in read(beta_lic))
        sources = read(os.path.join(pack, "SOURCES.md"))
        check("SOURCES.md pin table rewritten", sha[:12] in sources and "old" not in sources)

        r = run_sync(pack, base, good, "--check")
        check("--check after sync exits 0", r.returncode == 0, r.stdout + r.stderr)
        check("--check reports both ok", r.stdout.count("ok     ") == 2, r.stdout)

        # ---- drift: tree, missing record, stale record -------------------------
        with open(os.path.join(pack, "skills", "alpha", "SKILL.md"), "a", encoding="utf-8") as fh:
            fh.write("edited\n")
        r = run_sync(pack, base, good, "--check")
        check("--check reports an edited tree as drift", r.returncode == 1 and "DRIFT  alpha" in r.stdout, r.stdout)
        r = run_sync(pack, base, good)
        check("re-sync restores the tree", r.returncode == 0 and "edited" not in read(os.path.join(pack, "skills", "alpha", "SKILL.md")))

        os.remove(beta_lic)
        r = run_sync(pack, base, good, "--check")
        check("--check reports a missing UPSTREAM-LICENSE as drift", r.returncode == 1 and "DRIFT  beta" in r.stdout and "UPSTREAM-LICENSE" in r.stdout, r.stdout)
        run_sync(pack, base, good)

        stale = read(beta_lic).replace("Declared licence as recorded in SOURCES.md: MIT.", "Declared licence as recorded in SOURCES.md: Apache-2.0.")
        check("stale fixture differs from the record", stale != read(beta_lic))
        with open(beta_lic, "w", encoding="utf-8") as fh:
            fh.write(stale)
        r = run_sync(pack, base, good, "--check")
        check("--check reports a stale record as drift", r.returncode == 1 and "DRIFT  beta" in r.stdout, r.stdout)
        run_sync(pack, base, good)

        moved = read(beta_lic).replace(f"Commit:   {sha}", "Commit:   0000000000000000000000000000000000000000")
        check("moved-commit fixture differs from the record", moved != read(beta_lic))
        with open(beta_lic, "w", encoding="utf-8") as fh:
            fh.write(moved)
        r = run_sync(pack, base, good, "--check")
        check("a moved Commit line alone is not drift", r.returncode == 0, r.stdout)

        # ---- refusals leave the tree untouched ---------------------------------
        def refused(label: str, entries: list[str], needle: str) -> None:
            before = read(os.path.join(pack, "skills", "alpha", "SKILL.md"))
            marker = os.path.join(pack, "skills", "alpha", "LOCAL.md")
            with open(marker, "w", encoding="utf-8") as fh:
                fh.write("local\n")
            r = run_sync(pack, base, entries)
            check(f"{label}: exits 1", r.returncode == 1, r.stderr)
            check(f"{label}: names the gate", needle in r.stderr and "ABSORPTION.md gate 1" in r.stderr, r.stderr)
            check(f"{label}: alpha untouched", os.path.isfile(marker) and read(os.path.join(pack, "skills", "alpha", "SKILL.md")) == before)
            check(f"{label}: nothing new vendored", not any(os.path.isdir(os.path.join(pack, "skills", d)) for d in ("gamma", "delta", "epsilon", "zeta", "eta", "theta")))
            os.remove(marker)

        # alpha is listed first in every refused run, so a single-pass script
        # would have re-vendored it (dropping LOCAL.md) before hitting the bad entry.
        refused("unlicensed upstream", good[:1] + ["acme/unlicensed|MIT|skills/gamma|gamma"], "no License section")
        refused("copyleft text declared MIT", good[:1] + ["acme/copyleft|MIT|skills/delta|delta"], "refused licence")
        refused("declaration mismatch", good[:1] + ["acme/apache-file|MIT|skills/epsilon|epsilon"], "does not read as MIT")
        refused("licence not on allowlist", good[:1] + ["acme/apache-file|GPL-3.0|skills/epsilon|epsilon"], "not on the ABSORPTION.md allowlist")
        refused("BSD-3 text declared BSD-2-Clause", good[:1] + ["acme/bsd-file|BSD-2-Clause|skills/theta|theta"], "does not read as BSD-2-Clause")

        refused("README declares MIT but reserves all rights", good[:1] + ["acme/reserved-readme|MIT|skills/zeta|zeta"], "all rights reserved and grants nothing")
        refused("LICENSE file reserves all rights with no grant", good[:1] + ["acme/reserved-file|MIT|skills/eta|eta"], "all rights reserved and grants nothing")

        r = run_sync(pack, base, good[:1] + ["acme/apache-file|Apache-2.0|skills/epsilon|epsilon"])
        check("Apache text declared Apache-2.0 vendors", r.returncode == 0 and os.path.isfile(os.path.join(pack, "skills", "epsilon", "UPSTREAM-LICENSE")), r.stderr)
        r = run_sync(pack, base, good[:1] + ["acme/bsd-file|BSD-3-Clause|skills/theta|theta"])
        check("BSD-3 boilerplate, NC initials and all, vendors as BSD-3-Clause", r.returncode == 0 and os.path.isfile(os.path.join(pack, "skills", "theta", "UPSTREAM-LICENSE")), r.stderr)

        # ---- a record with no Commit line has lost its provenance ------------
        run_sync(pack, base, good)
        lines = [ln for ln in read(beta_lic).splitlines(keepends=True) if not ln.startswith("Commit:")]
        with open(beta_lic, "w", encoding="utf-8") as fh:
            fh.writelines(lines)
        r = run_sync(pack, base, good, "--check")
        check("--check reports a record missing its Commit line as drift", r.returncode == 1 and "DRIFT  beta" in r.stdout, r.stdout)

        # ---- an upstream symlink named UPSTREAM-LICENSE cannot redirect the record
        r = run_sync(pack, base, good[:1] + ["acme/symlinked|MIT|skills/iota|iota"])
        iota_lic = os.path.join(pack, "skills", "iota", "UPSTREAM-LICENSE")
        check("symlinked upstream vendors", r.returncode == 0, r.stderr)
        check("record is a regular file, not the upstream symlink", os.path.isfile(iota_lic) and not os.path.islink(iota_lic))
        check("file outside the pack is untouched", read(outside) == "precious\n")

        # ---- the real pack's records match what the script would write -------
        real = read(os.path.join(PACK, "skills", "web-design-guidelines", "UPSTREAM-LICENSE"))
        check("real web-design-guidelines record has the generated shape",
              real.startswith("UPSTREAM LICENCE RECORD") and "Declared licence as recorded in SOURCES.md: MIT." in real)
        for d in sorted(os.listdir(os.path.join(PACK, "skills"))):
            if d in ("web-release-gate", "core-web-vitals", "visual-proof"):
                continue
            check(f"real {d} carries UPSTREAM-LICENSE", os.path.isfile(os.path.join(PACK, "skills", d, "UPSTREAM-LICENSE")))

    print()
    if failures:
        print(f"{len(failures)} failing: {', '.join(failures)}")
        return 1
    print("all sync-upstream tests passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
