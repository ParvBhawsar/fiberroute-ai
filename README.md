# FiberRoute AI

FiberRoute AI is a government-style rural FiberNet planning and monitoring portal for last-mile broadband infrastructure. It provides role-based workspaces for route planning, feasibility estimation, GIS-style review, field verification, approval tracking, and planning report generation.

## Product Overview

The portal is designed for public infrastructure teams that need a structured way to plan rural fiber routes, compare risk and cost, coordinate survey updates, and move plans through review. The current implementation is a front-end application with local state and deterministic planning logic.

## Problem Statement

Rural broadband planning requires coordination across district planners, state administrators, survey officers, and review authorities. Early route decisions need location inputs, terrain constraints, household coverage, public institution coverage, approvals, feasibility, risk, and cost estimates before a detailed DPR can be finalized.

## Proposed Solution

FiberRoute AI brings these steps into one operational control panel:

- Authorized role-based portal access
- Village-level route planning form
- Infrastructure estimate and feasibility summary
- GIS-style planning map with route, boundary, risk, road, and crossing layers
- Plans, survey, and review tables
- Recent activity feed
- Route planning report download

## Target Users

- District broadband planning teams
- State digital infrastructure departments
- Field survey officers
- Technical review and approval authorities
- Program monitoring teams for rural connectivity rollout

## User Roles

- District Planner: creates route plans, generates estimates, and submits plans for review.
- State Admin: monitors plans, budgets, risk concentration, and approval status across districts.
- Field Survey Officer: updates assigned route surveys, terrain difficulty, and field remarks.
- Review Authority: reviews feasibility, cost, risk, approvals, and field verification requirements.

## Features

- Official portal-style login screen with role selection
- Government-style header, sidebar navigation, cards, tables, badges, and report sections
- Dynamic KPI cards for route plans, villages, planned fiber length, budget, risk, and feasibility
- Expanded route planning form with administrative, coverage, terrain, road, crossing, and clearance inputs
- Assisted Planning Recommendation with infrastructure estimate, risk, feasibility, timeline, and required approvals
- SVG-based GIS planning map with Gram Panchayat boundary, existing fiber node, proposed route, target village, road line, river/railway crossing, terrain risk zone, legend, north arrow, scale indicator, and route metadata
- Plans table, survey table, review table, and status workflow actions
- Recent activity feed that updates after planning, review, and survey actions
- Text report download with location details, planning inputs, infrastructure estimate, risk and feasibility summary, required approvals, and next recommended actions
- Responsive layout for desktop, laptop, tablet, and mobile

## Tech Stack

- React
- Vite
- Tailwind CSS
- lucide-react icons
- Browser local state and deterministic planning logic

## How Codex Was Used

Codex was used to develop and refine the portal UI, role-based workflows, route planning logic, GIS-style SVG map, responsive control-panel layout, status tables, report generation, documentation, and build verification.

## Current Status

- Front-end portal is implemented.
- Role-based login flow is available for local use.
- Route planning, dashboard metrics, tables, activity feed, GIS preview, and report download are functional.
- Planning records are stored in browser state during the session.
- Route outputs use deterministic estimation logic for local operation.
- No backend, database, real authentication, payment, or real map API is included.

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

## Deployment Steps

Create a production build:

```bash
npm run build
```

Deploy the generated `dist` folder to any static hosting platform, internal web server, or object storage static-site hosting service.

## Future Scope

- Backend persistence for plans, surveys, reviews, and reports
- Secure authentication and department-level role management
- Real GIS layers, official map tiles, and satellite or terrain overlays
- Route optimization with right-of-way, terrain, clearance, and cost constraints
- DPR generation workflow and document exports
- Integration with state and national broadband monitoring dashboards
