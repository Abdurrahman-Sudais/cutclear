"""AI review of agreement wording (AWS Lambda + Amazon Bedrock).

Scope: find restrictions written in an agreement's permission wording that the confirmed structured
fields do not capture (for example "excluding paid advertising"). Territory, channel, date, duration
and credit comparisons stay in check_rights.

Safeguards enforced in code:
  * Input minimisation: only the permission wording and the confirmed fields are sent. Production,
    client, people, fees and tenant identifiers are rejected.
  * Evidence-bound output: each suggestion must quote text found verbatim in the wording and use one
    of the allowed restriction kinds. Anything else is discarded; malformed output yields nothing.
  * Suggestions are pending until a coordinator adds the restriction or dismisses it with a reason.
    Nothing here clears rights or gives legal advice.

Environment: BEDROCK_MODEL_ID, GUARDRAIL_ID (optional), GUARDRAIL_VERSION (optional).
"""
import json
import os

PROMPT_VERSION = "2026-11-v1"
FORBIDDEN_KEYS = {"production", "client", "fee", "price", "licensor_contact", "email", "user", "tenant_id"}
KINDS = {"Excludes paid media", "Excludes television", "Excludes cinema", "Excludes social", "Territory restriction", "Duration limit", "Credit requirement", "Other restriction"}

SYSTEM = (
    "You help a rights coordinator. Read the permission wording and list restrictions it states that the "
    "structured fields do not already capture. Quote the exact words. Do not give legal advice or say "
    "whether use is cleared. Output ONLY JSON matching the schema."
)
SCHEMA = {"suggestions": [{"kind": "one of the allowed kinds", "quote": "exact text from wording", "explanation": "one sentence"}]}


def check_input(req):
    bad = FORBIDDEN_KEYS.intersection(req)
    if bad:
        raise ValueError(f"forbidden keys in model input: {sorted(bad)}")
    if not isinstance(req.get("wording"), str) or not isinstance(req.get("fields"), dict):
        raise ValueError("wording must be a string and fields an object")
    return {"wording": req["wording"], "fields": req["fields"], "allowed_kinds": sorted(KINDS)}


def build_prompt(payload):
    return f"Input: {json.dumps(payload, ensure_ascii=False)}\nSchema: {json.dumps(SCHEMA)}"


def validate(draft, payload, limit=5):
    items = draft.get("suggestions") if isinstance(draft, dict) else None
    if not isinstance(items, list):
        return [], ["output is not {suggestions: [...]}"]
    kept, rejected = [], []
    for s in items[:limit]:
        if not isinstance(s, dict) or s.get("kind") not in KINDS:
            rejected.append("unknown kind")
            continue
        quote, why = s.get("quote"), str(s.get("explanation", "")).strip()
        if not quote or quote not in payload["wording"]:
            rejected.append("quote not found in wording")
        elif not why or len(why) > 300:
            rejected.append("missing or overlong explanation")
        else:
            kept.append({"kind": s["kind"], "quote": quote, "explanation": why, "decision": "pending"})
    return kept, rejected


def lambda_handler(event, _context):  # pragma: no cover - needs AWS
    import boto3

    req = json.loads(event["body"]) if isinstance(event.get("body"), str) else event
    payload = check_input(req)
    params = {
        "modelId": os.environ["BEDROCK_MODEL_ID"],
        "system": [{"text": SYSTEM}],
        "messages": [{"role": "user", "content": [{"text": build_prompt(payload)}]}],
        "inferenceConfig": {"maxTokens": 600, "temperature": 0},
    }
    if os.environ.get("GUARDRAIL_ID"):
        params["guardrailConfig"] = {"guardrailIdentifier": os.environ["GUARDRAIL_ID"], "guardrailVersion": os.environ.get("GUARDRAIL_VERSION", "DRAFT")}
    text = boto3.client("bedrock-runtime").converse(**params)["output"]["message"]["content"][0]["text"]
    try:
        draft = json.loads(text)
    except json.JSONDecodeError:
        draft = None
    kept, rejected = validate(draft, payload)
    return {"suggestions": kept, "rejected": len(rejected), "model_id": params["modelId"], "prompt_version": PROMPT_VERSION}
