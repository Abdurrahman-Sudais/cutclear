// Rights-clearance checks for the Cutclear prototype. Pure functions, no DOM.
// The same rules are implemented in backend/lambdas/check_rights/handler.py; both are tested
// against backend/tests/fixtures/cases.json so the prototype and the proposed Lambda stay in step.

/** Territory hierarchy: a licence for a parent covers every child. */
export const REGIONS = {
  Worldwide: ["Europe", "North America", "Asia Pacific"],
  Europe: ["United Kingdom", "Ireland", "France", "Germany"],
  "North America": ["United States", "Canada"],
  "Asia Pacific": ["Australia", "Japan"],
};
export const TERRITORIES = Object.values(REGIONS)
  .flat()
  .filter((t) => !REGIONS[t]);
export const CHANNELS = ["Online", "Television", "Cinema", "Social"];

const parentOf = Object.fromEntries(
  Object.entries(REGIONS).flatMap(([p, kids]) => kids.map((k) => [k, p])),
);

/** True when `territory` is listed, or any of its ancestors is listed. */
export function covers(licensed, territory) {
  for (let t = territory; t; t = parentOf[t])
    if (licensed.includes(t)) return true;
  return false;
}

export const normalise = (text) =>
  String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const daysBetween = (a, b) =>
  Math.round(
    (Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000,
  );

/**
 * Compare one asset's confirmed agreement with the release plan.
 * Returns findings (each with a kind and a plain explanation) and a status.
 */
export function check(asset, plan, credits = []) {
  const f = [];
  const add = (kind, detail, blocking = true) =>
    f.push({ kind, detail, blocking });
  const a = asset.agreement;
  if (!a) {
    add(
      "Missing evidence",
      "No supporting agreement supplied. Permission is unknown, not granted.",
    );
    return { findings: f, status: "Missing evidence" };
  }
  if (!a.confirmed) {
    add(
      "Unconfirmed terms",
      `${a.ref}: permission fields were extracted but a person has not confirmed them against the agreement.`,
    );
    return { findings: f, status: "Unconfirmed terms" };
  }
  const missingT = plan.territories.filter((t) => !covers(a.territories, t));
  if (missingT.length)
    add(
      "Territory gap",
      `${a.ref} covers ${a.territories.join(", ")}; the plan also needs ${missingT.join(", ")}.`,
    );
  const missingC = plan.channels.filter((c) => !a.channels.includes(c));
  if (missingC.length)
    add(
      "Channel gap",
      `${a.ref} permits ${a.channels.join(", ") || "no channels"}; the plan also uses ${missingC.join(", ")}.`,
    );
  if (a.start > plan.start)
    add(
      "Starts late",
      `${a.ref} starts ${a.start}; the release starts ${plan.start}.`,
    );
  if (plan.end > a.end)
    add("Date gap", `${a.ref} ends ${a.end}; the release runs to ${plan.end}.`);
  if (a.maxSeconds != null && asset.usedSeconds > a.maxSeconds)
    add(
      "Duration gap",
      `The cut uses ${asset.usedSeconds} s; ${a.ref} permits up to ${a.maxSeconds} s.`,
    );
  if (plan.paidMedia && a.paidMedia === false)
    add(
      "Paid media not permitted",
      `${a.ref} excludes paid media; the plan includes paid placement.`,
    );
  if (
    a.creditRequired &&
    !credits.some((c) => normalise(c) === normalise(a.creditRequired))
  ) {
    add(
      "Credit obligation open",
      `${a.ref} requires this credit, which is not in the production credits yet: ${a.creditRequired}`,
    );
  }
  const gaps = f.filter((x) => x.kind !== "Credit obligation open");
  return {
    findings: f,
    status: gaps.length
      ? "Gaps found"
      : f.length
        ? "Obligation open"
        : "No gap detected",
  };
}

/** Licences ending within `days` of `today` whose asset is in a release that is still live. */
export function expiring(productions, today, days) {
  return productions.flatMap((p) =>
    p.assets
      .filter(
        (a) =>
          a.agreement?.confirmed &&
          a.agreement.end >= today &&
          daysBetween(today, a.agreement.end) <= days,
      )
      .map((a) => ({
        production: p.id,
        asset: a.id,
        ref: a.agreement.ref,
        end: a.agreement.end,
        days: daysBetween(today, a.agreement.end),
      })),
  );
}

/**
 * Simulated AI suggestion. In production Amazon Bedrock reads the agreement wording and must quote it.
 * Here a deterministic phrase rule produces the same shape: restrictions written in the excerpt
 * that the confirmed fields do not capture.
 */
const RESTRICTIONS = [
  {
    phrase: "paid advertising",
    field: "paidMedia",
    value: false,
    label: "Excludes paid media",
  },
  {
    phrase: "paid media",
    field: "paidMedia",
    value: false,
    label: "Excludes paid media",
  },
  {
    phrase: "not for broadcast",
    field: "channel",
    value: "Television",
    label: "Excludes television",
  },
  {
    phrase: "no television",
    field: "channel",
    value: "Television",
    label: "Excludes television",
  },
];

/** True when the confirmed fields do not already capture the restriction. */
const uncaptured = (a, r) =>
  r.field === "paidMedia"
    ? a.paidMedia !== false
    : a.channels.includes(r.value);

export function suggest(asset) {
  const a = asset.agreement;
  if (!a) return [];
  const text = ` ${normalise(a.excerpt)} `;
  const seen = new Set();
  return RESTRICTIONS.filter((r) => text.includes(` ${normalise(r.phrase)} `))
    .filter((r) => uncaptured(a, r) && !seen.has(r.label) && seen.add(r.label))
    .map((r) => ({
      id: `${asset.id}:${normalise(r.label).replace(/ /g, "-")}`,
      assetId: asset.id,
      phrase: r.phrase,
      label: r.label,
      field: r.field,
      value: r.value,
      quote: a.excerpt,
    }));
}

/** Reasons the release cannot be signed off. Empty = may sign off. */
export function signoffBlockers(p) {
  const out = [];
  const results = p.assets.map((a) => ({ a, r: check(a, p.plan, p.credits) }));
  const notClear = results.filter((x) => x.r.status !== "No gap detected");
  if (notClear.length)
    out.push(
      `${notClear.length} asset${notClear.length > 1 ? "s are" : " is"} not clear: ${notClear.map((x) => `${x.a.id} (${x.r.status})`).join(", ")}.`,
    );
  const undecided = p.assets.filter(
    (a) => a.decision?.type !== "Cleared for this plan",
  );
  if (!notClear.length && undecided.length)
    out.push(
      `${undecided.length} asset${undecided.length > 1 ? "s need" : " needs"} a coordinator decision.`,
    );
  const ai = p.suggestions.filter((s) => s.decision === "pending").length;
  if (ai)
    out.push(`${ai} AI suggestion${ai > 1 ? "s need" : " needs"} a decision.`);
  const open = p.requests.filter((r) => !r.done).length;
  if (open)
    out.push(
      `${open} request${open > 1 ? "s to the producer are" : " to the producer is"} open.`,
    );
  return out;
}

export function productionStatus(p) {
  if (p.signoff?.final) return "Signed off";
  if (p.signoff) return "Awaiting second sign-off";
  if (p.requests.some((r) => !r.done)) return "Waiting on producer";
  return signoffBlockers(p).length ? "In review" : "Ready for sign-off";
}

export function csv(rows) {
  return rows
    .map((r) =>
      r
        .map((v) => {
          const s = String(v ?? "");
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(","),
    )
    .join("\n");
}
