# Development and verification

Use the versions and commands in [PROJECT.md](../PROJECT.md#validation-commands).
Install from the frozen lockfile; update dependencies deliberately and include
the lockfile in review. Dependency build scripts are allowlisted explicitly.

## Working on the schema

Edit `src/domain/brief.ts`, regenerate with `pnpm schema:generate`, and inspect
the generated diff. Update the blank example and documentation if the contract
changes. Add boundary tests for meaningfully new validation behavior, including
rejection and round-trip cases. Never edit the generated schema to bypass a
failed check.

## Working on presentation

1. Build and run browser tests against the production bundle.
2. Check narrow and desktop widths, keyboard operation, long titles, source
   links, multiple options, and unknown versus zero financial values.
3. Inspect actual A4 PDF output with the stated print settings. Confirm page
   count and that complete sources/caveats survive export.
4. Test overflowing content. The app must warn and must not silently clip it.
5. Check presentation view at a realistic projector resolution and distance.

Browser test PDFs are written under ignored `test-results/`. Tests exercise
Chromium desktop and a mobile viewport; these are not accessibility certification
or evidence of Safari/Firefox compatibility.

## Local data handling

Use fictional test data. The blank example carries no factual claims or verified
dates. Save personal local test documents under ignored `local-briefs/`, and do
not assume ignore rules make sensitive input appropriate for this public tool.

Schema parsing permits incomplete working drafts. Readiness hints are separate
from structural errors. Import errors must preserve the active draft. A failed
import must never offer an incomplete reconstructed substitute as if intact.

## Changing operations

There is no deployed service to operate from this repository yet. Do not infer
the RötgesPortal server's credentials, paths, operator, or legal facts. Adding
hosting or persistence requires updating the architecture and operations docs
with verified information, while keeping secrets out of Git and logs.
