import { Check, Sparkles } from 'lucide-react';
import { Link } from 'wouter';
import { planFeatures } from '@/lib/cadence-data';

const plans = [
  { name: 'Starter', price: '$0', description: 'A simple rhythm for getting started.', tone: 'quiet', cta: 'Current plan' },
  { name: 'Pro', price: '$29', description: 'More room to build a consistent presence.', tone: 'featured', cta: 'Upgrade to Pro' },
  { name: 'Business', price: '$79', description: 'A shared workspace for growing teams.', tone: 'quiet', cta: 'View billing info' },
] as const;

export default function Pricing() {
  return (
    <div className="mx-auto max-w-[1120px]">
      <section className="mx-auto mb-12 max-w-2xl text-center">
        <div className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-[10px] bg-stone-100 text-[#C2410C]"><Sparkles className="h-5 w-5" /></div>
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[#C2410C]">Plans that keep pace</p>
        <h1 className="text-[32px] font-extrabold tracking-[-0.05em] text-stone-900 sm:text-[42px]" data-testid="text-pricing-heading">Leave room for good ideas.</h1>
        <p className="mt-4 text-sm leading-relaxed text-stone-500">Start with a steady cadence. Move up when your content deserves more room, not because a dashboard told you to.</p>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => (
          <article key={plan.name} className={`relative flex flex-col rounded-[10px] p-6 sm:p-7 ${plan.tone === 'featured' ? 'border-2 border-[#C2410C] bg-[#C2410C] text-white' : 'border border-stone-200 bg-white text-stone-900'}`} data-testid={`card-plan-${plan.name.toLowerCase()}`}>
            {plan.tone === 'featured' && <span className="absolute right-5 top-5 rounded-[10px] bg-white/20 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.1em] text-white" data-testid="badge-recommended">Recommended</span>}
            <p className={`text-sm font-bold ${plan.tone === 'featured' ? 'text-white/80' : 'text-stone-500'}`}>{plan.name}</p>
            <div className="mt-6 flex items-baseline gap-1"><span className="text-4xl font-extrabold tracking-[-0.05em]" data-testid={`text-price-${plan.name.toLowerCase()}`}>{plan.price}</span><span className={`text-xs ${plan.tone === 'featured' ? 'text-white/70' : 'text-stone-400'}`}>/ month</span></div>
            <p className={`mt-3 min-h-[40px] text-sm leading-relaxed ${plan.tone === 'featured' ? 'text-white/90' : 'text-stone-500'}`}>{plan.description}</p>
            <div className={`my-6 h-px ${plan.tone === 'featured' ? 'bg-white/20' : 'bg-stone-200'}`} />
            <ul className="space-y-4">
              {planFeatures[plan.name as keyof typeof planFeatures].map((feature) => <li key={feature} className={`flex items-start gap-3 text-xs font-medium ${plan.tone === 'featured' ? 'text-white' : 'text-stone-700'}`}><Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${plan.tone === 'featured' ? 'text-white' : 'text-[#C2410C]'}`} />{feature}</li>)}
            </ul>
            {plan.name === 'Starter' ? (
              <button type="button" disabled className="mt-8 rounded-[10px] border border-stone-200 bg-stone-50 px-4 py-3 text-xs font-bold text-stone-400 disabled:cursor-not-allowed" data-testid="button-plan-starter">Current plan</button>
            ) : (
              <Link href={plan.name === 'Pro' ? '/billing?upgrade=pro' : '/billing'} className={`mt-8 rounded-[10px] px-4 py-3 text-center text-xs font-bold transition-colors ${plan.tone === 'featured' ? 'bg-white text-[#C2410C] hover:bg-stone-100' : 'border border-stone-200 text-[#C2410C] hover:bg-stone-50'}`} data-testid={`link-plan-${plan.name.toLowerCase()}`}>{plan.cta}</Link>
            )}
          </article>
        ))}
      </div>

      <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-[10px] border border-stone-200 bg-white p-5 sm:flex-row sm:items-center sm:px-6" data-testid="status-pricing-note">
        <div><p className="text-sm font-semibold text-stone-900">No contracts. No surprise invoices.</p><p className="mt-1 text-xs text-stone-500">This workspace is showing plan information only. Nothing changes without your say-so.</p></div>
        <Link href="/billing" className="shrink-0 text-xs font-bold text-[#C2410C] hover:text-[#9a340a]" data-testid="link-pricing-billing">See current billing status →</Link>
      </div>
    </div>
  );
}
