/**
 * HAND-AUTHORED coverage intent for membership-granted pricing options.
 *
 * This file is the human half of the entitlement map. It says, for each granted
 * pricing option (keyed on ProductId), WHAT that credit is allowed to pay for.
 * scripts/seed-entitlement-map.ts expands these rules against live Mindbody data
 * and writes the fully-resolved entitlementMap.generated.ts.
 *
 * WHY THIS IS AUTHORED AND NOT DERIVED
 * ------------------------------------
 * 29 of the 49 granted pricing options do not exist in sale/services at all —
 * they are contract-only. They therefore have no ProgramId and never appear in
 * sale/services?ClassId=, so Mindbody exposes nothing to derive coverage from.
 * Verified: sale/services?ServiceIds=<id> returns 0 rows for them, and
 * ProductIds=/ServiceId= are unrecognised parameters (they return an unfiltered
 * first page, which is NOT a match).
 *
 * PREFER programIds OVER EXPLICIT IDS where the whole program is genuinely
 * covered — the seeding script re-expands programs on every run, so a new class
 * description added to program 26 is picked up without editing this file.
 *
 * DO NOT use programIds for Tech Therapies (program 2). It contains both
 * Cryotherapy (session type 5) AND Hyperbaric Oxygen (6, 1123), so a program-level
 * rule would let a cryotherapy credit pay for a 90-minute HBOT session. Cryo and
 * HBOT are listed by explicit session type for exactly this reason.
 *
 * Changing a rule here changes whether a member is charged. Review accordingly.
 */

export type CoverageRule = {
  /** Human label — the Mindbody pricing-option name at time of authoring. */
  name: string;
  /** Whole programs this credit covers; expanded to concrete ids by the script. */
  programIds?: number[];
  /** Specific class descriptions, when a whole program would be too broad. */
  classDescriptionIds?: number[];
  /** Specific appointment session types. */
  sessionTypeIds?: number[];
  /**
   * Removed after programIds expansion. Mindbody programs contain test artefacts
   * ("MOCK CLASS", "Jenni Test Class") which must not sit in a map that decides
   * whether a member is charged. Excluding by id keeps the program rule — so new
   * real inventory is still picked up automatically — while dropping the noise.
   */
  excludeClassDescriptionIds?: number[];
  excludeSessionTypeIds?: number[];
  /**
   * Not bookable through this app — the credit is real but redeemed elsewhere
   * (e.g. a guest pass handed over at reception). Marked so the resolver treats
   * it as "provably not applicable here" rather than "unknown", which would
   * otherwise hard-fail every booking made by a member who holds one.
   */
  nonBookable?: boolean;
  /**
   * Set where the mapping is an inference that needs a human to confirm against
   * the Mindbody UI. The seeding script reports these; they are NOT treated as
   * unmapped, so they do resolve — flagged for review, not blocking.
   */
  needsConfirmation?: string;
};

/** Session types, for readability at the call sites below. */
const CRYOTHERAPY = [5];
const HBOT = [6, 1123];
const PREMIUM_SUITE = [13, 15];
const INFRARED_SUITE = [19];
const STRUCTURAL_FASCIA = [1053, 1054, 1055];

/** Programs. 26 = Classes, 27 = Communal Contrast, 3 = Massage, 7 = IV Drip. */
const CLASSES = [26];
const COMMUNAL_CONTRAST = [27];

/** Test artefacts in the live Mindbody inventory — never entitlement targets. */
const MOCK_SESSION_TYPES = [1121]; // "MOCK CLASS" (program 26)
const MOCK_CLASS_DESCRIPTIONS = [61]; // "Jenni Test Class" (program 27)
const MASSAGE = [3];
const IV_DRIP = [7];

