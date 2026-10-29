# CRM plan (HubSpot)

Scope: prospect and customer staff contacts only. No agreements, cuts, findings or production data enter the CRM.

## Data model

| Object | Custom properties |
|---|---|
| Contact | `jobtitle`, `production_type`, `monthly_releases`, `rights_challenge`, `lead_source`, `utm_*` |
| Company | `production_type`, `teams`, `asset_management_system`, `music_library_accounts`, `data_region`, `cutclear_tenant_id` (after signup) |
| Deal | `plan` (Pilot / Studio / Network), `pilot_start`, `pilot_end`, `dpa_status`, `sso_required` |

## Pipelines

- **Early access:** New request → Qualified → Walkthrough booked → Walkthrough held → Pilot proposed → Pilot running → Contract and DPA → Won or lost.
- **Onboarding:** Kick-off → DPA → First production set up → Agreement upload tested → Coordinator and producer training → First release signed off → 30-day review.

## Workflows

1. Form intake: dedupe on email; create or associate a Company by domain; create a Deal; assign an owner; create an internal task to reply within one business day (an internal target, not a public promise).
2. Qualification by production type, release volume and role.
3. After the walkthrough: send a recap with the prototype link (`/app`) and the safeguards summary.
4. Nurture only contacts who ticked the optional updates box.

## Website form

The contact form in `src/App.jsx`, using `src/lead.js`:

- With `VITE_HUBSPOT_PORTAL_ID` and `VITE_HUBSPOT_FORM_GUID` set at build time, it posts to the HubSpot Forms API v3. These are public identifiers, not secrets.
- Fields: `firstname`, `lastname`, `email`, `company`, `jobtitle`, `production_type`, `monthly_releases`, `rights_challenge`. Create matching form fields first.
- A consent checkbox, an optional marketing checkbox (used only if `VITE_HUBSPOT_MARKETING_SUBSCRIPTION_ID` is set), and a hidden honeypot field.
- Without the variables (the default), it keeps its original behaviour: an email draft to damilola@cutclear.site plus a copy fallback.
- Before switching on: update the Privacy draft with the processor, region and retention, and test a real submission. No tracking script is included.
