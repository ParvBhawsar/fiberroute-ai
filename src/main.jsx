import React, { useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Download,
  IndianRupee,
  Layers3,
  MapPinned,
  Route,
  Satellite,
  Sparkles,
  Zap,
} from 'lucide-react';
import './styles.css';

const FIELD_SURVEY_BUFFER_KM = 0.35;
const BASE_COST_PER_KM = 415000;

const terrainProfiles = {
  Plain: {
    multiplier: 1,
    risk: 24,
    routeType: 'Direct roadside trenching with aerial fiber support near habitation clusters',
    complexity: 'Low',
    marker: 'Canal crossing',
    riskDrivers: ['low terrain friction', 'roadside corridor validation'],
  },
  Hilly: {
    multiplier: 1.38,
    risk: 68,
    routeType: 'Contour-following aerial fiber route with protected bends and relay poles',
    complexity: 'High',
    marker: 'Slope zone',
    riskDrivers: ['slope stability', 'pole placement access'],
  },
  Forest: {
    multiplier: 1.5,
    risk: 76,
    routeType: 'Low-impact edge alignment using existing paths and limited underground segments',
    complexity: 'High',
    marker: 'Forest edge',
    riskDrivers: ['forest permissions', 'limited machinery access'],
  },
  Mixed: {
    multiplier: 1.22,
    risk: 52,
    routeType: 'Hybrid route using roadside trenching, aerial spans, and bypass segments',
    complexity: 'Medium',
    marker: 'Seasonal stream',
    riskDrivers: ['seasonal crossings', 'mixed right-of-way'],
  },
};

const priorityProfiles = {
  'Cost Optimized': {
    lengthFactor: 1.08,
    costFactor: 0.92,
    timelineFactor: 1.15,
    aerialShare: 0.32,
    emphasis: 'minimizes new civil work',
  },
  'Fast Deployment': {
    lengthFactor: 1.18,
    costFactor: 1.18,
    timelineFactor: 0.78,
    aerialShare: 0.68,
    emphasis: 'uses faster aerial and existing corridor options',
  },
  Balanced: {
    lengthFactor: 1.12,
    costFactor: 1,
    timelineFactor: 1,
    aerialShare: 0.48,
    emphasis: 'balances cost, speed, and route resilience',
  },
};

const initialForm = {
  village: 'Devgaon Gram Panchayat',
  district: 'Nashik',
  state: 'Maharashtra',
  distance: 8.5,
  terrain: 'Mixed',
  households: 1260,
  priority: 'Balanced',
};

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-IN').format(value);
}

function shortLabel(value, maxLength = 24) {
  if (!value) return 'Target village';
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value;
}

