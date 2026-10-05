import React, { useState, useCallback } from 'react';
import { 
  Sun, 
  CloudSun, 
  Cloud, 
  CloudRain, 
  CloudDrizzle, 
  CloudFog, 
  CloudLightning, 
  CloudSnow, 
  Wind, 
  Droplets, 
  Thermometer, 
  MapPin, 
  RefreshCw, 
  AlertCircle,
  Navigation
} from 'lucide-react';
import { getWeatherData } from '../services/weatherService';

/**
 * Maps icon types to Lucide React icon components.
 */
function WeatherIconComponent({ type, size = 48, className = '' }) {
  switch (type) {
    case 'Sun':
      return <Sun size={size} className={className} />;
    case 'CloudSun':
      return <CloudSun size={size} className={className} />;
    case 'Cloud':
      return <Cloud size={size} className={className} />;
    case 'CloudRain':
      return <CloudRain size={size} className={className} />;
    case 'CloudDrizzle':
      return <CloudDrizzle size={size} className={className} />;
    case 'CloudFog':
      return <CloudFog size={size} className={className} />;
    case 'CloudLightning':
      return <CloudLightning size={size} className={className} />;
    case 'CloudSnow':
      return <CloudSnow size={size} className={className} />;
    default:
      return <Sun size={size} className={className} />;
  }
}

