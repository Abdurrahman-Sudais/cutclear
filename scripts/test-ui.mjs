// Component interaction tests in a simulated DOM; not browser/runtime or visual QA.
import { Window } from "happy-dom";
import { createServer } from "vite";
import React, { act } from "react";
import assert from "node:assert/strict";
const w = new Window({ url: "https://cutclear.site" });
globalThis.window = w;
globalThis.document = w.document;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { createRoot } = await import("react-dom/client");
globalThis.location = w.location;
globalThis.FormData = w.FormData;
const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
});
const { default: App } = await server.ssrLoadModule("/src/App.jsx");
const container = document.createElement("div");
document.body.append(container);
const root = createRoot(container);
const byText = (selector, text) =>
  [...document.querySelectorAll(selector)].find(
    (el) => el.textContent.trim() === text,
  );
async function click(el) {
  assert.ok(el, "target exists");
  await act(async () => {
    el.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
    await Promise.resolve();
  });
}
async function input(el, value) {
  assert.ok(el);
  await act(() => {
    const proto =
      el.tagName === "TEXTAREA"
        ? w.HTMLTextAreaElement.prototype
        : w.HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value").set.call(el, value);
    el.dispatchEvent(new w.Event("input", { bubbles: true }));
  });
}
async function change(el, value) {
  assert.ok(el);
  await act(() => {
    el.value = value;
    el.dispatchEvent(new w.Event("change", { bubbles: true }));
  });
}
try {
  await act(() => root.render(React.createElement(App, { path: "/" })));
  assert.ok(document.querySelector("#leadership"));
  await click(document.querySelector('button[aria-label="Open menu"]'));
  assert.equal(
    document
      .querySelector('button[aria-label="Close menu"]')
      .getAttribute("aria-expanded"),
    "true",
  );
  await click(byText(".nav a", "Team"));
  assert.equal(
    document.querySelector(".nav").classList.contains("open"),
    false,
  );
  await click(byText(".workspace-nav button", "Productions"));
  assert.ok(document.querySelector(".production-view"));
  await click(byText(".workspace-nav button", "Agreements"));
  assert.match(document.querySelector(".records").textContent, /LIC-014/);
  await input(document.querySelector(".search input"), "REL-008");
  assert.equal(document.querySelectorAll("button.record").length, 1);
  await click(document.querySelector("button.record"));
  assert.match(
    document.querySelector(".dialog blockquote").textContent,
    /30 June 2027/,
  );
  await click(byText(".dialog button", "Done"));
  await input(document.querySelector(".search input"), "");
  await click(byText(".workspace-nav button", "Reviews"));
  assert.match(document.querySelector(".records").textContent, /Not reviewed/);
  await click(byText(".workspace-nav button", "Assets"));
  assert.equal(document.querySelectorAll("button.record").length, 4);
  await change(document.querySelector("#filter"), "Channel gap");
  assert.equal(document.querySelectorAll("button.record").length, 1);
  assert.match(
    document.querySelector("button.record").textContent,
    /Evening Pattern/,
  );
  for (const [filter, id] of [
    ["Date gap", "TAL-02"],
    ["Missing evidence", "VID-04"],
  ]) {
    await change(document.querySelector("#filter"), filter);
    assert.equal(document.querySelectorAll("button.record").length, 1);
    assert.match(
      document.querySelector("button.record").textContent,
      new RegExp(id),
    );
  }
  await click(document.querySelector("button.record"));
  assert.match(
    document.querySelector(".dialog blockquote").textContent,
    /Permission is unknown/,
  );
  await click(byText(".dialog button", "Done"));
  await change(document.querySelector("#filter"), "Reviewed");
  assert.equal(document.querySelectorAll("button.record").length, 0);
  assert.ok(document.querySelector(".empty"));
  await change(document.querySelector("#filter"), "Not reviewed");
  assert.equal(document.querySelectorAll("button.record").length, 4);
  await change(document.querySelector("#filter"), "All");
  await click(document.querySelector("button.record"));
  assert.match(
    document.querySelector("[role=dialog]").textContent,
    /online only/,
  );
  await change(
    document.querySelector(".dialog select"),
    "Alex · Producer (sample)",
  );
  await change(document.querySelectorAll(".dialog select")[1], "Acknowledged");
  await click(byText(".dialog button", "Done"));
  assert.match(
    document.querySelector("button.record").textContent,
    /Channel gap/,
  );
  assert.match(document.querySelector("button.record").textContent, /Alex/);
  await change(document.querySelector("#filter"), "Reviewed");
  assert.equal(document.querySelectorAll("button.record").length, 1);
  await change(document.querySelector("#filter"), "All");

  // Native checkbox change uses React's click delegation.
  await click(document.querySelectorAll(".plan input[type=checkbox]")[1]);
  assert.ok(
    !document
      .querySelector("button.record")
      .textContent.includes("Channel gap"),
  );
  assert.match(
    document.querySelectorAll("button.record")[1].textContent,
    /Date gap/,
  );
  await change(document.querySelector(".plan select"), "Worldwide");
  assert.match(
    document.querySelectorAll("button.record")[2].textContent,
    /Territory gap/,
  );
  assert.match(
    document.querySelectorAll("button.record")[3].textContent,
    /Missing evidence/,
  );
  await input(document.querySelector("input[type=date]"), "2027-06-30");
  assert.ok(
    !document
      .querySelectorAll("button.record")[1]
      .textContent.includes("Date gap"),
  );
  await input(document.querySelector(".search input"), "City");
  assert.equal(document.querySelectorAll("button.record").length, 1);
  assert.match(
    document.querySelector("button.record").textContent,
    /City at dusk/,
  );
  await input(document.querySelector(".search input"), "");
  let downloaded = null;
  const originalURL = URL.createObjectURL;
  const originalClick = w.HTMLAnchorElement.prototype.click;
  URL.createObjectURL = (blob) => {
    downloaded = blob;
    return "blob:sample-export";
  };
  w.HTMLAnchorElement.prototype.click = function () {};
  await click(byText(".tools button", "Export matrix"));
  assert.ok(downloaded);
  const exported = JSON.parse(await downloaded.text());
  assert.match(exported.title, /SAMPLE/);
  assert.deepEqual(exported.assets[3].findings, ["Missing evidence"]);
  assert.ok(exported.assets[0].findings.includes("Territory gap"));
  URL.createObjectURL = originalURL;
  w.HTMLAnchorElement.prototype.click = originalClick;
  await click(document.querySelector(".reset"));
  assert.equal(document.querySelector(".plan select").value, "United Kingdom");
  assert.equal(
    document.querySelectorAll(".plan input[type=checkbox]")[1].checked,
    true,
  );
  assert.equal(document.querySelector("input[type=date]").value, "2027-12-31");
  assert.match(
    document.querySelector("button.record").textContent,
    /Unassigned/,
  );
  await click(document.querySelector("button.record"));
  await input(
    document.querySelector(".dialog textarea"),
    "Request extended permission.",
  );
  await click(byText(".dialog button", "Done"));
  await click(document.querySelector("button.record"));
  assert.equal(
    document.querySelector(".dialog textarea").value,
    "Request extended permission.",
  );
  await click(byText(".dialog button", "Done"));
  const form = document.querySelector("#contact form");
  form.elements.name.value = "Sample Producer";
  form.elements.email.value = "producer@example.test";
  form.elements.company.value = "Sample Company";
  form.elements.challenge.value = "Check campaign dates";
  assert.ok(form.checkValidity());
  await act(() =>
    form.dispatchEvent(
      new w.Event("submit", { bubbles: true, cancelable: true }),
    ),
  );
  assert.match(
    document.querySelector("#contact [role=status]").textContent,
    /nothing has been submitted/,
  );
  assert.equal(form.elements.name.value, "Sample Producer");
  let copied = "";
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: {
      clipboard: {
        writeText: async (text) => {
          copied = text;
        },
      },
    },
  });
  await click(byText("#contact button", "Copy message"));
  assert.match(copied, /Sample Producer/);
  assert.match(
    document.querySelector("#contact [role=status]").textContent,
    /Message copied/,
  );
  globalThis.navigator.clipboard.writeText = async () => {
    throw new Error("Clipboard blocked");
  };
  await click(byText("#contact button", "Copy message"));
  assert.ok(document.querySelector('textarea[aria-label="Message to copy"]'));
  assert.match(
    document.querySelector('textarea[aria-label="Message to copy"]').value,
    /Sample Producer/,
  );
  for (const path of ["/privacy", "/terms", "/brand", "/unknown-path"]) {
    await act(() => root.render(React.createElement(App, { path })));
    assert.ok(document.querySelector("main"));
    if (path === "/brand")
      assert.equal(document.querySelectorAll("a[download]").length, 8);
    if (path === "/unknown-path")
      assert.match(document.querySelector("h1").textContent, /missed the cut/);
  }
  console.log(
    "PASS (simulated DOM): menu and Team close, workspace tabs, findings filter, evidence dialog, reviewer assignment/acknowledgement, channel toggle, territory change, reset, search, date input, notes, JSON download payload, contact draft/copy handlers and legal/brand/404 rendering.",
  );
} finally {
  await act(() => root.unmount());
  await server.close();
  await w.happyDOM.abort();
}
