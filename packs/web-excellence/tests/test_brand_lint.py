#!/usr/bin/env python3
"""Tests for the brand rules in ci/web-guidelines-lint.mjs.

    python3 packs/web-excellence/tests/test_brand_lint.py

Zero dependencies, same harness as test_hooks.py. Every rule is tested in both
directions: a violating fixture must fire and a clean one must stay quiet. A
rule that only ever proved it fires is half a test; the false positive is what
gets a linter switched off.
"""
from __future__ import annotations

import json
import re
import os
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
LINT = os.path.join(os.path.dirname(HERE), "ci", "web-guidelines-lint.mjs")

failures: list[str] = []


def check(name: str, condition: bool, detail: str = "") -> None:
    if condition:
        print(f"  ok   {name}")
    else:
        print(f"  FAIL {name}" + (f" — {detail}" if detail else ""))
        failures.append(name)


def write(root: str, rel: str, text: str) -> None:
    path = os.path.join(root, *rel.split("/"))
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(text)


def lint(root: str, *argv: str):
    p = subprocess.run(["node", LINT, *argv], cwd=root, capture_output=True,
                       text=True, encoding="utf-8", errors="replace")
    return p.stdout + p.stderr, p.returncode


def git(root: str, *argv: str) -> None:
    subprocess.run(["git", "-C", root, *argv], capture_output=True, check=False)


def git_repo(root: str) -> None:
    git(root, "init", "-q")
    git(root, "config", "user.email", "t@t")
    git(root, "config", "user.name", "t")
    git(root, "config", "core.autocrlf", "false")
    git(root, "add", "-A")
    git(root, "commit", "-qm", "base")
    git(root, "branch", "-M", "main")


def config(root: str, cfg: dict) -> None:
    write(root, ".claude/ci/brand-lint.json", json.dumps(cfg))


# --------------------------------------------------------------- banned-hex
def test_banned_hex() -> None:
    with tempfile.TemporaryDirectory() as d:
        config(d, {"bannedHex": ["#AB47C7", "43bfe3"]})
        write(d, "components/Bad.tsx",
              'export const A = () => <div className="text-[#ab47c7]">x</div>;\n')
        write(d, "styles/bad.css",
              ".hero { background: linear-gradient(90deg, #43BFE3cc, #000); }\n")
        write(d, "components/Ok.tsx",
              'export const B = () => <div className="text-[#ab47c8] bg-[#ab47c7aa1]">x</div>;\n')
        out, rc = lint(d, "components/Bad.tsx", "styles/bad.css", "components/Ok.tsx")
        check("banned hex in a className is an error", "Bad.tsx:1" in out and rc == 1, out)
        check("banned hex inside linear-gradient, any case, with alpha",
              "bad.css:1" in out and "#43BFE3cc" in out, out)
        check("a neighbouring colour and a longer hex run are not matches",
              "Ok.tsx" not in out, out)


def test_banned_hex_is_off_without_config() -> None:
    with tempfile.TemporaryDirectory() as d:
        write(d, "components/A.tsx",
              'export const A = () => <div className="text-[#ab47c7]">x</div>;\n')
        out, rc = lint(d, "components/A.tsx")
        check("no config, no banned colours", "banned" not in out and rc == 0, out)


def test_bad_config_fails_closed() -> None:
    with tempfile.TemporaryDirectory() as d:
        write(d, "components/A.tsx", "export const A = () => null;\n")
        write(d, ".claude/ci/brand-lint.json", "{ bannedHex: [ }")
        out, rc = lint(d, "components/A.tsx")
        check("unparseable config exits 2, never falls back to defaults", rc == 2, out)
        config(d, {"bannedHex": ["purple"]})
        out, rc = lint(d, "components/A.tsx")
        check("a non-hex banned entry exits 2", rc == 2 and "bannedHex" in out, out)


