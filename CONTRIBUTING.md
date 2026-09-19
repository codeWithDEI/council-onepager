# Contributing

Read [AGENTS.md](AGENTS.md) and [project memory](docs/PROJECT.md) first.
Use English for code, technical documentation, commits, and GitHub discussions;
use German for the product interface and public document text.

Keep changes small and preserve the separation of domain, file boundary,
editing, and rendering. Explain concrete before/after behavior in pull requests,
include relevant validation, and identify unresolved editorial or operating facts.

Run `pnpm check`, relevant browser tests after building, and `git diff --check`.
Update durable documentation in the same change when contracts or behavior change.
Documentation-only changes need link/claim review, not a runtime build solely
for prose. Schema changes must include regenerated artifacts.

Do not include confidential records, real credentials, or unverified political
claims in examples, issues, screenshots, or test fixtures. Security reports follow
[SECURITY.md](SECURITY.md). A software license is still pending selection.
