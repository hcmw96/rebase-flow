
## What’s happening (in plain English)
Your GitHub build is failing because the build process is trying to use a tool called **terser** (Vite shows this as `[vite:terser]`), but in the environment running the build, it’s not being found.

Even though we already:
- set the widget build config to `minify: 'esbuild'`, and
- added `terser` to `package.json`

…the GitHub Actions run you’re seeing is still behaving like it’s using terser. That usually happens for one of these reasons:
1) The workflow run is re-running an **older commit** (so it doesn’t include the latest fixes), or  
2) The workflow is still effectively using terser during minification, so we should hard-force esbuild at the command line, and add a “sanity check” step that proves terser is installed (or not) during the run.

## Goal
Make the widget build succeed 100% of the time without you needing to do anything technical.

---

## Changes I will implement (code + workflow)
### A) Make the workflow force esbuild minification (hard override)
Update the GitHub Actions build command to:

- `npx vite build --config vite.widget.config.ts --minify esbuild`

This makes the workflow override any config weirdness and ensures it does not attempt to use terser.

### B) Add a quick “debug/sanity check” in the workflow
Add a step right after `npm ci` that prints:
- Node + npm versions
- confirms whether `terser` can be resolved (so we can stop guessing)

For example:
- `node -v`
- `npm -v`
- `node -e "console.log(require.resolve('terser'))"` (this will clearly pass/fail)

If it fails, we’ll know instantly that `npm ci` isn’t installing it (which points to a permissions/cache/lock mismatch issue).

### C) Ensure the workflow can push the built files back to the repo
Add explicit workflow permissions (GitHub has increasingly tightened defaults in some orgs/repos):

- `permissions: contents: write`

This prevents a “build succeeded but push failed” scenario once the build is green.

### D) Clean up the widget Vite config warning (nice-to-have, reduces noise)
Right now you get this warning in the logs:
> outDir .../public and publicDir .../public are not separate folders.

In the widget build config, we can set:
- `publicDir: false`

So Vite doesn’t try to treat `/public` as both “input public assets” and “output build folder” at the same time.

This warning isn’t the cause of the terser error, but removing it makes the build logs clearer.

---

## How you’ll verify it (non-technical steps)
After I implement the above and it’s synced to GitHub:

1) Go to GitHub → **Actions** → **Build Widget**
2) Click **Run workflow** (important: “Run workflow”, not “Re-run jobs” on an old failed run)
3) Wait for the run to finish (usually ~1–2 minutes)
4) Confirm it’s green and that these files exist/updated in your repo:
   - `public/widget.js`
   - `public/widget.css`
5) Then test embedding on your site (Framer) using the same widget script URL.

---

## Edge cases (what we’ll do if it still fails)
If it still says “terser not found” even after forcing `--minify esbuild`:
- that would mean something deeper is off (like the workflow is still not using the config/command we expect, or the action is running against a different ref/branch).
- The new debug steps will make that immediately obvious (we’ll see exactly what’s installed and what command is running).

---

## Implementation checklist (for me, in Lovable)
1) Edit `.github/workflows/build-widget.yml`
   - add `permissions: contents: write`
   - add debug step after `npm ci`
   - change build command to include `--minify esbuild`
2) Edit `vite.widget.config.ts`
   - add `publicDir: false` to remove the warning
3) Trigger a fresh workflow run (a new commit will do this automatically)
4) Validate the latest run is green and outputs `public/widget.js` + `public/widget.css`

