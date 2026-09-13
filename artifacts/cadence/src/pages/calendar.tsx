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
      <section className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-primary">Planning view</p>
          <h1 className="text-[30px] font-extrabold tracking-[-0.045em] text-[#312E81] sm:text-[36px]" data-testid="text-calendar-heading">Your content calendar</h1>
          <p className="mt-2 text-sm text-muted-foreground">A clear view of what&apos;s brewing and when it goes live.</p>
        </div>
        <Link href="/dashboard" className="inline-flex w-fit items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-[0_8px_18px_rgba(79,70,229,0.2)] transition-all hover:-translate-y-0.5 hover:bg-indigo-700" data-testid="button-calendar-schedule">
          <Plus className="h-4 w-4" /> Schedule a post
        </Link>
      </section>

      <div className="overflow-hidden rounded-2xl border border-indigo-100/80 bg-white cadence-shadow">
        <div className="flex flex-col justify-between gap-4 border-b border-indigo-100/80 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setMonthOffset((value) => Math.max(-1, value - 1))} className="flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-100 text-[#312E81] transition-colors hover:bg-indigo-50 disabled:opacity-40" disabled={monthOffset <= -1} aria-label="Previous month" data-testid="button-calendar-previous"><ChevronLeft className="h-4 w-4" /></button>
            <p className="min-w-[115px] text-center text-sm font-bold text-[#312E81]" data-testid="text-calendar-month">{monthLabel}</p>
            <button type="button" onClick={() => setMonthOffset((value) => Math.min(1, value + 1))} className="flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-100 text-[#312E81] transition-colors hover:bg-indigo-50 disabled:opacity-40" disabled={monthOffset >= 1} aria-label="Next month" data-testid="button-calendar-next"><ChevronRight className="h-4 w-4" /></button>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-semibold text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Scheduled</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Published</span>
          </div>
        </div>
        <div className="grid grid-cols-7 border-b border-indigo-100/80 bg-[#FCFCFB]">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <div key={day} className="px-2 py-3 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground sm:px-4" data-testid={`text-calendar-weekday-${day.toLowerCase()}`}>{day}</div>)}
        </div>
        {isApril ? (
          <div className="grid grid-cols-7">
            {weeks.flat().map((cell, index) => {
              const post = cell.outside ? undefined : postForDay(cell.day);
              return (
                <div key={`${cell.day}-${index}`} className={`min-h-[112px] border-b border-r border-indigo-100/70 p-2 last:border-r-0 sm:min-h-[145px] sm:p-3 ${cell.outside ? 'bg-[#FCFCFB]' : 'bg-white'}`} data-testid={`calendar-cell-${index}`}>
                  <div className={`mb-2 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${cell.today ? 'bg-primary text-white' : cell.outside ? 'text-indigo-200' : 'text-[#312E81]'}`} data-testid={`text-calendar-day-${index}`}>{cell.day}</div>
                  {post && (
                    <div className={`rounded-xl border p-2 ${post.status === 'Scheduled' ? 'border-indigo-100 bg-indigo-50/70' : 'border-emerald-100 bg-emerald-50/60'}`} data-testid={`calendar-post-${post.id}`}>
                      <div className="mb-1.5 flex items-center gap-1.5"><PlatformIcon platform={post.platform} className="h-3 w-3 text-primary" /><span className="truncate text-[9px] font-bold text-muted-foreground">{post.timeLabel}</span></div>
                      <p className="line-clamp-2 text-[10px] font-semibold leading-snug text-[#312E81]">{post.caption}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex min-h-[480px] flex-col items-center justify-center px-6 text-center" data-testid="empty-calendar-month">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-primary"><Clock3 className="h-5 w-5" /></div>
            <h2 className="text-base font-bold text-[#312E81]">A quiet month so far</h2>
            <p className="mt-1 max-w-xs text-sm leading-relaxed text-muted-foreground">Nothing is scheduled for {monthLabel}. Your next content moment can start here.</p>
            <Link href="/dashboard" className="mt-5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700" data-testid="link-empty-calendar-schedule">Go to overview</Link>
          </div>
        )}
      </div>
    </div>
  );
}