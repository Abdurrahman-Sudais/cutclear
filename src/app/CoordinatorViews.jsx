import React, { useState } from "react";
import {
  ArrowRight,
  Download,
  Check,
  X,
  Send,
  FileText,
  AlertTriangle,
} from "lucide-react";
import {
  check,
  expiring,
  signoffBlockers,
  productionStatus,
  CHANNELS,
  TERRITORIES,
  REGIONS,
} from "./engine.js";
import {
  createProduction,
  updatePlan,
  confirmTerms,
  decideSuggestion,
  decideAsset,
  requestFromProducer,
  signOff,
  clearanceReport,
  displayName,
  DECISIONS,
  REQUESTS,
} from "./actions.js";
import {
  Link,
  PageHead,
  AiBadge,
  Status,
  Kpi,
  Empty,
  StackBar,
  fmtDate,
  fmtDay,
  download,
} from "./ui.jsx";

const NEXT = {
  "In review": ["Resolve findings and record decisions", "assets"],
  "Waiting on producer": ["Waiting on the producer’s requests", "requests"],
  "Ready for sign-off": ["Sign off the release", "signoff"],
  "Awaiting second sign-off": ["A second coordinator signs off", "signoff"],
  "Signed off": ["Signed off", "signoff"],
};
const PLACES = [...Object.keys(REGIONS), ...TERRITORIES];

function MultiCheck({ legend, options, value, onChange }) {
  return (
    <fieldset className="pa-multi">
      <legend>{legend}</legend>
      {options.map((o) => (
        <label key={o} className="check-label">
          <input
            type="checkbox"
            checked={value.includes(o)}
            onChange={(e) =>
              onChange(
                e.target.checked ? [...value, o] : value.filter((x) => x !== o),
              )
            }
          />{" "}
          {o}
        </label>
      ))}
    </fieldset>
  );
}

