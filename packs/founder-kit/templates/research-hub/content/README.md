# Content

Add one `.mdx` file per investigation to `investigations/`. Frontmatter:

```yaml
title: "Plain title"
kind: investigation        # any short label, for example method note
summary: "One sentence."
status: draft              # draft | analysis | reviewed
updated: 2026-11-05
sources:
  - title: "Source title"
    url: "https://..."
    accessed: 2026-11-05
    locator: "Page 4"      # optional
```

Drafts never render. Reviewed needs at least one source with a url and an accessed date.
