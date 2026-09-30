import * as Location from 'expo-location';

export type ResolvedLocation = {
  latitude: number;
  longitude: number;
  city: string;
  area: string;
  street: string;
  state: string;
  country: string;
  postal_code: string;
  displayLine: string;
};

function pickFirst(...values: Array<string | null | undefined>): string {
  for (const value of values) {
    if (value && value.trim()) {
      return value.trim();
    }
  }

  return '';
}

export function formatLocationDisplay(parts: {
  area?: string | null;
  street?: string | null;
  city?: string | null;
}): string {
  return [parts.area, parts.street, parts.city].filter(Boolean).join(', ');
}

export async function reverseGeocodeCoords(
  latitude: number,
  longitude: number
): Promise<ResolvedLocation> {
  try {
    const places = await Location.reverseGeocodeAsync({ latitude, longitude });
    const place = places[0];

    if (!place) {
      return emptyResolvedLocation(latitude, longitude);
    }

    const city = pickFirst(place.city, place.subregion, place.district);
    const area = pickFirst(place.district, place.subregion, place.name, place.street);
    const street = pickFirst(place.street, place.name, place.subregion);
    const state = pickFirst(place.region);
    const country = pickFirst(place.country);
    const postal_code = pickFirst(place.postalCode);

    return {
      latitude,
      longitude,
      city,
      area,
      street,
      state,
      country,
      postal_code,
      displayLine:
        formatLocationDisplay({ area, street, city }) ||
        `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
    };
  } catch {
    return emptyResolvedLocation(latitude, longitude);
  }
}

export async function requestCurrentLocation(): Promise<ResolvedLocation> {
  const permission = await Location.requestForegroundPermissionsAsync();

  if (!permission.granted) {
    throw new Error('Location permission is required to use your current location.');
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return reverseGeocodeCoords(position.coords.latitude, position.coords.longitude);
}

export async function geocodeQuery(query: string): Promise<ResolvedLocation> {
  const results = await Location.geocodeAsync(query);

  if (!results.length) {
    throw new Error('Could not find that location. Try a different search.');
  }

  const coords = results[0];
  const resolved = await reverseGeocodeCoords(coords.latitude, coords.longitude);

  return {
    ...resolved,
    area: resolved.area || query.split(',')[0]?.trim() || resolved.city,
    displayLine: resolved.displayLine || query,
  };
}

function emptyResolvedLocation(latitude: number, longitude: number): ResolvedLocation {
  return {
    latitude,
    longitude,
    city: '',
    area: '',
    street: '',
    state: '',
    country: '',
    postal_code: '',
    displayLine: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
  };
}
