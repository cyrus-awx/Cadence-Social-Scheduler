import { randomUUID } from "node:crypto";

const isProduction = process.env.AIRWALLEX_ENV === "prod";
const baseUrl = isProduction
  ? "https://api.airwallex.com"
  : "https://api.sandbox.airwallex.com";

type AirwallexJson = Record<string, unknown>;

function requireCredential(name: "AIRWALLEX_CLIENT_ID" | "AIRWALLEX_API_KEY") {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

async function getAccessToken() {
  const response = await fetch(`${baseUrl}/api/v1/authentication/login`, {
    method: "POST",
    headers: {
      "x-client-id": requireCredential("AIRWALLEX_CLIENT_ID"),
      "x-api-key": requireCredential("AIRWALLEX_API_KEY"),
      "Content-Type": "application/json",
    },
  });
  const body = (await response.json()) as AirwallexJson;
  if (!response.ok || typeof body.token !== "string") {
    throw new Error(`Airwallex authentication failed (${response.status})`);
  }
  return body.token;
}

async function post(path: string, body: AirwallexJson) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await getAccessToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const payload = (await response.json()) as AirwallexJson;
  if (!response.ok) {
    const message = typeof payload.message === "string" ? payload.message : "Airwallex request failed";
    throw new Error(`${message} (${response.status})`);
  }
  return payload;
}

async function get(path: string) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { Authorization: `Bearer ${await getAccessToken()}` },
  });
  const payload = (await response.json()) as AirwallexJson;
  if (!response.ok) {
    const message = typeof payload.message === "string" ? payload.message : "Airwallex request failed";
    throw new Error(`${message} (${response.status})`);
  }
  return payload;
}

export function isAirwallexConfigured() {
  return Boolean(process.env.AIRWALLEX_CLIENT_ID && process.env.AIRWALLEX_API_KEY);
}

export async function createCustomer(userId: string) {
  try {
    return await post("/api/v1/pa/customers/create", {
      request_id: randomUUID(),
      merchant_customer_id: userId,
    });
  } catch (error) {
    if (
      !isProduction &&
      error instanceof Error &&
      error.message.includes("already exists")
    ) {
      return post("/api/v1/pa/customers/create", {
        request_id: randomUUID(),
        merchant_customer_id: `${userId}-d-${randomUUID().slice(0, 8)}`,
      });
    }
    throw error;
  }
}

export async function createProPaymentIntent(input: {
  userId: string;
  customerId: string;
}) {
  return post("/api/v1/pa/payment_intents/create", {
    request_id: randomUUID(),
    merchant_order_id: `cadence-pro-${input.userId}-${Date.now()}`,
    amount: 29,
    currency: "USD",
    customer_id: input.customerId,
    metadata: { cadence_user_id: input.userId, cadence_plan: "pro" },
  });
}

export function retrievePaymentIntent(intentId: string) {
  return get(`/api/v1/pa/payment_intents/${encodeURIComponent(intentId)}`);
}
