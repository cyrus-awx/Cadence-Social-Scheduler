import { useState } from 'react';
import { ArrowUpRight, CalendarDays, Check, ChevronRight, CircleAlert, Link2, Plus, Sparkles, TrendingUp } from 'lucide-react';
import { Link } from 'wouter';
import { PostCard } from '@/components/post-card';
import { cadencePosts } from '@/lib/cadence-data';

export default function Dashboard() {
  const [showLimitMessage, setShowLimitMessage] = useState(false);
  const scheduledPosts = cadencePosts.filter((post) => post.status === 'Scheduled');
  const publishedPosts = cadencePosts.filter((post) => post.status === 'Published');

  return (
    <div className="mx-auto max-w-[1320px]">
      <section className="mb-9 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-primary" data-testid="text-greeting-eyebrow">Friday, April 18, 2025</p>
          <h1 className="text-[30px] font-extrabold tracking-[-0.045em] text-[#312E81] sm:text-[36px]" data-testid="text-dashboard-heading">Good morning, Maya.</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground" data-testid="text-dashboard-subheading">Your week is in a good rhythm. Here&apos;s what&apos;s ready to meet the world.</p>
        </div>
        <button type="button" onClick={() => setShowLimitMessage(true)} className="inline-flex w-fit items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-[0_8px_18px_rgba(79,70,229,0.2)] transition-all hover:-translate-y-0.5 hover:bg-indigo-700 active:translate-y-0" data-testid="button-schedule-new-post">
          <Plus className="h-4 w-4" />
          Schedule a post
        </button>
      </section>

      {showLimitMessage && (
        <div className="mb-7 flex flex-col gap-4 rounded-2xl border border-amber-200 bg-[#FFFBEB] p-4 sm:flex-row sm:items-center sm:justify-between" data-testid="alert-post-limit">
          <div className="flex items-start gap-3">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-bold text-amber-950">You&apos;ve used all 10 posts on Starter. Upgrade to keep scheduling.</p>
              <p className="mt-1 text-xs text-amber-800/75">Your current posts will stay published and on schedule.</p>
            </div>
          </div>
          <button type="button" className="shrink-0 rounded-lg bg-[#312E81] px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-indigo-900" onClick={() => undefined} data-testid="button-upgrade-pro">Upgrade to Pro</button>
        </div>
      )}

      <section className="mb-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-indigo-100/80 bg-white p-6 cadence-shadow">
          <div className="flex items-start justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-primary"><CalendarDays className="h-[18px] w-[18px]" /></span>
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600"><TrendingUp className="h-3.5 w-3.5" /> 18%</span>
          </div>
          <p className="mt-7 text-3xl font-extrabold tracking-[-0.05em] text-[#312E81]" data-testid="text-scheduled-count">{scheduledPosts.length}</p>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">Posts coming up</p>
          <p className="mt-2 text-[11px] text-muted-foreground">Across the next 7 days</p>
        </div>
        <div className="rounded-2xl border border-indigo-100/80 bg-white p-6 cadence-shadow">
          <div className="flex items-start justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><Check className="h-[18px] w-[18px]" /></span>
            <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">On track</span>
          </div>
          <p className="mt-7 text-3xl font-extrabold tracking-[-0.05em] text-[#312E81]" data-testid="text-published-count">{publishedPosts.length}</p>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">Published this month</p>
          <p className="mt-2 text-[11px] text-muted-foreground">Your most consistent month yet</p>
        </div>
        <div className="rounded-2xl border border-indigo-100/80 bg-white p-6 cadence-shadow">
          <div className="flex items-start justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700"><TrendingUp className="h-[18px] w-[18px]" /></span>
            <span className="text-[11px] font-bold text-emerald-600">+1.2%</span>
          </div>
          <p className="mt-7 text-3xl font-extrabold tracking-[-0.05em] text-[#312E81]" data-testid="text-engagement-rate">4.8%</p>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">Engagement rate</p>
          <p className="mt-2 text-[11px] text-muted-foreground">Across all published posts</p>
        </div>
        <div className="rounded-2xl border border-indigo-100/80 bg-white p-6 cadence-shadow">
          <div className="flex items-start justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-primary"><Link2 className="h-[18px] w-[18px]" /></span>
            <span className="rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-bold text-primary">Healthy</span>
          </div>
          <p className="mt-7 text-3xl font-extrabold tracking-[-0.05em] text-[#312E81]" data-testid="text-connected-count">3</p>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">Connected accounts</p>
          <p className="mt-2 text-[11px] text-muted-foreground">Instagram, LinkedIn, and X</p>
        </div>
      </section>

      <section className="mb-9 rounded-2xl bg-[#312E81] p-5 text-white shadow-[0_12px_30px_rgba(49,46,129,0.16)] sm:flex sm:items-center sm:justify-between sm:p-6" data-testid="card-plan-usage">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold text-amber-200" data-testid="status-plan">Starter</span>
            <p className="text-xs font-semibold text-indigo-200">April posting allowance</p>
          </div>
          <div className="mt-3 flex items-end gap-2">
            <p className="text-3xl font-extrabold tracking-[-0.05em]" data-testid="text-posts-used">10 of 10</p>
            <p className="mb-1 text-xs text-indigo-200">posts used</p>
          </div>
        </div>
        <div className="mt-4 w-full sm:mt-0 sm:max-w-[240px]">
          <div className="h-2 overflow-hidden rounded-full bg-indigo-950/60" data-testid="progress-post-usage"><div className="h-full w-full rounded-full bg-[#FCD34D]" /></div>
          <p className="mt-2 text-right text-[11px] text-indigo-200">Refreshes May 1, 2025</p>
        </div>
      </section>

      <section className="mb-9">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Next up</p>
            <h2 className="mt-1 text-xl font-extrabold tracking-[-0.035em] text-[#312E81]" data-testid="text-upcoming-heading">Posts with a pulse</h2>
          </div>
          <Link href="/calendar" className="flex items-center gap-1 text-xs font-bold text-primary transition-colors hover:text-indigo-800" data-testid="link-view-calendar">View calendar <ArrowUpRight className="h-3.5 w-3.5" /></Link>
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          {scheduledPosts.map((post) => <PostCard key={post.id} post={post} />)}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Archive</p>
            <h2 className="mt-1 text-xl font-extrabold tracking-[-0.035em] text-[#312E81]" data-testid="text-recent-heading">Recently published</h2>
          </div>
          <span className="text-xs font-medium text-muted-foreground" data-testid="text-archive-count">{publishedPosts.length} posts in April</span>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {publishedPosts.slice(0, 4).map((post) => <PostCard key={post.id} post={post} />)}
        </div>
      </section>

      <div className="mt-8 flex items-center gap-2 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/50 px-4 py-3 text-xs text-indigo-900/70" data-testid="status-connected-accounts">
        <Sparkles className="h-4 w-4 text-primary" />
        <span><strong className="font-bold">3 accounts connected.</strong> Cadence is ready when your next month starts.</span>
        <Link href="/billing" className="ml-auto flex shrink-0 items-center gap-1 font-bold text-primary hover:text-indigo-800" data-testid="link-manage-accounts">Manage <ChevronRight className="h-3.5 w-3.5" /></Link>
      </div>
    </div>
  );
}