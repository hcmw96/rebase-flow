

## Problem
The AppShell container has `bg-background` (an opaque dark brown) that completely covers the body's background image. The background image is applied to `<body>` in CSS, but the `<div>` wrapping the entire app sits on top with a solid color.

## Fix
Remove `bg-background` from the AppShell's root `<div>` (line 48 in `src/components/AppShell.tsx`), making it transparent so the body background image shows through.

```
// Before
<div className="min-h-screen flex flex-col bg-background">

// After
<div className="min-h-screen flex flex-col">
```

This is a single-line change. The body already has the background color as a fallback via CSS, so removing it from the wrapper won't cause any visual gap.

