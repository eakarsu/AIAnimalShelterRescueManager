const test = require('node:test');
const assert = require('node:assert/strict');
const { assertTransition, scorePlacement, evaluatePlacements } = require('../domain/shelterWorkflow');

test('placement score rejects capacity and preserves reasons', () => {
  const result = scorePlacement({ animal: { medically_cleared: true }, home: { capacity_available: 0 } });
  assert.equal(result.eligible, false);
  assert.deepEqual(result.evidence, ['no_capacity']);
});

test('adoption transition requires managerial rationale', () => {
  assert.throws(() => assertTransition('approved', 'adopted', { role: 'staff', approvalNote: 'reviewed carefully' }), /Manager/);
  assert.throws(() => assertTransition('approved', 'adopted', { role: 'manager', approvalNote: 'short' }), /substantive/);
  assert.doesNotThrow(() => assertTransition('approved', 'adopted', { role: 'manager', approvalNote: 'Reviewed welfare and adopter evidence.' }));
});

test('reviewed outcomes produce reproducible quality metrics', () => {
  const rows = Array.from({ length: 10 }, (_, i) => ({ predictedEligible: i < 5, successfulOutcome: i < 4 }));
  const result = evaluatePlacements(rows);
  assert.equal(result.precision, 0.8);
  assert.equal(result.sampleSize, 10);
});