export const AUTHORED_COVERAGE: Record<string, CoverageRule> = {
  // ── Classes ────────────────────────────────────────────────────────────────
  "100056": { name: "4 Monthly Classes", programIds: CLASSES, excludeSessionTypeIds: MOCK_SESSION_TYPES },
  "100064": { name: "6 monthly classes", programIds: CLASSES, excludeSessionTypeIds: MOCK_SESSION_TYPES },
  "100069": { name: "Unlimited Classes", programIds: CLASSES, excludeSessionTypeIds: MOCK_SESSION_TYPES },
  "101300": { name: "24 Class Passes", programIds: CLASSES, excludeSessionTypeIds: MOCK_SESSION_TYPES },
  "101301": { name: "36 Class Passes", programIds: CLASSES, excludeSessionTypeIds: MOCK_SESSION_TYPES },
  "101411": { name: "8 Monthly Class Passes", programIds: CLASSES, excludeSessionTypeIds: MOCK_SESSION_TYPES },
  "101496": { name: "3 Class Passes", programIds: CLASSES, excludeSessionTypeIds: MOCK_SESSION_TYPES },
  "101307": { name: "Unlimited Classes Overseas", programIds: CLASSES, excludeSessionTypeIds: MOCK_SESSION_TYPES },
  "101124": { name: "Single Class", programIds: CLASSES, excludeSessionTypeIds: MOCK_SESSION_TYPES },

  // ── Communal contrast / Members' Suite ─────────────────────────────────────
  // "Members Suite" is communal contrast in Mindbody's naming, consistent with
  // isCommunalContrastService() in mindbodyClientServices.ts.
  "100060": { name: "Unlimited Member's Suite Access", programIds: COMMUNAL_CONTRAST, excludeClassDescriptionIds: MOCK_CLASS_DESCRIPTIONS },
  "101410": { name: "8 Monthly Passes to Communal Members Suite", programIds: COMMUNAL_CONTRAST, excludeClassDescriptionIds: MOCK_CLASS_DESCRIPTIONS },
  "101520": { name: "12 Monthly Passes to Communal Members Suite", programIds: COMMUNAL_CONTRAST, excludeClassDescriptionIds: MOCK_CLASS_DESCRIPTIONS },
  "101862": { name: "48 Annual Passes to Communal Members Suite *", programIds: COMMUNAL_CONTRAST, excludeClassDescriptionIds: MOCK_CLASS_DESCRIPTIONS },
  "101308": { name: "Members Suite Overseas", programIds: COMMUNAL_CONTRAST, excludeClassDescriptionIds: MOCK_CLASS_DESCRIPTIONS },

  // ── Cryotherapy (session-type explicit — see header note on program 2) ─────
  "100058": { name: "2 Monthly Cryotherapy Sessions", sessionTypeIds: CRYOTHERAPY },
  "100066": { name: "Unlimited Cryotherapy", sessionTypeIds: CRYOTHERAPY },
  "101302": { name: "12 Cryotherapy Sessions", sessionTypeIds: CRYOTHERAPY },
  "101412": { name: "4 Monthly Cryotherapy Sessions", sessionTypeIds: CRYOTHERAPY },
  "101521": { name: "6 Monthly Cryotherapy Sessions", sessionTypeIds: CRYOTHERAPY },
  "101306": { name: "Unlimited Cryo Overseas", sessionTypeIds: CRYOTHERAPY },

  // ── Hyperbaric oxygen ──────────────────────────────────────────────────────
  "100057": { name: "1 Monthly Hyperbaric  Oxygen Session", sessionTypeIds: HBOT },
  "100067": { name: "3 Hyperbaric Oxygen sessions", sessionTypeIds: HBOT },
  "100070": { name: "Unlimited Hyperbaric Oxygen Sessions", sessionTypeIds: HBOT },
  "101295": { name: "6 Hyperbaric Oxygen Sessions", sessionTypeIds: HBOT },
  "101497": { name: "1 HBOT Session", sessionTypeIds: HBOT },
  "101303": { name: "6 HBOT Overseas", sessionTypeIds: HBOT },
  "101304": { name: "18 HBOT Overseas", sessionTypeIds: HBOT },
  "101305": { name: "36 HBOT Overseas", sessionTypeIds: HBOT },

  // ── Private suites ─────────────────────────────────────────────────────────
  // No session type is named "Private Room" anywhere in the site inventory. The
  // only suite session types are Premium Suite (13, 15) and Infrared (19).
  // Mapping to Premium Suite is an inference — CONFIRM before relying on it.
  "100065": {
    name: "3 Private Room Sessions",
    sessionTypeIds: PREMIUM_SUITE,
    needsConfirmation: '"Private Room" matches no session type; assumed Premium Suite. ' +
      "Confirm whether it should also cover Infrared Suite (19).",
  },
  "101297": {
    name: "6 Monthly Private Room Sessions",
    sessionTypeIds: PREMIUM_SUITE,
    needsConfirmation: 'Same as 100065 — "Private Room" is not a session type name.',
  },
  "100071": {
    name: "10 Monthly Private Room Sessions",
    sessionTypeIds: PREMIUM_SUITE,
    needsConfirmation: 'Same as 100065 — "Private Room" is not a session type name.',
  },
  "101535": {
    name: "Private Suite Session",
    sessionTypeIds: PREMIUM_SUITE,
    needsConfirmation: "Ambiguous between Premium Suite and Infrared Suite; assumed Premium.",
  },
  "100010": { name: "Premium Suite - 60 minutes", sessionTypeIds: [13] },
  "101314": {
    name: "36 Overseas Suite Sessions",
    sessionTypeIds: [...PREMIUM_SUITE, ...INFRARED_SUITE],
    needsConfirmation: "Program 6 (Membership Services) has no session types; " +
      "assumed both suite types. Confirm which suite Overseas members may use.",
  },
  "101315": {
    name: "18 Overseas Suite Sessions",
    sessionTypeIds: [...PREMIUM_SUITE, ...INFRARED_SUITE],
    needsConfirmation: "Same as 101314.",
  },

  // ── Other treatments ───────────────────────────────────────────────────────
  "100072": { name: "1 Monthly Massage", programIds: MASSAGE },
  "101101": { name: "1 Monthly IV Drip", programIds: IV_DRIP },
  "101128": {
    name: "Structural Fascia Therapy (Muscular Scrapping): 90 Mins",
    sessionTypeIds: [1054],
  },
  "101234": { name: "2 Structural Fascia or Dry Needling: 1 hr sessions", sessionTypeIds: STRUCTURAL_FASCIA },
  "101235": { name: "5 Structural Fascia or Dry Needling: 1 hr sessions", sessionTypeIds: STRUCTURAL_FASCIA },
  "101236": { name: "7 Structural Fascia or Dry Needling: 1 hr sessions", sessionTypeIds: STRUCTURAL_FASCIA },

  // ── Guest passes: real credits, not bookable here ──────────────────────────
  // Program 29 ("Guest Passes") contains zero class descriptions, so there is
  // nothing in the bookable inventory these could pay for. Marked nonBookable so
  // holding one does not hard-fail every booking a member makes.
  "101085": { name: "12 Annual Guest Passes", nonBookable: true },
  "101086": { name: "6 Annual Guest Passes", nonBookable: true },
  "101087": { name: "24 Annual Guest Passes", nonBookable: true },
  "101296": { name: "18 Annual Guest Passes", nonBookable: true },
  "101522": { name: "6 Annual Guest Passes", nonBookable: true },
  "101309": { name: "6 Overseas Guest Passes", nonBookable: true },
  "101310": { name: "3 Overseas Guest Passes", nonBookable: true },
  "101311": { name: "9 Overseas Guest Passes", nonBookable: true },
};
