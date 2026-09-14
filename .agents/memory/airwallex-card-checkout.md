---
name: Airwallex card checkout validation
description: Non-obvious Airwallex sandbox and Card Element behaviors that matter when validating Cadence payments.
---

For Card Element scheduled consent, send only `next_triggered_by: merchant` and `merchant_trigger_reason: scheduled`; extra terms can make confirmation fail. Treat the SDK promise as submission, not proof of payment: retrieve the PaymentIntent server-side and require `SUCCEEDED`.

Demo reset must preserve the Airwallex customer link while clearing local intent, consent, and subscription state. Customer creation must also tolerate Airwallex reporting that the deterministic customer already exists.

**Why:** A generic Visa test card triggered an embedded sandbox CAPTCHA and left the intent pending, while the documented always-successful Visa `4035 5010 0000 0008` completed. Browser-only success handling falsely reported submission as completion. Deleting the local billing row during reset caused the next checkout to recreate a customer that still existed remotely.

**How to apply:** For checkout changes, test dashboard navigation plus one full demo payment. Verify the server-side intent retrieval, the `active` database state, and the final Billing UI rather than stopping when the iframe mounts. Also test checkout → reset → checkout again.