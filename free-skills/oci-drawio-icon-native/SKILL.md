---
name: oci-drawio-icon-native
description: Build and validate OCI draw.io diagrams in icon-native mode so they never depend on `mxgraph.oci.*` runtime libraries. Use when authoring or fixing Oracle Cloud architecture diagrams in draw.io that must render portably.
version: 1.1.0
keywords: [oci, drawio, mcp, icon-native, architecture, validation]
triggers:
  - "oci drawio"
  - "icon native"
  - "red placeholder icons"
  - "mxgraph.oci"
---

# OCI Draw.io Icon-Native

## Purpose
Produce OCI diagrams that render correctly everywhere by using embedded icon stencils, strict icon semantics, and automated integrity validation.

## Workflow
1. Generate or update the diagram from a trusted OCI source file.
2. Enforce semantic icon mapping:
   - Agent runtime roles use OCI `Agent` icon.
   - Managed model endpoints use OCI `Generative AI` icon.
3. Keep connectors behind icon/label foreground.
4. Run integrity validator before delivery.

## Resources
- Oracle toolkit source: `drawio/OCI Style Guide for Drawio/OCI Architecture Diagram Toolkit v24.2.drawio`
- Example generator: `drawio/tools/build_agentic_rag_diagram.py`
- Integrity gate: `drawio/tools/validate_drawio_icon_integrity.py`

## Best Practices
- Never ship diagrams containing `shape=mxgraph.oci.*` unless library loading is guaranteed.
- Add white icon shields and readable label tiles where connectors pass nearby.
- Validate both visual quality and semantic correctness.
- Store architecture narrative with the diagram (design notes + flow steps).

## Examples
```bash
python3 drawio/tools/build_agentic_rag_diagram.py \
  --source drawio/KPN_RAG_Arch_ALL.drawio \
  --icon-source "drawio/OCI Style Guide for Drawio/OCI Architecture Diagram Toolkit v24.2.drawio" \
  --output drawio/KPN_RAG_Arch_ALL__with_Agentic_Excellence.drawio \
  --standalone drawio/OCI_Agentic_RAG_Excellence_ICON_NATIVE_V2.drawio \
  --diagram-name Agentic-RAG-Excellence-IconNative-v2

python3 drawio/tools/validate_drawio_icon_integrity.py \
  --file drawio/KPN_RAG_Arch_ALL__with_Agentic_Excellence.drawio \
  --diagram Agentic-RAG-Excellence-IconNative-v2
```

Expected validator signals:
- `mxgraph_oci_refs=0`
- `VALIDATION: PASS`
- stable `max_icon_group_spread_ratio` (close to `1.000`)
