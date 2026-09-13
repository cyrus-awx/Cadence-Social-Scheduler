import { useState } from 'react';
import { Clock3, MoreHorizontal } from 'lucide-react';
import { PlatformIcon } from '@/components/platform-icon';
import type { CadencePost } from '@/lib/cadence-data';

type PostCardProps = {
  post: CadencePost;
};

const colorStyles = {
  indigo: 'bg-indigo-50 text-indigo-600',
  amber: 'bg-amber-50 text-amber-700',
  teal: 'bg-teal-50 text-teal-700',
  rose: 'bg-rose-50 text-rose-600',
};

export function PostCard({ post }: PostCardProps) {
  const [optionsOpen, setOptionsOpen] = useState(false);

  return (
    <article className="group flex gap-4 rounded-2xl border border-indigo-100/80 bg-white p-4 cadence-shadow-hover" data-testid={`card-post-${post.id}`}>
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${colorStyles[post.color]}`} data-testid={`icon-post-${post.id}`}>
        <PlatformIcon platform={post.platform} className="h-[18px] w-[18px]" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-start justify-between gap-3">
          <p className="truncate text-[11px] font-bold uppercase tracking-[0.09em] text-muted-foreground">{post.platform}</p>
          <div className="relative">
            <button type="button" className="rounded-lg p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-indigo-50 hover:text-primary group-hover:opacity-100" onClick={() => setOptionsOpen((open) => !open)} aria-label={`More options for ${post.id}`} data-testid={`button-post-options-${post.id}`}><MoreHorizontal className="h-4 w-4" /></button>
            {optionsOpen && <div className="absolute right-0 top-8 z-10 w-44 rounded-xl border border-indigo-100 bg-white p-3 text-[11px] leading-relaxed text-muted-foreground cadence-shadow" data-testid={`panel-post-options-${post.id}`}>Post details are read-only in this workspace.</div>}
          </div>
        </div>
        <p className="line-clamp-2 text-sm font-medium leading-relaxed text-[#312E81]" data-testid={`text-post-caption-${post.id}`}>{post.caption}</p>
        <div className="mt-3 flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
          <Clock3 className="h-3.5 w-3.5" />
          <span data-testid={`text-post-date-${post.id}`}>{post.dateLabel} · {post.timeLabel}</span>
          <span className={`ml-auto rounded-full px-2 py-1 text-[10px] font-bold ${post.status === 'Scheduled' ? 'bg-indigo-50 text-primary' : 'bg-emerald-50 text-emerald-700'}`} data-testid={`status-post-${post.id}`}>{post.status}</span>
        </div>
      </div>
    </article>
  );
}