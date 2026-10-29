// Fictional seed data for the prototype. Every production, agreement, credit and person is invented.
// CC-001 assets MUS-01, TAL-02, VID-03 and VID-04 match the release desk on the home page.
import { suggest } from "./engine.js";

export const USERS = [
  {
    id: "u-ade",
    name: "Ade Martins",
    title: "Rights coordinator",
    role: "coordinator",
    initials: "AM",
  },
  {
    id: "u-nia",
    name: "Nia Brooks",
    title: "Legal reviewer",
    role: "coordinator",
    initials: "NB",
  },
  {
    id: "u-theo",
    name: "Theo Grant",
    title: "Producer",
    role: "producer",
    initials: "TG",
  },
  {
    id: "u-lina",
    name: "Lina Park",
    title: "Workspace administrator",
    role: "admin",
    initials: "LP",
  },
];

export const DEFAULT_POLICY = {
  twoPersonSignoff: true,
  aiSuggestions: true,
  expiryWarningDays: 60,
  today: "2026-11-02",
};

const ag = (ref, o) => ({
  ref,
  confirmed: true,
  start: "2027-01-01",
  paidMedia: null,
  maxSeconds: null,
  creditRequired: null,
  ...o,
});

/** Add new AI suggestions; drop pending ones the confirmed fields now capture. Decided ones are kept. */
export function withSuggestions(p, policy) {
  const current = p.assets.flatMap((a) => suggest(a));
  const kept = p.suggestions.filter(
    (x) => x.decision !== "pending" || current.some((s) => s.id === x.id),
  );
  const fresh = policy.aiSuggestions
    ? current.filter((s) => !kept.some((x) => x.id === s.id))
    : [];
  return {
    ...p,
    suggestions: [
      ...kept,
      ...fresh.map((s) => ({ ...s, decision: "pending" })),
    ],
  };
}

