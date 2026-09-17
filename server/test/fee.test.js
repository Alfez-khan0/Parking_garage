const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateFee } = require('../src/utils/fee');

test('rounds partial hours up and applies tiered rates', () => {
  const start = new Date('2026-01-01T10:00:00Z');
  assert.deepEqual(calculateFee(start, new Date('2026-01-01T10:30:00Z')), { durationMinutes: 30, billableHours: 1, fee: 50 });
  assert.deepEqual(calculateFee(start, new Date('2026-01-01T11:01:00Z')), { durationMinutes: 61, billableHours: 2, fee: 80 });
});

test('caps a long continuous stay', () => {
  const start = new Date('2026-01-01T10:00:00Z');
  assert.equal(calculateFee(start, new Date('2026-01-01T20:00:00Z')).fee, 250);
});
