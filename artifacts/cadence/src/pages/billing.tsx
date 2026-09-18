import { useEffect, useRef, useState } from 'react';
import { createElement, init, type ElementTypes } from '@airwallex/components-sdk';
import { CheckCircle2, CreditCard, Loader2, ShieldCheck } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

type BillingStatus = {
  plan: 'starter' | 'pro';
  status: 'inactive' | 'pending' | 'active' | 'past_due' | 'canceled';
  billingConfigured: boolean;
};

type CheckoutSession = {
  intentId: string;
  clientSecret: string;
  customerId: string;
  currency: string;
  amount: number;
  environment: 'demo';
};

type CheckoutState =
  | { name: 'idle' }
  | { name: 'loading' }
  | { name: 'ready' }
  | { name: 'verifying' }
  | { name: 'succeeded' }
  | { name: 'error'; message: string };

async function api<T>(path: string, initOptions?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...initOptions,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...initOptions?.headers },
  });
  const body = await response.json().catch(() => ({})) as { message?: string };
  if (!response.ok) throw new Error(body.message ?? 'Billing request failed.');
  return body as T;
}

function getPaymentError(error: unknown): string {
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
  const [checkoutState, setCheckoutState] = useState<CheckoutState>({ name: 'idle' });
  const [checkoutAttempt, setCheckoutAttempt] = useState(0);
  const dropInRef = useRef<ElementTypes['dropIn'] | null>(null);

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
      setCheckout(session);
      setCheckoutState({ name: 'loading' });
      void queryClient.invalidateQueries({ queryKey: ['billing-status'] });
    },
    onError: (error) => setCheckoutState({ name: 'error', message: getPaymentError(error) }),
  });

  useEffect(() => {
    if (!checkout) return;
    let disposed = false;
    void (async () => {
      await init({ env: checkout.environment, enabledElements: ['payments'] });
      const element = await createElement('dropIn', {
        intent_id: checkout.intentId,
        client_secret: checkout.clientSecret,
        currency: checkout.currency,
        country_code: 'US',
        mode: 'payment',
        autoSaveCardForFuturePayments: false,
        submitType: 'pay',
      });
      if (disposed) {
        element.destroy();
        return;
      }
      dropInRef.current = element;
      element.on('ready', () => {
        if (!disposed) setCheckoutState({ name: 'ready' });
      });
      element.on('success', () => {
        if (disposed) return;
        setCheckoutState({ name: 'verifying' });
        void api<BillingStatus>(`/api/billing/checkout/${encodeURIComponent(checkout.intentId)}/sync`, { method: 'POST' })
          .then((verified) => {
            if (disposed) return;
            queryClient.setQueryData(['billing-status'], verified);
            setCheckoutState(verified.status === 'active'
              ? { name: 'succeeded' }
              : { name: 'error', message: 'Airwallex has not confirmed this payment yet.' });
          })
          .catch((error) => {
            if (!disposed) setCheckoutState({ name: 'error', message: getPaymentError(error) });
          });
      });
      element.on('error', (error) => {
        if (!disposed) setCheckoutState({ name: 'error', message: getPaymentError(error) });
      });
      element.mount('airwallex-drop-in');
    })().catch((error) => {
      if (!disposed) setCheckoutState({ name: 'error', message: getPaymentError(error) });
    });
    return () => {
      disposed = true;
      dropInRef.current?.destroy();
      dropInRef.current = null;
    };
  }, [checkout, checkoutAttempt, queryClient]);

  const status = statusQuery.data;
  const active = status?.status === 'active';
  const showSpinner = checkoutState.name === 'loading' || checkoutState.name === 'verifying';

  return (
    <div className="mx-auto max-w-[1060px]">
      <section className="mb-10">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#C2410C]">Sandbox</p>
        <h1 className="text-[30px] font-extrabold tracking-[-0.05em] text-stone-900 sm:text-[36px]">One-time payment demo</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-500">Pay $29 USD once in Airwallex sandbox to unlock the local Pro sample. This is not a subscription: it does not renew, save consent, or create a cancellation contract.</p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-[10px] border border-stone-200 bg-white p-6" aria-labelledby="billing-state-heading">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-stone-100 text-[#C2410C]"><CreditCard className="h-5 w-5" aria-hidden="true" /></div>
            <div><p className="text-[11px] font-bold uppercase tracking-[0.1em] text-stone-500" id="billing-state-heading">Demo access</p><h2 className="mt-1 text-xl font-extrabold text-stone-900">{active ? 'Pro unlocked' : 'Starter sample'}</h2></div>
          </div>
          <div className="mt-6 border-t border-stone-200 pt-6">
            <p className="text-sm font-semibold text-stone-900">{active ? '$29 sandbox payment confirmed' : '$29 USD one time'}</p>
            <p className="mt-1 text-xs leading-relaxed text-stone-500">{active ? 'Reset the demo from the account menu to try checkout again.' : 'No recurring charge, billing period, or saved payment consent.'}</p>
          </div>
        </section>

        <section className="min-w-0 rounded-[10px] border border-stone-200 bg-white p-5 sm:p-8" aria-labelledby="checkout-heading">
          {active ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center text-center"><CheckCircle2 className="h-9 w-9 text-emerald-600" aria-hidden="true" /><h2 id="checkout-heading" className="mt-4 text-xl font-extrabold text-stone-900">Payment confirmed</h2><p className="mt-2 max-w-sm text-sm text-stone-500">Pro sample access is active for this anonymous demo browser.</p></div>
          ) : !checkout ? (
            <>
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#C2410C]">Airwallex sandbox</p>
              <h2 id="checkout-heading" className="mt-3 text-xl font-extrabold text-stone-900">Pay $29 USD once</h2>
              <ul className="mt-6 space-y-3 text-sm text-stone-600">{['Unlocks local Pro sample state', 'No recurring billing', 'No payment consent saved'].map((item) => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#C2410C]" aria-hidden="true" />{item}</li>)}</ul>
              <button type="button" disabled={checkoutMutation.isPending || statusQuery.isLoading || !status?.billingConfigured} onClick={() => checkoutMutation.mutate()} className="mt-7 inline-flex min-h-11 w-full items-center justify-center rounded-[10px] bg-[#C2410C] px-5 py-3 text-sm font-bold text-white hover:bg-[#9a340a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C2410C] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                {checkoutMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />Starting checkout</> : status?.billingConfigured ? 'Continue to sandbox payment' : 'Airwallex setup required'}
              </button>
            </>
          ) : (
            <>
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#C2410C]">Secure sandbox payment</p>
              <h2 id="checkout-heading" className="mt-2 text-xl font-extrabold text-stone-900">One payment of $29 USD</h2>
              {showSpinner && <div className="mt-6 flex items-center justify-center py-8 text-stone-500" role="status"><Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />{checkoutState.name === 'verifying' ? 'Verifying payment' : 'Loading secure checkout'}</div>}
              <div id="airwallex-drop-in" aria-label="Airwallex secure payment form" className={checkoutState.name === 'ready' || checkoutState.name === 'error' ? 'mt-6 min-h-[320px] w-full max-w-full' : 'h-0 overflow-hidden'} />
              <p className="mt-4 flex items-center justify-center gap-2 text-center text-[11px] text-stone-500"><ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />Payment details are encrypted and handled by Airwallex.</p>
              <button type="button" onClick={() => { setCheckoutState({ name: 'loading' }); setCheckoutAttempt((attempt) => attempt + 1); }} className="mx-auto mt-3 block min-h-11 rounded-[10px] border border-stone-200 px-4 text-xs font-bold text-stone-500 hover:bg-stone-50 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C2410C]">Reload secure checkout</button>
            </>
          )}
          {checkoutState.name === 'error' && <p className="mt-5 rounded-[10px] bg-red-50 p-3 text-xs leading-relaxed text-red-800" role="alert">{checkoutState.message}</p>}
          {checkoutState.name === 'succeeded' && <p className="mt-5 rounded-[10px] bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-800" role="status">Payment confirmed. Pro sample access is active.</p>}
        </section>
      </div>
    </div>
  );
}