export default function MobileEnvironment() {
  /**
   * Environment permission & data states:
   * 1. 'idle'        - Initial state: Location not enabled. Show permission request & [ALLOW LOCATION]
   * 2. 'requesting'  - Requesting location: clean loading animation
   * 3. 'denied'      - Permission denied: "Location access is required to show local weather." [TRY AGAIN]
   * 4. 'unavailable' - Location unavailable: "Unable to determine your location." [TRY AGAIN]
   * 5. 'loading'     - Weather loading: skeleton / loading state
   * 6. 'loaded'      - Weather loaded: complete weather dashboard
   * 7. 'error'       - Weather API error: "Weather data is temporarily unavailable." [RETRY]
   */
  const [state, setState] = useState('idle');
  const [coords, setCoords] = useState(null);
  const [weather, setWeather] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState('');

  // Fetch weather data for given coordinates
  const loadWeather = useCallback(async (latitude, longitude, isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
      setRefreshError('');
    } else {
      setState('loading');
    }

    try {
      const data = await getWeatherData(latitude, longitude, { forceRefresh: isManualRefresh });
      setWeather(data);
      setState('loaded');
      setRefreshError('');
    } catch (err) {
      console.error('[MobileEnvironment] Weather fetch error:', err);
      if (isManualRefresh && weather) {
        // Keep existing valid weather if a background refresh fails
        setRefreshError('Could not refresh weather right now');
      } else {
        setState('error');
      }
    } finally {
      setRefreshing(false);
    }
  }, [weather]);

  // Request browser geolocation permission strictly upon user interaction
  const handleAllowLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState('unavailable');
      return;
    }

    setState('requesting');
    setRefreshError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ latitude, longitude });
        loadWeather(latitude, longitude, false);
      },
      (error) => {
        console.warn('[MobileEnvironment] Geolocation error:', error.code, error.message);
        if (error.code === 1) {
          // PERMISSION_DENIED
          setState('denied');
        } else {
          // 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT
          setState('unavailable');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, [loadWeather]);

  // Handle manual refresh
  const handleRefresh = useCallback(() => {
    if (!coords) return;
    loadWeather(coords.latitude, coords.longitude, true);
  }, [coords, loadWeather]);

  return (
    <div className="mobile-page-content mobile-env-screen">
      {/* ========================================================
          STATE 1: Location not enabled (Initial clean request)
          ======================================================== */}
      {state === 'idle' && (
        <div className="env-state-card env-permission-box">
          <div className="env-globe-icon-wrap" aria-hidden="true">
            <span className="env-globe-emoji">🌍</span>
          </div>

          <h2 className="env-permission-title">Environment</h2>

          <p className="env-permission-sub">
            Allow location to view your local weather
          </p>

          <button
            type="button"
            id="allow-location-btn"
            onClick={handleAllowLocation}
            className="env-primary-btn"
          >
            ALLOW LOCATION
          </button>
        </div>
      )}

      {/* ========================================================
          STATE 2: Requesting location (Clean loading animation)
          ======================================================== */}
      {state === 'requesting' && (
        <div className="env-state-card env-loading-box">
          <div className="env-radar-wrap">
            <div className="env-radar-pulse" />
            <div className="env-radar-pulse env-radar-pulse-2" />
            <div className="env-radar-center">
              <Navigation size={22} className="env-radar-icon" />
            </div>
          </div>

          <h3 className="env-state-title">Requesting Location</h3>
          <p className="env-state-sub">
            Detecting your device GPS coordinates...
          </p>
        </div>
      )}

      {/* ========================================================
          STATE 3: Location permission denied
          ======================================================== */}
      {state === 'denied' && (
        <div className="env-state-card env-error-box">
          <div className="env-error-icon-wrap">
            <AlertCircle size={38} className="env-error-icon" />
          </div>

          <h3 className="env-state-title">Permission Required</h3>
          <p className="env-state-sub">
            Location access is required to show local weather.
          </p>

          <button
            type="button"
            id="try-again-denied-btn"
            onClick={handleAllowLocation}
            className="env-secondary-btn"
          >
            TRY AGAIN
          </button>
        </div>
      )}

      {/* ========================================================
          STATE 4: Location unavailable
          ======================================================== */}
      {state === 'unavailable' && (
        <div className="env-state-card env-error-box">
          <div className="env-error-icon-wrap">
            <AlertCircle size={38} className="env-error-icon" />
          </div>

          <h3 className="env-state-title">Location Unavailable</h3>
          <p className="env-state-sub">
            Unable to determine your location.
          </p>

          <button
            type="button"
            id="try-again-unavail-btn"
            onClick={handleAllowLocation}
            className="env-secondary-btn"
          >
            TRY AGAIN
          </button>
        </div>
      )}

      {/* ========================================================
          STATE 5: Weather loading (Premium skeleton state)
          ======================================================== */}
      {state === 'loading' && (
        <div className="env-skeleton-wrapper" aria-label="Loading local weather">
          <div className="env-skeleton-hero">
            <div className="env-skeleton-line env-sk-location shimmer-effect" />
            <div className="env-skeleton-circle shimmer-effect" />
            <div className="env-skeleton-line env-sk-temp shimmer-effect" />
            <div className="env-skeleton-line env-sk-desc shimmer-effect" />
          </div>

          <div className="env-skeleton-metrics-grid">
            <div className="env-skeleton-card shimmer-effect" />
            <div className="env-skeleton-card shimmer-effect" />
            <div className="env-skeleton-card shimmer-effect" />
          </div>

          <p className="env-skeleton-hint">Fetching local weather data...</p>
        </div>
      )}

      {/* ========================================================
          STATE 6: Weather loaded (Premium weather dashboard)
          ======================================================== */}
      {state === 'loaded' && weather && (
        <div className="env-dashboard">
          {/* Header Bar */}
          <div className="env-header-row">
            <div className="env-header-meta">
              <h2 className="mobile-screen-title">Environment</h2>
              {weather.lastUpdated && (
                <div className="env-live-indicator">
                  <span className="env-live-dot" />
                  <span className="env-live-text">
                    Last updated: {weather.lastUpdated}
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              id="refresh-weather-btn"
              onClick={handleRefresh}
              disabled={refreshing}
              className={`env-refresh-btn ${refreshing ? 'is-spinning' : ''}`}
              aria-label="Refresh weather data"
              title="Refresh weather"
            >
              <RefreshCw size={17} />
            </button>
          </div>

          {refreshError && (
            <div className="env-refresh-banner">
              <span>{refreshError}</span>
            </div>
          )}

          {/* Main Weather Hero Card */}
          <div className="env-hero-card">
            {/* Location Badge */}
            {weather.locationName && (
              <div className="env-location-pill">
                <MapPin size={14} className="env-location-pin" />
                <span className="env-location-name">{weather.locationName}</span>
              </div>
            )}

            {/* Weather Icon & Big Temp */}
            <div className="env-hero-center">
              <div className="env-icon-wrapper">
                <WeatherIconComponent
                  type={weather.iconType}
                  size={56}
                  className="env-weather-hero-icon"
                />
              </div>

              {typeof weather.temperature === 'number' && (
                <div className="env-temp-display">
                  <span className="env-temp-number">{weather.temperature}</span>
                  <span className="env-temp-degree">°C</span>
                </div>
              )}
            </div>

            {/* Condition Label */}
            {weather.condition && (
              <div className="env-condition-badge">
                <span>{weather.condition}</span>
              </div>
            )}
          </div>

          {/* Secondary Weather Metrics Grid */}
          <div className="env-metrics-grid">
            {/* 1. Feels Like */}
            {typeof weather.feelsLike === 'number' && (
              <div className="env-metric-card">
                <div className="env-metric-icon-wrap">
                  <Thermometer size={18} />
                </div>
                <span className="env-metric-value">{weather.feelsLike}°C</span>
                <span className="env-metric-label">Feels like</span>
              </div>
            )}

            {/* 2. Humidity */}
            {typeof weather.humidity === 'number' && (
              <div className="env-metric-card">
                <div className="env-metric-icon-wrap">
                  <Droplets size={18} />
                </div>
                <span className="env-metric-value">{weather.humidity}%</span>
                <span className="env-metric-label">Humidity</span>
              </div>
            )}

            {/* 3. Wind Speed */}
            {typeof weather.windSpeed === 'number' && (
              <div className="env-metric-card">
                <div className="env-metric-icon-wrap">
                  <Wind size={18} />
                </div>
                <span className="env-metric-value">{weather.windSpeed} km/h</span>
                <span className="env-metric-label">Wind speed</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          STATE 7: Weather API error
          ======================================================== */}
      {state === 'error' && (
        <div className="env-state-card env-error-box">
          <div className="env-error-icon-wrap">
            <AlertCircle size={38} className="env-error-icon" />
          </div>

          <h3 className="env-state-title">Weather Unavailable</h3>
          <p className="env-state-sub">
            Weather data is temporarily unavailable.
          </p>

          <button
            type="button"
            id="retry-weather-btn"
            onClick={() => {
              if (coords) {
                loadWeather(coords.latitude, coords.longitude, false);
              } else {
                handleAllowLocation();
              }
            }}
            className="env-secondary-btn"
          >
            RETRY
          </button>
        </div>
      )}
    </div>
  );
}
