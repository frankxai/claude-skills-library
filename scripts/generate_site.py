#!/usr/bin/env python3
"""Generate the GitHub Pages catalog site (docs/index.html).

A single, self-contained, zero-build HTML page with the full skill catalog
embedded as JSON and client-side search + category filtering. Reuses the skill
collection and categorisation from generate_catalog.py so the site, the
Markdown catalog, and the validator never disagree. Run:

    python3 scripts/generate_site.py
"""
from __future__ import annotations

import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from generate_catalog import CATEGORIES, categorize, collect  # noqa: E402

HERE = os.path.dirname(__file__)
OUT = os.path.normpath(os.path.join(HERE, "..", "docs", "index.html"))
REPO_URL = "https://github.com/frankxai/claude-skills-library"


def build_data() -> list[dict]:
    skills = collect()
    rows = []
    for name, (rel, desc) in sorted(skills.items()):
        rows.append({
            "name": name,
            "desc": " ".join(desc.split()),
            "cat": categorize(name),
            "url": f"{REPO_URL}/blob/main/{rel}",
            "path": rel.replace("/SKILL.md", ""),
        })
    return rows


def main() -> int:
    data = build_data()
    cats = [c[0] for c in CATEGORIES]
    cats = [c for c in cats if any(r["cat"] == c for r in data)]
    if any(r["cat"] == "Other" for r in data):
        cats.append("Other")
    # Safe to embed in a <script> tag: only `<` needs neutralising so the JSON
    # cannot break out via `</script>`. `&` must stay literal or category names
    # with ampersands won't match the filter buttons.
    payload = json.dumps(data).replace("<", "\\u003c")

    page = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Claude Skills Library — {len(data)} Agent Skills</title>
<meta name="description" content="{len(data)} production-grade, MIT-licensed Agent Skills for Claude Code and every major agentic runtime.">
<style>
  :root {{
    --bg:#0b0d12; --panel:#13161f; --panel2:#191d28; --line:#262b3a;
    --text:#e8ecf4; --muted:#9aa3b8; --accent:#7c8cff; --accent2:#49e0c5;
  }}
  *{{box-sizing:border-box}}
  body{{margin:0;background:radial-gradient(1200px 600px at 50% -200px,#1b2030,var(--bg));
    color:var(--text);font:16px/1.55 ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial}}
  a{{color:var(--accent);text-decoration:none}} a:hover{{text-decoration:underline}}
  .wrap{{max-width:1080px;margin:0 auto;padding:48px 20px 80px}}
  header{{text-align:center;margin-bottom:34px}}
  h1{{font-size:40px;margin:0 0 6px;letter-spacing:-.02em}}
  .tag{{color:var(--muted);font-size:18px;margin:0 0 20px}}
  .pills{{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-bottom:8px}}
  .pill{{background:var(--panel);border:1px solid var(--line);border-radius:999px;
    padding:6px 14px;color:var(--muted);font-size:14px}}
  .pill b{{color:var(--text)}}
  .install{{background:var(--panel);border:1px solid var(--line);border-radius:12px;
    padding:14px 16px;margin:22px auto 0;max-width:680px;text-align:left}}
  .install code{{display:block;color:var(--accent2);font:14px/1.7 ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre-wrap}}
  .controls{{position:sticky;top:0;background:linear-gradient(var(--bg),rgba(11,13,18,.86));
    backdrop-filter:blur(6px);padding:16px 0;z-index:5;margin-bottom:8px}}
  #q{{width:100%;padding:14px 16px;border-radius:12px;border:1px solid var(--line);
    background:var(--panel2);color:var(--text);font-size:16px;outline:none}}
  #q:focus{{border-color:var(--accent)}}
  .cats{{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}}
  .cat{{cursor:pointer;border:1px solid var(--line);background:var(--panel);color:var(--muted);
    border-radius:999px;padding:6px 13px;font-size:13.5px;user-select:none}}
  .cat.active{{background:var(--accent);border-color:var(--accent);color:#0b0d12;font-weight:600}}
  .count{{color:var(--muted);font-size:14px;margin:6px 2px 14px}}
  .grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px}}
  .card{{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:16px 17px;
    transition:border-color .15s,transform .15s}}
  .card:hover{{border-color:var(--accent);transform:translateY(-2px)}}
  .card h3{{margin:0 0 6px;font-size:16px}}
  .card h3 a{{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:15px}}
  .card .c{{display:inline-block;font-size:12px;color:var(--accent2);margin-bottom:8px}}
  .card p{{margin:0;color:var(--muted);font-size:14px}}
  footer{{text-align:center;color:var(--muted);margin-top:44px;font-size:14px}}
</style>
</head>
<body>
<div class="wrap">
  <header>
    <h1>🧠 Claude Skills Library</h1>
    <p class="tag">{len(data)} production-grade Agent Skills for Claude Code &amp; every major agentic runtime</p>
    <div class="pills">
      <span class="pill"><b>{len(data)}</b> skills</span>
      <span class="pill"><b>{len(cats)}</b> categories</span>
      <span class="pill">MIT licensed</span>
      <span class="pill"><a href="{REPO_URL}">GitHub ↗</a></span>
    </div>
    <div class="install">
      <code>/plugin marketplace add frankxai/claude-skills-library
/plugin install claude-skills-library@claude-skills-library</code>
    </div>
  </header>

  <div class="controls">
    <input id="q" type="search" placeholder="Search {len(data)} skills by name or description…" autocomplete="off">
    <div class="cats" id="cats"></div>
  </div>
  <div class="count" id="count"></div>
  <div class="grid" id="grid"></div>

  <footer>
    Built on Anthropic's open <a href="https://agentskills.io">Agent Skills</a> standard ·
    <a href="{REPO_URL}">Star the repo ⭐</a>
  </footer>
</div>

<script id="data" type="application/json">{payload}</script>
<script>
  const SKILLS = JSON.parse(document.getElementById('data').textContent);
  const CATS = ['All', ...{json.dumps(cats)}];
  let activeCat = 'All', query = '';
  const grid = document.getElementById('grid');
  const countEl = document.getElementById('count');
  const catsEl = document.getElementById('cats');

  CATS.forEach(c => {{
    const el = document.createElement('span');
    el.className = 'cat' + (c === 'All' ? ' active' : '');
    el.textContent = c;
    el.onclick = () => {{ activeCat = c; [...catsEl.children].forEach(x => x.classList.toggle('active', x === el)); render(); }};
    catsEl.appendChild(el);
  }});

  function esc(s) {{ const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }}

  function render() {{
    const q = query.trim().toLowerCase();
    const rows = SKILLS.filter(s =>
      (activeCat === 'All' || s.cat === activeCat) &&
      (!q || s.name.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q)));
    countEl.textContent = rows.length + ' skill' + (rows.length === 1 ? '' : 's');
    grid.innerHTML = rows.map(s =>
      '<div class="card"><h3><a href="' + s.url + '">' + esc(s.name) + '</a></h3>' +
      '<span class="c">' + esc(s.cat) + '</span>' +
      '<p>' + esc(s.desc) + '</p></div>').join('') ||
      '<p style="color:var(--muted)">No skills match.</p>';
  }}

  document.getElementById('q').addEventListener('input', e => {{ query = e.target.value; render(); }});
  render();
</script>
</body>
</html>
"""
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write(page)
    print(f"Wrote {OUT} ({len(data)} skills, {len(cats)} categories).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
