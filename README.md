# FiberRoute AI

FiberRoute AI is a Phase 1 MVP for a government-style rural FiberNet planning and monitoring portal. It helps officials create last-mile fiber route plans for rural India, estimate cost and feasibility, review route risk, track survey status, and download an official-style planning report.

The current version is browser-only and uses mock authentication, mock records, and deterministic planning logic. It does not require a backend, database, real GIS API, or production login security.

## Problem Statement

Rural FiberNet planning often requires manual survey coordination, early cost estimation, route feasibility review, and multiple approval steps across district, state, field, and review teams. For a hackathon MVP, FiberRoute AI demonstrates how these workflows can be structured in one digital planning portal.

## Solution

The portal provides a realistic planning dashboard with:

- Role-based mock login
- Village-level route planning form
- Assisted planning recommendation
- Infrastructure cost and timeline estimates
- GIS-style mock map preview
- Plan review and approval workflow
- Field survey status updates
- Downloadable official-style planning report

## What Makes This Submission Relevant

- It is shaped like a departmental tool, not a marketing landing page.
- It covers the core planning workflow from village input to review and field verification.
- It demonstrates role-based operational views without needing a backend.
- It makes assumptions visible through feasibility, risk, cost components, approvals, and report disclaimers.
- It is lightweight enough for Phase 1 while leaving a clear path to real GIS and government integrations.

## User Roles

- District Planner: creates village FiberNet route plans, generates estimates, and submits plans for review.
- State Admin: views state-level planning metrics, district submitted plans, and mock approve or reject actions.
- Field Survey Officer: views assigned survey routes, updates survey status, marks terrain difficulty, and records field remarks.
- Review Authority: reviews route summary, cost, risk, feasibility, and marks plans approved, sent back, or requiring field verification.

## Features

- Government-style portal header, top strip, navigation, cards, tables, badges, and report sections
- Mock login screen with role selection
- Dynamic dashboard cards for route plans, villages covered, fiber length, budget, high-risk routes, approvals, and feasibility
- Recent activity feed that updates after route, review, and survey actions
- Expanded planner inputs for state, district, block, Gram Panchayat, village, terrain, household count, institutions, road availability, crossings, and forest clearance
- Generated route output with route ID, route type, fiber length, cost, household coverage, institution coverage, risk, feasibility, complexity, timeline, and required approvals
- Improved SVG GIS-style planning map with existing fiber node, proposed path, target village, Gram Panchayat boundary, right-of-way corridor, terrain zone, clearance/risk zone, proposed FDH, habitation cluster, crossings, chainage, legend, north arrow, scale, and route detail panel
- Plans, survey, and review tables with mock workflow actions
- `.txt` planning report download with official-style sections
- Responsive layout for mobile, tablet, and desktop

## Phase 1 Evaluation Notes

This MVP is designed to show product thinking and implementation feasibility:

- District officials can create a plan and submit it for review.
- State admins can monitor budget, risk, and approval status.
- Field officers can update survey status and terrain remarks.
- Review authorities can assess risk, cost, feasibility, and required approvals.
- Generated reports include location details, planning inputs, route output, cost, risk, approvals, next steps, and a clear MVP disclaimer.

The prototype intentionally avoids real authentication, real maps, and permanent storage so the hackathon version remains easy to run locally.

## Tech Stack

- React
- Vite
- Tailwind CSS
- lucide-react icons
- Browser-only mock data and deterministic logic

## How Codex Was Used

Codex was used to convert the original MVP into a more realistic Indian government-style GIS planning portal. The work included UI restructuring, role-based mock flows, planning logic improvements, map visualization, dashboard tables, report generation, responsive styling, README updates, and build verification.

## Local Setup

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

On Windows PowerShell, use `npm.cmd` if script execution policy blocks the `npm` shim:

```bash
npm.cmd install
npm.cmd run dev
npm.cmd run build
```

## Current MVP Status

- Phase 1 front-end portal is complete.
- Authentication is mocked. Any credentials work.
- Planning records, surveys, reviews, and activity feed are stored only in React state.
- Route estimates are deterministic and intended for demonstration, not real engineering approval.
- No backend, database, real map API, or government system integration is included yet.

## Future Scope

- Real GIS layers and official map tiles
- Satellite and terrain datasets
- Secure authentication and department-level access controls
- Backend persistence for plans, surveys, approvals, and reports
- Route optimization engine with right-of-way, cost, and terrain constraints
- OpenAI-powered planning assistant for DPR drafting and field query support
- State and national dashboards for rollout monitoring
