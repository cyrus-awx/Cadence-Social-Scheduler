import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { Bell, CalendarDays, ChevronDown, CreditCard, LayoutDashboard, Plus, Settings2, Sparkles } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, testId: 'link-nav-dashboard' },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays, testId: 'link-nav-calendar' },
];

type CadenceShellProps = {
  children: ReactNode;
};

export function CadenceShell({ children }: CadenceShellProps) {
  const [location] = useLocation();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[246px] flex-col bg-[#312E81] px-5 py-7 text-white shadow-[8px_0_30px_rgba(49,46,129,0.08)] md:flex">
        <Link href="/dashboard" className="mb-11 flex items-center gap-2.5 px-2" data-testid="link-wordmark">
          <span className="relative flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#FCD34D] text-[#312E81]">
            <span className="absolute h-3.5 w-3.5 rounded-full border-[2.5px] border-current" />
            <span className="absolute -right-0.5 top-1.5 h-2 w-2 rounded-full bg-[#FCD34D] ring-2 ring-[#312E81]" />
          </span>
          <span className="text-[19px] font-extrabold tracking-[-0.04em]">Cadence</span>
        </Link>

        <Link href="/dashboard" className="mb-8 flex items-center gap-3 rounded-xl bg-white/10 px-3 py-3 text-left transition-colors hover:bg-white/[0.16]" data-testid="link-workspace">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FCD34D] text-xs font-extrabold text-[#312E81]">NR</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">Northstar Roasters</span>
            <span className="mt-0.5 block text-[11px] text-indigo-200">Maya&apos;s workspace</span>
          </span>
          <ChevronDown className="h-4 w-4 text-indigo-200" />
        </Link>

        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.17em] text-indigo-200/70">Workspace</p>
        <nav className="space-y-1" aria-label="Primary navigation">
          {navItems.map(({ href, label, icon: Icon, testId }) => {
            const active = location === href || (href === '/dashboard' && location === '/');
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all ${active ? 'bg-white text-[#312E81] shadow-sm' : 'text-indigo-100 hover:bg-white/10 hover:text-white'}`}
                data-testid={testId}
              >
                <Icon className="h-[17px] w-[17px]" strokeWidth={active ? 2.5 : 2} />
                {label}
              </Link>
            );
          })}
        </nav>

        <p className="mb-3 mt-8 px-3 text-[10px] font-bold uppercase tracking-[0.17em] text-indigo-200/70">Account</p>
        <nav className="space-y-1">
          <Link href="/pricing" className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-colors ${location === '/pricing' ? 'bg-white text-[#312E81]' : 'text-indigo-100 hover:bg-white/10 hover:text-white'}`} data-testid="link-nav-pricing">
            <Sparkles className="h-[17px] w-[17px]" />
            Plans &amp; pricing
          </Link>
          <Link href="/billing" className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-colors ${location === '/billing' ? 'bg-white text-[#312E81]' : 'text-indigo-100 hover:bg-white/10 hover:text-white'}`} data-testid="link-nav-billing">
            <CreditCard className="h-[17px] w-[17px]" />
            Billing
          </Link>
        </nav>

        <div className="mt-auto rounded-2xl bg-[#26236B] p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-indigo-100">Starter plan</span>
            <span className="rounded-full bg-[#FCD34D] px-2 py-0.5 text-[10px] font-bold text-[#312E81]">10 / 10</span>
          </div>
          <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-indigo-950/60">
            <div className="h-full w-full rounded-full bg-[#FCD34D]" />
          </div>
          <p className="mb-3 text-[11px] leading-relaxed text-indigo-200">You&apos;re at your monthly limit.</p>
          <Link href="/pricing" className="flex items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-[11px] font-bold text-[#312E81] transition-transform hover:-translate-y-0.5" data-testid="link-sidebar-upgrade">
            <Sparkles className="h-3.5 w-3.5" />
            See Pro
          </Link>
        </div>
      </aside>

      <div className="md:pl-[246px]">
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-indigo-100/70 bg-background/90 px-5 backdrop-blur-md sm:px-8 lg:px-11">
          <div className="flex items-center gap-3 md:hidden">
            <Link href="/dashboard" className="flex items-center gap-2" data-testid="link-mobile-wordmark">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white"><span className="h-3 w-3 rounded-full border-2 border-white" /></span>
              <span className="font-extrabold tracking-[-0.04em] text-[#312E81]">Cadence</span>
            </Link>
          </div>
          <div className="hidden text-sm font-medium text-muted-foreground md:block">
            <span className="text-[#312E81]">Northstar Roasters</span>
            <span className="mx-2 text-indigo-200">/</span>
            <span>{location === '/calendar' ? 'Calendar' : location === '/pricing' ? 'Plans & pricing' : location === '/billing' ? 'Billing' : 'Overview'}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <button type="button" className="relative flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-indigo-50 hover:text-primary" onClick={() => setNotificationsOpen((open) => !open)} aria-label="Open notifications" data-testid="button-notifications">
                <Bell className="h-[18px] w-[18px]" />
                <span className="absolute right-2 top-1.5 h-1.5 w-1.5 rounded-full bg-[#F59E0B]" />
              </button>
              {notificationsOpen && (
                <div className="absolute right-0 top-11 w-64 rounded-2xl border border-indigo-100 bg-white p-4 cadence-shadow" data-testid="panel-notifications">
                  <p className="text-xs font-bold text-[#312E81]">You&apos;re all caught up</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Your next post is queued for Friday at 8:30 AM.</p>
                </div>
              )}
            </div>
            <div className="relative">
              <button type="button" className="flex items-center gap-2 rounded-xl py-1 pl-1 pr-2 transition-colors hover:bg-indigo-50" onClick={() => setAccountOpen((open) => !open)} data-testid="button-account-menu">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FDE68A] text-[11px] font-extrabold text-[#312E81]">MC</span>
                <span className="hidden text-left sm:block"><span className="block text-xs font-bold text-[#312E81]">Maya Chen</span><span className="block text-[10px] text-muted-foreground">Owner</span></span>
                <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
              </button>
              {accountOpen && (
                <div className="absolute right-0 top-11 w-48 rounded-2xl border border-indigo-100 bg-white p-2 cadence-shadow" data-testid="panel-account-menu">
                  <Link href="/billing" className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-[#312E81] hover:bg-indigo-50" data-testid="link-account-billing"><CreditCard className="h-4 w-4" /> Billing</Link>
                  <button type="button" className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground hover:bg-indigo-50" onClick={() => setAccountOpen(false)} data-testid="button-close-account-menu"><Settings2 className="h-4 w-4" /> Close menu</button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="cadence-page-enter px-5 py-8 sm:px-8 lg:px-11 lg:py-10">{children}</main>
      </div>

      <Link href="/dashboard" className="fixed bottom-5 right-5 z-20 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-[0_10px_24px_rgba(79,70,229,0.28)] transition-transform hover:-translate-y-1 md:hidden" aria-label="Schedule a post" data-testid="button-mobile-schedule">
        <Plus className="h-5 w-5" />
      </Link>
    </div>
  );
}