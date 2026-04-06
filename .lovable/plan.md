

# Static Pre-Rendering for SEO — Not Feasible on Lovable

## The Problem

You're asking for static HTML snapshots or dynamic rendering (bot detection + pre-rendered HTML serving) for your public routes. This is a great SEO strategy, but **none of the proposed solutions work on the Lovable platform**:

### Why Each Option Fails Here

| Solution | Why It Won't Work |
|----------|-------------------|
| **react-snap** | Requires a custom `postbuild` step that launches a headless browser. Lovable's build pipeline doesn't support custom post-build scripts. |
| **Vite SSG plugin** | Requires server-side Node APIs and custom Vite plugins that modify the build output. Not compatible with Lovable's build system. |
| **prerender.io** | Requires either a middleware/proxy configuration on the hosting server (to detect bots and redirect), or DNS-level changes. Lovable hosting doesn't expose server config. |
| **Dynamic rendering (bot detection)** | Requires server-side logic to inspect User-Agent headers and serve different responses. There is no server layer to customize on Lovable hosting — it serves static files only. |

## What IS Possible (and already planned)

The previous SEO plan I proposed covers everything that **can** be done within Lovable's constraints:

1. **react-helmet-async** — per-page `<title>`, meta descriptions, canonical URLs, OG tags, Twitter cards
2. **JSON-LD structured data** — Organization, LocalBusiness, Service, BreadcrumbList schemas injected via components
3. **Semantic HTML** — proper heading hierarchy, `<main>`, `<section>`, `<article>`, `<nav>`
4. **sitemap.xml** + improved **robots.txt**
5. **Core Web Vitals** — image optimization, font loading, CLS prevention
6. **Strong default metadata in index.html** — so even before JS executes, bots see meaningful tags

**Google's crawler (Googlebot) has rendered JavaScript since 2019.** It will execute your React app and index the content. The key is ensuring metadata is correct, structured data is present, and performance is fast — all achievable in a client-side SPA.

## Recommendation

If you need true SSR/pre-rendering for competitive SEO rankings, that requires migrating to Next.js and self-hosting outside Lovable. Within Lovable, the best path is implementing the SPA SEO optimizations from the previous plan. Want me to proceed with those?

