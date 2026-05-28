import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileText,
  Gauge,
  IndianRupee,
  Layers3,
  ListChecks,
  LockKeyhole,
  MapPinned,
  Milestone,
  RadioTower,
  Route,
  Send,
  ShieldCheck,
  TableProperties,
  Users,
} from 'lucide-react';
import './styles.css';

const BASE_COST_PER_KM = 430000;

const roles = ['District Planner', 'State Admin', 'Field Survey Officer', 'Review Authority'];

const terrainProfiles = {
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

const priorityProfiles = {
  'Cost Optimized': { lengthFactor: 1.05, costFactor: 0.93, timelineFactor: 1.14, aerialShare: 0.28 },
  'Fast Deployment': { lengthFactor: 1.16, costFactor: 1.16, timelineFactor: 0.78, aerialShare: 0.68 },
  Balanced: { lengthFactor: 1.1, costFactor: 1, timelineFactor: 1, aerialShare: 0.46 },
};

const initialForm = {
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

const initialPlans = [
  { routeId: 'FRAI-MH-NSK-018', district: 'Nashik', block: 'Dindori', village: 'Devgaon', fiberLength: 12.1, estimatedCost: 7820000, status: 'Approved', riskScore: 58, feasibilityScore: 72, updatedOn: '28 May 2026' },
  { routeId: 'FRAI-MP-MDL-044', district: 'Mandla', block: 'Bichhiya', village: 'Bijadandi', fiberLength: 16.8, estimatedCost: 12150000, status: 'Field Verification Required', riskScore: 82, feasibilityScore: 56, updatedOn: '27 May 2026' },
  { routeId: 'FRAI-OD-KLD-027', district: 'Kalahandi', block: 'Thuamul Rampur', village: 'Thuamul', fiberLength: 9.6, estimatedCost: 6640000, status: 'Under Review', riskScore: 64, feasibilityScore: 68, updatedOn: '27 May 2026' },
  { routeId: 'FRAI-RJ-BMR-011', district: 'Barmer', block: 'Chohtan', village: 'Chohtan', fiberLength: 7.4, estimatedCost: 4380000, status: 'Draft', riskScore: 34, feasibilityScore: 84, updatedOn: '26 May 2026' },
];

const initialSurveys = [
  { routeId: 'FRAI-MP-MDL-044', village: 'Bijadandi', officer: 'A. Verma', status: 'Assigned', difficulty: 'High', remarks: 'Forest edge alignment to be validated.' },
  { routeId: 'FRAI-OD-KLD-027', village: 'Thuamul', officer: 'S. Pradhan', status: 'In Progress', difficulty: 'Medium', remarks: 'River crossing photographs pending.' },
  { routeId: 'FRAI-MH-NSK-018', village: 'Devgaon', officer: 'R. Patil', status: 'Completed', difficulty: 'Medium', remarks: 'Existing poles available near school road.' },
];

const baseActivities = [
  'Admin approved route FRAI-MH-NSK-018 for Devgaon.',
  'Survey status updated for FRAI-OD-KLD-027.',
  'Plan submitted for review by Nashik district office.',
  'Route generated for Bijadandi village.',
];

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value) {
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

function riskLabel(score) {
  if (score >= 75) return 'High';
  if (score >= 50) return 'Medium';
  return 'Low';
}

function generateRouteId(form) {
  const state = form.state.slice(0, 2).toUpperCase();
  const district = form.district.slice(0, 3).toUpperCase();
  const village = form.village.replace(/[^a-z0-9]/gi, '').slice(0, 3).toUpperCase() || 'VLG';
  const checksum = Math.abs([...`${form.village}${form.block}${form.distance}`].reduce((sum, char) => sum + char.charCodeAt(0), 0)) % 900 + 100;
  return `FRAI-${state}-${district}-${village}-${checksum}`;
}

function generatePlan(form) {
  const terrain = terrainProfiles[form.terrain];
  const priority = priorityProfiles[form.priority];
  const distance = Math.max(Number(form.distance) || 0, 0.5);
  const households = Math.max(Number(form.households) || 0, 1);
  const institutions = Math.max(Number(form.institutions) || 0, 0);
  const roadPenalty = form.roadAvailable === 'Yes' ? 0 : 1.2;
  const crossingPenalty = form.crossingRequired === 'Yes' ? 0.9 : 0;
  const forestPenalty = form.forestClearance === 'Yes' ? 1.4 : 0;
  const localDistributionKm = households / 5600 + institutions * 0.04;
  const fiberLength = Number((distance * terrain.multiplier * priority.lengthFactor + localDistributionKm + roadPenalty + crossingPenalty + forestPenalty).toFixed(1));
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
  const coveredHouseholds = Math.round(households * (riskScore >= 75 ? 0.9 : riskScore >= 50 ? 0.95 : 0.98));
  const institutionsCovered = Math.max(0, Math.round(institutions * (riskScore >= 75 ? 0.86 : 1)));
  const civilCost = Math.round(fiberLength * BASE_COST_PER_KM * terrain.multiplier * priority.costFactor);
  const electronicsCost = Math.round(Math.max(220000, coveredHouseholds * 520 + institutionsCovered * 32000));
  const approvalsCost = Math.round(fiberLength * (form.forestClearance === 'Yes' ? 72000 : form.crossingRequired === 'Yes' ? 52000 : 33000));
  const contingency = Math.round((civilCost + electronicsCost + approvalsCost) * (riskScore >= 75 ? 0.14 : 0.09));
  const estimatedCost = civilCost + electronicsCost + approvalsCost + contingency;
  const feasibilityScore = Math.max(42, Math.round(96 - riskScore * 0.55 + (form.roadAvailable === 'Yes' ? 7 : 0) + (institutionsCovered > 4 ? 3 : 0)));
  const weeks = Math.max(4, Math.round((fiberLength * 0.75 + riskScore / 16) * priority.timelineFactor));
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

function LoginPage({ onLogin }) {
  const [role, setRole] = useState('District Planner');
  const [email, setEmail] = useState('district.planner@gov.in');
  const [password, setPassword] = useState('password');

  const submitLogin = (event) => {
    event.preventDefault();
    onLogin({ role, email });
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-100 text-slate-900">
      <TopStrip />
      <header className="border-b border-slate-300 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center border border-slate-300 bg-gov-navy text-white">
              <RadioTower size={28} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-gov-saffron">Digital Connectivity Planning System</p>
              <h1 className="text-2xl font-bold text-gov-navy">FiberRoute AI</h1>
              <p className="text-sm text-slate-600">Rural FiberNet Planning & Monitoring Portal</p>
            </div>
          </div>
          <div className="border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
            Government Planning Access
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-7xl min-w-0 gap-6 overflow-x-hidden px-4 py-8 sm:px-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)]">
        <section className="min-w-0 overflow-hidden border border-slate-300 bg-white p-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-gov-green">Secure portal access</p>
          <h2 className="mt-2 text-3xl font-bold text-gov-navy">Rural connectivity planning portal</h2>
          <p className="mt-4 max-w-2xl leading-7 text-slate-600">
            Authorized access for route planning, review, field verification, and monitoring under the Rural FiberNet Planning & Monitoring Portal.
          </p>
          <div className="mt-8 grid min-w-0 gap-3 sm:grid-cols-2">
            {roles.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setRole(item)}
                className={`border p-4 text-left transition ${role === item ? 'border-gov-navy bg-blue-50 ring-2 ring-blue-100' : 'border-slate-300 bg-white hover:bg-slate-50'}`}
              >
                <p className="font-semibold text-gov-navy">{item}</p>
                <p className="mt-1 text-sm text-slate-600">{roleDescription(item)}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="min-w-0 overflow-hidden border border-slate-300 bg-white p-6">
          <div className="mb-6 flex items-center gap-3 border-b border-slate-200 pb-4">
            <div className="flex h-10 w-10 items-center justify-center bg-gov-navy text-white">
              <LockKeyhole size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-gov-navy">Portal Login</h2>
              <p className="text-sm text-slate-600">Authorized access for route planning, review, and monitoring.</p>
            </div>
          </div>
          <form onSubmit={submitLogin} className="grid gap-4">
            <label className="field-label">
              Official Email / User ID
              <input className="input" value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label className="field-label">
              Password
              <input className="input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
            <label className="field-label">
              Role
              <select className="input" value={role} onChange={(event) => setRole(event.target.value)}>
                {roles.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <button className="mt-2 inline-flex items-center justify-center gap-2 bg-gov-navy px-5 py-3 font-semibold text-white transition hover:bg-blue-950">
              <ShieldCheck size={18} />
              Login to Dashboard
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}

function roleDescription(role) {
  const descriptions = {
    'District Planner': 'Create village plans and submit routes for review.',
    'State Admin': 'Monitor districts, budgets, and approval decisions.',
    'Field Survey Officer': 'Update field survey status and terrain remarks.',
    'Review Authority': 'Review feasibility, cost, risk, and approvals.',
  };
  return descriptions[role];
}

function TopStrip() {
  return (
    <div>
      <div className="grid h-1 grid-cols-3">
        <span className="bg-gov-saffron" />
        <span className="bg-white" />
        <span className="bg-gov-green" />
      </div>
      <div className="border-b border-slate-300 bg-gov-navy text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-5 py-2 text-xs sm:flex-row sm:items-center sm:justify-between">
          <span>Government of India | BharatNet Last-Mile Planning Cell</span>
          <span>Digital Connectivity Planning System</span>
        </div>
      </div>
    </div>
  );
}

function PortalHeader({ session, onLogout }) {
  return (
    <header className="w-full max-w-full border-b border-slate-300 bg-white">
      <div className="flex min-w-0 flex-col gap-4 px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center border border-slate-300 bg-gov-navy text-white">
            <Route size={25} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-gov-saffron">Digital Connectivity Planning System</p>
            <h1 className="break-words text-2xl font-bold text-gov-navy">FiberRoute AI Control Panel</h1>
            <p className="text-sm text-slate-600">Rural FiberNet Planning & Monitoring Portal</p>
          </div>
        </div>
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="min-w-0 border border-slate-300 bg-slate-50 px-4 py-2 text-sm">
            <span className="font-semibold text-gov-navy">{session.role}</span>
            <span className="break-all text-slate-500"> | {session.email}</span>
          </div>
          <button onClick={onLogout} className="border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Logout
          </button>
        </div>
      </div>
      <div className="border-t border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-600 lg:px-6">
        <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <span>Operational module: route planning, field verification, review, and monitoring</span>
          <span>System status: Online | Planning data source: Department planning records</span>
        </div>
      </div>
    </header>
  );
}

function OperationalSidebar({ role, plan }) {
  const items = [
    ['Dashboard', 'dashboard', FileText],
    ['Planning Form', 'route-planning', MapPinned],
    ['GIS Map Panel', 'gis-preview', Layers3],
    ['Route Output', 'route-output', Gauge],
    ['Plans Table', 'plans-table', TableProperties],
    ['Activity Feed', 'activity-feed', Milestone],
    ['Report Download', 'report-download', Download],
  ];

  return (
    <aside className="w-full max-w-full overflow-hidden border-b border-slate-300 bg-white lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r xl:w-72">
      <div className="min-w-0 border-b border-slate-200 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gov-saffron">Logged-in role</p>
        <p className="mt-1 font-bold text-gov-navy">{role}</p>
        <p className="mt-2 break-words text-xs leading-5 text-slate-600">Current route file: <span className="font-semibold">{plan.routeId}</span></p>
      </div>
      <nav className="grid grid-cols-1 gap-1 p-3 text-sm font-semibold sm:grid-cols-2 lg:grid-cols-1">
        {items.map(([label, id, Icon]) => (
          <a key={id} href={`#${id}`} className="flex min-w-0 items-center gap-2 border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 hover:border-gov-blue hover:bg-white hover:text-gov-navy">
            <Icon size={16} />
            <span className="truncate">{label}</span>
          </a>
        ))}
      </nav>
      <div className="hidden border-t border-slate-200 p-4 text-xs leading-5 text-slate-600 lg:block">
        <p className="font-semibold uppercase tracking-wide text-gov-navy">Operational Scope</p>
        <p className="mt-2">Route planning, field verification, review workflow, and monitoring records.</p>
      </div>
    </aside>
  );
}

function DashboardCard({ icon: Icon, label, value, helper, accent = 'blue' }) {
  const accents = {
    blue: 'border-l-gov-blue text-gov-blue',
    green: 'border-l-gov-green text-gov-green',
    saffron: 'border-l-gov-saffron text-gov-saffron',
    red: 'border-l-red-600 text-red-700',
  };

  return (
    <div className={`min-w-0 max-w-full overflow-hidden border border-slate-300 border-l-4 bg-white p-4 ${accents[accent]}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-600">{label}</p>
          <p className="mt-2 break-words text-xl font-bold text-gov-navy 2xl:text-2xl">{value}</p>
          {helper ? <p className="mt-1 text-xs font-medium text-slate-500">{helper}</p> : null}
        </div>
        <Icon size={24} />
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  return <span className={`inline-flex border px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${statusClass(status)}`}>{status}</span>;
}

function PortalDashboard() {
  const [session, setSession] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [plan, setPlan] = useState(() => generatePlan(initialForm));
  const [plans, setPlans] = useState(initialPlans);
  const [surveys, setSurveys] = useState(initialSurveys);
  const [activities, setActivities] = useState(baseActivities);

  const metrics = useMemo(() => {
    const allPlans = plans;
    return {
      totalRoutePlans: allPlans.length,
      villagesCovered: new Set(allPlans.map((item) => item.village)).size,
      fiberLength: allPlans.reduce((sum, item) => sum + item.fiberLength, 0),
      budget: allPlans.reduce((sum, item) => sum + item.estimatedCost, 0),
      highRisk: allPlans.filter((item) => item.riskScore >= 75).length,
      pendingReviews: allPlans.filter((item) => item.status === 'Under Review' || item.status === 'Field Verification Required').length,
      approved: allPlans.filter((item) => item.status === 'Approved').length,
      averageFeasibility: Math.round(allPlans.reduce((sum, item) => sum + (item.feasibilityScore || 70), 0) / allPlans.length),
    };
  }, [plans]);

  if (!session) return <LoginPage onLogin={setSession} />;

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const generateRoute = (event) => {
    event.preventDefault();
    const nextPlan = generatePlan(form);
    setPlan(nextPlan);
    setPlans((current) => {
      const existingIndex = current.findIndex((item) => item.routeId === nextPlan.routeId);
      const record = {
        routeId: nextPlan.routeId,
        district: form.district,
        block: form.block,
        village: form.village,
        fiberLength: nextPlan.fiberLength,
        estimatedCost: nextPlan.estimatedCost,
        status: 'Draft',
        riskScore: nextPlan.riskScore,
        feasibilityScore: nextPlan.feasibilityScore,
        updatedOn: 'Today',
      };
      if (existingIndex >= 0) {
        return current.map((item, index) => (index === existingIndex ? record : item));
      }
      return [record, ...current];
    });
    setActivities((current) => [`Route generated for ${form.village} village (${nextPlan.routeId}).`, ...current.slice(0, 5)]);
  };

  const updatePlanStatus = (routeId, status) => {
    setPlans((current) => current.map((item) => (item.routeId === routeId ? { ...item, status } : item)));
    setActivities((current) => [`${status} status updated for ${routeId}.`, ...current.slice(0, 5)]);
  };

  const submitPlan = () => {
    updatePlanStatus(plan.routeId, 'Under Review');
    setActivities((current) => [`Plan submitted for review: ${plan.routeId}.`, ...current.slice(0, 5)]);
  };

  const updateSurvey = (routeId, field, value) => {
    setSurveys((current) => current.map((item) => (item.routeId === routeId ? { ...item, [field]: value } : item)));
    setActivities((current) => [`Survey ${field} updated for ${routeId}.`, ...current.slice(0, 5)]);
  };

  const downloadReport = () => {
    const report = buildReport(form, plan);
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${plan.routeId.toLowerCase()}-planning-report.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-100 text-slate-900">
      <TopStrip />
      <PortalHeader session={session} onLogout={() => setSession(null)} />
      <div className="w-full max-w-full min-w-0 overflow-x-hidden lg:flex">
        <OperationalSidebar role={session.role} plan={plan} />
        <main className="min-w-0 max-w-full flex-1 basis-0 overflow-x-hidden px-4 py-5 lg:px-6">
          <section id="dashboard" className="mb-5 min-w-0 overflow-hidden border border-slate-300 bg-white p-4">
            <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-gov-green">Operational Dashboard</p>
                <h2 className="mt-1 text-2xl font-bold text-gov-navy">{session.role} Workspace</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{roleDescription(session.role)}</p>
              </div>
              <div className="grid min-w-0 gap-2 text-sm sm:grid-cols-2 lg:text-right">
                <div className="min-w-0 border border-slate-300 bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Current route file</p>
                  <p className="break-words font-bold text-gov-navy">{plan.routeId}</p>
                </div>
                <div className="min-w-0 border border-slate-300 bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Planning district</p>
                  <p className="break-words font-bold text-gov-navy">{form.district}, {form.state}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3">
            <DashboardCard icon={FileText} label="Total Route Plans" value={metrics.totalRoutePlans} helper={`${metrics.approved} approved`} accent="blue" />
            <DashboardCard icon={Users} label="Villages Covered" value={metrics.villagesCovered} helper="unique villages" accent="green" />
            <DashboardCard icon={Route} label="Fiber Length" value={`${formatNumber(metrics.fiberLength)} km`} helper="planned network" accent="blue" />
            <DashboardCard icon={IndianRupee} label="Estimated Budget" value={formatCurrency(metrics.budget)} helper="all records" accent="saffron" />
            <DashboardCard icon={AlertTriangle} label="High Risk Routes" value={metrics.highRisk} helper="risk >= 75" accent="red" />
            <DashboardCard icon={Gauge} label="Avg. Feasibility" value={`${metrics.averageFeasibility}/100`} helper={`${metrics.pendingReviews} pending review`} accent="green" />
          </section>

          <RolePanel
            role={session.role}
            form={form}
            plan={plan}
            plans={plans}
            surveys={surveys}
            activities={activities}
            updateField={updateField}
            generateRoute={generateRoute}
            submitPlan={submitPlan}
            updatePlanStatus={updatePlanStatus}
            updateSurvey={updateSurvey}
            downloadReport={downloadReport}
          />
          <footer className="mt-6 border-t border-slate-300 bg-white px-5 py-4 text-center text-sm text-slate-600">
            FiberRoute AI | Rural FiberNet Planning & Monitoring Portal
          </footer>
        </main>
      </div>
    </div>
  );
}

function RolePanel(props) {
  const { role } = props;

  if (role === 'State Admin') {
    return (
      <PortalGrid>
        <RoleBrief role={role} items={['Monitor district plan submissions', 'Check high-risk route concentration', 'Approve or reject routes for administrative processing']} />
        <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.82fr)]">
          <RecentActivity activities={props.activities} />
          <ReportDownloadPanel plan={props.plan} form={props.form} onDownload={props.downloadReport} />
        </div>
        <PlansTable plans={props.plans} onStatus={props.updatePlanStatus} title="District Submitted Plans" canApprove />
        <ReviewTable plans={props.plans} onStatus={props.updatePlanStatus} />
      </PortalGrid>
    );
  }

  if (role === 'Field Survey Officer') {
    return (
      <PortalGrid>
        <RoleBrief role={role} items={['Open assigned survey routes', 'Update terrain difficulty and site remarks', 'Flag routes that need verification before DPR approval']} />
        <SurveyTable surveys={props.surveys} onUpdate={props.updateSurvey} />
        <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.65fr)]">
          <GISPreview form={props.form} plan={props.plan} />
          <RecentActivity activities={props.activities} />
        </div>
      </PortalGrid>
    );
  }

  if (role === 'Review Authority') {
    return (
      <PortalGrid>
        <RoleBrief role={role} items={['Review current route estimate', 'Check cost, risk, approvals, and feasibility', 'Approve, send back, or mark for field verification']} />
        <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.72fr)]">
          <RouteOutput plan={props.plan} form={props.form} onSubmit={props.submitPlan} onDownload={props.downloadReport} reviewMode />
          <ReportDownloadPanel plan={props.plan} form={props.form} onDownload={props.downloadReport} />
        </div>
        <ReviewTable plans={props.plans} onStatus={props.updatePlanStatus} />
        <GISPreview form={props.form} plan={props.plan} />
      </PortalGrid>
    );
  }

  return (
    <PortalGrid>
      <RoleBrief role={role} items={['Create village route plan', 'Generate route output and planning report', 'Submit plan for review by state or authority']} />
      <PlannerForm form={props.form} updateField={props.updateField} onGenerate={props.generateRoute} onSubmit={props.submitPlan} />
      <GISPreview form={props.form} plan={props.plan} />
      <RouteOutput plan={props.plan} form={props.form} onSubmit={props.submitPlan} onDownload={props.downloadReport} />
      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.68fr)]">
        <PlansTable plans={props.plans} onStatus={props.updatePlanStatus} title="Village Route Plans" />
        <div className="grid min-w-0 gap-5">
          <RecentActivity activities={props.activities} />
          <ReportDownloadPanel plan={props.plan} form={props.form} onDownload={props.downloadReport} />
        </div>
      </div>
    </PortalGrid>
  );
}

function PortalGrid({ children }) {
  return <div className="mt-5 grid min-w-0 gap-5">{children}</div>;
}

function RoleBrief({ role, items }) {
  return (
    <section className="min-w-0 max-w-full overflow-hidden border border-slate-300 bg-white p-4">
      <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gov-saffron">Role-based access view</p>
          <h3 className="text-lg font-bold text-gov-navy">{role} Responsibilities</h3>
        </div>
        <div className="grid min-w-0 gap-2 md:grid-cols-3">
          {items.map((item) => (
            <div key={item} className="min-w-0 break-words border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionCard({ id, icon: Icon, eyebrow, title, children, action, description }) {
  return (
    <section id={id} className="min-w-0 max-w-full overflow-hidden border border-slate-300 bg-white">
      <div className="flex min-w-0 flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-slate-100 text-gov-navy">
            <Icon size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-gov-green">{eyebrow}</p>
            <h3 className="break-words text-lg font-bold text-gov-navy">{title}</h3>
            {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
          </div>
        </div>
        {action}
      </div>
      <div className="min-w-0 p-4 sm:p-5">{children}</div>
    </section>
  );
}

function PlannerForm({ form, updateField, onGenerate, onSubmit }) {
  return (
    <SectionCard
      id="route-planning"
      icon={MapPinned}
      eyebrow="District Planning Module"
      title="Create New FiberNet Route Plan"
      description="Enter administrative location, route constraints, and service coverage inputs for preliminary DPR preparation."
    >
      <form onSubmit={onGenerate} className="grid min-w-0 gap-4">
        <div className="grid min-w-0 gap-4 md:grid-cols-3">
          <TextInput label="State / UT" value={form.state} onChange={(value) => updateField('state', value)} />
          <TextInput label="District name" value={form.district} onChange={(value) => updateField('district', value)} />
          <TextInput label="Block / Taluka" value={form.block} onChange={(value) => updateField('block', value)} />
        </div>
        <div className="grid min-w-0 gap-4 md:grid-cols-2">
          <TextInput label="Gram Panchayat" value={form.gramPanchayat} onChange={(value) => updateField('gramPanchayat', value)} />
          <TextInput label="Village name" value={form.village} onChange={(value) => updateField('village', value)} />
        </div>
        <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <TextInput label="Distance from existing fiber node (km)" type="number" value={form.distance} onChange={(value) => updateField('distance', value)} />
          <SelectInput label="Predominant terrain category" value={form.terrain} options={Object.keys(terrainProfiles)} onChange={(value) => updateField('terrain', value)} />
          <TextInput label="Households to be covered" type="number" value={form.households} onChange={(value) => updateField('households', value)} />
          <TextInput label="Public institutions to connect" type="number" value={form.institutions} onChange={(value) => updateField('institutions', value)} />
        </div>
        <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SelectInput label="Planning priority" value={form.priority} options={Object.keys(priorityProfiles)} onChange={(value) => updateField('priority', value)} />
          <SelectInput label="Road-side alignment available" value={form.roadAvailable} options={['Yes', 'No']} onChange={(value) => updateField('roadAvailable', value)} />
          <SelectInput label="River / railway crossing involved" value={form.crossingRequired} options={['Yes', 'No']} onChange={(value) => updateField('crossingRequired', value)} />
          <SelectInput label="Forest clearance expected" value={form.forestClearance} options={['No', 'Yes']} onChange={(value) => updateField('forestClearance', value)} />
        </div>
        <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row">
          <button className="inline-flex items-center justify-center gap-2 bg-gov-blue px-5 py-3 font-semibold text-white hover:bg-blue-800">
            <Route size={18} />
            Generate Route Plan
          </button>
          <button type="button" onClick={onSubmit} className="inline-flex items-center justify-center gap-2 border border-gov-green px-5 py-3 font-semibold text-gov-green hover:bg-emerald-50">
            <Send size={18} />
            Submit Plan for Review
          </button>
        </div>
      </form>
    </SectionCard>
  );
}

function TextInput({ label, value, onChange, type = 'text' }) {
  return (
    <label className="field-label">
      {label}
      <input className="input" type={type} value={value} min={type === 'number' ? 0 : undefined} step={type === 'number' ? 0.1 : undefined} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function SelectInput({ label, value, options, onChange }) {
  return (
    <label className="field-label">
      {label}
      <select className="input" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
    </label>
  );
}

function RouteOutput({ plan, form, onSubmit, onDownload, reviewMode = false }) {
  const outputRows = [
    ['Route ID', plan.routeId],
    ['Proposed route type', plan.routeType],
    ['Estimated fiber length', `${plan.fiberLength} km`],
    ['Estimated project cost', formatCurrency(plan.estimatedCost)],
    ['Estimated households covered', formatNumber(plan.householdsCovered)],
    ['Public institutions covered', formatNumber(plan.institutionsCovered)],
    ['Terrain risk score', `${plan.riskScore}/100 (${riskLabel(plan.riskScore)})`],
    ['Feasibility score', `${plan.feasibilityScore}/100`],
    ['Deployment complexity', plan.complexity],
    ['Timeline', plan.timeline],
    ['Required approvals', plan.requiredApprovals.join(', ')],
  ];

  return (
    <SectionCard
      id="route-output"
      icon={FileText}
      eyebrow={reviewMode ? 'Review Authority' : 'Route Planning Output'}
      title={reviewMode ? 'Feasibility Summary for Review' : 'Infrastructure Estimate and Recommendation'}
      description="Preliminary estimate for administrative screening. Field verification is required before final approval."
      action={<StatusBadge status={plan.riskScore >= 75 ? 'Field Verification Required' : 'Draft'} />}
    >
      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
        <div className="w-full min-w-0 max-w-full overflow-x-auto border border-slate-300">
          <table className="w-full min-w-[620px] text-left text-sm">
            <tbody>
              {outputRows.map(([label, value]) => (
                <tr key={label} className="border-b border-slate-200 last:border-0">
                  <th className="w-56 bg-slate-50 px-4 py-3 font-semibold text-slate-700">{label}</th>
                  <td className="break-words px-4 py-3 text-slate-700">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="grid min-w-0 content-start gap-4">
          <div className="border border-slate-300 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-gov-navy">Planning Recommendation Note</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{plan.note}</p>
          </div>
          <div className="border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">Departmental review note</p>
            <p className="mt-1 leading-6">Cost and risk values are indicative for departmental screening. Final DPR should include survey drawings, permissions, and verified bill of quantities.</p>
          </div>
          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            <MiniMetric label="Civil works" value={formatCurrency(plan.civilCost)} />
            <MiniMetric label="Electronics" value={formatCurrency(plan.electronicsCost)} />
            <MiniMetric label="Approvals" value={formatCurrency(plan.approvalsCost)} />
            <MiniMetric label="Contingency" value={formatCurrency(plan.contingency)} />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button onClick={onDownload} className="inline-flex items-center justify-center gap-2 bg-gov-navy px-4 py-2 text-sm font-semibold text-white hover:bg-blue-950">
              <Download size={16} />
              Download Planning Report
            </button>
            <button onClick={onSubmit} className="inline-flex items-center justify-center gap-2 border border-gov-green px-4 py-2 text-sm font-semibold text-gov-green hover:bg-emerald-50">
              <Send size={16} />
              Submit for Review
            </button>
          </div>
        </div>
      </div>
      <p className="mt-4 text-xs text-slate-500">Location: {form.village}, {form.gramPanchayat}, {form.block}, {form.district}, {form.state}</p>
    </SectionCard>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className="border border-slate-300 bg-white p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 font-bold text-gov-navy">{value}</p>
    </div>
  );
}

function ReportDownloadPanel({ plan, form, onDownload }) {
  return (
    <SectionCard
      id="report-download"
      icon={Download}
      eyebrow="Report Download Section"
      title="Preliminary Planning Report"
      description="Generate a text report for departmental screening, field verification, and DPR preparation."
      action={<StatusBadge status={plan.riskScore >= 75 ? 'Field Verification Required' : 'Draft'} />}
    >
      <div className="grid gap-4">
        <div className="border border-slate-300 bg-slate-50 p-4 text-sm">
          <DetailRow label="Route file" value={plan.routeId} />
          <DetailRow label="Administrative area" value={`${form.block}, ${form.district}`} />
          <DetailRow label="Report includes" value="Inputs, estimate, risk, approvals, next steps" />
        </div>
        <button onClick={onDownload} className="inline-flex items-center justify-center gap-2 border border-gov-navy bg-gov-navy px-4 py-3 text-sm font-bold text-white hover:bg-blue-950">
          <Download size={17} />
          Download .txt Report
        </button>
        <p className="text-xs leading-5 text-slate-500">This planning report is intended for departmental screening and field verification before DPR finalization.</p>
      </div>
    </SectionCard>
  );
}

function GISPreview({ form, plan }) {
  const riskZoneLabel = plan.riskScore >= 75 ? 'High-risk clearance zone' : plan.riskScore >= 50 ? 'Moderate-risk crossing zone' : 'Low-risk execution zone';
  const riskFill = plan.riskScore >= 75 ? '#fee2e2' : plan.riskScore >= 50 ? '#fef3c7' : '#dcfce7';
  const riskStroke = plan.riskScore >= 75 ? '#dc2626' : plan.riskScore >= 50 ? '#c76a16' : '#1f7a4d';

  return (
    <SectionCard
      id="gis-preview"
      icon={Layers3}
      eyebrow="GIS Planning Preview"
      title="Proposed Route Alignment Map"
      description="Infrastructure planning sketch with administrative boundary, proposed alignment, crossing points, terrain risk zones, and route metadata."
    >
      <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="w-full min-w-0 max-w-full overflow-hidden border border-slate-400 bg-[#eef3ef]">
          <div className="border-b border-slate-300 bg-white px-4 py-3">
            <p className="text-sm font-bold uppercase tracking-wide text-gov-navy">Planning Map Sheet</p>
            <p className="mt-1 whitespace-normal text-sm leading-5 text-slate-600">Administrative boundary, road corridor, crossing and terrain risk layers</p>
          </div>
          <div className="h-[400px] w-full max-w-full overflow-hidden sm:h-[440px] xl:h-[560px]">
          <svg viewBox="0 0 960 560" preserveAspectRatio="xMidYMid meet" className="block h-full w-full max-w-full" role="img" aria-label="Official style GIS planning map preview">
            <defs>
              <pattern id="govGrid" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#cbd8d3" strokeWidth="0.8" />
              </pattern>
              <pattern id="terrainHatch" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
                <line x1="0" y1="0" x2="0" y2="12" stroke="#6b8f71" strokeWidth="2" opacity="0.38" />
              </pattern>
              <pattern id="railHatch" width="16" height="16" patternUnits="userSpaceOnUse">
                <path d="M0 8 H16" stroke="#475569" strokeWidth="2" />
                <path d="M4 2 V14 M12 2 V14" stroke="#475569" strokeWidth="1.5" />
              </pattern>
            </defs>

            <rect width="960" height="560" fill="#edf3ef" />
            <rect width="960" height="560" fill="url(#govGrid)" opacity="0.72" />

            <rect x="708" y="24" width="224" height="58" fill="#ffffff" stroke="#94a3b8" />
            <text x="724" y="47" className="map-label-small">Sheet: {form.district}-{form.block}-01</text>
            <text x="724" y="68" className="map-label-small">Layer stack: Admin / ROW / Risk</text>

            <path d="M628 0 L960 0 L960 560 L746 560 C718 492 690 424 716 356 C744 284 804 238 770 160 C748 108 680 70 628 0Z" fill="url(#terrainHatch)" opacity="0.74" />
            <path d="M64 118 C176 72 320 84 432 116 C562 154 674 110 800 144 C870 164 906 240 862 316 C810 407 654 458 500 430 C338 402 190 458 92 366 C16 294 2 178 64 118Z" fill="none" stroke="#1f7a4d" strokeWidth="4" strokeDasharray="12 8" />
            <text x="118" y="138" className="map-label">Gram Panchayat boundary</text>

            <path d="M382 138 C488 104 648 132 728 220 C806 306 772 398 646 424 C514 452 390 392 358 284 C338 214 330 160 382 138Z" fill={riskFill} stroke={riskStroke} strokeWidth="2" opacity="0.58" />
            <text x="420" y="190" className="map-label-small">{riskZoneLabel}</text>

            <path d="M0 410 C130 372 238 396 354 348 S548 220 704 222 S852 260 960 226" fill="none" stroke="#8d7d68" strokeWidth="30" opacity="0.45" />
            <path d="M0 410 C130 372 238 396 354 348 S548 220 704 222 S852 260 960 226" fill="none" stroke="#ffffff" strokeWidth="8" opacity="0.95" />
            <path d="M0 410 C130 372 238 396 354 348 S548 220 704 222 S852 260 960 226" fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray="18 16" opacity="0.55" />
            <text x="190" y="426" className="map-label-small">Existing rural road alignment</text>

            <path d="M0 300 C126 276 236 250 342 268 C462 288 536 346 664 332 C770 320 856 284 960 292" fill="none" stroke="#3b82f6" strokeWidth="9" opacity="0.45" />
            <path d="M0 300 C126 276 236 250 342 268 C462 288 536 346 664 332 C770 320 856 284 960 292" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.55" />
            <text x="700" y="314" className="map-label-small">Seasonal river / drainage line</text>

            <path d="M112 454 L884 92" fill="none" stroke="url(#railHatch)" strokeWidth="12" opacity="0.3" />
            <path d="M112 454 L884 92" fill="none" stroke="#475569" strokeWidth="3" strokeDasharray="12 10" opacity="0.7" />
            <text x="632" y="164" className="map-label-small">Rail / utility corridor</text>

            <path d="M110 408 C202 360 262 382 354 332 S506 220 628 226 C694 230 736 224 812 188" fill="none" stroke="#38bdf8" strokeWidth="28" strokeLinecap="round" opacity="0.17" />
            <path d="M110 408 C202 360 262 382 354 332 S506 220 628 226 C694 230 736 224 812 188" fill="none" stroke="#0b4f8a" strokeWidth="10" strokeLinecap="round" />
            <path d="M110 408 C202 360 262 382 354 332 S506 220 628 226 C694 230 736 224 812 188" fill="none" stroke="#f4a124" strokeWidth="3" strokeLinecap="round" strokeDasharray="16 12" />
            <text x="422" y="234" className="map-label-small">Proposed OFC route corridor</text>

            <g>
              <circle cx="110" cy="408" r="20" fill="#0b4f8a" />
              <circle cx="110" cy="408" r="31" fill="none" stroke="#0b4f8a" strokeWidth="3" opacity="0.28" />
              <rect x="42" y="438" width="154" height="30" fill="#ffffff" stroke="#94a3b8" />
              <text x="54" y="459" className="map-label-small">Existing fiber node</text>
            </g>

            <g>
              <circle cx="812" cy="188" r="21" fill="#1f7a4d" />
              <circle cx="812" cy="188" r="34" fill="none" stroke="#1f7a4d" strokeWidth="3" opacity="0.24" />
              <text x="742" y="154" className="map-label">{form.village}</text>
              <rect x="742" y="206" width="150" height="32" fill="#ecfdf5" stroke="#1f7a4d" />
              <text x="756" y="227" className="map-label-small">Target village marker</text>
            </g>

            <g>
              <rect x="548" y="296" width="162" height="34" fill="#fff7ed" stroke="#c76a16" strokeWidth="2" />
              <path d="M568 312 H690" stroke="#c76a16" strokeWidth="3" />
              <circle cx="628" cy="226" r="12" fill="#c76a16" />
              <text x="562" y="319" className="map-label-small">River / railway crossing</text>
            </g>

            <g>
              <circle cx="470" cy="282" r="12" fill={riskStroke} />
              <circle cx="470" cy="282" r="22" fill="none" stroke={riskStroke} strokeWidth="2" opacity="0.35" />
              <text x="492" y="288" className="map-label-small">Terrain risk marker</text>
            </g>

            <g>
              <rect x="356" y="304" width="108" height="28" fill="#ffffff" stroke="#94a3b8" />
              <text x="370" y="323" className="map-label-small">Ch. 5.2 km</text>
            </g>

            <g transform="translate(854 104)">
              <path d="M20 0 L40 58 L20 46 L0 58 Z" fill="#0a2342" />
              <line x1="20" y1="58" x2="20" y2="86" stroke="#0a2342" strokeWidth="3" />
              <text x="-6" y="106" className="map-label-small">North</text>
            </g>

            <g transform="translate(44 44)">
              <rect width="260" height="192" fill="#ffffff" stroke="#94a3b8" />
              <text x="16" y="28" className="map-legend-title">Legend</text>
              <line x1="16" y1="52" x2="68" y2="52" stroke="#0b4f8a" strokeWidth="8" />
              <text x="84" y="57" className="map-label-small">Proposed route path</text>
              <line x1="16" y1="80" x2="68" y2="80" stroke="#8d7d68" strokeWidth="10" opacity="0.55" />
              <text x="84" y="85" className="map-label-small">Road line / ROW</text>
              <line x1="16" y1="108" x2="68" y2="108" stroke="#3b82f6" strokeWidth="6" opacity="0.55" />
              <text x="84" y="113" className="map-label-small">River / drainage</text>
              <circle cx="42" cy="136" r="8" fill="#0b4f8a" />
              <text x="84" y="141" className="map-label-small">Existing fiber node</text>
              <circle cx="42" cy="164" r="8" fill="#1f7a4d" />
              <text x="84" y="169" className="map-label-small">Target village</text>
            </g>

            <g transform="translate(690 482)">
              <rect x="-18" y="-22" width="220" height="58" fill="#ffffff" stroke="#94a3b8" />
              <line x1="0" y1="0" x2="160" y2="0" stroke="#0f172a" strokeWidth="4" />
              <line x1="0" y1="-8" x2="0" y2="8" stroke="#0f172a" strokeWidth="3" />
              <line x1="80" y1="-6" x2="80" y2="6" stroke="#0f172a" strokeWidth="2" />
              <line x1="160" y1="-8" x2="160" y2="8" stroke="#0f172a" strokeWidth="3" />
              <text x="0" y="25" className="map-label-small">0</text>
              <text x="70" y="25" className="map-label-small">1 km</text>
              <text x="142" y="25" className="map-label-small">2 km</text>
            </g>
          </svg>
          </div>
        </div>
        <aside className="min-w-0 border border-slate-400 bg-white">
          <div className="border-b border-slate-300 bg-gov-navy px-4 py-3 text-white">
            <p className="text-sm font-bold uppercase tracking-wide">Route Metadata</p>
            <p className="mt-1 text-xs text-blue-100">Planning map attributes</p>
          </div>
          <div className="grid min-w-0 gap-0 p-4 text-sm">
            <MapMetadataRow label="Route ID" value={plan.routeId} />
            <MapMetadataRow label="Map sheet" value={`${form.district}-${form.block}-01`} />
            <MapMetadataRow label="Gram Panchayat" value={form.gramPanchayat} />
            <MapMetadataRow label="Fiber length" value={`${plan.fiberLength} km`} />
            <MapMetadataRow label="Terrain type" value={form.terrain} />
            <MapMetadataRow label="Risk zone" value={`${riskLabel(plan.riskScore)} (${plan.riskScore}/100)`} />
            <MapMetadataRow label="Feasibility" value={`${plan.feasibilityScore}/100`} />
            <MapMetadataRow label="Duct / aerial" value={`${plan.ductKm} / ${plan.aerialKm} km`} />
            <MapMetadataRow label="Estimated cost" value={formatCurrency(plan.estimatedCost)} />
            <MapMetadataRow label="Timeline" value={plan.timeline} />
          </div>
          <div className="border-t border-slate-300 bg-slate-50 p-4 text-xs leading-5 text-slate-600">
            Field note: alignment, crossings, and risk zones are planning layers for departmental review. Final DPR requires verified survey drawings.
          </div>
        </aside>
      </div>
    </SectionCard>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-4 border-b border-slate-200 pb-2 last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="min-w-0 break-words text-right font-semibold text-gov-navy">{value}</span>
    </div>
  );
}

function MapMetadataRow({ label, value }) {
  return (
    <div className="grid min-w-0 grid-cols-[128px_minmax(0,1fr)] gap-3 border-b border-slate-200 py-3 last:border-0 sm:grid-cols-[148px_minmax(0,1fr)]">
      <span className="whitespace-nowrap text-slate-500">{label}</span>
      <span className="min-w-0 break-words text-right font-semibold text-gov-navy">{value}</span>
    </div>
  );
}

function PlansTable({ plans, onStatus, title, canApprove = false }) {
  return (
    <SectionCard id="plans-table" icon={TableProperties} eyebrow="Planning Records" title={title}>
      <div className="w-full min-w-0 max-w-full overflow-x-auto border border-slate-300">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="bg-gov-navy text-white">
            <tr>
              {['Route ID', 'District', 'Block', 'Village', 'Fiber Length', 'Estimated Cost', 'Status', 'Risk', 'Feasibility', 'Updated', 'Action'].map((item) => (
                <th key={item} className="px-4 py-3 font-semibold">{item}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {plans.map((item) => (
              <tr key={item.routeId} className="border-b border-slate-200 bg-white last:border-0">
                <td className="max-w-40 break-words px-4 py-3 font-semibold text-gov-navy">{item.routeId}</td>
                <td className="px-4 py-3">{item.district}</td>
                <td className="px-4 py-3">{item.block || '-'}</td>
                <td className="px-4 py-3">{item.village}</td>
                <td className="px-4 py-3">{item.fiberLength} km</td>
                <td className="whitespace-nowrap px-4 py-3">{formatCurrency(item.estimatedCost)}</td>
                <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                <td className="px-4 py-3">{item.riskScore}/100 {riskLabel(item.riskScore)}</td>
                <td className="px-4 py-3">{item.feasibilityScore || 70}/100</td>
                <td className="px-4 py-3">{item.updatedOn || 'Today'}</td>
                <td className="px-4 py-3">
                  {canApprove ? (
                    <div className="flex gap-2">
                      <button onClick={() => onStatus(item.routeId, 'Approved')} className="border border-emerald-300 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50">Approve</button>
                      <button onClick={() => onStatus(item.routeId, 'Rejected')} className="border border-red-300 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50">Reject</button>
                    </div>
                  ) : (
                    <button onClick={() => onStatus(item.routeId, 'Under Review')} className="border border-blue-300 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50">Submit</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

function SurveyTable({ surveys, onUpdate }) {
  return (
    <SectionCard id="route-planning" icon={ListChecks} eyebrow="Field Survey Module" title="Assigned Survey Routes">
      <div className="w-full min-w-0 max-w-full overflow-x-auto border border-slate-300">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-gov-navy text-white">
            <tr>
              {['Route ID', 'Village', 'Officer', 'Survey Status', 'Terrain Difficulty', 'Field Remarks'].map((item) => (
                <th key={item} className="px-4 py-3 font-semibold">{item}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {surveys.map((item) => (
              <tr key={item.routeId} className="border-b border-slate-200 bg-white last:border-0">
                <td className="px-4 py-3 font-semibold text-gov-navy">{item.routeId}</td>
                <td className="px-4 py-3">{item.village}</td>
                <td className="px-4 py-3">{item.officer}</td>
                <td className="px-4 py-3">
                  <select className="table-input" value={item.status} onChange={(event) => onUpdate(item.routeId, 'status', event.target.value)}>
                    {['Assigned', 'In Progress', 'Completed', 'Blocked'].map((status) => <option key={status}>{status}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select className="table-input" value={item.difficulty} onChange={(event) => onUpdate(item.routeId, 'difficulty', event.target.value)}>
                    {['Low', 'Medium', 'High'].map((status) => <option key={status}>{status}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <input className="table-input min-w-64" value={item.remarks} onChange={(event) => onUpdate(item.routeId, 'remarks', event.target.value)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

function ReviewTable({ plans, onStatus }) {
  const reviewPlans = plans.filter((item) => item.status === 'Under Review' || item.status === 'Field Verification Required' || item.status === 'Draft');

  return (
    <SectionCard id="reports" icon={ClipboardCheck} eyebrow="Review Desk" title="Plans Pending Review or Verification">
      <div className="grid gap-3">
        {reviewPlans.map((item) => (
          <div key={item.routeId} className="min-w-0 border border-slate-300 bg-white p-4">
            <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <p className="break-words font-bold text-gov-navy">{item.routeId} - {item.village}, {item.district}</p>
                <p className="mt-1 text-sm text-slate-600">Block {item.block || '-'} | Fiber length {item.fiberLength} km | Cost {formatCurrency(item.estimatedCost)} | Risk {item.riskScore}/100 | Feasibility {item.feasibilityScore || 70}/100</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => onStatus(item.routeId, 'Approved')} className="border border-emerald-300 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50">Approve</button>
                <button onClick={() => onStatus(item.routeId, 'Under Review')} className="border border-blue-300 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50">Send Back</button>
                <button onClick={() => onStatus(item.routeId, 'Field Verification Required')} className="border border-amber-300 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50">Field Verification</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function RecentActivity({ activities }) {
  return (
    <SectionCard id="activity-feed" icon={Milestone} eyebrow="Activity Feed" title="Recent Portal Activity">
      <div className="grid gap-3">
        {activities.map((activity, index) => (
          <div key={`${activity}-${index}`} className="flex gap-3 border border-slate-200 bg-slate-50 p-3 text-sm">
            <CheckCircle2 className="mt-0.5 shrink-0 text-gov-green" size={17} />
            <span className="text-slate-700">{activity}</span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function buildReport(form, plan) {
  return [
    'FiberRoute AI',
    'Rural FiberNet Planning & Monitoring Portal',
    'Preliminary Infrastructure Planning Report',
    'Generated for departmental screening and field verification',
    '',
    `Route ID: ${plan.routeId}`,
    '',
    '1. Location Details',
    `State: ${form.state}`,
    `District: ${form.district}`,
    `Block: ${form.block}`,
    `Gram Panchayat: ${form.gramPanchayat}`,
    `Village: ${form.village}`,
    '',
    '2. Planning Input',
    `Nearest existing fiber node distance: ${form.distance} km`,
    `Terrain type: ${form.terrain}`,
    `Households: ${form.households}`,
    `Public institutions: ${form.institutions}`,
    `Priority: ${form.priority}`,
    `Existing road availability: ${form.roadAvailable}`,
    `River / railway crossing: ${form.crossingRequired}`,
    `Forest clearance required: ${form.forestClearance}`,
    '',
    '3. Route Output and Feasibility',
    `Proposed route type: ${plan.routeType}`,
    `Estimated fiber length: ${plan.fiberLength} km`,
    `Estimated households covered: ${plan.householdsCovered}`,
    `Public institutions covered: ${plan.institutionsCovered}`,
    `Underground duct segment: ${plan.ductKm} km`,
    `Aerial fiber segment: ${plan.aerialKm} km`,
    `Deployment complexity: ${plan.complexity}`,
    `Timeline: ${plan.timeline}`,
    '',
    '4. Cost',
    `Estimated project cost: ${formatCurrency(plan.estimatedCost)}`,
    `Civil works: ${formatCurrency(plan.civilCost)}`,
    `Electronics: ${formatCurrency(plan.electronicsCost)}`,
    `Approvals and permissions: ${formatCurrency(plan.approvalsCost)}`,
    `Contingency: ${formatCurrency(plan.contingency)}`,
    '',
    '5. Risk and Feasibility',
    `Terrain risk score: ${plan.riskScore}/100 (${riskLabel(plan.riskScore)})`,
    `Feasibility score: ${plan.feasibilityScore}/100`,
    '',
    '6. Required Approvals',
    plan.requiredApprovals.map((approval, index) => `${index + 1}. ${approval}`).join('\n'),
    '',
    '7. Next Steps',
    'Validate right-of-way, complete field survey, confirm crossing and clearance requirements, finalize bill of quantities, and submit the DPR for administrative approval.',
    '',
    'Field Verification Notes',
    plan.note,
    '',
    'Disclaimer',
    'This route planning report is intended for departmental screening and field verification. It is not an administrative sanction, tender document, or final DPR.',
  ].join('\n');
}

createRoot(document.getElementById('root')).render(<PortalDashboard />);
