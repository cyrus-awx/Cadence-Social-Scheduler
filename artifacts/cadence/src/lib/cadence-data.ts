export type Platform = 'Instagram' | 'LinkedIn' | 'X';
export type PostStatus = 'Published' | 'Scheduled';

export type CadencePost = {
  id: string;
  caption: string;
  platform: Platform;
  scheduledFor: string;
  dateLabel: string;
  timeLabel: string;
  status: PostStatus;
  color: 'indigo' | 'amber' | 'teal' | 'rose';
};

export const cadencePosts: CadencePost[] = [
  {
    id: 'post-0418',
    caption: 'The first crack of our new Kayanza lot: bright citrus, brown sugar, and a finish that lingers.',
    platform: 'Instagram',
    scheduledFor: '2025-04-18',
    dateLabel: 'Fri, Apr 18',
    timeLabel: '8:30 AM',
    status: 'Scheduled',
    color: 'amber',
  },
  {
    id: 'post-0419',
    caption: 'A little behind the roast: why we rest every bag before it reaches your shelf.',
    platform: 'LinkedIn',
    scheduledFor: '2025-04-19',
    dateLabel: 'Sat, Apr 19',
    timeLabel: '10:00 AM',
    status: 'Scheduled',
    color: 'teal',
  },
  {
    id: 'post-0421',
    caption: 'Weekend ritual, dialed in. Our house espresso is waiting at the bar.',
    platform: 'Instagram',
    scheduledFor: '2025-04-21',
    dateLabel: 'Mon, Apr 21',
    timeLabel: '7:15 AM',
    status: 'Scheduled',
    color: 'indigo',
  },
  {
    id: 'post-0416',
    caption: 'Small batch, big character. Meet the people who make our morning blends possible.',
    platform: 'LinkedIn',
    scheduledFor: '2025-04-16',
    dateLabel: 'Wed, Apr 16',
    timeLabel: '9:00 AM',
    status: 'Published',
    color: 'teal',
  },
  {
    id: 'post-0414',
    caption: 'Notes of peach, jasmine, and a soft cocoa finish. The Ethiopia Guji is back for a short run.',
    platform: 'X',
    scheduledFor: '2025-04-14',
    dateLabel: 'Mon, Apr 14',
    timeLabel: '8:00 AM',
    status: 'Published',
    color: 'rose',
  },
  {
    id: 'post-0411',
    caption: 'Our roastery in three sounds: the drum turning, the timer ticking, and that first sip.',
    platform: 'Instagram',
    scheduledFor: '2025-04-11',
    dateLabel: 'Fri, Apr 11',
    timeLabel: '8:45 AM',
    status: 'Published',
    color: 'amber',
  },
  {
    id: 'post-0408',
    caption: 'The Tuesday blend is back on the shelf. Built for full mornings and second cups.',
    platform: 'X',
    scheduledFor: '2025-04-08',
    dateLabel: 'Tue, Apr 8',
    timeLabel: '7:30 AM',
    status: 'Published',
    color: 'indigo',
  },
  {
    id: 'post-0405',
    caption: 'One of our favorite corners: green coffee in, considered coffee out.',
    platform: 'Instagram',
    scheduledFor: '2025-04-05',
    dateLabel: 'Sat, Apr 5',
    timeLabel: '9:30 AM',
    status: 'Published',
    color: 'teal',
  },
];

export const connectedAccounts = [
  { platform: 'Instagram' as Platform, handle: '@northstar.roasters', color: 'bg-gradient-to-br from-fuchsia-500 to-amber-400' },
  { platform: 'LinkedIn' as Platform, handle: 'Northstar Roasters', color: 'bg-[#0A66C2]' },
  { platform: 'X' as Platform, handle: '@northstarcoffee', color: 'bg-[#1F2937]' },
];

export const planFeatures = {
  Starter: ['10 scheduled posts / month', '3 connected accounts', 'Calendar planning view'],
  Pro: ['Unlimited scheduled posts', '5 connected accounts', 'Best-time suggestions', 'Post performance notes'],
  Business: ['Unlimited scheduled posts', '20 connected accounts', 'Team features', 'Approval workflows'],
};