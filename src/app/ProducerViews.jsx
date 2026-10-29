import React, { useState } from "react";
import { Upload, Plus, Trash2 } from "lucide-react";
import { CHANNELS, TERRITORIES, REGIONS } from "./engine.js";
import {
  addAsset,
  supplyAgreement,
  addCredit,
  editUse,
  removeAsset,
  displayName,
} from "./actions.js";
import { Link, PageHead, Empty, Status, fmtDate } from "./ui.jsx";

const TYPES = [
  "Music",
  "Footage",
  "Stock footage",
  "Talent",
  "Still image",
  "Font",
];

export function ProducerHome({ data }) {
  const live = data.productions.filter((p) => !p.signoff?.final);
  return (
    <>
      <PageHead
        title="Requests & cut"
        sub="What the rights coordinators need from you, and the assets in each cut. You do not see their findings or decisions."
      />
      {live.map((p) => {
        const open = p.requests.filter((r) => !r.done);
        return (
          <section className="pa-card" key={p.id} aria-labelledby={`p-${p.id}`}>
            <div className="pa-row between">
              <div>
                <h2 id={`p-${p.id}`}>
                  {p.id} · {p.title}
                </h2>
                <p className="pa-hint">
                  {p.assets.length} assets in the cut · {open.length} open
                  request{open.length === 1 ? "" : "s"}
                </p>
              </div>
              <Link className="button" to={`#/producer/${p.id}`}>
                Open
              </Link>
            </div>
            {open.length ? (
              <ul className="pa-feed">
                {open.map((r) => (
                  <li key={r.id}>
                    <span>
                      {r.assetId} · {r.kind}
                    </span>
                    <small>
                      {r.note || "—"} · {displayName(data, r.by)} ·{" "}
                      {fmtDate(r.at)}
                    </small>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="pa-hint">No open requests.</p>
            )}
          </section>
        );
      })}
      {!live.length && (
        <div className="pa-card">
          <Empty>No productions in review.</Empty>
        </div>
      )}
    </>
  );
}

export function ProducerProduction({ data, id, act, notify }) {
  const p = data.productions.find((x) => x.id === id);
  const [asset, setAsset] = useState({
    name: "",
    type: "Music",
    usedSeconds: "",
  });
  const [credit, setCredit] = useState("");
  if (!p)
    return (
      <div className="pa-card">
        <Empty>Production not found.</Empty>
      </div>
    );
  const open = p.requests.filter((r) => !r.done);
  return (
    <>
      <PageHead
        title={`${p.id} · ${p.title}`}
        sub={`${p.client} · release ${p.plan.start} to ${p.plan.end}. In production you upload agreements and the terms are extracted for a coordinator to confirm; here you type what the agreement says.`}
      />
      <div className="pa-grid2">
        <section className="pa-card">
          <h2>Open requests</h2>
          {open.length ? (
            <ul className="pa-feed">
              {open.map((r) => (
                <li key={r.id}>
                  <span>
                    {r.assetId} · {r.kind}
                  </span>
                  <small>
                    {r.note || "—"} · {displayName(data, r.by)}
                  </small>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Nothing is waiting on you.</Empty>
          )}
          <h2>Credits</h2>
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
          <form
            className="pa-comment-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (act(addCredit, p.id, credit).ok) {
                notify("Credit added to the end card.");
                setCredit("");
              }
            }}
          >
            <label>
              <span className="sr-only">Credit text</span>
              <input
                value={credit}
                onChange={(e) => setCredit(e.target.value)}
                placeholder="Credit text as it appears on the end card"
                maxLength={160}
              />
            </label>
            <button className="button secondary" disabled={!credit.trim()}>
              <Plus size={14} aria-hidden="true" /> Add credit
            </button>
          </form>
        </section>
        <form
          className="pa-card pa-form"
          onSubmit={(e) => {
            e.preventDefault();
            const r = act(addAsset, p.id, asset);
            if (r.ok) {
              notify(`${r.result} added to the cut.`);
              setAsset({ name: "", type: "Music", usedSeconds: "" });
            }
          }}
        >
          <h2>Add an asset to the cut</h2>
          <label>
            Name
            <input
              value={asset.name}
              onChange={(e) =>
                setAsset((a) => ({ ...a, name: e.target.value }))
              }
              maxLength={80}
            />
          </label>
          <div className="pa-form-grid">
            <label>
              Type
              <select
                value={asset.type}
                onChange={(e) =>
                  setAsset((a) => ({ ...a, type: e.target.value }))
                }
              >
                {TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label>
              Seconds used
              <input
                type="number"
                min="0"
                value={asset.usedSeconds}
                onChange={(e) =>
                  setAsset((a) => ({ ...a, usedSeconds: e.target.value }))
                }
              />
            </label>
          </div>
          <button className="button">
            <Plus size={16} aria-hidden="true" /> Add asset
          </button>
        </form>
      </div>
      <h2 className="pa-section-title">Assets in the cut</h2>
      {p.assets.map((a) => (
        <ProducerAsset
          key={a.id}
          p={p}
          a={a}
          act={act}
          notify={notify}
          wanted={open.filter((r) => r.assetId === a.id)}
        />
      ))}
    </>
  );
}

function ProducerAsset({ p, a, act, notify, wanted }) {
  const [secs, setSecs] = useState(String(a.usedSeconds));
  const [ag, setAg] = useState({
    ref: "",
    excerpt: "",
    territories: [],
    channels: [],
    start: p.plan.start,
    end: p.plan.end,
    maxSeconds: "",
    creditRequired: "",
  });
  const showSupply =
    !a.agreement ||
    wanted.some((r) =>
      ["Supply agreement", "Licence extension"].includes(r.kind),
    );
  return (
    <section className="pa-card" aria-labelledby={`a-${a.id}`}>
      <div className="pa-row between">
        <div>
          <h3 id={`a-${a.id}`}>
            {a.id} · {a.name}
          </h3>
          <p className="pa-hint">
            {a.type} ·{" "}
            {a.agreement
              ? `${a.agreement.ref}${a.agreement.confirmed ? " (confirmed by a coordinator)" : " (waiting for a coordinator to confirm)"}`
              : "no agreement supplied"}
          </p>
        </div>
        <div className="pa-row">
          {wanted.map((r) => (
            <Status key={r.id} value="open" label={r.kind} />
          ))}
          <button
            className="text-button"
            onClick={() => {
              if (act(removeAsset, p.id, a.id).ok)
                notify(`${a.id} removed from the cut.`);
            }}
          >
            <Trash2 size={14} aria-hidden="true" /> Remove from cut
          </button>
        </div>
      </div>
      <form
        className="pa-comment-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (act(editUse, p.id, a.id, secs).ok)
            notify(`${a.id} now uses ${secs} s.`);
        }}
      >
        <label>
          Seconds used in the cut
          <input
            type="number"
            min="0"
            value={secs}
            onChange={(e) => setSecs(e.target.value)}
          />
        </label>
        <button className="button secondary">Update edit</button>
      </form>
      {showSupply && (
        <form
          className="pa-form pa-supply"
          onSubmit={(e) => {
            e.preventDefault();
            if (act(supplyAgreement, p.id, a.id, ag).ok)
              notify(
                `Agreement for ${a.id} supplied. A coordinator will confirm the terms.`,
              );
          }}
        >
          <h4>Supply agreement</h4>
          <div className="pa-form-grid">
            <label>
              Agreement reference
              <input
                value={ag.ref}
                onChange={(e) => setAg((x) => ({ ...x, ref: e.target.value }))}
                placeholder="e.g. STK-5521"
                maxLength={40}
              />
            </label>
            <label>
              Maximum seconds (if stated)
              <input
                type="number"
                min="0"
                value={ag.maxSeconds}
                onChange={(e) =>
                  setAg((x) => ({ ...x, maxSeconds: e.target.value }))
                }
              />
            </label>
            <label>
              Licence start
              <input
                type="date"
                value={ag.start}
                onChange={(e) =>
                  setAg((x) => ({ ...x, start: e.target.value }))
                }
              />
            </label>
            <label>
              Licence end
              <input
                type="date"
                value={ag.end}
                onChange={(e) => setAg((x) => ({ ...x, end: e.target.value }))}
              />
            </label>
          </div>
          <fieldset className="pa-multi">
            <legend>Territories stated</legend>
            {[...Object.keys(REGIONS), ...TERRITORIES].map((t) => (
              <label key={t} className="check-label">
                <input
                  type="checkbox"
                  checked={ag.territories.includes(t)}
                  onChange={(e) =>
                    setAg((x) => ({
                      ...x,
                      territories: e.target.checked
                        ? [...x.territories, t]
                        : x.territories.filter((y) => y !== t),
                    }))
                  }
                />{" "}
                {t}
              </label>
            ))}
          </fieldset>
          <fieldset className="pa-multi">
            <legend>Channels stated</legend>
            {CHANNELS.map((c) => (
              <label key={c} className="check-label">
                <input
                  type="checkbox"
                  checked={ag.channels.includes(c)}
                  onChange={(e) =>
                    setAg((x) => ({
                      ...x,
                      channels: e.target.checked
                        ? [...x.channels, c]
                        : x.channels.filter((y) => y !== c),
                    }))
                  }
                />{" "}
                {c}
              </label>
            ))}
          </fieldset>
          <label>
            Required credit (if any)
            <input
              value={ag.creditRequired}
              onChange={(e) =>
                setAg((x) => ({ ...x, creditRequired: e.target.value }))
              }
              maxLength={160}
            />
          </label>
          <label>
            Permission wording (paste from the agreement)
            <textarea
              value={ag.excerpt}
              onChange={(e) =>
                setAg((x) => ({ ...x, excerpt: e.target.value }))
              }
              maxLength={1200}
            />
          </label>
          <button className="button">
            <Upload size={16} aria-hidden="true" /> Supply agreement (simulated)
          </button>
        </form>
      )}
    </section>
  );
}
