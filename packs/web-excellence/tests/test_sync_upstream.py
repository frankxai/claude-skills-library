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
            "skills/alpha/references/UPSTREAM-LICENSE": MIT.replace("Example", "Nested Record Example"),
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
        make_upstream(base, "acme", "fenced-only", {
            "README.md": "# f\n\nTemplate for your own README:\n\n```markdown\n## License\n\nMIT\n```\n",
            "skills/vav/SKILL.md": "vav\n",
        })
        make_upstream(base, "acme", "fenced-decoy", {
            "README.md": "# g\n\n## License\n\nMIT\n\n## Example\n\n```markdown\n## License\n\nGPL-3.0\n```\n",
            "skills/zayin/SKILL.md": "zayin\n",
        })
        make_upstream(base, "acme", "setext-conflict", {
            "LICENSE": MIT,
            "skills/chet/README.md": "chet\n====\n\nLicense\n=======\n\nGPL-3.0 only\n",
            "skills/chet/SKILL.md": "chet\n",
        })
        make_upstream(base, "acme", "setext-only", {
            "README.md": "tet\n===\n\nIntro.\n\nLicense\n-------\n\nMIT\n\nCredits\n-------\n\nnope\n",
            "skills/tet/SKILL.md": "tet\n",
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
        make_upstream(base, "acme", "nested-record", {
            "LICENSE": MIT,
            "skills/yod/SKILL.md": "yod\n",
            "skills/yod/vendor/UPSTREAM-LICENSE": GPL,
        })
        # a/b_c and a_b/c flatten to the same slug; each must get its own clone.
        make_upstream(base, "a", "b_c", {
            "LICENSE": MIT,
            "skills/kaf/SKILL.md": "kaf\n",
        })
        make_upstream(base, "a_b", "c", {
            "LICENSE": MIT,
            "skills/lamed/SKILL.md": "lamed\n",
        })
        make_upstream(base, "acme", "bsd4-file", {
            "LICENSE": bsd3 + ("4. All advertising materials mentioning features or use of this software\n"
                               "   must display the following acknowledgement: This product includes\n"
                               "   software developed by Example.\n"),
            "skills/mem/SKILL.md": "mem\n",
        })
        make_upstream(base, "acme", "readme-upper", {
            "LICENSE": MIT,
            "skills/nun/README.MD": "# nun\n\n## License\n\nGPL-3.0\n",
            "skills/nun/SKILL.md": "nun\n",
        })
        make_upstream(base, "acme", "readme-upper-only", {
            "README.MD": "# samekh\n\n## License\n\nMIT\n\n## Credits\n\nnope\n",
            "skills/samekh/SKILL.md": "samekh\n",
        })
        make_upstream(base, "acme", "fenced-nested", {
            "README.md": "# p\n\nTemplate:\n\n````markdown\nExample:\n```\n## License\n\nMIT\n```\n````\n",
            "skills/pe/SKILL.md": "pe\n",
        })
        make_upstream(base, "acme", "indented-gpl", {
            "LICENSE": MIT,
            "skills/tsadi/README.md": "# t\n\n  ## License\n\nGPL-3.0\n",
            "skills/tsadi/SKILL.md": "tsadi\n",
        })
        make_upstream(base, "acme", "indented-ok", {
            "README.md": "# q\n\n   ## License\n\nMIT\n\n## Credits\n\nnope\n",
            "skills/qof/SKILL.md": "qof\n",
        })
        make_upstream(base, "acme", "code-indented", {
            "README.md": "# r\n\nExample:\n\n    ## License\n\n    MIT\n",
            "skills/resh/SKILL.md": "resh\n",
        })
        make_upstream(base, "acme", "commented-only", {
            "README.md": "# c\n\n<!--\n## License\n\nMIT\n-->\n",
            "skills/shin/SKILL.md": "shin\n",
        })
        make_upstream(base, "acme", "commented-decoy", {
            "README.md": "# d\n\n## License\n\nMIT\n<!-- draft: ## Licence GPL-2.0 -->\n\n<!--\n## License\n\nGPL-3.0\n-->\n\n## Credits\n\nnope\n",
            "skills/tav/SKILL.md": "tav\n",
        })
        outside_dir = os.path.join(tmp, "outside-dir")
        os.makedirs(outside_dir)
        with open(os.path.join(outside_dir, "secret.txt"), "w", encoding="utf-8") as fh:
            fh.write("do not vendor\n")
        make_upstream(base, "acme", "symlink-src", {
            "LICENSE": MIT,
            "skills/.keep": "",
        })
        add_symlink("symlink-src", "skills/waw", outside_dir)
        make_upstream(base, "acme", "symlink-nested", {
            "LICENSE": MIT,
            "skills/heth/SKILL.md": "heth\n",
        })
        add_symlink("symlink-nested", "skills/heth/notes.md", outside)
        make_upstream(base, "acme", "frontmatter-gpl", {
            "LICENSE": MIT,
            "skills/teth/SKILL.md": "---\nname: teth\nlicense: GPL-3.0\n---\nteth\n",
        })
        make_upstream(base, "acme", "frontmatter-nested", {
            "LICENSE": MIT,
            "skills/yodh/SKILL.md": "---\nname: yodh\nlicense: \"MIT\"\n---\nyodh\n",
            "skills/yodh/sub/SKILL.md": "---\nname: sub\nlicense: Apache-2.0\n---\nsub\n",
        })
        make_upstream(base, "acme", "frontmatter-ok", {
            "LICENSE": MIT,
            "skills/kaph/SKILL.md": "---\nname: kaph\nlicense: 'MIT'\n---\nkaph\n",
        })
        make_upstream(base, "acme", "unlicensed-readme", {
            "README.md": "# u\n\n## License\n\nThis project is unlicensed.\n",
            "skills/sampi/SKILL.md": "sampi\n",
        })
        make_upstream(base, "acme", "unlicense-readme", {
            "README.md": "# u\n\n## License\n\nUnlicense\n\n## Credits\n\nnope\n",
            "skills/koppa/SKILL.md": "koppa\n",
        })
        make_upstream(base, "acme", "fence-indented-close", {
            "README.md": "# f\n\n````\n    `````\n## License\n\nMIT\n````\n",
            "skills/digamma/SKILL.md": "digamma\n",
        })
        make_upstream(base, "acme", "commit-line-file", {
            "LICENSE": MIT + "\nCommit: upstream-note\n",
            "skills/heta/SKILL.md": "heta\n",
        })
        make_upstream(base, "acme", "crlf-frontmatter", {
            "LICENSE": MIT,
            "skills/san/SKILL.md": "---\r\nname: san\r\nlicense: GPL-3.0\r\n---\r\nsan\r\n",
        })
        make_upstream(base, "acme", "crlf-readme", {
            "LICENSE": MIT,
            "skills/sho/README.md": "# s\r\n\r\n## License\r\n\r\nGPL-3.0\r\n",
            "skills/sho/SKILL.md": "sho\n",
        })
        make_upstream(base, "acme", "crlf-readme-only", {
            "README.md": "# y\r\n\r\n## License\r\n\r\nMIT\r\n\r\nCredits\r\n-------\r\n\r\nnope\r\n",
            "skills/yot/SKILL.md": "yot\n",
        })
        make_upstream(base, "acme", "setext-indented", {
            "README.md": "# s\n\nExample:\n\n    License\n    =======\n    MIT\n",
            "skills/ash/SKILL.md": "ash\n",
        })
        make_upstream(base, "acme", "setext-indented-ok", {
            "README.md": "# e\n\n   License\n   -------\n\nMIT\n\nCredits\n-------\n\nnope\n",
            "skills/ethel/SKILL.md": "ethel\n",
        })
        make_upstream(base, "acme", "frontmatter-quoted", {
            "LICENSE": MIT,
            "skills/wynn/SKILL.md": "---\nname: wynn\n\"license\": GPL-3.0\n---\nwynn\n",
        })
        make_upstream(base, "acme", "frontmatter-quoted-ok", {
            "LICENSE": MIT,
            "skills/thorn/SKILL.md": "---\nname: thorn\n'license': 'MIT'\n---\nthorn\n",
        })
        make_upstream(base, "acme", "html-block", {
            "README.md": "# h\n\n<script type=\"text/plain\">\n## License\n\nMIT\n</script>\n",
            "skills/az/SKILL.md": "az\n",
        })
        make_upstream(base, "acme", "html-block-decoy", {
            "README.md": "# b\n\n## License\n\nMIT\n\n## Credits\n\n<PRE>\n## License\n\nGPL-3.0\n</PRE>\n\n<style>\n## Licence\n\nGPL-3.0\n</style>\n",
            "skills/buky/SKILL.md": "buky\n",
        })
        make_upstream(base, "acme", "lower-reserved", {
            "LICENSE": MIT,
            "skills/glagoli/SKILL.md": "glagoli\n",
            "skills/glagoli/upstream-license": GPL,
        })
        make_upstream(base, "acme", "seven-hashes", {
            "README.md": "# d\n\n####### License\n\nMIT\n",
            "skills/dobro/SKILL.md": "dobro\n",
        })
        make_upstream(base, "acme", "six-hashes", {
            "README.md": "# y\n\n###### License\n\nMIT\n\n###### Credits\n\nnope\n",
            "skills/yest/SKILL.md": "yest\n",
        })
        sub_repo = make_upstream(base, "acme", "sub", {
            "LICENSE": MIT,
            "SKILL.md": "---\nname: zhivete\n---\nzhivete\n",
        })
        gitlink_repo = make_upstream(base, "acme", "gitlink-src", {
            "LICENSE": MIT,
            "skills/.keep": "",
        })
        subprocess.run(["git", "-C", gitlink_repo, "-c", "protocol.file.allow=always", "submodule", "add", "-q", "file://" + sub_repo, "skills/zhivete"], check=True, capture_output=True)
        git(gitlink_repo, "-c", "user.name=t", "-c", "user.email=t@example.invalid", "commit", "-q", "-m", "gitlink")
        make_upstream(base, "acme", "table-block", {
            "README.md": "# i\n\n<table>\n## License\n\nMIT\n</table>\n",
            "skills/ivan/SKILL.md": "ivan\n",
        })
        make_upstream(base, "acme", "div-decoy", {
            "README.md": "# j\n\n## License\n\nMIT\n\n## Credits\n\n<div>\n## License\nGPL-3.0\n</div>\n\n<?php\n## Licence\n\nGPL-3.0\n?>\n\n<!DOCTYPE html>\n",
            "skills/jer/SKILL.md": "jer\n",
        })
        make_upstream(base, "acme", "badge-then-license", {
            "README.md": "# k\n\n<img src=\"badge.svg\" alt=\"ci\">\n\n## License\n\nMIT\n\n## Credits\n\nnope\n",
            "skills/kako/SKILL.md": "kako\n",
        })
        make_upstream(base, "acme", "badge-swallows-heading", {
            "README.md": "# p\n\n<img src=\"badge.svg\" alt=\"ci\">\n## License\n\nMIT\n",
            "skills/pokoi/SKILL.md": "pokoi\n",
        })
        make_upstream(base, "acme", "big-early-gpl", {
            "LICENSE": "This work is covered by the GNU General Public License.\n" + ("filler text that pads the licence past any pipe buffer\n" * 40000) + MIT,
            "skills/lyudi/SKILL.md": "lyudi\n",
        })
        make_upstream(base, "acme", "apache-notice", {
            "LICENSE": "Apache License\nVersion 2.0, January 2004\n",
            "NOTICE": "Example Product\nCopyright 2026 Example\nThis product includes software developed at Example.\n",
            "skills/myslete/SKILL.md": "myslete\n",
        })
        make_upstream(base, "acme", "notice-reserved", {
            "LICENSE": MIT,
            "skills/nash/SKILL.md": "nash\n",
            "skills/nash/upstream-notice": "not ours\n",
        })
        make_upstream(base, "acme", "json-rider", {
            "LICENSE": MIT + "\nThe Software shall be used for Good, not Evil.\n",
            "skills/on/SKILL.md": "on\n",
        })
        ISC = ("ISC License\n\nCopyright (c) 2026 Example\n\n"
               "Permission to use, copy, modify, and/or distribute this software for any purpose\n"
               "with or without fee is hereby granted, provided that the above copyright notice\n"
               "and this permission notice appear in all copies.\n\n"
               "THE SOFTWARE IS PROVIDED \"AS IS\" AND THE AUTHOR DISCLAIMS ALL WARRANTIES.\n")
        ZERO_BSD = ("Copyright (C) 2026 Example\n\n"
                    "Permission to use, copy, modify, and/or distribute this software for any purpose\n"
                    "with or without fee is hereby granted.\n\n"
                    "THE SOFTWARE IS PROVIDED \"AS IS\" AND THE AUTHOR DISCLAIMS ALL WARRANTIES.\n")
        make_upstream(base, "acme", "autolink-then-license", {
            "README.md": "# s\n\n<https://example.com>\n## License\n\nMIT\n\n## Credits\n\nnope\n",
            "skills/slovo/SKILL.md": "slovo\n",
        })
        make_upstream(base, "acme", "multi-notice", {
            "LICENSE": "Apache License\nVersion 2.0, January 2004\n",
            "NOTICE": "Root Product\nCopyright 2026 Root\n",
            "NOTICE.third-party": "Third-party component X, Copyright 2020 Someone\n",
            "skills/tverdo/NOTICE": "Skill-level attribution for tverdo\n",
            "skills/tverdo/SKILL.md": "tverdo\n",
        })
        make_upstream(base, "acme", "zero-bsd", {
            "LICENSE": ZERO_BSD,
            "skills/uk/SKILL.md": "uk\n",
        })
        make_upstream(base, "acme", "isc-file", {
            "LICENSE": ISC,
            "skills/fert/SKILL.md": "fert\n",
        })
        make_upstream(base, "acme", "compound-readme", {
            "README.md": "# k\n\n## License\n\nMIT AND Apache-2.0\n",
            "skills/kher/SKILL.md": "kher\n",
        })
        make_upstream(base, "acme", "compound-frontmatter", {
            "LICENSE": MIT,
            "skills/tsi/SKILL.md": "---\nname: tsi\nlicense: MIT OR Apache-2.0\n---\ntsi\n",
        })
        make_upstream(base, "acme", "compound-slash", {
            "README.md": "# c\n\n## License\n\nMIT/Apache-2.0\n",
            "skills/cherv/SKILL.md": "cherv\n",
        })
        make_upstream(base, "acme", "url-in-declaration", {
            "README.md": "# u\n\n## License\n\nMIT, see https://spdx.org/licenses/MIT.html\n",
            "skills/sha/SKILL.md": "sha\n",
        })
        make_upstream(base, "acme", "fenced-nested-decoy", {
            "README.md": "# a\n\n## License\n\nMIT\n\n## Example\n\n````markdown\nSay:\n```\n## License\n\nGPL-3.0\n```\n````\n\n~~~\n```\n## Licence\n\nGPL-3.0\n```\n~~~\n",
            "skills/ayin/SKILL.md": "ayin\n",
        })
        # The same ISC text wrapped at a different column: the retention
        # condition's phrase breaks across two lines.
        ISC_WRAPPED = ISC.replace("provided that the above copyright notice\nand", "provided that the above\ncopyright notice and")
        make_upstream(base, "acme", "isc-wrapped", {
            "LICENSE": ISC_WRAPPED,
            "skills/yat/SKILL.md": "yat\n",
        })
        make_upstream(base, "acme", "compound-full", {
            "LICENSE": "Licensed under MIT OR Apache-2.0, at your option.\n\n" + MIT,
            "skills/shta/SKILL.md": "shta\n",
        })
        make_upstream(base, "acme", "compound-with", {
            "LICENSE": "SPDX-License-Identifier: MIT WITH Classpath-exception-2.0\n\n" + MIT,
            "skills/yer/SKILL.md": "yer\n",
        })
        make_upstream(base, "acme", "manifest-gpl", {
            "LICENSE": MIT,
            "skills/yeri/SKILL.md": "yeri\n",
            "skills/yeri/scripts/package.json": '{\n  "name": "yeri-tool",\n  "license": "GPL-3.0"\n}\n',
        })
        make_upstream(base, "acme", "manifest-legacy", {
            "LICENSE": MIT,
            "skills/yu/SKILL.md": "yu\n",
            "skills/yu/package.json": '{"name": "yu", "licenses": [{"type": "Apache-2.0", "url": "https://example.com"}]}\n',
        })
        make_upstream(base, "acme", "manifest-broken", {
            "LICENSE": MIT,
            "skills/ya/SKILL.md": "ya\n",
            "skills/ya/package.json": '{"name": "ya", "license": "GPL-3.0",\n',
        })
        make_upstream(base, "acme", "manifest-ok", {
            "LICENSE": MIT,
            "skills/ye/SKILL.md": "ye\n",
            "skills/ye/package.json": '{"name": "ye", "private": true, "license": "MIT"}\n',
        })
        make_upstream(base, "acme", "bom-frontmatter", {
            "LICENSE": MIT,
            "skills/yus/SKILL.md": "\ufeff---\nname: yus\nlicense: GPL-3.0\n---\nyus\n",
        })
        make_upstream(base, "acme", "trailing-space-frontmatter", {
            "LICENSE": MIT,
            "skills/ksi/SKILL.md": "--- \nname: ksi\nlicense: GPL-3.0\n---  \nksi\n",
        })
        make_upstream(base, "acme", "backtick-info-fence", {
            "LICENSE": MIT,
            "skills/fita/SKILL.md": "fita\n",
            "skills/fita/README.md": "# f\n\n```not a `fence`\n\n## License\n\nGPL-3.0\n",
        })
        make_upstream(base, "acme", "no-skill-md", {
            "LICENSE": MIT,
            "skills/izhitsa/README.md": "A directory that is not a skill.\n",
            "skills/izhitsa/skill.md": "lower-case name, not the file a harness loads\n",
        })
        make_upstream(base, "acme", "empty-skill-md", {
            "LICENSE": MIT,
            "skills/zelo/SKILL.md": "",
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
        check("record has no whitespace-only line", not any(ln.strip() == "" and ln != "" for ln in read(beta_lic).split("\n")), repr(read(beta_lic)))
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
        for label, bad in (("a bare Commit: line", "Commit:"), ("a non-hexadecimal Commit value", "Commit:   not-a-sha")):
            run_sync(pack, base, good)
            tampered = read(beta_lic).replace(f"Commit:   {sha}", bad)
            check(f"{label}: fixture differs from the record", tampered != read(beta_lic) and bad in tampered)
            with open(beta_lic, "w", encoding="utf-8") as fh:
                fh.write(tampered)
            r = run_sync(pack, base, good, "--check")
            check(f"{label} in a record is drift", r.returncode == 1 and "DRIFT  beta" in r.stdout, r.stdout)
        run_sync(pack, base, good)

        # ---- refusals leave the tree untouched ---------------------------------
        def refused(label: str, entries: list[str], needle: str, gate: bool = True) -> None:
            before = read(os.path.join(pack, "skills", "alpha", "SKILL.md"))
            marker = os.path.join(pack, "skills", "alpha", "LOCAL.md")
            with open(marker, "w", encoding="utf-8") as fh:
                fh.write("local\n")
            r = run_sync(pack, base, entries)
            check(f"{label}: exits 1", r.returncode == 1, r.stderr)
            check(f"{label}: names the gate", needle in r.stderr and (not gate or "ABSORPTION.md gate 1" in r.stderr), r.stderr)
            check(f"{label}: alpha untouched", os.path.isfile(marker) and read(os.path.join(pack, "skills", "alpha", "SKILL.md")) == before)
            check(f"{label}: nothing new vendored", not any(os.path.isdir(os.path.join(pack, "skills", d)) for d in ("gamma", "delta", "epsilon", "zeta", "eta", "theta", "mu", "kappa", "lambda", "iota", "omicron", "nu", "xi", "pi", "rho", "sigma", "phi", "chi", "psi", "omega", "alef", "bet", "gimel", "dalet", "vav", "chet", "yod", "mem", "nun", "pe", "tsadi", "resh", "shin", "waw", "heth", "teth", "yodh", "sampi", "digamma", "san", "sho", "ash", "wynn", "az", "glagoli", "dobro", "zhivete", "ivan", "pokoi", "lyudi", "nash", "on", "uk", "kher", "tsi", "cherv", "shta", "yer", "yeri", "yu", "ya", "yus", "ksi", "fita", "izhitsa", "zelo")))
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
        refused("a License heading only inside a code fence is no declaration", good[:1] + ["acme/fenced-only|MIT|skills/vav|vav"], "no README has a License section")
        refused("Setext License heading declaring GPL under an MIT root", good[:1] + ["acme/setext-conflict|MIT|skills/chet|chet"], "skills/chet/README.md License section reads as a refused licence")
        refused("nested vendor/UPSTREAM-LICENSE with GPL inside the skill", good[:1] + ["acme/nested-record|MIT|skills/yod|yod"], "skills/yod/vendor/UPSTREAM-LICENSE reads as a refused licence")
        refused("BSD-4 text with the advertising clause declared BSD-3-Clause", good[:1] + ["acme/bsd4-file|BSD-3-Clause|skills/mem|mem"], "does not read as BSD-3-Clause")
        refused("skill README.MD in upper case declares GPL under an MIT root", good[:1] + ["acme/readme-upper|MIT|skills/nun|nun"], "skills/nun/README.MD License section reads as a refused licence")
        refused("a License heading inside a nested code fence is no declaration", good[:1] + ["acme/fenced-nested|MIT|skills/pe|pe"], "no README has a License section")
        refused("an indented ## License heading declaring GPL under an MIT root", good[:1] + ["acme/indented-gpl|MIT|skills/tsadi|tsadi"], "skills/tsadi/README.md License section reads as a refused licence")
        refused("a four-space-indented License heading is a code block, not a declaration", good[:1] + ["acme/code-indented|MIT|skills/resh|resh"], "no README has a License section")
        refused("a License heading inside an HTML comment is no declaration", good[:1] + ["acme/commented-only|MIT|skills/shin|shin"], "no README has a License section")
        refused("a src that is a symlink", good[:1] + ["acme/symlink-src|MIT|skills/waw|waw"], "is or crosses a symlink", gate=False)
        check("the symlinked src never vendored the outside directory", not os.path.exists(os.path.join(pack, "skills", "waw", "secret.txt")))
        refused("a symlink nested inside the skill", good[:1] + ["acme/symlink-nested|MIT|skills/heth|heth"], "contains a symlink", gate=False)
        refused("SKILL.md frontmatter declaring GPL under an MIT root", good[:1] + ["acme/frontmatter-gpl|MIT|skills/teth|teth"], "skills/teth/SKILL.md frontmatter license reads as a refused licence")
        refused("nested SKILL.md frontmatter declaring Apache-2.0 under MIT", good[:1] + ["acme/frontmatter-nested|MIT|skills/yodh|yodh"], "skills/yodh/sub/SKILL.md frontmatter license does not read as MIT")
        refused("'unlicensed' is not the Unlicense", good[:1] + ["acme/unlicensed-readme|Unlicense|skills/sampi|sampi"], "does not read as Unlicense")
        refused("a closing fence indented four spaces is fence content, not a close", good[:1] + ["acme/fence-indented-close|MIT|skills/digamma|digamma"], "no README has a License section")
        refused("CRLF SKILL.md frontmatter declaring GPL under an MIT root", good[:1] + ["acme/crlf-frontmatter|MIT|skills/san|san"], "skills/san/SKILL.md frontmatter license reads as a refused licence")
        refused("CRLF skill README declaring GPL under an MIT root", good[:1] + ["acme/crlf-readme|MIT|skills/sho|sho"], "skills/sho/README.md License section reads as a refused licence")
        refused("a four-space-indented Setext License block is code, not a declaration", good[:1] + ["acme/setext-indented|MIT|skills/ash|ash"], "no README has a License section")
        refused("a double-quoted frontmatter license key declaring GPL under an MIT root", good[:1] + ["acme/frontmatter-quoted|MIT|skills/wynn|wynn"], "skills/wynn/SKILL.md frontmatter license reads as a refused licence")
        refused("a License heading inside a raw HTML block is no declaration", good[:1] + ["acme/html-block|MIT|skills/az|az"], "no README has a License section")
        refused("a lower-case upstream-license at the skill root is the reserved name", good[:1] + ["acme/lower-reserved|MIT|skills/glagoli|glagoli"], "reserves")
        refused("seven hashes is prose, not a heading", good[:1] + ["acme/seven-hashes|MIT|skills/dobro|dobro"], "no README has a License section")
        refused("a submodule gitlink as src", good[:1] + ["acme/gitlink-src|MIT|skills/zhivete|zhivete"], "submodule gitlink", gate=False)
        refused("a License heading inside a <table> block is no declaration", good[:1] + ["acme/table-block|MIT|skills/ivan|ivan"], "no README has a License section")
        refused("a heading on the line after a badge is swallowed by the HTML block", good[:1] + ["acme/badge-swallows-heading|MIT|skills/pokoi|pokoi"], "no README has a License section")
        refused("an early GPL marker in a licence larger than a pipe buffer", good[:1] + ["acme/big-early-gpl|MIT|skills/lyudi|lyudi"], "refused licence")
        refused("upstream ships upstream-notice at the skill root", good[:1] + ["acme/notice-reserved|MIT|skills/nash|nash"], "reserves")
        refused("the JSON licence rider on MIT text", good[:1] + ["acme/json-rider|MIT|skills/on|on"], "use restriction on top of its grant")
        refused("0BSD text declared ISC", good[:1] + ["acme/zero-bsd|ISC|skills/uk|uk"], "does not read as ISC")
        refused("a compound expression in a README declaration", good[:1] + ["acme/compound-readme|MIT|skills/kher|kher"], "compound licence expression")
        refused("a compound expression in SKILL.md frontmatter", good[:1] + ["acme/compound-frontmatter|MIT|skills/tsi|tsi"], "compound licence expression")
        refused("a slash-joined pair of licences in a README declaration", good[:1] + ["acme/compound-slash|MIT|skills/cherv|cherv"], "compound licence expression")
        refused("a compound expression above a full MIT text", good[:1] + ["acme/compound-full|MIT|skills/shta|shta"], "compound licence expression alongside its grant")
        refused("a WITH exception above a full MIT text", good[:1] + ["acme/compound-with|MIT|skills/yer|yer"], "compound licence expression alongside its grant")
        refused("a nested package.json declaring GPL under an MIT root", good[:1] + ["acme/manifest-gpl|MIT|skills/yeri|yeri"], "skills/yeri/scripts/package.json license field reads as a refused licence")
        refused("a legacy licenses array declaring Apache-2.0 under MIT", good[:1] + ["acme/manifest-legacy|MIT|skills/yu|yu"], "skills/yu/package.json license field does not read as MIT")
        refused("a package.json that is not JSON", good[:1] + ["acme/manifest-broken|MIT|skills/ya|ya"], "cannot be read as a manifest")
        refused("SKILL.md frontmatter behind a byte-order mark declaring GPL", good[:1] + ["acme/bom-frontmatter|MIT|skills/yus|yus"], "skills/yus/SKILL.md frontmatter license reads as a refused licence")
        refused("SKILL.md frontmatter delimiters with trailing blanks declaring GPL", good[:1] + ["acme/trailing-space-frontmatter|MIT|skills/ksi|ksi"], "skills/ksi/SKILL.md frontmatter license reads as a refused licence")
        refused("a backtick run with a backtick in its info string is not a fence", good[:1] + ["acme/backtick-info-fence|MIT|skills/fita|fita"], "skills/fita/README.md License section reads as a refused licence")
        refused("a src with no SKILL.md at its root", good[:1] + ["acme/no-skill-md|MIT|skills/izhitsa|izhitsa"], "has no SKILL.md at its root", gate=False)
        refused("a src whose SKILL.md is empty", good[:1] + ["acme/empty-skill-md|MIT|skills/zelo|zelo"], "has no SKILL.md at its root", gate=False)

        # ---- a refused run leaves nothing in TMPDIR -----------------------------
        tmpdir_probe = os.path.join(tmp, "probe-tmp")
        os.makedirs(tmpdir_probe)
        env_probe = dict(os.environ)
        env_probe["TMPDIR"] = tmpdir_probe
        env_probe["WEB_EXCELLENCE_UPSTREAM_BASE"] = "file://" + base
        env_probe["WEB_EXCELLENCE_UPSTREAM_FILE"] = os.path.join(tmp, "does-not-exist.txt")
        r = subprocess.run(["bash", os.path.join(pack, "sync-upstream.sh")], capture_output=True, text=True, env=env_probe)
        check("refused override still exits 2", r.returncode == 2, r.stderr)
        check("refused override leaves no work directory behind", os.listdir(tmpdir_probe) == [], str(os.listdir(tmpdir_probe)))
        bad_row = os.path.join(tmp, "bad-row.txt")
        with open(bad_row, "w", encoding="utf-8") as fh:
            fh.write("acme/with-file|MIT|skills/alpha|\n")
        env_probe["WEB_EXCELLENCE_UPSTREAM_FILE"] = bad_row
        r = subprocess.run(["bash", os.path.join(pack, "sync-upstream.sh")], capture_output=True, text=True, env=env_probe)
        check("malformed row still exits 2", r.returncode == 2, r.stderr)
        check("malformed row leaves no work directory behind", os.listdir(tmpdir_probe) == [], str(os.listdir(tmpdir_probe)))

        # ---- malformed override rows never reach pass 2 -------------------------
        p3 = make_pack(os.path.join(tmp, "p3"))
        os.makedirs(os.path.join(p3, "skills", "keep"))
        with open(os.path.join(p3, "skills", "keep", "SKILL.md"), "w", encoding="utf-8") as fh:
            fh.write("keep\n")
        os.makedirs(os.path.join(p3, "skills", "core-web-vitals"))
        with open(os.path.join(p3, "skills", "core-web-vitals", "SKILL.md"), "w", encoding="utf-8") as fh:
            fh.write("native\n")
        for label, row in (
            ("three fields", "acme/with-file|MIT|skills/alpha"),
            ("empty dest", "acme/with-file|MIT|skills/alpha|"),
            ("traversing dest", "acme/with-file|MIT|skills/alpha|../escape"),
            ("dest with slash", "acme/with-file|MIT|skills/alpha|a/b"),
            ("traversing src", "acme/with-file|MIT|../etc|alpha"),
            ("five fields", "acme/with-file|MIT|skills/alpha|alpha|extra"),
            ("native dest", "acme/with-file|MIT|skills/alpha|core-web-vitals"),
            ("root src", "acme/with-file|MIT|.|rootskill"),
            ("src under .git", "acme/with-file|MIT|.git/info|gitskill"),
            ("src under .GIT in upper case", "acme/with-file|MIT|.GIT/info|gitskill"),
            ("src with a . component", "acme/with-file|MIT|skills/./alpha|dotskill"),
            ("native dest in another case", "acme/with-file|MIT|skills/alpha|Core-Web-Vitals"),
        ):
            r = run_sync(p3, base, [row])
            check(f"override row with {label} exits 2", r.returncode == 2, r.stderr)
        r = run_sync(p3, base, ["acme/with-file|MIT|skills/alpha|same", "acme/readme-only|MIT|skills/beta|same"])
        check("two rows with one dest exit 2", r.returncode == 2 and "twice" in r.stderr, r.stderr)
        r = run_sync(p3, base, ["acme/with-file|MIT|skills/alpha|same", "acme/readme-only|MIT|skills/beta|SAME"])
        check("two rows whose dests differ only in case exit 2", r.returncode == 2 and "twice" in r.stderr, r.stderr)
        check("no row with a case-variant dest vendored anything", not os.path.isdir(os.path.join(p3, "skills", "SAME")) and not os.path.isdir(os.path.join(p3, "skills", "Core-Web-Vitals")))
        check("malformed rows left the existing skills tree untouched", os.path.isfile(os.path.join(p3, "skills", "keep", "SKILL.md")))
        check("the native skill named as a dest is untouched", read(os.path.join(p3, "skills", "core-web-vitals", "SKILL.md")) == "native\n")
        check("no row with a native or duplicate dest vendored anything", not os.path.isdir(os.path.join(p3, "skills", "same")) and not os.path.isdir(os.path.join(p3, "skills", "alpha")))
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
        r = run_sync(pack, base, good[:1] + ["acme/fenced-decoy|MIT|skills/zayin|zayin"])
        check("a GPL example inside a code fence does not poison a real MIT declaration", r.returncode == 0 and os.path.isfile(os.path.join(pack, "skills", "zayin", "UPSTREAM-LICENSE")), r.stderr)
        r = run_sync(pack, base, good[:1] + ["acme/setext-only|MIT|skills/tet|tet"])
        tet_lic = os.path.join(pack, "skills", "tet", "UPSTREAM-LICENSE")
        check("Setext License heading with MIT vendors", r.returncode == 0 and os.path.isfile(tet_lic), r.stderr)
        check("Setext record quotes MIT and stops at the next same-level heading", os.path.isfile(tet_lic) and "\n    MIT\n" in read(tet_lic) and "nope" not in read(tet_lic))
        r = run_sync(pack, base, good[:1] + ["acme/nested-mit|MIT|skills/he|he"])
        he_lic = os.path.join(pack, "skills", "he", "UPSTREAM-LICENSE")
        check("nested MIT licence and nested README under an MIT root vendor", r.returncode == 0 and os.path.isfile(he_lic), r.stderr)
        check("the root licence, not the nested one, is recorded", os.path.isfile(he_lic) and read(he_lic) == MIT)
        r = run_sync(pack, base, good[:1] + ["acme/bare-file|MIT|skills/upsilon|upsilon"])
        check("a LICENSE file that is a bare declaration vendors", r.returncode == 0 and os.path.isfile(os.path.join(pack, "skills", "upsilon", "UPSTREAM-LICENSE")), r.stderr)
        r = run_sync(pack, base, ["a/b_c|MIT|skills/kaf|kaf", "a_b/c|MIT|skills/lamed|lamed"])
        check("repos whose names flatten to one slug each vendor from their own clone", r.returncode == 0 and read(os.path.join(pack, "skills", "kaf", "SKILL.md")) == "kaf\n" and read(os.path.join(pack, "skills", "lamed", "SKILL.md")) == "lamed\n", r.stderr)
        check("both pins recorded", "a/b_c" in read(os.path.join(pack, "SOURCES.md")) and "a_b/c" in read(os.path.join(pack, "SOURCES.md")))
        r = run_sync(pack, base, good[:1] + ["acme/readme-upper-only|MIT|skills/samekh|samekh"])
        samekh_lic = os.path.join(pack, "skills", "samekh", "UPSTREAM-LICENSE")
        check("an upper-case README.MD declaration is found and recorded", r.returncode == 0 and os.path.isfile(samekh_lic) and "\n    MIT\n" in read(samekh_lic) and "nope" not in read(samekh_lic), r.stderr)
        r = run_sync(pack, base, good[:1] + ["acme/indented-ok|MIT|skills/qof|qof"])
        qof_lic = os.path.join(pack, "skills", "qof", "UPSTREAM-LICENSE")
        check("a License heading indented up to three spaces is a heading", r.returncode == 0 and os.path.isfile(qof_lic) and "\n    MIT\n" in read(qof_lic) and "nope" not in read(qof_lic), r.stderr)
        r = run_sync(pack, base, good[:1] + ["acme/commented-decoy|MIT|skills/tav|tav"])
        tav_lic = os.path.join(pack, "skills", "tav", "UPSTREAM-LICENSE")
        check("HTML comments inside and after the License section are neither headings nor declaration text", r.returncode == 0 and os.path.isfile(tav_lic) and "GPL" not in read(tav_lic) and "nope" not in read(tav_lic), r.stderr)
        r = run_sync(pack, base, good[:1] + ["acme/unlicense-readme|Unlicense|skills/koppa|koppa"])
        koppa_lic = os.path.join(pack, "skills", "koppa", "UPSTREAM-LICENSE")
        check("a README declaring Unlicense vendors as Unlicense", r.returncode == 0 and os.path.isfile(koppa_lic) and "\n    Unlicense\n" in read(koppa_lic), r.stderr)
        r = run_sync(pack, base, good[:1] + ["acme/crlf-readme-only|MIT|skills/yot|yot"])
        yot_lic = os.path.join(pack, "skills", "yot", "UPSTREAM-LICENSE")
        check("a CRLF README declaration is found, recorded and stops at the next heading", r.returncode == 0 and os.path.isfile(yot_lic) and "\n    MIT\n" in read(yot_lic) and "nope" not in read(yot_lic), r.stderr)
        heta_entries = good[:1] + ["acme/commit-line-file|MIT|skills/heta|heta"]
        r = run_sync(pack, base, heta_entries)
        heta_lic = os.path.join(pack, "skills", "heta", "UPSTREAM-LICENSE")
        check("a raw LICENSE containing a Commit: line vendors verbatim", r.returncode == 0 and os.path.isfile(heta_lic) and "Commit: upstream-note" in read(heta_lic), r.stderr)
        with open(heta_lic, "w", encoding="utf-8") as fh:
            fh.write(MIT + "\nCommit: tampered\n")
        r = run_sync(pack, base, heta_entries, "--check")
        check("a changed Commit: line in a raw LICENSE record is drift", r.returncode == 1 and "DRIFT  heta" in r.stdout, r.stdout)
        r = run_sync(pack, base, good[:1] + ["acme/setext-indented-ok|MIT|skills/ethel|ethel"])
        ethel_lic = os.path.join(pack, "skills", "ethel", "UPSTREAM-LICENSE")
        check("a Setext heading indented three spaces is a heading", r.returncode == 0 and os.path.isfile(ethel_lic) and "\n    MIT\n" in read(ethel_lic) and "nope" not in read(ethel_lic), r.stderr)
        r = run_sync(pack, base, good[:1] + ["acme/frontmatter-quoted-ok|MIT|skills/thorn|thorn"])
        check("a single-quoted frontmatter license key agreeing with the root vendors", r.returncode == 0 and os.path.isfile(os.path.join(pack, "skills", "thorn", "UPSTREAM-LICENSE")), r.stderr)
        r = run_sync(pack, base, good[:1] + ["acme/html-block-decoy|MIT|skills/buky|buky"])
        buky_lic = os.path.join(pack, "skills", "buky", "UPSTREAM-LICENSE")
        check("headings inside raw HTML blocks after the License section neither reopen it nor poison it", r.returncode == 0 and os.path.isfile(buky_lic) and "GPL" not in read(buky_lic), r.stderr)
        r = run_sync(pack, base, good[:1] + ["acme/six-hashes|MIT|skills/yest|yest"])
        yest_lic = os.path.join(pack, "skills", "yest", "UPSTREAM-LICENSE")
        check("six hashes is still a heading", r.returncode == 0 and os.path.isfile(yest_lic) and "\n    MIT\n" in read(yest_lic) and "nope" not in read(yest_lic), r.stderr)
        r = run_sync(pack, base, good[:1] + ["acme/div-decoy|MIT|skills/jer|jer"])
        jer_lic = os.path.join(pack, "skills", "jer", "UPSTREAM-LICENSE")
        check("headings inside <div>, <?php and <!DOCTYPE blocks are neither headings nor declaration text", r.returncode == 0 and os.path.isfile(jer_lic) and "GPL" not in read(jer_lic), r.stderr)
        r = run_sync(pack, base, good[:1] + ["acme/badge-then-license|MIT|skills/kako|kako"])
        kako_lic = os.path.join(pack, "skills", "kako", "UPSTREAM-LICENSE")
        check("a badge line followed by a blank line does not swallow the License heading", r.returncode == 0 and os.path.isfile(kako_lic) and "\n    MIT\n" in read(kako_lic) and "nope" not in read(kako_lic), r.stderr)
        notice_entries = good[:1] + ["acme/apache-notice|Apache-2.0|skills/myslete|myslete"]
        r = run_sync(pack, base, notice_entries)
        myslete_notice = os.path.join(pack, "skills", "myslete", "UPSTREAM-NOTICE")
        check("an upstream NOTICE is carried as UPSTREAM-NOTICE", r.returncode == 0 and os.path.isfile(myslete_notice) and read(myslete_notice).startswith("Example Product"), r.stderr)
        r = run_sync(pack, base, notice_entries, "--check")
        check("--check is clean with the carried NOTICE", r.returncode == 0, r.stdout)
        with open(myslete_notice, "a", encoding="utf-8") as fh:
            fh.write("edited\n")
        r = run_sync(pack, base, notice_entries, "--check")
        check("--check reports an edited UPSTREAM-NOTICE as drift", r.returncode == 1 and "DRIFT  myslete" in r.stdout and "UPSTREAM-NOTICE" in r.stdout, r.stdout)
        os.remove(myslete_notice)
        r = run_sync(pack, base, notice_entries, "--check")
        check("--check reports a missing UPSTREAM-NOTICE as drift", r.returncode == 1 and "DRIFT  myslete" in r.stdout, r.stdout)
        run_sync(pack, base, notice_entries)
        with open(os.path.join(pack, "skills", "alpha", "UPSTREAM-NOTICE"), "w", encoding="utf-8") as fh:
            fh.write("stray\n")
        r = run_sync(pack, base, notice_entries, "--check")
        check("--check reports an UPSTREAM-NOTICE the upstream does not have as drift", r.returncode == 1 and "DRIFT  alpha" in r.stdout, r.stdout)
        os.remove(os.path.join(pack, "skills", "alpha", "UPSTREAM-NOTICE"))
        r = run_sync(pack, base, notice_entries, "--check")
        check("--check is clean again without the stray notice", r.returncode == 0, r.stdout)
        r = run_sync(pack, base, good[:1] + ["acme/autolink-then-license|MIT|skills/slovo|slovo"])
        slovo_lic = os.path.join(pack, "skills", "slovo", "UPSTREAM-LICENSE")
        check("an autolink is not an HTML block and does not swallow the heading after it", r.returncode == 0 and os.path.isfile(slovo_lic) and "\n    MIT\n" in read(slovo_lic) and "nope" not in read(slovo_lic), r.stderr)
        r = run_sync(pack, base, good[:1] + ["acme/isc-file|ISC|skills/fert|fert"])
        check("ISC text with its retention condition vendors as ISC", r.returncode == 0 and os.path.isfile(os.path.join(pack, "skills", "fert", "UPSTREAM-LICENSE")), r.stderr)
        check("the wrapped ISC fixture breaks the phrase across lines", "the above\ncopyright notice" in ISC_WRAPPED)
        r = run_sync(pack, base, good[:1] + ["acme/isc-wrapped|ISC|skills/yat|yat"])
        check("ISC text whose retention condition wraps across lines vendors as ISC", r.returncode == 0 and os.path.isfile(os.path.join(pack, "skills", "yat", "UPSTREAM-LICENSE")), r.stderr)
        r = run_sync(pack, base, good[:1] + ["acme/manifest-ok|MIT|skills/ye|ye"])
        check("a package.json declaring the same licence vendors", r.returncode == 0 and os.path.isfile(os.path.join(pack, "skills", "ye", "UPSTREAM-LICENSE")), r.stderr)
        r = run_sync(pack, base, good[:1] + ["acme/url-in-declaration|MIT|skills/sha|sha"])
        check("a URL beside a declaration is not a slash-joined licence pair", r.returncode == 0 and os.path.isfile(os.path.join(pack, "skills", "sha", "UPSTREAM-LICENSE")), r.stderr)
        multi_entries = good[:1] + ["acme/multi-notice|Apache-2.0|skills/tverdo|tverdo"]
        r = run_sync(pack, base, multi_entries)
        tverdo_notice = os.path.join(pack, "skills", "tverdo", "UPSTREAM-NOTICE")
        body = read(tverdo_notice) if os.path.isfile(tverdo_notice) else ""
        expected_order = ["---- skills/tverdo/NOTICE ----", "Skill-level attribution", "---- NOTICE ----", "Root Product", "---- NOTICE.third-party ----", "Third-party component X"]
        positions = [body.find(marker) for marker in expected_order]
        check("several NOTICE files are all carried, skill first, each under its path", r.returncode == 0 and all(pos >= 0 for pos in positions) and positions == sorted(positions), r.stderr + body)
        r = run_sync(pack, base, multi_entries, "--check")
        check("--check is clean with a concatenated NOTICE record", r.returncode == 0, r.stdout)
        r = run_sync(pack, base, good[:1] + ["acme/frontmatter-ok|MIT|skills/kaph|kaph"])
        check("SKILL.md frontmatter declaring the same licence vendors", r.returncode == 0 and os.path.isfile(os.path.join(pack, "skills", "kaph", "UPSTREAM-LICENSE")), r.stderr)
        r = run_sync(pack, base, good[:1] + ["acme/fenced-nested-decoy|MIT|skills/ayin|ayin"])
        check("an inner fence does not close the outer one; nested GPL examples do not poison a real MIT declaration", r.returncode == 0 and os.path.isfile(os.path.join(pack, "skills", "ayin", "UPSTREAM-LICENSE")), r.stderr)

        # ---- a symlinked vendored tree is not self-contained ---------------------
        run_sync(pack, base, good)
        alpha_dir = os.path.join(pack, "skills", "alpha")
        moved_alpha = os.path.join(tmp, "alpha-moved")
        shutil.move(alpha_dir, moved_alpha)
        os.symlink(moved_alpha, alpha_dir)
        r = run_sync(pack, base, good, "--check")
        check("--check reports a symlinked skill root as drift", r.returncode == 1 and "DRIFT  alpha" in r.stdout and "symlink" in r.stdout, r.stdout)
        os.remove(alpha_dir)
        shutil.move(moved_alpha, alpha_dir)
        os.symlink(os.path.join(alpha_dir, "SKILL.md"), os.path.join(alpha_dir, "link.md"))
        r = run_sync(pack, base, good, "--check")
        check("--check reports a symlink nested in the vendored tree as drift", r.returncode == 1 and "DRIFT  alpha" in r.stdout and "symlink" in r.stdout, r.stdout)
        os.remove(os.path.join(alpha_dir, "link.md"))
        r = run_sync(pack, base, good, "--check")
        check("--check is clean again once the tree is real", r.returncode == 0, r.stdout)

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
