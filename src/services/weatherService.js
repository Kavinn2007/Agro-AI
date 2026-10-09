/**
 * AgroAI Weather Service Layer
 * Fetches real, verified meteorological data using GPS coordinates.
 * Converts coordinates to human-readable locations.
 * Never generates or returns mock/fake weather data.
 */

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes client cache
const DEFAULT_WEATHER_API = 'https://api.open-meteo.com/v1/forecast';
const WEATHER_API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_WEATHER_API_URL) || DEFAULT_WEATHER_API;

/**
 * Maps WMO Weather Interpretation Codes (WW) to human condition and icon identifiers.
 * Reference: World Meteorological Organization code table 4677
 */
export function getWeatherConditionInfo(code) {
  const numericCode = Number(code);
  switch (numericCode) {
    case 0:
      return { condition: 'Clear Sky', iconType: 'Sun' };
    case 1:
      return { condition: 'Mainly Clear', iconType: 'Sun' };
    case 2:
      return { condition: 'Partly Cloudy', iconType: 'CloudSun' };
    case 3:
      return { condition: 'Overcast', iconType: 'Cloud' };
    case 45:
    case 48:
      return { condition: 'Fog', iconType: 'CloudFog' };
    case 51:
      return { condition: 'Light Drizzle', iconType: 'CloudDrizzle' };
    case 53:
      return { condition: 'Moderate Drizzle', iconType: 'CloudDrizzle' };
    case 55:
      return { condition: 'Dense Drizzle', iconType: 'CloudDrizzle' };
    case 56:
    case 57:
      return { condition: 'Freezing Drizzle', iconType: 'CloudDrizzle' };
    case 61:
      return { condition: 'Slight Rain', iconType: 'CloudRain' };
    case 63:
      return { condition: 'Moderate Rain', iconType: 'CloudRain' };
    case 65:
      return { condition: 'Heavy Rain', iconType: 'CloudRain' };
    case 66:
    case 67:
      return { condition: 'Freezing Rain', iconType: 'CloudRain' };
    case 71:
      return { condition: 'Slight Snow', iconType: 'CloudSnow' };
    case 73:
      return { condition: 'Moderate Snow', iconType: 'CloudSnow' };
    case 75:
      return { condition: 'Heavy Snow', iconType: 'CloudSnow' };
    case 77:
      return { condition: 'Snow Grains', iconType: 'CloudSnow' };
    case 80:
      return { condition: 'Slight Showers', iconType: 'CloudRain' };
    case 81:
      return { condition: 'Moderate Showers', iconType: 'CloudRain' };
    case 82:
      return { condition: 'Violent Showers', iconType: 'CloudRain' };
    case 85:
    case 86:
      return { condition: 'Snow Showers', iconType: 'CloudSnow' };
    case 95:
      return { condition: 'Thunderstorm', iconType: 'CloudLightning' };
    case 96:
    case 99:
      return { condition: 'Thunderstorm with Hail', iconType: 'CloudLightning' };
    default:
      return { condition: 'Clear Sky', iconType: 'Sun' };
  }
}

/**
 * Format timestamp into clean display format (e.g., "5 Oct 2026, 10:15 PM")
 */
export function formatWeatherLastUpdated(dateInput) {
  if (!dateInput) return '';
  try {
    const d = new Date(dateInput);
    if (!isNaN(d.getTime())) {
      return d.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
  } catch {
    // fallback
  }
  return String(dateInput);
}

/**
 * Reverse geocode latitude and longitude into human-readable place name.
 * Uses BigDataCloud with OpenStreetMap Nominatim fallback.
 */
export async function reverseGeocodeCoords(latitude, longitude, signal) {
  // 1. Try BigDataCloud reverse geocode client (no key needed, fast client-side)
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
    const res = await fetch(url, { signal });
    if (res.ok) {
      const data = await res.json();
      const city = data.city || data.locality || (Array.isArray(data.localityInfo?.administrative)
        ? data.localityInfo.administrative.find(a => a.adminLevel === 6 || a.adminLevel === 5)?.name
        : '') || '';
      const state = data.principalSubdivision || '';
      const country = data.countryName || '';

      if (city && state && city.toLowerCase() !== state.toLowerCase()) {
        return `${city}, ${state}`;
      } else if (city && country && city.toLowerCase() !== country.toLowerCase()) {
        return `${city}, ${country}`;
      } else if (city) {
        return city;
      } else if (state) {
        return state;
      }
    }
  } catch (err) {
    console.warn('[WeatherService] BigDataCloud reverse geocode failed, falling back:', err.message);
  }

  // 2. Fallback to OpenStreetMap Nominatim
  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
    const res = await fetch(nominatimUrl, {
      signal,
      headers: {
        'Accept': 'application/json'
      }
    });
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const place = addr.city || addr.town || addr.village || addr.county || addr.suburb || '';
      const state = addr.state || addr.country || '';
      if (place && state && place.toLowerCase() !== state.toLowerCase()) {
        return `${place}, ${state}`;
      } else if (place) {
        return place;
      } else if (state) {
        return state;
      }
    }
  } catch (err) {
    console.warn('[WeatherService] Nominatim fallback failed:', err.message);
  }

  // 3. Fallback to coordinate label
  return `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`;
}

