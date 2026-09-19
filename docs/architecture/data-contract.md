# Brief contract v1.0

Authoritative implementation: [brief.ts](../../src/domain/brief.ts).
Generated interchange description: [JSON Schema](../../schemas/brief.schema.json).
Blank starter: [blank.json](../../examples/blank.json).

| Field                          | Meaning                                                                     |
| ------------------------------ | --------------------------------------------------------------------------- |
| `schemaVersion`, `id`          | Supported file contract and stable document identity                        |
| `visibility`, `editorialState` | Only `public` and `draft` are supported                                     |
| `title`                        | Exact decision subject, not an inferred broad project phase                 |
| `meeting`                      | Authority, deciding body, date, agenda item, original proposal reference    |
| `provenance`                   | Author, document version, manually set preparation date                     |
| `decision`                     | Question, proposed wording, and summary/verbatim distinction                |
| `context`                      | Situation, objective, and affected people/places                            |
| `options`                      | Up to four alternatives with benefits, disadvantages, and uncertainties     |
| `budget`                       | Separate costs, funding, own contribution, status, coverage, and allocation |
| `consultations`                | Up to six individually sourced consultations and stated outcomes            |
| `nextStep`                     | Proposed action/responsibility/target/reporting, conditional on adoption    |
| `sources`                      | Up to twelve public evidence references with precise locators               |

Incomplete drafts can use empty text/date fields. There is no automatic date
advancement or editorial-state promotion. A source's `accessedOn` is the actual
date a person accessed it, not the file export time.

## Financial values

Each money object has `status`, `amountEuros`, and a short `note` describing its
period or estimate basis. Status is `unknown`, `estimated`, or `documented`.
Unknown values require an empty amount; known values require a decimal string.
Both `1234.56` and `1234,56` are accepted. Exponents, grouping separators,
negative costs, more than two fractional digits, and more than twelve integer
digits are rejected. Zero is explicit and never used as an unknown default.

The fields model non-negative gross costs, grants, and own contributions. They
are not a general accounting ledger; signed cash flows and multi-year financial
tables are future requirements. Notes and original attachments should make the
time horizon clear. No automatic totals or financial inference are implemented.

## Evidence and validation

Sources assign support to sections (`supports`). Consultations can additionally
reference one exact source by ID. The application requires unique IDs within
each collection and resolves consultation source references. The generated
structural schema cannot fully express these cross-record checks.

HTTP(S) URLs are allowed; credentials in URLs are rejected by application-level
validation. Neither an accepted URL nor a source assignment proves the truth of
a claim. Human reviewers must match exact documents, dates, and passages.

Unknown fields and future schema versions are rejected to avoid silent data
loss. Any contract extension requires a deliberate compatibility/migration
decision. Preserve stable IDs and original evidence when making corrections.