def test_banned_hex_is_a_ratchet() -> None:
    with tempfile.TemporaryDirectory() as d:
        config(d, {"bannedHex": ["#ab47c7"]})
        write(d, "components/Legacy.tsx",
              'export const A = () => <div className="text-[#ab47c7]">old</div>;\n')
        git_repo(d)
        git(d, "checkout", "-qb", "feature")
        write(d, "components/Legacy.tsx",
              'const x = 1;\nexport const A = () => <div className="text-[#ab47c7]">old</div>;\n')
        write(d, "components/New.tsx",
              'export const B = () => <p style={{ color: "#AB47C7" }}>new</p>;\n')
        git(d, "add", "-A")
        git(d, "commit", "-qm", "feature")
        out, rc = lint(d, "--changed", "--base", "main")
        check("ratchet flags a banned colour on an added line", "New.tsx:1" in out and rc == 1, out)
        check("ratchet leaves the pre-existing banned colour alone", "Legacy.tsx" not in out, out)


# ------------------------------------------------------------ gradient-text
def test_gradient_text() -> None:
    with tempfile.TemporaryDirectory() as d:
        write(d, "components/Hero.tsx",
              "export const H = () => (\n"
              "  <h1 className={cn(\n"
              '    "bg-clip-text text-transparent",\n'
              '    "bg-gradient-to-r from-purple-500 to-cyan-400",\n'
              "  )}>Hi</h1>\n"
              ");\n")
        write(d, "styles/title.css",
              ".title {\n"
              "  background: linear-gradient(90deg, red, blue);\n"
              "  -webkit-background-clip: text;\n"
              "  background-clip: text;\n"
              "}\n")
        write(d, "styles/photo.css",
              ".stamp {\n"
              "  background: url(/paper.jpg);\n"
              "  background-clip: text;\n"
              "}\n"
              ".other { background: linear-gradient(red, blue); }\n")
        write(d, "components/Solid.tsx",
              'export const S = () => <h1 className="text-zinc-900">Hi</h1>;\n')
        out, rc = lint(d, "components/Hero.tsx", "styles/title.css",
                       "styles/photo.css", "components/Solid.tsx")
        check("gradient text split across cn() lines is caught", "Hero.tsx:3" in out, out)
        check("gradient text in CSS is reported once per block",
              out.count("title.css:") == 1, out)
        check("gradient text warns by default (exit 0)", rc == 0, out)
        check("image-clipped text is not gradient text, and a gradient in another block "
              "does not count", "photo.css" not in out, out)
        check("solid heading is clean", "Solid.tsx" not in out, out)

        config(d, {"gradientText": "error"})
        out, rc = lint(d, "styles/title.css")
        check("gradientText: error fails the build", rc == 1 and "[error]" in out, out)
        config(d, {"gradientText": "off"})
        out, rc = lint(d, "styles/title.css")
        check("gradientText: off silences the rule", "title.css" not in out and rc == 0, out)


# ------------------------------------------------------------ img-empty-alt
def test_img_empty_alt() -> None:
    with tempfile.TemporaryDirectory() as d:
        write(d, "components/Card.tsx",
              'export const C = () => <img src="/a.png" width={1} height={1} alt="" />;\n')
        write(d, "components/Next.tsx",
              "export const N = () => (\n"
              "  <Image\n"
              '    src="/a.png"\n'
              "    alt={''}\n"
              "    width={10}\n"
              "    height={10}\n"
              "  />\n"
              ");\n")
        write(d, "components/Deco.tsx",
              'export const D = () => <img src="/a.png" width={1} height={1} alt="" aria-hidden="true" />;\n'
              'export const E = () => <Image src="/b.png" alt="" role="presentation" width={1} height={1} />;\n'
              'export const F = () => <img src="/c.png" width={1} height={1} alt="A chart of signups" />;\n')
        out, rc = lint(d, "components/Card.tsx", "components/Next.tsx", "components/Deco.tsx")
        check("img with alt=\"\" and no decorative marker warns", "Card.tsx:1" in out, out)
        check("multi-line next/image with alt={''} warns", "Next.tsx:2" in out, out)
        check("aria-hidden, role=presentation and real alt text are clean",
              "Deco.tsx" not in out, out)
        check("img-empty-alt is a warning, not a build failure", rc == 0, out)


