import { ArrowUpRight, ChevronRight, Sparkles } from 'lucide-react';
import { Link } from 'wouter';
import { PostCard } from '@/components/post-card';
import { cadencePosts, DEMO_TODAY } from '@/lib/cadence-data';

export default function Dashboard() {
  const scheduledPosts = cadencePosts.filter((post) => post.status === 'Scheduled');
  const publishedPosts = cadencePosts.filter((post) => post.status === 'Published');
  const today = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${DEMO_TODAY}T12:00:00Z`));

  return (
    <div className="mx-auto max-w-[1320px]">
      <section className="mb-12 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#C2410C]" data-testid="text-greeting-eyebrow">{today}</p>
          <h1 className="text-[30px] font-extrabold tracking-[-0.05em] text-stone-900 sm:text-[36px]" data-testid="text-dashboard-heading">Northstar&apos;s sample workspace</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-stone-500" data-testid="text-dashboard-subheading">A read-only product sample using fictional April 2025 content. No social accounts are connected and no posts will publish.</p>
        </div>
        <span className="rounded-[10px] border border-stone-200 bg-white px-4 py-3 text-xs font-semibold text-stone-600">Read-only demo</span>
      </section>

      <section className="mb-12 grid grid-cols-2 gap-x-4 gap-y-7 border-b border-stone-200 pb-10 xl:grid-cols-4">
        <div className="flex flex-col">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-stone-500">Posts coming up</p>
          <p className="mt-2 text-4xl font-extrabold tracking-[-0.05em] text-stone-900" data-testid="text-scheduled-count">{scheduledPosts.length}</p>
          <p className="mt-2 text-xs text-stone-400">Sample April schedule</p>
        </div>
        <div className="flex flex-col">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-stone-500">Published this month</p>
          <p className="mt-2 text-4xl font-extrabold tracking-[-0.05em] text-stone-900" data-testid="text-published-count">{publishedPosts.length}</p>
          <p className="mt-2 text-xs text-stone-400">Fictional sample results</p>
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
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-stone-500">Sample profiles</p>
          <p className="mt-2 text-4xl font-extrabold tracking-[-0.05em] text-stone-900" data-testid="text-connected-count">3</p>
          <p className="mt-2 text-xs text-stone-400">No live connections</p>
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
        <span><strong className="font-semibold text-stone-900">Sample data only.</strong> Connect real providers and add publishing infrastructure before scheduling real content.</span>
        <Link href="/billing" className="mt-2 flex shrink-0 items-center gap-1 font-bold text-[#C2410C] hover:text-[#9a340a] sm:mt-0 sm:ml-auto" data-testid="link-manage-accounts">Sandbox billing <ChevronRight className="h-3.5 w-3.5" /></Link>
      </div>
    </div>
  );
}
