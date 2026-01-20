
// This file can contain location-related utility functions.
// For example, getting the user's current location to help with map-based features.

/**
 * Gets the user's current geographical location using the browser's Geolocation API.
 * @returns A Promise that resolves with an object containing latitude and longitude.
 * @rejects An error if geolocation is not supported or if the user denies permission.
 */
export const getCurrentLocation = (): Promise<{ latitude: number; longitude: number }> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new Error('Geolocation is not supported by your browser.'));
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            return reject(new Error("User denied the request for Geolocation."));
          case error.POSITION_UNAVAILABLE:
            return reject(new Error("Location information is unavailable."));
          case error.TIMEOUT:
            return reject(new Error("The request to get user location timed out."));
          default:
            return reject(new Error("An unknown error occurred while getting location."));
        }
      }
    );
  });
};

/**
 * Converts a text address into GPS coordinates using Nominatim (OpenStreetMap).
 * @param address The text address to geocode.
 * @returns A Promise resolving to { latitude, longitude } or null.
 */
export const geocodeAddress = async (address: string): Promise<{ latitude: number; longitude: number } | null> => {
    if (!address.trim()) return null;
    
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`,
            {
                headers: {
                    'Accept-Language': 'en',
                    'User-Agent': 'TeamSync-Church-App' // Required per Nominatim usage policy
                }
            }
        );
        const data = await response.json();
        
        if (data && data.length > 0) {
            return {
                latitude: parseFloat(data[0].lat),
                longitude: parseFloat(data[0].lon)
            };
        }
        return null;
    } catch (error) {
        console.error("Geocoding failed:", error);
        return null;
    }
};

/**
 * Calculates the distance between two GPS coordinates in meters using the Haversine formula.
 * @param lat1 Latitude of the first point.
 * @param lon1 Longitude of the first point.
 * @param lat2 Latitude of the second point.
 * @param lon2 Longitude of the second point.
 * @returns The distance in meters.
 */
export const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const d = R * c; // in metres
    return d;
}
