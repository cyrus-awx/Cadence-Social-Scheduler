import { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock3, Plus } from 'lucide-react';
import { Link } from 'wouter';
import { PlatformIcon } from '@/components/platform-icon';
import { cadencePosts } from '@/lib/cadence-data';

type CalendarCell = { day: number; outside?: boolean; today?: boolean };

const weeks: CalendarCell[][] = [
  [{ day: 30, outside: true }, { day: 31, outside: true }, { day: 1 }, { day: 2 }, { day: 3 }, { day: 4 }, { day: 5 }],
  [{ day: 6 }, { day: 7 }, { day: 8 }, { day: 9 }, { day: 10 }, { day: 11 }, { day: 12 }],
  [{ day: 13 }, { day: 14 }, { day: 15 }, { day: 16 }, { day: 17 }, { day: 18, today: true }, { day: 19 }],
  [{ day: 20 }, { day: 21 }, { day: 22 }, { day: 23 }, { day: 24 }, { day: 25 }, { day: 26 }],
  [{ day: 27 }, { day: 28 }, { day: 29 }, { day: 30 }, { day: 1, outside: true }, { day: 2, outside: true }, { day: 3, outside: true }],
];

function postForDay(day: number) {
  return cadencePosts.find((post) => Number(post.scheduledFor.slice(-2)) === day);
}

export default function Calendar() {
  const [monthOffset, setMonthOffset] = useState(0);
  const monthLabel = monthOffset === 0 ? 'April 2025' : monthOffset < 0 ? 'March 2025' : 'May 2025';
  const isApril = monthOffset === 0;

  return (
    <div className="mx-auto max-w-[1320px]">
      <section className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#C2410C]">Planning view</p>
          <h1 className="text-[30px] font-extrabold tracking-[-0.05em] text-stone-900 sm:text-[36px]" data-testid="text-calendar-heading">Your content calendar</h1>
          <p className="mt-2 text-sm text-stone-500">A clear view of what&apos;s brewing and when it goes live.</p>
        </div>
        <Link href="/dashboard" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-[#C2410C] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#9a340a] sm:w-fit" data-testid="button-calendar-schedule">
          <Plus className="h-4 w-4" /> Schedule a post
        </Link>
      </section>

      <div className="overflow-hidden rounded-[10px] border border-stone-200 bg-white">
        <div className="flex flex-col justify-between gap-4 border-b border-stone-200 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setMonthOffset((value) => Math.max(-1, value - 1))} className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-stone-200 text-stone-600 transition-colors hover:bg-stone-50 disabled:opacity-40" disabled={monthOffset <= -1} aria-label="Previous month" data-testid="button-calendar-previous"><ChevronLeft className="h-4 w-4" /></button>
            <p className="min-w-[115px] text-center text-sm font-bold text-stone-900" data-testid="text-calendar-month">{monthLabel}</p>
            <button type="button" onClick={() => setMonthOffset((value) => Math.min(1, value + 1))} className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-stone-200 text-stone-600 transition-colors hover:bg-stone-50 disabled:opacity-40" disabled={monthOffset >= 1} aria-label="Next month" data-testid="button-calendar-next"><ChevronRight className="h-4 w-4" /></button>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-semibold text-stone-500">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-stone-300" /> Scheduled</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#C2410C]" /> Published</span>
          </div>
        </div>
        <div className="hidden grid-cols-7 border-b border-stone-200 bg-stone-50/50 lg:grid">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <div key={day} className="px-2 py-3 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 sm:px-4" data-testid={`text-calendar-weekday-${day.toLowerCase()}`}>{day}</div>)}
        </div>
        {isApril ? (
          <>
          <div className="divide-y divide-stone-200 lg:hidden" data-testid="calendar-agenda">
            {cadencePosts.map((post) => (
              <article key={post.id} className="flex gap-3 p-4 sm:p-5" data-testid={`calendar-agenda-post-${post.id}`}>
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] ${post.status === 'Published' ? 'bg-[#C2410C]/10 text-[#C2410C]' : 'bg-stone-100 text-stone-500'}`}>
                  <PlatformIcon platform={post.platform} className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="text-xs font-bold text-stone-900">{post.dateLabel}</p>
                    <span className="text-[11px] text-stone-500">{post.timeLabel}</span>
                    <span className={`ml-auto rounded-full px-2 py-1 text-[10px] font-bold ${post.status === 'Published' ? 'bg-[#C2410C]/10 text-[#C2410C]' : 'bg-stone-100 text-stone-600'}`}>{post.status}</span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-stone-700">{post.caption}</p>
                </div>
              </article>
            ))}
          </div>
          <div className="hidden grid-cols-7 lg:grid">
            {weeks.flat().map((cell, index) => {
              const post = cell.outside ? undefined : postForDay(cell.day);
              return (
                <div key={`${cell.day}-${index}`} className={`min-h-[120px] border-b border-r border-stone-200 p-2 last:border-r-0 sm:min-h-[145px] sm:p-3 ${cell.outside ? 'bg-stone-50/50' : 'bg-white'}`} data-testid={`calendar-cell-${index}`}>
                  <div className={`mb-2 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${cell.today ? 'bg-[#C2410C] text-white' : cell.outside ? 'text-stone-300' : 'text-stone-900'}`} data-testid={`text-calendar-day-${index}`}>{cell.day}</div>
                  {post && (
                    <div className={`rounded-[10px] border p-2 ${post.status === 'Scheduled' ? 'border-stone-200 bg-stone-50/80' : 'border-[#C2410C]/20 bg-[#C2410C]/5'}`} data-testid={`calendar-post-${post.id}`}>
                      <div className="mb-1.5 flex items-center gap-1.5"><PlatformIcon platform={post.platform} className={`h-3 w-3 ${post.status === 'Scheduled' ? 'text-stone-400' : 'text-[#C2410C]'}`} /><span className="truncate text-[9px] font-bold text-stone-500">{post.timeLabel}</span></div>
                      <p className="line-clamp-2 text-[10px] font-medium leading-snug text-stone-900">{post.caption}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          </>
        ) : (
          <div className="flex min-h-[480px] flex-col items-center justify-center px-6 text-center" data-testid="empty-calendar-month">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[10px] bg-stone-100 text-[#C2410C]"><Clock3 className="h-5 w-5" /></div>
            <h2 className="text-base font-bold text-stone-900">A quiet month so far</h2>
            <p className="mt-1 max-w-xs text-sm leading-relaxed text-stone-500">Nothing is scheduled for {monthLabel}. Your next content moment can start here.</p>
            <Link href="/dashboard" className="mt-6 rounded-[10px] bg-[#C2410C] px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#9a340a]" data-testid="link-empty-calendar-schedule">Go to overview</Link>
          </div>
        )}
      </div>
    </div>
  );
}
