import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  Search, 
  Sparkles, 
  ChevronDown, 
  ChevronUp,
  Tag,
  ArrowUpRight
} from 'lucide-react';
import { generateMockMarketData } from '../utils/marketData';
import { motion, AnimatePresence } from 'framer-motion';

export default function MobileMarket() {
  const [marketData, setMarketData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedCrop, setExpandedCrop] = useState('Tomato');

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    loadMarketData();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadMarketData = () => {
    setLoading(true);
    try {
      let data = localStorage.getItem('agroai_market_data');
      if (data) {
        setMarketData(JSON.parse(data));
      } else {
        const fresh = generateMockMarketData();
        setMarketData(fresh);
        localStorage.setItem('agroai_market_data', JSON.stringify(fresh));
      }
    } catch (e) {
      console.error(e);
      setMarketData(generateMockMarketData());
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', 'Vegetables', 'Grains', 'Cash Crops'];

  // Categorize helper
  const getCategory = (crop) => {
    const v = ['Tomato', 'Potato', 'Onion', 'Chilli', 'Garlic', 'Brinjal', 'Cabbage'];
    const g = ['Wheat', 'Rice', 'Paddy', 'Maize', 'Barley', 'Millet'];
    if (v.some(item => crop.toLowerCase().includes(item.toLowerCase()))) return 'Vegetables';
    if (g.some(item => crop.toLowerCase().includes(item.toLowerCase()))) return 'Grains';
    return 'Cash Crops';
  };

  const filteredCrops = marketData.filter(item => {
    const matchesSearch = item.crop.toLowerCase().includes(searchQuery.toLowerCase());
    const itemCat = getCategory(item.crop);
    const matchesCat = selectedCategory === 'All' || itemCat === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const prepareChartData = (past = [], predicted = []) => {
    const data = [];
    const today = new Date();

    const recentPast = past.slice(-5);
    recentPast.forEach((price, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (5 - i));
      data.push({
        label: d.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }),
        Actual: price,
        Predicted: null
      });
    });

    data.push({
      label: 'Today',
      Actual: past[past.length - 1],
      Predicted: past[past.length - 1]
    });

    predicted.slice(0, 5).forEach((price, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() + i + 1);
      data.push({
        label: `+${i + 1}d`,
        Actual: null,
        Predicted: price
      });
    });

    return data;
  };

  return (
    <div className="mobile-page-content mobile-market-screen">
      {/* 1. HEADER */}
      <div className="mobile-subpage-header">
        <h2 className="mobile-subpage-title">Market Price Forecast</h2>
        <p className="mobile-subpage-desc">AI-driven commodity rates & best selling windows</p>
      </div>

      {/* Offline Alert */}
      {isOffline && (
        <div className="mobile-offline-banner">
          <AlertCircle size={16} />
          <span>Offline mode: Showing cached Mandi pricing data</span>
        </div>
      )}

      {/* 2. SEARCH & FILTER CHIPS */}
      <div className="market-search-bar">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder="Search crop (e.g. Tomato, Wheat)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="market-search-input"
        />
        {searchQuery && (
          <button className="search-clear-btn" onClick={() => setSearchQuery('')}>✕</button>
        )}
      </div>

      <div className="market-category-chips">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`cat-chip ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 3. COMMODITY CARDS */}
      <div className="market-cards-list">
        {filteredCrops.length === 0 ? (
          <div className="empty-market-state">
            <Tag size={32} color="var(--text-muted)" />
            <p>No commodities found matching "{searchQuery}"</p>
          </div>
        ) : (
          filteredCrops.map((cropItem, idx) => {
            const isExpanded = expandedCrop === cropItem.crop;
            const chartData = prepareChartData(cropItem.historicalPrices, cropItem.predictedPrices);
            const isTrendUp = cropItem.trend === 'up';

            return (
              <motion.div 
                key={idx} 
                className={`mobile-market-card ${isExpanded ? 'expanded' : ''}`}
                layout
              >
                {/* Main Card Header (Click to expand chart) */}
                <div 
                  className="market-card-main-row"
                  onClick={() => setExpandedCrop(isExpanded ? null : cropItem.crop)}
                >
                  <div className="card-crop-info">
                    <span className="card-crop-category">{getCategory(cropItem.crop)}</span>
                    <h4 className="card-crop-name">{cropItem.crop}</h4>
                  </div>

                  <div className="card-price-info">
                    <div className="price-tag">
                      <span className="rupee-symbol">₹</span>
                      <span className="price-num">{cropItem.currentPrice}</span>
                      <span className="unit-label">/ qtl</span>
                    </div>

                    <div className={`price-trend-tag ${isTrendUp ? 'trend-up' : 'trend-down'}`}>
                      {isTrendUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                      <span>{isTrendUp ? 'Bullish (+3.8%)' : 'Bearish (-2.1%)'}</span>
                    </div>
                  </div>

                  <div className="card-expand-indicator">
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>

                {/* EXPANDED SECTION: CHART & ADVICE */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                      className="market-card-details"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      {/* Price Trend Chart */}
                      <div className="chart-container-box">
                        <div className="chart-header-row">
                          <span className="chart-title">7-Day Actual vs Forecast</span>
                          <div className="chart-legend-dots">
                            <span className="legend-dot actual"></span> Past
                            <span className="legend-dot predicted"></span> AI Forecast
                          </div>
                        </div>

                        <div style={{ width: '100%', height: 160 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <XAxis 
                                dataKey="label" 
                                stroke="#476652" 
                                fontSize={11} 
                                tickLine={false} 
                              />
                              <YAxis 
                                stroke="#476652" 
                                fontSize={11} 
                                tickLine={false}
                                domain={['auto', 'auto']}
                              />
                              <Tooltip 
                                contentStyle={{
                                  backgroundColor: '#092415',
                                  borderColor: 'rgba(74, 222, 128, 0.25)',
                                  borderRadius: '8px',
                                  fontSize: '12px',
                                  color: '#fff'
                                }}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="Actual" 
                                stroke="#86efac" 
                                strokeWidth={2.5} 
                                dot={{ r: 3, fill: '#86efac' }} 
                              />
                              <Line 
                                type="monotone" 
                                dataKey="Predicted" 
                                stroke="#22c55e" 
                                strokeWidth={2.5} 
                                strokeDasharray="4 4"
                                dot={{ r: 3, fill: '#22c55e' }} 
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Best Selling Window Recommendation */}
                      <div className="market-advice-chip">
                        <Sparkles size={16} color="var(--accent-lime)" />
                        <div>
                          <strong>AI Trade Recommendation: </strong>
                          {isTrendUp 
                            ? 'Prices expected to increase over the next 4-6 days. Consider holding produce for peak Mandi rates.'
                            : 'Prices stabilizing. Favorable time for prompt market disposal to avoid warehousing loss.'}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>

      {/* BOTTOM SAFE AREA */}
      <div style={{ height: 'var(--space-8)' }} />
    </div>
  );
}
