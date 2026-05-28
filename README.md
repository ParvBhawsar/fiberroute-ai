# FiberRoute AI

FiberRoute AI is a Phase 1 MVP for AI-assisted GIS planning of last-mile FiberNet connectivity in rural India. It helps government teams and telecom planners enter basic rural connectivity inputs and instantly produce a suggested route plan, cost estimate, risk analysis, visual route preview, and downloadable implementation report.

The product is intentionally browser-only for the hackathon demo. It uses mock data and deterministic planning logic so judges can test different village scenarios and see consistent, explainable outputs without needing a backend.

## Features

- Modern React + Vite + Tailwind CSS interface
- Planner form for village, district, state, fiber-node distance, terrain, household count, and planning priority
- Deterministic planning model for consistent demo outputs
- AI-style route dashboard with route type, length, cost, cost per covered household, households covered, risk, complexity, timeline, and confidence
- SVG GIS-style route preview with source node, route line, target village, and terrain markers
- Summary report with problem, proposed route, cost estimate, risks, next steps, and `.txt` download
- Fully responsive layout for desktop and mobile

## Planning Logic

The MVP estimates route length, project cost, risk, coverage, and deployment timeline using transparent assumptions:

- Terrain changes route length, cost, and risk.
- Priority changes the aerial/trench route mix and timeline.
- Household count affects local distribution length, electronics cost, and coverage.
- Risk drivers are surfaced in plain language for field validation.

This is not a replacement for a real survey or GIS optimizer. It is a credible Phase 1 simulation of how an AI planning assistant could structure early decisions.

## Tech Stack

- React
- Vite
- Tailwind CSS
- lucide-react icons
- Browser-only Phase 1 architecture with no backend

## Setup

Install dependencies:

```bash
npm install
```

On Windows PowerShell, use `npm.cmd` if script execution policy blocks the `npm` shim.

Start the local development server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

If using PowerShell with the default script policy, the equivalent commands are:

```bash
npm.cmd install
npm.cmd run dev
npm.cmd run build
```

## How Codex Was Used

Codex was used for rapid MVP development, UI generation, deterministic planning logic, report-download implementation, responsive styling, and build-error fixing. The result is a hackathon-ready Phase 1 product that can later be connected to real GIS datasets, satellite imagery, route optimization engines, and an OpenAI-powered planning assistant.

## Future Scope

- Real GIS layers and map tiles
- Satellite data and terrain overlays
- OpenAI-powered planning assistant
- Government dashboard for multi-village rollout planning
- Route optimization engine with right-of-way and cost constraints
