import { ArrowRight, CreditCard } from 'lucide-react';
import { Link } from 'wouter';

export default function Billing() {
  return (
    <div className="mx-auto max-w-[1060px]">
      <section className="mb-10">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#C2410C]">Account</p>
        <h1 className="text-[30px] font-extrabold tracking-[-0.05em] text-stone-900 sm:text-[36px]" data-testid="text-billing-heading">Billing &amp; plan</h1>
        <p className="mt-2 text-sm text-stone-500">A clear look at where your workspace stands today.</p>
      </section>

      <section className="rounded-[10px] border border-stone-200 bg-white p-6 sm:p-8" data-testid="card-no-subscription">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] bg-stone-100 text-[#C2410C]"><CreditCard className="h-5 w-5" /></div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-stone-500">Subscription status</p>
              <h2 className="mt-1.5 text-xl font-extrabold tracking-[-0.035em] text-stone-900" data-testid="status-no-active-subscription">No active subscription</h2>
            </div>
          </div>
          <Link href="/pricing" className="inline-flex w-fit shrink-0 items-center gap-2 rounded-[10px] bg-[#C2410C] px-5 py-3 text-xs font-bold text-white transition-colors hover:bg-[#9a340a]" data-testid="link-billing-pricing">Compare plans <ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>
      </section>
    </div>
  );
}