/* ---------------- Dashboard ---------------- */
export function CoordinatorDashboard({ data, user }) {
  const live = data.productions.filter((p) => !p.signoff?.final);
  const rows = live.flatMap((p) =>
    p.assets.map((a) => check(a, p.plan, p.credits)),
  );
  const st = (s) => rows.filter((r) => r.status === s).length;
  const exp = expiring(
    data.productions,
    data.policy.today,
    data.policy.expiryWarningDays,
  );
  return (
    <>
      <PageHead
        title={`Good morning, ${user.name.split(" ")[0]}`}
        sub="Releases in review, what is not clear yet, and licences running out."
      />
      <div className="pa-kpis">
        <Kpi
          value={live.length}
          label="releases in review"
          to="#/productions"
        />
        <Kpi value={st("Gaps found")} label="assets with permission gaps" />
        <Kpi
          value={st("Missing evidence") + st("Unconfirmed terms")}
          label="assets without confirmed evidence"
        />
        <Kpi
          value={exp.length}
          label={`licences ending within ${data.policy.expiryWarningDays} days`}
        />
      </div>
      <div className="pa-grid2">
        <section className="pa-card" aria-labelledby="rel">
          <h2 id="rel">Releases</h2>
          <ul className="pa-list">
            {data.productions.map((p) => {
              const s = productionStatus(p);
              return (
                <li key={p.id}>
                  <Link to={`#/productions/${p.id}/${NEXT[s][1]}`}>
                    <strong>
                      {p.id} · {p.title}
                    </strong>
                    <small>
                      {p.client} · plan v{p.plan.version} · {p.plan.start} to{" "}
                      {p.plan.end}
                    </small>
                  </Link>
                  <Status value={s} />
                  <span className="pa-next">
                    {NEXT[s][0]} <ArrowRight size={14} aria-hidden="true" />
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
        <section className="pa-card" aria-labelledby="mix">
          <h2 id="mix">Assets in releases under review</h2>
          <StackBar
            parts={[
              {
                label: "No gap detected",
                value: st("No gap detected"),
                tone: "ok",
              },
              {
                label: "Obligation open",
                value: st("Obligation open"),
                tone: "info",
              },
              {
                label: "Unconfirmed / missing",
                value: st("Unconfirmed terms") + st("Missing evidence"),
                tone: "warn",
              },
              { label: "Gaps found", value: st("Gaps found"), tone: "bad" },
            ]}
          />
          <ul className="pa-legend">
            <li>
              <i className="ok" />
              Clear {st("No gap detected")}
            </li>
            <li>
              <i className="info" />
              Obligation {st("Obligation open")}
            </li>
            <li>
              <i className="warn" />
              Unconfirmed or missing{" "}
              {st("Unconfirmed terms") + st("Missing evidence")}
            </li>
            <li>
              <i className="bad" />
              Gaps {st("Gaps found")}
            </li>
          </ul>
          <h2>Licences ending soon</h2>
          {exp.length ? (
            <ul className="pa-feed">
              {exp.map((x) => (
                <li key={x.production + x.asset}>
                  <span>
                    <AlertTriangle size={13} aria-hidden="true" />{" "}
                    {x.production} · {x.asset} · {x.ref}
                  </span>
                  <small>
                    Ends {fmtDay(x.end)} · {x.days} days from the demo date
                  </small>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>
              No confirmed licence ends within {data.policy.expiryWarningDays}{" "}
              days.
            </Empty>
          )}
          <p className="pa-hint">
            In production a daily EventBridge schedule runs this check and
            notifies the owner.
          </p>
        </section>
      </div>
    </>
  );
}

/* ---------------- List ---------------- */
export function ProductionList({ data }) {
  return (
    <>
      <PageHead
        title="Productions"
        sub="Each production pairs a release plan with the assets in the cut and their agreements."
      >
        <Link className="button" to="#/productions/new">
          New production
        </Link>
      </PageHead>
      <div className="pa-card pa-tablewrap">
        <table className="pa-table">
          <thead>
            <tr>
              <th>Production</th>
              <th>Release plan</th>
              <th className="num">Assets</th>
              <th className="num">Not clear</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.productions.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link to={`#/productions/${p.id}`}>
                    <strong>
                      {p.id} · {p.title}
                    </strong>
                  </Link>
                  <small>
                    {p.client} · owner {displayName(data, p.owner)}
                  </small>
                </td>
                <td>
                  {p.plan.territories.join(", ")} · {p.plan.channels.join(", ")}
                  {p.plan.paidMedia ? " · paid" : ""}
                  <small>
                    {p.plan.start} to {p.plan.end} · v{p.plan.version}
                  </small>
                </td>
                <td className="num">{p.assets.length}</td>
                <td className="num">
                  {
                    p.assets.filter(
                      (a) =>
                        check(a, p.plan, p.credits).status !==
                        "No gap detected",
                    ).length
                  }
                </td>
                <td>
                  <Status value={productionStatus(p)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ---------------- New production ---------------- */
export function NewProduction({ act, go, notify }) {
  const [f, setF] = useState({
    title: "",
    client: "",
    start: "",
    end: "",
    territories: [],
    channels: [],
    paidMedia: false,
  });
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  return (
    <>
      <PageHead
        title="New production"
        sub="Define the release first. Assets and agreements are added by the producer and checked against this plan."
      >
        <button
          type="button"
          className="text-button"
          onClick={() =>
            setF({
              title: "Harbour Lights",
              client: "Northline Ferries (fictional)",
              start: "2027-03-01",
              end: "2027-08-31",
              territories: ["United Kingdom", "Ireland"],
              channels: ["Online", "Social"],
              paidMedia: true,
            })
          }
        >
          <FileText size={16} aria-hidden="true" /> Fill with an example
        </button>
      </PageHead>
      <form
        className="pa-card pa-form"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          const r = act(createProduction, f);
          if (r.ok) {
            notify(
              `${r.result} created. Switch to the producer to add assets.`,
            );
            go(`#/productions/${r.result}/plan`);
          }
        }}
      >
        <div className="pa-form-grid">
          <label>
            Title
            <input
              value={f.title}
              onChange={(e) => set("title", e.target.value)}
              maxLength={80}
            />
          </label>
          <label>
            Client
            <input
              value={f.client}
              onChange={(e) => set("client", e.target.value)}
              maxLength={80}
            />
          </label>
          <label>
            Release start
            <input
              type="date"
              value={f.start}
              onChange={(e) => set("start", e.target.value)}
            />
          </label>
          <label>
            Release end
            <input
              type="date"
              value={f.end}
              onChange={(e) => set("end", e.target.value)}
            />
          </label>
        </div>
        <div className="pa-form-grid">
          <MultiCheck
            legend="Territories"
            options={TERRITORIES}
            value={f.territories}
            onChange={(v) => set("territories", v)}
          />
          <div>
            <MultiCheck
              legend="Channels"
              options={CHANNELS}
              value={f.channels}
              onChange={(v) => set("channels", v)}
            />
            <label className="check-label">
              <input
                type="checkbox"
                checked={f.paidMedia}
                onChange={(e) => set("paidMedia", e.target.checked)}
              />{" "}
              Includes paid media placement
            </label>
          </div>
        </div>
        <button className="button">Create production</button>
      </form>
    </>
  );
}

/* ---------------- Detail ---------------- */
const TABS = [
  ["plan", "Release plan"],
  ["assets", "Assets"],
  ["ai", "AI suggestions"],
  ["requests", "Requests"],
  ["signoff", "Sign-off"],
  ["activity", "Activity"],
];

export function ProductionDetail(props) {
  const { data, id, tab } = props;
  const p = data.productions.find((x) => x.id === id);
  if (!p)
    return (
      <div className="pa-card pa-denied">
        <h1>Production not found</h1>
        <Link className="button" to="#/productions">
          All productions
        </Link>
      </div>
    );
  const counts = {
    assets: p.assets.filter(
      (a) => check(a, p.plan, p.credits).status !== "No gap detected",
    ).length,
    ai: p.suggestions.filter((s) => s.decision === "pending").length,
    requests: p.requests.filter((r) => !r.done).length,
  };
  const Tab =
    {
      plan: PlanTab,
      assets: AssetsTab,
      ai: AiTab,
      requests: RequestsTab,
      signoff: SignoffTab,
      activity: ActivityTab,
    }[tab] || AssetsTab;
  return (
    <>
      <PageHead
        title={`${p.id} · ${p.title}`}
        sub={`${p.client} · plan v${p.plan.version}: ${p.plan.territories.join(", ")} · ${p.plan.channels.join(", ")}${p.plan.paidMedia ? " · paid media" : ""} · ${p.plan.start} to ${p.plan.end}`}
      >
        <button
          className="text-button"
          onClick={() =>
            download(
              `cutclear-${p.id}-review.json`,
              JSON.stringify(clearanceReport(data, p), null, 2),
              "application/json",
            )
          }
        >
          <Download size={16} aria-hidden="true" /> Review report
        </button>
      </PageHead>
      <div className="pa-review-status">
        <Status value={productionStatus(p)} />
        <span>Owner {displayName(data, p.owner)}</span>
      </div>
      <nav className="pa-tabs" aria-label="Production sections">
        {TABS.map(([k, label]) => (
          <Link
            key={k}
            to={`#/productions/${p.id}/${k}`}
            aria-current={k === tab ? "page" : undefined}
          >
            {label}
            {counts[k] ? <span className="pa-count">{counts[k]}</span> : null}
          </Link>
        ))}
      </nav>
      <Tab {...props} p={p} />
    </>
  );
}

function PlanTab({ p, act, notify }) {
  const [f, setF] = useState(p.plan);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  return (
    <form
      className="pa-card pa-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (
          act(updatePlan, p.id, {
            start: f.start,
            end: f.end,
            territories: f.territories,
            channels: f.channels,
            paidMedia: f.paidMedia,
          }).ok
        )
          notify(
            "Plan saved as a new version. Every asset was re-checked and decisions cleared.",
          );
      }}
    >
      <h2>Release plan v{p.plan.version}</h2>
      <div className="pa-form-grid">
        <label>
          Release start
          <input
            type="date"
            value={f.start}
            onChange={(e) => set("start", e.target.value)}
          />
        </label>
        <label>
          Release end
          <input
            type="date"
            value={f.end}
            onChange={(e) => set("end", e.target.value)}
          />
        </label>
      </div>
      <div className="pa-form-grid">
        <MultiCheck
          legend="Territories"
          options={TERRITORIES}
          value={f.territories}
          onChange={(v) => set("territories", v)}
        />
        <div>
          <MultiCheck
            legend="Channels"
            options={CHANNELS}
            value={f.channels}
            onChange={(v) => set("channels", v)}
          />
          <label className="check-label">
            <input
              type="checkbox"
              checked={f.paidMedia}
              onChange={(e) => set("paidMedia", e.target.checked)}
            />{" "}
            Includes paid media placement
          </label>
        </div>
      </div>
      <p className="pa-hint">
        Saving creates a new plan version, re-checks every asset, clears asset
        decisions and reopens any sign-off, because clearance is only for the
        plan it was given against.
      </p>
      <button className="button">Save plan v{p.plan.version + 1}</button>
    </form>
  );
}

function AssetsTab({ data, p, assetId, act, notify, go }) {
  const sel = p.assets.find((a) => a.id === assetId) || p.assets[0];
  return (
    <div className="pa-split">
      <section className="pa-card" aria-label="Assets in the cut">
        <ul className="pa-findings">
          {p.assets.map((a) => {
            const r = check(a, p.plan, p.credits);
            return (
              <li key={a.id}>
                <button
                  className={a.id === sel?.id ? "active" : ""}
                  aria-pressed={a.id === sel?.id}
                  onClick={() => go(`#/productions/${p.id}/assets/${a.id}`)}
                >
                  <span className="pa-fid">{a.id}</span>
                  <span>
                    <strong>{a.name}</strong>
                    <small>
                      {a.type} · {a.usedSeconds} s ·{" "}
                      {a.agreement ? a.agreement.ref : "no agreement"}
                    </small>
                  </span>
                  <Status value={r.status} />
                  {a.decision && <Status value={a.decision.type} />}
                </button>
              </li>
            );
          })}
        </ul>
        {!p.assets.length && (
          <Empty>No assets yet. The producer adds the assets in the cut.</Empty>
        )}
        <h3>Production credits</h3>
        {p.credits.length ? (
          <ul className="pa-feed">
            {p.credits.map((c) => (
              <li key={c}>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="pa-hint">No credits yet.</p>
        )}
      </section>
      {sel ? (
        <AssetPanel
          key={sel.id + (sel.agreement?.confirmed ? "c" : "u")}
          data={data}
          p={p}
          a={sel}
          act={act}
          notify={notify}
        />
      ) : (
        <section className="pa-card">
          <Empty>Select an asset.</Empty>
        </section>
      )}
    </div>
  );
}

function AssetPanel({ p, a, act, notify }) {
  const r = check(a, p.plan, p.credits);
  const ag = a.agreement;
  const [terms, setTerms] = useState(
    ag
      ? {
          territories: ag.territories,
          channels: ag.channels,
          start: ag.start,
          end: ag.end,
          maxSeconds: ag.maxSeconds ?? "",
          paidMedia:
            ag.paidMedia === false
              ? "no"
              : ag.paidMedia === true
                ? "yes"
                : "unspecified",
          creditRequired: ag.creditRequired || "",
        }
      : null,
  );
  const [decision, setDecision] = useState({
    type:
      r.status === "No gap detected"
        ? "Cleared for this plan"
        : "Needs licence change",
    note: "",
  });
  const [req, setReq] = useState({
    kind: !ag
      ? "Supply agreement"
      : r.findings.some((f) => f.kind === "Credit obligation open")
        ? "Add credit"
        : r.findings.some((f) => f.kind === "Duration gap")
          ? "Shorten use"
          : "Licence extension",
    note: "",
  });
  const locked = !!p.signoff?.final;
  return (
    <section className="pa-card pa-finding" aria-labelledby="asset-title">
      <p className="eyebrow">
        {a.id} · {a.type}
      </p>
      <h2 id="asset-title">{a.name}</h2>
      <div className="pa-row">
        <Status value={r.status} />
        {a.decision && <Status value={a.decision.type} />}
      </div>
      {ag && <p className="pa-quote">{ag.excerpt}</p>}
      {r.findings.length > 0 && (
        <ul className="pa-checklist">
          {r.findings.map((f) => (
            <li
              key={f.kind}
              className={f.kind === "Credit obligation open" ? "info" : "bad"}
            >
              <X size={14} aria-hidden="true" />{" "}
              <span>
                <strong>{f.kind}.</strong> {f.detail}
              </span>
            </li>
          ))}
        </ul>
      )}
      {r.status === "No gap detected" && (
        <p className="pa-hint">
          No gap detected against the confirmed terms for plan v{p.plan.version}
          . This compares recorded fields only; it is not legal clearance.
        </p>
      )}

      {ag && !ag.confirmed && !locked && (
        <form
          className="pa-form pa-confirm"
          onSubmit={(e) => {
            e.preventDefault();
            const fields = {
              territories: terms.territories,
              channels: terms.channels,
              start: terms.start,
              end: terms.end,
              maxSeconds:
                terms.maxSeconds === "" ? null : Number(terms.maxSeconds),
              paidMedia:
                terms.paidMedia === "no"
                  ? false
                  : terms.paidMedia === "yes"
                    ? true
                    : null,
              creditRequired: terms.creditRequired.trim() || null,
            };
            if (act(confirmTerms, p.id, a.id, fields).ok)
              notify(`${a.id} terms confirmed and checked.`);
          }}
        >
          <h3>Confirm extracted terms against the wording above</h3>
          <div className="pa-form-grid">
            <MultiCheck
              legend="Licensed territories"
              options={PLACES}
              value={terms.territories}
              onChange={(v) => setTerms((t) => ({ ...t, territories: v }))}
            />
            <MultiCheck
              legend="Licensed channels"
              options={CHANNELS}
              value={terms.channels}
              onChange={(v) => setTerms((t) => ({ ...t, channels: v }))}
            />
          </div>
          <div className="pa-form-grid">
            <label>
              Licence start
              <input
                type="date"
                value={terms.start}
                onChange={(e) =>
                  setTerms((t) => ({ ...t, start: e.target.value }))
                }
              />
            </label>
            <label>
              Licence end
              <input
                type="date"
                value={terms.end}
                onChange={(e) =>
                  setTerms((t) => ({ ...t, end: e.target.value }))
                }
              />
            </label>
            <label>
              Maximum seconds per use (blank = no limit)
              <input
                type="number"
                min="0"
                value={terms.maxSeconds}
                onChange={(e) =>
                  setTerms((t) => ({ ...t, maxSeconds: e.target.value }))
                }
              />
            </label>
            <label>
              Paid media
              <select
                value={terms.paidMedia}
                onChange={(e) =>
                  setTerms((t) => ({ ...t, paidMedia: e.target.value }))
                }
              >
                <option value="unspecified">Not stated</option>
                <option value="yes">Permitted</option>
                <option value="no">Excluded</option>
              </select>
            </label>
          </div>
          <label>
            Required credit (blank = none)
            <input
              value={terms.creditRequired}
              onChange={(e) =>
                setTerms((t) => ({ ...t, creditRequired: e.target.value }))
              }
            />
          </label>
          <button className="button">
            <Check size={16} aria-hidden="true" /> Confirm terms
          </button>
        </form>
      )}

      {!locked && (
        <div className="pa-grid2 pa-subforms">
          <form
            className="pa-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (act(decideAsset, p.id, a.id, decision.type, decision.note).ok)
                notify(`Decision recorded for ${a.id}.`);
            }}
          >
            <h3>Decision for plan v{p.plan.version}</h3>
            <label>
              Decision
              <select
                value={decision.type}
                onChange={(e) =>
                  setDecision((x) => ({ ...x, type: e.target.value }))
                }
              >
                {DECISIONS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </label>
            <label>
              Note
              <input
                value={decision.note}
                onChange={(e) =>
                  setDecision((x) => ({ ...x, note: e.target.value }))
                }
                placeholder="Required unless cleared"
                maxLength={300}
              />
            </label>
            <button className="button">Record decision</button>
          </form>
          <form
            className="pa-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (act(requestFromProducer, p.id, a.id, req.kind, req.note).ok)
                notify("Request sent to the producer.");
            }}
          >
            <h3>Ask the producer</h3>
            <label>
              Request
              <select
                value={req.kind}
                onChange={(e) =>
                  setReq((x) => ({ ...x, kind: e.target.value }))
                }
              >
                {REQUESTS.map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
            </label>
            <label>
              Note
              <input
                value={req.note}
                onChange={(e) =>
                  setReq((x) => ({ ...x, note: e.target.value }))
                }
                placeholder="e.g. Trim to 15 s or extend LIC-021"
                maxLength={300}
              />
            </label>
            <button className="button secondary">
              <Send size={16} aria-hidden="true" /> Send request
            </button>
          </form>
        </div>
      )}
    </section>
  );
}

function AiTab({ data, p, act, notify }) {
  const [reason, setReason] = useState({});
  return (
    <section className="pa-card">
      <h2>AI suggestions</h2>
      <p className="pa-hint">
        In production, Amazon Bedrock reads each agreement’s wording and points
        out restrictions the confirmed fields do not capture, quoting the text.
        A coordinator decides; confirming adds the restriction to the terms.{" "}
        {data.policy.aiSuggestions
          ? ""
          : "AI suggestions are switched off by your administrator."}
      </p>
      {p.suggestions.length ? (
        p.suggestions.map((s) => (
          <article className="pa-suggestion" key={s.id}>
            <div className="pa-row between">
              <span>
                <AiBadge />{" "}
                <strong>
                  {s.assetId} · {s.label}
                </strong>
              </span>
              <Status
                value={s.decision}
                label={
                  s.decision === "pending"
                    ? "Needs a decision"
                    : s.decision === "confirmed"
                      ? "Restriction added"
                      : "Dismissed"
                }
              />
            </div>
            <p className="pa-quote">{s.quote}</p>
            <p className="pa-hint">
              The wording mentions “{s.phrase}”, but the confirmed fields do not
              record that restriction.
            </p>
            {s.decision !== "pending" && (
              <p className="pa-hint">
                Decided by {displayName(data, s.by)} · {fmtDate(s.at)}
                {s.reason ? ` · “${s.reason}”` : ""}
              </p>
            )}
            {s.decision === "pending" && !p.signoff?.final && (
              <div className="pa-actions">
                <button
                  className="button"
                  onClick={() => {
                    if (act(decideSuggestion, p.id, s.id, true, "").ok)
                      notify("Restriction added to the agreement terms.");
                  }}
                >
                  <Check size={16} aria-hidden="true" /> Add restriction
                </button>
                <form
                  className="pa-reason"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (
                      act(
                        decideSuggestion,
                        p.id,
                        s.id,
                        false,
                        reason[s.id] || "",
                      ).ok
                    )
                      notify("Suggestion dismissed.");
                  }}
                >
                  <label>
                    Dismiss, because…
                    <input
                      value={reason[s.id] || ""}
                      onChange={(e) =>
                        setReason((x) => ({ ...x, [s.id]: e.target.value }))
                      }
                      placeholder="e.g. Licensor confirmed paid social is allowed (email 3 Nov)"
                      maxLength={300}
                    />
                  </label>
                  <button className="text-button">
                    <X size={16} aria-hidden="true" /> Dismiss
                  </button>
                </form>
              </div>
            )}
          </article>
        ))
      ) : (
        <Empty>
          No suggestions for this production. Suggestions only appear for
          agreements whose wording names a restriction the fields do not
          capture.
        </Empty>
      )}
    </section>
  );
}

function RequestsTab({ data, p }) {
  return (
    <section className="pa-card">
      <h2>Requests to the producer</h2>
      {p.requests.length ? (
        <table className="pa-table">
          <thead>
            <tr>
              <th>Asset</th>
              <th>Request</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {p.requests.map((r) => (
              <tr key={r.id}>
                <td>{r.assetId}</td>
                <td>
                  {r.kind}
                  <small>
                    {r.note || "—"} · {displayName(data, r.by)} ·{" "}
                    {fmtDate(r.at)}
                  </small>
                </td>
                <td>
                  <Status
                    value={r.done ? "done" : "open"}
                    label={r.done ? "Done" : "Open"}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <Empty>No requests yet. Send one from an asset.</Empty>
      )}
    </section>
  );
}

function SignoffTab({ data, p, act, notify, user }) {
  const blockers = signoffBlockers(p);
  const s = p.signoff;
  if (s?.final)
    return (
      <section className="pa-card">
        <h2>Signed off</h2>
        <p>
          Plan v{s.version} signed off by {displayName(data, s.by)}
          {s.second ? ` and ${displayName(data, s.second)}` : ""} on{" "}
          {fmtDay(s.secondAt || s.at)}. Changing the plan or any asset reopens
          it.
        </p>
        <p className="pa-hint">A recorded review, not legal clearance.</p>
      </section>
    );
  return (
    <section className="pa-card">
      <h2>Release sign-off</h2>
      {blockers.length ? (
        <ul className="pa-checklist">
          {blockers.map((b) => (
            <li key={b} className="bad">
              <X size={14} aria-hidden="true" /> {b}
            </li>
          ))}
        </ul>
      ) : (
        <p>
          Every asset shows no gap against plan v{p.plan.version} and has a
          “Cleared for this plan” decision.
        </p>
      )}
      {s && (
        <p className="pa-callout">
          First sign-off by {displayName(data, s.by)} on {fmtDate(s.at)}. A
          second coordinator must confirm.
        </p>
      )}
      {s && s.by === user.id ? (
        <p className="pa-hint">
          Switch “Demo as” to another coordinator to give the second sign-off.
        </p>
      ) : (
        <button
          className="button"
          disabled={!!blockers.length}
          onClick={() => {
            if (act(signOff, p.id).ok)
              notify(
                s
                  ? "Second sign-off recorded."
                  : data.policy.twoPersonSignoff
                    ? "First sign-off recorded; a second coordinator must confirm."
                    : "Release signed off.",
              );
          }}
        >
          {s ? "Give second sign-off" : "Sign off release"}
        </button>
      )}
      <p className="pa-hint">
        Sign-off records that the coordinators reviewed this plan version
        against the recorded evidence. It is not legal clearance and does not
        purchase or extend any licence.
      </p>
    </section>
  );
}

function ActivityTab({ data, p }) {
  const rows = data.audit.filter((a) => a.detail.startsWith(p.id)).reverse();
  return (
    <section className="pa-card">
      <h2>Activity</h2>
      {rows.length ? (
        <ol className="pa-feed">
          {rows.map((a) => (
            <li key={a.id}>
              <span>
                {a.action} · {displayName(data, a.user)}
              </span>
              <small>
                {a.detail} · {fmtDate(a.at)}
              </small>
            </li>
          ))}
        </ol>
      ) : (
        <Empty>No activity yet.</Empty>
      )}
    </section>
  );
}
