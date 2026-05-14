# Audit Apply Note — AIAnimalShelterRescueManager

## Audit recommendations (from batch_00.md)

Partial-build, 16 routes, 8 AI endpoints (`/adoption-listing`, `/behavior-analysis`, `/medical-summary`, `/social-media`, `/foster-communication`, `/donation-appeal`, `/match-animal`, `/compatibility-check`).

### Missing AI counterparts
- AI breed identification (from photo)
- AI health risk prediction (from behavioral/medical history)
- AI volunteer hour prediction (no-show rates)

### Missing non-AI features
- Microchip database integration
- GPS tracking collars
- Behavioral training tracking

### Custom feature suggestions
- Photo-based breed ID
- Adopter matching AI (already covered)
- Predictive return prevention
- Volunteer scheduling optimization
- Microchip & registry integration

## Implemented in this pass

Two new AI endpoints appended to `backend/routes/ai.js`:

1. `POST /api/ai/breed-id-from-description` — text-based breed ID (since photo upload pipeline not present). Returns primary breed, mix, health concerns, temperament, exercise/grooming needs, lifespan, care recommendations, plus an explicit disclaimer that visual ID is the gold standard.
2. `POST /api/ai/return-risk` — predicts adoption-return risk given an animal record + adopter profile object. Returns risk score, top risk factors, protective factors, recommended pre/post-adoption actions and training resources.

Both reuse the project's `callOpenRouter` from `services/ai.js` and the existing `aiRateLimiter` (20/hr/user). No new dependencies, no schema changes.

Files touched:
- `backend/routes/ai.js`

Syntax check: PASS.

## Backlog (not implemented)

| Item | Category | Reason |
|---|---|---|
| Photo-based breed ID | TOO-RISKY | Image upload + vision pipeline not present |
| AI health risk prediction (longitudinal) | NEEDS-PRODUCT-DECISION | Requires aggregated medical-history features |
| AI volunteer hour prediction (no-show) | TOO-RISKY | Needs historical attendance data + DB schema |
| Microchip database integration | NEEDS-CREDS | AKC / HomeAgain APIs |
| GPS tracking collars | NEEDS-CREDS | Vendor APIs |
| Behavioral training tracking | NEEDS-PRODUCT-DECISION | Schema for training sessions |

## Apply pass 3 (frontend)

Action: **LEFT-AS-IS**. The Vite/React frontend already has `frontend/src/pages/AIToolsPage.jsx` mounted at `/ai`, with cards for all 10 AI endpoints — including the two added in pass 2 (`/ai/breed-id-from-description` and `/ai/return-risk`). Auth uses `localStorage.getItem('token')` via the project's `api` client. No FE work needed.

## Apply pass 4 (mechanical backlog)

Action: **SKIPPED**. All remaining backlog items in this project are tagged TOO-RISKY (photo-based breed ID — needs vision pipeline; AI volunteer hour prediction — needs historical attendance data + schema), NEEDS-CREDS (microchip database integration; GPS tracking collars), or NEEDS-PRODUCT-DECISION (longitudinal AI health risk; behavioral training tracking schema). No MECHANICAL-only items remain after passes 2 and 3, so per the apply-pass-4 constraints (no risky changes, no credentials, no product decisions) nothing was added.

## Apply pass 5 (all backlog)

Action: **IMPLEMENTED** the four remaining backlog items, one per category.
File touched: `backend/routes/ai.js` (additive only).

1. `POST /api/ai/volunteer-no-show` — **MECHANICAL** AI no-show prediction.
   Reads existing `volunteer_schedules` history, computes a base rate, asks
   the LLM for risk score, drivers, and reminder cadence. 503 + `missing:
   OPENROUTER_API_KEY` when unset.
2. `POST /api/ai/longitudinal-health-risk` — **NEEDS-PRODUCT-DECISION**.
   Aggregates `medical_records` over a configurable lookback window.
   `// PRODUCT-DECISION:` default lookback = 365 days, capped at 1825.
3. `POST /api/ai/microchip-lookup` — **NEEDS-CREDS**.
   Documents env vars `MICROCHIP_API_KEY`, `MICROCHIP_API_URL`. Returns 503
   + `missing: MICROCHIP_API_KEY` when unset; 501 (adapter not wired) when
   the key is set.
4. `GET/POST /api/ai/training-sessions` — **TOO-RISKY-only-additive**.
   Lazily creates a new `training_sessions` table (`CREATE TABLE IF NOT
   EXISTS`); existing data untouched. Supports listing by animal and
   creating sessions with skills, goals, success rating.

Syntax: `node --check routes/ai.js` PASS. Smoke test: started backend on
port 3001 with seeded DB, logged in as admin, all new endpoints returned
expected JSON (training-sessions POST created row id=1; volunteer no-show
returned LLM JSON; microchip 503 with missing field).

Backlog still untouched: photo-based breed ID (vision pipeline needed),
GPS tracking collars (NEEDS-CREDS — out of scope), real-time microchip
vendor adapter (depends on chosen provider).
