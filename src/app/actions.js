// State transitions for the prototype. Each action mutates a draft copy of the workspace data,
// checks the acting user's role first, and writes an audit entry. The UI clones, applies and
// persists; tests call these directly.
import {
  check,
  signoffBlockers,
  CHANNELS,
  TERRITORIES,
  REGIONS,
} from "./engine.js";
import { withSuggestions } from "./seed.js";

export const PERMISSIONS = [
  [
    "View productions and findings",
    {
      coordinator: true,
      producer: "Own requests and assets",
      admin: "Aggregates only",
    },
  ],
  [
    "Create productions, edit the release plan",
    { coordinator: true, producer: false, admin: false },
  ],
  [
    "Confirm agreement terms, decide AI suggestions",
    { coordinator: true, producer: false, admin: false },
  ],
  [
    "Request agreements, credits or edits",
    { coordinator: true, producer: false, admin: false },
  ],
  [
    "Add assets, supply agreements, credits and edit details",
    { coordinator: false, producer: true, admin: false },
  ],
  [
    "Record asset decisions and sign off a release",
    { coordinator: true, producer: false, admin: false },
  ],
  [
    "Change roles and policy",
    { coordinator: false, producer: false, admin: true },
  ],
  ["View audit log", { coordinator: false, producer: false, admin: true }],
];
export const DECISIONS = [
  "Cleared for this plan",
  "Needs licence change",
  "Replace or remove",
];
export const REQUESTS = [
  "Supply agreement",
  "Add credit",
  "Shorten use",
  "Replace asset",
  "Licence extension",
];

export class PermissionError extends Error {}
export const userById = (d, id) => d.users.find((u) => u.id === id);
export const prodById = (d, id) => d.productions.find((p) => p.id === id);
export const displayName = (d, id) =>
  id === "system" ? "System" : userById(d, id)?.name || id;

function guard(d, userId, roles, what) {
  const u = userById(d, userId);
  if (!u || !roles.includes(u.role))
    throw new PermissionError(`${u ? u.name : "This user"} cannot ${what}.`);
  return u;
}
export function audit(d, userId, action, detail, now) {
  d.audit.push({
    id: (d.audit.at(-1)?.id || 0) + 1,
    at: now,
    user: userId,
    action,
    detail,
  });
}
function assetOf(p, id) {
  const a = p.assets.find((x) => x.id === id);
  if (!a) throw new Error("Asset not found.");
  return a;
}
/** Any change to facts clears decisions and pending sign-off; a final sign-off is reopened. */
function invalidate(d, p, userId, now, why, assetId) {
  for (const a of p.assets) if (!assetId || a.id === assetId) a.decision = null;
  if (p.signoff) {
    audit(
      d,
      userId,
      p.signoff.final ? "Sign-off reopened" : "Pending sign-off revoked",
      `${p.id} · ${why}`,
      now,
    );
    p.signoff = null;
  }
}
function refreshSuggestions(d, i) {
  d.productions[i] = withSuggestions(d.productions[i], d.policy);
}
function closeRequests(p, assetId, kinds, now) {
  p.requests
    .filter((r) => r.assetId === assetId && kinds.includes(r.kind) && !r.done)
    .forEach((r) => Object.assign(r, { done: true, doneAt: now }));
}
const validPlace = (t) => TERRITORIES.includes(t) || REGIONS[t];

export function createProduction(d, userId, input, now) {
  guard(d, userId, ["coordinator"], "create productions");
  if (!input.title?.trim()) throw new Error("Give the production a title.");
  const plan = validatePlan({
    version: 1,
    start: input.start,
    end: input.end,
    territories: input.territories,
    channels: input.channels,
    paidMedia: !!input.paidMedia,
  });
  const n = Math.max(...d.productions.map((p) => Number(p.id.slice(3)))) + 1;
  const id = `CC-${String(n).padStart(3, "0")}`;
  d.productions.unshift({
    id,
    title: input.title.trim(),
    client: input.client?.trim() || "—",
    owner: userId,
    plan,
    credits: [],
    assets: [],
    requests: [],
    suggestions: [],
    signoff: null,
  });
  audit(d, userId, "Production created", `${id} · ${input.title.trim()}`, now);
  return id;
}

