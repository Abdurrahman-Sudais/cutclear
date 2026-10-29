import React, { useState } from "react";
import { Download, Check, X } from "lucide-react";
import { check, expiring, productionStatus, csv } from "./engine.js";
import { setRole, setPolicy, PERMISSIONS, displayName } from "./actions.js";
import {
  PageHead,
  Kpi,
  StackBar,
  Empty,
  fmtDate,
  fmtDay,
  download,
} from "./ui.jsx";

const ROLES = [
  ["coordinator", "Rights coordinator"],
  ["producer", "Producer"],
  ["admin", "Administrator"],
];

export function AdminOverview({ data }) {
  const all = data.productions.flatMap((p) =>
    p.assets.map((a) => ({ p, a, r: check(a, p.plan, p.credits) })),
  );
  const kinds = all
    .flatMap((x) => x.r.findings.map((f) => f.kind))
    .reduce((m, k) => ({ ...m, [k]: (m[k] || 0) + 1 }), {});
  const ai = data.productions.flatMap((p) => p.suggestions);
  const exp = expiring(
    data.productions,
    data.policy.today,
    data.policy.expiryWarningDays,
  );
  return (
    <>
      <PageHead
        title="Workspace overview"
        sub="Aggregate figures only. Agreements and decisions stay with coordinators."
      />
      <div className="pa-kpis">
        <Kpi value={data.productions.length} label="productions" />
        <Kpi
          value={data.productions.filter((p) => p.signoff?.final).length}
          label="releases signed off"
        />
        <Kpi
          value={all.filter((x) => x.r.status === "Gaps found").length}
          label="assets with gaps"
        />
        <Kpi
          value={exp.length}
          label={`licences ending within ${data.policy.expiryWarningDays} days`}
        />
      </div>
      <div className="pa-grid2">
        <section className="pa-card">
          <h2>Findings by kind</h2>
          {Object.keys(kinds).length ? (
            <table className="pa-table">
              <tbody>
                {Object.entries(kinds).map(([k, n]) => (
                  <tr key={k}>
                    <td>{k}</td>
                    <td className="num">{n}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <Empty>No findings.</Empty>
          )}
          <h2>Productions by status</h2>
          <table className="pa-table">
            <tbody>
              {Object.entries(
                data.productions.reduce((m, p) => {
                  const s = productionStatus(p);
                  return { ...m, [s]: (m[s] || 0) + 1 };
                }, {}),
              ).map(([k, n]) => (
                <tr key={k}>
                  <td>{k}</td>
                  <td className="num">{n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="pa-card">
          <h2>AI suggestion outcomes</h2>
          <StackBar
            parts={[
              {
                label: "Restriction added",
                value: ai.filter((s) => s.decision === "confirmed").length,
                tone: "bad",
              },
              {
                label: "Dismissed",
                value: ai.filter((s) => s.decision === "dismissed").length,
                tone: "muted",
              },
              {
                label: "Pending",
                value: ai.filter((s) => s.decision === "pending").length,
                tone: "ai",
              },
            ]}
          />
          <p className="pa-hint">
            How often coordinators confirm a restriction the AI found in the
            wording. Track it across prompt and model changes.
          </p>
          <h2>Expiry watch</h2>
          {exp.length ? (
            <ul className="pa-feed">
              {exp.map((x) => (
                <li key={x.production + x.asset}>
                  <span>
                    {x.production} · {x.asset} · {x.ref}
                  </span>
                  <small>
                    Ends {fmtDay(x.end)} · {x.days} days
                  </small>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Nothing ending soon.</Empty>
          )}
        </section>
      </div>
    </>
  );
}

export function AdminUsers({ data, user, act, notify }) {
  return (
    <>
      <PageHead
        title="Users & roles"
        sub="Producers see requests and their cut, not findings or decisions. Administrators see aggregates."
      />
      <div className="pa-card pa-tablewrap">
        <table className="pa-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Title</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {data.users.map((u) => (
              <tr key={u.id}>
                <td>
                  <span className="pa-avatar">{u.initials}</span> {u.name}
                  {u.id === user.id && " (you)"}
                </td>
                <td>{u.title}</td>
                <td>
                  <select
                    aria-label={`Role for ${u.name}`}
                    value={u.role}
                    onChange={(e) => {
                      if (act(setRole, u.id, e.target.value).ok)
                        notify(
                          `${u.name} is now ${ROLES.find((r) => r[0] === e.target.value)[1]}.`,
                        );
                    }}
                  >
                    {ROLES.map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function AdminPolicy({ data, act, notify }) {
  const p = data.policy;
  const toggle = (key, label) => (
    <label className="check-label">
      <input
        type="checkbox"
        checked={p[key]}
        onChange={(e) => {
          if (act(setPolicy, key, e.target.checked).ok)
            notify(`${label} ${e.target.checked ? "on" : "off"}.`);
        }}
      />{" "}
      {label}
    </label>
  );
  return (
    <>
      <PageHead
        title="Policy"
        sub="Workspace-wide controls. Every change is written to the audit log."
      />
      <section className="pa-card pa-form">
        {toggle("twoPersonSignoff", "Two-person release sign-off")}
        {toggle("aiSuggestions", "AI suggestions on agreement wording")}
        <label>
          Expiry warning (days)
          <input
            type="number"
            min="7"
            max="365"
            defaultValue={p.expiryWarningDays}
            key={`exp-${p.expiryWarningDays}`}
            onBlur={(e) => {
              if (
                Number(e.target.value) !== p.expiryWarningDays &&
                act(setPolicy, "expiryWarningDays", e.target.value).ok
              )
                notify("Expiry warning updated.");
            }}
          />
        </label>
        <label>
          Demo date (drives expiry checks)
          <input
            type="date"
            value={p.today}
            onChange={(e) => {
              if (e.target.value && act(setPolicy, "today", e.target.value).ok)
                notify("Demo date changed.");
            }}
          />
        </label>
        <p className="pa-hint">
          Permission checks always run. AI only points out wording; a
          coordinator decides each suggestion, and that gate cannot be switched
          off.
        </p>
      </section>
    </>
  );
}

export function AdminAudit({ data }) {
  const [q, setQ] = useState("");
  const rows = data.audit
    .filter((a) =>
      `${a.action} ${a.detail} ${displayName(data, a.user)}`
        .toLowerCase()
        .includes(q.toLowerCase()),
    )
    .reverse();
  return (
    <>
      <PageHead
        title="Audit log"
        sub="Append-only record of who did what, and when."
      >
        <button
          className="text-button"
          onClick={() =>
            download(
              "cutclear-audit.csv",
              csv([
                ["id", "time", "user", "action", "detail"],
                ...data.audit.map((a) => [
                  a.id,
                  a.at,
                  displayName(data, a.user),
                  a.action,
                  a.detail,
                ]),
              ]),
              "text/csv",
            )
          }
        >
          <Download size={16} aria-hidden="true" /> Export CSV
        </button>
      </PageHead>
      <div className="pa-filters">
        <label>
          <span className="sr-only">Filter audit log</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter by action, production or person…"
          />
        </label>
      </div>
      <div className="pa-card pa-tablewrap">
        <table className="pa-table">
          <thead>
            <tr>
              <th>Time (UTC)</th>
              <th>Who</th>
              <th>Action</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id}>
                <td>{fmtDate(a.at)}</td>
                <td>{displayName(data, a.user)}</td>
                <td>{a.action}</td>
                <td>{a.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <Empty>No entries match.</Empty>}
      </div>
    </>
  );
}

export function AdminPermissions() {
  const cell = (v) =>
    v === true ? (
      <Check size={14} aria-label="Allowed" />
    ) : v === false ? (
      <X size={14} aria-label="Not allowed" />
    ) : (
      <small>{v}</small>
    );
  return (
    <>
      <PageHead
        title="Permissions"
        sub="What each role can do. The prototype checks this on every action; production enforces it on the server."
      />
      <div className="pa-card pa-tablewrap">
        <table className="pa-table pa-matrix">
          <thead>
            <tr>
              <th>Capability</th>
              <th>Coordinator</th>
              <th>Producer</th>
              <th>Administrator</th>
            </tr>
          </thead>
          <tbody>
            {PERMISSIONS.map(([label, r]) => (
              <tr key={label}>
                <td>{label}</td>
                <td>{cell(r.coordinator)}</td>
                <td>{cell(r.producer)}</td>
                <td>{cell(r.admin)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
