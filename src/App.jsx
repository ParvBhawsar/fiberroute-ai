import React, { useCallback, useMemo, useState } from 'react';
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Download,
  FileCheck2,
  FolderOpen,
  Globe2,
  LayoutDashboard,
  Leaf,
  MapPin,
  Menu,
  Plus,
  Route,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Sprout,
  Users,
} from 'lucide-react';
import { Stat, SurveyCard, Reports } from './components/WorkspacePanels';
import NetworkMap from './components/NetworkMap';
import Planner from './components/Planner';
import { Badge, EmptyState, Modal, PlansTable, Toast } from './components/ui';
import { roles, riskLabel } from './lib/planning';
import {
  compactCurrency,
  newId,
  downloadFile,
  loadWorkspace,
  plansToCsv,
  routeReport,
  saveWorkspace,
  summarize,
} from './lib/workspace';

const navigation = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'planner', label: 'Route planner', icon: Route },
  { id: 'projects', label: 'Route projects', icon: FolderOpen },
  { id: 'surveys', label: 'Field surveys', icon: MapPin },
  { id: 'approvals', label: 'Review & approvals', icon: FileCheck2 },
  { id: 'reports', label: 'Reports & insights', icon: Activity },
];
const pageCopy = {
  overview: ['A more connected tomorrow.', 'See the bigger picture. Plan the next connection.'],
  planner: [
    'From a village to a possibility.',
    'Explore a corridor, compare approaches, and build your next route.',
  ],
  projects: [
    'Every route, in one place.',
    'Keep your plans, estimates and decisions moving together.',
  ],
  surveys: [
    'Good plans start on the ground.',
    'Bring field observations back into your planning process.',
  ],
  approvals: [
    'Move the right plans forward.',
    'Review feasibility, understand the risks, and record a decision.',
  ],
  reports: [
    'Turn your plans into perspective.',
    'Understand your network and take your planning data with you.',
  ],
};

function readInitial() {
  try {
    return { data: loadWorkspace(window.localStorage), error: '' };
  } catch (e) {
    return {
      data: loadWorkspace({ getItem: () => null }),
      error: `${e.message} Changes are disabled to protect existing data. Export your browser data before resetting.`,
    };
  }
}
function timeLabel(date) {
  if (!date) return 'Workspace guide';
  return new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}
