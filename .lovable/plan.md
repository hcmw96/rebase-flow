

# White Logo on Auth Page + Video Trim

## Changes

### 1. Logo - White on Auth Page Only
**File: `src/components/Logo.tsx`**
- The Logo component currently applies `invert` universally. Since it's used on both the light cream background (home) and the dark video background (auth), we need a prop to control this.
- Add an optional `invert` prop (default `true` to preserve current behavior).
- On the auth page (SignIn.tsx and SignUp.tsx), pass `invert={false}` so the logo renders as-is (white) against the dark video.

### 2. Video Trimming (Skip First/Last 2 Seconds)
**File: `src/pages/AuthPage.tsx`**
- Add an `onLoadedMetadata` handler to the video element that sets `currentTime = 2` to skip the first 2 seconds.
- Add an `onTimeUpdate` handler that checks if the current time is within 2 seconds of the end, and if so, loops back to second 2.
- This creates the effect of cropping the first and last 2 seconds without needing to re-encode the video file.

## Technical Details

Logo change:
```
// Logo.tsx - add invert prop
const Logo = ({ className, invert = true }) => (
  <img src={rebaseLogo} alt="Rebase" className={`${className} ${invert ? 'invert' : ''}`} />
);

// SignIn.tsx / SignUp.tsx
<Logo className="h-14 w-auto opacity-80" invert={false} />
```

Video trim:
```
<video
  onLoadedMetadata={(e) => { e.currentTarget.currentTime = 2; }}
  onTimeUpdate={(e) => {
    const vid = e.currentTarget;
    if (vid.duration && vid.currentTime >= vid.duration - 2) {
      vid.currentTime = 2;
    }
  }}
  ...
/>
```

