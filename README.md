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
npm run test:prototype
npm run test:backend
npm run preview
```

`npm run test:prototype` needs a build first. `npm run test:backend` runs the Python Lambda tests (standard library only, Python 3.10+). `vite preview` does not resolve clean URLs, so open `/app/` with a trailing slash there; Netlify, Vercel and Cloudflare serve `/app`.

Open the address printed by the final command. The ZIP includes source, the lockfile, built files in `dist`, and logo/favicon assets in `public/brand`. Python is not needed to run or build. A separate standalone Home preview is only a review aid; use the served project for legal/brand routes and asset downloads.

## Deploy only when publication is requested

1. Connect this source folder to your chosen host. For Netlify or Vercel, set build command to `npm run build`, output/publish directory to `dist`, and Node version to 22.12 or newer. No environment variables are required.
2. Keep the review deployment access restricted. No deployment was performed for this delivery. `noindex` does not provide access control.
3. Configure `cutclear.site` and HTTPS using your host's DNS instructions. A www subdomain is not assumed.
4. The included Netlify `_redirects` serves `/privacy`, `/terms`, `/brand`, `/app`, and an unknown-path 404. The included `vercel.json` enables clean URLs and the build supplies `404.html`. On other hosts, map those routes to their generated index.html files and serve `404.html` for unknown URLs with HTTP status 404. Do not use a blanket 200 fallback. Verify these rules on the chosen host.
5. Check phone/desktop layout, real downloads, email drafts and hosted routes before public launch.

## Remove noindex for public launch

After launch approval:

1. Remove the `<meta name="robots" content="noindex,nofollow">` tag from `index.html` (it may be formatted across several lines).
2. In `scripts/build.mjs`, replace the generated robots.txt string with `User-agent: *\nAllow: /\nSitemap: https://cutclear.site/sitemap.xml\n`.
3. Run `npm run build` and redeploy. The build retains noindex on the 404 page. Verify the live HTML, robots.txt, canonical URLs, sitemap and any host-level robots headers/access restrictions. The supplied review verification script intentionally expects noindex and Disallow, so update those review-only assertions when switching to public indexing.

## Essential configuration notes

- This is a local-data demonstration. No AWS/AI services, accounts, uploads, licence purchasing, expiry notifications or delivery backend are connected. These require separate production implementation.
- Release-plan checks are deterministic. Missing agreements stay unknown; reviewer decisions do not grant permission. The campaign start is fixed at 1 January 2027.
- On the home page, assignments, decisions and notes stay in page memory until reset or reload. The prototype at `/app` saves its fictional state in `localStorage` (key `cutclear-prototype-v1`) and has a reset button. Export downloads a sample JSON matrix retaining evidence and unresolved findings.
- By default, Contact opens an email draft to damilola@cutclear.site; setting the HubSpot variables in `.env.example` makes it submit to HubSpot instead (see `docs/crm-plan.md`). The visitor must send it. Copy message has a selectable-text fallback. No message is submitted to a Cutclear backend.
- Review the Privacy/Terms drafts, actual operating entity and information-handling arrangements before public launch. No registration, jurisdiction, headquarters, prices or founder biographies were supplied.
- Automated rule, simulated-DOM and generated-file checks are included. Real browser layout/runtime, native downloads/email applications/clipboard permissions and hosted HTTP route behavior require verification outside this environment.

## Interactive prototype (`/app`)

A full rights-review workspace with fictional data. Use **Demo as** to switch person and role, and **Reset demo data** to restore the seed.

- **Rights coordinators** (Ade Martins; Nia Brooks as second signer): dashboard with an expiry watch; productions; **New production**; and per production, *Release plan* (each save is a new version), *Assets* (findings, confirming extracted terms, decisions, requests to the producer), *AI suggestions*, *Requests*, *Sign-off* (two-person) and *Activity*. Exports a JSON review report.
- **Producer** (Theo Grant): the cut, agreements and credits, and only the requests addressed to them, without findings or decisions.
- **Administrator** (Lina Park): aggregates, roles, policy (two-person sign-off, AI on/off, expiry window, demo date), audit log with CSV export, permissions matrix.

Try this path: as Ade, open CC-001 → Assets → IMG-07 → confirm terms, then AI suggestions → add the restriction. On MUS-05, ask the producer to shorten the use. Switch to Theo and trim it to 15 s. Back as Ade, narrow the plan or record decisions, then sign off with Ade and Nia.

**Real:** the checks (`src/app/engine.js`), permissions, plan versioning, the gates, the audit log, exports and persistence. **Simulated:** agreement upload and extraction (typed), AI (a phrase rule with the Bedrock output shape) and sign-in.

## Website additions, backend and docs

- Home page: prototype call to action, benefits, use cases, safeguards, plans (`#pricing`: “Pricing on request”, with no invented prices) and FAQ. Section labels are renumbered 01–12. The early-access form adds role and release volume, consent, an optional updates box and a honeypot.
- `backend/lambdas/check_rights` and `suggest_restrictions`, with `backend/tests/fixtures/cases.json` shared with `src/app/engine.test.js`. `backend/dynamodb/table.json` holds the table definition.
- `docs/architecture.md`, `docs/safeguards.md`, `docs/crm-plan.md`.

## QA for the StudyPatch-parity revision (29 October 2026)

All passing: `npm test` (17: the original permission tests, shared rule fixtures, the full workflow and permissions, lead validation), `npm run test:ui` (original DOM checks, updated for consent), `npm run verify` (now six prerendered documents including `/app`), `npm run test:prototype` (three roles, persistence, reset) and `npm run test:backend` (6 Python tests on the same fixtures). Headless Chromium at 1440×900 and 390×844 on the home page, `/app/`, asset, plan and producer views, and `/privacy/`: no console or page errors and no horizontal overflow. That check caught asset names in the prototype list inheriting the site's cream button text; this is fixed. Not claimed: screen-reader and real-device checks, live HubSpot submission, anything on AWS.

Owner decisions open: real prices (the plans say “Pricing on request”), the HubSpot IDs with matching Privacy wording, and the territory and channel lists for real customers.
