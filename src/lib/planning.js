const BASE_COST_PER_KM = 430000;

export const roles = [
  'District Planner',
  'State Admin',
  'Field Survey Officer',
  'Review Authority',
];

export const terrainProfiles = {
  Plain: {
    multiplier: 1,
    risk: 22,
    routeType: 'Roadside underground duct with short aerial access spans',
    complexity: 'Low',
    approvals: ['Gram Panchayat NOC', 'PWD road cutting permission'],
    markers: ['Road crossing', 'Low risk trenching zone'],
  },
  Hilly: {
    multiplier: 1.38,
    risk: 66,
    routeType: 'Contour-aligned aerial fiber with reinforced pole sections',
    complexity: 'High',
    approvals: ['PWD corridor permission', 'Disaster resilience check', 'Field survey clearance'],
    markers: ['Slope protection', 'Pole access constraint'],
  },
  Forest: {
    multiplier: 1.52,
    risk: 76,
    routeType: 'Low-impact route along forest edge and existing public path',
    complexity: 'High',
    approvals: ['Forest clearance', 'District administration approval', 'Field verification'],
    markers: ['Forest boundary', 'Restricted access'],
  },
  Mixed: {
    multiplier: 1.24,
    risk: 50,
    routeType: 'Hybrid underground and aerial route using existing road alignment',
    complexity: 'Medium',
    approvals: ['Gram Panchayat NOC', 'PWD permission', 'Field verification'],
    markers: ['River crossing', 'Mixed terrain segment'],
  },
};

export const priorityProfiles = {
  'Cost Optimized': {
    lengthFactor: 1.05,
    costFactor: 0.93,
    timelineFactor: 1.14,
    aerialShare: 0.28,
  },
  'Fast Deployment': {
    lengthFactor: 1.16,
    costFactor: 1.16,
    timelineFactor: 0.78,
    aerialShare: 0.68,
  },
  Balanced: { lengthFactor: 1.1, costFactor: 1, timelineFactor: 1, aerialShare: 0.46 },
};

export const initialForm = {
  state: 'Maharashtra',
  district: 'Nashik',
  block: 'Dindori',
  gramPanchayat: 'Devgaon Gram Panchayat',
  village: 'Devgaon',
  distance: 8.5,
  terrain: 'Mixed',
  households: 1260,
  institutions: 7,
  priority: 'Balanced',
  roadAvailable: 'Yes',
  crossingRequired: 'Yes',
  forestClearance: 'No',
};

export const initialPlans = [
  {
    routeId: 'FRAI-MH-NSK-DVG-018',
    district: 'Nashik',
    block: 'Dindori',
    village: 'Devgaon',
    fiberLength: 12.1,
    estimatedCost: 7820000,
    status: 'Approved',
    riskScore: 58,
    feasibilityScore: 72,
    updatedOn: '28 May 2026',
  },
  {
    routeId: 'FRAI-MH-NDB-MLG-044',
    district: 'Nandurbar',
    block: 'Akkalkuwa',
    village: 'Molgi',
    fiberLength: 16.8,
    estimatedCost: 12150000,
    status: 'Field Verification Required',
    riskScore: 82,
    feasibilityScore: 56,
    updatedOn: '27 May 2026',
  },
  {
    routeId: 'FRAI-MH-GDC-MRM-027',
    district: 'Gadchiroli',
    block: 'Dhanora',
    village: 'Murumgaon',
    fiberLength: 9.6,
    estimatedCost: 6640000,
    status: 'Under Review',
    riskScore: 64,
    feasibilityScore: 68,
    updatedOn: '27 May 2026',
  },
  {
    routeId: 'FRAI-MH-PLG-ZAP-011',
    district: 'Palghar',
    block: 'Jawhar',
    village: 'Zap',
    fiberLength: 7.4,
    estimatedCost: 4380000,
    status: 'Draft',
    riskScore: 34,
    feasibilityScore: 84,
    updatedOn: '26 May 2026',
  },
];

export const initialSurveys = [
  {
    routeId: 'FRAI-MH-NDB-MLG-044',
    village: 'Molgi',
    officer: 'A. Pawara',
    status: 'Assigned',
    difficulty: 'High',
    remarks: 'Hill approach and forest-edge alignment require field validation.',
  },
  {
    routeId: 'FRAI-MH-GDC-MRM-027',
    village: 'Murumgaon',
    officer: 'S. Atram',
    status: 'In Progress',
    difficulty: 'Medium',
    remarks: 'River crossing photographs and road shoulder width pending.',
  },
  {
    routeId: 'FRAI-MH-NSK-DVG-018',
    village: 'Devgaon',
    officer: 'R. Patil',
    status: 'Completed',
    difficulty: 'Medium',
    remarks: 'Existing poles available near school road and Gram Panchayat office.',
  },
];

export const baseActivities = [
  'Admin approved route FRAI-MH-NSK-DVG-018 for Devgaon.',
  'Survey status updated for FRAI-MH-GDC-MRM-027 in Murumgaon.',
  'Plan submitted for review by Nashik district planning office.',
  'Route generated for Molgi village in Nandurbar district.',
];

