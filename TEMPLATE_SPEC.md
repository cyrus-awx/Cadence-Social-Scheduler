# Cadence Template Specification

## 1. Product summary

Cadence is a responsive SaaS workspace starter for social scheduling products. It demonstrates how a small-business dashboard, planning calendar, pricing page, and embedded billing experience can share one coherent application shell.

The default fictional customer is **Northstar Roasters**, owned by **Maya Chen**. The sample content gives remixed projects a complete first-run experience without requiring seed scripts for social data.

## 2. Intended uses

- SaaS dashboard and billing starter
- Social scheduling product prototype
- Responsive admin/workspace UI reference
- Airwallex embedded-checkout reference
- PostgreSQL and webhook idempotency example

It is not a production-ready social publisher or recurring-subscription engine without the extensions listed in section 10.

## 3. User-facing capabilities

### Workspace shell

- Desktop sidebar navigation
- Mobile/tablet bottom navigation
- Workspace and account presentation
- Notification and account popovers
- Starter/Pro state shown throughout the app
- Safe-area-aware mobile layout

### Dashboard

- Date-aware greeting
- Scheduled and published post summaries
- Engagement and connected-account metrics
- Upcoming and recently published post lists
- Starter-limit upgrade state
- Pro-aware scheduling state

### Calendar

- Monthly desktop calendar
- Previous/current/next demo month navigation
- Scheduled and published state legend
- Platform-specific post cards
- Mobile/tablet chronological agenda
- Empty-month presentation

### Pricing

- Starter, Pro, and Business comparison
- Current-plan state synchronized with billing
- Responsive stacked cards
- Pro upgrade navigation
- Business “Coming soon” state

### Billing

- Current plan and period state
- Native Airwallex Drop-in iframe
- Eligible cards and wallets selected by Airwallex
- Checkout loading, error, and remount states
- Server-verified Pro activation
- Local cancel-at-period-end state
- Sandbox billing reset

## 4. Billing sequence

1. The browser requests a Pro checkout.
2. The API identifies the demo user with a signed HTTP-only cookie.
3. PostgreSQL advisory locking serializes overlapping checkout requests.
4. The API reuses or creates an Airwallex customer.
5. It creates a $29 USD PaymentIntent using a signed checkout-attempt ID as the provider idempotency key.
6. The API stores the pending intent.
7. The browser mounts Airwallex Drop-in with the returned intent ID and client secret.
8. On Airwallex success, the browser asks the server to retrieve and verify the PaymentIntent.
9. Only provider status `SUCCEEDED` activates Pro.
10. Signed webhooks provide delayed success/failure reconciliation and event replay protection.

## 5. Architecture

| Package | Responsibility |
| --- | --- |
| `artifacts/cadence` | React/Vite web interface |
| `artifacts/api-server` | Express API and Airwallex integration |
| `lib/db` | PostgreSQL client and Drizzle schema |
| `lib/api-spec` | OpenAPI source |
| `lib/api-client-react` | Generated React Query client |
| `lib/api-zod` | Generated Zod schemas |
| `artifacts/mockup-sandbox` | Isolated component preview artifact |
| `scripts` | Post-merge and billing-test cleanup utilities |

Replit artifact routing mounts the web artifact at `/` and API artifact at `/api`.

## 6. Data model

### Billing subscription

- Anonymous signed-cookie user ID
- Plan and subscription status
- Airwallex customer ID
- Airwallex PaymentIntent ID
- Airwallex payment-consent ID
- Cancel-at-period-end flag
- Current period end
- Last payment error
- Created and updated timestamps

### Webhook event

- Airwallex event ID
- Event name
- Original JSON payload
- Processed timestamp

## 7. Security controls

- Secrets read only on the API server
- No provider credentials in browser code or generated web bundles
- Signed, HTTP-only, SameSite cookies
- Secure cookies in production
- Required session secret at startup
- Timing-safe HMAC webhook signature comparison
- Five-minute webhook timestamp tolerance
- Webhook event replay protection
- Server-side payment retrieval before entitlement activation
- Provider idempotency keys and PostgreSQL checkout locking
- API `Cache-Control: no-store`
- Browser security headers
- Query strings omitted from request logs
- Secret and private-key files excluded by `.gitignore`
- pnpm package minimum-release-age supply-chain protection

## 8. Responsive behavior

- Phone: compact header, fixed five-item bottom navigation, two-column metrics, agenda calendar, stacked pricing/billing cards
- Tablet: full-width content with bottom navigation; no narrow desktop sidebar
- Desktop: fixed sidebar, full monthly calendar, multi-column pricing and billing layouts
- Touch actions use approximately 44px minimum targets
- Bottom content reserves safe-area and navigation clearance

## 9. Validation coverage

- Full TypeScript project checking
- Production builds for all workspace packages
- Unit/API billing regression tests
- PostgreSQL concurrency test for simultaneous checkout requests
- Webhook signature, age, malformed-body, and replay cases
- Checkout persistence-failure and idempotency cases
- Isolated temporary database schemas with cleanup tooling
- Manual Airwallex sandbox payment and reset cycle
- Phone, tablet, and desktop visual checks

## 10. Production extensions

Implement these before using Cadence as a real paid social scheduler:

- Real user authentication and account recovery
- Workspace membership and authorization
- Social-provider OAuth and token storage
- Post CRUD, media storage, scheduling, and publishing workers
- Real engagement analytics ingestion
- Recurring collection using saved consent
- Provider-side cancellation and consent revocation
- Invoices, refunds, disputes, payment recovery, and reconciliation
- Subscription expiry enforcement
- Legal terms, privacy policy, cookie notice, and merchant disclosures
- Rate limiting and abuse controls appropriate to expected traffic
- Monitoring, alerting, and production support procedures

## 11. Template acceptance checklist

- [ ] README and MIT license are present.
- [ ] No `.env`, private key, provider credential, or database URL is committed.
- [ ] Development database schema initializes successfully.
- [ ] App works without Airwallex credentials in billing-disabled mode.
- [ ] Fork owner adds their own Airwallex sandbox credentials.
- [ ] Brand, people, handles, posts, dates, and plan copy are replaced.
- [ ] Price changes are made server-side and reflected in the UI.
- [ ] OpenAPI codegen is rerun after contract changes.
- [ ] Typecheck, build, and billing tests pass.
- [ ] Phone, tablet, and desktop layouts are checked.
- [ ] One sandbox checkout, reload, reset, and second checkout are verified.
- [ ] Published project is Public and remixing is allowed.