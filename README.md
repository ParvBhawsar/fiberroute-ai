# FiberRoute AI

A focused workspace for planning rural last-mile fiber connections. Compare route strategies, estimate investment, explore road corridors, capture field observations, and move plans through review.

FiberRoute AI is an independent prototype, not a government portal. Its recommendations are transparent, rules-based concept estimates. They are not surveyed engineering designs or verified contractor quotes.

## Workspace

- **Overview:** portfolio totals, an interactive illustrative network diagram, risk prompts, recent projects and activity.
- **Route planner:** three side-by-side strategies (lower cost, faster rollout, balanced), terrain and coverage assumptions, itemized costs, feasibility and risk scores.
- **GIS:** on-demand Leaflet/OpenStreetMap map, manual location search via Nominatim, map-click or coordinate-based endpoints, OSRM road routing, and nearby infrastructure from Overpass.
- **Route projects:** district, status, risk and text filters; route detail dialogs; survey requests; TXT and JSON reports.
- **Field surveys:** editable officer, progress, terrain difficulty and observations.
- **Review:** demonstration roles, submission, approval and rejection decisions.
- **Reports:** status and district-budget charts, portfolio CSV and complete JSON backup.

The ivory, forest-green and muted-orange visual system emphasizes geographic context and readable decisions. Map-centered workflows from [Felt](https://felt.com/industries/telecom) and [Mapbox](https://docs.mapbox.com/help/getting-started/maps/) informed the research; all interface code and the schematic network illustration are original.

## Run locally

Requires Node.js 22 or newer.

```sh
npm ci
npm run dev
npm test
npm run build
```

Vite outputs the production site to `dist/`. The repository's existing Vercel project uses the Vite preset. Branch pushes create previews through the Git integration. The production branch remains `main`.

```sh
npm run format
npm run format:check
```

## Data and migration

- Plans, survey edits and activity are stored in this browser under `fiberroute.workspace.v2`.
- Existing records in `fiberroute-ai.routePlans.v1` are migrated without changing the original key. User records and the four clearly labeled demonstration records coexist.
- Writes complete before success feedback. Malformed stored data is not overwritten; storage failures are shown to the user.
- Settings includes a full JSON workspace backup. Route reports and CSV exports are also available.
- Clearing site data removes local records. There is no cloud sync, secure authentication, multi-user authorization or backend database.
- The role selector demonstrates workflows only. It is deliberately not presented as a secure login.

No Supabase project is linked to this repository. Do not connect unrelated databases or place service-role keys in frontend code. A future shared workspace needs explicit project selection, authenticated users and ownership-based row-level policies before data moves to a backend.

## Estimation method

The original planning model is retained in `src/lib/planning.js`. It combines baseline distance, terrain, deployment priority, household and institution coverage, road availability, crossings and forest clearance. Civil works start from an assumed ₹4,30,000/km and are adjusted by terrain and priority. Electronics, approvals and a 9–14% contingency are added. Scores are deterministic heuristics, not AI predictions or engineering certifications.

The dashboard diagram is an **illustrative network**, not geographic route geometry. The optional live map uses actual OSM tiles and OSRM geometry. Vehicle routing is an access proxy, not a determination of fiber right-of-way. Straight-line fallback requires an explicit choice and is labeled in the UI and report. Nearby infrastructure counts are mapped features within 3 km and can be incomplete.

## External service limits

Map, search and routing calls only occur on user interaction. Search is submit-based, not autocomplete. Third-party timeouts and failures are surfaced without silently replacing road routes with straight lines. The map code is lazy-loaded.

Public OSM, Nominatim, OSRM and Overpass endpoints are suitable for modest prototype use and have no application SLA. Before scaling, configure a suitable provider or self-hosted services, an application-wide search rate limiter and shared caching. Nominatim's public limit is one request per second across the application; the browser guard is not a global multi-user rate limiter. Keep attribution visible. Google Fonts has system-font fallbacks.

## Source structure

```text
src/App.jsx                 Workspace state, navigation and overview
src/components/             Planner, live map, schematic map and UI components
src/lib/planning.js          Existing estimation model and sample portfolio
src/lib/workspace.js         Persistence, migration, metrics and safe exports
src/services/               Nominatim, OSRM, Overpass and request handling
src/styles.css              Responsive visual system
```

## Verification

`npm test` covers legacy migration, persistent decisions and surveys, corrupt data, storage failures, totals, cost reconciliation, constraints, strategy tradeoffs, unique record identifiers and CSV formula escaping. A production build is required before release.

Manual browser checks cover route creation, refresh persistence, review decisions, survey editing, report downloads, live routing, mobile navigation, and overflow. QA uses a local preview and local test records; no external database records are modified.
