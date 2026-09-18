import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, CreditCard, Loader2, ShieldCheck } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

type BillingStatus = {
  plan: 'starter' | 'pro';
  status: 'inactive' | 'pending' | 'active' | 'past_due' | 'canceled';
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  billingConfigured: boolean;
};

type CheckoutSession = {
  intentId: string;
  clientSecret: string;
  customerId: string;
  currency: string;
  amount: number;
  environment: 'demo' | 'prod';
};

type DropInElement = {
  mount(id: string): void;
  unmount?(): void;
  destroy?(): void;
  on(event: 'ready' | 'success' | 'error', handler: (payload?: unknown) => void): void;
};

declare global {
  interface Window {
    AirwallexComponentsSDK?: {
      init(options: Record<string, unknown>): Promise<void>;
      createElement(type: string, options: Record<string, unknown>): Promise<DropInElement>;
    };
  }
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message ?? 'Billing request failed.');
  return body as T;
}

function loadAirwallex() {
  if (window.AirwallexComponentsSDK) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-airwallex-sdk]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Could not load the secure card form.')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://static.airwallex.com/components/sdk/v1/index.js';
    script.async = true;
    script.dataset.airwallexSdk = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Could not load the secure card form.'));
    document.head.appendChild(script);
  });
}

function getPaymentError(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null) {
    const details = error as { message?: unknown; error?: { message?: unknown } };
    if (typeof details.message === 'string') return details.message;
    if (typeof details.error?.message === 'string') return details.error.message;
  }
  return 'Payment could not be completed. Check the card details and try again.';
}

