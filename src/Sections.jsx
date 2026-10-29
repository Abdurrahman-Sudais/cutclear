import React from "react";
import { ArrowUpRight, ArrowRight, Check } from "lucide-react";

// Sections added alongside the original home page. Copy describes the prototype and the proposed
// product only: no customer numbers, testimonials, certifications, legal claims or invented prices.

export function PrototypeCta() {
  return (
    <section
      id="prototype"
      className="prototype-cta"
      aria-labelledby="prototype-heading"
    >
      <div>
        <div className="eyebrow">04 / INTERACTIVE PROTOTYPE</div>
        <h2 id="prototype-heading">
          Run the whole review.
          <br />
          <em>Every role, end to end.</em>
        </h2>
      </div>
      <div>
        <p>
          The desk above checks one fixed release. The prototype runs the full
          loop with fictional data: edit the release plan, confirm terms
          extracted from agreements, review AI-flagged restrictions, ask the
          producer for agreements, credits or a shorter edit, record decisions,
          and sign the release off with two coordinators.
        </p>
        <ul className="role-list">
          <li>
            <strong>Rights coordinator</strong> Release plans, findings, term
            confirmation, AI suggestions, decisions, two-person sign-off, expiry
            watch.
          </li>
          <li>
            <strong>Producer</strong> The cut, agreements and credits, and only
            the requests addressed to them.
          </li>
          <li>
            <strong>Administrator</strong> Roles, policy, audit log and
            aggregate figures.
          </li>
        </ul>
        <div className="actions">
          <a className="button" href="/app">
            Open the prototype <ArrowUpRight size={16} aria-hidden="true" />
          </a>
          <span className="muted">
            No sign-up. Changes stay in your browser.
          </span>
        </div>
      </div>
    </section>
  );
}

const BENEFITS = [
  [
    "Check against the actual release",
    "Territories, channels, dates, paid placement and seconds used are compared with each agreement’s confirmed terms, so a TV buy or a longer cut shows its gaps straight away.",
  ],
  [
    "Regions handled properly",
    "A licence for Europe covers the United Kingdom; a licence for the United Kingdom does not cover Ireland. The hierarchy is explicit, not guessed.",
  ],
  [
    "Missing is never “fine”",
    "No agreement means unknown, not permitted. Unconfirmed terms stay unconfirmed until a coordinator checks them against the wording.",
  ],
  [
    "Credits and obligations tracked",
    "Required credits are matched against the production’s end card, and stay open until the credit is there.",
  ],
  [
    "Change the plan, re-check everything",
    "Every plan change is a new version. Decisions and sign-off are tied to the version they were given for.",
  ],
  [
    "See expiries coming",
    "Licences ending within the warning window are flagged across live releases, before content keeps running past its rights.",
  ],
];

