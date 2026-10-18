import { build, createServer } from "vite";
import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { renderToString } from "react-dom/server";
import React from "react";
await build();
const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
});
try {
  const { default: App } = await server.ssrLoadModule("/src/App.jsx");
  const base = await readFile("dist/index.html", "utf8");
  for (const route of ["/", "/privacy", "/terms", "/brand", "/404"]) {
    let html = base.replace(
      '<div id="root"></div>',
      () =>
        `<div id="root">${renderToString(React.createElement(App, { path: route }))}</div>`,
    );
    if (route !== "/") {
      const name = {
        "/privacy": "Privacy",
        "/terms": "Terms of use",
        "/brand": "Brand assets",
        "/404": "Page not found",
      }[route];
      html = html
        .replace(
          /<title>.*?<\/title>/,
          () => `<title>${name} — Cutclear</title>`,
        )
        .replace(
          'href="https://cutclear.site/"',
          () => `href="https://cutclear.site${route}"`,
        );
    }
    if (route === "/404" && !html.includes("noindex"))
      html = html.replace(
        "</head>",
        '<meta name="robots" content="noindex,nofollow"></head>',
      );
    if (route === "/")
      html = html.replace(
        "</head>",
        () =>
          `<script type="application/ld+json">${JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Cutclear",
            url: "https://cutclear.site",
            email: "damilola@cutclear.site",
            foundingDate: "2026",
            founder: [
              { "@type": "Person", name: "Damilola Cole" },
              { "@type": "Person", name: "Paulo Tongo" },
            ],
          })}</script></head>`,
      );
    const dest =
      route === "/"
        ? "dist/index.html"
        : route === "/404"
          ? "dist/404.html"
          : `dist${route}/index.html`;
    if (route !== "/" && route !== "/404")
      await mkdir(`dist${route}`, { recursive: true });
    await writeFile(dest, html);
  }
  // Callback replacements preserve literal $&, $`, and $' tokens in bundled JS.
  let preview = await readFile("dist/index.html", "utf8");
  const script = preview.match(
    /<script type="module" crossorigin src="([^"]+)"><\/script>/,
  );
  if (!script) throw Error("Bundle script not found");
  const js = (await readFile("dist" + script[1], "utf8")).replace(
    /<\/script/gi,
    "<\\/script",
  );
  preview = preview.replace(
    script[0],
    () => `<script type="module">${js}</script>`,
  );
  const cssTag = preview.match(
    /<link rel="stylesheet" crossorigin href="([^"]+)">/,
  );
  if (cssTag) {
    const css = await readFile("dist" + cssTag[1], "utf8");
    preview = preview.replace(cssTag[0], () => `<style>${css}</style>`);
  }
  // Inline images and icons to make the home preview portable.
  for (const name of [
    "favicon.svg",
    "favicon-32.png",
    "favicon-16.png",
    "apple-touch-icon.png",
  ]) {
    const data = await readFile("public/brand/" + name);
    const mime = name.endsWith(".svg") ? "image/svg+xml" : "image/png";
    preview = preview.replaceAll(
      "/brand/" + name,
      `data:${mime};base64,${data.toString("base64")}`,
    );
  }
  await writeFile("../Cutclear-review.html", preview);
  await writeFile(
    "dist/robots.txt",
    "User-agent: *\nDisallow: /\n# Review build: remove Disallow and noindex only for approved public launch.\nSitemap: https://cutclear.site/sitemap.xml\n",
  );
  await writeFile(
    "dist/sitemap.xml",
    '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
      ["/", "/privacy", "/terms", "/brand"]
        .map((p) => `<url><loc>https://cutclear.site${p}</loc></url>`)
        .join("") +
      "</urlset>",
  );
  await copyFile("dist/robots.txt", "public/robots.txt");
  await copyFile("dist/sitemap.xml", "public/sitemap.xml");
  console.log(
    "Prerendered home, legal, brand and 404. Created standalone home preview.",
  );
} finally {
  await server.close();
}