# ------------------------------------------------------- decorative-grid-bg
def test_decorative_grid_bg() -> None:
    with tempfile.TemporaryDirectory() as d:
        write(d, "styles/grid.css",
              ".bg-grid {\n"
              "  background-image:\n"
              "    linear-gradient(to right, rgba(255,255,255,.06) 1px, transparent 1px),\n"
              "    linear-gradient(to bottom, rgba(255,255,255,.06) 1px, transparent 1px);\n"
              "  background-size: 40px 40px;\n"
              "}\n")
        write(d, "components/Grid.tsx",
              'export const G = () => <div className="absolute inset-0 '
              'bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),'
              'linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />;\n')
        write(d, "styles/divider.css",
              ".rule { background: linear-gradient(to right, #ddd 1px, transparent 1px); }\n"
              ".tile { background-size: 40px 40px; }\n")
        write(d, "styles/fade.css",
              ".fade { background: linear-gradient(to bottom, #000, transparent); }\n")
        out, rc = lint(d, "styles/grid.css", "components/Grid.tsx",
                       "styles/divider.css", "styles/fade.css")
        check("two-axis hairline grid in CSS warns once", out.count("grid.css:") == 1, out)
        check("Tailwind arbitrary-value grid warns", "Grid.tsx:1" in out, out)
        check("one hairline and a px cell in different blocks do not add up",
              "divider.css" not in out, out)
        check("a plain fade gradient is not a grid", "fade.css" not in out, out)
        check("decorative-grid-bg is a warning", rc == 0, out)


# ------------------------------------------------------- font-family-budget
def test_font_family_budget() -> None:
    with tempfile.TemporaryDirectory() as d:
        write(d, "app/layout.tsx",
              "import { Inter, Playfair_Display as Serif } from 'next/font/google';\n"
              "import localFont from 'next/font/local';\n"
              "const satoshi = localFont({ src: './Satoshi.woff2' });\n"
              "export default function L() { return null; }\n")
        write(d, "app/globals.css",
              "@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&family=Inter&display=swap');\n"
              "@font-face { font-family: 'Brand Mono'; src: url(/m.woff2); }\n"
              "body { font-family: 'Georgia', serif; }\n")
        write(d, "public/games/index.html",
              '<link href="https://fonts.googleapis.com/css?family=Press+Start+2P" rel="stylesheet">\n')
        write(d, ".claude/skills/x/SKILL.md", "import { Roboto } from 'next/font/google'\n")
        write(d, ".claude/skills/x/example.tsx", "import { Roboto } from 'next/font/google';\n")
        write(d, "components/A.tsx", "export const A = () => null;\n")
        config(d, {"maxFontFamilies": 5, "fontScanIgnore": ["public/games/"]})
        git_repo(d)

        out, rc = lint(d, "components/A.tsx")
        check("five distinct families fit a budget of five (Inter counted once)",
              rc == 0 and "5 families loaded, budget 5" in out, out)
        for name in ("Inter", "Playfair Display", "Satoshi (next/font/local)",
                     "Space Grotesk", "Brand Mono"):
            check(f"budget report lists {name}", f"  {name}:" in out, out)
        check("a font-family declaration that loads nothing is not counted",
              "Georgia" not in out, out)
        check("fontScanIgnore and .claude/ are skipped",
              "Press Start" not in out and "Roboto" not in out, out)

        config(d, {"maxFontFamilies": 4, "fontScanIgnore": ["public/games/"]})
        out, rc = lint(d, "components/A.tsx")
        check("one family over budget fails the build", rc == 1 and "over budget" in out, out)

        config(d, {"maxFontFamilies": 5})
        out, rc = lint(d, "components/A.tsx")
        check("without the ignore the public game font counts too",
              rc == 1 and "Press Start 2P" in out, out)

        os.remove(os.path.join(d, ".claude", "ci", "brand-lint.json"))
        out, rc = lint(d, "components/A.tsx")
        check("no maxFontFamilies, no budget check", "font-family-budget" not in out and rc == 0, out)


# --------------------------------------------- review fixes (Grok, PR #84 @ 712927b)
# One test per defect. Each failed against 712927b and passes now.

def budget_out(files: dict, cfg: dict):
    d = tempfile.mkdtemp()
    try:
        for rel, text in files.items():
            write(d, rel, text)
        write(d, "components/A.tsx", "export const A = () => null;\n")
        config(d, cfg)
        git_repo(d)
        return lint(d, "components/A.tsx")
    finally:
        shutil.rmtree(d, ignore_errors=True)


