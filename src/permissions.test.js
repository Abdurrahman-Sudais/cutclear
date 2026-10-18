import test from "node:test";
import assert from "node:assert/strict";
import { assets, initialPlan, gaps, report } from "./permissions.js";
test("initial plan finds exact channel, date, known and unknown states", () => {
  assert.deepEqual(
    assets.map((a) => gaps(a, initialPlan)),
    [["Channel gap"], ["Date gap"], [], ["Missing evidence"]],
  );
});
test("removing television clears only the music finding", () => {
  const p = { ...initialPlan, television: false };
  assert.deepEqual(
    assets.map((a) => gaps(a, p)),
    [[], ["Date gap"], [], ["Missing evidence"]],
  );
});
test("June 30 boundary clears performer date gap, July 1 does not", () => {
  assert.deepEqual(gaps(assets[1], { ...initialPlan, end: "2027-06-30" }), []);
  assert.deepEqual(gaps(assets[1], { ...initialPlan, end: "2027-07-01" }), [
    "Date gap",
  ]);
  assert.deepEqual(gaps(assets[0], { ...initialPlan, end: "2027-06-30" }), [
    "Channel gap",
  ]);
});
test("unsupported territory flags all supplied UK records but missing evidence stays unknown", () => {
  assert.deepEqual(
    assets.map((a) => gaps(a, { ...initialPlan, territory: "Worldwide" })),
    [
      ["Channel gap", "Territory gap"],
      ["Date gap", "Territory gap"],
      ["Territory gap"],
      ["Missing evidence"],
    ],
  );
});
test("missing record never passes under changed plan", () => {
  for (const television of [true, false])
    assert.deepEqual(
      gaps(assets[3], { ...initialPlan, television, end: "2027-01-01" }),
      ["Missing evidence"],
    );
});
test("acknowledgement and notes cannot mutate evidence or findings; export preserves uncertainty", () => {
  const before = JSON.stringify(assets);
  const reviews = {
    "MUS-01": {
      decision: "Acknowledged",
      reviewer: "Alex",
      note: "Needs follow-up",
    },
  };
  const out = report(initialPlan, reviews);
  assert.equal(out.assets[0].review.decision, "Acknowledged");
  assert.deepEqual(out.assets[0].findings, ["Channel gap"]);
  assert.deepEqual(out.assets[3].findings, ["Missing evidence"]);
  assert.match(out.title, /SAMPLE/);
  assert.equal(JSON.stringify(assets), before);
});
test("fresh initial plan restores initial states after a modified review", () => {
  const changed = { ...initialPlan, television: false, end: "2027-06-30" };
  assert.deepEqual(gaps(assets[0], changed), []);
  assert.deepEqual(gaps(assets[0], { ...initialPlan }), ["Channel gap"]);
  assert.equal(
    report(initialPlan, {}).assets[0].review.decision,
    "Not reviewed",
  );
});

test("every allowed campaign end on or before June 30 clears only the performer date gap", () => {
  for (const end of ["2027-01-01", "2027-06-29", "2027-06-30"]) {
    const plan = { ...initialPlan, end };
    assert.deepEqual(gaps(assets[1], plan), []);
    assert.deepEqual(gaps(assets[0], plan), ["Channel gap"]);
    assert.deepEqual(gaps(assets[3], plan), ["Missing evidence"]);
  }
  const out = report(initialPlan, {});
  assert.deepEqual(
    out.assets.map((a) => a.findings),
    [["Channel gap"], ["Date gap"], [], ["Missing evidence"]],
  );
});
