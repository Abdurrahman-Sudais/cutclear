import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  check,
  covers,
  suggest,
  expiring,
  signoffBlockers,
  productionStatus,
  csv,
} from "./engine.js";
import { seed } from "./seed.js";

const fx = JSON.parse(
  await readFile(
    new URL("../../backend/tests/fixtures/cases.json", import.meta.url),
    "utf8",
  ),
);

test("rights checks match the shared fixtures used by the Python Lambda", () => {
  for (const c of fx.cases) {
    const asset = {
      id: "X",
      usedSeconds: c.usedSeconds ?? 10,
      agreement: c.noAgreement
        ? null
        : { ...fx.agreement, ...(c.agreement || {}) },
    };
    const r = check(asset, { ...fx.plan, ...(c.plan || {}) }, c.credits || []);
    assert.equal(r.status, c.status, `${c.name}: status`);
    assert.deepEqual(
      r.findings.map((f) => f.kind),
      c.kinds,
      `${c.name}: kinds`,
    );
  }
});

test("AI restriction rule matches the shared fixtures", () => {
  for (const s of fx.suggestions) {
    const asset = {
      id: "X",
      agreement: { ...fx.agreement, ...s.agreement, excerpt: s.excerpt },
    };
    assert.deepEqual(
      suggest(asset).map((x) => x.label),
      s.labels,
      s.excerpt,
    );
  }
});

test("territory hierarchy", () => {
  assert.equal(covers(["Europe"], "Ireland"), true);
  assert.equal(covers(["Worldwide"], "Japan"), true);
  assert.equal(covers(["United Kingdom"], "Europe"), false);
  assert.equal(covers(["North America"], "Ireland"), false);
});

test("seed CC-001 matches the home-page release desk and blocks sign-off", () => {
  const d = seed();
  const p = d.productions.find((x) => x.id === "CC-001");
  const status = (id) =>
    check(
      p.assets.find((a) => a.id === id),
      p.plan,
      p.credits,
    );
  assert.deepEqual(
    status("MUS-01").findings.map((f) => f.kind),
    ["Channel gap", "Credit obligation open"],
  );
  assert.deepEqual(
    status("TAL-02").findings.map((f) => f.kind),
    ["Date gap"],
  );
  assert.equal(status("VID-03").status, "No gap detected");
  assert.equal(status("VID-04").status, "Missing evidence");
  assert.deepEqual(
    status("MUS-05").findings.map((f) => f.kind),
    ["Duration gap"],
  );
  assert.equal(status("IMG-07").status, "Unconfirmed terms");
  assert.deepEqual(
    p.suggestions.map((s) => s.label),
    ["Excludes paid media"],
  );
  assert.equal(productionStatus(p), "In review");
  assert.equal(signoffBlockers(p).length, 2);
  assert.deepEqual(
    expiring(d.productions, d.policy.today, d.policy.expiryWarningDays).map(
      (x) => x.asset,
    ),
    ["MUS-11"],
  );
});

test("csv escaping", () =>
  assert.equal(
    csv([
      ["a", "b,c"],
      ['"q"', "x\ny"],
    ]),
    'a,"b,c"\n"""q""","x\ny"',
  ));
