# Static hosting (not deployed)

The production output is the static `dist/` directory from `pnpm build`.
There is no application server, writable data volume, or database. A static host
can serve this independently of RötgesPortal, including on the same machine.
Do not alter the existing portal's deployment or security settings for this tool.

For local production preview, run `pnpm preview`; it is not a production server.

Before publishing, establish the actual operator, domain, applicable operator
and privacy information, request-log retention, update/rollback ownership, and
software license. These decisions are not provided by this scaffold. No public
deployment, domain, or legal page is configured.

## Example headers

[Caddyfile.example](Caddyfile.example) is an illustrative static site on local
HTTP port 8080 with an example filesystem path. It is not wired into an existing
proxy and has not been deployed. Adapt the listener, document root, HTTPS, and
operator pages to verified hosting facts before use.

The policy allows same-origin bundled scripts/styles, blocks network connections
from application code, prevents framing, and disables unnecessary browser
permissions. It is intended for a production build, not the Vite development
server's hot-reload connection. HTTP source links remain human-controlled
navigations. Avoid third-party fonts, analytics, or asset CDNs.

## Suggested release procedure

1. Select a reviewed commit with passing checks and build from its lockfile.
2. Place `dist/` in a versioned release directory outside the source checkout.
3. Point the static host at the new release and verify HTTPS and response headers.
4. Check form editing, JSON round-trip, source links, and A4 printing on the host.
5. Record release commit, operator, time, and previous release for rollback.

Rollback switches the static root to the prior verified bundle. User-downloaded
JSON documents are outside the server's persistence and backup scope. If future
versions change schema compatibility, document migrations before releasing.
