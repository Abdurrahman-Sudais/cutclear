export const initialPlan = {
  territory: "United Kingdom",
  online: true,
  television: true,
  end: "2027-12-31",
};
export const assets = [
  {
    id: "MUS-01",
    name: "Evening Pattern",
    type: "Music",
    ref: "LIC-014",
    end: "2027-12-31",
    channels: ["Online"],
    excerpt:
      "LIC-014 · Fictional sample. Evening Pattern may be used in the United Kingdom, online only, from 1 January 2027 to 31 December 2027. Television use is not included.",
  },
  {
    id: "TAL-02",
    name: "Performer release",
    type: "Talent",
    ref: "REL-008",
    end: "2027-06-30",
    channels: ["Online", "Television"],
    excerpt:
      "REL-008 · Fictional sample. The recorded performer permission covers United Kingdom online and television use from 1 January 2027 to 30 June 2027.",
  },
  {
    id: "VID-03",
    name: "Original footage",
    type: "Footage",
    ref: "OWN-003",
    end: "2027-12-31",
    channels: ["Online", "Television"],
    excerpt:
      "OWN-003 · Fictional sample. This supporting record expressly supports the requested United Kingdom online and television use from 1 January 2027 to 31 December 2027. No broader rights are recorded.",
  },
  {
    id: "VID-04",
    name: "City at dusk",
    type: "Stock footage",
    ref: null,
    end: null,
    channels: [],
    excerpt:
      "No supporting agreement supplied. Permission is unknown. A supporting agreement and confirmed permission fields are required.",
  },
];
export function gaps(asset, plan) {
  if (!asset.ref) return ["Missing evidence"];
  const found = [];
  if (plan.television && !asset.channels.includes("Television"))
    found.push("Channel gap");
  if (plan.online && !asset.channels.includes("Online"))
    found.push("Channel gap");
  if (plan.end > asset.end) found.push("Date gap");
  if (plan.territory !== "United Kingdom") found.push("Territory gap");
  return [...new Set(found)];
}
export function report(plan, reviews) {
  return {
    title: "Cutclear — SAMPLE RIGHTS-REVIEW REPORT",
    production: "Small Hours / CC-001",
    release: { start: "2027-01-01", ...plan },
    scope:
      "Sample review only. Not legal clearance or approval for release. No licence purchase or external delivery.",
    assets: assets.map((a) => ({
      ...a,
      findings: gaps(a, plan),
      status: gaps(a, plan).length
        ? gaps(a, plan).join("; ")
        : "No gap detected against recorded terms.",
      review: reviews[a.id] || {
        reviewer: "Unassigned",
        decision: "Not reviewed",
        note: "",
      },
    })),
  };
}