export default function Billing() {
  const queryClient = useQueryClient();
  const [checkout, setCheckout] = useState<CheckoutSession | null>(null);
  const [checkoutReady, setCheckoutReady] = useState(false);
  const [checkoutAttempt, setCheckoutAttempt] = useState(0);
  const [message, setMessage] = useState('');
  const dropInRef = useRef<DropInElement | null>(null);

  const statusQuery = useQuery({
    queryKey: ['billing-status'],
    queryFn: () => api<BillingStatus>('/api/billing/status'),
    refetchInterval: (query) => query.state.data?.status === 'pending' ? 5000 : false,
  });

  const checkoutMutation = useMutation({
    mutationFn: () => api<CheckoutSession>('/api/billing/checkout', {
      method: 'POST',
      body: JSON.stringify({ plan: 'pro' }),
    }),
    onSuccess: (session) => {
      setMessage('');
      setCheckoutReady(false);
      setCheckout(session);
      void queryClient.invalidateQueries({ queryKey: ['billing-status'] });
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : 'Unable to start checkout.'),
  });

  const cancelMutation = useMutation({
    mutationFn: () => api<BillingStatus>('/api/billing/cancel', { method: 'POST' }),
    onSuccess: (data) => {
      queryClient.setQueryData(['billing-status'], data);
      setMessage('Your plan will end at the close of the current billing period.');
    },
    onError: (error) => setMessage(getPaymentError(error)),
  });

  useEffect(() => {
    if (!checkout) return;
    let disposed = false;
    void (async () => {
      await loadAirwallex();
      const sdk = window.AirwallexComponentsSDK;
      if (!sdk || disposed) return;
      await sdk.init({ env: checkout.environment, enabledElements: ['payments'] });
       const element = await sdk.createElement('dropIn', {
        intent_id: checkout.intentId,
        client_secret: checkout.clientSecret,
        currency: checkout.currency,
         country_code: 'US',
         mode: 'recurring',
         payment_consent: {
           next_triggered_by: 'merchant',
           merchant_trigger_reason: 'scheduled',
        },
         applePayRequestOptions: {
           lineItems: [{
             label: 'Cadence Pro',
             amount: checkout.amount.toFixed(2),
             type: 'final',
             paymentTiming: 'recurring',
             recurringPaymentStartDate: new Date(),
             recurringPaymentIntervalUnit: 'month',
             recurringPaymentIntervalCount: 1,
           }],
         },
      });
       if (disposed) {
         element.destroy?.();
         return;
       }
       dropInRef.current = element;
       element.mount('airwallex-drop-in');
       element.on('ready', () => {
         if (!disposed) setCheckoutReady(true);
       });
       element.on('success', () => {
         if (disposed) return;
         setMessage('Confirming your payment with Airwallex…');
         void api<BillingStatus>(`/api/billing/checkout/${encodeURIComponent(checkout.intentId)}/sync`, { method: 'POST' })
           .then((verified) => {
             if (disposed) return;
             queryClient.setQueryData(['billing-status'], verified);
             setMessage(verified.status === 'active'
               ? 'Payment confirmed. Pro is now active.'
               : 'Airwallex is still processing this payment. Your plan will update when it is confirmed.');
           })
           .catch((error) => {
             if (!disposed) setMessage(getPaymentError(error));
           });
       });
       element.on('error', (error) => {
         if (!disposed) setMessage(getPaymentError(error));
       });
    })().catch((error) => setMessage(error instanceof Error ? error.message : 'Could not load checkout.'));
    return () => {
      disposed = true;
       dropInRef.current?.unmount?.();
       dropInRef.current?.destroy?.();
       dropInRef.current = null;
    };
   }, [checkout, checkoutAttempt, queryClient]);

  const status = statusQuery.data;
  const active = status?.status === 'active';

  return (
    <div className="mx-auto max-w-[1060px]">
      <section className="mb-10">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#C2410C]">Account</p>
        <h1 className="text-[30px] font-extrabold tracking-[-0.05em] text-stone-900 sm:text-[36px]">Billing &amp; plan</h1>
        <p className="mt-2 text-sm text-stone-500">Manage your plan and payment details securely.</p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-[10px] border border-stone-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-stone-100 text-[#C2410C]"><CreditCard className="h-5 w-5" /></div>
            <div><p className="text-[11px] font-bold uppercase tracking-[0.1em] text-stone-500">Current plan</p><h2 className="mt-1 text-xl font-extrabold text-stone-900">{active ? 'Pro' : 'Starter'}</h2></div>
          </div>
          <div className="mt-6 border-t border-stone-200 pt-6">
            <p className="text-sm font-semibold text-stone-900">{active ? '$29 / month' : '$0 / month'}</p>
            <p className="mt-1 text-xs leading-relaxed text-stone-500">
              {status?.cancelAtPeriodEnd ? 'Your Pro access ends at the close of this billing period.' : active && status?.currentPeriodEnd ? `Renews ${new Date(status.currentPeriodEnd).toLocaleDateString()}.` : 'Upgrade whenever you need more room.'}
            </p>
            {active && !status.cancelAtPeriodEnd && <button onClick={() => cancelMutation.mutate()} className="mt-5 text-xs font-bold text-stone-500 hover:text-stone-900">Cancel at period end</button>}
          </div>
        </section>

        <section className="rounded-[10px] border border-stone-200 bg-white p-6 sm:p-8">
          {active ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center text-center"><CheckCircle2 className="h-9 w-9 text-emerald-600" /><h2 className="mt-4 text-xl font-extrabold text-stone-900">You’re on Pro</h2><p className="mt-2 max-w-sm text-sm text-stone-500">Your workspace has full Pro access.</p></div>
          ) : !checkout ? (
            <>
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#C2410C]">Upgrade to Pro</p>
              <div className="mt-3 flex items-baseline gap-1"><span className="text-4xl font-extrabold tracking-[-0.05em] text-stone-900">$29</span><span className="text-xs text-stone-500">/ month</span></div>
              <ul className="mt-6 space-y-3 text-sm text-stone-600">{['Unlimited scheduling', 'Advanced analytics', 'Priority support'].map((item) => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-[#C2410C]" />{item}</li>)}</ul>
              <button disabled={checkoutMutation.isPending || statusQuery.isLoading || !status?.billingConfigured} onClick={() => checkoutMutation.mutate()} className="mt-7 inline-flex w-full items-center justify-center rounded-[10px] bg-[#C2410C] px-5 py-3 text-sm font-bold text-white hover:bg-[#9a340a] disabled:cursor-not-allowed disabled:opacity-50">
                {checkoutMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : status?.billingConfigured ? 'Continue to secure payment' : 'Airwallex setup required'}
              </button>
            </>
          ) : (
            <>
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#C2410C]">Secure payment</p>
              <h2 className="mt-2 text-xl font-extrabold text-stone-900">Start Pro for $29/month</h2>
               {!checkoutReady && <div className="mt-8 flex items-center justify-center py-10 text-stone-400"><Loader2 className="h-5 w-5 animate-spin" /></div>}
               <div id="airwallex-drop-in" className={checkoutReady ? 'mt-7 min-h-[320px]' : 'h-0 overflow-hidden'} />
               <p className="mt-4 flex items-center justify-center gap-2 text-center text-[11px] text-stone-500"><ShieldCheck className="h-3.5 w-3.5 shrink-0" />Cards and eligible wallets are encrypted and handled by Airwallex.</p>
               <button
                 type="button"
                 onClick={() => {
                   setCheckoutReady(false);
                   setMessage('');
                   setCheckoutAttempt((attempt) => attempt + 1);
                 }}
                 className="mx-auto mt-4 block text-xs font-bold text-stone-500 hover:text-stone-900"
               >
                 Reload secure checkout
               </button>
            </>
          )}
          {message && <p className="mt-5 rounded-[10px] bg-stone-100 p-3 text-xs leading-relaxed text-stone-700">{message}</p>}
        </section>
      </div>
    </div>
  );
}