import { UserFacingApiError, requestJson } from './apiClient';

export interface RouteCoordinate {
  lat: number;
  lng: number;
}

export interface OsrmRouteResult {
  distanceKm: number;
  durationMinutes: number;
  geometry: GeoJSON.LineString;
  source: 'osrm' | 'straight-line';
}

interface OsrmRouteResponse {
  code?: string;
  message?: string;
  routes?: Array<{
    distance?: number;
    duration?: number;
    geometry?: GeoJSON.LineString;
  }>;
}

const OSRM_ROUTE_URL = 'https://router.project-osrm.org/route/v1/driving';
const OSRM_TIMEOUT_MS = 10000;

function isValidCoordinate(point: RouteCoordinate) {
  return (
    Number.isFinite(point?.lat) &&
    Number.isFinite(point?.lng) &&
    point.lat >= -90 &&
    point.lat <= 90 &&
    point.lng >= -180 &&
    point.lng <= 180
  );
}

export async function calculateOsrmRoute(start: RouteCoordinate, end: RouteCoordinate): Promise<OsrmRouteResult> {
  if (!isValidCoordinate(start) || !isValidCoordinate(end)) {
    throw new UserFacingApiError('Select valid start and end coordinates before calculating a road route.');
  }

  const coordinates = `${start.lng},${start.lat};${end.lng},${end.lat}`;
  const params = new URLSearchParams({
    overview: 'full',
    geometries: 'geojson',
    steps: 'false',
  });

  const data = await requestJson<OsrmRouteResponse>(`${OSRM_ROUTE_URL}/${coordinates}?${params.toString()}`, {
    serviceName: 'Road route service',
    timeoutMs: OSRM_TIMEOUT_MS,
  });
  const route = data.routes?.[0];

  if (data.code && data.code !== 'Ok') {
    throw new UserFacingApiError('A road-following route could not be calculated for the selected points.');
  }

  if (!route?.geometry?.coordinates?.length || !Number.isFinite(route.distance) || !Number.isFinite(route.duration)) {
    throw new UserFacingApiError('No road-following route was found. Select points closer to the road network.');
  }

  return {
    distanceKm: Number(((route.distance || 0) / 1000).toFixed(2)),
    durationMinutes: Math.max(1, Math.round((route.duration || 0) / 60)),
    geometry: route.geometry,
    source: 'osrm',
  };
}

export function calculateStraightLineRoute(start: RouteCoordinate, end: RouteCoordinate): OsrmRouteResult {
  if (!isValidCoordinate(start) || !isValidCoordinate(end)) {
    throw new UserFacingApiError('Select valid start and end coordinates before calculating a fallback route.');
  }

  const earthRadiusKm = 6371;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latDelta = toRadians(end.lat - start.lat);
  const lngDelta = toRadians(end.lng - start.lng);
  const startLat = toRadians(start.lat);
  const endLat = toRadians(end.lat);
  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(lngDelta / 2) ** 2;
  const distanceKm = Number((earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2));

  return {
    distanceKm,
    durationMinutes: Math.max(1, Math.round(distanceKm * 4)),
    geometry: {
      type: 'LineString',
      coordinates: [
        [start.lng, start.lat],
        [end.lng, end.lat],
      ],
    },
    source: 'straight-line',
  };
}
