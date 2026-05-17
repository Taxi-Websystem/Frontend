export interface AddressSelection {
  displayName: string;
  latitude: number;
  longitude: number;
}

interface NominatimAddress {
  road?: string;
  pedestrian?: string;
  house_number?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: NominatimAddress;
}

/** Прибирає «вул.» / «вулиця» на початку, в кінці та між словами. */
export function stripStreetTypeWords(value: string): string {
  return value
    .replace(/^(?:вул\.?|вулиця)\s+/giu, '')
    .replace(/\s+(?:вул\.?|вулиця)$/giu, '')
    .replace(/\s+(?:вул\.?|вулиця)\s+/giu, ' ')
    .trim();
}

/** Нормалізує вже збережений рядок адреси (напр. з БД). */
export function compactAddressLabel(full: string): string {
  const trimmed = full.trim();
  if (!trimmed) return '';

  const parts = trimmed.split(',').map((part) => part.trim()).filter(Boolean);
  if (parts.length === 0) return stripStreetTypeWords(trimmed);

  const city = parts.find((p) => /львів|lviv/i.test(p)) ?? parts[parts.length - 1];
  const cityIndex = parts.indexOf(city);
  const beforeCity = cityIndex > 0 ? parts.slice(0, cityIndex) : parts.slice(0, -1);

  if (beforeCity.length === 0) {
    return stripStreetTypeWords(parts[0]);
  }

  const streetName = stripStreetTypeWords(beforeCity[0]);
  const rest = beforeCity.slice(1);
  const streetLine = [streetName, ...rest].filter(Boolean).join(', ');

  return city && city !== streetLine ? `${streetLine}, ${city}` : streetLine;
}

/** Короткий підпис: назва, номер, місто (без слова «вулиця»). */
export function formatCompactAddress(row: NominatimResult): string {
  const addr = row.address;
  if (addr) {
    const streetName = stripStreetTypeWords(addr.road ?? addr.pedestrian ?? '');
    const streetLine = [streetName, addr.house_number].filter(Boolean).join(', ');
    const city = addr.city ?? addr.town ?? addr.village ?? addr.municipality ?? 'Львів';
    if (streetLine) return `${streetLine}, ${city}`;
  }

  return compactAddressLabel(row.display_name);
}

function addressOptionKey(row: AddressSelection): string {
  return row.displayName.toLocaleLowerCase('uk').replace(/\s+/g, ' ').trim();
}

/** Залишає перший варіант для однакового підпису (різні точки Nominatim → один рядок). */
function dedupeAddressSelections(rows: AddressSelection[]): AddressSelection[] {
  const seen = new Set<string>();
  const unique: AddressSelection[] = [];

  for (const row of rows) {
    const key = addressOptionKey(row);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(row);
  }

  return unique;
}

export async function searchLvivStreets(query: string): Promise<AddressSelection[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const params = new URLSearchParams({
    city: 'Lviv',
    street: trimmed,
    format: 'json',
    addressdetails: '1',
    limit: '8'
  });

  const response = await fetch(`/nominatim/search?${params.toString()}`, {
    headers: { Accept: 'application/json' }
  });
  if (!response.ok) return [];

  const data = (await response.json()) as NominatimResult[];
  const mapped = data
    .map((row) => ({
      displayName: formatCompactAddress(row),
      latitude: Number(row.lat),
      longitude: Number(row.lon)
    }))
    .filter((row) => Number.isFinite(row.latitude) && Number.isFinite(row.longitude));

  return dedupeAddressSelections(mapped);
}

export async function fetchDrivingDistanceKm(
  fromLng: number,
  fromLat: number,
  toLng: number,
  toLat: number
): Promise<number | null> {
  const path = `${fromLng},${fromLat};${toLng},${toLat}`;
  const response = await fetch(`/osrm/route/v1/driving/${path}?overview=false`);
  if (!response.ok) return null;

  const data = (await response.json()) as { routes?: { distance?: number }[] };
  const meters = data.routes?.[0]?.distance;
  if (meters == null || !Number.isFinite(meters)) return null;

  return Math.round((meters / 1000) * 100) / 100;
}

/** OSRM geometry for planned route map (lng,lat pairs). */
export async function fetchDrivingRouteGeometry(
  fromLng: number,
  fromLat: number,
  toLng: number,
  toLat: number
): Promise<[number, number][] | null> {
  const path = `${fromLng},${fromLat};${toLng},${toLat}`;
  const response = await fetch(`/osrm/route/v1/driving/${path}?overview=full&geometries=geojson`);
  if (!response.ok) return null;

  const data = (await response.json()) as {
    routes?: { geometry?: { coordinates?: [number, number][] } }[];
  };
  const coords = data.routes?.[0]?.geometry?.coordinates;
  if (!coords?.length) return null;

  return coords.map(([lng, lat]) => [lat, lng] as [number, number]);
}
