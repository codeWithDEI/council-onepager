# ADR 0001: Browser-first public decision briefs

Status: accepted for the initial foundation.

## Context

The intended pilot needs a low-maintenance form that creates consistent council
briefs and is independent of the RötgesPortal publication workflow. A brief
belongs to a specific deliberation, not an entire topic lifecycle.

## Decision

- Use a standalone repository and a static React/TypeScript application built
  with Vite. Do not introduce a backend, database, or account service.
- Store drafts in browser memory and let users explicitly save/load JSON files.
  Do not enable browser persistence silently.
- Keep one versioned Zod contract, infer TypeScript types, and generate a
  structural JSON Schema. Add cross-reference checks at the import/export boundary.
- Derive paper and presentation renderings from one document. Use browser print
  for PDF initially; do not introduce a LaTeX runtime or document service.
- Support public working drafts only. Human source verification is essential;
  no software check changes a document into an approved council record.
- Keep domain, editing, rendering, and file handling separate.

## Consequences

The application can be served from the same machine as another website without
sharing its editorial storage. Saved JSON files are portable. Lost unsaved input,
manual file coordination, and browser-specific printing remain limitations.

Adding shared editing, auto-save, approval, confidential records, API integration,
or hosting-specific services requires a separate decision and associated threat,
data-flow, and operating-model review.

Upstream references: [Vite guide](https://vite.dev/guide/) and
[Zod JSON Schema support](https://zod.dev/json-schema).
