const test = require('node:test');
const assert = require('node:assert/strict');
const Sizing = require('../app/sizing.js');

const DEFAULTS = {
  volumeGb: 1500,
  windowHours: 4,
  weekendHours: 72,
  races: 23,
  tunnelGbps: 1,
  tunnels: 2
};

function close(actual, expected, tolerance) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    'expected ' + actual + ' to be within ' + tolerance + ' of ' + expected
  );
}

test('average rate over a 72 h weekend is about 46.3 Mbps (1.5 TB = 12,000 Gb)', () => {
  close(Sizing.averageMbps(1500, 72), 46.3, 0.05);
});

test('burst rate over a 4 h window is about 0.833 Gbps', () => {
  close(Sizing.burstGbps(1500, 4), 0.833, 0.001);
});

test('annual volume for 23 races is 34.5 TB', () => {
  assert.equal(Sizing.annualTb(1500, 23), 34.5);
});

test('defaults: both tunnels up is OK, one tunnel down is tight at about 83%', () => {
  const result = Sizing.analyse(DEFAULTS);
  close(result.normal.utilization, 0.4167, 0.001);
  assert.equal(result.normal.verdict.level, 'ok');
  close(result.degraded.utilization, 0.8333, 0.001);
  assert.equal(result.degraded.verdict.level, 'tight');
});

test('verdict thresholds: 50% is OK, just above is tight, above 100% is not enough', () => {
  assert.equal(Sizing.verdict(0.5).level, 'ok');
  assert.equal(Sizing.verdict(0.51).level, 'tight');
  assert.equal(Sizing.verdict(1).level, 'tight');
  assert.equal(Sizing.verdict(1.01).level, 'insufficient');
});

test('a 3 Gbps tunnel with one tunnel down stays within the 50% guidance', () => {
  const result = Sizing.analyse(Object.assign({}, DEFAULTS, { tunnelGbps: 3 }));
  assert.equal(result.degraded.verdict.level, 'ok');
});

test('rejects zero, negative, and non-numeric inputs', () => {
  assert.throws(() => Sizing.averageMbps(0, 72), RangeError);
  assert.throws(() => Sizing.burstGbps(1500, -1), RangeError);
  assert.throws(() => Sizing.annualTb(1500, NaN), RangeError);
  assert.throws(() => Sizing.utilization(1, 1, 0), RangeError);
  assert.throws(() => Sizing.annualTb('1500', 23), RangeError);
});

test('fewer than 2 tunnels is rejected (needs two for the 99.99% design)', () => {
  assert.throws(() => Sizing.analyse(Object.assign({}, DEFAULTS, { tunnels: 1 })), RangeError);
});

const CAPACITY_DEFAULTS = {
  annualTb: 34.5,
  years: 10,
  growthPct: 10,
  dataReduction: 1,
  protectionPct: 25,
  headroomPct: 20,
  bufferPct: 20
};

test('capacity: cumulative data over 10 years at 10% growth is about 549.8 TB', () => {
  close(Sizing.cumulativeTb(34.5, 10, 10), 549.8, 0.1);
});

test('capacity: zero growth is simply years x annual intake', () => {
  assert.equal(Sizing.cumulativeTb(34.5, 10, 0), 345);
});

test('capacity: default range is about 651 / 825 / 1,343 TB usable (low / base / high)', () => {
  const range = Sizing.capacityRange(CAPACITY_DEFAULTS);
  close(range.low.usableTb, 650.9, 0.1);
  close(range.base.usableTb, 824.8, 0.1);
  close(range.high.usableTb, 1343.4, 0.1);
});

test('capacity: low is below base and base is below high', () => {
  const range = Sizing.capacityRange(CAPACITY_DEFAULTS);
  assert.ok(range.low.usableTb < range.base.usableTb);
  assert.ok(range.base.usableTb < range.high.usableTb);
});

test('capacity: a higher data-reduction ratio lowers the capacity needed', () => {
  const none = Sizing.capacityRange(CAPACITY_DEFAULTS).base.usableTb;
  const reduced = Sizing.capacityRange(Object.assign({}, CAPACITY_DEFAULTS, { dataReduction: 2 })).base.usableTb;
  close(reduced, none / 2, 0.001);
});

test('capacity: installed capacity adds the buffer on top of usable', () => {
  const base = Sizing.capacityRange(CAPACITY_DEFAULTS).base;
  close(base.installedTb, base.usableTb * 1.2, 0.001);
});

test('capacity: rejects zero data reduction, negative overheads, and non-numeric input', () => {
  assert.throws(() => Sizing.capacityRange(Object.assign({}, CAPACITY_DEFAULTS, { dataReduction: 0 })), RangeError);
  assert.throws(() => Sizing.capacityRange(Object.assign({}, CAPACITY_DEFAULTS, { protectionPct: -1 })), RangeError);
  assert.throws(() => Sizing.capacityRange(Object.assign({}, CAPACITY_DEFAULTS, { years: 'ten' })), RangeError);
  assert.throws(() => Sizing.capacityRange(Object.assign({}, CAPACITY_DEFAULTS, { bufferPct: -5 })), RangeError);
});
