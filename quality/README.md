# Project-local installer evidence

CSS animations, GSAP and Remotion-to-HyperFrames each passed the Claude Code and Codex project-local copy/remove checks. Their rendering contracts require separate tests.

[Local profile](install-profile.json) · [Measured receipt](install-baseline.json) · [Shared standard and checker](https://github.com/frankxai/skills/tree/2f1bf24d7b8e7040b49dad41c4511fdfb8b0ea35/quality/v1)

From this repository root, use a disposable checkout of the shared checker. Python 3.12+, Git and Node are required. The receipt verifier also needs Python jsonschema.

```sh
tools_dir=$(mktemp -d)
git clone --quiet https://github.com/frankxai/skills.git "$tools_dir/standard"
git -C "$tools_dir/standard" checkout --quiet 2f1bf24d7b8e7040b49dad41c4511fdfb8b0ea35
npm install --prefix "$tools_dir/cli" --ignore-scripts --no-audit --no-fund skills@1.9.0
python "$tools_dir/standard/quality/v1/check_install.py" --repo . --profile quality/install-profile.json \
  --cli "$tools_dir/cli/node_modules/.bin/skills" --output "$tools_dir/result.json"
python "$tools_dir/standard/quality/v1/verify_receipt.py" --revision "$(git rev-parse HEAD)" \
  --profile quality/install-profile.json "$tools_dir/result.json"
```

The checker uses a fresh project and profile per cell. A successful package copy, a scoped removal and a native runtime invocation have separate evidence. A nonzero result preserves the failure in the JSON report.

## Easing study

The catalog serves a self-contained projection of the [source example at the reviewed motion revision](https://github.com/frankxai/awesome-motion-design-agent-skills/tree/c6026dc9629368d7c1996fb6812e74fad152003a/examples/easing-study). The interactive source and visual tests live upstream. Rebuild the projection with Python from this catalog checkout after reviewing an upstream change.

```python
from pathlib import Path
source = Path("../awesome-motion-design-agent-skills/examples/easing-study")
html = (source / "index.html").read_text()
script = (source / "study.js").read_text()
marker = '<script src="study.js"></script>'
assert html.count(marker) == 1
Path("docs/examples/easing-study.html").write_text(html.replace(marker, "<script>\n" + script + "\n</script>"))
```
