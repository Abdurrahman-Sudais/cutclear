"""Deterministic rights checks (AWS Lambda).

Same rules as the prototype engine (src/app/engine.js). Both are tested against
backend/tests/fixtures/cases.json so they cannot drift apart silently.

Input:  {"asset": {"usedSeconds", "agreement": {...} | null}, "plan": {...}, "credits": [...]}
Output: {"status", "findings": [{"kind", "detail"}]}

No AI is involved, and nothing here is legal clearance: it compares confirmed fields with a plan.
"""
import json
import re

REGIONS = {
    "Worldwide": ["Europe", "North America", "Asia Pacific"],
    "Europe": ["United Kingdom", "Ireland", "France", "Germany"],
    "North America": ["United States", "Canada"],
    "Asia Pacific": ["Australia", "Japan"],
}
PARENT = {kid: parent for parent, kids in REGIONS.items() for kid in kids}


def covers(licensed, territory):
    t = territory
    while t:
        if t in licensed:
            return True
        t = PARENT.get(t)
    return False


def normalise(text):
    return " ".join(re.sub(r"[^a-z0-9]+", " ", str(text or "").lower()).split())


def check(asset, plan, credits=()):
    findings = []

    def add(kind, detail):
        findings.append({"kind": kind, "detail": detail})

    a = asset.get("agreement")
    if not a:
        add("Missing evidence", "No supporting agreement supplied. Permission is unknown, not granted.")
        return {"status": "Missing evidence", "findings": findings}
    if not a.get("confirmed"):
        add("Unconfirmed terms", f"{a['ref']}: fields not confirmed by a person.")
        return {"status": "Unconfirmed terms", "findings": findings}
    missing_t = [t for t in plan["territories"] if not covers(a["territories"], t)]
    if missing_t:
        add("Territory gap", f"Plan also needs {', '.join(missing_t)}.")
    missing_c = [c for c in plan["channels"] if c not in a["channels"]]
    if missing_c:
        add("Channel gap", f"Plan also uses {', '.join(missing_c)}.")
    if a["start"] > plan["start"]:
        add("Starts late", f"{a['ref']} starts {a['start']}.")
    if plan["end"] > a["end"]:
        add("Date gap", f"{a['ref']} ends {a['end']}.")
    if a.get("maxSeconds") is not None and asset.get("usedSeconds", 0) > a["maxSeconds"]:
        add("Duration gap", f"Uses {asset['usedSeconds']} s of {a['maxSeconds']} s.")
    if plan.get("paidMedia") and a.get("paidMedia") is False:
        add("Paid media not permitted", f"{a['ref']} excludes paid media.")
    credit = a.get("creditRequired")
    if credit and not any(normalise(c) == normalise(credit) for c in credits):
        add("Credit obligation open", f"Requires this credit: {credit}")
    gaps = [f for f in findings if f["kind"] != "Credit obligation open"]
    status = "Gaps found" if gaps else "Obligation open" if findings else "No gap detected"
    return {"status": status, "findings": findings}


RESTRICTIONS = [
    ("paid advertising", "paidMedia", False, "Excludes paid media"),
    ("paid media", "paidMedia", False, "Excludes paid media"),
    ("not for broadcast", "channel", "Television", "Excludes television"),
    ("no television", "channel", "Television", "Excludes television"),
]


def suggest(agreement):
    """Deterministic stand-in used by the prototype; production uses suggest_restrictions (Bedrock)."""
    text = f" {normalise(agreement.get('excerpt'))} "
    out = []
    for phrase, field, value, label in RESTRICTIONS:
        if f" {normalise(phrase)} " not in text or label in out:
            continue
        uncaptured = agreement.get("paidMedia") is not False if field == "paidMedia" else value in agreement.get("channels", [])
        if uncaptured:
            out.append(label)
    return out


def lambda_handler(event, _context):
    body = json.loads(event["body"]) if isinstance(event.get("body"), str) else event
    return check(body["asset"], body["plan"], body.get("credits", []))
