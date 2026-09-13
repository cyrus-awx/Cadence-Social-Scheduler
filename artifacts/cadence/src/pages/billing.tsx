import { ArrowRight, CreditCard } from 'lucide-react';
import { Link } from 'wouter';

export default function Billing() {
  return (
    <div className="mx-auto max-w-[1060px]">
      <section className="mb-9">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-primary">Account</p>
        <h1 className="text-[30px] font-extrabold tracking-[-0.045em] text-[#312E81] sm:text-[36px]" data-testid="text-billing-heading">Billing &amp; plan</h1>
        <p className="mt-2 text-sm text-muted-foreground">A clear look at where your workspace stands today.</p>
      </section>

      <section className="rounded-2xl border border-indigo-100/80 bg-white p-6 cadence-shadow sm:p-8" data-testid="card-no-subscription">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-primary"><CreditCard className="h-5 w-5" /></div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Subscription status</p>
              <h2 className="mt-2 text-xl font-extrabold tracking-[-0.035em] text-[#312E81]" data-testid="status-no-active-subscription">No active subscription</h2>
            </div>
          </div>
          <Link href="/pricing" className="inline-flex w-fit shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-indigo-700" data-testid="link-billing-pricing">Compare plans <ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>
      </section>
    </div>
  );
}