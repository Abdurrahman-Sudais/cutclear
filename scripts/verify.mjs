import assert from "node:assert/strict";
import { readFile, writeFile, stat } from "node:fs/promises";
import { Window } from "happy-dom";
import { execFileSync } from "node:child_process";
const window = new Window({ url: "https://cutclear.site" });
const doc = window.document;
for (const path of [
  "index.html",
  "app/index.html",
  "privacy/index.html",
  "terms/index.html",
  "brand/index.html",
  "404.html",
]) {
  const html = await readFile("dist/" + path, "utf8");
  assert.equal((html.match(/<!doctype html>/gi) || []).length, 1);
  doc.write(html);
  assert.match(doc.querySelector("meta[name=robots]").content, /noindex/);
  assert.match(
    doc.querySelector("link[rel=canonical]").href,
    /^https:\/\/cutclear.site/,
  );
  assert.ok(doc.title.includes("Cutclear"));
  for (const img of doc.querySelectorAll('img[src^="/brand/"]'))
    assert.ok((await stat("dist" + img.getAttribute("src"))).size > 0);
  for (const link of doc.querySelectorAll("a[download]"))
    assert.ok((await stat("dist" + link.getAttribute("href"))).size > 0);
  for (const link of doc.querySelectorAll('a[href^="/#"]'))
    assert.ok(
      (await readFile("dist/index.html", "utf8")).includes(
        'id="' + link.hash.slice(1) + '"',
      ),
    );
  if (path === "index.html") {
    assert.match(doc.body.textContent, /Before the final cut/);
    assert.match(
      doc.body.textContent,
      /Connect music, footage, and talent agreements/,
    );
    assert.match(doc.body.textContent, /Damilola Cole/);
    assert.match(doc.body.textContent, /Paulo Tongo/);
    assert.equal(doc.querySelectorAll("#leadership article").length, 2);
    assert.ok(doc.querySelectorAll('a[href="/#leadership"]').length >= 2);
  }
  if (path === "404.html") assert.match(doc.body.textContent, /missed the cut/);
  doc.open();
}
const preview = await readFile("../Cutclear-review.html", "utf8");
assert.equal((preview.match(/<!doctype html>/gi) || []).length, 1);
const match = preview.match(/<script type="module">([\s\S]*?)<\/script>/);
assert.ok(match);
await writeFile("/tmp/cutclear-preview-syntax.mjs", match[1]);
execFileSync(process.execPath, ["--check", "/tmp/cutclear-preview-syntax.mjs"]);
assert.ok(!preview.includes('src="/assets/'));
assert.ok(!preview.includes('href="/assets/'));
for (const name of [
  "favicon-16.png",
  "favicon-32.png",
  "apple-touch-icon.png",
  "social.png",
])
  assert.ok((await stat("dist/brand/" + name)).size > 0);
const robots = await readFile("dist/robots.txt", "utf8");
assert.match(robots, /Disallow: \//);
assert.match(
  await readFile("dist/sitemap.xml", "utf8"),
  /https:\/\/cutclear.site\/brand/,
);
console.log(
  "PASS: six prerendered documents, essential content, leadership, internal anchor targets, metadata, all route image/download files, favicon files, sitemap, review robots; single-document preview and bundled JS syntax.",
);
window.happyDOM.abort();