/**
 * Fetches real-time weather from Open-Meteo using real GPS coordinates.
 * Supports intelligent caching by coordinates with TTL.
 *
 * @param {number} latitude
 * @param {number} longitude
 * @param {Object} options
 * @param {boolean} options.forceRefresh - Whether to bypass client cache
 * @returns {Promise<Object>} Formatted weather data
 */
export async function getWeatherData(latitude, longitude, { forceRefresh = false } = {}) {
  if (typeof latitude !== 'number' || typeof longitude !== 'number' || isNaN(latitude) || isNaN(longitude)) {
    throw new Error('Valid GPS coordinates are required to retrieve local weather.');
  }

  const cacheKey = `agroai_weather_${latitude.toFixed(2)}_${longitude.toFixed(2)}`;

  // 1. Check client-side cache
  if (!forceRefresh && typeof window !== 'undefined' && window.localStorage) {
    try {
      const cachedRaw = window.localStorage.getItem(cacheKey);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw);
        const age = Date.now() - (cached.timestamp || 0);
        if (age < CACHE_TTL_MS && cached.weather) {
          return {
            ...cached.weather,
            isFromCache: true
          };
        }
      }
    } catch (e) {
      console.warn('[WeatherService] Cache read error:', e);
    }
  }

  // 2. Fetch fresh real-time weather with timeout
  const weatherController = new AbortController();
  const weatherTimeoutId = setTimeout(() => weatherController.abort(), 15000);

  // Isolate reverse geocoding to its own timeout so reverse geocode latency never fails weather
  const geoController = new AbortController();
  const geoTimeoutId = setTimeout(() => geoController.abort(), 6000);

  try {
    const weatherUrl = `${WEATHER_API_BASE}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&wind_speed_unit=kmh`;

    // Fetch weather and reverse geocoding safely in parallel
    const [weatherRes, locationName] = await Promise.all([
      fetch(weatherUrl, { signal: weatherController.signal }),
      reverseGeocodeCoords(latitude, longitude, geoController.signal).catch(() => `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`)
    ]);

    clearTimeout(weatherTimeoutId);
    clearTimeout(geoTimeoutId);

    if (!weatherRes.ok) {
      throw new Error(`Weather service returned status ${weatherRes.status}`);
    }

    const weatherData = await weatherRes.json();
    const current = weatherData.current;

    if (!current) {
      throw new Error('Incomplete weather metrics received from provider.');
    }

    // Extract exact values returned by the API
    const temperature = typeof current.temperature_2m === 'number' ? Math.round(current.temperature_2m) : null;
    const feelsLike = typeof current.apparent_temperature === 'number' ? Math.round(current.apparent_temperature) : null;
    const humidity = typeof current.relative_humidity_2m === 'number' ? Math.round(current.relative_humidity_2m) : null;
    const windSpeed = typeof current.wind_speed_10m === 'number' ? Math.round(current.wind_speed_10m) : null;
    const weatherCode = typeof current.weather_code === 'number' ? current.weather_code : 0;

    const conditionInfo = getWeatherConditionInfo(weatherCode);
    const nowIso = new Date().toISOString();
    const lastUpdatedDisplay = formatWeatherLastUpdated(nowIso);

    const result = {
      latitude,
      longitude,
      temperature,
      feelsLike,
      humidity,
      windSpeed,
      condition: conditionInfo.condition,
      iconType: conditionInfo.iconType,
      weatherCode,
      locationName: locationName || `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`,
      lastUpdated: lastUpdatedDisplay,
      timestamp: Date.now(),
      isFromCache: false
    };

    // 3. Cache result
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(cacheKey, JSON.stringify({
          weather: result,
          timestamp: Date.now()
        }));
      } catch (cacheErr) {
        console.warn('[WeatherService] Cache write error:', cacheErr);
      }
    }

    return result;
  } catch (err) {
    clearTimeout(weatherTimeoutId);
    clearTimeout(geoTimeoutId);
    console.error('[WeatherService] Fetch error:', err);
    throw err;
  }
}
