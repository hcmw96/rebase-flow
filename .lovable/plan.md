

## Preload Popular Service Images

### Problem
The home page shows 4 popular service cards with images, but those images only start downloading when the component renders. This causes visible grey placeholder boxes while images load (as seen in the screenshot).

### Solution
Preload the 4 popular service images at the app level so they're already cached by the time the home page renders. Since these are static, known URLs, we can add them as `<link rel="preload">` tags in `index.html`.

### Technical Details

**File: `index.html`**
Add preload link tags in the `<head>` for the 4 popular service images:

```html
<link rel="preload" as="image" href="/images/rebase-ice-sauna-new.webp" />
<link rel="preload" as="image" href="/images/rebase-cryo.webp" />
<link rel="preload" as="image" href="/images/rebase-private-suites.webp" />
<link rel="preload" as="image" href="/images/rebase-hbot-treatment.webp" />
```

This tells the browser to start fetching these images immediately on page load -- before any JavaScript executes -- so they'll be in the browser cache by the time the home page renders.

### Files to modify
- `index.html` -- add 4 preload link tags in the head