function validatePlan(plan) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(plan.start || "") ||
    !/^\d{4}-\d{2}-\d{2}$/.test(plan.end || "")
  )
    throw new Error("Enter release start and end dates.");
  if (plan.end < plan.start)
    throw new Error("The release ends before it starts.");
  if (
    !plan.territories?.length ||
    !plan.territories.every((t) => TERRITORIES.includes(t))
  )
    throw new Error("Choose at least one territory.");
  if (
    !plan.channels?.length ||
    !plan.channels.every((c) => CHANNELS.includes(c))
  )
    throw new Error("Choose at least one channel.");
  return plan;
}

export function updatePlan(d, userId, prodId, patch, now) {
  guard(d, userId, ["coordinator"], "edit the release plan");
  const p = prodById(d, prodId);
  const next = validatePlan({
    ...p.plan,
    ...patch,
    version: p.plan.version + 1,
  });
  p.plan = next;
  invalidate(d, p, userId, now, `plan changed to v${next.version}`);
  audit(
    d,
    userId,
    "Release plan changed",
    `${prodId} · v${next.version}: ${next.territories.join(", ")} · ${next.channels.join(", ")}${next.paidMedia ? " · paid media" : ""} · ${next.start} to ${next.end}`,
    now,
  );
}

export function confirmTerms(d, userId, prodId, assetId, fields, now) {
  guard(d, userId, ["coordinator"], "confirm agreement terms");
  const i = d.productions.findIndex((x) => x.id === prodId);
  const p = d.productions[i];
  const a = assetOf(p, assetId);
  if (!a.agreement)
    throw new Error("No agreement has been supplied for this asset.");
  const ag = { ...a.agreement, ...fields };
  if (!ag.territories.length || !ag.territories.every(validPlace))
    throw new Error("Choose the licensed territories.");
  if (!ag.channels.every((c) => CHANNELS.includes(c)))
    throw new Error("Unknown channel.");
  if (!ag.start || !ag.end || ag.end < ag.start)
    throw new Error("Check the licence dates.");
  a.agreement = {
    ...ag,
    confirmed: true,
    confirmedBy: userId,
    confirmedAt: now,
  };
  invalidate(d, p, userId, now, `${assetId} terms confirmed`, assetId);
  audit(
    d,
    userId,
    "Agreement terms confirmed",
    `${prodId} · ${assetId} · ${ag.ref}`,
    now,
  );
  refreshSuggestions(d, i);
}

export function decideSuggestion(
  d,
  userId,
  prodId,
  suggestionId,
  confirm,
  reason,
  now,
) {
  guard(d, userId, ["coordinator"], "decide AI suggestions");
  const p = prodById(d, prodId);
  const s = p.suggestions.find((x) => x.id === suggestionId);
  if (!confirm && (!reason || reason.trim().length < 10))
    throw new Error(
      "Give a reason of at least 10 characters for dismissing a suggestion.",
    );
  s.decision = confirm ? "confirmed" : "dismissed";
  s.reason = confirm ? "" : reason.trim();
  s.by = userId;
  s.at = now;
  if (confirm) {
    const a = assetOf(p, s.assetId);
    if (s.field === "paidMedia") a.agreement.paidMedia = false;
    if (s.field === "channel")
      a.agreement.channels = a.agreement.channels.filter((c) => c !== s.value);
    invalidate(d, p, userId, now, `${s.assetId} restriction added`, s.assetId);
  }
  audit(
    d,
    userId,
    confirm
      ? "AI suggestion confirmed: restriction added"
      : "AI suggestion dismissed",
    `${prodId} · ${s.assetId} · ${s.label}${confirm ? "" : ` · ${s.reason}`}`,
    now,
  );
}

export function decideAsset(d, userId, prodId, assetId, type, note, now) {
  guard(d, userId, ["coordinator"], "record decisions");
  const p = prodById(d, prodId);
  const a = assetOf(p, assetId);
  if (!DECISIONS.includes(type)) throw new Error("Choose a decision.");
  const r = check(a, p.plan, p.credits);
  if (type === "Cleared for this plan" && r.status !== "No gap detected")
    throw new Error(`${assetId} cannot be cleared: ${r.status}.`);
  if (type !== "Cleared for this plan" && (!note || note.trim().length < 10))
    throw new Error("Explain what needs to happen (at least 10 characters).");
  a.decision = {
    type,
    note: (note || "").trim(),
    by: userId,
    at: now,
    planVersion: p.plan.version,
  };
  audit(
    d,
    userId,
    "Asset decision recorded",
    `${prodId} · ${assetId} · ${type}`,
    now,
  );
}

