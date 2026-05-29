import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Visual tone for scrims over photography. */
export type ImageScrimTone = 'marketing' | 'app';

interface ImageTextScrimProps {
  tone?: ImageScrimTone;
  className?: string;
}

/**
 * Layered gradients so titles and descriptions stay readable on busy photos.
 */
export function ImageTextScrim({ tone = 'marketing', className }: ImageTextScrimProps) {
  return (
    <div className={cn('absolute inset-0 pointer-events-none', className)} aria-hidden>
      {tone === 'marketing' ? (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/25 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a]/85 via-black/50 to-transparent" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 via-black/45 to-transparent" />
        </>
      )}
    </div>
  );
}

interface ImageHeroCaptionProps {
  children: ReactNode;
  tone?: ImageScrimTone;
  className?: string;
}

/** Extra caption plate at the bottom of image heroes. */
export function ImageHeroCaption({ children, tone = 'marketing', className }: ImageHeroCaptionProps) {
  return (
    <div
      className={cn(
        'relative z-10 pt-10 -mt-2 bg-gradient-to-t to-transparent',
        tone === 'marketing'
          ? 'from-[#1a1a1a] via-[#1a1a1a]/95'
          : 'from-background via-background/95',
        className,
      )}
    >
      {children}
    </div>
  );
}

interface ImageCardScrimProps {
  className?: string;
}

/** Bottom scrim for smaller image tiles (class cards, thumbnails). */
export function ImageCardScrim({ className }: ImageCardScrimProps) {
  return (
    <div
      className={cn(
        'absolute inset-0 pointer-events-none bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a]/85 to-transparent',
        className,
      )}
      aria-hidden
    />
  );
}
