// Drives the /app prototype across all three roles in a simulated DOM (happy-dom); not browser or visual QA.
// Run after `npm run build`: node scripts/test-prototype.mjs
import { Window } from "happy-dom";
import { createServer } from "vite";
import React, { act } from "react";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile("dist/app/index.html", "utf8");
assert.match(html, /<title>Interactive prototype — Cutclear<\/title>/);
assert.match(html, /Prototype · fictional data/);
assert.match(html, /Good morning, Ade/);
const home = await readFile("dist/index.html", "utf8");
for (const id of [
  "prototype",
  "benefits",
  "use-cases",
  "safeguards",
  "pricing",
  "faq",
])
  assert.match(home, new RegExp(`id="${id}"`), id);
assert.doesNotMatch(home, /£\d|\$\d|€\d/, "no invented prices");

const w = new Window({ url: "https://cutclear.site/app" });
Object.assign(globalThis, {
  window: w,
  document: w.document,
  location: w.location,
  localStorage: w.localStorage,
  IS_REACT_ACT_ENVIRONMENT: true,
});
globalThis.addEventListener = w.addEventListener.bind(w);
globalThis.removeEventListener = w.removeEventListener.bind(w);
const downloads = [];
globalThis.URL.createObjectURL = () => "blob:x";
globalThis.URL.revokeObjectURL = () => {};
w.HTMLAnchorElement.prototype.click = function () {
  downloads.push(this.download);
};
const { createRoot } = await import("react-dom/client");
const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
  logLevel: "error",
});
try {
  const { default: App } = await server.ssrLoadModule("/src/App.jsx");
  const container = document.createElement("div");
  document.body.append(container);
  let root = createRoot(container);
  await act(async () =>
    root.render(React.createElement(App, { path: "/app" })),
  );
  const text = () => document.body.textContent;
  const btn = (s) =>
    [...document.querySelectorAll("button")].find((b) =>
      b.textContent.trim().startsWith(s),
    );
  const link = (s) =>
    [...document.querySelectorAll("a")].find((a) =>
      a.textContent.trim().startsWith(s),
    );
  const click = async (el) => {
    assert.ok(el, "control exists");
    await act(async () =>
      el.dispatchEvent(
        new w.MouseEvent("click", { bubbles: true, cancelable: true }),
      ),
    );
  };
  const change = async (el, value) => {
    assert.ok(el, "field exists");
    await act(async () => {
      const proto =
        el.tagName === "SELECT"
          ? w.HTMLSelectElement.prototype
          : el.tagName === "TEXTAREA"
            ? w.HTMLTextAreaElement.prototype
            : w.HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, "value").set.call(el, value);
      el.dispatchEvent(
        new w.Event(el.tagName === "SELECT" ? "change" : "input", {
          bubbles: true,
        }),
      );
    });
  };
  const nav = async (hash) => {
    await act(async () => {
      w.location.hash = hash;
      w.dispatchEvent(new w.HashChangeEvent("hashchange"));
    });
  };
  const submit = (form) =>
    act(async () =>
      form.dispatchEvent(
        new w.Event("submit", { bubbles: true, cancelable: true }),
      ),
    );
  const demoAs = (name) =>
    change(
      document.querySelector('[aria-label="Demo as user"]'),
      [...document.querySelectorAll('[aria-label="Demo as user"] option')].find(
        (o) => o.textContent.startsWith(name),
      ).value,
    );
  const labelled = (root, s) =>
    [...root.querySelectorAll("label")].find((l) =>
      l.textContent.trim().startsWith(s),
    );

  assert.match(
    text(),
    /CC-000 · MUS-11 · LIC-090/,
    "expiry watch on the dashboard",
  );
  await nav("#/productions/CC-001/assets/IMG-07");
  assert.match(text(), /Confirm extracted terms/);
  await submit(document.querySelector(".pa-confirm"));
  assert.match(text(), /IMG-07 terms confirmed/);
  await click(link("AI suggestions"));
  await click(btn("Add restriction"));
  assert.match(text(), /Restriction added to the agreement terms/);
  await nav("#/productions/CC-001/assets/MUS-05");
  const ask = [...document.querySelectorAll(".pa-subforms form")][1];
  await change(labelled(ask, "Request").querySelector("select"), "Shorten use");
  await submit(ask);
  assert.match(text(), /Request sent to the producer/);
  await click(btn("Review report"));
  assert.deepEqual(downloads, ["cutclear-CC-001-review.json"]);
  console.log(
    "PASS coordinator: expiry watch, term confirmation, AI restriction, producer request, export",
  );

  await demoAs("Theo Grant");
  assert.equal(w.location.hash, "#/producer");
  assert.match(text(), /MUS-05 · Shorten use/);
  assert.doesNotMatch(
    text(),
    /Gaps found|Duration gap/,
    "producer does not see findings",
  );
  await nav("#/productions/CC-001");
  assert.match(text(), /Not available for this role/);
  await nav("#/producer/CC-001");
  const mus05 = [...document.querySelectorAll("section")].find((s) =>
    s.textContent.startsWith("MUS-05"),
  );
  await change(mus05.querySelector('input[type="number"]'), "15");
  await submit(mus05.querySelector("form"));
  assert.match(text(), /MUS-05 now uses 15 s/);
  console.log(
    "PASS producer: sees requests only, shortens the edit, kept out of coordinator views",
  );

  await act(async () => root.unmount());
  root = createRoot(container);
  await act(async () =>
    root.render(React.createElement(App, { path: "/app" })),
  );
  await demoAs("Ade Martins");
  await nav("#/productions/CC-001/requests");
  assert.match(text(), /Shorten use.*Done/s);
  await demoAs("Lina Park");
  await nav("#/admin/audit");
  assert.match(text(), /AI suggestion confirmed: restriction added/);
  await click(btn("Reset demo data"));
  assert.equal(localStorage.getItem("cutclear-prototype-v1"), null);
  await nav("#/productions/CC-001/assets/IMG-07");
  assert.match(text(), /Unconfirmed terms/);
  await act(async () => root.unmount());
  console.log("PASS persistence, admin audit and reset");
} finally {
  await server.close();
  await w.happyDOM.close();
}
