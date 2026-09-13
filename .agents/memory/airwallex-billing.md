---
name: Airwallex Billing integration
description: Version-specific Airwallex Billing Checkout behavior that is easy to confuse with older embedded checkout examples.
---

Use the current Airwallex Billing Elements flow: create the server checkout with `ui_mode` set to `ELEMENTS`, then call `billing.createCheckout()`, create its `paymentForm` element, and mount that form.

**Why:** Older examples describe an embedded checkout as directly mountable and use `EMBEDDED`; the current Billing SDK returns a checkout context instead. Mixing the two produces runtime errors even though checkout creation succeeds.

**How to apply:** When maintaining the Airwallex upgrade flow, confirm the installed SDK contract through the Airwallex MCP docs before changing UI mode or mount behavior.

Airwallex catalog `request_id` values prevent reuse but do not safely replay the previous response.

**Why:** Retrying a Product or Price creation with the same request ID is rejected for 48 hours rather than returning the resource.

**How to apply:** List and reuse matching active Products and Prices before creating new ones; use a fresh request ID only for an actual create call.