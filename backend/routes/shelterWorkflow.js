const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { assertTransition, scorePlacement, evaluatePlacements } = require('../domain/shelterWorkflow');

const tenant = (user) => user.tenant_id;
const canWrite = (req, res, next) => ['staff', 'manager', 'admin'].includes(req.user.role)
  ? next() : res.status(403).json({ error: 'Staff role required' });

router.use(auth);
router.get('/cases', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM shelter_cases WHERE tenant_id=$1 ORDER BY updated_at DESC LIMIT 100', [tenant(req.user)]);
    res.json({ cases: result.rows });
  } catch (error) { next(error); }
});

router.post('/cases', canWrite, async (req, res, next) => {
  const { animalId, intakeSource, externalReference, provenance = {} } = req.body || {};
  if (!intakeSource || typeof provenance !== 'object' || Array.isArray(provenance)) {
    return res.status(400).json({ error: 'intakeSource and provenance object are required' });
  }
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO shelter_cases(tenant_id,animal_id,intake_source,external_reference,provenance,created_by)
       VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,
      [tenant(req.user), animalId || null, intakeSource, externalReference || null, provenance, req.user.id]
    );
    await client.query(
      `INSERT INTO shelter_case_events(tenant_id,case_id,actor_id,event_type,to_state,evidence)
       VALUES($1,$2,$3,'case_created','intake',$4)`,
      [tenant(req.user), result.rows[0].id, req.user.id, provenance]
    );
    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (error) { if (client) await client.query('ROLLBACK'); next(error); } finally { client?.release(); }
});

router.post('/cases/:id/transition', canWrite, async (req, res, next) => {
  const { to, approvalNote, evidence = {}, expectedVersion } = req.body || {};
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    const found = await client.query('SELECT * FROM shelter_cases WHERE id=$1 AND tenant_id=$2 FOR UPDATE', [req.params.id, tenant(req.user)]);
    if (!found.rows.length) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Case not found' }); }
    const current = found.rows[0];
    if (Number(expectedVersion) !== current.version) { await client.query('ROLLBACK'); return res.status(409).json({ error: 'Stale case version' }); }
    assertTransition(current.state, to, { role: req.user.role, approvalNote });
    const updated = await client.query(
      'UPDATE shelter_cases SET state=$1,version=version+1,updated_at=NOW() WHERE id=$2 RETURNING *', [to, current.id]
    );
    await client.query(
      `INSERT INTO shelter_case_events(tenant_id,case_id,actor_id,event_type,from_state,to_state,rationale,evidence)
       VALUES($1,$2,$3,'state_transition',$4,$5,$6,$7)`,
      [tenant(req.user), current.id, req.user.id, current.state, to, approvalNote || null, evidence]
    );
    await client.query('COMMIT');
    res.json(updated.rows[0]);
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    if (/Invalid transition|approval|required/.test(error.message)) return res.status(422).json({ error: error.message });
    next(error);
  } finally { client?.release(); }
});

router.post('/placement-score', canWrite, (req, res) => res.json(scorePlacement(req.body || {})));

router.post('/validation-runs', canWrite, async (req, res, next) => {
  if (!['manager', 'admin'].includes(req.user.role)) return res.status(403).json({ error: 'Manager role required' });
  try {
    const metrics = evaluatePlacements(req.body?.reviewedOutcomes);
    const result = await pool.query(
      'INSERT INTO shelter_validation_runs(tenant_id,created_by,cohort_reference,metrics,reviewed_outcome_count) VALUES($1,$2,$3,$4,$5) RETURNING *',
      [tenant(req.user), req.user.id, req.body?.cohortReference || 'unspecified', metrics, metrics.sampleSize]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) { if (/required|boolean/.test(error.message)) return res.status(400).json({ error: error.message }); next(error); }
});

router.post('/integrations/:provider/enqueue', canWrite, async (req, res, next) => {
  const providers = ['microchip', 'veterinary', 'messaging', 'payments', 'public_listing'];
  if (!providers.includes(req.params.provider)) return res.status(400).json({ error: 'Unsupported provider' });
  const { caseId, operation, payloadReference, idempotencyKey } = req.body || {};
  if (!operation || !payloadReference || !idempotencyKey) return res.status(400).json({ error: 'operation, payloadReference and idempotencyKey are required' });
  try {
    const result = await pool.query(
      `INSERT INTO shelter_integration_outbox(tenant_id,case_id,provider,operation,payload_reference,idempotency_key)
       VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(tenant_id,provider,idempotency_key) DO NOTHING RETURNING *`,
      [tenant(req.user), caseId || null, req.params.provider, operation, payloadReference, idempotencyKey]
    );
    if (result.rows.length) return res.status(202).json(result.rows[0]);
    const replay = await pool.query('SELECT * FROM shelter_integration_outbox WHERE tenant_id=$1 AND provider=$2 AND idempotency_key=$3', [tenant(req.user), req.params.provider, idempotencyKey]);
    const prior = replay.rows[0];
    if (prior.operation !== operation || prior.payload_reference !== payloadReference || String(prior.case_id || '') !== String(caseId || '')) {
      return res.status(409).json({ error: 'Idempotency key was already used for a different operation' });
    }
    res.status(200).json(prior);
  } catch (error) { next(error); }
});

module.exports = router;
