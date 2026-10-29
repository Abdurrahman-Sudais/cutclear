import test from "node:test";
import assert from "node:assert/strict";
import { seed } from "./seed.js";
import * as A from "./actions.js";
import { check, productionStatus } from "./engine.js";

const t = (n = 0) => new Date(Date.UTC(2026, 10, 2, 9, n)).toISOString();
const P = "CC-001";

test("full clearance loop: requests, producer fixes, term confirmation, AI restriction, decisions, two-person sign-off", () => {
  const d = seed();
  const p = () => A.prodById(d, P);
  const st = (id) =>
    check(
      p().assets.find((a) => a.id === id),
      p().plan,
      p().credits,
    ).status;

  // Coordinator asks; producer cannot decide, coordinator cannot supply.
  A.requestFromProducer(d, "u-ade", P, "MUS-01", "Add credit", "", t());
  A.requestFromProducer(
    d,
    "u-ade",
    P,
    "MUS-05",
    "Shorten use",
    "Trim to 15 s",
    t(),
  );
  A.requestFromProducer(d, "u-ade", P, "VID-04", "Supply agreement", "", t());
  assert.equal(productionStatus(p()), "Waiting on producer");
  assert.throws(
    () =>
      A.decideAsset(d, "u-theo", P, "VID-03", "Cleared for this plan", "", t()),
    A.PermissionError,
  );
  assert.throws(
    () =>
      A.supplyAgreement(
        d,
        "u-ade",
        P,
        "VID-04",
        { ref: "X", excerpt: "x" },
        t(),
      ),
    A.PermissionError,
  );

  // Producer fixes.
  A.addCredit(d, "u-theo", P, "“Evening Pattern” written by L. Ray", t(1));
  A.editUse(d, "u-theo", P, "MUS-05", 15, t(2));
  A.supplyAgreement(
    d,
    "u-theo",
    P,
    "VID-04",
    {
      ref: "STK-5521",
      excerpt:
        "Stock licence STK-5521 · United Kingdom, online and television, 2027.",
      territories: ["United Kingdom"],
      channels: ["Online", "Television"],
      start: "2027-01-01",
      end: "2027-12-31",
    },
    t(3),
  );
  assert.ok(p().requests.every((r) => r.done));
  assert.equal(st("MUS-05"), "No gap detected");
  assert.equal(st("VID-04"), "Unconfirmed terms");

  // Coordinator confirms terms; AI restriction on the archive photo is confirmed and creates a gap.
  A.confirmTerms(d, "u-ade", P, "VID-04", {}, t(4));
  A.confirmTerms(d, "u-ade", P, "IMG-07", {}, t(5));
  assert.equal(
    st("IMG-07"),
    "No gap detected",
    "before the AI restriction is added",
  );
  const sid = p().suggestions[0].id;
  A.decideSuggestion(d, "u-ade", P, sid, true, "", t(6));
  assert.equal(st("IMG-07"), "Gaps found");
  assert.throws(
    () =>
      A.decideAsset(d, "u-ade", P, "IMG-07", "Cleared for this plan", "", t()),
    /cannot be cleared/,
  );
  A.decideAsset(
    d,
    "u-ade",
    P,
    "IMG-07",
    "Replace or remove",
    "Archive photo cannot run in paid placements.",
    t(7),
  );

  // Remaining gaps: MUS-01 needs TV; TAL-02 ends in June; the photo. Narrow the plan instead.
  A.updatePlan(
    d,
    "u-ade",
    P,
    { channels: ["Online"], end: "2027-06-30", paidMedia: false },
    t(8),
  );
  assert.equal(p().plan.version, 2);
  assert.ok(
    p().assets.every((a) => !a.decision),
    "plan change clears decisions",
  );
  for (const a of p().assets) assert.equal(st(a.id), "No gap detected", a.id);
  for (const a of p().assets)
    A.decideAsset(d, "u-ade", P, a.id, "Cleared for this plan", "", t(9));
  assert.equal(productionStatus(p()), "Ready for sign-off");

  A.signOff(d, "u-ade", P, t(10));
  assert.throws(() => A.signOff(d, "u-ade", P, t()), /different coordinator/);
  assert.throws(() => A.signOff(d, "u-theo", P, t()), A.PermissionError);
  A.signOff(d, "u-nia", P, t(11));
  assert.equal(productionStatus(p()), "Signed off");

  // Any change reopens sign-off.
  A.addCredit(d, "u-theo", P, "Colour by K. Wu", t(12));
  assert.equal(p().signoff, null);
  assert.ok(d.audit.some((a) => a.action === "Sign-off reopened"));
  const r = A.clearanceReport(d, p());
  assert.match(r.scope, /Not legal clearance/);
});

