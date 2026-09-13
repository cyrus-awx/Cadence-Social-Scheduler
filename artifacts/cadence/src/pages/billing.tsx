import { ArrowRight, Check, CreditCard, Info } from 'lucide-react';
import { Link } from 'wouter';
import { PlatformIcon } from '@/components/platform-icon';
import { connectedAccounts } from '@/lib/cadence-data';

export default function Billing() {
  return (
    <div className="mx-auto max-w-[1060px]">
      <section className="mb-9">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-primary">Account</p>
        <h1 className="text-[30px] font-extrabold tracking-[-0.045em] text-[#312E81] sm:text-[36px]" data-testid="text-billing-heading">Billing &amp; plan</h1>
        <p className="mt-2 text-sm text-muted-foreground">A clear look at where your workspace stands today.</p>
      </section>

      <section className="mb-6 rounded-2xl border border-indigo-100/80 bg-white p-6 cadence-shadow sm:p-8" data-testid="card-no-subscription">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-primary"><CreditCard className="h-5 w-5" /></div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Subscription status</p>
              <h2 className="mt-2 text-xl font-extrabold tracking-[-0.035em] text-[#312E81]" data-testid="status-no-active-subscription">No active subscription</h2>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">Maya is currently using Cadence on the free Starter plan. There are no payment details or recurring charges on this workspace.</p>
            </div>
          </div>
          <Link href="/pricing" className="inline-flex w-fit shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-indigo-700" data-testid="link-billing-pricing">Compare plans <ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl border border-indigo-100/80 bg-white p-6 cadence-shadow sm:p-7" data-testid="card-current-plan">
          <div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Current plan</p><h2 className="mt-2 text-2xl font-extrabold tracking-[-0.04em] text-[#312E81]" data-testid="text-current-plan">Starter</h2></div><span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700" data-testid="status-plan-billing">Active</span></div>
          <div className="mt-6 rounded-xl bg-[#F8F7FF] p-4"><div className="mb-3 flex items-center justify-between text-xs"><span className="font-bold text-[#312E81]">Monthly posts</span><span className="font-bold text-primary" data-testid="text-billing-usage">10 / 10</span></div><div className="h-2 overflow-hidden rounded-full bg-indigo-100"><div className="h-full w-full rounded-full bg-primary" /></div><p className="mt-3 text-[11px] text-muted-foreground">Your allowance resets on May 1, 2025.</p></div>
          <ul className="mt-6 space-y-3 text-xs font-medium text-[#312E81]"><li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> 10 scheduled posts each month</li><li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> 3 connected social accounts</li><li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Calendar planning view</li></ul>
        </section>

        <section className="rounded-2xl border border-indigo-100/80 bg-white p-6 cadence-shadow sm:p-7" data-testid="card-connected-accounts">
          <div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Channels</p><h2 className="mt-2 text-xl font-extrabold tracking-[-0.035em] text-[#312E81]">Connected accounts</h2></div><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><Check className="h-4 w-4" /></span></div>
          <div className="space-y-2.5">{connectedAccounts.map((account) => <div key={account.platform} className="flex items-center gap-3 rounded-xl border border-indigo-100/70 px-3 py-3" data-testid={`row-account-${account.platform.toLowerCase()}`}><span className={`flex h-8 w-8 items-center justify-center rounded-lg text-white ${account.color}`}><PlatformIcon platform={account.platform} className="h-4 w-4" /></span><div className="min-w-0"><p className="text-xs font-bold text-[#312E81]">{account.platform}</p><p className="truncate text-[11px] text-muted-foreground">{account.handle}</p></div><span className="ml-auto text-[10px] font-bold text-emerald-600">Connected</span></div>)}</div>
          <div className="mt-5 flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground" data-testid="text-billing-info"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> Account connections are shown for context. Payments and checkout are not enabled in this workspace.</div>
        </section>
      </div>
    </div>
  );
}