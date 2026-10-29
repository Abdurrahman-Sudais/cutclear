# Review safeguards

| Safeguard | Where in the prototype (`src/app/`) |
|---|---|
| Missing is unknown, not permitted | `check()` returns “Missing evidence” for no agreement, and “Unconfirmed terms” until a coordinator confirms the fields. Neither is ever “no gap”. |
| Explicit territory hierarchy | `covers()`: a region covers its children; a country never covers its region or siblings. |
| Everything the plan asks for is compared | Territories, channels, licence start and end (inclusive), seconds used, paid media, and required credits. |
| Obligations kept separate | A missing credit is “Obligation open”, not a permission gap. It still blocks sign-off until the credit is added. |
| AI is labelled, quoted and gated | `suggest()` flags restrictions written in the wording that the fields miss. A coordinator adds the restriction (which can create a gap) or dismisses it with a reason of at least 10 characters. Suggestions retire when the fields already capture them. |
| Decisions tied to a plan version | Changing the plan, an asset, an agreement or the credits clears decisions and reopens sign-off (`invalidate`). |
| Two-person sign-off | With the policy on, a second, different coordinator must sign off. |
| Need-to-know | Producers see their cut and their requests only. Admins see aggregates. Every action checks the role. |
| Not legal clearance | Stated in the UI, the reports, the FAQ and the Terms draft. |

## Tests

- `src/app/engine.test.js` and `backend/tests/test_lambdas.py` both run `backend/tests/fixtures/cases.json` (hierarchy, inclusive dates, duration limits, paid media, credits, multiple gaps, and the AI rule).
- `src/app/workflow.test.js`: the full loop of requests, producer fixes, confirmation, AI restriction, decisions, plan change, two-person sign-off and reopening, plus permissions and validation.
- `scripts/test-prototype.mjs`: all three roles through the UI in happy-dom, with persistence and reset.
- Still to do with real users: keyboard and screen-reader passes, and a pilot measuring gaps found before delivery rather than after.
