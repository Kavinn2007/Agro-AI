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
function WeatherIconComponent({ type, size = 52, className = '' }) {
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
   * Explicit Permission & Weather States:
   * - 'NOT_REQUESTED'
   * - 'GRANTING'
   * - 'DENIED'
   * - 'UNAVAILABLE'
   * - 'TIMEOUT'
   * - 'WEATHER_LOADING'
   * - 'WEATHER_ERROR'
   * - 'WEATHER_SUCCESS'
   */
  const [permissionState, setPermissionState] = useState('NOT_REQUESTED');
  const [coords, setCoords] = useState(null);
  const [weather, setWeather] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState('');

  // Fetch real weather data for given coordinates
  const loadWeather = useCallback(async (latitude, longitude, isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
      setRefreshError('');
    } else {
      setPermissionState('WEATHER_LOADING');
    }

    try {
      const data = await getWeatherData(latitude, longitude, { forceRefresh: isManualRefresh });
      setWeather(data);
      setPermissionState('WEATHER_SUCCESS');
      setRefreshError('');
    } catch (err) {
      console.error('[MobileEnvironment] Weather fetch error:', err);
      if (isManualRefresh && weather) {
        setRefreshError('Could not refresh weather right now');
      } else {
        setPermissionState('WEATHER_ERROR');
      }
    } finally {
      setRefreshing(false);
    }
  }, [weather]);

  // Request browser geolocation strictly upon user interaction
  const handleAllowLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setPermissionState('UNAVAILABLE');
      return;
    }

    setPermissionState('GRANTING');
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
          setPermissionState('DENIED');
        } else if (error.code === 2) {
          // POSITION_UNAVAILABLE
          setPermissionState('UNAVAILABLE');
        } else if (error.code === 3) {
          // TIMEOUT
          setPermissionState('TIMEOUT');
        } else {
          setPermissionState('UNAVAILABLE');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, [loadWeather]);

  // Handle weather refresh using already acquired coordinates (no re-prompting)
  const handleRefresh = useCallback(() => {
    if (!coords) return;
    loadWeather(coords.latitude, coords.longitude, true);
  }, [coords, loadWeather]);

  return (
    <div className="mobile-page-content mobile-env-screen">
      {/* ========================================================
          STATE 1: NOT REQUESTED (Initial state - DO NOT show weather)
          ======================================================== */}
      {permissionState === 'NOT_REQUESTED' && (
        <div className="env-state-card env-permission-box">
          <div className="env-globe-icon-wrap" aria-hidden="true">
            <span className="env-globe-emoji">🌍</span>
          </div>

          <h2 className="env-permission-title">Environment</h2>

          <p className="env-permission-sub">
            Allow location to view local weather
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
          STATE 2: GRANTING (Geolocation in progress)
          ======================================================== */}
      {permissionState === 'GRANTING' && (
        <div className="env-state-card env-loading-box">
          <div className="env-radar-wrap" aria-hidden="true">
            <div className="env-radar-pulse" />
            <div className="env-radar-pulse env-radar-pulse-2" />
            <div className="env-radar-center">
              <Navigation size={22} className="env-radar-icon" />
            </div>
          </div>

          <h3 className="env-state-title">Requesting Location</h3>
          <p className="env-state-sub">
            Detecting device GPS coordinates...
          </p>
        </div>
      )}

      {/* ========================================================
          STATE 3: DENIED (Permission denied)
          ======================================================== */}
      {permissionState === 'DENIED' && (
        <div className="env-state-card env-error-box" role="alert">
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
          STATE 4: UNAVAILABLE (Position unavailable)
          ======================================================== */}
      {permissionState === 'UNAVAILABLE' && (
        <div className="env-state-card env-error-box" role="alert">
          <div className="env-error-icon-wrap">
            <AlertCircle size={38} className="env-error-icon" />
          </div>

          <h3 className="env-state-title">Location Unavailable</h3>
          <p className="env-state-sub">
            Unable to determine your location. Please check your device location settings.
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
          STATE 5: TIMEOUT (Geolocation timeout)
          ======================================================== */}
      {permissionState === 'TIMEOUT' && (
        <div className="env-state-card env-error-box" role="alert">
          <div className="env-error-icon-wrap">
            <AlertCircle size={38} className="env-error-icon" />
          </div>

          <h3 className="env-state-title">Location Request Timed Out</h3>
          <p className="env-state-sub">
            Unable to acquire GPS signal. Please check your network and try again.
          </p>

          <button
            type="button"
            id="try-again-timeout-btn"
            onClick={handleAllowLocation}
            className="env-secondary-btn"
          >
            TRY AGAIN
          </button>
        </div>
      )}

      {/* ========================================================
          STATE 6: WEATHER LOADING (Skeleton state)
          ======================================================== */}
      {permissionState === 'WEATHER_LOADING' && (
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
          STATE 7: WEATHER SUCCESS (Loaded weather dashboard)
          ======================================================== */}
      {permissionState === 'WEATHER_SUCCESS' && weather && (
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
            <div className="env-refresh-banner" role="status">
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
                <span className="env-metric-label">Wind</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          STATE 8: WEATHER ERROR (Weather API error)
          ======================================================== */}
      {permissionState === 'WEATHER_ERROR' && (
        <div className="env-state-card env-error-box" role="alert">
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