export function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 }).format(value);
}

function statusClass(status) {
  const classes = {
    Draft: 'border-slate-300 bg-slate-100 text-slate-700',
    'Under Review': 'border-blue-200 bg-blue-50 text-blue-800',
    Approved: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    Rejected: 'border-red-200 bg-red-50 text-red-800',
    'Field Verification Required': 'border-amber-200 bg-amber-50 text-amber-800',
  };

  return classes[status] || classes.Draft;
}

export function riskLabel(score) {
  if (score >= 75) return 'High';
  if (score >= 50) return 'Medium';
  return 'Low';
}

function generateRouteId(form) {
  const state = form.state.slice(0, 2).toUpperCase();
  const district = form.district.slice(0, 3).toUpperCase();
  const village =
    form.village
      .replace(/[^a-z0-9]/gi, '')
      .slice(0, 3)
      .toUpperCase() || 'VLG';
  const checksum =
    (Math.abs(
      [...`${form.village}${form.block}${form.distance}`].reduce(
        (sum, char) => sum + char.charCodeAt(0),
        0,
      ),
    ) %
      900) +
    100;
  return `FRAI-${state}-${district}-${village}-${checksum}`;
}

export function generatePlan(form) {
  const terrain = terrainProfiles[form.terrain];
  const priority = priorityProfiles[form.priority];
  const distance = Math.max(Number(form.distance) || 0, 0.5);
  const households = Math.max(Number(form.households) || 0, 1);
  const institutions = Math.max(Number(form.institutions) || 0, 0);
  const roadPenalty = form.roadAvailable === 'Yes' ? 0 : 1.2;
  const crossingPenalty = form.crossingRequired === 'Yes' ? 0.9 : 0;
  const forestPenalty = form.forestClearance === 'Yes' ? 1.4 : 0;
  const localDistributionKm = households / 5600 + institutions * 0.04;
  const fiberLength = Number(
    (
      distance * terrain.multiplier * priority.lengthFactor +
      localDistributionKm +
      roadPenalty +
      crossingPenalty +
      forestPenalty
    ).toFixed(1),
  );
  const riskScore = Math.min(
    96,
    Math.round(
      terrain.risk +
        distance * 1.35 +
        (form.roadAvailable === 'No' ? 9 : 0) +
        (form.crossingRequired === 'Yes' ? 8 : 0) +
        (form.forestClearance === 'Yes' ? 14 : 0),
    ),
  );
  const coveredHouseholds = Math.round(
    households * (riskScore >= 75 ? 0.9 : riskScore >= 50 ? 0.95 : 0.98),
  );
  const institutionsCovered = Math.max(0, Math.round(institutions * (riskScore >= 75 ? 0.86 : 1)));
  const civilCost = Math.round(
    fiberLength * BASE_COST_PER_KM * terrain.multiplier * priority.costFactor,
  );
  const electronicsCost = Math.round(
    Math.max(220000, coveredHouseholds * 520 + institutionsCovered * 32000),
  );
  const approvalsCost = Math.round(
    fiberLength *
      (form.forestClearance === 'Yes' ? 72000 : form.crossingRequired === 'Yes' ? 52000 : 33000),
  );
  const contingency = Math.round(
    (civilCost + electronicsCost + approvalsCost) * (riskScore >= 75 ? 0.14 : 0.09),
  );
  const estimatedCost = civilCost + electronicsCost + approvalsCost + contingency;
  const feasibilityScore = Math.max(
    42,
    Math.round(
      96 -
        riskScore * 0.55 +
        (form.roadAvailable === 'Yes' ? 7 : 0) +
        (institutionsCovered > 4 ? 3 : 0),
    ),
  );
  const weeks = Math.max(
    4,
    Math.round((fiberLength * 0.75 + riskScore / 16) * priority.timelineFactor),
  );
  const aerialKm = Number((fiberLength * priority.aerialShare).toFixed(1));
  const ductKm = Number((fiberLength - aerialKm).toFixed(1));
  const requiredApprovals = [
    ...terrain.approvals,
    ...(form.crossingRequired === 'Yes' ? ['Road / river crossing permission'] : []),
    ...(form.forestClearance === 'Yes' ? ['Forest department clearance'] : []),
  ].filter((item, index, list) => list.indexOf(item) === index);

  return {
    routeId: generateRouteId(form),
    routeType: terrain.routeType,
    fiberLength,
    estimatedCost,
    civilCost,
    electronicsCost,
    approvalsCost,
    contingency,
    householdsCovered: coveredHouseholds,
    institutionsCovered,
    riskScore,
    feasibilityScore,
    complexity: riskScore >= 75 ? 'High' : riskScore >= 50 ? 'Medium' : terrain.complexity,
    timeline: `${weeks}-${weeks + 2} weeks`,
    aerialKm,
    ductKm,
    requiredApprovals,
    note: `Recommendation uses existing public corridors where available, with ${ductKm} km underground duct and ${aerialKm} km aerial fiber. Field teams should validate right-of-way, crossing conditions, and local distribution points before final DPR approval.`,
  };
}