function App() {
  const [initial] = useState(readInitial);
  const [workspace, setWorkspace] = useState(initial.data);
  const [page, setPage] = useState('overview');
  const [role, setRole] = useState('District Planner');
  const [district, setDistrict] = useState('All districts');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All statuses');
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notice, setNotice] = useState(initial.error);
  const closeModal = useCallback(() => setModal(null), []);
  const closeDetail = useCallback(() => setSelected(null), []);
  const closeToast = useCallback(() => setToast(''), []);
  const canReview = ['State Admin', 'Review Authority'].includes(role);
  const districts = [...new Set(workspace.plans.map((p) => p.district))].sort();
  const filtered = useMemo(
    () =>
      workspace.plans.filter(
        (p) =>
          (district === 'All districts' || p.district === district) &&
          `${p.village} ${p.district} ${p.routeId}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [workspace.plans, district, query],
  );
  const plans = filtered.filter(
    (p) =>
      status === 'All statuses' ||
      (status === 'High risk' ? p.riskScore >= 75 : p.status === status),
  );
  const metrics = summarize(filtered);
  const allMetrics = summarize(workspace.plans);
  const pending = workspace.plans.filter((p) =>
    ['Under Review', 'Field Verification Required'].includes(p.status),
  );
  const activeRoute = selected
    ? workspace.plans.find((p) => p.routeId === selected.routeId) || selected
    : null;
  function navigate(next) {
    setPage(next);
    setSidebarOpen(false);
    setStatus('All statuses');
    setQuery('');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function commit(next, message) {
    if (initial.error) {
      setToast('Saved data needs recovery before this workspace can be changed.');
      return false;
    }
    try {
      saveWorkspace(window.localStorage, next);
      setWorkspace(next);
      setNotice('');
      if (message) setToast(message);
      return true;
    } catch {
      setNotice(
        'Could not save to this browser. Storage may be full or disabled. Your previous saved data is unchanged.',
      );
      return false;
    }
  }
  function activity(text, type = 'route') {
    return [
      { id: newId(), text, date: new Date().toISOString(), type },
      ...workspace.activities,
    ].slice(0, 30);
  }
  function addPlan(plan) {
    return commit(
      {
        ...workspace,
        plans: [plan, ...workspace.plans.filter((p) => p.routeId !== plan.routeId)],
        activities: activity(`New route planned for ${plan.village}.`),
      },
      `${plan.village} saved. Find it in Route projects.`,
    );
  }
  function updateStatus(plan, nextStatus) {
    if (['Approved', 'Rejected'].includes(nextStatus) && !canReview) return;
    commit(
      {
        ...workspace,
        plans: workspace.plans.map((p) =>
          p.routeId === plan.routeId
            ? { ...p, status: nextStatus, updatedAt: new Date().toISOString() }
            : p,
        ),
        activities: activity(`${plan.village} marked ${nextStatus.toLowerCase()}.`, 'review'),
      },
      `Route marked ${nextStatus.toLowerCase()}.`,
    );
  }
  function exportCsv() {
    downloadFile(
      plansToCsv(page === 'projects' ? plans : filtered),
      'fiberroute-projects.csv',
      'text/csv;charset=utf-8',
    );
    setToast('Project CSV downloaded.');
  }
  function exportReport(plan) {
    downloadFile(routeReport(plan), `${plan.routeId}-report.txt`);
    setToast('Planning report downloaded.');
  }
  const sampleCount = workspace.plans.filter((p) => p.isDemo).length;

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      {sidebarOpen && (
        <button
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation"
        />
      )}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <button
          className="brand"
          onClick={() => navigate('overview')}
          aria-label="FiberRoute AI home"
        >
          <span className="brand-symbol">
            <Route size={25} strokeWidth={2.4} />
          </span>
          <span>
            FiberRoute<span className="brand-ai">AI</span>
            <small>Connecting possibilities.</small>
          </span>
        </button>
        <div className="workspace-switch">
          <span className="workspace-icon">
            <Sprout size={19} />
          </span>
          <div>
            <strong>Rural connectivity</strong>
            <small>Planning workspace</small>
          </div>
          <span className="workspace-tag">DEMO</span>
        </div>
        <p className="nav-label">WORKSPACE</p>
        <nav aria-label="Main navigation">
          {navigation.map((n) => (
            <button
              key={n.id}
              className={'nav-item ' + (page === n.id ? 'active' : '')}
              aria-current={page === n.id ? 'page' : undefined}
              onClick={() => navigate(n.id)}
            >
              <n.icon size={19} strokeWidth={1.7} />
              <span>{n.label}</span>
              {n.id === 'approvals' && pending.length > 0 && (
                <span className="nav-count">{pending.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="impact-note">
            <span className="tiny-stars">✧</span>
            <h3>
              Last mile.
              <br />
              Lasting impact.
            </h3>
            <p>
              Better connections begin
              <br />
              with thoughtful planning.
            </p>
            <div className="little-network">
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
          </div>
          <button className="nav-item" onClick={() => setModal('guide')}>
            <CircleHelp size={18} />
            <span>Workspace guide</span>
            <ArrowUpRight size={15} />
          </button>
          <button className="nav-item" onClick={() => setModal('settings')}>
            <Settings2 size={18} />
            <span>Settings & data</span>
          </button>
          <div className="sidebar-profile">
            <span className="avatar">DP</span>
            <div>
              <strong>Planning team</strong>
              <small>Local demo workspace</small>
            </div>
            <span className="online-dot" />
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={21} />
            </button>
            <Globe2 size={16} />
            <span>Workspace</span>
            <ChevronRight size={14} />
            <strong>{navigation.find((n) => n.id === page)?.label}</strong>
          </div>
          <div className="topbar-actions">
            <span className="local-label">
              <span className="live-dot" /> Local workspace
            </span>
            <button
              className="icon-button notification-button"
              aria-label="View workspace activity"
              onClick={() => setModal('activity')}
            >
              <Bell size={19} />
              {workspace.activities.length > 1 && <i />}
            </button>
            <span className="topbar-divider" />
            <button
              className="avatar profile-button"
              onClick={() => setModal('settings')}
              aria-label="Open workspace settings"
            >
              DP
            </button>
          </div>
        </header>
        <main id="main-content" className="main-content">
          <div className="page-eyebrow">
            <span className="orange-dash" />{' '}
            {page === 'overview' ? 'THE LAST MILE STARTS HERE' : 'RURAL CONNECTIVITY, REIMAGINED'}
            <span className="page-date">
              {new Intl.DateTimeFormat('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              }).format(new Date())}
            </span>
          </div>
          <div className="page-heading">
            <div>
              <h1>{pageCopy[page][0]}</h1>
              <p>{pageCopy[page][1]}</p>
            </div>
            <div className="heading-actions">
              {page !== 'planner' && (
                <>
                  <button className="button" onClick={exportCsv}>
                    <Download size={16} /> Export data
                  </button>
                  <button className="button primary" onClick={() => navigate('planner')}>
                    <Plus size={17} /> New route
                  </button>
                </>
              )}
            </div>
          </div>
          {notice && (
            <div className="storage-notice" role="alert">
              {notice}
            </div>
          )}
          {page !== 'planner' && (
            <div className="filter-bar">
              <div className="filter-start">
                <span className="region-label">
                  <MapPin size={14} /> Planning region
                </span>
                <select
                  aria-label="Filter by district"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                >
                  <option>All districts</option>
                  {districts.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </div>
              <span className="demo-caption">
                <i /> {sampleCount} sample routes · saved in this browser
              </span>
            </div>
          )}
          {page === 'overview' && (
            <>
              <section className="stats-grid" aria-label="Planning overview">
                <Stat
                  icon={FolderOpen}
                  label="Route projects"
                  value={metrics.count.toString().padStart(2, '0')}
                  detail={`${metrics.approved} approved for planning`}
                  accent="green"
                />
                <Stat
                  icon={Route}
                  label="Planned fiber network"
                  value={metrics.length.toFixed(1)}
                  unit="km"
                  detail="Across your route portfolio"
                  accent="orange"
                />
                <Stat
                  icon={Users}
                  label="Villages in scope"
                  value={metrics.villages.toString().padStart(2, '0')}
                  detail="Every village. A new possibility."
                  accent="blue"
                />
                <Stat
                  icon={Leaf}
                  label="Estimated investment"
                  value={compactCurrency(metrics.budget)}
                  detail="Indicative project budget"
                  accent="tan"
                />
              </section>
              <section className="overview-middle">
                <div className="panel map-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Your network, at a glance.</h2>
                      <p>A connected view of the sample portfolio</p>
                    </div>
                    <button className="text-button" onClick={() => navigate('planner')}>
                      Explore map <ArrowUpRight size={15} />
                    </button>
                  </div>
                  <NetworkMap
                    plans={workspace.plans}
                    onExplore={(name) => {
                      const p = workspace.plans.find((p) => p.village === name && p.isDemo);
                      if (p) setSelected(p);
                      else navigate('projects');
                    }}
                  />
                </div>
                <div className="insight-column">
                  <div className="insight-card">
                    <span className="insight-tag">
                      <Sparkles size={14} /> PLANNING INSIGHT
                    </span>
                    <h2>
                      A clearer path <br />
                      to the last mile.
                    </h2>
                    <p>
                      {metrics.highRisk
                        ? `${metrics.highRisk} route${metrics.highRisk > 1 ? 's need' : ' needs'} closer attention. Resolve terrain and clearance risks before moving to deployment.`
                        : 'Your next connection starts with a good plan. Compare cost, coverage and terrain before you commit.'}
                    </p>
                    <div className="insight-decoration">
                      <span />
                      <span />
                      <span />
                      <i />
                    </div>
                    <button
                      onClick={() => {
                        navigate('projects');
                        setStatus(metrics.highRisk ? 'High risk' : 'All statuses');
                      }}
                    >
                      {metrics.highRisk ? 'Review flagged routes' : 'Explore your projects'}{' '}
                      <ArrowUpRight size={16} />
                    </button>
                    <small>Based on planning risk scores</small>
                  </div>
                  <button className="review-prompt" onClick={() => navigate('approvals')}>
                    <span className="review-icon">
                      <FileCheck2 size={21} />
                    </span>
                    <span>
                      <b>{metrics.pending} plans need a next step</b>
                      <small>Keep good connections moving.</small>
                    </span>
                    <ArrowRight size={17} />
                  </button>
                </div>
              </section>
              <section className="panel project-panel">
                <div className="panel-heading">
                  <div>
                    <h2>
                      Route projects <span className="count-pill">{metrics.count}</span>
                    </h2>
                    <p>From first draft to the next connection</p>
                  </div>
                  <button className="text-button" onClick={() => navigate('projects')}>
                    View all projects <ArrowRight size={15} />
                  </button>
                </div>
                <PlansTable plans={filtered.slice(0, 4)} onOpen={setSelected} compact />
              </section>
              <div className="overview-bottom">
                <div className="activity-strip">
                  <span className="activity-orb">
                    <Activity size={17} />
                  </span>
                  <div>
                    <b>{workspace.activities[0]?.text}</b>
                    <small>{timeLabel(workspace.activities[0]?.date)}</small>
                  </div>
                </div>
                <span className="built-for">
                  <span className="tricolor-dot" /> Built for a more connected India.
                </span>
              </div>
            </>
          )}
          {page === 'planner' && <Planner onSave={addPlan} />}
          {page === 'projects' && (
            <section className="panel">
              <div className="table-toolbar">
                <div className="search-input">
                  <Search size={16} />
                  <input
                    aria-label="Search route projects"
                    placeholder="Search village, district or route ID…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <select
                  aria-label="Filter by route status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  {[
                    'All statuses',
                    'High risk',
                    'Draft',
                    'Under Review',
                    'Field Verification Required',
                    'Approved',
                    'Rejected',
                  ].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <span className="muted">{plans.length} routes</span>
              </div>
              <PlansTable plans={plans} onOpen={setSelected} />
            </section>
          )}
          {page === 'surveys' && (
            <section className="survey-grid">
              {workspace.surveys
                .filter(
                  (s) =>
                    district === 'All districts' ||
                    workspace.plans.find((p) => p.routeId === s.routeId)?.district === district,
                )
                .map((s) => (
                  <SurveyCard
                    key={s.routeId}
                    survey={s}
                    onSave={(next) =>
                      commit(
                        {
                          ...workspace,
                          surveys: workspace.surveys.map((item) =>
                            item.routeId === next.routeId ? next : item,
                          ),
                          activities: activity(
                            `Field survey updated for ${next.village}.`,
                            'survey',
                          ),
                        },
                        `Survey for ${next.village} saved.`,
                      )
                    }
                  />
                ))}
              {!workspace.surveys.some(
                (s) =>
                  district === 'All districts' ||
                  workspace.plans.find((p) => p.routeId === s.routeId)?.district === district,
              ) && (
                <EmptyState
                  title="No assigned surveys"
                  text="Select a route and request field verification to create a survey."
                />
              )}
            </section>
          )}
          {page === 'approvals' && (
            <>
              <div className="review-banner">
                <ShieldCheck size={23} />
                <div>
                  <b>{canReview ? 'Review workspace is active' : 'Explore the review workflow'}</b>
                  <p>
                    {canReview
                      ? 'Review the estimate and survey notes before recording your decision.'
                      : 'Select Review Authority below to try approval decisions in this local demo.'}
                  </p>
                </div>
                <select
                  aria-label="Demo role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  {roles.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </div>
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Review queue</h2>
                    <p>Plans awaiting a review or field verification</p>
                  </div>
                  <span className="count-pill">
                    {
                      filtered.filter((p) =>
                        ['Under Review', 'Field Verification Required'].includes(p.status),
                      ).length
                    }
                  </span>
                </div>
                <PlansTable
                  plans={filtered.filter((p) =>
                    ['Under Review', 'Field Verification Required'].includes(p.status),
                  )}
                  onOpen={setSelected}
                />
              </section>
              <p className="fine-print">
                Role selection demonstrates the workflow. It is not authentication or access
                control.
              </p>
            </>
          )}
          {page === 'reports' && (
            <Reports plans={filtered} metrics={metrics} onExport={exportCsv} onOpen={setSelected} />
          )}
          <footer className="workspace-footer">
            <span>
              FiberRoute AI <span className="footer-dot">·</span> Thoughtful planning. Meaningful
              connections.
            </span>
            <button onClick={() => setModal('method')}>
              About the estimates <ArrowUpRight size={12} />
            </button>
          </footer>
        </main>
      </div>
      {activeRoute && (
        <Modal
          title={activeRoute.village + ' connectivity plan'}
          subtitle={activeRoute.routeId}
          onClose={closeDetail}
          wide
        >
          <div className="detail-meta">
            <Badge status={activeRoute.status} />
            <span>
              {activeRoute.district} · {activeRoute.block || 'Block not specified'}
            </span>
            <span className="badge gray">
              {activeRoute.isDemo ? 'Sample record' : 'Local plan'}
            </span>
          </div>
          <div className="detail-metrics">
            <div>
              <span>Planned fiber</span>
              <b>
                {activeRoute.fiberLength} <small>km</small>
              </b>
            </div>
            <div>
              <span>Estimated cost</span>
              <b>{compactCurrency(activeRoute.estimatedCost)}</b>
            </div>
            <div>
              <span>Feasibility</span>
              <b>
                {activeRoute.feasibilityScore ?? '—'}
                <small>/100</small>
              </b>
            </div>
            <div>
              <span>Risk</span>
              <b>
                {riskLabel(activeRoute.riskScore)}
                <small> · {activeRoute.riskScore}/100</small>
              </b>
            </div>
          </div>
          <div className="detail-columns">
            <div>
              <h3>Planning recommendation</h3>
              <p>
                {activeRoute.note ||
                  activeRoute.recommendation ||
                  'Validate the proposed corridor with the field team. Check road access, crossing permissions and local distribution requirements before proceeding.'}
              </p>
              <h3>Required approvals</h3>
              <ul className="approval-list">
                {(
                  activeRoute.requiredApprovals || [
                    'Gram Panchayat consultation',
                    'Right-of-way and crossing review',
                    'Field survey validation',
                  ]
                ).map((a) => (
                  <li key={a}>
                    <CheckCircle2 size={15} />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
            <div className="cost-breakdown">
              <h3>Cost breakdown</h3>
              {activeRoute.civilCost ? (
                [
                  ['Civil works', activeRoute.civilCost],
                  ['Electronics', activeRoute.electronicsCost],
                  ['Approvals', activeRoute.approvalsCost],
                  ['Contingency', activeRoute.contingency],
                ].map(([label, amount]) => (
                  <div key={label}>
                    <span>{label}</span>
                    <b>{compactCurrency(amount)}</b>
                  </div>
                ))
              ) : (
                <p>Itemized costs were not included in this record.</p>
              )}
              <div className="total">
                <span>Total estimate</span>
                <b>{compactCurrency(activeRoute.estimatedCost)}</b>
              </div>
              <p>Timeline: {activeRoute.timeline || 'Requires survey'}</p>
            </div>
          </div>
          {workspace.surveys.find((s) => s.routeId === activeRoute.routeId) && (
            <div className="survey-detail">
              <h3>Field notes</h3>
              <p>
                {workspace.surveys.find((s) => s.routeId === activeRoute.routeId).remarks ||
                  'No remarks yet.'}
              </p>
              <Badge
                status={workspace.surveys.find((s) => s.routeId === activeRoute.routeId).status}
              />
            </div>
          )}
          <div className="modal-actions">
            <button className="button" onClick={() => exportReport(activeRoute)}>
              <Download size={16} /> Export report
            </button>
            <button
              className="button"
              onClick={() => {
                downloadFile(
                  JSON.stringify(activeRoute, null, 2),
                  `${activeRoute.routeId}.json`,
                  'application/json',
                );
                setToast('Route JSON downloaded.');
              }}
            >
              JSON
            </button>
            {activeRoute.status === 'Draft' && (
              <button
                className="button primary"
                onClick={() => updateStatus(activeRoute, 'Under Review')}
              >
                Submit for review <ArrowRight size={15} />
              </button>
            )}
            {['Draft', 'Under Review'].includes(activeRoute.status) && (
              <button
                className="button"
                onClick={() => {
                  const next = {
                    ...workspace,
                    plans: workspace.plans.map((p) =>
                      p.routeId === activeRoute.routeId
                        ? { ...p, status: 'Field Verification Required' }
                        : p,
                    ),
                    surveys: workspace.surveys.some((s) => s.routeId === activeRoute.routeId)
                      ? workspace.surveys
                      : [
                          ...workspace.surveys,
                          {
                            routeId: activeRoute.routeId,
                            village: activeRoute.village,
                            officer: 'Unassigned',
                            status: 'Assigned',
                            difficulty: riskLabel(activeRoute.riskScore),
                            remarks: '',
                            isDemo: activeRoute.isDemo,
                          },
                        ],
                    activities: activity(
                      `Field verification requested for ${activeRoute.village}.`,
                      'survey',
                    ),
                  };
                  commit(next, 'Field verification requested.');
                }}
              >
                Request survey
              </button>
            )}
            {canReview &&
              ['Under Review', 'Field Verification Required'].includes(activeRoute.status) && (
                <>
                  <button
                    className="button danger"
                    onClick={() => updateStatus(activeRoute, 'Rejected')}
                  >
                    Reject
                  </button>
                  <button
                    className="button primary"
                    onClick={() => updateStatus(activeRoute, 'Approved')}
                  >
                    <Check size={15} /> Approve plan
                  </button>
                </>
              )}
          </div>
          <p className="fine-print">
            Concept estimate only. Approval records a local workflow decision, not official
            permission.
          </p>
        </Modal>
      )}
      {modal && (
        <Modal
          title={
            {
              guide: 'Your next connection, step by step.',
              settings: 'Make this workspace yours.',
              activity: 'Workspace activity',
              method: 'What goes into an estimate?',
            }[modal]
          }
          onClose={closeModal}
        >
          {modal === 'guide' && (
            <div className="guide-steps">
              {[
                [
                  '01',
                  'Plan a route',
                  'Enter a village and planning assumptions. Compare lower-cost, faster and balanced approaches.',
                ],
                [
                  '02',
                  'Explore the corridor',
                  'Optionally search the map, choose endpoints and calculate a road route.',
                ],
                [
                  '03',
                  'Ground it in reality',
                  'Request a field survey. Capture the terrain difficulty and observations.',
                ],
                [
                  '04',
                  'Review and share',
                  'Try the review role, record a decision and download a planning report.',
                ],
              ].map(([n, title, text]) => (
                <div key={n}>
                  <span>{n}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </div>
              ))}
              <button
                className="button primary"
                onClick={() => {
                  closeModal();
                  navigate('planner');
                }}
              >
                Plan your first route <ArrowRight size={16} />
              </button>
            </div>
          )}
          {modal === 'settings' && (
            <div className="settings-content">
              <label className="field">
                <span>Demo workspace role</span>
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                  {roles.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
                <small>Try different workflows. This is not a secure sign-in.</small>
              </label>
              <div className="settings-data">
                <ShieldCheck size={22} />
                <div>
                  <h3>Your plans stay in this browser.</h3>
                  <p>
                    Routes, surveys and activity are stored locally. Clearing browser data removes
                    them. Export a backup before switching devices.
                  </p>
                </div>
              </div>
              <div className="modal-actions">
                <button
                  className="button primary"
                  onClick={() => {
                    downloadFile(
                      JSON.stringify(workspace, null, 2),
                      'fiberroute-workspace-backup.json',
                      'application/json',
                    );
                    setToast('Workspace backup downloaded.');
                  }}
                >
                  <Download size={16} /> Export workspace backup
                </button>
              </div>
              <p className="fine-print">
                {allMetrics.count} routes · {workspace.surveys.length} surveys · {sampleCount}{' '}
                sample records. No cloud account is connected.
              </p>
            </div>
          )}
          {modal === 'activity' && (
            <div className="activity-list">
              {workspace.activities.map((a) => (
                <div key={a.id}>
                  <span className="activity-orb">
                    {a.type === 'review' ? (
                      <FileCheck2 size={17} />
                    ) : a.type === 'survey' ? (
                      <MapPin size={17} />
                    ) : (
                      <Route size={17} />
                    )}
                  </span>
                  <div>
                    <b>{a.text}</b>
                    <small>{timeLabel(a.date)}</small>
                  </div>
                </div>
              ))}
            </div>
          )}
          {modal === 'method' && (
            <div className="method-copy">
              <p>
                FiberRoute AI is an independent concept-planning tool for rural broadband. It is not
                an official government portal.
              </p>
              <h3>Transparent, rules-based estimates</h3>
              <p>
                The model combines baseline distance, terrain, deployment priority, household
                coverage and clearance requirements. Civil works begin at an assumed ₹4,30,000 per
                kilometer, adjusted for terrain and strategy. Electronics, approvals and a 9–14%
                contingency are added.
              </p>
              <h3>Maps add context, not certainty</h3>
              <p>
                OSRM returns vehicle routes from OpenStreetMap. These do not confirm fiber
                right-of-way. Infrastructure counts reflect mapped features, not an exhaustive
                survey. Straight-line fallback is explicitly labeled.
              </p>
              <h3>Before a real deployment</h3>
              <p>
                Validate route geometry, permissions, equipment, cost assumptions and local
                conditions with qualified field teams. Feasibility and risk scores are planning
                heuristics, not engineering certifications.
              </p>
            </div>
          )}
        </Modal>
      )}
      {toast && <Toast message={toast} onClose={closeToast} />}
    </div>
  );
}
export default App;