test("dismissing a suggestion needs a reason; confirmed fields retire a pending suggestion", () => {
  const d = seed();
  const sid = A.prodById(d, P).suggestions[0].id;
  assert.throws(
    () => A.decideSuggestion(d, "u-ade", P, sid, false, "nah", t()),
    /10 characters/,
  );
  A.confirmTerms(d, "u-ade", P, "IMG-07", { paidMedia: false }, t());
  assert.equal(
    A.prodById(d, P).suggestions.length,
    0,
    "the fields now capture the restriction",
  );
});

test("new production, plan validation, roles and policy bounds", () => {
  const d = seed();
  assert.throws(
    () =>
      A.createProduction(
        d,
        "u-ade",
        {
          title: "X",
          start: "2027-05-01",
          end: "2027-04-01",
          territories: ["Ireland"],
          channels: ["Online"],
        },
        t(),
      ),
    /ends before/,
  );
  assert.throws(
    () =>
      A.createProduction(
        d,
        "u-ade",
        {
          title: "X",
          start: "2027-01-01",
          end: "2027-04-01",
          territories: ["Europe"],
          channels: ["Online"],
        },
        t(),
      ),
    /territory/,
  );
  const id = A.createProduction(
    d,
    "u-ade",
    {
      title: "Harbour Lights",
      start: "2027-03-01",
      end: "2027-08-31",
      territories: ["Ireland"],
      channels: ["Online"],
    },
    t(),
  );
  assert.equal(id, "CC-002");
  const aid = A.addAsset(
    d,
    "u-theo",
    id,
    { name: "Gulls", type: "Stock footage", usedSeconds: 5 },
    t(),
  );
  assert.equal(
    check(A.prodById(d, id).assets[0], A.prodById(d, id).plan, []).status,
    "Missing evidence",
  );
  A.removeAsset(d, "u-theo", id, aid, t());
  assert.equal(A.prodById(d, id).assets.length, 0);
  assert.throws(
    () => A.setPolicy(d, "u-lina", "expiryWarningDays", 2, t()),
    /between/,
  );
  assert.throws(
    () => A.setRole(d, "u-lina", "u-lina", "producer", t()),
    /own administrator/,
  );
});

test("early-access validation and HubSpot payload", async () => {
  const { validateLead, leadPayload, hubspotConfig } =
    await import("../lead.js");
  const f = {
    name: "Ana Ruiz",
    email: "ana@example.com",
    company: "Reel Co",
    role: "Producer",
    type: "Studio production",
    volume: "5–20",
    challenge: "Music cue sheets",
    consent: false,
    marketing: false,
  };
  assert.match(validateLead(f), /agree/);
  assert.equal(validateLead({ ...f, consent: true }), "");
  assert.deepEqual(
    leadPayload({ ...f, consent: true }, {}, {}).fields.map((x) => x.name),
    [
      "firstname",
      "lastname",
      "email",
      "company",
      "jobtitle",
      "production_type",
      "monthly_releases",
      "rights_challenge",
    ],
  );
  assert.equal(hubspotConfig({}), null);
});
