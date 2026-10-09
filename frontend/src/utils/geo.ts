// Armenia, Quindío center coordinates
export const ARMENIA_CENTER = {
  lat: 4.5339,
  lng: -75.6811,
};

/**
 * Calculates distance in meters between two lat/lng coordinates (Haversine formula)
 */
export function calcularDistanciaMetros(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // metres
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Simple in-memory cache for reverse geocoding to avoid rate limits
const geocodeCache = new Map<string, string>();
let lastGeocodeCallTime = 0;

/**
 * Reverse geocode lat,lng using OpenStreetMap Nominatim with rate limiting (< 1 req/sec)
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  if (geocodeCache.has(key)) {
    return geocodeCache.get(key)!;
  }

  // Fallback string if API fails or is rate limited
  const fallback = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

  const now = Date.now();
  const timeSinceLast = now - lastGeocodeCallTime;
  if (timeSinceLast < 1100) {
    // Wait minimum 1.1s
    await new Promise((resolve) => setTimeout(resolve, 1100 - timeSinceLast));
  }
  lastGeocodeCallTime = Date.now();

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'es',
      },
    });

    if (!res.ok) {
      return fallback;
    }

    const data = await res.json();
    const address = data.address;
    if (!address) return fallback;

    // Build human-friendly Colombian address
    const road = address.road || address.pedestrian || address.neighbourhood || address.suburb;
    const houseNumber = address.house_number ? ` #${address.house_number}` : '';
    const city = address.city || address.town || address.municipality || 'Armenia';

    if (road) {
      const result = `${road}${houseNumber}, ${city}`;
      geocodeCache.set(key, result);
      return result;
    }

    if (data.display_name) {
      const parts = data.display_name.split(',');
      const shortAddress = parts.slice(0, 2).join(',').trim();
      geocodeCache.set(key, shortAddress);
      return shortAddress;
    }

    return fallback;
  } catch {
    return fallback;
  }
}

/**
 * Format timestamp in Colombian Spanish
 */
export function formatFechaHora(date: Date = new Date()): string {
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };
  return date.toLocaleDateString('es-CO', options);
}

export function formatFechaCorta(date: Date = new Date()): string {
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
  };
  return date.toLocaleDateString('es-CO', options);
}
