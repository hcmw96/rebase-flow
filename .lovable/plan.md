
## What we know so far
- Your GitHub “Build Widget” workflow is still failing with: **`[vite:terser] terser not found`**.
- In the repo right now:
  - `vite.widget.config.ts` already sets `build.minify: 'esbuild'`
  - the workflow runs `npx vite build --config vite.widget.config.ts --minify esbuild`
  - `terser` **is** listed in `package.json` and present in `package-lock.json`

So if the workflow is truly using the latest commit and actually applying `--minify esbuild`, it should not be trying to run the Vite “terser” plugin at all. That mismatch strongly suggests either:
1) the run is not using the code we think it is (older commit / wrong ref), or  
2) Vite is still deciding to use terser, and we need to bypass that path completely.

## Goal
Make the widget build succeed reliably (and keep the output reasonably minified) without requiring any local tooling.

---

## Step 1 — Prove whether the workflow run is using the latest code
### Changes I will make (workflow debug improvements)
Update `.github/workflows/build-widget.yml` to print “unfakeable” info early in the run:
- The commit SHA and branch/ref being built (`$GITHUB_SHA`, `$GITHUB_REF`)
- Confirm the widget config file exists and show the key lines (so we know the runner has the updated config)
- Print which Vite binary is being used:
  - `./node_modules/.bin/vite --version`
  - `npx vite --version`
- Print whether **terser is installed** in multiple ways:
  - `npm ls terser`
  - `ls -la node_modules/terser` (if present)
  - An **ESM import test** (because Vite runs as ESM): `node -e "import('terser').then(()=>console.log('terser import ok')).catch(e=>{console.error(e);process.exit(1)})"`

### Why this matters
If your run does **not** show these debug lines, it’s definitely running an older workflow/commit (common when “Re-run jobs” is used on an old run). This step makes it crystal-clear.

---

## Step 2 — Remove any chance that `npx` is downloading/using a different Vite
### Changes I will make (workflow build command)
Replace the build command to use the locally installed Vite binary explicitly, e.g.:
- `./node_modules/.bin/vite build --config vite.widget.config.ts --minify esbuild`

This avoids edge cases where `npx` can execute an unexpected copy if something about local install is off.

---

## Step 3 — If Vite still tries to use terser, bypass Vite minification entirely (most reliable fix)
If after Steps 1–2 the build still shows `[vite:terser]`, we’ll stop relying on Vite’s minify switch.

### Changes I will make (widget build config + post-minify step)
1) In `vite.widget.config.ts`, set:
- `build.minify: false`

2) In the workflow, after Vite builds the unminified `public/widget.js`, run a separate minification step that does not depend on Vite’s internal terser plugin selection:
- Prefer **terser CLI** (since it’s already in dependencies):
  - `./node_modules/.bin/terser public/widget.js -c -m -o public/widget.js`
- If for some reason the terser binary path isn’t available, fall back to an explicit `node` minify script using the installed package.

### Why this works
Even if Vite is stubbornly attempting to activate its terser plugin, we remove minification from Vite entirely, so it can’t hit the `[vite:terser]` codepath. Then we minify in a straightforward, controlled step afterward.

---

## Step 4 — How you’ll verify (simple)
After I implement the above and it syncs to GitHub:

1) Go to **GitHub → Actions → Build Widget**
2) Click **Run workflow** (not “Re-run jobs” on an old failed run)
3) Open the new run and confirm:
   - The logs show the new debug section (commit SHA/ref, terser checks, vite version)
   - The build completes successfully
4) Confirm these files are committed/updated:
   - `public/widget.js`
   - `public/widget.css`

---

## Files that will be changed
- `.github/workflows/build-widget.yml` (more robust debug + use local Vite + optional post-minify step)
- `vite.widget.config.ts` (only if needed: set `minify: false` so Vite never touches terser)

---

## Expected outcome
- The workflow no longer fails with `[vite:terser] terser not found`
- `widget.js` and `widget.css` reliably regenerate and get committed automatically