export function Benefits() {
  return (
    <section
      id="benefits"
      className="benefits"
      aria-labelledby="benefits-heading"
    >
      <div className="eyebrow">05 / WHY PRODUCTION TEAMS WOULD USE IT</div>
      <h2 id="benefits-heading">
        Fewer surprises
        <br />
        <em>after picture lock.</em>
      </h2>
      <div className="card-grid">
        {BENEFITS.map(([t, c], i) => (
          <article className="grid-card" key={t}>
            <span className="mono">0{i + 1}</span>
            <h3>{t}</h3>
            <p>{c}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

const USES = [
  [
    "Adding a TV or cinema buy",
    "The cut was cleared for online. Now there is a broadcast flight. See which licences stop at online.",
  ],
  [
    "Extending a campaign",
    "The client wants six more months. See which licences, talent releases and stock clips end first.",
  ],
  [
    "Going international",
    "A UK campaign is picked up in Ireland or the US. See which agreements were UK-only.",
  ],
  [
    "Cutting down for social",
    "Shorter edits and paid placement raise duration and paid-media limits that the long version never hit.",
  ],
  [
    "Stock and archive footage",
    "Scanned or emailed licences arrive with wording that needs confirming before anyone relies on it.",
  ],
  [
    "Delivery and end cards",
    "Make sure the credits that agreements require are actually on the end card before delivery.",
  ],
];

export function UseCases() {
  return (
    <section id="use-cases" className="usecases" aria-labelledby="uses-heading">
      <div className="eyebrow">06 / USE CASES</div>
      <h2 id="uses-heading">
        Where rights gaps
        <br />
        <em>tend to appear.</em>
      </h2>
      <div className="card-grid">
        {USES.map(([t, c]) => (
          <article className="grid-card plain" key={t}>
            <h3>{t}</h3>
            <p>{c}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

const SAFEGUARDS = [
  [
    "Not legal clearance",
    "Cutclear compares recorded terms with a release plan and records decisions. It does not give legal advice or clear rights on anyone’s behalf, and it says so throughout.",
  ],
  [
    "People confirm the terms",
    "Extracted permission fields are unconfirmed until a coordinator checks them against the agreement wording.",
  ],
  [
    "AI points, people decide",
    "AI only flags restrictions written in the wording that the fields miss, quoting the text. A coordinator adds the restriction or dismisses it with a reason.",
  ],
  [
    "Decisions tied to a plan version",
    "Changing the plan, an asset, an agreement or the credits clears decisions and reopens sign-off.",
  ],
  [
    "Two people sign off",
    "Release sign-off can require two different coordinators, and every step is in the audit log.",
  ],
  [
    "Need-to-know access",
    "Producers see the cut and the requests addressed to them. Administrators see aggregates, not agreements.",
  ],
];

export function Safeguards() {
  return (
    <section
      id="safeguards"
      className="safeguards"
      aria-labelledby="safeguards-heading"
    >
      <div className="eyebrow">07 / SAFEGUARDS</div>
      <h2 id="safeguards-heading">
        AI points.
        <br />
        <em>People decide.</em>
      </h2>
      <p className="lead-note">
        The prototype already enforces these review gates. Hosting and security
        items describe the proposed production design.
      </p>
      <div className="card-grid">
        {SAFEGUARDS.map(([t, c]) => (
          <article className="grid-card" key={t}>
            <Check size={18} aria-hidden="true" />
            <h3>{t}</h3>
            <p>{c}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

const PLANS = [
  [
    "Pilot",
    "One team, a few releases.",
    [
      "Guided setup of your first productions",
      "Plan-vs-agreement checks",
      "Producer requests",
      "Exportable review reports",
    ],
  ],
  [
    "Studio",
    "Production and rights teams together.",
    [
      "Everything in Pilot",
      "Roles, two-person sign-off and audit log",
      "AI review of agreement wording",
      "Expiry watch across live releases",
    ],
  ],
  [
    "Network",
    "Agencies and multi-team studios.",
    [
      "Everything in Studio",
      "Single sign-on",
      "Asset-management and edit-system integration",
      "Data-region options and a data-processing agreement",
    ],
  ],
];

export function Plans() {
  return (
    <section id="pricing" className="plans" aria-labelledby="pricing-heading">
      <div className="eyebrow">08 / PLANS</div>
      <h2 id="pricing-heading">
        Start with one release.
        <br />
        <em>Grow with the slate.</em>
      </h2>
      <p className="lead-note">
        Proposed plans for early access. Prices are agreed with each
        early-access customer; none are published yet.
      </p>
      <div className="plan-grid">
        {PLANS.map(([name, d, items], i) => (
          <article className={`plan ${i === 1 ? "featured" : ""}`} key={name}>
            {i === 1 && <span className="plan-tag">Most complete</span>}
            <h3>{name}</h3>
            <p className="plan-price">Pricing on request</p>
            <p>{d}</p>
            <ul>
              {items.map((x) => (
                <li key={x}>
                  <Check size={14} aria-hidden="true" /> {x}
                </li>
              ))}
            </ul>
            <a
              className={i === 1 ? "button" : "button secondary"}
              href="#contact"
            >
              Request early access <ArrowRight size={16} aria-hidden="true" />
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}

const FAQS = [
  [
    "Does Cutclear clear rights or give legal advice?",
    "No. It compares the terms recorded from your agreements with your release plan, shows the gaps and records your team’s decisions. Rights decisions remain yours and your advisers’.",
  ],
  [
    "What does “no gap detected” mean?",
    "That the confirmed fields for an asset cover the plan’s territories, channels, dates, duration and paid placement, and that required credits are present. It says nothing about terms that were never recorded.",
  ],
  [
    "What does the AI do?",
    "In the proposed product, AI reads agreement wording and flags restrictions the confirmed fields do not capture, such as “excluding paid advertising”, quoting the text. A coordinator adds the restriction or dismisses it with a reason.",
  ],
  [
    "What happens when the plan changes?",
    "It becomes a new plan version. Every asset is re-checked, decisions are cleared and any sign-off is reopened, because clearance only applies to the plan it was given for.",
  ],
  [
    "Can producers see everything?",
    "No. Producers manage the cut, supply agreements and credits, and see the requests addressed to them. Findings and decisions stay with the coordinators.",
  ],
  [
    "Does it buy or renew licences?",
    "No. It shows what is missing or ending, and who was asked to fix it.",
  ],
  [
    "Is it available today?",
    "Cutclear is in the building stage. The prototype runs in your browser with fictional data; uploads, extraction and AI need the production backend described in the architecture section.",
  ],
  [
    "How do we get early access?",
    "Use the form above to tell us about your workflow. We reply by email.",
  ],
];

export function Faq() {
  return (
    <section id="faq" className="faq" aria-labelledby="faq-heading">
      <div className="eyebrow">12 / FAQ</div>
      <h2 id="faq-heading">
        Questions production
        <br />
        <em>teams ask.</em>
      </h2>
      <div className="faq-list">
        {FAQS.map(([q, a]) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
