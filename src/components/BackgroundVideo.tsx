import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  HERO_VIDEO_POSTER,
  HERO_VIDEO_URL,
  shouldAutoplayHeroVideo,
} from '@/lib/heroVideo';

interface BackgroundVideoProps {
  overlayClassName?: string;
  className?: string;
}

/**
 * Full-bleed background video with an instant poster and fade-in when ready.
 * Defers attaching the MP4 until after first paint so LCP stays on the poster.
 */
const BackgroundVideo = ({
  overlayClassName = 'bg-black/45',
  className,
}: BackgroundVideoProps) => {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const loadVideo = shouldAutoplayHeroVideo();

  useEffect(() => {
    if (!loadVideo) return;

    const attach = () => setVideoSrc(HERO_VIDEO_URL);

    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(attach, { timeout: 800 });
      return () => window.cancelIdleCallback(id);
    }

    const t = window.setTimeout(attach, 50);
    return () => window.clearTimeout(t);
  }, [loadVideo]);

  return (
    <div className={cn('absolute inset-0', className)} aria-hidden>
      <img
        src={HERO_VIDEO_POSTER}
        alt=""
        fetchPriority="high"
        decoding="async"
        className={cn(
          'absolute inset-0 h-full w-full object-cover transition-opacity duration-700',
          videoReady ? 'opacity-0' : 'opacity-100',
        )}
      />
      {loadVideo && videoSrc && (
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={HERO_VIDEO_POSTER}
          className={cn(
            'absolute inset-0 h-full w-full object-cover transition-opacity duration-700',
            videoReady ? 'opacity-100' : 'opacity-0',
          )}
          onCanPlay={() => setVideoReady(true)}
          onLoadedData={() => setVideoReady(true)}
          ref={(el) => {
            if (el) {
              el.setAttribute('playsinline', '');
              el.play().catch(() => {});
            }
          }}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      )}
      <div className={cn('absolute inset-0', overlayClassName)} />
    </div>
  );
};

export default BackgroundVideo;
