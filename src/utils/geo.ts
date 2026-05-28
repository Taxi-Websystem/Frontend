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

const WB_START = '(?<!\\p{L})';
const WB_END = '(?!\\p{L})';

const STREET_TYPE_WORD = new RegExp(
  `${WB_START}(вулиця|вул\\.?|проспект|просп\\.?|площа|пл\\.?)${WB_END}`,
  'giu'
);

const STREET_TYPE_AFTER_NAME =
  /^(.+?)\s+(вулиця|вул\.?|проспект|просп\.?|площа|пл\.?)\s*$/iu;

function replaceStreetWord(text: string, word: string, replacement: string): string {
  return text.replace(new RegExp(`${WB_START}${word}${WB_END}`, 'giu'), replacement);
}

function moveStreetTypeBeforeName(value: string): string {
  const match = value.trim().match(STREET_TYPE_AFTER_NAME);
  if (!match) return value.trim();
  return `${match[2]} ${match[1]}`.trim();
}

export function abbreviateStreetTypes(value: string): string {
  let text = moveStreetTypeBeforeName(value);
  text = replaceStreetWord(text, 'проспект', 'пр.');
  text = replaceStreetWord(text, 'просп\\.', 'пр.');
  text = replaceStreetWord(text, 'площа', 'пл.');
  text = replaceStreetWord(text, 'пл\\.', 'пл.');
  text = replaceStreetWord(text, 'вулиця', 'вул.');
  text = replaceStreetWord(text, 'вул\\.', 'вул.');
  text = text.replace(new RegExp(`${WB_START}вул(?!\\.)${WB_END}`, 'giu'), 'вул.');
  return text.replace(/\s+/g, ' ').trim();
}

function extractStreetTypeAbbrev(displayName: string): string | null {
  const match = displayName.match(STREET_TYPE_WORD);
  if (!match) return null;
  return abbreviateStreetTypes(match[0]);
}

/** Нормалізує вже збережений рядок адреси (напр. з БД). */
export function compactAddressLabel(full: string): string {
  const trimmed = full.trim();
  if (!trimmed) return '';

  const parts = trimmed.split(',').map((part) => part.trim()).filter(Boolean);
  if (parts.length === 0) return abbreviateStreetTypes(trimmed);

  const city = parts.find((p) => /львів|lviv/i.test(p)) ?? parts[parts.length - 1];
  const cityIndex = parts.indexOf(city);
  const beforeCity = cityIndex > 0 ? parts.slice(0, cityIndex) : parts.slice(0, -1);

  if (beforeCity.length === 0) {
    return abbreviateStreetTypes(parts[0]);
  }

  const streetName = abbreviateStreetTypes(beforeCity[0]);
  const rest = beforeCity.slice(1).map(abbreviateStreetTypes);
  const streetLine = [streetName, ...rest].filter(Boolean).join(', ');

  return city && city !== streetLine ? `${streetLine}, ${city}` : streetLine;
}

export function formatCompactAddress(row: NominatimResult): string {
  const addr = row.address;
  if (addr) {
    const roadRaw = (addr.road ?? addr.pedestrian ?? '').trim();
    const road = abbreviateStreetTypes(roadRaw);
    const house = addr.house_number?.trim();
    const city = addr.city ?? addr.town ?? addr.village ?? addr.municipality ?? 'Львів';
    const typeAbbrev = extractStreetTypeAbbrev(row.display_name);
    const roadHasType = STREET_TYPE_WORD.test(roadRaw);

    const core = [road, house].filter(Boolean).join(', ');
    const streetLine =
      core && typeAbbrev && !roadHasType ? `${typeAbbrev} ${core}` : core;

    if (streetLine) return abbreviateStreetTypes(`${streetLine}, ${city}`);
  }

  return compactAddressLabel(row.display_name);
}

function addressOptionKey(row: AddressSelection): string {
  return row.displayName.toLocaleLowerCase('uk').replace(/\s+/g, ' ').trim();
}

function dedupeAddressSelections(selections: AddressSelection[]): AddressSelection[] {
  const seenKeys = new Set<string>();
  const uniqueSelections: AddressSelection[] = [];

  for (const selection of selections) {
    const key = addressOptionKey(selection);
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);
    uniqueSelections.push(selection);
  }

  return uniqueSelections;
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

  const searchResults = (await response.json()) as NominatimResult[];
  const mappedSelections = searchResults
    .map((nominatimResult) => ({
      displayName: formatCompactAddress(nominatimResult),
      latitude: Number(nominatimResult.lat),
      longitude: Number(nominatimResult.lon)
    }))
    .filter((selection) => Number.isFinite(selection.latitude) && Number.isFinite(selection.longitude));

  return dedupeAddressSelections(mappedSelections);
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

  const routeResponse = (await response.json()) as { routes?: { distance?: number }[] };
  const meters = routeResponse.routes?.[0]?.distance;
  if (meters == null || !Number.isFinite(meters)) return null;

  return Math.round((meters / 1000) * 100) / 100;
}

export async function fetchDrivingRouteGeometry(
  fromLng: number,
  fromLat: number,
  toLng: number,
  toLat: number
): Promise<[number, number][] | null> {
  const path = `${fromLng},${fromLat};${toLng},${toLat}`;
  const response = await fetch(`/osrm/route/v1/driving/${path}?overview=full&geometries=geojson`);
  if (!response.ok) return null;

  const routeResponse = (await response.json()) as {
    routes?: { geometry?: { coordinates?: [number, number][] } }[];
  };
  const routeCoordinates = routeResponse.routes?.[0]?.geometry?.coordinates;
  if (!routeCoordinates?.length) return null;

  return routeCoordinates.map(([lng, lat]) => [lat, lng] as [number, number]);
}
