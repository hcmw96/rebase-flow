/**
 * Regenerates supabase/functions/_shared/entitlementMap.generated.ts.
 *
 * Rebase will keep adding contracts, pricing options and class descriptions, so
 * this is a command you re-run — not a one-off. It reports what changed and, by
 * default, refuses to rewrite the file unless you pass --write.
 *
 * USAGE
 *   # against live Mindbody (needs staff credentials)
 *   MINDBODY_API_KEY=... MINDBODY_SITE_ID=... \
 *   MINDBODY_STAFF_USERNAME=... MINDBODY_STAFF_PASSWORD=... \
 *   [MINDBODY_SOURCE_NAME=... MINDBODY_SOURCE_PASSWORD=...] \
 *   deno run --allow-net --allow-env --allow-read --allow-write \
 *     scripts/seed-entitlement-map.ts [--write]
 *
 *   # against a saved input dump (no credentials needed)
 *   deno run --allow-read --allow-write \
 *     scripts/seed-entitlement-map.ts --from-file inputs.json [--write]
 *
 * EXIT CODES
 *   0  no changes, or --write succeeded
 *   1  fetch/IO error
 *   2  changes detected and --write was not passed (dry run with a diff)
 *   3  grants exist with no rule in entitlementCoverage.authored.ts
 *
 * Exit 3 is the important one: an unseeded grant means a member could hold a
 * credit the resolver cannot classify, which hard-fails their booking. CI should
 * treat a non-zero exit as a failure so a new Mindbody pricing option is caught
 * here rather than by a customer.
 */

import {
  AUTHORED_COVERAGE,
  type CoverageRule,
} from "../supabase/functions/_shared/entitlementCoverage.authored.ts";

const OUT_PATH = "supabase/functions/_shared/entitlementMap.generated.ts";
const V6 = "https://api.mindbodyonline.com/public/v6";

type Json = Record<string, unknown>;

type Inputs = {
  contracts: Json[];
  services: Json[];
  classDescriptions: Json[];
  sessionTypes: Json[];
  programs: Json[];
};

// ── input acquisition ────────────────────────────────────────────────────────

