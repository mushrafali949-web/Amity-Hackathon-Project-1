import { CONFIG } from './config';

/**
 * Calculates Great-circle distance between two points in kilometers.
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10;
}

/**
 * Estimates driving ETA in minutes based on distance and average city speed.
 */
export function estimateEtaMinutes(distanceKm: number): number {
  const hours = distanceKm / CONFIG.AVG_SPEED_KMH;
  const minutes = Math.round(hours * 60);
  return Math.max(5, minutes);
}

/**
 * Fetches routing geometry polyline from public OSRM, falls back to straight line.
 */
export async function getRoutePolyline(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): Promise<{ coordinates: [number, number][]; distanceKm: number; durationMin: number }> {
  const fallbackCoords: [number, number][] = [
    [startLat, startLng],
    [endLat, endLng],
  ];
  const directDistance = calculateDistanceKm(startLat, startLng, endLat, endLng);
  const directEta = estimateEtaMinutes(directDistance);

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'ResQFood-App/1.0' },
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) {
      return { coordinates: fallbackCoords, distanceKm: directDistance, durationMin: directEta };
    }

    const data = await res.json();
    if (data.routes && data.routes[0]) {
      const route = data.routes[0];
      // OSRM coordinates are [lng, lat], Leaflet expects [lat, lng]
      const coords: [number, number][] = route.geometry.coordinates.map(
        ([lng, lat]: [number, number]) => [lat, lng]
      );
      return {
        coordinates: coords,
        distanceKm: Math.round((route.distance / 1000) * 10) / 10,
        durationMin: Math.round(route.duration / 60),
      };
    }
  } catch {
    // Fall back to direct line
  }

  return { coordinates: fallbackCoords, distanceKm: directDistance, durationMin: directEta };
}
