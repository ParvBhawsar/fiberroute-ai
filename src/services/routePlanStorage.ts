export interface RoutePoint {
  lat: number;
  lng: number;
}

export interface NearbyInfrastructureCounts {
  schools: number;
  hospitals: number;
  publicOffices: number;
  settlements: number;
  majorRoads: number;
}

export interface SavedRoutePlan {
  routeId: string;
  district: string;
  block: string;
  village: string;
  startPoint: RoutePoint | null;
  endPoint: RoutePoint | null;
  roadDistanceKm: number | null;
  estimatedCost: number | null;
  riskScore: number;
  feasibilityScore: number;
  status: string;
  nearbyInfrastructureCounts: NearbyInfrastructureCounts;
  recommendation: string;
  createdAt: string;
  updatedAt: string;
}

const ROUTE_PLANS_STORAGE_KEY = 'fiberroute-ai.routePlans.v1';

function readStoredPlans(): SavedRoutePlan[] {
  if (typeof window === 'undefined') return [];

  try {
    const rawValue = window.localStorage.getItem(ROUTE_PLANS_STORAGE_KEY);
    if (!rawValue) return [];
    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    throw new Error('Saved route records could not be read. Browser storage may be unavailable.');
  }
}

function writeStoredPlans(plans: SavedRoutePlan[]) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(ROUTE_PLANS_STORAGE_KEY, JSON.stringify(plans));
  } catch {
    throw new Error('Route record could not be saved. Browser storage may be full or unavailable.');
  }
}

export function getRoutePlans(): SavedRoutePlan[] {
  return readStoredPlans();
}

export function saveRoutePlan(plan: SavedRoutePlan): SavedRoutePlan {
  const currentPlans = readStoredPlans();
  const existingPlan = currentPlans.find((item) => item.routeId === plan.routeId);
  const timestamp = new Date().toISOString();
  const savedPlan = {
    ...plan,
    createdAt: existingPlan?.createdAt || plan.createdAt || timestamp,
    updatedAt: timestamp,
  };
  const nextPlans = [savedPlan, ...currentPlans.filter((item) => item.routeId !== plan.routeId)];
  writeStoredPlans(nextPlans);
  return savedPlan;
}

export function updateRoutePlanStatus(routeId: string, status: string): SavedRoutePlan {
  const currentPlans = readStoredPlans();
  const existingPlan = currentPlans.find((item) => item.routeId === routeId);

  if (!existingPlan) {
    throw new Error('Saved route record was not found.');
  }

  const updatedPlan = {
    ...existingPlan,
    status,
    updatedAt: new Date().toISOString(),
  };
  writeStoredPlans(currentPlans.map((item) => (item.routeId === routeId ? updatedPlan : item)));
  return updatedPlan;
}

export function deleteRoutePlan(routeId: string): void {
  const currentPlans = readStoredPlans();
  writeStoredPlans(currentPlans.filter((item) => item.routeId !== routeId));
}