function generatePlan(form) {
  const terrain = terrainProfiles[form.terrain];
  const priority = priorityProfiles[form.priority];
  const distance = Math.max(Number(form.distance) || 0, 0.5);
  const households = Math.max(Number(form.households) || 0, 1);
  const localDistributionKm = households / 5200;
  const fiberLength = Number((distance * terrain.multiplier * priority.lengthFactor + localDistributionKm + FIELD_SURVEY_BUFFER_KM).toFixed(1));
  const householdDensityFactor = households > 1500 ? 0.95 : households < 500 ? 1.12 : 1;
  const civilCost = Math.round(fiberLength * BASE_COST_PER_KM * terrain.multiplier * priority.costFactor * householdDensityFactor);
  const electronicsCost = Math.round(Math.max(180000, households * 520));
  const permissionCost = Math.round(fiberLength * (terrain.risk > 65 ? 52000 : 31000));
  const contingencyCost = Math.round((civilCost + electronicsCost + permissionCost) * (terrain.risk > 70 ? 0.13 : 0.09));
  const estimatedCost = civilCost + electronicsCost + permissionCost + contingencyCost;
  const riskScore = Math.min(96, Math.round(terrain.risk + distance * 1.6 + (households > 1800 ? 5 : 0) + (priority.aerialShare > 0.6 ? 3 : 0)));
  const coverageRate = riskScore > 72 ? 0.9 : riskScore > 55 ? 0.94 : 0.98;
  const covered = Math.round(households * coverageRate);
  const weeks = Math.max(3, Math.round((fiberLength * 0.72 + riskScore / 18) * priority.timelineFactor));
  const complexity = riskScore > 70 ? 'High' : riskScore > 45 ? terrain.complexity === 'Low' ? 'Medium' : terrain.complexity : 'Low';
  const riskLabel = riskScore > 70 ? 'High attention' : riskScore > 45 ? 'Moderate' : 'Low';
  const confidence = Math.max(68, Math.min(91, Math.round(94 - riskScore / 3 + (households > 800 ? 3 : 0))));
  const aerialKm = Number((fiberLength * priority.aerialShare).toFixed(1));
  const trenchKm = Number((fiberLength - aerialKm).toFixed(1));

  return {
    routeType: terrain.routeType,
    fiberLength,
    estimatedCost,
    costPerHousehold: Math.round(estimatedCost / covered),
    covered,
    riskScore,
    riskLabel,
    complexity,
    timeline: `${weeks}-${weeks + 2} weeks`,
    confidence,
    routeSegments: [
      `${trenchKm} km protected trench / duct`,
      `${aerialKm} km aerial span or pole-mounted fiber`,
      `${localDistributionKm.toFixed(1)} km village distribution allowance`,
    ],
    costBreakdown: {
      civil: civilCost,
      electronics: electronicsCost,
      permissions: permissionCost,
      contingency: contingencyCost,
    },
    riskDrivers: terrain.riskDrivers,
    explanation: `For ${form.village}, the suggested plan ${priority.emphasis}. The nearest fiber node is ${distance} km away, and the ${form.terrain.toLowerCase()} terrain increases route length and survey needs. The route uses existing corridors where possible, covers about ${formatNumber(covered)} households, and flags ${riskScore > 70 ? 'right-of-way, terrain access, and seasonal disruption' : riskScore > 45 ? 'moderate route access and local coordination' : 'limited terrain and execution'} risks for field validation.`,
  };
}

