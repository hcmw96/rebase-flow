/** Hero background video (Supabase storage). */
export const HERO_VIDEO_URL = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/vids2/newbase.mp4`;

/** Lightweight still shown until the video can play (same scene as the hero video). */
export const HERO_VIDEO_POSTER = '/images/rebase-ice-sauna-new.webp';

export function getSupabaseStorageOrigin(): string {
  try {
    return new URL(import.meta.env.VITE_SUPABASE_URL).origin;
  } catch {
    return '';
  }
}

/** Skip heavy video on save-data / very slow connections. */
export function shouldAutoplayHeroVideo(): boolean {
  if (typeof navigator === 'undefined') return true;
  const conn = (
    navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }
  ).connection;
  if (conn?.saveData) return false;
  const slow = conn?.effectiveType;
  return slow !== 'slow-2g' && slow !== '2g';
}
