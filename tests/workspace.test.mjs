import test from 'node:test';
import assert from 'node:assert/strict';
import { generatePlan, initialForm } from '../src/lib/planning.js';
import {
  loadWorkspace,
  saveWorkspace,
  summarize,
  newId,
  csvCell,
  plansToCsv,
  WORKSPACE_KEY,
} from '../src/lib/workspace.js';
const memory = (seed = {}) => {
  const data = new Map(Object.entries(seed));
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) };
};

test('first workspace labels all seed records as demonstrations', () => {
  const w = loadWorkspace(memory());
  assert.equal(w.plans.length, 4);
  assert.ok(w.plans.every((p) => p.isDemo));
  assert.equal(summarize(w.plans).length, 45.9);
  assert.equal(summarize(w.plans).budget, 30990000);
});
test('legacy saved routes migrate alongside sample routes without altering source', () => {
  const legacy = [
    {
      routeId: 'user-1',
      village: 'A',
      district: 'B',
      roadDistanceKm: 3,
      estimatedCost: 123,
      status: 'Draft',
    },
  ];
  const raw = JSON.stringify(legacy);
  const storage = memory({ 'fiberroute-ai.routePlans.v1': raw });
  const w = loadWorkspace(storage);
  assert.equal(w.plans.length, 5);
  assert.equal(w.plans[0].fiberLength, 3);
  assert.equal(w.plans[0].isDemo, false);
  assert.equal(storage.getItem('fiberroute-ai.routePlans.v1'), raw);
});
test('route decisions, survey observations and activity persist on reload', () => {
  const storage = memory();
  const w = loadWorkspace(storage);
  w.plans[0].status = 'Under Review';
  w.surveys[0].remarks = 'Bridge needs review';
  w.activities.push({ id: '1', text: 'Reviewed', date: null });
  saveWorkspace(storage, w);
  assert.deepEqual(loadWorkspace(storage), w);
});
test('malformed workspace is rejected without replacing stored content', () => {
  const storage = memory({ [WORKSPACE_KEY]: '{corrupt' });
  assert.throws(() => loadWorkspace(storage));
  assert.equal(storage.getItem(WORKSPACE_KEY), '{corrupt');
});
test('invalid stored plans do not reach rendering or exports', () => {
  const storage = memory({
    [WORKSPACE_KEY]: JSON.stringify({
      version: 2,
      plans: [{ routeId: 'x' }],
      surveys: [],
      activities: [],
    }),
  });
  assert.throws(() => loadWorkspace(storage));
});
test('a denied storage write surfaces the failure', () => {
  assert.throws(
    () =>
      saveWorkspace(
        {
          setItem() {
            throw new Error('Quota');
          },
        },
        {},
      ),
    /Quota/,
  );
});
test('empty portfolios have finite, zero totals', () => {
  assert.deepEqual(summarize([]), {
    count: 0,
    villages: 0,
    length: 0,
    budget: 0,
    approved: 0,
    pending: 0,
    highRisk: 0,
  });
});
test('district-qualified village totals do not merge unrelated villages', () => {
  const base = { village: 'Devgaon', fiberLength: 1, estimatedCost: 100, status: 'Draft' };
  assert.equal(
    summarize([
      { ...base, district: 'A' },
      { ...base, district: 'B' },
    ]).villages,
    2,
  );
});
test('cost components reconcile and high-risk contingency is applied', () => {
  for (const terrain of ['Plain', 'Mixed', 'Forest', 'Hilly']) {
    const p = generatePlan({ ...initialForm, terrain });
    assert.equal(
      p.estimatedCost,
      p.civilCost + p.electronicsCost + p.approvalsCost + p.contingency,
    );
    assert.equal(
      p.contingency,
      Math.round(
        (p.civilCost + p.electronicsCost + p.approvalsCost) * (p.riskScore >= 75 ? 0.14 : 0.09),
      ),
    );
  }
});
test('clearance constraints increase risk and estimated investment', () => {
  const base = generatePlan({ ...initialForm, crossingRequired: 'No', forestClearance: 'No' });
  const constrained = generatePlan({
    ...initialForm,
    crossingRequired: 'Yes',
    forestClearance: 'Yes',
  });
  assert.ok(constrained.riskScore > base.riskScore);
  assert.ok(constrained.estimatedCost > base.estimatedCost);
});
test('priorities produce ordered cost tradeoffs', () => {
  const low = generatePlan({ ...initialForm, priority: 'Cost Optimized' });
  const balanced = generatePlan(initialForm);
  const fast = generatePlan({ ...initialForm, priority: 'Fast Deployment' });
  assert.ok(low.estimatedCost < balanced.estimatedCost);
  assert.ok(balanced.estimatedCost < fast.estimatedCost);
});
test('CSV safely quotes user labels and prevents formula injection', () => {
  assert.equal(csvCell('=SUM(A1)'), '"\'=SUM(A1)"');
  assert.equal(csvCell('A,"B"'), '"A,""B"""');
  const csv = plansToCsv(loadWorkspace(memory()).plans);
  assert.equal(csv.split('\r\n').length, 5);
  assert.ok(csv.includes('"isDemo"'));
});

test('route identifiers are nonempty and unique', () => {
  const ids = Array.from({ length: 100 }, () => newId());
  assert.ok(ids.every((id) => typeof id === 'string' && id.length >= 32));
  assert.equal(new Set(ids).size, ids.length);
});
