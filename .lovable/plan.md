

## Add route for the marketing landing page

The redesigned Hero and Navigation components exist but `Index.tsx` is never mounted because `App.tsx` routes everything to `AppShell`.

### Change

**`src/App.tsx`** — Add a `/website` route that renders `Index`:

```tsx
import Index from "./pages/Index";

<Routes>
  <Route path="/website" element={<Index />} />
  <Route path="/" element={<AppShell />} />
  <Route path="*" element={<AppShell />} />
</Routes>
```

This keeps the app at `/` and makes the marketing page accessible at `/website`. If you'd prefer the marketing page at `/` instead (and move the app to `/app`), I can do that instead.

