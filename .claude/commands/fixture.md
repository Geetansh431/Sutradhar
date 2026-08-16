---
description: Add or extend synthetic fixture data
argument-hint: <what to add>
---

Add fixture data for: $ARGUMENTS

Rules:
- Everything lands in `src/fixtures/`. No fixture data anywhere else in `src/`.
- Every fact carries a `SourceRef` and a `FieldValue` state. A fixture with bare values is
  wrong — the whole product is about provenance.
- Money uses `rupees()`. Never a bare number.
- **The two live projects (Iyer Residence, Kormangala) are hand-authored and carry the demo
  narrative — do not regenerate or "tidy" them.** Archive projects and background noise can
  be generated.
- Keep the demo's specific figures intact: they are referenced in `docs/spec/10-demo.md`.
  If a change would alter one, tell me before doing it.
- After adding, check every scenario in `src/fixtures/scenarios.ts` still boots.
