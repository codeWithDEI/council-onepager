# Council OnePager

A browser-based tool for creating clear, source-backed one-page briefs for
municipal council decisions. Enter information once, save a portable JSON draft,
and use an A4 print layout or a presentation view.

**Status: initial working foundation, not an officially approved council system.**
All documents are visibly marked as working drafts. Technical validation does
not establish factual accuracy or editorial approval.

## Start locally

Use Node.js 22.23.2 (see `.nvmrc`) and pnpm 11.20.0.

```sh
corepack enable
corepack prepare pnpm@11.20.0 --activate
pnpm install --frozen-lockfile
pnpm dev
```

Open the local URL printed by Vite. Development and preview bind to loopback.

## Available now

- German guided editing: decision, context, alternatives, finances, consultation
  history, implementation steps, and attributable public sources.
- Versioned, size-limited JSON import and export; invalid imports preserve the
  current draft. Unknown costs remain distinct from zero.
- Presentation and A4 views derived from the same data, with source references.
- Browser print/PDF via **Drucken / PDF**; the button is disabled when the
  measured A4 document exceeds one page. No automatic font shrinking or clipping.
- Local in-memory editing, download reminders, and confirmation before replacing
  unsaved changes. No account, database, analytics, or document upload endpoint.
- Typed validation, generated JSON Schema, unit/browser tests, and GitHub CI.

Input stays in browser memory until downloaded. Reloading or closing the page
can lose unsaved work. A download request is not proof that the file was saved
successfully; check the browser's downloads. The browser may restrict unload
warnings. This is not an offline-installed application.

Only public information is supported. The tool neither retrieves sources nor
checks their factual content. Actual access dates and supporting passages must
be checked by a person. Use the original documents for authoritative wording.

## Repository map

| Path                        | Responsibility                                                        |
| --------------------------- | --------------------------------------------------------------------- |
| `src/domain/`               | Authoritative Zod contract, inferred types, validation, file boundary |
| `src/components/`           | Guided form and shared document renderer                              |
| `src/App.tsx`               | In-memory editing and file/presentation actions                       |
| `schemas/`                  | Generated structural JSON Schema; never hand-edit                     |
| `examples/`                 | Public, clearly identified examples; currently a blank draft          |
| `tools/`                    | Schema generation and freshness checking                              |
| `tests/unit/`, `tests/e2e/` | Domain/rendering and real-browser regression checks                   |
| `docs/`                     | Durable project memory, architecture, governance, operations          |
| `deploy/`                   | Static-hosting guidance and example security headers                  |

## Validation

```sh
pnpm check
pnpm exec playwright install chromium
pnpm test:e2e
git diff --check
```

Build before browser tests: they exercise the production bundle. CI installs
Chromium's OS dependencies as well. For schema edits, run
`pnpm schema:generate` and commit the generated schema with the source change.

## Project guidance

- [Project memory and current implementation](docs/PROJECT.md)
- [Architecture decision](docs/architecture/adr-0001-browser-first.md)
- [Data contract](docs/architecture/data-contract.md)
- [Editorial policy](docs/governance/editorial-policy.md)
- [Development and verification](docs/operations/development.md)
- [Static hosting](deploy/README.md)
- [Contributing](CONTRIBUTING.md) and [security reporting](SECURITY.md)
- [Roadmap](docs/ROADMAP.md)

Council OnePager is independent of RötgesPortal and of municipal authorities.
It may eventually share stable topic references with an information portal;
there is no implemented integration or shared persistence.

## License

No license has been selected yet. Do not interpret repository visibility as a
grant of reuse rights. The owner should select a license before inviting wider
reuse or municipal distribution.
