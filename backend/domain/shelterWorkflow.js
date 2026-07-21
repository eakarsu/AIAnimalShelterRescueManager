'use strict';

const transitions = Object.freeze({
  intake: ['assessed'],
  assessed: ['approved', 'quarantined'],
  quarantined: ['assessed'],
  approved: ['fostered', 'adopted'],
  fostered: ['approved', 'adopted'],
  adopted: ['follow_up'],
  follow_up: ['closed', 'approved'],
  closed: [],
});

const approvalStates = new Set(['approved', 'fostered', 'adopted', 'closed']);

function assertTransition(from, to, { role, approvalNote }) {
  if (!transitions[from]?.includes(to)) throw new Error(`Invalid transition: ${from} -> ${to}`);
  if (approvalStates.has(to) && !['manager', 'admin'].includes(role)) {
    throw new Error('Manager approval is required');
  }
  if (approvalStates.has(to) && (!approvalNote || approvalNote.trim().length < 10)) {
    throw new Error('A substantive approval note is required');
  }
}

function scorePlacement({ animal, home }) {
  const evidence = [];
  let score = 100;
  if (animal.requires_no_children && home.has_children) { score -= 60; evidence.push('child_safety_conflict'); }
  if (animal.requires_no_pets && home.has_pets) { score -= 45; evidence.push('resident_pet_conflict'); }
  if ((home.capacity_available ?? 0) < 1) { score -= 100; evidence.push('no_capacity'); }
  if (!animal.medically_cleared) { score -= 40; evidence.push('medical_clearance_missing'); }
  return { score: Math.max(0, score), evidence, eligible: score >= 60 && !evidence.includes('no_capacity') };
}

function evaluatePlacements(records) {
  if (!Array.isArray(records) || records.length < 10) throw new Error('At least 10 reviewed outcomes are required');
  let tp = 0, fp = 0, fn = 0;
  for (const row of records) {
    if (typeof row.predictedEligible !== 'boolean' || typeof row.successfulOutcome !== 'boolean') throw new Error('Outcomes must be reviewed booleans');
    if (row.predictedEligible && row.successfulOutcome) tp += 1;
    if (row.predictedEligible && !row.successfulOutcome) fp += 1;
    if (!row.predictedEligible && row.successfulOutcome) fn += 1;
  }
  return { sampleSize: records.length, precision: tp + fp ? tp / (tp + fp) : 0, recall: tp + fn ? tp / (tp + fn) : 0, falsePositiveRate: fp / records.length, evaluationVersion: 'placement-outcomes-1' };
}

module.exports = { transitions, assertTransition, scorePlacement, evaluatePlacements };
