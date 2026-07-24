const test = require('node:test');
const assert = require('node:assert/strict');

const { requestShelterOperationsReadiness } = require('../services/openrouterEvidence');

test('rejects a noncanonical OpenRouter base URL', async () => {
  const originalBase = process.env.OPENROUTER_BASE_URL;
  const originalKey = process.env.OPENROUTER_API_KEY;
  const originalModel = process.env.OPENROUTER_MODEL;
  process.env.OPENROUTER_BASE_URL = 'https://example.test/api/v1';
  process.env.OPENROUTER_API_KEY = 'unit-test-key';
  process.env.OPENROUTER_MODEL = 'unit-test-model';
  await assert.rejects(() => requestShelterOperationsReadiness('de-identified workflow'), /canonical OpenRouter endpoint/);
  process.env.OPENROUTER_BASE_URL = originalBase;
  process.env.OPENROUTER_API_KEY = originalKey;
  process.env.OPENROUTER_MODEL = originalModel;
});

test('returns substantive provider evidence', async () => {
  const originalBase = process.env.OPENROUTER_BASE_URL;
  const originalKey = process.env.OPENROUTER_API_KEY;
  const originalModel = process.env.OPENROUTER_MODEL;
  process.env.OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
  process.env.OPENROUTER_API_KEY = 'unit-test-key';
  process.env.OPENROUTER_MODEL = 'unit-test-model';
  const evidence = await requestShelterOperationsReadiness('de-identified workflow', async (url) => {
    assert.equal(url, 'https://openrouter.ai/api/v1/chat/completions');
    return {
      ok: true,
      json: async () => ({
        id: 'generation-unit-test',
        model: 'unit-test-model',
        choices: [{ message: { content: '{"controls":["retain source records","authorize workflow changes","require human welfare review"]}' } }],
      }),
    };
  });
  assert.equal(evidence.providerReceipt.requestId, 'generation-unit-test');
  assert.ok(evidence.result.length > 40);
  process.env.OPENROUTER_BASE_URL = originalBase;
  process.env.OPENROUTER_API_KEY = originalKey;
  process.env.OPENROUTER_MODEL = originalModel;
});
