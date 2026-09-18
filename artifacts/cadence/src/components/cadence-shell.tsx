import { useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { Bell, CalendarDays, ChevronDown, CreditCard, LayoutDashboard, RotateCcw, Settings2, Sparkles } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, testId: 'link-nav-dashboard' },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays, testId: 'link-nav-calendar' },
];

type CadenceShellProps = {
  children: ReactNode;
};

export function CadenceShell({ children }: CadenceShellProps) {
  const [location] = useLocation();
  const queryClient = useQueryClient();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const billingQuery = useQuery({
    queryKey: ['billing-status'],
    queryFn: async () => {
      const response = await fetch('/api/billing/status', { credentials: 'include' });
      if (!response.ok) throw new Error('Could not load billing status');
      return response.json() as Promise<{ plan: 'starter' | 'pro'; status: string }>;
    },
  });
  const isPro = billingQuery.data?.plan === 'pro' && billingQuery.data.status === 'active';
  const resetBilling = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/billing/reset-demo', {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({})) as { message?: string };
        throw new Error(payload.message ?? 'Could not reset demo billing');
      }
      return response.json() as Promise<{ plan: 'starter' | 'pro'; status: string }>;
    },
    onSuccess: (status) => {
      queryClient.setQueryData(['billing-status'], status);
      setAccountOpen(false);
      window.location.assign('/billing');
    },
    onError: (error) => {
      window.alert(error instanceof Error ? error.message : 'Could not reset demo billing');
    },
  });

  return (
    <div className="min-h-[100dvh] bg-background pb-[calc(72px+env(safe-area-inset-bottom))] text-stone-900 lg:pb-0">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[246px] flex-col border-r border-stone-200 bg-background px-5 py-7 text-stone-900 lg:flex">
        <Link href="/dashboard" className="mb-11 flex items-center gap-2.5 px-2" data-testid="link-wordmark">
          <span className="relative flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#C2410C] text-white">
            <span className="absolute h-3.5 w-3.5 rounded-full border-[2.5px] border-current" />
            <span className="absolute -right-0.5 top-1.5 h-2 w-2 rounded-full bg-[#C2410C] ring-2 ring-background" />
          </span>
          <span className="text-[19px] font-extrabold tracking-[-0.05em]">Cadence</span>
        </Link>

        <Link href="/dashboard" className="mb-8 flex items-center gap-3 rounded-[10px] border border-stone-200 bg-white px-3 py-3 text-left transition-colors hover:bg-stone-50" data-testid="link-workspace">
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#C2410C] text-xs font-extrabold text-white">NR</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-stone-900">Northstar Roasters</span>
            <span className="mt-0.5 block text-[11px] text-stone-500">Read-only sample</span>
          </span>
          <ChevronDown className="h-4 w-4 text-stone-400" />
        </Link>

        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">Workspace</p>
        <nav className="space-y-1" aria-label="Primary navigation">
          {navItems.map(({ href, label, icon: Icon, testId }) => {
            const active = location === href || (href === '/dashboard' && location === '/');
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13px] font-semibold transition-colors ${active ? 'bg-[#C2410C] text-white' : 'text-stone-600 hover:bg-stone-200/50 hover:text-stone-900'}`}
                data-testid={testId}
              >
                <Icon className="h-[17px] w-[17px]" strokeWidth={active ? 2.5 : 2} />
                {label}
              </Link>
            );
          })}
        </nav>

        <p className="mb-3 mt-8 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">Account</p>
        <nav className="space-y-1">
          <Link href="/pricing" className={`flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13px] font-semibold transition-colors ${location === '/pricing' ? 'bg-[#C2410C] text-white' : 'text-stone-600 hover:bg-stone-200/50 hover:text-stone-900'}`} data-testid="link-nav-pricing">
            <Sparkles className="h-[17px] w-[17px]" strokeWidth={location === '/pricing' ? 2.5 : 2} />
            Plans &amp; pricing
          </Link>
          <Link href="/billing" className={`flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13px] font-semibold transition-colors ${location === '/billing' ? 'bg-[#C2410C] text-white' : 'text-stone-600 hover:bg-stone-200/50 hover:text-stone-900'}`} data-testid="link-nav-billing">
            <CreditCard className="h-[17px] w-[17px]" strokeWidth={location === '/billing' ? 2.5 : 2} />
            Billing
          </Link>
        </nav>

        <div className="mt-auto rounded-[10px] border border-stone-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-stone-600">{isPro ? 'Pro plan' : 'Starter plan'}</span>
            <span className="rounded-full bg-[#C2410C]/10 px-2 py-0.5 text-[10px] font-bold text-[#C2410C]">{isPro ? 'Unlocked' : 'Sample'}</span>
          </div>
          <p className="mb-3 text-[11px] leading-relaxed text-stone-500">{isPro ? 'One-time sandbox payment confirmed.' : 'No live scheduling or social connections.'}</p>
          <Link href={isPro ? '/billing' : '/pricing'} className="flex items-center justify-center gap-2 rounded-[10px] border border-stone-200 bg-stone-50 px-3 py-2 text-[11px] font-bold text-stone-900 transition-colors hover:bg-stone-100" data-testid="link-sidebar-upgrade">
            <Sparkles className="h-3.5 w-3.5" />
            {isPro ? 'View payment' : 'See samples'}
          </Link>
        </div>
      </aside>

      <div className="lg:pl-[246px]">
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-stone-200 bg-background/90 px-5 backdrop-blur-md sm:px-8 lg:px-11">
          <div className="flex items-center gap-3 lg:hidden">
            <Link href="/dashboard" className="flex items-center gap-2" data-testid="link-mobile-wordmark">
              <span className="flex h-7 w-7 items-center justify-center rounded-[10px] bg-[#C2410C] text-white"><span className="h-3 w-3 rounded-full border-2 border-white" /></span>
              <span className="font-extrabold tracking-[-0.05em] text-stone-900">Cadence</span>
            </Link>
          </div>
          <div className="hidden text-sm font-medium text-stone-500 lg:block">
            <span className="text-stone-900">Northstar Roasters</span>
            <span className="mx-2 text-stone-300">/</span>
            <span>{location === '/calendar' ? 'Calendar' : location === '/pricing' ? 'Plans & pricing' : location === '/billing' ? 'Billing' : 'Overview'}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <button type="button" className="relative flex h-11 w-11 items-center justify-center rounded-[10px] text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C2410C]" onClick={() => { setNotificationsOpen((open) => !open); setAccountOpen(false); }} aria-label="Open notifications" aria-expanded={notificationsOpen} aria-controls="notifications-panel" data-testid="button-notifications">
                <Bell className="h-[18px] w-[18px]" />
                <span className="absolute right-2 top-1.5 h-1.5 w-1.5 rounded-full bg-[#C2410C]" />
              </button>
              {notificationsOpen && (
                <div id="notifications-panel" className="absolute right-0 top-12 w-[min(16rem,calc(100vw-2rem))] rounded-[10px] border border-stone-200 bg-white p-4 shadow-lg" data-testid="panel-notifications">
                  <p className="text-xs font-bold text-stone-900">Sample notification</p>
                  <p className="mt-1 text-xs leading-relaxed text-stone-500">The fictional calendar shows a post on Friday at 8:30 AM. Nothing will publish.</p>
                </div>
              )}
            </div>
            <div className="relative">
              <button type="button" className="flex min-h-11 items-center gap-2 rounded-[10px] py-1 pl-1 pr-2 transition-colors hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C2410C]" onClick={() => { setAccountOpen((open) => !open); setNotificationsOpen(false); }} aria-expanded={accountOpen} aria-controls="account-menu-panel" data-testid="button-account-menu">
                <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#C2410C] text-[11px] font-extrabold text-white">MC</span>
                <span className="hidden text-left sm:block"><span className="block text-xs font-bold text-stone-900">Maya Chen</span><span className="block text-[10px] text-stone-500">Owner</span></span>
                <ChevronDown className="hidden h-3.5 w-3.5 text-stone-400 sm:block" />
              </button>
              {accountOpen && (
                <div id="account-menu-panel" className="absolute right-0 top-12 w-[min(12rem,calc(100vw-2rem))] rounded-[10px] border border-stone-200 bg-white p-2 shadow-lg" data-testid="panel-account-menu">
                  <Link href="/billing" className="flex items-center gap-2 rounded-[10px] px-3 py-2.5 text-xs font-semibold text-stone-900 hover:bg-stone-50" data-testid="link-account-billing"><CreditCard className="h-4 w-4" /> Billing</Link>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-[10px] px-3 py-2.5 text-left text-xs font-semibold text-[#C2410C] hover:bg-[#C2410C]/5 disabled:cursor-wait disabled:opacity-60"
                    onClick={() => resetBilling.mutate()}
                    disabled={resetBilling.isPending}
                    data-testid="button-reset-demo-billing"
                  >
                    <RotateCcw className="h-4 w-4" />
                    {resetBilling.isPending ? 'Resetting…' : 'Reset billing demo'}
                  </button>
                  <button type="button" className="flex w-full items-center gap-2 rounded-[10px] px-3 py-2.5 text-left text-xs font-semibold text-stone-500 hover:bg-stone-50" onClick={() => setAccountOpen(false)} data-testid="button-close-account-menu"><Settings2 className="h-4 w-4" /> Close menu</button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="cadence-page-enter px-5 py-8 sm:px-8 lg:px-11 lg:py-10">{children}</main>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-stone-200 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
        <nav className="flex h-[72px] items-center justify-around px-2" aria-label="Mobile navigation">
          {navItems.map(({ href, label, icon: Icon, testId }) => {
            const active = location === href || (href === '/dashboard' && location === '/');
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center justify-center gap-1.5 w-16 h-full ${active ? 'text-[#C2410C]' : 'text-stone-500 hover:text-stone-900'}`}
                data-testid={`mobile-${testId}`}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                <span className="text-[10px] font-bold">{label}</span>
              </Link>
            );
          })}
          
          <Link href="/pricing" className={`flex flex-col items-center justify-center gap-1.5 w-16 h-full ${location === '/pricing' ? 'text-[#C2410C]' : 'text-stone-500 hover:text-stone-900'}`} data-testid="mobile-link-nav-pricing">
             <Sparkles className="h-5 w-5" strokeWidth={location === '/pricing' ? 2.5 : 2} />
             <span className="text-[10px] font-bold">Pricing</span>
          </Link>

          <Link href="/billing" className={`flex flex-col items-center justify-center gap-1.5 w-16 h-full ${location === '/billing' ? 'text-[#C2410C]' : 'text-stone-500 hover:text-stone-900'}`} data-testid="mobile-link-nav-billing">
             <CreditCard className="h-5 w-5" strokeWidth={location === '/billing' ? 2.5 : 2} />
             <span className="text-[10px] font-bold">Billing</span>
          </Link>
        </nav>
      </div>
    </div>
  );
}
