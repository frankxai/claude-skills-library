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
            "skills/alpha/references/UPSTREAM-LICENSE": "nested upstream content, not our record\n",
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

        def add_symlink(repo_name: str, rel: str, target: str) -> None:
            repo = os.path.join(base, "acme", repo_name + ".git")
            os.symlink(target, os.path.join(repo, rel))
            git(repo, "add", "-A")
            git(repo, "-c", "user.name=t", "-c", "user.email=t@example.invalid", "commit", "-q", "-m", "symlink")

        make_upstream(base, "acme", "symlinked", {
            "README.md": "# s\n\n## License\n\nMIT\n",
            "skills/iota/SKILL.md": "iota\n",
        })
        add_symlink("symlinked", "skills/iota/UPSTREAM-LICENSE", outside)
        make_upstream(base, "acme", "dir-collision", {
            "LICENSE": MIT,
            "skills/omicron/SKILL.md": "omicron\n",
            "skills/omicron/UPSTREAM-LICENSE/x": "x\n",
        })
        make_upstream(base, "acme", "two-files", {
            "skills/nu/LICENSE": MIT,
            "skills/nu/LICENSE.md": GPL,
            "skills/nu/SKILL.md": "nu\n",
        })
        make_upstream(base, "acme", "readme-conflict", {
            "LICENSE": MIT,
            "skills/xi/README.md": "# xi\n\n## License\n\nGPL-3.0\n",
            "skills/xi/SKILL.md": "xi\n",
        })
        make_upstream(base, "acme", "proprietary-file", {
            "LICENSE": "This proprietary work is not licensed under MIT; contact us for terms.\n",
            "skills/pi/SKILL.md": "pi\n",
        })
        outside_mit = os.path.join(tmp, "outside-LICENSE")
        with open(outside_mit, "w", encoding="utf-8") as fh:
            fh.write(MIT)
        make_upstream(base, "acme", "symlink-license", {
            "skills/rho/SKILL.md": "rho\n",
        })
        add_symlink("symlink-license", "skills/rho/LICENSE", outside_mit)
        make_upstream(base, "acme", "subheading", {
            "README.md": "# s\n\n## License\n\nMIT\n\n### Exceptions\n\nNot for commercial use.\n\n## Other\n\nfine\n",
            "skills/sigma/SKILL.md": "sigma\n",
        })
        make_upstream(base, "acme", "subheading-benign", {
            "README.md": "# t\n\n## License\n\nMIT\n\n### Attribution\n\nPlease credit the authors.\n\n## Credits\n\nnope\n",
            "skills/tau/SKILL.md": "tau\n",
        })
        make_upstream(base, "acme", "bare-file", {
            "LICENSE": "MIT\n",
            "skills/upsilon/SKILL.md": "upsilon\n",
        })
        make_upstream(base, "acme", "apache11", {
            "LICENSE": "Apache License\nVersion 1.1\n\nCopyright (c) 2000 The Apache Software Foundation. All rights reserved.\n\n"
                       "Redistribution and use in source and binary forms, with or without modification, are permitted.\n",
            "skills/phi/SKILL.md": "phi\n",
        })
        make_upstream(base, "acme", "mit0", {
            "LICENSE": "MIT No Attribution\n\nCopyright 2026 Example\n\nPermission is hereby granted, free of charge, to any person obtaining a copy.\n",
            "skills/chi/SKILL.md": "chi\n",
        })
        make_upstream(base, "acme", "copying", {
            "LICENSE": MIT,
            "skills/psi/COPYING": GPL,
            "skills/psi/SKILL.md": "psi\n",
        })
        make_upstream(base, "acme", "rider", {
            "LICENSE": MIT + "\nThis software may not be used for surveillance of any kind.\n",
            "skills/omega/SKILL.md": "omega\n",
        })
        make_upstream(base, "acme", "prefix-heading", {
            "README.md": "# p\n\n## License compatibility\n\nWorks with MIT projects.\n\n## License\n\nGPL-3.0\n",
            "skills/bet/SKILL.md": "bet\n",
        })
        make_upstream(base, "acme", "two-sections", {
            "README.md": "# q\n\n## License\n\nMIT\n\n## Usage\n\nx\n\n## Licence\n\nApache-2.0\n",
            "skills/gimel/SKILL.md": "gimel\n",
        })
        make_upstream(base, "acme", "nested-gpl", {
            "LICENSE": MIT,
            "skills/dalet/SKILL.md": "dalet\n",
            "skills/dalet/vendor/thing/LICENSE-GPL": GPL,
        })
        make_upstream(base, "acme", "nested-mit", {
            "LICENSE": MIT,
            "skills/he/SKILL.md": "he\n",
            "skills/he/vendor/thing/LICENSE": MIT.replace("Example", "Nested Example"),
            "skills/he/docs/README.md": "# docs\n\n## License\n\nMIT\n",
        })
        make_upstream(base, "acme", "licenses-dir", {
            "LICENSE": MIT,
            "skills/alef/LICENSES/GPL-3.0.txt": GPL,
            "skills/alef/SKILL.md": "alef\n",
        })
        make_upstream(base, "acme", "negated", {
            "README.md": "# n\n\n## License\n\nThis project is not licensed under MIT; contact us for terms.\n",
            "skills/mu/SKILL.md": "mu\n",
        })
        make_upstream(base, "acme", "mono-conflict", {
            "LICENSE": MIT,
            "skills/kappa/LICENSE": GPL,
            "skills/kappa/SKILL.md": "kappa\n",
        })
        local_mit = MIT.replace("Copyright (c) 2026 Example", "Copyright (c) 2026 Lambda Authors")
        make_upstream(base, "acme", "mono-local", {
            "LICENSE": MIT,
            "skills/lambda/LICENSE": local_mit,
            "skills/lambda/SKILL.md": "lambda\n",
        })

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
            check(f"{label}: nothing new vendored", not any(os.path.isdir(os.path.join(pack, "skills", d)) for d in ("gamma", "delta", "epsilon", "zeta", "eta", "theta", "mu", "kappa", "lambda", "iota", "omicron", "nu", "xi", "pi", "rho", "sigma", "phi", "chi", "psi", "omega", "alef", "bet", "gimel", "dalet")))
            os.remove(marker)

        # alpha is listed first in every refused run, so a single-pass script
        # would have re-vendored it (dropping LOCAL.md) before hitting the bad entry.
        refused("unlicensed upstream", good[:1] + ["acme/unlicensed|MIT|skills/gamma|gamma"], "License section")
        refused("copyleft text declared MIT", good[:1] + ["acme/copyleft|MIT|skills/delta|delta"], "refused licence")
        refused("declaration mismatch", good[:1] + ["acme/apache-file|MIT|skills/epsilon|epsilon"], "does not read as MIT")
        refused("licence not on allowlist", good[:1] + ["acme/apache-file|GPL-3.0|skills/epsilon|epsilon"], "not on the ABSORPTION.md allowlist")
        refused("BSD-3 text declared BSD-2-Clause", good[:1] + ["acme/bsd-file|BSD-2-Clause|skills/theta|theta"], "does not read as BSD-2-Clause")
        refused("README negates its declaration", good[:1] + ["acme/negated|MIT|skills/mu|mu"], "qualifies or negates")
        refused("skill-local GPL under an MIT root", good[:1] + ["acme/mono-conflict|MIT|skills/kappa|kappa"], "skills/kappa/LICENSE reads as a refused licence")
        refused("two licence files at one level, one GPL", good[:1] + ["acme/two-files|MIT|skills/nu|nu"], "skills/nu/LICENSE.md reads as a refused licence")
        refused("skill README declares GPL under an MIT root", good[:1] + ["acme/readme-conflict|MIT|skills/xi|xi"], "skills/xi/README.md License section reads as a refused licence")
        refused("LICENSE file that is a negated declaration", good[:1] + ["acme/proprietary-file|MIT|skills/pi|pi"], "qualifies or negates")
        refused("symlinked LICENSE input", good[:1] + ["acme/symlink-license|MIT|skills/rho|rho"], "is a symlink")
        refused("restriction hidden under a License sub-heading", good[:1] + ["acme/subheading|MIT|skills/sigma|sigma"], "qualifies or negates")
        refused("upstream ships UPSTREAM-LICENSE at the skill root", good[:1] + ["acme/symlinked|MIT|skills/iota|iota"], "reserves")
        check("planted UPSTREAM-LICENSE symlink never touched the outside file", read(outside) == "precious\n")
        refused("upstream ships an UPSTREAM-LICENSE directory", good[:1] + ["acme/dir-collision|MIT|skills/omicron|omicron"], "reserves")
        refused("Apache 1.1 text declared Apache-2.0", good[:1] + ["acme/apache11|Apache-2.0|skills/phi|phi"], "does not read as Apache-2.0")
        refused("MIT-0 text declared MIT", good[:1] + ["acme/mit0|MIT|skills/chi|chi"], "does not read as MIT")
        refused("skill-local COPYING with GPL under an MIT root", good[:1] + ["acme/copying|MIT|skills/psi|psi"], "skills/psi/COPYING reads as a refused licence")
        refused("MIT text with a use-restriction rider", good[:1] + ["acme/rider|MIT|skills/omega|omega"], "use restriction on top of its grant")
        refused("skill-local LICENSES directory", good[:1] + ["acme/licenses-dir|MIT|skills/alef|alef"], "directory of licences")
        refused("prefix heading is not a declaration; the real License section says GPL", good[:1] + ["acme/prefix-heading|MIT|skills/bet|bet"], "README.md License section reads as a refused licence")
        refused("two License sections that disagree", good[:1] + ["acme/two-sections|MIT|skills/gimel|gimel"], "does not read as MIT")
        refused("nested vendor/LICENSE-GPL inside the skill", good[:1] + ["acme/nested-gpl|MIT|skills/dalet|dalet"], "skills/dalet/vendor/thing/LICENSE-GPL reads as a refused licence")

        # ---- malformed override rows never reach pass 2 -------------------------
        p3 = make_pack(os.path.join(tmp, "p3"))
        os.makedirs(os.path.join(p3, "skills", "keep"))
        with open(os.path.join(p3, "skills", "keep", "SKILL.md"), "w", encoding="utf-8") as fh:
            fh.write("keep\n")
        for label, row in (
            ("three fields", "acme/with-file|MIT|skills/alpha"),
            ("empty dest", "acme/with-file|MIT|skills/alpha|"),
            ("traversing dest", "acme/with-file|MIT|skills/alpha|../escape"),
            ("dest with slash", "acme/with-file|MIT|skills/alpha|a/b"),
            ("traversing src", "acme/with-file|MIT|../etc|alpha"),
            ("five fields", "acme/with-file|MIT|skills/alpha|alpha|extra"),
        ):
            r = run_sync(p3, base, [row])
            check(f"override row with {label} exits 2", r.returncode == 2, r.stderr)
        check("malformed rows left the existing skills tree untouched", os.path.isfile(os.path.join(p3, "skills", "keep", "SKILL.md")))
        check("malformed rows left SOURCES.md untouched", "old" in read(os.path.join(p3, "SOURCES.md")))

        # ---- an unreadable override file aborts before anything is rewritten
        p2 = make_pack(os.path.join(tmp, "p2"))
        env = dict(os.environ)
        env["WEB_EXCELLENCE_UPSTREAM_BASE"] = "file://" + base
        env["WEB_EXCELLENCE_UPSTREAM_FILE"] = os.path.join(tmp, "does-not-exist.txt")
        r = subprocess.run(["bash", os.path.join(p2, "sync-upstream.sh")], capture_output=True, text=True, env=env)
        check("unreadable override file exits 2", r.returncode == 2, r.stderr)
        check("unreadable override file leaves SOURCES.md untouched", "old" in read(os.path.join(p2, "SOURCES.md")))
        with open(os.path.join(p2, "empty.txt"), "w", encoding="utf-8") as fh:
            fh.write("# nothing here\n\n")
        env["WEB_EXCELLENCE_UPSTREAM_FILE"] = os.path.join(p2, "empty.txt")
        r = subprocess.run(["bash", os.path.join(p2, "sync-upstream.sh")], capture_output=True, text=True, env=env)
        check("empty override file exits 2", r.returncode == 2, r.stderr)
        check("empty override file leaves SOURCES.md untouched", "old" in read(os.path.join(p2, "SOURCES.md")))

        refused("README declares MIT but reserves all rights", good[:1] + ["acme/reserved-readme|MIT|skills/zeta|zeta"], "all rights reserved and grants nothing")
        refused("LICENSE file reserves all rights with no grant", good[:1] + ["acme/reserved-file|MIT|skills/eta|eta"], "all rights reserved and grants nothing")

        r = run_sync(pack, base, good[:1] + ["acme/apache-file|Apache-2.0|skills/epsilon|epsilon"])
        check("Apache text declared Apache-2.0 vendors", r.returncode == 0 and os.path.isfile(os.path.join(pack, "skills", "epsilon", "UPSTREAM-LICENSE")), r.stderr)
        r = run_sync(pack, base, good[:1] + ["acme/bsd-file|BSD-3-Clause|skills/theta|theta"])
        check("BSD-3 boilerplate, NC initials and all, vendors as BSD-3-Clause", r.returncode == 0 and os.path.isfile(os.path.join(pack, "skills", "theta", "UPSTREAM-LICENSE")), r.stderr)
        r = run_sync(pack, base, good[:1] + ["acme/mono-local|MIT|skills/lambda|lambda"])
        lambda_lic = os.path.join(pack, "skills", "lambda", "UPSTREAM-LICENSE")
        check("skill-local MIT under an MIT root vendors", r.returncode == 0 and os.path.isfile(lambda_lic), r.stderr)
        check("the nearest licence is the one recorded", os.path.isfile(lambda_lic) and read(lambda_lic) == local_mit)
        r = run_sync(pack, base, good[:1] + ["acme/subheading-benign|MIT|skills/tau|tau"])
        tau_lic = os.path.join(pack, "skills", "tau", "UPSTREAM-LICENSE")
        check("benign sub-heading under License vendors", r.returncode == 0 and os.path.isfile(tau_lic), r.stderr)
        check("record keeps the sub-heading and stops at the next same-level heading", os.path.isfile(tau_lic) and "### Attribution" in read(tau_lic) and "nope" not in read(tau_lic))
        r = run_sync(pack, base, good[:1] + ["acme/nested-mit|MIT|skills/he|he"])
        he_lic = os.path.join(pack, "skills", "he", "UPSTREAM-LICENSE")
        check("nested MIT licence and nested README under an MIT root vendor", r.returncode == 0 and os.path.isfile(he_lic), r.stderr)
        check("the root licence, not the nested one, is recorded", os.path.isfile(he_lic) and read(he_lic) == MIT)
        r = run_sync(pack, base, good[:1] + ["acme/bare-file|MIT|skills/upsilon|upsilon"])
        check("a LICENSE file that is a bare declaration vendors", r.returncode == 0 and os.path.isfile(os.path.join(pack, "skills", "upsilon", "UPSTREAM-LICENSE")), r.stderr)

        # ---- a symlinked installed record is not a record ------------------------
        run_sync(pack, base, good)
        copy_of_record = os.path.join(tmp, "beta-record-copy")
        shutil.copy(beta_lic, copy_of_record)
        os.remove(beta_lic)
        os.symlink(copy_of_record, beta_lic)
        r = run_sync(pack, base, good, "--check")
        check("--check reports a symlinked record as drift", r.returncode == 1 and "DRIFT  beta" in r.stdout, r.stdout)
        os.remove(beta_lic)
        run_sync(pack, base, good)

        # ---- a raw LICENSE record ignores nothing -------------------------------
        run_sync(pack, base, good)
        with open(alpha_lic, "a", encoding="utf-8") as fh:
            fh.write("Commit: deadbeef\n")
        r = run_sync(pack, base, good, "--check")
        check("--check reports a Commit line injected into a raw LICENSE record as drift", r.returncode == 1 and "DRIFT  alpha" in r.stdout, r.stdout)
        run_sync(pack, base, good)

        # ---- only the root UPSTREAM-LICENSE is ours; a nested one is upstream content
        nested = os.path.join(pack, "skills", "alpha", "references", "UPSTREAM-LICENSE")
        check("nested upstream UPSTREAM-LICENSE is vendored", os.path.isfile(nested))
        with open(nested, "a", encoding="utf-8") as fh:
            fh.write("edited\n")
        r = run_sync(pack, base, good, "--check")
        check("--check reports an edited nested UPSTREAM-LICENSE as drift", r.returncode == 1 and "DRIFT  alpha" in r.stdout, r.stdout)
        run_sync(pack, base, good)
        r = run_sync(pack, base, good, "--check")
        check("--check is clean again after re-sync", r.returncode == 0, r.stdout)

        # ---- a record with no Commit line has lost its provenance ------------
        run_sync(pack, base, good)
        lines = [ln for ln in read(beta_lic).splitlines(keepends=True) if not ln.startswith("Commit:")]
        with open(beta_lic, "w", encoding="utf-8") as fh:
            fh.writelines(lines)
        r = run_sync(pack, base, good, "--check")
        check("--check reports a record missing its Commit line as drift", r.returncode == 1 and "DRIFT  beta" in r.stdout, r.stdout)


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
