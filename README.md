# Cutclear — approved, unpublished review

## Run locally

1. Install Node.js 22.12 or newer.
2. Unzip the source ZIP and open a terminal in `cutclear`, the folder containing package.json.
3. Run `npm ci` to install the exact dependencies in package-lock.json.
4. Run `npm run dev` and open the local address printed in the terminal.

To check the production version:

```sh
npm test
npm run test:ui
npm run build
npm run verify
npm run preview
```

Open the address printed by the final command. The ZIP includes source, the lockfile, built files in `dist`, and logo/favicon assets in `public/brand`. Python is not needed to run or build. A separate standalone Home preview is only a review aid; use the served project for legal/brand routes and asset downloads.

## Deploy only when publication is requested

1. Connect this source folder to your chosen host. For Netlify or Vercel, set build command to `npm run build`, output/publish directory to `dist`, and Node version to 22.12 or newer. No environment variables are required.
2. Keep the review deployment access restricted. No deployment was performed for this delivery. `noindex` does not provide access control.
3. Configure `cutclear.site` and HTTPS using your host's DNS instructions. A www subdomain is not assumed.
4. The included Netlify `_redirects` serves `/privacy`, `/terms`, `/brand`, and an unknown-path 404. The included `vercel.json` enables clean URLs and the build supplies `404.html`. On other hosts, map those routes to their generated index.html files and serve `404.html` for unknown URLs with HTTP status 404. Do not use a blanket 200 fallback. Verify these rules on the chosen host.
5. Check phone/desktop layout, real downloads, email drafts and hosted routes before public launch.

## Remove noindex for public launch

After launch approval:

1. Remove the `<meta name="robots" content="noindex,nofollow">` tag from `index.html` (it may be formatted across several lines).
2. In `scripts/build.mjs`, replace the generated robots.txt string with `User-agent: *\nAllow: /\nSitemap: https://cutclear.site/sitemap.xml\n`.
3. Run `npm run build` and redeploy. The build retains noindex on the 404 page. Verify the live HTML, robots.txt, canonical URLs, sitemap and any host-level robots headers/access restrictions. The supplied review verification script intentionally expects noindex and Disallow, so update those review-only assertions when switching to public indexing.

## Essential configuration notes

- This is a local-data demonstration. No AWS/AI services, accounts, uploads, licence purchasing, expiry notifications or delivery backend are connected. These require separate production implementation.
- Release-plan checks are deterministic. Missing agreements stay unknown; reviewer decisions do not grant permission. The campaign start is fixed at 1 January 2027.
- Assignments, decisions and notes stay in page memory until reset or reload. Export downloads a sample JSON matrix retaining evidence and unresolved findings.
- Contact opens an email draft to damilola@cutclear.site. The visitor must send it. Copy message has a selectable-text fallback. No message is submitted to a Cutclear backend.
- Review the Privacy/Terms drafts, actual operating entity and information-handling arrangements before public launch. No registration, jurisdiction, headquarters, prices or founder biographies were supplied.
- Automated rule, simulated-DOM and generated-file checks are included. Real browser layout/runtime, native downloads/email applications/clipboard permissions and hosted HTTP route behavior require verification outside this environment.
