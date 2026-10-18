import React, { useState, useRef, useEffect } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Music2,
  Film,
  UserRound,
  FileText,
  Search,
  Download,
  RotateCcw,
  Menu,
  X,
  ChevronRight,
  Check,
  Layers,
} from "lucide-react";
import { assets, initialPlan, gaps, report } from "./permissions";
const email = "damilola@cutclear.site";
function Logo() {
  return (
    <a className="logo" href="/" aria-label="Cutclear home">
      <svg viewBox="0 0 36 36" aria-hidden="true">
        <path
          d="M14 5H5v26h9M22 5h9v26h-9M12 22 24 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        />
      </svg>
      Cutclear
    </a>
  );
}
const links = [
  ["Product", "/#product"],
  ["How it works", "/#process"],
  ["Architecture", "/#architecture"],
  ["Team", "/#leadership"],
];
function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header>
      <Logo />
      <nav className={open ? "nav open" : "nav"} aria-label="Main">
        {links.map(([n, h]) => (
          <a key={n} href={h} onClick={() => setOpen(false)}>
            {n}
          </a>
        ))}
        <a href="/#contact" onClick={() => setOpen(false)}>
          Contact
        </a>
      </nav>
      <a className="header-cta" href="/#demo">
        Explore the demo <ArrowUpRight size={16} />
      </a>
      <button
        className="menu icon"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {open ? <X /> : <Menu />}
      </button>
    </header>
  );
}
function Footer() {
  return (
    <footer>
      <div>
        <Logo />
        <p>Rights review for production teams.</p>
      </div>
      <div>
        {links.map(([n, h]) => (
          <a key={n} href={h}>
            {n}
          </a>
        ))}
      </div>
      <div>
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
        <a href="/brand">Brand assets</a>
        <a href={"mailto:" + email}>{email}</a>
      </div>
      <small>© {new Date().getFullYear()} Cutclear · Founded 2026</small>
    </footer>
  );
}
function AssetArt({ index = 0 }) {
  return (
    <div className={"art art-" + index} aria-hidden="true">
      {index === 0 ? (
        <>
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
        </>
      ) : index === 1 ? (
        <div className="portrait" />
      ) : (
        <>
          <b />
          <em />
        </>
      )}
    </div>
  );
}
function Hero() {
  return (
    <section className="hero">
      <div className="eyebrow">
        <span /> THE RELEASE DESK / CUTCLEAR
      </div>
      <div className="hero-grid">
        <div>
          <h1>
            Before the final cut
            <br />
            goes live, check its
            <br />
            <em>permissions.</em>
          </h1>
          <p className="intro">
            Connect music, footage, and talent agreements to your release plan.
            See permission gaps, inspect the source, and keep the review moving.
          </p>
          <div className="actions">
            <a className="button" href="#demo">
              Explore a sample production <ArrowUpRight size={18} />
            </a>
            <a className="text-link" href="#contact">
              Request early access <ArrowRight size={16} />
            </a>
          </div>
        </div>
        <div className="release-card">
          <div className="card-heading">
            <span>SMALL HOURS</span>
            <span>SAMPLE PRODUCTION ↗</span>
          </div>
          <div className="asset-strip">
            {["Evening Pattern", "Performer release", "Original footage"].map(
              (n, i) => (
                <div key={n}>
                  <AssetArt index={i} />
                  <small>
                    0{i + 1} / {["MUSIC", "TALENT", "FOOTAGE"][i]}
                  </small>
                  <strong>{n}</strong>
                </div>
              ),
            )}
          </div>
          <div className="release-summary">
            <div>
              <small>RELEASE PLAN</small>
              <p>United Kingdom · Online + TV</p>
            </div>
            <span className="mono">JAN—DEC 2027</span>
          </div>
          <div className="finding">
            <span className="dot" />
            <div>
              <strong>Television isn’t in the music licence.</strong>
              <small>MUS-01 → LIC-014 · Online only</small>
            </div>
            <ArrowUpRight size={17} />
          </div>
          <div className="finding">
            <span className="dot lilac" />
            <div>
              <strong>Performer permission ends before the campaign.</strong>
              <small>TAL-02 → REL-008 · Ends 30 JUN 2027</small>
            </div>
            <ArrowUpRight size={17} />
          </div>
          <div className="card-bottom">
            RECORDED TERMS. VISIBLE GAPS. HUMAN DECISIONS.
          </div>
        </div>
      </div>
      <div className="hero-bottom">
        <span>MADE FOR THE WORK BETWEEN FINAL CUT AND RELEASE.</span>
        <span>
          SCROLL TO REVIEW <span aria-hidden="true">↓</span>
        </span>
      </div>
    </section>
  );
}
function Demo() {
  const [tab, setTab] = useState("Assets"),
    [plan, setPlan] = useState({ ...initialPlan }),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("All"),
    [selected, setSelected] = useState(null),
    [reviews, setReviews] = useState({}),
    [message, setMessage] = useState("");
  const close = useRef(null),
    trigger = useRef(null);
  useEffect(() => {
    if (selected) {
      trigger.current = document.activeElement;
      close.current?.focus();
    }
    return () => {
      if (selected) trigger.current?.focus();
    };
  }, [selected]);
  function update(id, k, v) {
    setReviews((r) => ({ ...r, [id]: { ...r[id], [k]: v } }));
  }
  function reset() {
    setPlan({ ...initialPlan });
    setQuery("");
    setFilter("All");
    setReviews({});
    setSelected(null);
    setTab("Assets");
    setMessage("Sample restored.");
  }
  function exportReport() {
    const blob = new Blob([JSON.stringify(report(plan, reviews), null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Cutclear-sample-rights-review.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage(
      "Sample report exported. Findings and uncertainty are preserved.",
    );
  }
  const matches = assets.filter(
    (a) =>
      (a.name + " " + a.id + " " + a.ref)
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (filter === "All" ||
        (filter === "Not reviewed"
          ? !reviews[a.id]?.decision ||
            reviews[a.id]?.decision === "Not reviewed"
          : filter === "Reviewed"
            ? reviews[a.id]?.decision &&
              reviews[a.id]?.decision !== "Not reviewed"
            : gaps(a, plan).includes(filter))),
  );
  return (
    <section id="demo" className="demo-section">
      <div className="section-heading">
        <div>
          <div className="eyebrow">03 / TRY THE RELEASE DESK</div>
          <h2>
            Change the plan.
            <br />
            <em>See what changes.</em>
          </h2>
        </div>
        <p>
          A fictional campaign, four assets, and the agreements behind them. Try
          the review yourself.
        </p>
      </div>
      <div className="workspace">
        <div className="workspace-top">
          <div>
            <span className="sample-dot" /> Interactive demo · Sample data
          </div>
          <span className="mono">CC-001 / SMALL HOURS</span>
        </div>
        <div className="workspace-nav">
          {["Productions", "Assets", "Agreements", "Reviews"].map((n) => (
            <button
              key={n}
              className={tab === n ? "active" : ""}
              onClick={() => setTab(n)}
            >
              {n}
            </button>
          ))}
          <button className="reset" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="plan">
          <div>
            <span className="eyebrow">REQUESTED RELEASE</span>
            <strong>Small Hours</strong>
            <small>Starts 1 January 2027</small>
          </div>
          <label>
            Territory
            <select
              value={plan.territory}
              onChange={(e) => setPlan({ ...plan, territory: e.target.value })}
            >
              <option>United Kingdom</option>
              <option>United Kingdom + United States</option>
              <option>Worldwide</option>
            </select>
          </label>
          <fieldset>
            <legend>Channels</legend>
            <label>
              <input
                type="checkbox"
                checked={plan.online}
                onChange={(e) => setPlan({ ...plan, online: e.target.checked })}
              />{" "}
              Online
            </label>
            <label>
              <input
                type="checkbox"
                checked={plan.television}
                onChange={(e) =>
                  setPlan({ ...plan, television: e.target.checked })
                }
              />{" "}
              Television
            </label>
          </fieldset>
          <label>
            End date
            <input
              aria-label="Release end date"
              type="date"
              min="2027-01-01"
              value={plan.end}
              onChange={(e) => {
                if (e.target.value >= "2027-01-01")
                  setPlan({ ...plan, end: e.target.value });
              }}
              required
            />
          </label>
        </div>
        {!plan.online && !plan.television && (
          <p className="notice" role="alert">
            Select a release channel to make the comparison meaningful. Missing
            evidence remains unknown.
          </p>
        )}
        {tab === "Productions" ? (
          <div className="production-view">
            <span className="eyebrow">ONE FICTIONAL PRODUCTION</span>
            <h3>Small Hours</h3>
            <p>
              Four assets · United Kingdom campaign · Music, talent and footage.
            </p>
            <p>
              {assets.filter((a) => gaps(a, plan).length).length} assets have
              gaps or unknown permissions in the current plan.
            </p>
            <button onClick={() => setTab("Assets")}>
              Review the asset register <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <>
            <div className="tools">
              <label className="search">
                <Search size={16} />
                <input
                  aria-label="Search assets and agreements"
                  placeholder="Search assets or agreement IDs…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              <label className="sr-only" htmlFor="filter">
                Filter findings and review status
              </label>
              <select
                id="filter"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                {[
                  "All",
                  "Channel gap",
                  "Date gap",
                  "Territory gap",
                  "Missing evidence",
                  "Not reviewed",
                  "Reviewed",
                ].map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
              <button onClick={exportReport}>
                <Download size={15} /> Export matrix
              </button>
            </div>
            <div className="records">
              <div className="record table-heading">
                <span>
                  {tab === "Agreements"
                    ? "AGREEMENT / ASSET"
                    : "ASSET / RECORD"}
                </span>
                <span>
                  {tab === "Reviews"
                    ? "REVIEW DECISION"
                    : "PERMISSION FINDINGS"}
                </span>
                <span>REVIEWER</span>
                <span />
              </div>
              {matches.map((a, i) => {
                const found = gaps(a, plan);
                return (
                  <button
                    className="record"
                    key={a.id}
                    onClick={() => setSelected(a)}
                  >
                    <span className="asset-name">
                      <span className="asset-icon">
                        {a.type === "Music" ? (
                          <Music2 size={18} />
                        ) : a.type === "Talent" ? (
                          <UserRound size={18} />
                        ) : (
                          <Film size={18} />
                        )}
                      </span>
                      <span>
                        <strong>
                          {tab === "Agreements"
                            ? a.ref || "Agreement required"
                            : a.name}
                        </strong>
                        <small>
                          {a.id} /{" "}
                          {tab === "Agreements"
                            ? a.name
                            : a.ref || "NO AGREEMENT"}
                        </small>
                      </span>
                    </span>
                    <span>
                      {tab === "Reviews" ? (
                        <span className="badge neutral">
                          {reviews[a.id]?.decision || "Not reviewed"}
                        </span>
                      ) : found.length ? (
                        found.map((f) => (
                          <span
                            className={
                              "badge " +
                              (f === "Missing evidence" ? "unknown" : "")
                            }
                            key={f}
                          >
                            {f}
                          </span>
                        ))
                      ) : (
                        <span className="positive">
                          No gap detected against recorded terms.
                        </span>
                      )}
                    </span>
                    <span className="reviewer">
                      {reviews[a.id]?.reviewer || "Unassigned"}
                    </span>
                    <ChevronRight size={16} />
                  </button>
                );
              })}
              {!matches.length && (
                <p className="empty">
                  No records match. Try another search or filter.
                </p>
              )}
            </div>
          </>
        )}
        <div className="workspace-bottom">
          <span>Evidence ≠ findings ≠ review decisions</span>
          <span>Local sample · No live AI or AWS connection</span>
        </div>
      </div>
      <p className="demo-caveat">
        A review aid, not definitive legal clearance. Acknowledgements never
        change recorded permissions.
      </p>
      <p className="status" role="status">
        {message}
      </p>
      {selected && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelected(null);
          }}
        >
          <section
            className="dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="asset-title"
            onKeyDown={(e) => {
              if (e.key === "Escape") setSelected(null);
              if (e.key === "Tab") {
                const items = e.currentTarget.querySelectorAll(
                  "button,select,textarea,a",
                );
                const first = items[0],
                  last = items[items.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                  e.preventDefault();
                  last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                  e.preventDefault();
                  first.focus();
                }
              }
            }}
          >
            <button
              ref={close}
              className="icon close"
              aria-label="Close asset details"
              onClick={() => setSelected(null)}
            >
              <X />
            </button>
            <div className="eyebrow">{selected.id} / SAMPLE EVIDENCE</div>
            <h3 id="asset-title">{selected.name}</h3>
            <h4>Recorded permission evidence</h4>
            <blockquote>{selected.excerpt}</blockquote>
            <h4>Findings against this release</h4>
            <p>
              {gaps(selected, plan).join(" · ") ||
                "No gap detected against recorded terms."}
            </p>
            <p className="muted">
              Source wording requires human confirmation in the proposed
              product. This sample uses fixed, supplied fields.
            </p>
            <h4>Separate reviewer record</h4>
            <label>
              Assign sample reviewer
              <select
                value={reviews[selected.id]?.reviewer || "Unassigned"}
                onChange={(e) =>
                  update(selected.id, "reviewer", e.target.value)
                }
              >
                {[
                  "Unassigned",
                  "Alex · Producer (sample)",
                  "Sam · Rights reviewer (sample)",
                ].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
            <label>
              Review note
              <textarea
                maxLength={2000}
                placeholder="Add a local review note…"
                value={reviews[selected.id]?.note || ""}
                onChange={(e) => update(selected.id, "note", e.target.value)}
              />
            </label>
            <label>
              Review decision
              <select
                value={reviews[selected.id]?.decision || "Not reviewed"}
                onChange={(e) =>
                  update(selected.id, "decision", e.target.value)
                }
              >
                {[
                  "Not reviewed",
                  "Acknowledged",
                  "Follow-up required",
                  "Specialist review requested",
                ].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
            <p className="notice">
              Decisions record review activity. They do not grant rights or
              approve release. Changes stay in this page until reset or reload.
            </p>
            <button onClick={() => setSelected(null)}>
              Done <Check size={16} />
            </button>
          </section>
        </div>
      )}
    </section>
  );
}
const services = [
  [
    "01",
    "Intake",
    "Manually list assets, attach agreements, and define the release.",
    "Asset manifest",
  ],
  [
    "02",
    "Document storage",
    "Keep source agreements and generated review reports together.",
    "Amazon S3",
  ],
  [
    "03",
    "Extraction",
    "Extract wording and tables; suggest permission fields for human confirmation.",
    "Textract + Bedrock",
  ],
  [
    "04",
    "Permission analysis",
    "Compare confirmed fields with channels, territories, and dates.",
    "Lambda + DynamoDB",
  ],
  [
    "05",
    "Release review",
    "Record decisions; schedule expiry checks and a configured notification workflow.",
    "DynamoDB + EventBridge",
  ],
];
function Contact() {
  const [feedback, setFeedback] = useState("");
  const form = useRef();
  function draft() {
    const d = new FormData(form.current);
    return `Name: ${d.get("name")}\nWork email: ${d.get("email")}\nCompany: ${d.get("company")}\nProduction type: ${d.get("type")}\n\nRights-review challenge:\n${d.get("challenge")}`;
  }
  function submit(e) {
    e.preventDefault();
    location.href = `mailto:${email}?subject=${encodeURIComponent("Cutclear early access & pricing")}&body=${encodeURIComponent(draft())}`;
    setFeedback(
      "Email draft requested. Send it in your email application; nothing has been submitted here.",
    );
  }
  async function copy() {
    if (!form.current.reportValidity()) return;
    try {
      await navigator.clipboard.writeText(draft());
      setFeedback("Message copied. Paste it into an email to " + email + ".");
    } catch {
      setFeedback("Clipboard unavailable. Select and copy the message below.");
    }
  }
  return (
    <section id="contact" className="contact">
      <div>
        <div className="eyebrow">06 / EARLY ACCESS</div>
        <h2>
          Your next release.
          <br />
          <em>A clearer review.</em>
        </h2>
        <p>
          Cutclear is building a B2B rights-review workspace for small and
          midsize production teams. Tell us about your workflow to discuss early
          access and request pricing.
        </p>
        <a className="email" href={"mailto:" + email}>
          {email} <ArrowUpRight size={20} />
        </a>
        <p className="muted">
          The form opens an email draft. You send it through your email
          application.
        </p>
      </div>
      <form ref={form} onSubmit={submit}>
        <div className="form-grid">
          <label>
            Name
            <input name="name" autoComplete="name" required maxLength={120} />
          </label>
          <label>
            Work email
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={200}
            />
          </label>
          <label>
            Company
            <input
              name="company"
              autoComplete="organization"
              required
              maxLength={160}
            />
          </label>
          <label>
            Production type
            <select name="type">
              <option>Advertising / branded content</option>
              <option>Studio production</option>
              <option>Distribution</option>
              <option>Other</option>
            </select>
          </label>
        </div>
        <label>
          What makes rights review difficult today?
          <textarea name="challenge" required maxLength={3000} />
        </label>
        <div className="actions">
          <button type="submit">
            Open email draft <ArrowUpRight size={16} />
          </button>
          <button className="secondary" type="button" onClick={copy}>
            Copy message
          </button>
        </div>
        <p role="status">{feedback}</p>
        {feedback.startsWith("Clipboard") && (
          <textarea aria-label="Message to copy" readOnly value={draft()} />
        )}
      </form>
    </section>
  );
}
function Home() {
  return (
    <>
      <Hero />
      <section id="product" className="problem">
        <div className="eyebrow">01 / THE SPACE BETWEEN READY AND RELEASED</div>
        <div className="split">
          <h2>
            The edit is finished.
            <br />
            <em>
              The permissions
              <br />
              are scattered.
            </em>
          </h2>
          <div>
            <p className="large">
              One campaign. Different agreements. Different limits.
            </p>
            <p>
              A music licence may cover online use while the campaign includes
              television. A performer release may expire halfway through the
              run. A stock clip may have no agreement attached at all.
            </p>
            <p>
              Cutclear brings the release plan, asset records, and supporting
              evidence into one review—so the next question has a source.
            </p>
            <div className="capability-list">
              {[
                "An asset register linked to its agreements",
                "Permission fields prepared for human confirmation",
                "Channel, territory, and date comparisons",
                "Missing-information and ambiguity queues",
                "Evidence-linked review report exports",
              ].map((t, i) => (
                <div key={t}>
                  <span>0{i + 1}</span>
                  {t}
                  <ArrowUpRight size={16} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section id="process" className="process">
        <div className="eyebrow">02 / A REVIEW WITH A TRACEABLE PATH</div>
        <h2>
          From asset list
          <br />
          to <em>informed decisions.</em>
        </h2>
        <div className="steps">
          {[
            ["List assets", "Start with your production manifest."],
            ["Attach agreements", "Connect each asset to its source evidence."],
            ["Define the release", "Set channels, territories, and dates."],
            ["Review gaps", "Inspect findings and ambiguous terms."],
            ["Record decisions", "Assign follow-ups and export the review."],
          ].map(([n, d], i) => (
            <div key={n}>
              <span>
                0{i + 1} <ArrowRight size={17} />
              </span>
              <h3>{n}</h3>
              <p>{d}</p>
            </div>
          ))}
        </div>
      </section>
      <Demo />
      <section className="audience">
        <div className="eyebrow">BUILT AROUND THE HANDOVER</div>
        <h2>
          Different desks.
          <br />
          <em>The same release plan.</em>
        </h2>
        <div className="three-col">
          {[
            [
              "Production studios",
              "Check music, footage, and performer records before handing over the final production.",
            ],
            [
              "Advertising teams",
              "Compare a campaign’s planned channels and dates with the permissions in the file.",
            ],
            [
              "Media distributors",
              "Review supplied evidence against the territories and release window being requested.",
            ],
          ].map(([n, d]) => (
            <article key={n}>
              <Layers size={23} />
              <h3>{n}</h3>
              <p>{d}</p>
            </article>
          ))}
        </div>
      </section>
      <section id="architecture" className="architecture">
        <div className="section-heading">
          <div>
            <div className="eyebrow">04 / THE PROPOSED FOUNDATION</div>
            <h2>
              Architecture on
              <br />
              <em>Amazon Web Services</em>
            </h2>
          </div>
          <p>
            The proposed architecture connects production assets, permission
            evidence, and release-plan checks. The interactive demo uses sample
            data.
          </p>
        </div>
        <div className="pipeline">
          {services.map(([num, n, d, s]) => (
            <article key={num}>
              <span className="mono">{num}</span>
              <h3>{n}</h3>
              <p>{d}</p>
              <small>{s}</small>
            </article>
          ))}
        </div>
        <p className="architecture-note">
          Extract wording → confirm permission fields → compare the release plan
          → record a human decision. None of these steps constitutes legal
          clearance. Proposed expiry reminders require a configured notification
          workflow. Website hosting is separate from this SaaS architecture; no
          AWS services are connected to this demo.
        </p>
      </section>
      <section id="leadership" className="leadership">
        <div className="eyebrow">05 / LEADERSHIP</div>
        <h2>
          The People
          <br />
          <em>Building Cutclear</em>
        </h2>
        <div className="leaders">
          {[
            ["DC", "Damilola Cole", "Founder & CEO"],
            ["PT", "Paulo Tongo", "Co-founder & CTO"],
          ].map(([a, n, t]) => (
            <article key={a}>
              <div className="avatar">{a}</div>
              <div>
                <h3>{n}</h3>
                <p>{t}</p>
              </div>
              <span className="mono">CUTCLEAR / 2026</span>
            </article>
          ))}
        </div>
      </section>
      <Contact />
    </>
  );
}
function Brand() {
  return (
    <main className="brand-page">
      <div className="eyebrow">CUTCLEAR / IDENTITY</div>
      <h1>
        A clear frame.
        <br />
        <em>An open question.</em>
      </h1>
      <p>
        Original vector identity. Frame lines hold the record; an offset cut
        opens the review.
      </p>
      <div className="brand-board">
        <img src="/brand/logo-dark.svg" alt="Cutclear dark horizontal logo" />
      </div>
      <div className="downloads">
        <a download href="/brand/logo-dark.svg">
          Download SVG
        </a>
        <a download href="/brand/logo-dark.png">
          Transparent PNG
        </a>
      </div>
      <div className="brand-board reversed">
        <img
          src="/brand/logo-light.svg"
          alt="Cutclear reversed horizontal logo"
        />
      </div>
      <div className="downloads">
        <a download href="/brand/logo-light.svg">
          Download reversed SVG
        </a>
        <a download href="/brand/logo-light.png">
          Transparent PNG
        </a>
      </div>
      <div className="brand-board square">
        <img src="/brand/avatar.svg" alt="Cutclear square symbol" />
      </div>
      <div className="downloads">
        <a download href="/brand/symbol.svg">
          Symbol SVG
        </a>
        <a download href="/brand/avatar.svg">
          Avatar SVG
        </a>
        <a download href="/brand/avatar.png">
          Avatar PNG
        </a>
        <a download href="/brand/favicon.svg">
          Favicon SVG
        </a>
      </div>
      <p>
        Palette: warm black #201E1C · cream #F7F1E7 · burnt orange #C76B43 ·
        lilac #A69AB9.
      </p>
    </main>
  );
}
function Legal({ type }) {
  const privacy = type === "privacy";
  return (
    <main className="legal">
      <div className="eyebrow">REVIEW-READY POLICY DRAFT / 18 OCTOBER 2026</div>
      <h1>{privacy ? "Privacy" : "Terms of use"}</h1>
      <p>
        These draft pages describe this review website. They require operator
        and legal review before public launch.
      </p>
      {privacy ? (
        <>
          <h2>What happens in the demo</h2>
          <p>
            The demo uses fictional sample records. Release-plan changes,
            reviewer assignments, decisions and notes remain in page memory
            until reset or reload. This website does not send those entries to a
            Cutclear server or use analytics or tracking cookies.
          </p>
          <h2>Exports and contact</h2>
          <p>
            Exports generate a file on your device. Opening an email draft
            passes your entered form information to your chosen email
            application; you must send it yourself. Copy message uses your
            browser clipboard permission. Email sent by you is handled by your
            email provider and the recipient’s provider.
          </p>
          <h2>Information you choose to share</h2>
          <p>
            Please do not enter sensitive agreements or personal production
            information into this sample. Contact Cutclear about questions or
            requests concerning information you send by email. Operator details
            and a retention policy for future production services remain to be
            established.
          </p>
        </>
      ) : (
        <>
          <h2>Scope of the review website</h2>
          <p>
            Cutclear is building software that assists production rights review.
            The interactive demonstration uses sample data and fixed permission
            fields. It is not a live production system or a service for
            purchasing licences.
          </p>
          <h2>Evidence and decisions</h2>
          <p>
            No gap detected against recorded terms means only that the compared
            fields match the sample release plan. Missing evidence stays
            unknown. Reviewer acknowledgements do not extend permissions,
            establish ownership or approve public release. Seek appropriate
            specialist advice for actual rights decisions.
          </p>
          <h2>Use of the materials</h2>
          <p>
            Use the demo and sample exports to evaluate the proposed workflow.
            Do not present fictional agreement excerpts as real evidence. No
            subscription, payment, or account is created by using this website.
            Production service terms will require separate review before
            availability.
          </p>
        </>
      )}
      <h2>Contact</h2>
      <p>
        <a href={"mailto:" + email}>{email}</a>
      </p>
    </main>
  );
}
export default function App({ path = "/" }) {
  const route = path.replace(/\/$/, "") || "/";
  return (
    <>
      <Header />
      {route === "/" ? (
        <main>
          <Home />
        </main>
      ) : route === "/brand" ? (
        <Brand />
      ) : ["/privacy", "/terms"].includes(route) ? (
        <Legal type={route.slice(1)} />
      ) : (
        <main className="not-found">
          <div className="eyebrow">404 / OUT OF FRAME</div>
          <h1>
            This page
            <br />
            <em>missed the cut.</em>
          </h1>
          <p>We couldn’t find that page.</p>
          <a className="button" href="/">
            Return to Cutclear <ArrowRight size={17} />
          </a>
        </main>
      )}
      <Footer />
    </>
  );
}
