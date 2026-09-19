# Security policy

This is an initial public-draft editing tool, not a confidential records system.
There is no supported production release or maintenance SLA yet.

## Reporting a vulnerability

Do not open a public issue containing exploit details, credentials, or private
documents. Use GitHub private vulnerability reporting if enabled for this
repository. If it is unavailable, ask the repository owner for a private contact
channel without including vulnerability details. No dedicated security mailbox
is currently documented.

Include the affected revision, minimal fictional reproduction, impact, and the
browser/environment. Never attach actual confidential council documents.

## Security boundaries

- Imported JSON is untrusted and validated before replacing current state.
- Files are limited to 256 KiB. Unknown schemas/properties are rejected.
- Text is escaped; source links are limited to HTTP(S) without URL credentials.
- Source URLs are never fetched automatically by the application.
- No document upload, authentication, automatic publication, or telemetry exists.
- Adding persistence or remote services changes the threat model and requires
  an explicit architecture decision.

The [hosting example](deploy/README.md) includes recommended response headers.
Their existence in the repository does not prove that a host applies them.
