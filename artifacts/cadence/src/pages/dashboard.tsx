import { useState } from 'react';
import { ArrowUpRight, ChevronRight, Plus, Sparkles } from 'lucide-react';
import { Link } from 'wouter';
import { PostCard } from '@/components/post-card';
import { cadencePosts } from '@/lib/cadence-data';

export default function Dashboard() {
  const [showLimitMessage, setShowLimitMessage] = useState(false);
  const scheduledPosts = cadencePosts.filter((post) => post.status === 'Scheduled');
  const publishedPosts = cadencePosts.filter((post) => post.status === 'Published');
  const now = new Date();
  const today = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(now);
  const greeting =
    now.getHours() < 12
      ? 'Good morning'
      : now.getHours() < 18
        ? 'Good afternoon'
        : 'Good evening';

  return (
    <div className="mx-auto max-w-[1320px]">
      <section className="mb-12 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#C2410C]" data-testid="text-greeting-eyebrow">{today}</p>
          <h1 className="text-[30px] font-extrabold tracking-[-0.05em] text-stone-900 sm:text-[36px]" data-testid="text-dashboard-heading">{greeting}, Maya.</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-stone-500" data-testid="text-dashboard-subheading">Your week is in a good rhythm. Here&apos;s what&apos;s ready to meet the world.</p>
        </div>
        <button type="button" onClick={() => setShowLimitMessage(true)} className="inline-flex w-fit items-center justify-center gap-2 rounded-[10px] bg-[#C2410C] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#9a340a]" data-testid="button-schedule-new-post">
          <Plus className="h-4 w-4" />
          Schedule a post
        </button>
      </section>

      {showLimitMessage && (
        <div className="mb-9 flex flex-col gap-4 rounded-[10px] border border-stone-200 bg-stone-50 p-4 sm:flex-row sm:items-center sm:justify-between" data-testid="alert-post-limit">
          <div>
            <p className="text-sm font-semibold text-stone-900">You&apos;ve used all 10 posts on Starter. Upgrade to keep scheduling.</p>
            <p className="mt-1 text-xs text-stone-500">Your current posts will stay published and on schedule.</p>
          </div>
          <Link href="/billing?upgrade=pro" className="shrink-0 rounded-[10px] bg-[#C2410C] px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#9a340a]" data-testid="button-upgrade-pro">Upgrade to Pro</Link>
        </div>
      )}

      <section className="mb-12 grid gap-6 border-b border-stone-200 pb-10 sm:grid-cols-2 xl:grid-cols-4">
        <div className="flex flex-col">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-stone-500">Posts coming up</p>
          <p className="mt-2 text-4xl font-extrabold tracking-[-0.05em] text-stone-900" data-testid="text-scheduled-count">{scheduledPosts.length}</p>
          <p className="mt-2 text-xs text-stone-400">Across the next 7 days</p>
        </div>
        <div className="flex flex-col">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-stone-500">Published this month</p>
          <p className="mt-2 text-4xl font-extrabold tracking-[-0.05em] text-stone-900" data-testid="text-published-count">{publishedPosts.length}</p>
          <p className="mt-2 text-xs text-stone-400">Your most consistent month yet</p>
        </div>
        <div className="flex flex-col">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-stone-500">Engagement rate</p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-4xl font-extrabold tracking-[-0.05em] text-stone-900" data-testid="text-engagement-rate">4.8%</p>
            <span className="text-xs font-bold text-[#C2410C]">+1.2%</span>
          </div>
          <p className="mt-2 text-xs text-stone-400">Across all published posts</p>
        </div>
        <div className="flex flex-col">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-stone-500">Connected accounts</p>
          <p className="mt-2 text-4xl font-extrabold tracking-[-0.05em] text-stone-900" data-testid="text-connected-count">3</p>
          <p className="mt-2 text-xs text-stone-400">Instagram, LinkedIn, and X</p>
        </div>
      </section>

      <section className="mb-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#C2410C]">Next up</p>
            <h2 className="mt-1 text-xl font-extrabold tracking-[-0.05em] text-stone-900" data-testid="text-upcoming-heading">Posts with a pulse</h2>
          </div>
          <Link href="/calendar" className="flex items-center gap-1 text-xs font-bold text-[#C2410C] transition-colors hover:text-[#9a340a]" data-testid="link-view-calendar">View calendar <ArrowUpRight className="h-3.5 w-3.5" /></Link>
        </div>
        <div className="flex flex-col">
          {scheduledPosts.map((post) => <PostCard key={post.id} post={post} />)}
        </div>
      </section>

      <section>
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#C2410C]">Archive</p>
            <h2 className="mt-1 text-xl font-extrabold tracking-[-0.05em] text-stone-900" data-testid="text-recent-heading">Recently published</h2>
          </div>
          <span className="text-xs font-medium text-stone-500" data-testid="text-archive-count">{publishedPosts.length} posts in April</span>
        </div>
        <div className="flex flex-col">
          {publishedPosts.slice(0, 4).map((post) => <PostCard key={post.id} post={post} />)}
        </div>
      </section>

      <div className="mt-12 flex flex-col gap-3 rounded-[10px] border border-stone-200 bg-stone-50 px-5 py-4 text-sm text-stone-600 sm:flex-row sm:items-center sm:gap-2" data-testid="status-connected-accounts">
        <Sparkles className="h-4 w-4 shrink-0 text-[#C2410C]" />
        <span><strong className="font-semibold text-stone-900">3 accounts connected.</strong> Cadence is ready when your next month starts.</span>
        <Link href="/billing" className="mt-2 flex shrink-0 items-center gap-1 font-bold text-[#C2410C] hover:text-[#9a340a] sm:mt-0 sm:ml-auto" data-testid="link-manage-accounts">Manage <ChevronRight className="h-3.5 w-3.5" /></Link>
      </div>
    </div>
  );
}
