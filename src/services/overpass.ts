import { UserFacingApiError, requestJson } from './apiClient';

export type InfrastructureCategory = 'school' | 'healthcare' | 'publicOffice' | 'settlement' | 'majorRoad';

export interface InfrastructureFeature {
  id: string;
  category: InfrastructureCategory;
  name: string;
  lat: number;
  lng: number;
  sourceType: 'node' | 'way' | 'relation';
}

export interface InfrastructureSummary {
  schools: number;
  healthcare: number;
  publicOffices: number;
  settlements: number;
  majorRoads: number;
}

export interface InfrastructureResponse {
  features: InfrastructureFeature[];
  summary: InfrastructureSummary;
}

interface OverpassElement {
  id: number;
  type: 'node' | 'way' | 'relation';
  lat?: number;
  lon?: number;
  center?: {
    lat?: number;
    lon?: number;
  };
  tags?: Record<string, string>;
}

const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';
const OVERPASS_TIMEOUT_MS = 18000;
export const DEFAULT_INFRASTRUCTURE_RADIUS_METERS = 3000;

function buildOverpassQuery(lat: number, lng: number, radiusMeters: number) {
  return `
    [out:json][timeout:25];
    (
      nwr["amenity"="school"](around:${radiusMeters},${lat},${lng});
      nwr["amenity"~"hospital|clinic"](around:${radiusMeters},${lat},${lng});
      nwr["office"="government"](around:${radiusMeters},${lat},${lng});
      nwr["amenity"~"townhall|courthouse|police|post_office"](around:${radiusMeters},${lat},${lng});
      nwr["building"~"government|public"](around:${radiusMeters},${lat},${lng});
      nwr["place"~"village|hamlet|town|locality"](around:${radiusMeters},${lat},${lng});
      way["highway"~"motorway|trunk|primary|secondary|tertiary"](around:${radiusMeters},${lat},${lng});
    );
    out center tags 80;
  `;
}

function categoryFor(tags: Record<string, string> = {}): InfrastructureCategory | null {
  if (tags.amenity === 'school') return 'school';
  if (tags.amenity === 'hospital' || tags.amenity === 'clinic') return 'healthcare';
  if (
    tags.office === 'government' ||
    ['townhall', 'courthouse', 'police', 'post_office'].includes(tags.amenity || '') ||
    tags.building === 'government' ||
    tags.building === 'public'
  ) {
    return 'publicOffice';
  }
  if (['village', 'hamlet', 'town', 'locality'].includes(tags.place || '')) return 'settlement';
  if (tags.highway) return 'majorRoad';
  return null;
}

function displayNameFor(element: OverpassElement, category: InfrastructureCategory) {
  const tags = element.tags || {};
  const fallbackNames = {
    school: 'School',
    healthcare: 'Health facility',
    publicOffice: 'Public office / building',
    settlement: 'Settlement',
    majorRoad: 'Major road',
  };

  return tags.name || tags['name:en'] || tags.ref || tags.highway || fallbackNames[category];
}

function summarize(features: InfrastructureFeature[]): InfrastructureSummary {
  return {
    schools: features.filter((item) => item.category === 'school').length,
    healthcare: features.filter((item) => item.category === 'healthcare').length,
    publicOffices: features.filter((item) => item.category === 'publicOffice').length,
    settlements: features.filter((item) => item.category === 'settlement').length,
    majorRoads: features.filter((item) => item.category === 'majorRoad').length,
  };
}

export async function fetchNearbyInfrastructure(
  lat: number,
  lng: number,
  radiusMeters = DEFAULT_INFRASTRUCTURE_RADIUS_METERS,
): Promise<InfrastructureResponse> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new UserFacingApiError('Select a valid planning point before fetching nearby infrastructure.');
  }

  const safeRadiusMeters = Math.max(500, Math.min(Math.round(radiusMeters), 10000));
  const body = new URLSearchParams({
    data: buildOverpassQuery(lat, lng, safeRadiusMeters),
  });

  const data = await requestJson<{ elements?: OverpassElement[] }>(OVERPASS_API_URL, {
    method: 'POST',
    body,
    serviceName: 'Nearby infrastructure service',
    timeoutMs: OVERPASS_TIMEOUT_MS,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
  });
  const features = (data.elements || [])
    .map((element) => {
      const latValue = element.lat ?? element.center?.lat;
      const lngValue = element.lon ?? element.center?.lon;
      const category = categoryFor(element.tags);

      if (!category || !Number.isFinite(latValue) || !Number.isFinite(lngValue)) return null;

      return {
        id: `${element.type}-${element.id}`,
        category,
        name: displayNameFor(element, category),
        lat: Number(latValue),
        lng: Number(lngValue),
        sourceType: element.type,
      };
    })
    .filter((item): item is InfrastructureFeature => Boolean(item));

  return {
    features,
    summary: summarize(features),
  };
}
