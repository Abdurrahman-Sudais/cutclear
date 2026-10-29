"""Run from the repository root: python3 backend/tests/test_lambdas.py (standard library only)."""
import importlib.util
import json
import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]


def load(name):
    spec = importlib.util.spec_from_file_location(name, ROOT / "backend" / "lambdas" / name / "handler.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


check_rights = load("check_rights")
suggest_restrictions = load("suggest_restrictions")
FX = json.loads((ROOT / "backend" / "tests" / "fixtures" / "cases.json").read_text())


class CheckRightsTest(unittest.TestCase):
    def test_shared_fixtures_match_prototype_engine(self):
        for c in FX["cases"]:
            with self.subTest(c["name"]):
                asset = {"usedSeconds": c.get("usedSeconds", 10), "agreement": None if c.get("noAgreement") else {**FX["agreement"], **c.get("agreement", {})}}
                out = check_rights.check(asset, {**FX["plan"], **c.get("plan", {})}, c.get("credits", []))
                self.assertEqual(out["status"], c["status"])
                self.assertEqual([f["kind"] for f in out["findings"]], c["kinds"])

    def test_suggestion_rule_fixtures(self):
        for s in FX["suggestions"]:
            self.assertEqual(check_rights.suggest({**FX["agreement"], **s["agreement"], "excerpt": s["excerpt"]}), s["labels"])

    def test_hierarchy_and_handler(self):
        self.assertTrue(check_rights.covers(["Europe"], "Ireland"))
        self.assertFalse(check_rights.covers(["United Kingdom"], "Europe"))
        out = check_rights.lambda_handler({"body": json.dumps({"asset": {"usedSeconds": 5, "agreement": FX["agreement"]}, "plan": FX["plan"]})}, None)
        self.assertEqual(out["status"], "No gap detected")


class SuggestRestrictionsTest(unittest.TestCase):
    payload = {"wording": "Licensed in Europe online and on television until 2029, excluding paid advertising.", "fields": {"channels": ["Online", "Television"], "paidMedia": None}}

    def test_rejects_identifying_input(self):
        with self.assertRaises(ValueError):
            suggest_restrictions.check_input({**self.payload, "client": "Lantern"})

    def test_keeps_only_quoted_allowed_kinds(self):
        p = suggest_restrictions.check_input(self.payload)
        draft = {"suggestions": [
            {"kind": "Excludes paid media", "quote": "excluding paid advertising", "explanation": "Paid placements are excluded."},
            {"kind": "Excludes paid media", "quote": "no paid social", "explanation": "Invented quote."},
            {"kind": "Cleared for release", "quote": "Licensed in Europe", "explanation": "Not an allowed kind."},
        ]}
        kept, rejected = suggest_restrictions.validate(draft, p)
        self.assertEqual([k["quote"] for k in kept], ["excluding paid advertising"])
        self.assertEqual(kept[0]["decision"], "pending")
        self.assertEqual(len(rejected), 2)

    def test_fails_closed(self):
        p = suggest_restrictions.check_input(self.payload)
        self.assertEqual(suggest_restrictions.validate(None, p)[0], [])
        self.assertEqual(suggest_restrictions.validate({"suggestions": 3}, p)[0], [])


if __name__ == "__main__":
    unittest.main()