export function requestFromProducer(
  d,
  userId,
  prodId,
  assetId,
  kind,
  note,
  now,
) {
  guard(d, userId, ["coordinator"], "send requests");
  const p = prodById(d, prodId);
  assetOf(p, assetId);
  if (!REQUESTS.includes(kind)) throw new Error("Choose what you need.");
  if (
    p.requests.some((r) => r.assetId === assetId && r.kind === kind && !r.done)
  )
    throw new Error("That request is already open.");
  p.requests.push({
    id: `${prodId}-R${p.requests.length + 1}`,
    assetId,
    kind,
    note: (note || "").trim(),
    by: userId,
    at: now,
    done: false,
  });
  audit(
    d,
    userId,
    "Request sent to producer",
    `${prodId} · ${assetId} · ${kind}`,
    now,
  );
}

/* ---------- Producer ---------- */
export function addAsset(d, userId, prodId, input, now) {
  guard(d, userId, ["producer"], "add assets");
  const p = prodById(d, prodId);
  if (!input.name?.trim() || !input.type)
    throw new Error("Name the asset and choose its type.");
  const prefix =
    {
      Music: "MUS",
      Footage: "VID",
      "Stock footage": "VID",
      Talent: "TAL",
      "Still image": "IMG",
      Font: "FNT",
    }[input.type] || "AST";
  const n =
    Math.max(
      0,
      ...d.productions.flatMap((x) =>
        x.assets.map((a) => Number(a.id.slice(4))),
      ),
    ) + 1;
  const id = `${prefix}-${String(n).padStart(2, "0")}`;
  p.assets.push({
    id,
    name: input.name.trim(),
    type: input.type,
    usedSeconds: Number(input.usedSeconds) || 0,
    agreement: null,
  });
  invalidate(d, p, userId, now, `${id} added to the cut`, id);
  audit(
    d,
    userId,
    "Asset added",
    `${prodId} · ${id} · ${input.name.trim()}`,
    now,
  );
  return id;
}

export function supplyAgreement(d, userId, prodId, assetId, fields, now) {
  guard(d, userId, ["producer"], "supply agreements");
  const i = d.productions.findIndex((x) => x.id === prodId);
  const p = d.productions[i];
  const a = assetOf(p, assetId);
  if (!fields.ref?.trim() || !fields.excerpt?.trim())
    throw new Error(
      "Enter the agreement reference and paste the permission wording.",
    );
  a.agreement = {
    ref: fields.ref.trim(),
    excerpt: fields.excerpt.trim(),
    confirmed: false,
    territories: fields.territories || [],
    channels: fields.channels || [],
    start: fields.start || "",
    end: fields.end || "",
    maxSeconds: fields.maxSeconds ? Number(fields.maxSeconds) : null,
    paidMedia: fields.paidMedia ?? null,
    creditRequired: fields.creditRequired?.trim() || null,
  };
  closeRequests(p, assetId, ["Supply agreement", "Licence extension"], now);
  invalidate(d, p, userId, now, `${assetId} agreement supplied`, assetId);
  audit(
    d,
    userId,
    "Agreement supplied (extracted, unconfirmed)",
    `${prodId} · ${assetId} · ${a.agreement.ref}`,
    now,
  );
  refreshSuggestions(d, i);
}

export function addCredit(d, userId, prodId, text, now) {
  guard(d, userId, ["producer"], "edit credits");
  const p = prodById(d, prodId);
  if (!text.trim()) throw new Error("Enter the credit text.");
  p.credits.push(text.trim());
  p.requests
    .filter((r) => r.kind === "Add credit" && !r.done)
    .forEach((r) => {
      const a = p.assets.find((x) => x.id === r.assetId);
      if (
        check(a, p.plan, p.credits).findings.every(
          (f) => f.kind !== "Credit obligation open",
        )
      )
        Object.assign(r, { done: true, doneAt: now });
    });
  invalidate(d, p, userId, now, "credits changed");
  audit(d, userId, "Credit added", `${prodId} · ${text.trim()}`, now);
}

