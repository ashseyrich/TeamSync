
/**
 * Gets the user's current geographical location using the browser's Geolocation API.
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
 * Includes a fallback mechanism to strip "specifics" like Suite/Room if initial lookup fails.
 */
export const geocodeAddress = async (address: string): Promise<{ latitude: number; longitude: number } | null> => {
    if (!address || !address.trim()) return null;
    
    const cleanQuery = (q: string) => {
        // Remove common keywords that often break OSM lookups if not perfectly formatted
        return q.replace(/(Suite|Ste|Apt|Room|Rm|Unit|#)\s*[\w-]+/gi, '').trim();
    };

    const performLookup = async (query: string) => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`,
                {
                    headers: {
                        'Accept-Language': 'en',
                        'User-Agent': 'TeamSync-Church-Accountability-App-v1' 
                    }
                }
            );
            if (!response.ok) return null;
            const data = await response.json();
            if (data && data.length > 0) {
                return {
                    latitude: parseFloat(data[0].lat),
                    longitude: parseFloat(data[0].lon)
                };
            }
            return null;
        } catch (e) {
            return null;
        }
    };

    // Attempt 1: Full Address
    let result = await performLookup(address);
    
    // Attempt 2: Cleaned Address (Remove Suite/Apt)
    if (!result) {
        const fallbackQuery = cleanQuery(address);
        if (fallbackQuery !== address) {
            result = await performLookup(fallbackQuery);
        }
    }

    return result;
};

/**
 * Calculates the distance between two GPS coordinates in meters using the Haversine formula.
 */
export const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; 
}
