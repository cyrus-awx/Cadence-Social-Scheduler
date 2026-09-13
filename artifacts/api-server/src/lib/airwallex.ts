import crypto from "node:crypto";

const sandboxBaseUrl = "https://api.sandbox.airwallex.com";
const productionBaseUrl = "https://api.airwallex.com";

type JsonRecord = Record<string, unknown>;

let cachedToken: { value: string; expiresAt: number } | undefined;

function config() {
  const clientId = process.env.AIRWALLEX_CLIENT_ID;
  const apiKey = process.env.AIRWALLEX_API_KEY;
  const webhookSecret = process.env.AIRWALLEX_WEBHOOK_SECRET;
  if (!clientId || !apiKey || !webhookSecret) {
    throw new Error("Airwallex is not configured");
  }
  const isProduction = process.env.AIRWALLEX_ENVIRONMENT === "production";
  return {
    clientId,
    apiKey,
    webhookSecret,
    baseUrl: isProduction ? productionBaseUrl : sandboxBaseUrl,
    sdkEnvironment: isProduction ? ("prod" as const) : ("demo" as const),
  };
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }

  const { baseUrl, clientId, apiKey } = config();
  const response = await fetch(`${baseUrl}/api/v1/authentication/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-client-id": clientId,
      "x-api-key": apiKey,
    },
  });
  const body = (await response.json()) as JsonRecord;
  if (!response.ok || typeof body.token !== "string") {
    throw new Error(`Airwallex authentication failed (${response.status})`);
  }

  const expiresAt =
    typeof body.expires_at === "string"
      ? Date.parse(body.expires_at)
      : Date.now() + 30 * 60_000;
  cachedToken = { value: body.token, expiresAt };
  return body.token;
}

async function airwallexPost(
  path: string,
  payload: JsonRecord,
): Promise<JsonRecord> {
  const { baseUrl } = config();
  const token = await getAccessToken();
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const body = (await response.json()) as JsonRecord;
  if (!response.ok) {
    const message =
      typeof body.message === "string" ? body.message : "Airwallex request failed";
    throw new Error(`${message} (${response.status})`);
  }
  return body;
}

async function airwallexGet(path: string): Promise<JsonRecord> {
  const { baseUrl } = config();
  const token = await getAccessToken();
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = (await response.json()) as JsonRecord;
  if (!response.ok) {
    const message =
      typeof body.message === "string" ? body.message : "Airwallex request failed";
    throw new Error(`${message} (${response.status})`);
  }
  return body;
}

function collection(body: JsonRecord): JsonRecord[] {
  const values = body.items ?? body.data;
  return Array.isArray(values)
    ? values.filter(
        (value): value is JsonRecord =>
          typeof value === "object" && value !== null,
      )
    : [];
}

async function ensureProPrice(): Promise<string> {
  const products = collection(
    await airwallexGet("/api/v1/billing/products?page_num=0&page_size=100"),
  );
  const existingProduct = products.find(
    (candidate) => candidate.name === "Cadence Pro" && candidate.active !== false,
  );
  const product =
    existingProduct ??
    (await airwallexPost("/api/v1/billing/products/create", {
      request_id: crypto.randomUUID(),
      name: "Cadence Pro",
      description: "Expanded social scheduling for small businesses",
      active: true,
      metadata: { cadence_catalog_key: "pro" },
    }));
  if (typeof product.id !== "string") {
    throw new Error("Airwallex did not return a product ID");
  }

  const prices = collection(
    await airwallexGet(
      `/api/v1/billing/prices?page_num=0&page_size=100&product_id=${encodeURIComponent(product.id)}`,
    ),
  );
  const existingPrice = prices.find((candidate) => {
    const recurring = candidate.recurring as JsonRecord | undefined;
    return (
      candidate.product_id === product.id &&
      candidate.currency === "USD" &&
      candidate.unit_amount === 29 &&
      recurring?.period === 1 &&
      recurring?.period_unit === "MONTH" &&
      candidate.active !== false
    );
  });
  const price =
    existingPrice ??
    (await airwallexPost("/api/v1/billing/prices/create", {
      request_id: crypto.randomUUID(),
      product_id: product.id,
      currency: "USD",
      unit_amount: 29,
      pricing_model: "PER_UNIT",
      billing_type: "IN_ADVANCE",
      recurring: { period: 1, period_unit: "MONTH" },
      active: true,
      metadata: { cadence_catalog_key: "pro-usd-monthly" },
    }));
  if (typeof price.id !== "string") {
    throw new Error("Airwallex did not return a price ID");
  }
  return price.id;
}

export async function createProCheckout(userKey: string, returnUrl: string) {
  const priceId = await ensureProPrice();
  const checkout = await airwallexPost(
    "/api/v1/billing/billing_checkouts/create",
    {
      request_id: crypto.randomUUID(),
      mode: "SUBSCRIPTION",
      ui_mode: "ELEMENTS",
      return_url: returnUrl,
      line_items: [{ price_id: priceId, quantity: 1 }],
      subscription_data: {
        recurring: { period: 1, period_unit: "MONTH" },
        metadata: { cadence_user_key: userKey, cadence_plan: "pro" },
      },
      locale: "AUTO",
      customer_data: { name: "Maya Chen", type: "INDIVIDUAL" },
      customer_data_collection: {
        billing_address: "AUTO",
        tax_id: "DISABLED",
      },
      payment_options: { payment_method_types: ["card"] },
      metadata: { cadence_user_key: userKey, cadence_plan: "pro" },
    },
  );

  if (
    typeof checkout.id !== "string" ||
    typeof checkout.client_secret !== "string"
  ) {
    throw new Error("Airwallex did not return an embedded checkout secret");
  }

  return {
    checkoutId: checkout.id,
    clientSecret: checkout.client_secret,
    environment: config().sdkEnvironment,
  };
}

export async function verifyCompletedProCheckout(
  checkoutId: string,
  userKey: string,
) {
  const checkout = await airwallexGet(
    `/api/v1/billing/billing_checkouts/${encodeURIComponent(checkoutId)}`,
  );
  const metadata = checkout.metadata as JsonRecord | undefined;
  const subscriptionData = checkout.subscription_data as JsonRecord | undefined;
  const subscriptionMetadata = subscriptionData?.metadata as JsonRecord | undefined;
  const cadenceUserKey =
    typeof metadata?.cadence_user_key === "string"
      ? metadata.cadence_user_key
      : subscriptionMetadata?.cadence_user_key;

  if (
    checkout.status !== "COMPLETED" ||
    checkout.mode !== "SUBSCRIPTION" ||
    cadenceUserKey !== userKey ||
    typeof checkout.subscription_id !== "string"
  ) {
    return null;
  }

  return {
    subscriptionId: checkout.subscription_id,
    customerId:
      typeof checkout.billing_customer_id === "string"
        ? checkout.billing_customer_id
        : null,
  };
}

export function verifyAirwallexWebhook(
  timestamp: string,
  signature: string,
  rawBody: Buffer,
): boolean {
  const { webhookSecret } = config();
  const timestampMs = Number(timestamp);
  if (
    !Number.isFinite(timestampMs) ||
    Math.abs(Date.now() - timestampMs) > 5 * 60_000
  ) {
    return false;
  }
  const expected = crypto
    .createHmac("sha256", webhookSecret)
    .update(timestamp + rawBody.toString("utf8"))
    .digest("hex");
  const provided = Buffer.from(signature, "hex");
  const calculated = Buffer.from(expected, "hex");
  return (
    provided.length === calculated.length &&
    crypto.timingSafeEqual(provided, calculated)
  );
}