function StatCard({ icon: Icon, label, value, helper, tone = 'blue' }) {
  const tones = {
    blue: 'bg-blue-50 text-fiber-blue',
    green: 'bg-emerald-50 text-fiber-green',
    cyan: 'bg-cyan-50 text-fiber-cyan',
    amber: 'bg-amber-50 text-amber-700',
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg ${tones[tone]}`}>
        <Icon size={21} />
      </div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-fiber-navy">{value}</p>
      {helper ? <p className="mt-2 text-xs font-medium text-slate-500">{helper}</p> : null}
    </div>
  );
}

function RiskMeter({ score, label }) {
  const meterColor = score > 70 ? 'bg-amber-500' : score > 45 ? 'bg-fiber-cyan' : 'bg-fiber-green';

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">Terrain risk score</p>
          <p className="mt-1 text-2xl font-semibold text-fiber-navy">{score}/100</p>
        </div>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">{label}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${meterColor}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function RouteMap({ form, plan }) {
  const terrain = terrainProfiles[form.terrain];

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-[#f4fbf8] shadow-soft">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-fiber-green">GIS Preview</p>
          <h3 className="text-lg font-semibold text-fiber-navy">Visual route mock map</h3>
        </div>
        <Layers3 className="text-fiber-blue" size={24} />
      </div>
      <svg viewBox="0 0 760 390" className="h-[260px] w-full sm:h-[330px]">
        <defs>
          <pattern id="grid" width="38" height="38" patternUnits="userSpaceOnUse">
            <path d="M 38 0 L 0 0 0 38" fill="none" stroke="#cfe2dc" strokeWidth="1" />
          </pattern>
          <linearGradient id="route" x1="0" x2="1">
            <stop offset="0%" stopColor="#1769e0" />
            <stop offset="100%" stopColor="#0f9f6e" />
          </linearGradient>
        </defs>
        <rect width="760" height="390" fill="url(#grid)" />
        <path d="M36 280 C150 242 210 300 326 230 S505 100 724 132" fill="none" stroke="#b9d3ca" strokeWidth="34" strokeLinecap="round" opacity="0.55" />
        <path d="M54 278 C176 232 226 292 342 220 S508 94 706 128" fill="none" stroke="url(#route)" strokeWidth="9" strokeLinecap="round" strokeDasharray="14 10" />
        <circle cx="64" cy="276" r="18" fill="#1769e0" />
        <circle cx="64" cy="276" r="28" fill="none" stroke="#1769e0" strokeWidth="3" opacity="0.28" />
        <text x="36" y="330" className="map-label">Source fiber node</text>
        <circle cx="704" cy="128" r="20" fill="#0f9f6e" />
        <circle cx="704" cy="128" r="32" fill="none" stroke="#0f9f6e" strokeWidth="3" opacity="0.25" />
        <text x="560" y="88" className="map-label">{shortLabel(form.village)}</text>
        <g>
          <rect x="238" y="258" width="118" height="34" rx="7" fill="#ffffff" stroke="#b8d4cc" />
          <text x="252" y="280" className="map-label-small">{terrain.marker}</text>
        </g>
        <g>
          <rect x="415" y="126" width="132" height="34" rx="7" fill="#ffffff" stroke="#b8d4cc" />
          <text x="430" y="148" className="map-label-small">{form.terrain} terrain</text>
        </g>
        <g>
          <rect x="90" y="74" width="164" height="74" rx="8" fill="#ffffff" stroke="#c7d8e8" />
          <text x="108" y="102" className="map-label-small">Fiber length</text>
          <text x="108" y="130" className="map-metric">{plan ? `${plan.fiberLength} km` : '-- km'}</text>
        </g>
      </svg>
    </div>
  );
}

function App() {
  const [form, setForm] = useState(initialForm);
  const [plan, setPlan] = useState(() => generatePlan(initialForm));
  const plannerRef = useRef(null);
  const report = useMemo(() => {
    if (!plan) return '';
    return [
      'FiberRoute AI - Implementation Report',
      '',
      `Village / Gram Panchayat: ${form.village}`,
      `District: ${form.district}`,
      `State: ${form.state}`,
      '',
      `Problem: ${form.village} requires dependable last-mile FiberNet connectivity for ${formatNumber(form.households)} households, with the nearest fiber node ${form.distance} km away.`,
      `Proposed route: ${plan.routeType}. Estimated fiber length is ${plan.fiberLength} km.`,
      `Cost estimate: ${formatCurrency(plan.estimatedCost)} (${formatCurrency(plan.costPerHousehold)} per covered household).`,
      `Route mix: ${plan.routeSegments.join('; ')}.`,
      `Risks: Terrain risk score ${plan.riskScore}/100 (${plan.riskLabel}) with ${plan.complexity.toLowerCase()} deployment complexity. Main drivers: ${plan.riskDrivers.join(', ')}.`,
      `Next steps: Validate right-of-way, conduct field survey, confirm pole/trenching permissions, finalize BoQ, and schedule implementation over ${plan.timeline}.`,
      '',
      `AI explanation: ${plan.explanation}`,
    ].join('\n');
  }, [form, plan]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submitPlan = (event) => {
    event.preventDefault();
    setPlan(generatePlan(form));
  };

  const downloadReport = () => {
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(form.village || 'fiber-route').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-report.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-white/20 bg-fiber-navy text-white">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/12">
              <Route size={22} />
            </div>
            <span className="text-lg font-semibold">FiberRoute AI</span>
          </div>
          <a href="#planner" className="hidden rounded-lg bg-white px-4 py-2 text-sm font-semibold text-fiber-navy shadow-sm transition hover:bg-emerald-50 sm:inline-flex">
            Start Planning
          </a>
        </nav>
      </header>

      <main>
        <section className="relative overflow-hidden bg-fiber-navy text-white">
          <div className="absolute inset-0 opacity-20">
            <svg viewBox="0 0 1200 520" className="h-full w-full" preserveAspectRatio="none">
              <path d="M0 410 C180 300 295 330 455 230 S760 90 1200 160" fill="none" stroke="#56d39b" strokeWidth="18" />
              <path d="M0 300 C220 220 360 270 530 168 S840 70 1200 105" fill="none" stroke="#3aa2ff" strokeWidth="5" strokeDasharray="20 16" />
              <circle cx="184" cy="298" r="18" fill="#56d39b" />
              <circle cx="820" cy="86" r="14" fill="#3aa2ff" />
            </svg>
          </div>
          <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-20 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:py-24">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-emerald-100">
                <Sparkles size={16} />
                AI-powered rural connectivity planning
              </div>
              <h1 className="max-w-4xl text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
                FiberRoute AI
              </h1>
              <p className="mt-5 max-w-2xl text-xl leading-8 text-blue-50">
                AI-powered last-mile FiberNet planning for rural India
              </p>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-200">
                Reduce manual survey effort and improve connectivity planning with instant route estimates, cost signals, terrain risk, and implementation reports.
              </p>
              <button
                onClick={() => plannerRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="mt-8 inline-flex items-center gap-2 rounded-lg bg-fiber-green px-5 py-3 font-semibold text-white shadow-lg shadow-emerald-950/25 transition hover:bg-emerald-600"
              >
                Start Planning
                <ArrowRight size={18} />
              </button>
              <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
                {['Survey effort cut', 'Instant DPR draft', 'Risk-first routing'].map((item) => (
                  <div key={item} className="rounded-lg border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-blue-50">
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-white/15 bg-white/10 p-5 shadow-soft backdrop-blur">
              <RouteMap form={form} plan={plan} />
            </div>
          </div>
        </section>

        <section id="planner" ref={plannerRef} className="mx-auto grid max-w-7xl gap-8 px-5 py-14 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-fiber-green">Step 1 - Planner Form</p>
                <h2 className="mt-1 text-2xl font-semibold text-fiber-navy">Generate a fiber route plan</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">Enter high-level field inputs. The MVP uses deterministic planning assumptions for a consistent Phase 1 demo.</p>
              </div>
              <MapPinned className="text-fiber-blue" size={28} />
            </div>

            <form onSubmit={submitPlan} className="grid gap-4">
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Village / Gram Panchayat name
                <input className="input" value={form.village} onChange={(event) => updateField('village', event.target.value)} />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  District
                  <input className="input" value={form.district} onChange={(event) => updateField('district', event.target.value)} />
                </label>
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  State
                  <input className="input" value={form.state} onChange={(event) => updateField('state', event.target.value)} />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Nearest fiber node distance in km
                  <input className="input" type="number" min="0.5" step="0.1" value={form.distance} onChange={(event) => updateField('distance', event.target.value)} />
                </label>
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Number of households
                  <input className="input" type="number" min="1" value={form.households} onChange={(event) => updateField('households', event.target.value)} />
                </label>
              </div>
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Terrain type
                <select className="input" value={form.terrain} onChange={(event) => updateField('terrain', event.target.value)}>
                  {Object.keys(terrainProfiles).map((terrain) => (
                    <option key={terrain}>{terrain}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Priority
                <select className="input" value={form.priority} onChange={(event) => updateField('priority', event.target.value)}>
                  {Object.keys(priorityProfiles).map((priority) => (
                    <option key={priority}>{priority}</option>
                  ))}
                </select>
              </label>
              <button className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-fiber-blue px-5 py-3 font-semibold text-white shadow-lg shadow-blue-900/15 transition hover:bg-blue-700">
                <Zap size={18} />
                Generate Fiber Route Plan
              </button>
            </form>
          </div>

          <div className="grid content-start gap-6">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
              <p className="text-sm font-semibold uppercase tracking-wide text-fiber-green">Step 2 - AI Route Output</p>
              <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <h2 className="text-2xl font-semibold text-fiber-navy">{form.village}</h2>
                  <p className="mt-1 text-sm text-slate-500">{form.district}, {form.state} - {form.priority} plan</p>
                </div>
                <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-fiber-green">
                  Plan confidence: {plan.confidence}%
                </div>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <StatCard icon={Route} label="Fiber length" value={`${plan.fiberLength} km`} helper={plan.routeSegments[0]} />
              <StatCard icon={IndianRupee} label="Project cost" value={formatCurrency(plan.estimatedCost)} helper={`${formatCurrency(plan.costPerHousehold)} / household`} tone="green" />
              <StatCard icon={Activity} label="Households covered" value={formatNumber(plan.covered)} helper={`of ${formatNumber(form.households)} planned`} tone="cyan" />
              <RiskMeter score={plan.riskScore} label={plan.riskLabel} />
              <StatCard icon={Layers3} label="Complexity" value={plan.complexity} />
              <StatCard icon={Clock3} label="Timeline" value={plan.timeline} tone="green" />
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-fiber-green">
                  <Sparkles size={22} />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-fiber-green">AI Route Output</p>
                  <h3 className="mt-1 text-xl font-semibold text-fiber-navy">{plan.routeType}</h3>
                  <p className="mt-3 leading-7 text-slate-600">{plan.explanation}</p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {plan.routeSegments.map((segment) => (
                      <div key={segment} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700">
                        {segment}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-5 pb-14 lg:grid-cols-[1fr_0.95fr]">
          <RouteMap form={form} plan={plan} />
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-fiber-green">Report</p>
                <h2 className="text-2xl font-semibold text-fiber-navy">Implementation summary</h2>
              </div>
              <button onClick={downloadReport} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-fiber-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 sm:w-auto">
                <Download size={17} />
                Download Report
              </button>
            </div>
            <div className="grid gap-4">
              {[
                ['Problem', `${form.village} needs dependable last-mile FiberNet connectivity for ${formatNumber(form.households)} households from a fiber node ${form.distance} km away.`],
                ['Proposed route', `${plan.routeType}. Estimated length: ${plan.fiberLength} km.`],
                ['Cost estimate', `${formatCurrency(plan.estimatedCost)} based on route length, civil work, electronics, permissions, and contingency.`],
                ['Risks', `Terrain risk score ${plan.riskScore}/100 (${plan.riskLabel}). Main drivers: ${plan.riskDrivers.join(', ')}.`],
                ['Next steps', `Validate right-of-way, conduct field survey, confirm pole/trenching permissions, finalize BoQ, and schedule ${plan.timeline} execution.`],
              ].map(([title, text]) => (
                <div key={title} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="font-semibold text-fiber-navy">{title}</p>
                  <p className="mt-1 leading-6 text-slate-600">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 lg:grid-cols-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-fiber-green">Tech and AI Usage</p>
              <h2 className="mt-2 text-2xl font-semibold text-fiber-navy">Built for a Phase 1 MVP</h2>
            </div>
            <div className="rounded-lg border border-slate-200 p-5">
              <Satellite className="mb-4 text-fiber-blue" size={26} />
              <h3 className="font-semibold text-fiber-navy">Stack</h3>
              <p className="mt-2 leading-6 text-slate-600">Built using React, Vite, and Tailwind CSS with deterministic mock planning logic.</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-5">
              <CheckCircle2 className="mb-4 text-fiber-green" size={26} />
              <h3 className="font-semibold text-fiber-navy">Codex workflow</h3>
              <p className="mt-2 leading-6 text-slate-600">Codex used for rapid MVP development, UI generation, logic implementation, and bug fixing. Future scope includes real GIS layers, satellite data, an OpenAI-powered planning assistant, government dashboard, and route optimization engine.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-fiber-navy px-5 py-6 text-center text-sm text-blue-100">
        Built for AI Builders Hackathon by Outskill and OpenAI.
      </footer>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
