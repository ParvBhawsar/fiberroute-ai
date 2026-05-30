export interface FiberRouteCostAssumptions {
  fiberLayingCostPerKm: number;
  surveyApprovalOverhead: number;
  complexityMultiplier: number;
}

export interface FiberRouteCostEstimate {
  distanceKm: number;
  surveyTimeMinutes: number;
  baseFiberLayingCost: number;
  overheadCost: number;
  complexityMultiplier: number;
  totalProjectCost: number;
}

export const FIBER_ROUTE_COST_ASSUMPTIONS: FiberRouteCostAssumptions = {
  fiberLayingCostPerKm: 120000,
  surveyApprovalOverhead: 25000,
  complexityMultiplier: 1.15,
};

export function estimateFiberRouteCost(
  distanceKm: number,
  surveyTimeMinutes: number,
  assumptions = FIBER_ROUTE_COST_ASSUMPTIONS,
): FiberRouteCostEstimate {
  const safeDistanceKm = Math.max(Number(distanceKm) || 0, 0);
  const safeSurveyTimeMinutes = Math.max(Math.round(Number(surveyTimeMinutes) || 0), 0);
  const baseFiberLayingCost = Math.round(safeDistanceKm * assumptions.fiberLayingCostPerKm);
  const totalProjectCost = Math.round(
    safeDistanceKm * assumptions.fiberLayingCostPerKm * assumptions.complexityMultiplier +
      assumptions.surveyApprovalOverhead,
  );

  return {
    distanceKm: safeDistanceKm,
    surveyTimeMinutes: safeSurveyTimeMinutes,
    baseFiberLayingCost,
    overheadCost: assumptions.surveyApprovalOverhead,
    complexityMultiplier: assumptions.complexityMultiplier,
    totalProjectCost,
  };
}
