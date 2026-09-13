import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, CreditCard, LoaderCircle, LockKeyhole } from 'lucide-react';
import { Link } from 'wouter';
import {
  getGetBillingStatusQueryKey,
  useCreateBillingCheckout,
  useGetBillingStatus,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { createEmbeddedCheckout } from '@/lib/airwallex-sdk';

export default function Billing() {
  const queryClient = useQueryClient();
  const checkoutContainer = useRef<HTMLDivElement>(null);
  const checkoutInstance = useRef<{
    unmount?: () => void;
    on?: (
      event: 'ready' | 'success' | 'error',
      handler: (data: { code?: string; message?: string }) => void,
    ) => void;
  } | null>(null);
  const autoStarted = useRef(false);
  const [checkoutError, setCheckoutError] = useState<string>();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const { data: billing, isLoading, refetch } = useGetBillingStatus();
  const checkout = useCreateBillingCheckout({
    mutation: {
      onSuccess: async (data) => {
        try {
          setCheckoutError(undefined);
          setCheckoutOpen(true);
          await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
          const instance = await createEmbeddedCheckout(
            data.clientSecret,
            data.environment,
          );
          checkoutInstance.current = instance;
          if (!checkoutContainer.current) {
            throw new Error('Checkout container is unavailable');
          }
          instance.on('success', () => {
            void refetch();
          });
          instance.on('error', ({ message }) => {
            if (message) setCheckoutError(message);
          });
          instance.mount('airwallex-billing-checkout');
        } catch (error) {
          setCheckoutOpen(false);
          setCheckoutError(
            error instanceof Error ? error.message : 'Unable to load checkout',
          );
        }
      },
      onError: () => {
        setCheckoutError('Airwallex checkout is unavailable right now. Please try again.');
      },
    },
  });

  useEffect(() => {
    const shouldUpgrade =
      new URLSearchParams(window.location.search).get('upgrade') === 'pro';
    if (shouldUpgrade && !autoStarted.current) {
      autoStarted.current = true;
      checkout.mutate();
    }
  }, []);

  useEffect(() => {
    if (billing?.plan === 'pro') {
      setCheckoutOpen(false);
      checkoutInstance.current?.unmount?.();
      queryClient.invalidateQueries({ queryKey: getGetBillingStatusQueryKey() });
    }
  }, [billing?.plan, queryClient]);

  useEffect(() => {
    if (!checkoutOpen) return;
    const interval = window.setInterval(() => {
      void refetch();
    }, 4000);
    return () => window.clearInterval(interval);
  }, [checkoutOpen, refetch]);

  useEffect(
    () => () => {
      checkoutInstance.current?.unmount?.();
    },
    [],
  );

  const isPro = billing?.plan === 'pro';

  return (
    <div className="mx-auto max-w-[1060px]">
      <section className="mb-10">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#C2410C]">Account</p>
        <h1 className="text-[30px] font-extrabold tracking-[-0.05em] text-stone-900 sm:text-[36px]" data-testid="text-billing-heading">Billing &amp; plan</h1>
        <p className="mt-2 text-sm text-stone-500">Manage your Cadence subscription without leaving your workspace.</p>
      </section>

      {checkoutOpen ? (
        <section className="grid gap-6 lg:grid-cols-[320px_1fr]" data-testid="section-airwallex-checkout">
          <aside className="h-fit rounded-[10px] border border-stone-200 bg-white p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#C2410C]">Cadence Pro</p>
            <div className="mt-3 flex items-end gap-1">
              <span className="text-4xl font-extrabold tracking-[-0.05em] text-stone-900">$29</span>
              <span className="pb-1 text-xs text-stone-500">/ month</span>
            </div>
            <ul className="mt-6 space-y-3 text-xs font-medium text-stone-700">
              {['Unlimited scheduled posts', 'Advanced analytics', 'Priority support'].map((item) => (
                <li key={item} className="flex gap-2"><Check className="h-4 w-4 text-[#C2410C]" />{item}</li>
              ))}
            </ul>
            <div className="mt-6 flex items-start gap-2 border-t border-stone-200 pt-5 text-xs leading-relaxed text-stone-500">
              <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" />
              Card details are securely collected and processed by Airwallex.
            </div>
          </aside>
          <div className="min-h-[560px] rounded-[10px] border border-stone-200 bg-white p-4 sm:p-6">
            <div id="airwallex-billing-checkout" ref={checkoutContainer} />
          </div>
        </section>
      ) : (
        <section className="rounded-[10px] border border-stone-200 bg-white p-6 sm:p-8" data-testid="card-subscription">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] bg-stone-100 text-[#C2410C]">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-stone-500">Subscription status</p>
                <h2 className="mt-1.5 text-xl font-extrabold tracking-[-0.035em] text-stone-900" data-testid="status-subscription">
                  {isLoading ? 'Checking your plan…' : isPro ? 'Cadence Pro' : 'Starter plan'}
                </h2>
                <p className="mt-2 text-xs text-stone-500">
                  {isPro ? 'Your subscription is active.' : '10 scheduled posts per month.'}
                </p>
              </div>
            </div>
            {!isPro && (
              <button
                type="button"
                onClick={() => checkout.mutate()}
                disabled={checkout.isPending}
                className="inline-flex w-fit shrink-0 items-center gap-2 rounded-[10px] bg-[#C2410C] px-5 py-3 text-xs font-bold text-white transition-colors hover:bg-[#9a340a] disabled:cursor-wait disabled:opacity-70"
                data-testid="button-start-pro-checkout"
              >
                {checkout.isPending ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : null}
                Upgrade to Pro
                {!checkout.isPending ? <ArrowRight className="h-3.5 w-3.5" /> : null}
              </button>
            )}
          </div>
          {checkoutError && (
            <p className="mt-5 rounded-[10px] border border-stone-200 bg-stone-50 px-4 py-3 text-xs text-stone-700" role="alert">
              {checkoutError}
            </p>
          )}
          {!isPro && (
            <Link href="/pricing" className="mt-6 inline-flex text-xs font-bold text-[#C2410C] hover:text-[#9a340a]">
              Compare all plans
            </Link>
          )}
        </section>
      )}
    </div>
  );
}