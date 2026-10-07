import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, RefreshCw, AlertCircle } from 'lucide-react';
import { getMarketPrices, formatReportDate } from '../services/marketService';

const INITIAL_DISPLAY_LIMIT = 40;

export default function MobileMarket() {
  const [marketPrices, setMarketPrices] = useState([]);
  const [lastUpdated, setLastUpdated] = useState('');
  const [arrivalDate, setArrivalDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [displayLimit, setDisplayLimit] = useState(INITIAL_DISPLAY_LIMIT);

  // Fetch real data from live Agmarknet / Mandi endpoint
  const loadPrices = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await getMarketPrices({ forceRefresh: isManualRefresh });
      setMarketPrices(res.prices);
      setLastUpdated(res.lastUpdated);
      setArrivalDate(res.arrivalDate);
    } catch (err) {
      console.error('[MobileMarket] Error loading prices:', err);
      // DO NOT invent or display fake prices on failure
      setError(err.message || 'Unable to connect to market service. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load on mount
  useEffect(() => {
    loadPrices(false);
  }, [loadPrices]);

  // Search filter
  const filteredPrices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return marketPrices;
    return marketPrices.filter((item) => {
      const matchCrop = item.crop && item.crop.toLowerCase().includes(q);
      const matchMarket = item.market && item.market.toLowerCase().includes(q);
      const matchDistrict = item.district && item.district.toLowerCase().includes(q);
      const matchState = item.state && item.state.toLowerCase().includes(q);
      const matchVariety = item.variety && item.variety.toLowerCase().includes(q);
      return matchCrop || matchMarket || matchDistrict || matchState || matchVariety;
    });
  }, [marketPrices, searchQuery]);

  // Sliced items for smooth GPU rendering
  const visiblePrices = useMemo(() => {
    return filteredPrices.slice(0, displayLimit);
  }, [filteredPrices, displayLimit]);

  const hasMore = filteredPrices.length > visiblePrices.length;

  return (
    <div className="mobile-page-content mobile-market-screen">
      {/* Header Bar */}
      <div className="market-screen-header">
        <div className="market-header-text">
          <h2 className="mobile-screen-title">Market</h2>
          {lastUpdated && !loading && (
            <div className="market-timestamp-row">
              <span className="market-live-dot" />
              <span className="market-timestamp-text">
                Last updated: {lastUpdated}
              </span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => loadPrices(true)}
          disabled={loading || refreshing}
          className={`market-refresh-btn ${refreshing ? 'is-spinning' : ''}`}
          aria-label="Refresh market prices"
          title="Refresh market rates"
        >
          <RefreshCw size={17} />
        </button>
      </div>

      {/* Arrival Date Info Banner if available */}
      {arrivalDate && !loading && !error && (
        <div className="market-arrival-strip">
          <span>Official Mandi Arrival: {formatReportDate(arrivalDate)}</span>
          <span className="market-source-tag">Agmarknet</span>
        </div>
      )}

      {/* Minimal Search Bar */}
      <div className="clean-search-bar">
        <Search size={16} className="clean-search-icon" aria-hidden="true" />
        <input
          type="text"
          placeholder="Search crop or market..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setDisplayLimit(INITIAL_DISPLAY_LIMIT);
          }}
          className="clean-search-input"
          aria-label="Search commodity or market"
        />
        {searchQuery && (
          <button
            type="button"
            className="clean-clear-btn"
            onClick={() => {
              setSearchQuery('');
              setDisplayLimit(INITIAL_DISPLAY_LIMIT);
            }}
            aria-label="Clear search query"
          >
            ✕
          </button>
        )}
      </div>

      {/* ====================================================
          DATA STATES
          ==================================================== */}

      {/* 1. Loading State */}
      {loading && marketPrices.length === 0 && (
        <div className="market-state-container">
          <div className="market-loading-spinner" />
          <p className="market-state-text">Fetching real-time market prices...</p>
        </div>
      )}

      {/* 2. Error State */}
      {!loading && error && marketPrices.length === 0 && (
        <div className="market-state-container market-error-state" role="alert">
          <AlertCircle size={36} className="market-error-icon" />
          <p className="market-error-title">Market Data Unavailable</p>
          <p className="market-state-text">
            Unable to fetch real-time prices right now. Please check your internet connection.
          </p>
          <button
            type="button"
            onClick={() => loadPrices(true)}
            className="market-retry-btn"
          >
            Retry
          </button>
        </div>
      )}

      {/* 3. Empty Search / No Data State */}
      {!loading && !error && filteredPrices.length === 0 && (
        <div className="market-state-container">
          <p className="market-error-title">No Crops Found</p>
          <p className="market-state-text">
            {searchQuery
              ? `No commodities matching "${searchQuery}".`
              : 'No market data currently available.'}
          </p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="market-retry-btn"
            >
              Clear Search
            </button>
          )}
        </div>
      )}

      {/* 4. Loaded Data State */}
      {!loading && visiblePrices.length > 0 && (
        <div className="clean-market-list">
          {visiblePrices.map((item) => {
            const hasRange = item.minPrice && item.maxPrice && item.minPrice !== item.maxPrice;
            return (
              <div key={item.id} className="clean-market-card">
                <div className="market-card-top">
                  <div className="market-card-crop-group">
                    <h3 className="market-card-crop-name">{item.crop}</h3>
                    {item.variety && (
                      <span className="market-card-variety-badge">{item.variety}</span>
                    )}
                  </div>
                  <div className="market-card-price-group">
                    <span className="market-card-price">
                      ₹{item.currentPrice.toLocaleString('en-IN')}
                    </span>
                    <span className="market-card-unit">/ {item.unit}</span>
                  </div>
                </div>

                <div className="market-card-middle">
                  <span className="market-card-location">
                    <strong className="market-name-strong">{item.market}</strong>
                    {item.district ? ` · ${item.district}` : ''}
                    {item.state ? `, ${item.state}` : ''}
                  </span>
                </div>

                <div className="market-card-bottom">
                  <span className="market-card-range">
                    {hasRange
                      ? `Range: ₹${item.minPrice.toLocaleString('en-IN')} – ₹${item.maxPrice.toLocaleString('en-IN')}`
                      : 'Modal Price'}
                  </span>
                  {item.date && (
                    <span className="market-card-date">
                      {formatReportDate(item.date)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Load More Button for 60-120 FPS Mobile Optimization */}
          {hasMore && (
            <div className="market-load-more-row">
              <button
                type="button"
                onClick={() => setDisplayLimit((prev) => prev + 40)}
                className="market-load-more-btn"
              >
                Show More ({filteredPrices.length - visiblePrices.length} remaining)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
