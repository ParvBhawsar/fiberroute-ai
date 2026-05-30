import { UserFacingApiError, requestJson } from './apiClient';

export interface NominatimSearchResult {
  placeId: number;
  displayName: string;
  lat: number;
  lng: number;
  type?: string;
  category?: string;
  importance?: number;
}

interface NominatimApiResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
  category?: string;
  importance?: number;
}

const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_TIMEOUT_MS = 10000;

export async function searchNominatimLocations(query: string): Promise<NominatimSearchResult[]> {
  const trimmedQuery = query.trim();

  if (trimmedQuery.length < 2) {
    throw new UserFacingApiError('Enter at least two characters to search for a location.');
  }

  const params = new URLSearchParams({
    q: trimmedQuery,
    format: 'jsonv2',
    addressdetails: '1',
    limit: '5',
    countrycodes: 'in',
  });

  const data = await requestJson<NominatimApiResult[]>(`${NOMINATIM_SEARCH_URL}?${params.toString()}`, {
    serviceName: 'Location search service',
    timeoutMs: NOMINATIM_TIMEOUT_MS,
    headers: {
      Accept: 'application/json',
    },
  });
  const results = data
    .map((item) => ({
      placeId: item.place_id,
      displayName: item.display_name,
      lat: Number(item.lat),
      lng: Number(item.lon),
      type: item.type,
      category: item.category,
      importance: item.importance,
    }))
    .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng));

  if (!results.length) {
    throw new UserFacingApiError('No matching location found. Try a village, block, district, school, or landmark name.');
  }

  return results;
}