export function editUse(d, userId, prodId, assetId, usedSeconds, now) {
  guard(d, userId, ["producer"], "edit the cut");
  const p = prodById(d, prodId);
  const a = assetOf(p, assetId);
  const s = Number(usedSeconds);
  if (!Number.isFinite(s) || s < 0) throw new Error("Enter the seconds used.");
  a.usedSeconds = s;
  closeRequests(p, assetId, ["Shorten use"], now);
  invalidate(d, p, userId, now, `${assetId} duration changed`, assetId);
  audit(d, userId, "Edit updated", `${prodId} · ${assetId} · ${s} s`, now);
}

export function removeAsset(d, userId, prodId, assetId, now) {
  guard(d, userId, ["producer"], "remove assets");
  const p = prodById(d, prodId);
  assetOf(p, assetId);
  p.assets = p.assets.filter((a) => a.id !== assetId);
  p.suggestions = p.suggestions.filter((s) => s.assetId !== assetId);
  p.requests
    .filter((r) => r.assetId === assetId && !r.done)
    .forEach((r) => Object.assign(r, { done: true, doneAt: now }));
  invalidate(d, p, userId, now, `${assetId} removed from the cut`);
  audit(d, userId, "Asset removed from cut", `${prodId} · ${assetId}`, now);
}

export function signOff(d, userId, prodId, now) {
  guard(d, userId, ["coordinator"], "sign off releases");
  const p = prodById(d, prodId);
  const b = signoffBlockers(p);
  if (b.length) throw new Error(b.join(" "));
  if (p.signoff && !p.signoff.final) {
    if (p.signoff.by === userId)
      throw new Error("A different coordinator must give the second sign-off.");
    p.signoff = { ...p.signoff, second: userId, secondAt: now, final: true };
    audit(
      d,
      userId,
      "Release signed off (second)",
      `${prodId} · plan v${p.plan.version}`,
      now,
    );
    return;
  }
  if (p.signoff?.final) throw new Error("Already signed off.");
  p.signoff = {
    version: p.plan.version,
    by: userId,
    at: now,
    final: !d.policy.twoPersonSignoff,
  };
  audit(
    d,
    userId,
    d.policy.twoPersonSignoff
      ? "Release signed off (first)"
      : "Release signed off",
    `${prodId} · plan v${p.plan.version}`,
    now,
  );
}

export function setRole(d, userId, targetId, role, now) {
  guard(d, userId, ["admin"], "change roles");
  if (targetId === userId && role !== "admin")
    throw new Error("You cannot remove your own administrator role.");
  const t = userById(d, targetId);
  const old = t.role;
  t.role = role;
  audit(d, userId, "Role changed", `${t.name}: ${old} → ${role}`, now);
}

export function setPolicy(d, userId, key, value, now) {
  guard(d, userId, ["admin"], "change policy");
  if (key === "expiryWarningDays") {
    value = Number(value);
    if (!Number.isFinite(value) || value < 7 || value > 365)
      throw new Error("Expiry warning must be between 7 and 365 days.");
  }
  if (key === "today" && !/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new Error("Enter a valid date.");
  const old = d.policy[key];
  d.policy[key] = value;
  audit(d, userId, "Policy changed", `${key}: ${old} → ${value}`, now);
}

/** JSON clearance report for export. */
export function clearanceReport(d, p) {
  return {
    title: `Cutclear prototype — rights-review report ${p.id}`,
    scope:
      "Fictional sample data. Not legal clearance or approval for release. No licence purchase or external delivery.",
    production: { id: p.id, title: p.title, client: p.client },
    plan: p.plan,
    signoff: p.signoff && {
      ...p.signoff,
      by: displayName(d, p.signoff.by),
      second: p.signoff.second ? displayName(d, p.signoff.second) : null,
    },
    credits: p.credits,
    assets: p.assets.map((a) => {
      const r = check(a, p.plan, p.credits);
      return {
        id: a.id,
        name: a.name,
        type: a.type,
        usedSeconds: a.usedSeconds,
        agreement: a.agreement,
        status: r.status,
        findings: r.findings,
        decision: a.decision
          ? { ...a.decision, by: displayName(d, a.decision.by) }
          : null,
      };
    }),
    aiSuggestions: p.suggestions.map((s) => ({
      asset: s.assetId,
      suggestion: s.label,
      decision: s.decision,
      reason: s.reason || null,
    })),
    openRequests: p.requests
      .filter((r) => !r.done)
      .map((r) => ({ asset: r.assetId, kind: r.kind, note: r.note })),
  };
}