export function seed() {
  const policy = { ...DEFAULT_POLICY };
  const productions = [
    withSuggestions(
      {
        id: "CC-001",
        title: "Small Hours",
        client: "Lantern Coffee (fictional)",
        owner: "u-ade",
        plan: {
          version: 1,
          start: "2027-01-01",
          end: "2027-12-31",
          territories: ["United Kingdom"],
          channels: ["Online", "Television"],
          paidMedia: true,
        },
        credits: ["Directed by R. Osei"],
        assets: [
          {
            id: "MUS-01",
            name: "Evening Pattern",
            type: "Music",
            usedSeconds: 42,
            agreement: ag("LIC-014", {
              territories: ["United Kingdom"],
              channels: ["Online"],
              end: "2027-12-31",
              creditRequired: "“Evening Pattern” written by L. Ray",
              excerpt:
                "LIC-014 · Fictional sample. Evening Pattern may be used in the United Kingdom, online only, from 1 January 2027 to 31 December 2027. Television use is not included. Credit: “Evening Pattern” written by L. Ray.",
            }),
          },
          {
            id: "TAL-02",
            name: "Performer release",
            type: "Talent",
            usedSeconds: 30,
            agreement: ag("REL-008", {
              territories: ["United Kingdom"],
              channels: ["Online", "Television"],
              end: "2027-06-30",
              excerpt:
                "REL-008 · Fictional sample. The recorded performer permission covers United Kingdom online and television use from 1 January 2027 to 30 June 2027.",
            }),
          },
          {
            id: "VID-03",
            name: "Original footage",
            type: "Footage",
            usedSeconds: 18,
            agreement: ag("OWN-003", {
              territories: ["United Kingdom"],
              channels: ["Online", "Television"],
              end: "2027-12-31",
              excerpt:
                "OWN-003 · Fictional sample. This supporting record expressly supports the requested United Kingdom online and television use from 1 January 2027 to 31 December 2027. No broader rights are recorded.",
            }),
          },
          {
            id: "VID-04",
            name: "City at dusk",
            type: "Stock footage",
            usedSeconds: 6,
            agreement: null,
          },
          {
            id: "MUS-05",
            name: "Night Bus (sting)",
            type: "Music",
            usedSeconds: 22,
            agreement: ag("LIC-021", {
              territories: ["Worldwide"],
              channels: ["Online", "Television", "Social"],
              end: "2028-12-31",
              maxSeconds: 15,
              excerpt:
                "LIC-021 · Fictional sample. Worldwide use online, on television and on social platforms until 31 December 2028, limited to 15 seconds per use.",
            }),
          },
          {
            id: "IMG-07",
            name: "Harbour archive photo",
            type: "Still image",
            usedSeconds: 4,
            agreement: {
              ...ag("ARC-112", {
                territories: ["Europe"],
                channels: ["Online", "Television"],
                end: "2029-12-31",
                excerpt:
                  "ARC-112 · Fictional sample (scanned). Licensed for editorial and commercial use in Europe online and on television until 31 December 2029, excluding paid advertising.",
              }),
              confirmed: false,
            },
          },
        ],
        requests: [],
        suggestions: [],
        signoff: null,
      },
      policy,
    ),
    withSuggestions(
      {
        id: "CC-000",
        title: "Open Water",
        client: "Tidewell Outdoor (fictional)",
        owner: "u-nia",
        plan: {
          version: 2,
          start: "2026-06-01",
          end: "2026-12-31",
          territories: ["United Kingdom", "Ireland"],
          channels: ["Online"],
          paidMedia: false,
        },
        credits: [],
        assets: [
          {
            id: "MUS-11",
            name: "Low Tide",
            type: "Music",
            usedSeconds: 30,
            decision: {
              type: "Cleared for this plan",
              by: "u-nia",
              at: "2026-05-20T10:00:00Z",
              note: "",
            },
            agreement: ag("LIC-090", {
              start: "2026-06-01",
              territories: ["Europe"],
              channels: ["Online"],
              end: "2026-12-31",
              excerpt:
                "LIC-090 · Fictional sample. Europe, online, 1 June 2026 to 31 December 2026.",
            }),
          },
          {
            id: "VID-12",
            name: "Coastline aerials",
            type: "Footage",
            usedSeconds: 12,
            decision: {
              type: "Cleared for this plan",
              by: "u-nia",
              at: "2026-05-20T10:05:00Z",
              note: "",
            },
            agreement: ag("OWN-031", {
              start: "2026-05-01",
              territories: ["United Kingdom", "Ireland"],
              channels: ["Online", "Social"],
              end: "2028-05-31",
              excerpt:
                "OWN-031 · Fictional sample. Commissioned footage owned by the client.",
            }),
          },
        ],
        requests: [],
        suggestions: [],
        signoff: {
          version: 2,
          by: "u-nia",
          at: "2026-05-21T09:00:00Z",
          second: "u-ade",
          secondAt: "2026-05-21T11:30:00Z",
          final: true,
        },
      },
      policy,
    ),
  ];
  const audit = [
    [
      "2026-05-21T09:00:00Z",
      "u-nia",
      "Release signed off (first)",
      "CC-000 · plan v2",
    ],
    [
      "2026-05-21T11:30:00Z",
      "u-ade",
      "Release signed off (second)",
      "CC-000 · plan v2",
    ],
    [
      "2026-10-20T10:00:00Z",
      "u-ade",
      "Production created",
      "CC-001 · Small Hours",
    ],
    [
      "2026-10-24T15:00:00Z",
      "u-theo",
      "Agreement supplied (extracted, unconfirmed)",
      "CC-001 · IMG-07 · ARC-112",
    ],
  ].map(([at, user, action, detail], i) => ({
    id: i + 1,
    at,
    user,
    action,
    detail,
  }));
  return {
    version: 1,
    users: USERS.map((u) => ({ ...u })),
    policy,
    productions,
    audit,
  };
}