def test_fix1_comment_inside_next_font_import() -> None:
    out, rc = budget_out({"app/layout.tsx":
        "import {\n  Inter, // primary, body\n  Lora,\n} from 'next/font/google';\n"},
        {"maxFontFamilies": 2})
    check("#1 a comma inside a comment is not a family", rc == 0 and "2 families" in out, out)


def test_fix2_commented_out_font_face() -> None:
    out, rc = budget_out({"app/globals.css":
        "@font-face { font-family: 'Live'; src: url(/a.woff2); }\n"
        "/* @font-face { font-family: 'Dead'; src: url(/b.woff2); } */\n",
        "app/old.tsx": "// import { Roboto } from 'next/font/google';\nexport const X = 1;\n"},
        {"maxFontFamilies": 1})
    check("#2 commented-out @font-face and imports are not loaded fonts",
          rc == 0 and "Dead" not in out and "Roboto" not in out, out)


def test_fix3_local_font_identity_is_the_file() -> None:
    out, rc = budget_out({"app/fonts.ts":
        "import localFont from 'next/font/local';\n"
        "export const font = localFont({ src: [\n"
        "  { path: './Alpha.woff2' },\n  { path: './Beta.woff2' },\n] });\n"},
        {"maxFontFamilies": 1})
    check("#3 one localFont call loading two files is two families",
          rc == 1 and "Alpha (next/font/local)" in out and "Beta (next/font/local)" in out, out)
    out, rc = budget_out({"app/fonts.ts":
        "import localFont from 'next/font/local';\n"
        "export const sans = localFont({ src: [\n"
        "  { path: './Satoshi-Regular.woff2', weight: '400' },\n"
        "  { path: './Satoshi-Bold.woff2', weight: '700' },\n] });\n"},
        {"maxFontFamilies": 1})
    check("#3 weights of one local family count once", rc == 0 and "Satoshi (next/font/local)" in out, out)


def test_fix4_and_5_config_types() -> None:
    with tempfile.TemporaryDirectory() as d:
        write(d, "components/A.tsx", "export const A = () => null;\n")
        for bad, why in (({"bannedHex": None}, "bannedHex null"),
                         ({"bannedHex": "#ab47c7"}, "bannedHex string"),
                         ({"gradientText": None}, "gradientText null"),
                         ({"maxFontFamilies": None}, "maxFontFamilies null"),
                         ({"fontScanIgnore": None}, "fontScanIgnore null"),
                         ({"fontScanIgnore": [""]}, "fontScanIgnore empty prefix"),
                         ({"fontScanIgnore": ["  "]}, "fontScanIgnore blank prefix")):
            config(d, bad)
            out, rc = lint(d, "components/A.tsx")
            check(f"#4/#5 {why} is a malformed config (exit 2)", rc == 2, out)


def test_fix6_short_hex_forms() -> None:
    with tempfile.TemporaryDirectory() as d:
        config(d, {"bannedHex": ["#abc", "#00bbcc"]})
        write(d, "styles/a.css",
              ".a { color: #abcf; }\n.b { color: #AABBCC; }\n.c { color: #aabbcc80; }\n"
              ".d { color: #0bc; }\n.e { color: #abcd12; }\n.f { color: #abd; }\n")
        out, rc = lint(d, "styles/a.css")
        for n, what in ((1, "#abcf (4-digit alpha)"), (2, "#AABBCC (long form)"),
                        (3, "#aabbcc80 (8-digit)"), (4, "#0bc (short form of a 6-digit ban)")):
            check(f"#6 {what} is banned", f"a.css:{n} " in out, out)
        check("#6 a longer or different hex is not banned",
              "a.css:5 " not in out and "a.css:6 " not in out, out)


