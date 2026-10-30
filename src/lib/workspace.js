import { initialPlans, initialSurveys } from './planning.js';

export const WORKSPACE_KEY = 'fiberroute.workspace.v2';
const LEGACY_KEY = 'fiberroute-ai.routePlans.v1';
export const STATUSES = [
  'Draft',
  'Under Review',
  'Field Verification Required',
  'Approved',
  'Rejected',
];

export function isPlan(plan) {
  return (
    plan &&
    typeof plan.routeId === 'string' &&
    typeof plan.village === 'string' &&
    typeof plan.district === 'string' &&
    Number.isFinite(plan.estimatedCost) &&
    plan.estimatedCost >= 0 &&
    Number.isFinite(plan.fiberLength) &&
    plan.fiberLength >= 0
  );
}

export function loadWorkspace(storage) {
  const raw = storage.getItem(WORKSPACE_KEY);
  if (raw) {
    const parsed = JSON.parse(raw);
    if (
      parsed.version !== 2 ||
      !Array.isArray(parsed.plans) ||
      !parsed.plans.every(isPlan) ||
      !Array.isArray(parsed.surveys) ||
      !Array.isArray(parsed.activities)
    ) {
      throw new Error('Your saved workspace could not be read. The original data has been kept.');
    }
    return parsed;
  }
  const legacy = JSON.parse(storage.getItem(LEGACY_KEY) || '[]');
  if (!Array.isArray(legacy)) throw new Error('Previous route records could not be read.');
  const migrated = legacy.map((p) => ({
    ...p,
    fiberLength: p.roadDistanceKm ?? 0,
    estimatedCost: p.estimatedCost ?? 0,
    isDemo: false,
  }));
  if (!migrated.every(isPlan))
    throw new Error(
      'Previous route records contain invalid data. The original data has been kept.',
    );
  return {
    version: 2,
    plans: [
      ...migrated,
      ...initialPlans
        .filter((p) => !migrated.some((m) => m.routeId === p.routeId))
        .map((p) => ({ ...p, isDemo: true })),
    ],
    surveys: initialSurveys.map((s) => ({ ...s, isDemo: true })),
    activities: [
      { id: 'welcome', text: 'Your connectivity workspace is ready.', date: null, type: 'welcome' },
    ],
  };
}

export function saveWorkspace(storage, workspace) {
  storage.setItem(WORKSPACE_KEY, JSON.stringify(workspace));
}

export function summarize(plans) {
  return {
    count: plans.length,
    villages: new Set(plans.map((p) => `${p.district}:${p.village}`)).size,
    length: plans.reduce((s, p) => s + p.fiberLength, 0),
    budget: plans.reduce((s, p) => s + p.estimatedCost, 0),
    approved: plans.filter((p) => p.status === 'Approved').length,
    pending: plans.filter((p) => ['Under Review', 'Field Verification Required'].includes(p.status))
      .length,
    highRisk: plans.filter((p) => p.riskScore >= 75).length,
  };
}

export function compactCurrency(value) {
  if (value >= 1e7) return `₹${(value / 1e7).toFixed(2)} Cr`;
  if (value >= 1e5) return `₹${(value / 1e5).toFixed(2)} L`;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function csvCell(value) {
  let text = String(value ?? '');
  if (/^[=+@\-\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export function plansToCsv(plans) {
  const keys = [
    'routeId',
    'village',
    'district',
    'fiberLength',
    'estimatedCost',
    'status',
    'riskScore',
    'feasibilityScore',
    'isDemo',
  ];
  return [keys, ...plans.map((p) => keys.map((k) => p[k]))]
    .map((row) => row.map(csvCell).join(','))
    .join('\r\n');
}

export function downloadFile(content, filename, type = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function routeReport(plan) {
  return `FIBERROUTE AI · PLANNING REPORT\n${plan.routeId}\n\nVillage: ${plan.village}\nDistrict: ${plan.district}\nBlock: ${plan.block || 'Not specified'}\nStatus: ${plan.status}\nData: ${plan.isDemo ? 'Demonstration record' : 'User-created estimate'}\n\nEstimated fiber: ${plan.fiberLength} km\nEstimated project cost: ${compactCurrency(plan.estimatedCost)} (${plan.estimatedCost} INR)\nRisk score: ${plan.riskScore}/100\nFeasibility: ${plan.feasibilityScore}/100\nTimeline: ${plan.timeline || 'Not recorded'}\nRoute source: ${plan.roadRoute?.source || 'Planning assumptions; no surveyed geometry'}\n\nPLANNING INPUTS\nState: ${plan.state || 'Not recorded'}\nTerrain: ${plan.terrain || 'Not recorded'}\nPriority: ${plan.priority || 'Not recorded'}\nBaseline distance: ${plan.distance ?? plan.roadDistanceKm ?? 'Not recorded'} km\nHouseholds: ${plan.households ?? 'Not recorded'}\nPublic institutions: ${plan.institutions ?? 'Not recorded'}\nStart point (lat, lng): ${plan.startPoint ? `${plan.startPoint.lat}, ${plan.startPoint.lng}` : 'Not selected'}\nEnd point (lat, lng): ${plan.endPoint ? `${plan.endPoint.lat}, ${plan.endPoint.lng}` : 'Not selected'}\nNearby mapped infrastructure: ${plan.infrastructure?.summary ? JSON.stringify(plan.infrastructure.summary) : plan.nearbyInfrastructureCounts ? JSON.stringify(plan.nearbyInfrastructureCounts) : 'Not fetched'}\n\nCOST BREAKDOWN (INR)\nCivil works: ${plan.civilCost ?? 'Not recorded'}\nElectronics: ${plan.electronicsCost ?? 'Not recorded'}\nApprovals: ${plan.approvalsCost ?? 'Not recorded'}\nContingency: ${plan.contingency ?? 'Not recorded'}\n\nREQUIRED APPROVALS\n${(plan.requiredApprovals || ['Confirm with local authorities']).join('\n')}\n\n${plan.note || plan.recommendation || ''}\n\nMETHOD\nRule-based concept estimate, not an engineering design or a contractor quote. The planning model uses terrain, distance, household and institution coverage, deployment priority and clearance assumptions. Road routing is a vehicle-access proxy; it does not establish fiber right-of-way. Survey and validate all costs, routes and permissions before deployment.\n\nGenerated: ${new Date().toISOString()}\n`;
}

export function newId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
