import { Check, Sparkles } from 'lucide-react';
import { Link } from 'wouter';
import { planFeatures } from '@/lib/cadence-data';

const plans = [
  { name: 'Starter', price: '$0', description: 'A simple rhythm for getting started.', tone: 'quiet', cta: 'Current plan' },
  { name: 'Pro', price: '$29', description: 'More room to build a consistent presence.', tone: 'featured', cta: 'View billing info' },
  { name: 'Business', price: '$79', description: 'A shared workspace for growing teams.', tone: 'quiet', cta: 'View billing info' },
] as const;

export default function Pricing() {
  return (
    <div className="mx-auto max-w-[1120px]">
      <section className="mx-auto mb-10 max-w-2xl text-center">
        <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-700"><Sparkles className="h-5 w-5" /></div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-primary">Plans that keep pace</p>
        <h1 className="text-[32px] font-extrabold tracking-[-0.05em] text-[#312E81] sm:text-[42px]" data-testid="text-pricing-heading">Leave room for good ideas.</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Start with a steady cadence. Move up when your content deserves more room, not because a dashboard told you to.</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => (
          <article key={plan.name} className={`relative flex flex-col rounded-2xl p-6 sm:p-7 ${plan.tone === 'featured' ? 'border-2 border-primary bg-[#312E81] text-white shadow-[0_16px_36px_rgba(49,46,129,0.2)]' : 'border border-indigo-100/80 bg-white text-[#312E81] cadence-shadow'}`} data-testid={`card-plan-${plan.name.toLowerCase()}`}>
            {plan.tone === 'featured' && <span className="absolute right-5 top-5 rounded-full bg-[#FCD34D] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#312E81]" data-testid="badge-recommended">Recommended</span>}
            <p className={`text-sm font-bold ${plan.tone === 'featured' ? 'text-indigo-200' : 'text-muted-foreground'}`}>{plan.name}</p>
            <div className="mt-6 flex items-baseline gap-1"><span className="text-4xl font-extrabold tracking-[-0.06em]" data-testid={`text-price-${plan.name.toLowerCase()}`}>{plan.price}</span><span className={`text-xs ${plan.tone === 'featured' ? 'text-indigo-200' : 'text-muted-foreground'}`}>/ month</span></div>
            <p className={`mt-3 min-h-[40px] text-sm leading-relaxed ${plan.tone === 'featured' ? 'text-indigo-100' : 'text-muted-foreground'}`}>{plan.description}</p>
            <div className={`my-6 h-px ${plan.tone === 'featured' ? 'bg-white/15' : 'bg-indigo-100'}`} />
            <ul className="space-y-3">
              {planFeatures[plan.name as keyof typeof planFeatures].map((feature) => <li key={feature} className={`flex items-start gap-2.5 text-xs font-medium ${plan.tone === 'featured' ? 'text-indigo-100' : 'text-[#312E81]'}`}><Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${plan.tone === 'featured' ? 'text-[#FCD34D]' : 'text-primary'}`} />{feature}</li>)}
            </ul>
            {plan.name === 'Starter' ? (
              <button type="button" disabled className="mt-8 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-xs font-bold text-primary disabled:cursor-not-allowed" data-testid="button-plan-starter">Current plan</button>
            ) : (
              <Link href="/billing" className={`mt-8 rounded-xl px-4 py-3 text-center text-xs font-bold transition-transform hover:-translate-y-0.5 ${plan.tone === 'featured' ? 'bg-white text-[#312E81]' : 'border border-indigo-200 text-primary hover:bg-indigo-50'}`} data-testid={`link-plan-${plan.name.toLowerCase()}`}>{plan.cta}</Link>
            )}
          </article>
        ))}
      </div>

      <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5 sm:flex-row sm:items-center sm:px-6" data-testid="status-pricing-note">
        <div><p className="text-sm font-bold text-[#312E81]">No contracts. No surprise invoices.</p><p className="mt-1 text-xs text-indigo-900/65">This workspace is showing plan information only. Nothing changes without your say-so.</p></div>
        <Link href="/billing" className="shrink-0 text-xs font-bold text-primary hover:text-indigo-800" data-testid="link-pricing-billing">See current billing status →</Link>
      </div>
    </div>
  );
}