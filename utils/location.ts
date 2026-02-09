import * as Location from 'expo-location';

/**
 * Location utilities
 */

export interface LocationCoordinates {
  lat: number;
  lng: number;
}

/**
 * Request current device location
 * Returns null if permission denied or error occurs
 */
export async function requestCurrentLocation(): Promise<LocationCoordinates | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('Location permission denied');
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      lat: location.coords.latitude,
      lng: location.coords.longitude,
    };
  } catch (error) {
    console.error('Error getting current location:', error);
    return null;
  }
}

/**
 * Format location geometry string for Supabase
 * Converts {lat, lng} to PostGIS POINT format
 */
export function formatLocationGeometry(location: LocationCoordinates): string {
  return `SRID=4326;POINT(${location.lng} ${location.lat})`;
}

/**
 * Parse PostGIS POINT format to coordinates
 * Returns null if parsing fails
 */
export function parseLocationGeometry(geometry: string): LocationCoordinates | null {
  try {
    // Handle SRID=4326;POINT(lng lat) format
    const match = geometry.match(/POINT\(([^ ]+) ([^)]+)\)/);
    if (!match) return null;

    return {
      lng: parseFloat(match[1]),
      lat: parseFloat(match[2]),
    };
  } catch {
    return null;
  }
}

/**
 * Calculate distance between two points (Haversine formula)
 * Returns distance in kilometers
 */
export function calculateDistance(
  point1: LocationCoordinates,
  point2: LocationCoordinates
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(point2.lat - point1.lat);
  const dLng = toRadians(point2.lng - point1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.lat)) *
      Math.cos(toRadians(point2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Format distance for display
 * Example: "1.5 km" or "500 m"
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

/**
 * Check if a location is within a certain radius of another location
 */
export function isWithinRadius(
  center: LocationCoordinates,
  point: LocationCoordinates,
  radiusKm: number
): boolean {
  return calculateDistance(center, point) <= radiusKm;
}
