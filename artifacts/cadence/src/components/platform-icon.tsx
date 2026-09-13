import { Linkedin } from 'lucide-react';
import { SiInstagram, SiX } from 'react-icons/si';
import type { Platform } from '@/lib/cadence-data';

type PlatformIconProps = {
  platform: Platform;
  className?: string;
};

export function PlatformIcon({ platform, className = 'h-4 w-4' }: PlatformIconProps) {
  if (platform === 'Instagram') return <SiInstagram className={className} aria-label="Instagram" />;
  if (platform === 'LinkedIn') return <Linkedin className={className} aria-label="LinkedIn" />;
  return <SiX className={className} aria-label="X" />;
}