def test_fix7_gradient_text_is_element_scoped() -> None:
    with tempfile.TemporaryDirectory() as d:
        write(d, "components/Sib.tsx",
              "export const S = () => (\n"
              "  <div>\n"
              '    <div className="bg-gradient-to-b from-black to-transparent" />\n'
              '    <h1 className="bg-clip-text text-transparent bg-[url(/paper.jpg)]">Hi</h1>\n'
              "    {/* gradient was here */}\n"
              "  </div>\n"
              ");\n")
        write(d, "components/V4.tsx",
              'export const V = () => <h1 className="bg-linear-to-r from-sky-400 to-pink-400 '
              'bg-clip-text text-transparent">Hi</h1>;\n')
        write(d, "components/Style.tsx",
              "export const T = () => (\n"
              "  <h1\n"
              "    style={{\n"
              "      backgroundImage: 'radial-gradient(circle, red, blue)',\n"
              "      backgroundClip: 'text',\n"
              "    }}\n"
              "  >Hi</h1>\n"
              ");\n")
        out, rc = lint(d, "components/Sib.tsx", "components/V4.tsx", "components/Style.tsx")
        check("#7 a sibling's fade and a comment do not make clipped text a gradient",
              "Sib.tsx" not in out, out)
        check("#7 Tailwind v4 bg-linear-* gradient text is caught", "V4.tsx:1" in out, out)
        check("#7 gradient set through a style object on the same element is caught",
              "Style.tsx:5" in out, out)


def test_fix8_nested_rule_is_not_the_parent() -> None:
    with tempfile.TemporaryDirectory() as d:
        write(d, "styles/n.scss",
              ".panel {\n"
              "  background-image: linear-gradient(to right, #fff1 1px, transparent 1px),\n"
              "    linear-gradient(to bottom, #fff1 1px, transparent 1px);\n"
              "  .tile { background-size: 24px 24px; }\n"
              "}\n")
        out, rc = lint(d, "styles/n.scss")
        check("#8 a nested rule's background-size does not complete the parent's grid",
              "n.scss" not in out, out)


def test_fix9_sfc_style_blocks_are_css() -> None:
    with tempfile.TemporaryDirectory() as d:
        write(d, "components/Card.vue",
              "<template><h1 class=\"title\">Hi</h1></template>\n"
              "<style scoped>\n"
              ".fade { background: linear-gradient(red, blue); }\n"
              ".title {\n"
              "  background: url(/paper.jpg);\n"
              "  background-clip: text;\n"
              "}\n"
              "</style>\n")
        write(d, "components/Grad.svelte",
              "<h1 class=\"t\">Hi</h1>\n"
              "<style>\n"
              ".t {\n"
              "  background: linear-gradient(90deg, red, blue);\n"
              "  background-clip: text;\n"
              "}\n"
              "</style>\n")
        out, rc = lint(d, "components/Card.vue", "components/Grad.svelte")
        check("#9 a <style> block is scoped per rule, like a .css file", "Card.vue" not in out, out)
        check("#9 gradient text inside a <style> block is still caught", "Grad.svelte:5" in out, out)


def test_fix10_grid_needs_crossing_lines_and_a_square_cell() -> None:
    with tempfile.TemporaryDirectory() as d:
        write(d, "styles/dash.css",
              ".rule {\n"
              "  background: linear-gradient(to right, #ddd 1px, transparent 1px);\n"
              "  background-size: 8px 1px;\n"
              "}\n")
        write(d, "styles/stripes.css",
              ".stripes {\n"
              "  background-image: linear-gradient(#ddd 1px, transparent 1px),\n"
              "    linear-gradient(#eee 1px, transparent 1px);\n"
              "  background-size: 20px 20px;\n"
              "}\n")
        write(d, "styles/rep.css",
              ".g {\n"
              "  background:\n"
              "    repeating-linear-gradient(0deg, #ddd 0 1px, transparent 1px 32px),\n"
              "    repeating-linear-gradient(90deg, #ddd 0 1px, transparent 1px 32px);\n"
              "}\n")
        out, rc = lint(d, "styles/dash.css", "styles/stripes.css", "styles/rep.css")
        check("#10 one hairline on an 8x1 cell (a dashed rule) is not a grid", "dash.css" not in out, out)
        check("#10 two parallel hairlines are stripes, not a grid", "stripes.css" not in out, out)
        check("#10 crossing repeating hairlines are a grid", "rep.css:3" in out, out)


def test_fix11_jsx_expression_role() -> None:
    with tempfile.TemporaryDirectory() as d:
        write(d, "components/D.tsx",
              'export const D = () => <img src="/a.png" width={1} height={1} alt="" role={"presentation"} />;\n'
              "export const E = () => <img src=\"/b.png\" width={1} height={1} alt=\"\" role={'none'} />;\n"
              'export const F = () => <img src="/c.png" width={1} height={1} alt="" aria-hidden={true} />;\n')
        out, rc = lint(d, "components/D.tsx")
        check("#11 role={\"presentation\"}, role={'none'} and aria-hidden={true} are decorative",
              "D.tsx" not in out, out)


