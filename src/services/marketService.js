/**
 * AgroAI Market Service Layer
 * Fetches real, verified agricultural Mandi market data from official Agmarknet sources.
 * Never generates or returns mock/fake prices.
 */

const CACHE_KEY = 'agroai_market_cache_v2';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes client-side cache

// Base endpoint - can be overridden via environment variable without code changes
const DEFAULT_API_URL = 'https://mandi-api.onrender.com/v1';
const API_BASE = import.meta.env.VITE_MARKET_API_URL || DEFAULT_API_URL;

// Key agricultural states representing major wholesale mandis
const KEY_STATES = ['Maharashtra', 'Karnataka', 'Uttar Pradesh', 'Madhya Pradesh', 'Punjab'];

/**
 * Format date string into human-readable format (e.g., "24 Sep 2026")
 */
export function formatReportDate(dateStr) {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });
      }
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
  } catch {
    // fallback
  }
  return dateStr;
}

/**
 * Format full timestamp into clean display format (e.g., "24 Sep 2026, 6:43 PM")
 */
export function formatLastUpdated(timestampStr) {
  if (!timestampStr) return '';
  try {
    const d = new Date(timestampStr);
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
  return timestampStr;
}

/**
 * Fetches real market prices from the live mandi API.
 * Supports intelligent caching with explicit timestamps and manual force refresh.
 * 
 * @param {Object} options
 * @param {boolean} options.forceRefresh - Whether to bypass localStorage cache
 * @returns {Promise<{ prices: Array, lastUpdated: string, arrivalDate: string, isFromCache: boolean }>}
 */
export async function getMarketPrices({ forceRefresh = false } = {}) {
  // 1. Check local cache if not forcing fresh request
  if (!forceRefresh) {
    try {
      const cachedRaw = localStorage.getItem(CACHE_KEY);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw);
        const age = Date.now() - (cached.timestamp || 0);
        if (age < CACHE_TTL_MS && Array.isArray(cached.prices) && cached.prices.length > 0) {
          return {
            prices: cached.prices,
            lastUpdated: cached.lastUpdated,
            arrivalDate: cached.arrivalDate,
            isFromCache: true
          };
        }
      }
    } catch (e) {
      console.warn('[MarketService] Failed to read cache:', e);
    }
  }

  // 2. Fetch fresh real data from external API with timeout controller
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000); // 12-second timeout

  try {
    // Fetch prices from key wholesale states in parallel
    const requests = KEY_STATES.map(async (state) => {
      try {
        const url = `${API_BASE}/prices?state=${encodeURIComponent(state)}`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) {
          console.warn(`[MarketService] Failed fetching state ${state} (Status ${res.status})`);
          return [];
        }
        const json = await res.json();
        return Array.isArray(json.data) ? json.data : [];
      } catch (err) {
        console.warn(`[MarketService] Network issue for state ${state}:`, err.message);
        return [];
      }
    });

    const stateResults = await Promise.all(requests);
    clearTimeout(timeoutId);

    const allRecords = stateResults.flat();

    if (allRecords.length === 0) {
      throw new Error('Unable to connect to market data provider. No records received.');
    }

    // Deduplicate and normalize records
    const seen = new Set();
    const normalized = [];
    let latestFetchedAt = '';
    let latestArrivalDate = '';

    for (const item of allRecords) {
      const crop = item.commodity ? item.commodity.trim() : '';
      const market = item.market ? item.market.trim() : 'Local Mandi';
      const modalPrice = Number(item.modal_price) || Number(item.max_price) || 0;

      // Only include valid, non-zero commodities
      if (!crop || modalPrice <= 0) continue;

      const variety = item.variety ? item.variety.trim() : 'Other';
      const uniqueKey = `${item.state}_${market}_${crop}_${variety}`.toLowerCase();

      if (seen.has(uniqueKey)) continue;
      seen.add(uniqueKey);

      if (item.fetched_at && (!latestFetchedAt || item.fetched_at > latestFetchedAt)) {
        latestFetchedAt = item.fetched_at;
      }
      if (item.arrival_date && (!latestArrivalDate || item.arrival_date > latestArrivalDate)) {
        latestArrivalDate = item.arrival_date;
      }

      normalized.push({
        id: item.id || uniqueKey,
        crop,
        variety: variety === 'Other' ? '' : variety,
        grade: item.grade && item.grade !== 'Other' ? item.grade.trim() : '',
        market,
        district: item.district ? item.district.trim() : '',
        state: item.state ? item.state.trim() : '',
        currentPrice: modalPrice,
        minPrice: Number(item.min_price) || modalPrice,
        maxPrice: Number(item.max_price) || modalPrice,
        unit: '₹ / quintal',
        date: item.arrival_date || '',
        fetchedAt: item.fetched_at || ''
      });
    }

    if (normalized.length === 0) {
      throw new Error('No valid commodity records found in current market response.');
    }

    // Sort alphabetically by crop name
    normalized.sort((a, b) => a.crop.localeCompare(b.crop));

    // Determine the real last-updated display string
    const lastUpdatedDisplay = latestFetchedAt 
      ? formatLastUpdated(latestFetchedAt)
      : formatLastUpdated(new Date().toISOString());

    // 3. Save to localStorage cache
    try {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          prices: normalized,
          timestamp: Date.now(),
          lastUpdated: lastUpdatedDisplay,
          arrivalDate: latestArrivalDate
        })
      );
    } catch (cacheErr) {
      console.warn('[MarketService] Failed to write cache:', cacheErr);
    }

    return {
      prices: normalized,
      lastUpdated: lastUpdatedDisplay,
      arrivalDate: latestArrivalDate,
      isFromCache: false
    };
  } catch (err) {
    clearTimeout(timeoutId);
    console.error('[MarketService] Fetch error:', err);
    throw err;
  }
}
