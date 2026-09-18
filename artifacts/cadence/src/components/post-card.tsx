import { useState } from 'react';
import { Clock3, MoreHorizontal } from 'lucide-react';
import { PlatformIcon } from '@/components/platform-icon';
import type { CadencePost } from '@/lib/cadence-data';

type PostCardProps = {
  post: CadencePost;
};

export function PostCard({ post }: PostCardProps) {
  const [optionsOpen, setOptionsOpen] = useState(false);

  return (
    <article className="group flex gap-4 border-b border-stone-200 py-4 last:border-0" data-testid={`card-post-${post.id}`}>
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-stone-100 text-stone-500" data-testid={`icon-post-${post.id}`}>
        <PlatformIcon platform={post.platform} className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-start justify-between gap-3">
          <p className="truncate text-[10px] font-bold uppercase tracking-[0.1em] text-stone-500">{post.platform}</p>
          <div className="relative">
            <button type="button" className="rounded-[10px] p-2 -mr-2 -mt-2 text-stone-400 opacity-100 md:opacity-0 md:transition-opacity md:hover:bg-stone-100 md:hover:text-stone-900 group-hover:opacity-100" onClick={() => setOptionsOpen((open) => !open)} aria-label={`More options for ${post.id}`} data-testid={`button-post-options-${post.id}`}><MoreHorizontal className="h-4 w-4" /></button>
            {optionsOpen && (
              <>
                <div className="fixed inset-0 z-40 md:hidden" onClick={() => setOptionsOpen(false)} />
                <div className="absolute right-0 top-8 z-50 w-44 rounded-[10px] border border-stone-200 bg-white p-3 text-[11px] leading-relaxed text-stone-500 shadow-lg md:shadow-none" data-testid={`panel-post-options-${post.id}`}>Post details are read-only in this workspace.</div>
              </>
            )}
          </div>
        </div>
        <p className="line-clamp-2 text-sm font-medium leading-relaxed text-stone-900" data-testid={`text-post-caption-${post.id}`}>{post.caption}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-medium text-stone-500">
          <Clock3 className="h-3.5 w-3.5" />
          <span data-testid={`text-post-date-${post.id}`}>{post.dateLabel} · {post.timeLabel}</span>
          <span className={`sm:ml-auto rounded-full px-2.5 py-1 text-[10px] font-bold ${post.status === 'Scheduled' ? 'bg-stone-100 text-stone-600' : 'bg-[#C2410C]/10 text-[#C2410C]'}`} data-testid={`status-post-${post.id}`}>{post.status}</span>
        </div>
      </div>
    </article>
  );
}