def test_fix12_workflow_fires_on_font_sources() -> None:
    wf = open(os.path.join(os.path.dirname(HERE), "ci", "web-excellence.yml"), encoding="utf-8").read()
    src = open(LINT, encoding="utf-8").read()
    exts = re.search(r"const FONT_SCAN_EXT = /\\\.\(([^)]+)\)", src).group(1).split("|")
    missing = [e for e in exts if f"'**/*.{e}'" not in wf]
    check("#12 every extension the font budget reads also triggers the workflow",
          not missing, f"no trigger for {missing}")


# ------------------------------------- round 2 (Grok block on PR #84 @ 12e6b8b)
# One test per finding. Each failed against main at 8f31b8a and passes now.

def test_r2a_gt_inside_a_tag_does_not_widen_the_scope() -> None:
    with tempfile.TemporaryDirectory() as d:
        for name, attr in (("Title", 'title="score > 90" '), ("Variant", 'className="[&>em]:italic" ')):
            write(d, f"components/{name}.tsx",
                  f"export function {name}() {{\n"
                  "  return (\n"
                  "    <div>\n"
                  '      <div className="bg-gradient-to-b from-black to-transparent" />\n'
                  f'      <h1 {attr}data-x="1"\n'
                  '        className="bg-clip-text text-transparent bg-[url(/paper.jpg)]">Hi</h1>\n'
                  "    </div>\n"
                  "  );\n"
                  "}\n")
        write(d, "components/Own.tsx",
              "export function Own() {\n"
              '  return <h1 className="[&>em]:italic bg-clip-text text-transparent '
              'bg-gradient-to-r from-sky-400 to-pink-400">Hi</h1>;\n'
              "}\n")
        write(d, "components/Body.tsx",
              "export function body() {\n"
              '  const clip = "bg-clip-text text-transparent";\n'
              '  const fade = "bg-gradient-to-r from-black";\n'
              "  return [clip, fade];\n"
              "}\n")
        out, rc = lint(d, "components/Title.tsx", "components/Variant.tsx",
                       "components/Own.tsx", "components/Body.tsx")
        check("r2a a '>' in a title attribute does not let a sibling gradient count",
              "Title.tsx" not in out, out)
        check("r2a a '>' in an arbitrary variant does not let a sibling gradient count",
              "Variant.tsx" not in out, out)
        check("r2a gradient text on the element itself is still caught past a '>'",
              "Own.tsx:2" in out, out)
        check("r2a a function body is not a CSS-in-JS scope", "Body.tsx" not in out, out)


def test_r2b_banned_hex_ignores_comments() -> None:
    with tempfile.TemporaryDirectory() as d:
        config(d, {"bannedHex": ["#ab47c7"]})
        write(d, "components/C.tsx",
              "export const C = () => (\n"
              "  <div>\n"
              "    {/* old accent #ab47c7 */}\n"
              '    <p className="text-[#ab47c7]">x</p>\n'
              "  </div>\n"
              ");\n")
        write(d, "styles/c.css",
              ".a { color: var(--accent); } /* was #ab47c7 */\n"
              ".b { color: #ab47c7; }\n")
        out, rc = lint(d, "components/C.tsx", "styles/c.css")
        check("r2b a banned colour inside a JSX comment is not a use", "C.tsx:3" not in out, out)
        check("r2b a banned colour in a trailing CSS comment is not a use", "c.css:1 " not in out, out)
        check("r2b a real use next to the comments is still an error",
              "C.tsx:4" in out and "c.css:2 " in out and rc == 1, out)


def test_r2c_local_font_default_import_name() -> None:
    out, rc = budget_out({"app/fonts.ts":
        "import font from 'next/font/local';\n"
        "export const display = font({ src: [\n"
        "  { path: './Alpha.woff2' },\n  { path: './Beta.woff2' },\n] });\n"},
        {"maxFontFamilies": 1})
    check("r2c next/font/local under any default-import name is counted",
          rc == 1 and "Alpha (next/font/local)" in out and "Beta (next/font/local)" in out, out)


