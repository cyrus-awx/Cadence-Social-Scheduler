type AirwallexPaymentForm = {
  mount: (elementId: string) => void;
  unmount?: () => void;
  on: (
    event: "ready" | "success" | "error",
    handler: (data: { code?: string; message?: string }) => void,
  ) => void;
};

type AirwallexCheckout = {
  createElement: (type: "paymentForm") => Promise<AirwallexPaymentForm>;
};

type AirwallexBilling = {
  createCheckout: (options: {
    client_secret: string;
  }) => Promise<AirwallexCheckout>;
};

type AirwallexSdk = {
  init: (options: {
    env: "demo" | "prod";
    enabledElements: ["billing"];
  }) => Promise<{ billing: AirwallexBilling }>;
};

declare global {
  interface Window {
    AirwallexComponentsSDK?: AirwallexSdk;
  }
}

let sdkPromise: Promise<AirwallexSdk> | undefined;
let initialized:
  | Promise<{ billing: AirwallexBilling; environment: "demo" | "prod" }>
  | undefined;

function loadSdk(): Promise<AirwallexSdk> {
  if (window.AirwallexComponentsSDK) {
    return Promise.resolve(window.AirwallexComponentsSDK);
  }
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://static.airwallex.com/components/sdk/v1/index.js";
    script.async = true;
    script.onload = () => {
      if (window.AirwallexComponentsSDK) {
        resolve(window.AirwallexComponentsSDK);
      } else {
        reject(new Error("Airwallex SDK did not initialize"));
      }
    };
    script.onerror = () => reject(new Error("Unable to load Airwallex checkout"));
    document.head.appendChild(script);
  });
  return sdkPromise;
}

export async function createEmbeddedCheckout(
  clientSecret: string,
  environment: "demo" | "prod",
): Promise<AirwallexPaymentForm> {
  if (!initialized) {
    initialized = loadSdk().then(async (sdk) => {
      const { billing } = await sdk.init({
        env: environment,
        enabledElements: ["billing"],
      });
      return { billing, environment };
    });
  }

  const state = await initialized;
  if (state.environment !== environment) {
    throw new Error("Airwallex was initialized for a different environment");
  }
  const checkout = await state.billing.createCheckout({
    client_secret: clientSecret,
  });
  return checkout.createElement("paymentForm");
}