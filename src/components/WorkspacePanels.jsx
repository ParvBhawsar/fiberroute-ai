import React, { useState } from 'react';
import { Activity, ArrowDownToLine, Check, FileCheck2, FileText, MapPin } from 'lucide-react';
import { Badge, EmptyState, PlansTable } from './ui';
import { compactCurrency } from '../lib/workspace';

export function Stat({ icon: Icon, label, value, unit, detail, accent }) {
  return (
    <article className="stat-card">
      <div className="stat-top">
        <span>{label}</span>
        <span className={`stat-icon ${accent}`}>
          <Icon size={18} strokeWidth={1.7} />
        </span>
      </div>
      <div className="stat-value">
        {value}
        {unit && <small>{unit}</small>}
      </div>
      <p>
        <span className={`stat-indicator ${accent}`} />
        {detail}
      </p>
    </article>
  );
}
export function SurveyCard({ survey, onSave }) {
  const [draft, setDraft] = useState(survey);
  const [dirty, setDirty] = useState(false);
  function update(key, value) {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }
  return (
    <form
      className="panel survey-card"
      onSubmit={(e) => {
        e.preventDefault();
        if (onSave(draft)) setDirty(false);
      }}
    >
      <div className="panel-heading">
        <div>
          <span className="eyebrow">
            {survey.isDemo ? 'SAMPLE FIELD SURVEY' : 'FIELD VERIFICATION'}
          </span>
          <h2>{survey.village}</h2>
        </div>
        <MapPin size={20} />
      </div>
      <div className="form-body">
        <Badge status={draft.status} />
        <p className="route-id-label">{survey.routeId}</p>
        <label className="field">
          <span>Assigned officer</span>
          <input
            required
            value={draft.officer}
            maxLength={100}
            onChange={(e) => update('officer', e.target.value)}
          />
        </label>
        <div className="form-grid">
          <label className="field">
            <span>Survey status</span>
            <select value={draft.status} onChange={(e) => update('status', e.target.value)}>
              {['Assigned', 'In Progress', 'Completed'].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Terrain difficulty</span>
            <select value={draft.difficulty} onChange={(e) => update('difficulty', e.target.value)}>
              {['Low', 'Medium', 'High'].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="field">
          <span>Field observations</span>
          <textarea
            rows={4}
            maxLength={2000}
            value={draft.remarks}
            onChange={(e) => update('remarks', e.target.value)}
            placeholder="Access, crossings, poles, clearance requirements…"
          />
        </label>
        <button className="button primary full" disabled={!dirty}>
          <Check size={15} />
          {dirty ? 'Save survey update' : 'Survey saved'}
        </button>
      </div>
    </form>
  );
}
export function Reports({ plans, metrics, onExport, onOpen }) {
  const counts = [
    'Draft',
    'Under Review',
    'Field Verification Required',
    'Approved',
    'Rejected',
  ].map((status) => ({ status, count: plans.filter((p) => p.status === status).length }));
  const districtTotals = [...new Set(plans.map((p) => p.district))]
    .map((name) => ({
      name,
      cost: plans.filter((p) => p.district === name).reduce((s, p) => s + p.estimatedCost, 0),
    }))
    .sort((a, b) => b.cost - a.cost);
  return (
    <>
      <div className="reports-grid">
        <section className="panel report-card">
          <div className="panel-heading">
            <div>
              <h2>From draft to deployment.</h2>
              <p>Where your route portfolio stands</p>
            </div>
            <FileCheck2 size={20} />
          </div>
          <div className="status-chart">
            {counts.map(({ status, count }) => (
              <div key={status}>
                <span>
                  <Badge status={status} />
                  <b>{count}</b>
                </span>
                <div className="bar-track">
                  <i style={{ width: `${metrics.count ? (count / metrics.count) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="panel report-card">
          <div className="panel-heading">
            <div>
              <h2>Investment by district.</h2>
              <p>Indicative costs across your plans</p>
            </div>
            <Activity size={20} />
          </div>
          <div className="budget-chart">
            {districtTotals.map((d) => (
              <div key={d.name}>
                <span>
                  <b>{d.name}</b>
                  <strong>{compactCurrency(d.cost)}</strong>
                </span>
                <div className="bar-track">
                  <i
                    style={{ width: `${metrics.budget ? (d.cost / metrics.budget) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
            {!districtTotals.length && <EmptyState />}
          </div>
        </section>
      </div>
      <section className="report-export">
        <span className="export-icon">
          <FileText size={27} />
        </span>
        <div>
          <h2>Your data, ready for the next conversation.</h2>
          <p>
            Download a CSV for analysis, or open a route to export its detailed planning report.
          </p>
        </div>
        <button className="button primary" onClick={onExport}>
          <ArrowDownToLine size={16} /> Export portfolio CSV
        </button>
      </section>
      <section className="panel">
        <div className="panel-heading">
          <h2>Individual route reports</h2>
          <span className="badge gray">{plans.length} available</span>
        </div>
        <PlansTable plans={plans} onOpen={onOpen} compact />
      </section>
    </>
  );
}
