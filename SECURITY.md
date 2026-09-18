# Security

## Supported use

Cadence is a public sample with Airwallex sandbox billing. It is not designed to process production payments, authenticate real users, or publish social content until those systems are built and reviewed.

## Reporting

Do not open public GitHub issues or pull requests for suspected vulnerabilities. Contact the current repository owner privately with:

- Affected route, file, or dependency
- Reproduction steps
- Impact and attacker prerequisites
- Any relevant request IDs, timestamps, or traces, with secrets removed

## Secret handling

- Keep `DATABASE_URL`, `SESSION_SECRET`, and Airwallex credentials in Replit Secrets or another secret manager.
- Never commit populated `.env` files, private keys, tokens, or provider responses containing credentials.
- Rotate any secret that was committed, logged, pasted into a ticket, or exposed in a screenshot.
- API logs omit query strings and must never add request bodies, payment data, cookies, or headers.

## Controls to preserve

- Keep cookie-authenticated POST routes behind the same-origin guard.
- Keep `/api/billing/webhook` exempt from that browser guard, and verify its decoded hex HMAC signature, timestamp, event claim, and payload before applying state.
- Keep entitlement activation server-side: status `SUCCEEDED`, amount `29`, currency `USD`, plan metadata, and anonymous user metadata must all match.
- Do not add recurring consent, saved-card behavior, cancellation, period fields, or production environment switches without a separately reviewed billing design.
- Keep API responses `no-store` and retain the existing browser security headers.

## Dependency policy

The workspace enforces a one-day npm minimum package release age except for explicitly trusted Replit packages. Keep that setting enabled.