async function staffToken(apiKey: string, siteId: string): Promise<string> {
  const body: Record<string, string> = {
    Username: Deno.env.get("MINDBODY_STAFF_USERNAME")!.trim(),
    Password: Deno.env.get("MINDBODY_STAFF_PASSWORD")!.trim(),
  };
  const sn = Deno.env.get("MINDBODY_SOURCE_NAME")?.trim();
  const sp = Deno.env.get("MINDBODY_SOURCE_PASSWORD")?.trim();
  if (sn && sp) { body.SourceName = sn; body.SourcePassword = sp; }

  const res = await fetch(`${V6}/usertoken/issue`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Api-Key": apiKey, SiteId: siteId },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`staff auth failed ${res.status}: ${await res.text()}`);
  return (await res.json()).AccessToken as string;
}

async function fetchInputs(): Promise<Inputs> {
  const apiKey = Deno.env.get("MINDBODY_API_KEY")?.trim();
  const siteId = Deno.env.get("MINDBODY_SITE_ID")?.trim();
  if (!apiKey || !siteId) throw new Error("MINDBODY_API_KEY and MINDBODY_SITE_ID are required");

  const token = await staffToken(apiKey, siteId);
  const H = { "Api-Key": apiKey, SiteId: siteId, Authorization: `Bearer ${token}` };
  const get = async (path: string): Promise<Json> => {
    const r = await fetch(`${V6}${path}`, { headers: H });
    if (!r.ok) throw new Error(`GET ${path} -> ${r.status} ${await r.text().catch(() => "")}`);
    return await r.json() as Json;
  };
  const paged = async (path: string, key: string): Promise<Json[]> => {
    const out: Json[] = [];
    for (let offset = 0; ; offset += 100) {
      const sep = path.includes("?") ? "&" : "?";
      const d = await get(`${path}${sep}Limit=100&Offset=${offset}`);
      const batch = (d[key] || []) as Json[];
      out.push(...batch);
      if (batch.length < 100) break;
    }
    return out;
  };

  return {
    contracts: await paged("/sale/contracts?LocationId=1", "Contracts"),
    services: await paged("/sale/services", "Services"),
    classDescriptions: await paged("/class/classdescriptions", "ClassDescriptions"),
    sessionTypes: ((await get("/site/sessiontypes")).SessionTypes || []) as Json[],
    programs: ((await get("/site/programs")).Programs || []) as Json[],
  };
}

// ── grant extraction ─────────────────────────────────────────────────────────

type Grant = { productId: string; name: string; contractIds: number[]; inCatalogue: boolean };

function extractGrants(inputs: Inputs): Grant[] {
  const catalogueIds = new Set(inputs.services.map((s) => String(s.Id)));
  const byId = new Map<string, Grant>();

  for (const c of inputs.contracts) {
    for (const item of ((c.ContractItems || []) as Json[])) {
      // Only £0 pricing options are entitlements. Priced items are the membership
      // product itself; ContractRegistrationFee is an enrolment charge.
      if (item.Type !== "ServicePricingOption") continue;
      if (Number(item.Price ?? 0) !== 0) continue;

      const id = String(item.Id);
      const existing = byId.get(id);
      if (existing) {
        existing.contractIds.push(Number(c.Id));
      } else {
        byId.set(id, {
          productId: id,
          name: String(item.Name ?? "").trim(),
          contractIds: [Number(c.Id)],
          inCatalogue: catalogueIds.has(id),
        });
      }
    }
  }

  return [...byId.values()].sort((a, b) => a.productId.localeCompare(b.productId));
}

// ── rule expansion ───────────────────────────────────────────────────────────

type ResolvedEntry = {
  productId: string;
  name: string;
  classDescriptionIds: number[];
  sessionTypeIds: number[];
  nonBookable: boolean;
  needsConfirmation?: string;
  contractIds: number[];
};

function expand(grant: Grant, rule: CoverageRule, inputs: Inputs): ResolvedEntry {
  const classIds = new Set<number>(rule.classDescriptionIds ?? []);
  const sessionIds = new Set<number>(rule.sessionTypeIds ?? []);

  // Programs are expanded on every run, so inventory added in Mindbody is picked
  // up without editing the authored file.
  for (const pid of rule.programIds ?? []) {
    for (const cd of inputs.classDescriptions) {
      if ((cd.Program as Json | undefined)?.Id === pid && cd.Id != null) {
        classIds.add(Number(cd.Id));
      }
    }
    for (const st of inputs.sessionTypes) {
      if (st.ProgramId === pid && st.Id != null) sessionIds.add(Number(st.Id));
    }
  }

  // Applied after expansion so a program rule can stay broad while dropping
  // known test artefacts.
  for (const id of rule.excludeClassDescriptionIds ?? []) classIds.delete(id);
  for (const id of rule.excludeSessionTypeIds ?? []) sessionIds.delete(id);

  return {
    productId: grant.productId,
    name: grant.name,
    classDescriptionIds: [...classIds].sort((a, b) => a - b),
    sessionTypeIds: [...sessionIds].sort((a, b) => a - b),
    nonBookable: rule.nonBookable === true,
    needsConfirmation: rule.needsConfirmation,
    contractIds: [...grant.contractIds].sort((a, b) => a - b),
  };
}

// ── rendering & diffing ──────────────────────────────────────────────────────

function render(entries: ResolvedEntry[]): string {
  const lines: string[] = [];
  lines.push("/**");
  lines.push(" * GENERATED FILE — do not edit by hand.");
  lines.push(" *");
  lines.push(" * Regenerate with:");
  lines.push(" *   deno run --allow-net --allow-env --allow-read --allow-write \\");
  lines.push(" *     scripts/seed-entitlement-map.ts --write");
  lines.push(" *");
  lines.push(" * Coverage intent lives in entitlementCoverage.authored.ts; this file is that");
  lines.push(" * intent expanded against live Mindbody class descriptions and session types.");
  lines.push(" *");
  lines.push(" * Keyed on ProductId (the pricing option a credit came from). ClientServices.Id");
  lines.push(" * is the instance and remains the key for SPENDING a credit — never for");
  lines.push(" * identifying one. See MindbodyClientServiceRow.");
  lines.push(" */");
  lines.push("");
  lines.push("export type EntitlementCoverage = {");
  lines.push("  name: string;");
  lines.push("  classDescriptionIds: number[];");
  lines.push("  sessionTypeIds: number[];");
  lines.push("  /** Real credit, redeemed outside this app (e.g. guest passes at reception). */");
  lines.push("  nonBookable: boolean;");
  lines.push("  /** Present where the mapping is an unconfirmed inference. */");
  lines.push("  needsConfirmation?: string;");
  lines.push("  /** Contracts granting this credit, for traceability. */");
  lines.push("  contractIds: number[];");
  lines.push("};");
  lines.push("");
  lines.push("export const ENTITLEMENT_MAP: Record<string, EntitlementCoverage> = {");
  for (const e of entries) {
    lines.push(`  "${e.productId}": {`);
    lines.push(`    name: ${JSON.stringify(e.name)},`);
    lines.push(`    classDescriptionIds: [${e.classDescriptionIds.join(", ")}],`);
    lines.push(`    sessionTypeIds: [${e.sessionTypeIds.join(", ")}],`);
    lines.push(`    nonBookable: ${e.nonBookable},`);
    if (e.needsConfirmation) {
      lines.push(`    needsConfirmation: ${JSON.stringify(e.needsConfirmation)},`);
    }
    lines.push(`    contractIds: [${e.contractIds.join(", ")}],`);
    lines.push(`  },`);
  }
  lines.push("};");
  lines.push("");
  return lines.join("\n");
}

/** Parse the previous generated file well enough to diff it. */
function readPrevious(path: string): Map<string, ResolvedEntry> {
  const out = new Map<string, ResolvedEntry>();
  let text: string;
  try {
    text = Deno.readTextFileSync(path);
  } catch {
    return out;
  }
  const blockRe =
    /"(\d+)":\s*\{\s*name:\s*("(?:[^"\\]|\\.)*"),\s*classDescriptionIds:\s*\[([^\]]*)\],\s*sessionTypeIds:\s*\[([^\]]*)\],\s*nonBookable:\s*(true|false),/g;
  const nums = (s: string) =>
    s.split(",").map((x) => x.trim()).filter(Boolean).map(Number).sort((a, b) => a - b);
  for (const m of text.matchAll(blockRe)) {
    out.set(m[1], {
      productId: m[1],
      name: JSON.parse(m[2]) as string,
      classDescriptionIds: nums(m[3]),
      sessionTypeIds: nums(m[4]),
      nonBookable: m[5] === "true",
      contractIds: [],
    });
  }
  return out;
}

function sameIds(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

// ── main ─────────────────────────────────────────────────────────────────────

const args = Deno.args;
const write = args.includes("--write");
const fromFileIdx = args.indexOf("--from-file");
const fromFile = fromFileIdx >= 0 ? args[fromFileIdx + 1] : null;

let inputs: Inputs;
try {
  if (fromFile) {
    const raw = JSON.parse(Deno.readTextFileSync(fromFile)) as Partial<Inputs>;
    for (const k of ["contracts", "services", "classDescriptions", "sessionTypes", "programs"]) {
      if (!Array.isArray((raw as Json)[k])) throw new Error(`input file missing array "${k}"`);
    }
    inputs = raw as Inputs;
    console.log(`Inputs: ${fromFile}`);
  } else {
    inputs = await fetchInputs();
    console.log("Inputs: live Mindbody");
  }
} catch (e) {
  console.error("Failed to load inputs:", e instanceof Error ? e.message : e);
  Deno.exit(1);
}

const grants = extractGrants(inputs);
console.log(
  `Contracts ${inputs.contracts.length} · catalogue ${inputs.services.length} · ` +
    `class descriptions ${inputs.classDescriptions.length} · session types ${inputs.sessionTypes.length}`,
);
console.log(
  `Grants found: ${grants.length} (${grants.filter((g) => !g.inCatalogue).length} contract-only)`,
);

const unseeded = grants.filter((g) => !AUTHORED_COVERAGE[g.productId]);
const orphanRules = Object.keys(AUTHORED_COVERAGE).filter(
  (id) => !grants.some((g) => g.productId === id),
);

const entries = grants
  .filter((g) => AUTHORED_COVERAGE[g.productId])
  .map((g) => expand(g, AUTHORED_COVERAGE[g.productId], inputs));

// Empty coverage that isn't declared nonBookable is a silent no-op: the credit
// would never match anything and the member would be charged. Surface it.
const emptyCoverage = entries.filter(
  (e) => !e.nonBookable && !e.classDescriptionIds.length && !e.sessionTypeIds.length,
);
const needsConfirmation = entries.filter((e) => e.needsConfirmation);

const previous = readPrevious(OUT_PATH);
const added = entries.filter((e) => !previous.has(e.productId));
const removed = [...previous.keys()].filter((id) => !entries.some((e) => e.productId === id));
const changed = entries.filter((e) => {
  const p = previous.get(e.productId);
  if (!p) return false;
  return !sameIds(e.classDescriptionIds, p.classDescriptionIds) ||
    !sameIds(e.sessionTypeIds, p.sessionTypeIds) ||
    e.nonBookable !== p.nonBookable ||
    e.name !== p.name;
});

console.log("");
console.log("CHANGES SINCE LAST RUN");
console.log(`  added   ${added.length}`);
console.log(`  removed ${removed.length}`);
console.log(`  changed ${changed.length}`);
for (const e of added) console.log(`    + ${e.productId}  ${e.name}`);
for (const id of removed) console.log(`    - ${id}  ${previous.get(id)?.name ?? ""}`);
for (const e of changed) {
  const p = previous.get(e.productId)!;
  console.log(`    ~ ${e.productId}  ${e.name}`);
  if (!sameIds(e.classDescriptionIds, p.classDescriptionIds)) {
    console.log(`        classes: ${p.classDescriptionIds.length} -> ${e.classDescriptionIds.length}`);
  }
  if (!sameIds(e.sessionTypeIds, p.sessionTypeIds)) {
    console.log(`        sessionTypes: [${p.sessionTypeIds}] -> [${e.sessionTypeIds}]`);
  }
  if (e.nonBookable !== p.nonBookable) {
    console.log(`        nonBookable: ${p.nonBookable} -> ${e.nonBookable}`);
  }
}

if (needsConfirmation.length) {
  console.log("");
  console.log(`NEEDS CONFIRMATION (${needsConfirmation.length}) — resolves, but unverified:`);
  for (const e of needsConfirmation) {
    console.log(`  ${e.productId}  ${e.name}`);
    console.log(`      ${e.needsConfirmation}`);
  }
}

if (emptyCoverage.length) {
  console.log("");
  console.log(`WARNING — rule resolves to NOTHING and is not nonBookable (${emptyCoverage.length}):`);
  for (const e of emptyCoverage) console.log(`  ${e.productId}  ${e.name}`);
}

if (orphanRules.length) {
  console.log("");
  console.log(`Authored rules with no matching grant (${orphanRules.length}) — stale, safe to delete:`);
  for (const id of orphanRules) {
    console.log(`  ${id}  ${AUTHORED_COVERAGE[id].name}`);
  }
}

if (unseeded.length) {
  console.log("");
  console.log(`UNSEEDED GRANTS (${unseeded.length}) — no rule in entitlementCoverage.authored.ts.`);
  console.log("A member holding one of these hard-fails at booking. Add a rule for each:");
  for (const g of unseeded) {
    console.log(
      `  ${g.productId}  ${g.name}  (contracts ${g.contractIds.join(", ")}` +
        `${g.inCatalogue ? "" : ", contract-only"})`,
    );
  }
}

const nextText = render(entries);
const currentText = (() => {
  try {
    return Deno.readTextFileSync(OUT_PATH);
  } catch {
    return null;
  }
})();

if (currentText === nextText) {
  console.log("");
  console.log(`No change to ${OUT_PATH}.`);
  Deno.exit(unseeded.length ? 3 : 0);
}

if (!write) {
  console.log("");
  console.log(`Dry run — ${OUT_PATH} not written. Re-run with --write to apply.`);
  Deno.exit(unseeded.length ? 3 : 2);
}

Deno.writeTextFileSync(OUT_PATH, nextText);
console.log("");
console.log(`Wrote ${OUT_PATH} (${entries.length} entries).`);
Deno.exit(unseeded.length ? 3 : 0);