def test_r2d_scss_line_comments() -> None:
    out, rc = budget_out({"styles/fonts.scss":
        "@font-face { font-family: 'Live'; src: url(/a.woff2); }\n"
        "// @font-face { font-family: 'Ghost'; src: url(/g.woff2); }\n"
        "@import url(//fonts.googleapis.com/css2?family=Lora&display=swap);\n"},
        {"maxFontFamilies": 2})
    check("r2d a // comment in .scss loads no font", rc == 0 and "Ghost" not in out, out)
    check("r2d an unquoted url(//…) in .scss is not a comment", "  Lora:" in out, out)


def test_r2e_weight_suffix_needs_a_boundary() -> None:
    out, rc = budget_out({"app/fonts.ts":
        "import localFont from 'next/font/local';\n"
        "export const a = localFont({ src: [\n"
        "  { path: './Highlight-Regular.woff2' },\n  { path: './High-Bold.woff2' },\n] });\n"},
        {"maxFontFamilies": 1})
    check("r2e Highlight and High are two families, not one",
          rc == 1 and "Highlight (next/font/local)" in out and "High (next/font/local)" in out, out)
    out, rc = budget_out({"app/fonts.ts":
        "import localFont from 'next/font/local';\n"
        "export const a = localFont({ src: [\n"
        "  { path: './InterVariable.woff2' },\n  { path: './Inter-ExtraLight.woff2' },\n"
        "  { path: './inter_semi-bold_italic.woff2' },\n] });\n"},
        {"maxFontFamilies": 1})
    check("r2e camelCase, hyphen and underscore weights still fold into one family",
          rc == 0 and "Inter (next/font/local)" in out, out)


def test_r2f_unknown_config_key_is_malformed() -> None:
    with tempfile.TemporaryDirectory() as d:
        write(d, "components/A.tsx", "export const A = () => null;\n")
        config(d, {"maxfontFamilies": 1})
        out, rc = lint(d, "components/A.tsx")
        check("r2f a misspelt key exits 2 and names the real one",
              rc == 2 and "maxfontFamilies" in out and "maxFontFamilies" in out, out)
        config(d, {"$schema": "./brand-lint.schema.json", "gradientText": "warn"})
        out, rc = lint(d, "components/A.tsx")
        check("r2f a $-prefixed metadata key is allowed", rc == 0, out)


def test_r2g_gt_inside_a_prop_does_not_end_the_tag() -> None:
    with tempfile.TemporaryDirectory() as d:
        write(d, "components/Img.tsx",
              'export const A = () => <img src="/a.png" width={1} height={1} alt="" '
              "className=\"[&>svg]:hidden\" role={'presentation'} />;\n"
              'export const B = () => <img className="[&>svg]:hidden" src="/b.png" width={1} height={1} alt="Chart" />;\n')
        write(d, "components/Row.tsx",
              "export const R = () => (\n"
              "  <div onClick={() => go()} role=\"button\" tabIndex={0} onKeyDown={k}>x</div>\n"
              ");\n")
        write(d, "components/Bare.tsx",
              'export const B = () => <div className="[&>p]:mt-0" onClick={go}>x</div>;\n')
        out, rc = lint(d, "components/Img.tsx", "components/Row.tsx", "components/Bare.tsx")
        check("r2g role={'presentation'} after a '>' in className is decorative",
              "Img.tsx:1" not in out, out)
        check("r2g width after a '>' in className satisfies img-no-dims", "Img.tsx:2" not in out, out)
        check("r2g a keyboard-accessible div with an arrow-function onClick is clean",
              "Row.tsx" not in out, out)
        check("r2g a bare onClick div past a '>' in className is still an error",
              "Bare.tsx:1" in out and rc == 1, out)


if __name__ == "__main__":
    if not shutil.which("node"):
        print("skip: node not available")
        sys.exit(0)
    print("web-excellence brand lint tests\n")
    for fn in [v for k, v in sorted(globals().items()) if k.startswith("test_")]:
        print(fn.__name__)
        fn()
    print()
    if failures:
        print(f"{len(failures)} check(s) FAILED: {', '.join(failures)}")
        sys.exit(1)
    print("all checks passed")
