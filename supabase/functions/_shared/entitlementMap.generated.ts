/**
 * GENERATED FILE — do not edit by hand.
 *
 * Regenerate with:
 *   deno run --allow-net --allow-env --allow-read --allow-write \
 *     scripts/seed-entitlement-map.ts --write
 *
 * Coverage intent lives in entitlementCoverage.authored.ts; this file is that
 * intent expanded against live Mindbody class descriptions and session types.
 *
 * Keyed on ProductId (the pricing option a credit came from). ClientServices.Id
 * is the instance and remains the key for SPENDING a credit — never for
 * identifying one. See MindbodyClientServiceRow.
 */

export type EntitlementCoverage = {
  name: string;
  classDescriptionIds: number[];
  sessionTypeIds: number[];
  /** Real credit, redeemed outside this app (e.g. guest passes at reception). */
  nonBookable: boolean;
  /** Present where the mapping is an unconfirmed inference. */
  needsConfirmation?: string;
  /** Contracts granting this credit, for traceability. */
  contractIds: number[];
};

export const ENTITLEMENT_MAP: Record<string, EntitlementCoverage> = {
  "100010": {
    name: "Premium Suite - 60 minutes",
    classDescriptionIds: [],
    sessionTypeIds: [13],
    nonBookable: false,
    contractIds: [141],
  },
  "100056": {
    name: "4 Monthly Classes",
    classDescriptionIds: [1, 2, 3, 4, 7, 8, 9, 10, 11, 12, 13, 14, 19, 20, 22, 35, 40, 41, 66, 72],
    sessionTypeIds: [1050, 1051],
    nonBookable: false,
    contractIds: [100, 103, 106, 138],
  },
  "100057": {
    name: "1 Monthly Hyperbaric  Oxygen Session",
    classDescriptionIds: [],
    sessionTypeIds: [6, 1123],
    nonBookable: false,
    contractIds: [100, 103, 106, 138],
  },
  "100058": {
    name: "2 Monthly Cryotherapy Sessions",
    classDescriptionIds: [],
    sessionTypeIds: [5],
    nonBookable: false,
    contractIds: [106],
  },
  "100060": {
    name: "Unlimited Member's Suite Access",
    classDescriptionIds: [5, 6, 15, 16, 17, 18, 21, 23, 24, 25, 26, 27, 28, 29, 30, 31, 33, 34, 36, 37, 38, 39, 42, 43, 44, 45, 46, 47, 48, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 62, 63, 65, 67, 68, 69, 70, 71, 73, 74, 75, 76],
    sessionTypeIds: [31],
    nonBookable: false,
    contractIds: [101, 102, 103, 104, 105, 106, 107, 108, 110, 111, 115, 116, 129, 136],
  },
  "100064": {
    name: "6 monthly classes",
    classDescriptionIds: [1, 2, 3, 4, 7, 8, 9, 10, 11, 12, 13, 14, 19, 20, 22, 35, 40, 41, 66, 72],
    sessionTypeIds: [1050, 1051],
    nonBookable: false,
    contractIds: [107],
  },
  "100065": {
    name: "3 Private Room Sessions",
    classDescriptionIds: [],
    sessionTypeIds: [13, 15],
    nonBookable: false,
    needsConfirmation: "\"Private Room\" matches no session type; assumed Premium Suite. Confirm whether it should also cover Infrared Suite (19).",
    contractIds: [101, 104, 107, 110, 136],
  },
  "100066": {
    name: "Unlimited Cryotherapy",
    classDescriptionIds: [],
    sessionTypeIds: [5],
    nonBookable: false,
    contractIds: [101, 102, 104, 105, 107, 108, 110, 111, 115, 116, 136],
  },
  "100067": {
    name: "3 Hyperbaric Oxygen sessions",
    classDescriptionIds: [],
    sessionTypeIds: [6, 1123],
    nonBookable: false,
    contractIds: [101, 104, 107, 110, 130, 136],
  },
  "100069": {
    name: "Unlimited Classes",
    classDescriptionIds: [1, 2, 3, 4, 7, 8, 9, 10, 11, 12, 13, 14, 19, 20, 22, 35, 40, 41, 66, 72],
    sessionTypeIds: [1050, 1051],
    nonBookable: false,
    contractIds: [102, 105, 108, 111, 115, 116],
  },
  "100070": {
    name: "Unlimited Hyperbaric Oxygen Sessions",
    classDescriptionIds: [],
    sessionTypeIds: [6, 1123],
    nonBookable: false,
    contractIds: [102, 105, 108, 111],
  },
  "100071": {
    name: "10 Monthly Private Room Sessions",
    classDescriptionIds: [],
    sessionTypeIds: [13, 15],
    nonBookable: false,
    needsConfirmation: "Same as 100065 — \"Private Room\" is not a session type name.",
    contractIds: [102, 105, 108, 111],
  },
  "100072": {
    name: "1 Monthly Massage",
    classDescriptionIds: [],
    sessionTypeIds: [9, 25, 1038, 1039, 1040, 1041, 1043, 1047, 1048, 1126],
    nonBookable: false,
    contractIds: [102, 105, 108, 111, 130],
  },
  "101085": {
    name: "12 Annual Guest Passes",
    classDescriptionIds: [],
    sessionTypeIds: [],
    nonBookable: true,
    contractIds: [101, 104, 107, 110, 127, 136],
  },
  "101086": {
    name: "6 Annual Guest Passes",
    classDescriptionIds: [],
    sessionTypeIds: [],
    nonBookable: true,
    contractIds: [100, 103, 106],
  },
  "101087": {
    name: "24 Annual Guest Passes",
    classDescriptionIds: [],
    sessionTypeIds: [],
    nonBookable: true,
    contractIds: [102, 105, 108],
  },
  "101101": {
    name: "1 Monthly IV Drip",
    classDescriptionIds: [],
    sessionTypeIds: [1061, 1128, 1136],
    nonBookable: false,
    contractIds: [102, 105, 108, 111],
  },
  "101124": {
    name: "Single Class",
    classDescriptionIds: [1, 2, 3, 4, 7, 8, 9, 10, 11, 12, 13, 14, 19, 20, 22, 35, 40, 41, 66, 72],
    sessionTypeIds: [1050, 1051],
    nonBookable: false,
    contractIds: [124],
  },
  "101128": {
    name: "Structural Fascia Therapy (Muscular Scrapping): 90 Mins",
    classDescriptionIds: [],
    sessionTypeIds: [1054],
    nonBookable: false,
    contractIds: [112, 113, 114],
  },
  "101234": {
    name: "2 Structural Fascia or Dry Needling: 1 hr sessions",
    classDescriptionIds: [],
    sessionTypeIds: [1053, 1054, 1055],
    nonBookable: false,
    contractIds: [112],
  },
  "101235": {
    name: "5 Structural Fascia or Dry Needling: 1 hr sessions",
    classDescriptionIds: [],
    sessionTypeIds: [1053, 1054, 1055],
    nonBookable: false,
    contractIds: [113],
  },
  "101236": {
    name: "7 Structural Fascia or Dry Needling: 1 hr sessions",
    classDescriptionIds: [],
    sessionTypeIds: [1053, 1054, 1055],
    nonBookable: false,
    contractIds: [114],
  },
  "101295": {
    name: "6 Hyperbaric Oxygen Sessions",
    classDescriptionIds: [],
    sessionTypeIds: [6, 1123],
    nonBookable: false,
    contractIds: [115, 116],
  },
  "101296": {
    name: "18 Annual Guest Passes",
    classDescriptionIds: [],
    sessionTypeIds: [],
    nonBookable: true,
    contractIds: [115, 116, 128],
  },
  "101297": {
    name: "6 Monthly Private Room Sessions",
    classDescriptionIds: [],
    sessionTypeIds: [13, 15],
    nonBookable: false,
    needsConfirmation: "Same as 100065 — \"Private Room\" is not a session type name.",
    contractIds: [115, 116],
  },
  "101300": {
    name: "24 Class Passes",
    classDescriptionIds: [1, 2, 3, 4, 7, 8, 9, 10, 11, 12, 13, 14, 19, 20, 22, 35, 40, 41, 66, 72],
    sessionTypeIds: [1050, 1051],
    nonBookable: false,
    contractIds: [117],
  },
  "101301": {
    name: "36 Class Passes",
    classDescriptionIds: [1, 2, 3, 4, 7, 8, 9, 10, 11, 12, 13, 14, 19, 20, 22, 35, 40, 41, 66, 72],
    sessionTypeIds: [1050, 1051],
    nonBookable: false,
    contractIds: [118],
  },
  "101302": {
    name: "12 Cryotherapy Sessions",
    classDescriptionIds: [],
    sessionTypeIds: [5],
    nonBookable: false,
    contractIds: [117],
  },
  "101303": {
    name: "6 HBOT Overseas",
    classDescriptionIds: [],
    sessionTypeIds: [6, 1123],
    nonBookable: false,
    contractIds: [117],
  },
  "101304": {
    name: "18 HBOT Overseas",
    classDescriptionIds: [],
    sessionTypeIds: [6, 1123],
    nonBookable: false,
    contractIds: [118],
  },
  "101305": {
    name: "36 HBOT Overseas",
    classDescriptionIds: [],
    sessionTypeIds: [6, 1123],
    nonBookable: false,
    contractIds: [119],
  },
  "101306": {
    name: "Unlimited Cryo Overseas",
    classDescriptionIds: [],
    sessionTypeIds: [5],
    nonBookable: false,
    contractIds: [118, 119],
  },
  "101307": {
    name: "Unlimited Classes Overseas",
    classDescriptionIds: [1, 2, 3, 4, 7, 8, 9, 10, 11, 12, 13, 14, 19, 20, 22, 35, 40, 41, 66, 72],
    sessionTypeIds: [1050, 1051],
    nonBookable: false,
    contractIds: [119],
  },
  "101308": {
    name: "Members Suite Overseas",
    classDescriptionIds: [5, 6, 15, 16, 17, 18, 21, 23, 24, 25, 26, 27, 28, 29, 30, 31, 33, 34, 36, 37, 38, 39, 42, 43, 44, 45, 46, 47, 48, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 62, 63, 65, 67, 68, 69, 70, 71, 73, 74, 75, 76],
    sessionTypeIds: [31],
    nonBookable: false,
    contractIds: [118, 119],
  },
  "101309": {
    name: "6 Overseas Guest Passes",
    classDescriptionIds: [],
    sessionTypeIds: [],
    nonBookable: true,
    contractIds: [118],
  },
  "101310": {
    name: "3 Overseas Guest Passes",
    classDescriptionIds: [],
    sessionTypeIds: [],
    nonBookable: true,
    contractIds: [117],
  },
  "101311": {
    name: "9 Overseas Guest Passes",
    classDescriptionIds: [],
    sessionTypeIds: [],
    nonBookable: true,
    contractIds: [119],
  },
  "101314": {
    name: "36 Overseas Suite Sessions",
    classDescriptionIds: [],
    sessionTypeIds: [13, 15, 19],
    nonBookable: false,
    needsConfirmation: "Program 6 (Membership Services) has no session types; assumed both suite types. Confirm which suite Overseas members may use.",
    contractIds: [119],
  },
  "101315": {
    name: "18 Overseas Suite Sessions",
    classDescriptionIds: [],
    sessionTypeIds: [13, 15, 19],
    nonBookable: false,
    needsConfirmation: "Same as 101314.",
    contractIds: [118],
  },
  "101410": {
    name: "8 Monthly Passes to Communal Members Suite",
    classDescriptionIds: [5, 6, 15, 16, 17, 18, 21, 23, 24, 25, 26, 27, 28, 29, 30, 31, 33, 34, 36, 37, 38, 39, 42, 43, 44, 45, 46, 47, 48, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 62, 63, 65, 67, 68, 69, 70, 71, 73, 74, 75, 76],
    sessionTypeIds: [31],
    nonBookable: false,
    contractIds: [100, 130, 134, 135, 138],
  },
  "101411": {
    name: "8 Monthly Class Passes",
    classDescriptionIds: [1, 2, 3, 4, 7, 8, 9, 10, 11, 12, 13, 14, 19, 20, 22, 35, 40, 41, 66, 72],
    sessionTypeIds: [1050, 1051],
    nonBookable: false,
    contractIds: [101, 104, 110, 136],
  },
  "101412": {
    name: "4 Monthly Cryotherapy Sessions",
    classDescriptionIds: [],
    sessionTypeIds: [5],
    nonBookable: false,
    contractIds: [100, 103, 134, 138],
  },
  "101496": {
    name: "3 Class Passes",
    classDescriptionIds: [1, 2, 3, 4, 7, 8, 9, 10, 11, 12, 13, 14, 19, 20, 22, 35, 40, 41, 66, 72],
    sessionTypeIds: [1050, 1051],
    nonBookable: false,
    contractIds: [134],
  },
  "101497": {
    name: "1 HBOT Session",
    classDescriptionIds: [],
    sessionTypeIds: [6, 1123],
    nonBookable: false,
    contractIds: [134, 141],
  },
  "101520": {
    name: "12 Monthly Passes to Communal Members Suite",
    classDescriptionIds: [5, 6, 15, 16, 17, 18, 21, 23, 24, 25, 26, 27, 28, 29, 30, 31, 33, 34, 36, 37, 38, 39, 42, 43, 44, 45, 46, 47, 48, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 62, 63, 65, 67, 68, 69, 70, 71, 73, 74, 75, 76],
    sessionTypeIds: [31],
    nonBookable: false,
    contractIds: [125],
  },
  "101521": {
    name: "6 Monthly Cryotherapy Sessions",
    classDescriptionIds: [],
    sessionTypeIds: [5],
    nonBookable: false,
    contractIds: [125, 130],
  },
  "101522": {
    name: "6 Annual Guest Passes",
    classDescriptionIds: [],
    sessionTypeIds: [],
    nonBookable: true,
    contractIds: [125, 126, 138],
  },
  "101535": {
    name: "Private Suite Session",
    classDescriptionIds: [],
    sessionTypeIds: [13, 15],
    nonBookable: false,
    needsConfirmation: "Ambiguous between Premium Suite and Infrared Suite; assumed Premium.",
    contractIds: [130],
  },
  "101862": {
    name: "48 Annual Passes to Communal Members Suite *",
    classDescriptionIds: [5, 6, 15, 16, 17, 18, 21, 23, 24, 25, 26, 27, 28, 29, 30, 31, 33, 34, 36, 37, 38, 39, 42, 43, 44, 45, 46, 47, 48, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 62, 63, 65, 67, 68, 69, 70, 71, 73, 74, 75, 76],
    sessionTypeIds: [31],
    nonBookable: false,
    contractIds: [117],
  },
};
