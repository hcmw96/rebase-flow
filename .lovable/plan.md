

# Use `vids2` Hero Film for Website Hero Video

## What changes
Update `Hero.tsx` and `AuthPage.tsx` to use the new video file from the `vids2` storage bucket, with 5 seconds clipped from both start and end.

## Technical details

### Files to modify

**`src/components/Hero.tsx`**
- Change `VIDEO_URL` to point to `vids2/REBASE - HERO FILM - 03.01.mp4`
- Update `onLoadedMetadata` to seek to `5` (clip 5s from start)
- Update `onTimeUpdate` to loop back to `5` when `currentTime >= duration - 5` (clip 5s from end)
- Change source type from `video/quicktime` to `video/mp4`

**`src/pages/AuthPage.tsx`**
- Same `VIDEO_URL` update to `vids2/REBASE - HERO FILM - 03.01.mp4`
- Same clipping logic: start at 5s, loop 5s before end
- Update source type to `video/mp4`

