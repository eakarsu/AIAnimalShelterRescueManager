const router = require('express').Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const { requestShelterOperationsReadiness } = require('../services/openrouterEvidence');

router.post('/shelter-operations-readiness', authMiddleware, async (req, res) => {
  const workflowSummary = typeof req.body?.workflowSummary === 'string' ? req.body.workflowSummary.trim() : '';
  if (workflowSummary.length < 10 || workflowSummary.length > 1000) {
    return res.status(400).json({ error: 'workflowSummary must contain 10-1000 characters' });
  }
  try {
    const evidence = await requestShelterOperationsReadiness(workflowSummary);
    const saved = await pool.query(
      `INSERT INTO shelter_ai_results(tenant_id,user_id,feature,input,provider_request_id,provider_model,result_text,provider_receipt)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id,created_at`,
      [req.user.tenant_id, req.user.id, 'shelter_operations_readiness', { workflowSummary }, evidence.providerReceipt.requestId, evidence.providerReceipt.model, evidence.result, evidence.providerReceipt],
    );
    return res.json({ analysisId: saved.rows[0].id, createdAt: saved.rows[0].created_at, ...evidence });
  } catch (error) {
    console.error('[runtime-ai] shelter operations readiness failed:', error.message);
    return res.status(502).json({ error: 'AI provider request failed' });
  }
});

module.exports = router;
