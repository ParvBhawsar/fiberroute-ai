import React, { Suspense, lazy, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  CircleHelp,
  Layers3,
  LoaderCircle,
  MapPin,
  RotateCcw,
  Route,
  Save,
  Search,
  SlidersHorizontal,
  Sparkles,
  TriangleAlert,
} from 'lucide-react';
import { generatePlan, initialForm, priorityProfiles, terrainProfiles } from '../lib/planning';
import { compactCurrency, newId } from '../lib/workspace';
import { calculateOsrmRoute, calculateStraightLineRoute } from '../services/osrm';
import { searchNominatimLocations } from '../services/nominatim';
import { fetchNearbyInfrastructure } from '../services/overpass';

const LiveMap = lazy(() => import('./LiveMap'));
const initialPoints = [
  { lat: 20.2014, lng: 73.8282 },
  { lat: 20.1307, lng: 73.8721 },
];
function Field({ label, children, hint }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

export default function Planner({ onSave }) {
  const [form, setForm] = useState(initialForm);
  const [points, setPoints] = useState(initialPoints);
  const [roadRoute, setRoadRoute] = useState(null);
  const [routeBusy, setRouteBusy] = useState(false);
  const [routeError, setRouteError] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searchBusy, setSearchBusy] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [focus, setFocus] = useState(null);
  const [infra, setInfra] = useState(null);
  const [infraBusy, setInfraBusy] = useState(false);
  const [infraError, setInfraError] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [saved, setSaved] = useState(false);
  const [coordinateDraft, setCoordinateDraft] = useState(
    initialPoints.map((p) => ({ lat: String(p.lat), lng: String(p.lng) })),
  );
  const [coordinateError, setCoordinateError] = useState('');
  const draftId = useRef(null);
  const generation = useRef(0);
  const infraGeneration = useRef(0);
  const searchTime = useRef(0);
  const estimated = useMemo(() => generatePlan(form), [form]);
  const scenarios = useMemo(
    () =>
      Object.keys(priorityProfiles).map((priority) => ({
        priority,
        ...generatePlan({ ...form, priority }),
      })),
    [form],
  );
  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }
  function changePoints(next) {
    generation.current += 1;
    infraGeneration.current += 1;
    setRouteBusy(false);
    setInfraBusy(false);
    setPoints(next.map((p) => ({ lat: p.lat, lng: p.lng })));
    setCoordinateDraft(
      [0, 1].map((i) => ({
        lat: next[i] ? next[i].lat.toFixed(5) : '',
        lng: next[i] ? next[i].lng.toFixed(5) : '',
      })),
    );
    setRoadRoute(null);
    setInfra(null);
    setRouteError('');
    setInfraError('');
    setSaved(false);
  }
  async function route() {
    const request = ++generation.current;
    setRouteBusy(true);
    setRouteError('');
    try {
      const result = await calculateOsrmRoute(points[0], points[1]);
      if (request !== generation.current) return;
      setRoadRoute(result);
      update('distance', result.distanceKm);
    } catch (e) {
      if (request === generation.current)
        setRouteError(e.message + ' You can explicitly use a straight-line estimate below.');
    } finally {
      if (request === generation.current) setRouteBusy(false);
    }
  }
  async function search(e) {
    e.preventDefault();
    if (Date.now() - searchTime.current < 1100) return;
    searchTime.current = Date.now();
    setSearchBusy(true);
    setSearchError('');
    setResults([]);
    try {
      setResults(await searchNominatimLocations(query));
    } catch (e) {
      setSearchError(e.message);
    } finally {
      setSearchBusy(false);
    }
  }
  async function loadInfra() {
    const request = ++infraGeneration.current;
    setInfraBusy(true);
    setInfraError('');
    try {
      const result = await fetchNearbyInfrastructure(points[1].lat, points[1].lng);
      if (request === infraGeneration.current) setInfra(result);
    } catch (e) {
      if (request === infraGeneration.current) setInfraError(e.message);
    } finally {
      if (request === infraGeneration.current) setInfraBusy(false);
    }
  }
  function save(e) {
    e.preventDefault();
    draftId.current ||= `FRAI-${form.district.slice(0, 3).toUpperCase()}-${newId().slice(0, 8).toUpperCase()}`;
    const record = {
      ...estimated,
      ...form,
      fiberLength: estimated.fiberLength,
      routeId: draftId.current,
      status: 'Draft',
      isDemo: false,
      startPoint: points[0] || null,
      endPoint: points[1] || null,
      roadRoute,
      infrastructure: infra,
      form: { ...form },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (onSave(record)) setSaved(true);
  }
  function applyCoordinates() {
    const next = coordinateDraft.map((p) => ({ lat: Number(p.lat), lng: Number(p.lng) }));
    if (
      coordinateDraft.some((p) => !p.lat.trim() || !p.lng.trim()) ||
      next.some(
        (p) =>
          !Number.isFinite(p.lat) ||
          Math.abs(p.lat) > 90 ||
          !Number.isFinite(p.lng) ||
          Math.abs(p.lng) > 180,
      )
    ) {
      setCoordinateError(
        'Enter valid latitude (−90 to 90) and longitude (−180 to 180) for both points.',
      );
      return;
    }
    setCoordinateError('');
    changePoints(next);
    setShowMap(true);
  }
  return (
    <div className="planner-layout">
      <form className="panel planner-form" onSubmit={save}>
        <div className="panel-heading">
          <div>
            <p className="eyebrow">01 / DEFINE YOUR ROUTE</p>
            <h2>A connection worth planning.</h2>
          </div>
          <span className="icon-tile">
            <Route size={19} />
          </span>
        </div>
        <div className="form-body">
          <div className="form-grid">
            <Field label="State">
              <input
                required
                maxLength={80}
                value={form.state}
                onChange={(e) => update('state', e.target.value)}
              />
            </Field>
            <Field label="District">
              <input
                required
                maxLength={80}
                value={form.district}
                onChange={(e) => update('district', e.target.value)}
              />
            </Field>
            <Field label="Block / taluka">
              <input
                required
                maxLength={80}
                value={form.block}
                onChange={(e) => update('block', e.target.value)}
              />
            </Field>
            <Field label="Target village">
              <input
                required
                maxLength={100}
                value={form.village}
                onChange={(e) => update('village', e.target.value)}
              />
            </Field>
          </div>
          <Field label="Gram Panchayat">
            <input
              required
              maxLength={120}
              value={form.gramPanchayat}
              onChange={(e) => update('gramPanchayat', e.target.value)}
            />
          </Field>
          <div className="form-section-title">
            <SlidersHorizontal size={15} /> Planning assumptions
          </div>
          <div className="form-grid">
            <Field
              label="Baseline distance (km)"
              hint={
                roadRoute
                  ? roadRoute.source === 'osrm'
                    ? 'From calculated road route'
                    : 'Straight-line distance'
                  : 'Manual planning assumption'
              }
            >
              <input
                required
                type="number"
                min="0.5"
                max="1000"
                step="0.01"
                value={form.distance}
                onChange={(e) => {
                  update('distance', e.target.value);
                  setRoadRoute(null);
                }}
              />
            </Field>
            <Field label="Terrain">
              <select value={form.terrain} onChange={(e) => update('terrain', e.target.value)}>
                {Object.keys(terrainProfiles).map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Households">
              <input
                type="number"
                required
                min="1"
                max="1000000"
                step="1"
                value={form.households}
                onChange={(e) => update('households', e.target.value)}
              />
            </Field>
            <Field label="Public institutions">
              <input
                type="number"
                required
                min="0"
                max="10000"
                step="1"
                value={form.institutions}
                onChange={(e) => update('institutions', e.target.value)}
              />
            </Field>
          </div>
          <div className="check-list">
            {[
              ['roadAvailable', 'Existing road corridor'],
              ['crossingRequired', 'River or road crossing'],
              ['forestClearance', 'Forest clearance needed'],
            ].map(([key, label]) => (
              <label key={key}>
                <input
                  type="checkbox"
                  checked={form[key] === 'Yes'}
                  onChange={(e) => update(key, e.target.checked ? 'Yes' : 'No')}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
          <button className="button primary full" type="submit" disabled={saved}>
            {saved ? <Check size={17} /> : <Save size={17} />}
            {saved ? 'Plan saved to workspace' : 'Save route plan'}
          </button>
          <p className="fine-print">
            <CircleHelp size={13} /> Concept estimates for planning. Validate through a field
            survey.
          </p>
        </div>
      </form>
      <div className="planner-results">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">02 / COMPARE APPROACHES</p>
              <h2>Find your best-fit route.</h2>
            </div>
            <Sparkles size={19} className="orange-text" />
          </div>
          <div className="scenario-grid">
            {scenarios.map((s) => (
              <button
                key={s.priority}
                className={'scenario ' + (form.priority === s.priority ? 'selected' : '')}
                onClick={() => update('priority', s.priority)}
                aria-pressed={form.priority === s.priority}
              >
                <span>
                  {s.priority === 'Balanced'
                    ? 'Balanced'
                    : s.priority === 'Cost Optimized'
                      ? 'Lower cost'
                      : 'Faster rollout'}
                  {form.priority === s.priority && <Check size={14} />}
                </span>
                <strong>{compactCurrency(s.estimatedCost)}</strong>
                <small>
                  {s.fiberLength} km · {s.timeline}
                </small>
              </button>
            ))}
          </div>
          <div className="estimate-summary">
            <div>
              <span>Feasibility</span>
              <b>
                {estimated.feasibilityScore}
                <small>/100</small>
              </b>
            </div>
            <div>
              <span>Risk level</span>
              <b className={estimated.riskScore >= 75 ? 'orange-text' : ''}>
                {estimated.complexity}
              </b>
            </div>
            <div>
              <span>Households reached</span>
              <b>{estimated.householdsCovered.toLocaleString('en-IN')}</b>
            </div>
          </div>
          <div className="recommendation">
            <Sparkles size={17} />
            <div>
              <b>Planning recommendation</b>
              <p>
                {estimated.routeType}. Estimated mix: {estimated.ductKm} km underground and{' '}
                {estimated.aerialKm} km aerial.
              </p>
              <small>Rules-based estimate · assumptions shown in your report</small>
            </div>
          </div>
        </section>
        <section className="panel routing-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">03 / EXPLORE THE CORRIDOR</p>
              <h2>Put your plan on the map.</h2>
            </div>
            <span className="badge gray">Optional GIS step</span>
          </div>
          <form className="location-search" onSubmit={search}>
            <Search size={16} />
            <input
              aria-label="Search Indian location"
              placeholder="Search a village, district or landmark…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              minLength={2}
            />
            <button className="button small" disabled={searchBusy || query.trim().length < 2}>
              {searchBusy ? <LoaderCircle size={15} className="spin" /> : 'Search'}
            </button>
          </form>
          {searchError && <p className="inline-error">{searchError}</p>}
          {results.length > 0 && (
            <div className="search-results">
              {results.map((r) => (
                <button
                  key={r.placeId}
                  onClick={() => {
                    setFocus(r);
                    setShowMap(true);
                    setResults([]);
                    setQuery(r.displayName);
                  }}
                >
                  <MapPin size={15} />
                  <span>{r.displayName}</span>
                  <ArrowRight size={15} />
                </button>
              ))}
            </div>
          )}
          {showMap ? (
            <Suspense
              fallback={
                <div className="map-placeholder">
                  <LoaderCircle className="spin" />
                  <p>Loading route map…</p>
                </div>
              }
            >
              <LiveMap
                points={points}
                onPointsChange={changePoints}
                route={roadRoute}
                focus={focus}
                infrastructure={infra?.features}
              />
            </Suspense>
          ) : (
            <div className="map-placeholder">
              <div className="map-placeholder-lines" />
              <span className="map-placeholder-icon">
                <MapPin size={27} />
              </span>
              <h3>A little local context goes a long way.</h3>
              <p>Explore roads and place two endpoints on OpenStreetMap.</p>
              <button className="button" onClick={() => setShowMap(true)}>
                <Layers3 size={16} /> Open interactive map
              </button>
            </div>
          )}
          <div className="map-instructions">
            <span>
              <i className="endpoint a">A</i> Existing fiber node <ArrowRight size={13} />{' '}
              <i className="endpoint b">B</i> Target village
            </span>
            <button className="text-button" onClick={() => changePoints([])}>
              <RotateCcw size={13} /> Reset
            </button>
          </div>
          <div className="coordinate-fields">
            {[0, 1].map((i) => (
              <div key={i}>
                <span className={`endpoint ${i === 0 ? 'a' : 'b'}`}>{i === 0 ? 'A' : 'B'}</span>
                {['lat', 'lng'].map((key) => (
                  <input
                    key={key}
                    aria-label={`${i === 0 ? 'Start' : 'End'} ${key === 'lat' ? 'latitude' : 'longitude'}`}
                    value={coordinateDraft[i][key]}
                    placeholder={key === 'lat' ? 'Latitude' : 'Longitude'}
                    onChange={(e) =>
                      setCoordinateDraft((prev) =>
                        prev.map((p, index) => (index === i ? { ...p, [key]: e.target.value } : p)),
                      )
                    }
                  />
                ))}
              </div>
            ))}
            <button className="button small" onClick={applyCoordinates}>
              Apply points
            </button>
          </div>
          {coordinateError && <p className="inline-error">{coordinateError}</p>}
          <div className="map-actions">
            <button
              className="button primary"
              disabled={points.length !== 2 || routeBusy}
              onClick={route}
            >
              {routeBusy ? <LoaderCircle size={15} className="spin" /> : <Route size={15} />}{' '}
              Calculate road route
            </button>
            <button
              className="button"
              disabled={points.length !== 2 || infraBusy}
              onClick={loadInfra}
            >
              {infraBusy ? <LoaderCircle size={15} className="spin" /> : <Layers3 size={15} />}{' '}
              Nearby infrastructure
            </button>
          </div>
          {routeError && (
            <div className="api-notice">
              <TriangleAlert size={16} />
              <div>
                {routeError}
                <button
                  className="text-button"
                  onClick={() => {
                    const r = calculateStraightLineRoute(points[0], points[1]);
                    setRoadRoute(r);
                    update('distance', r.distanceKm);
                    setRouteError('');
                  }}
                >
                  Use straight-line estimate <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
          {roadRoute && (
            <div className="api-notice success">
              <Check size={17} />
              <div>
                <b>
                  {roadRoute.distanceKm} km ·{' '}
                  {roadRoute.source === 'osrm' ? 'Road-following route' : 'Straight-line estimate'}
                </b>
                <p>
                  {roadRoute.source === 'osrm'
                    ? 'Road distance applied to your estimate. This is a vehicle-access route, not verified fiber right-of-way.'
                    : 'This line does not follow roads or account for obstacles. Field validation is essential.'}
                </p>
              </div>
            </div>
          )}
          {infraError && <p className="inline-error">{infraError}</p>}
          {infra && (
            <div className="infra-summary">
              {Object.entries(infra.summary).map(([key, count]) => (
                <div key={key}>
                  <b>{count}</b>
                  <span>
                    {
                      {
                        schools: 'Schools',
                        healthcare: 'Healthcare',
                        publicOffices: 'Offices',
                        settlements: 'Settlements',
                        majorRoads: 'Road features',
                      }[key]
                    }
                  </span>
                </div>
              ))}
              <p>OSM features within 3 km of endpoint B · may be incomplete</p>
            </div>
          )}
          <p className="map-attribution">
            Search & map data © OpenStreetMap contributors · road routing by OSRM
          </p>
        </section>
      </div>
    </div>
  );
}
