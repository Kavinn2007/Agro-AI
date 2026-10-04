import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';
import { generateMockMarketData } from '../utils/marketData';
import { motion, AnimatePresence } from 'framer-motion';

export default function MobileMarket() {
  const [marketData, setMarketData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedCrop, setExpandedCrop] = useState(null);

  useEffect(() => {
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
    }
  }, []);

  const categories = ['All', 'Vegetables', 'Grains', 'Cash Crops'];

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

    const recentPast = past.slice(-4);
    recentPast.forEach((price, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (4 - i));
      data.push({
        label: d.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }),
        price: price
      });
    });

    data.push({
      label: 'Today',
      price: past[past.length - 1]
    });

    predicted.slice(0, 4).forEach((price, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() + i + 1);
      data.push({
        label: `+${i + 1}d`,
        price: price
      });
    });

    return data;
  };

  return (
    <div className="mobile-page-content mobile-market-screen">
      <h2 className="mobile-screen-title">Market</h2>

      {/* Search Bar */}
      <div className="clean-search-bar">
        <Search size={16} className="clean-search-icon" />
        <input
          type="text"
          placeholder="Search crop..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="clean-search-input"
        />
        {searchQuery && (
          <button className="clean-clear-btn" onClick={() => setSearchQuery('')}>✕</button>
        )}
      </div>

      {/* Category Filter */}
      <div className="clean-category-row">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`clean-cat-pill ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Commodity List */}
      <div className="clean-market-list">
        {filteredCrops.map((cropItem, idx) => {
          const isExpanded = expandedCrop === cropItem.crop;
          const chartData = prepareChartData(cropItem.historicalPrices, cropItem.predictedPrices);
          const isTrendUp = cropItem.trend === 'up';

          return (
            <div 
              key={idx} 
              className={`clean-market-card ${isExpanded ? 'expanded' : ''}`}
            >
              <div 
                className="clean-market-card-row"
                onClick={() => setExpandedCrop(isExpanded ? null : cropItem.crop)}
              >
                <div className="market-crop-left">
                  <span className="market-crop-name">{cropItem.crop}</span>
                </div>

                <div className="market-crop-right">
                  <span className="market-price-text">₹{cropItem.currentPrice} <small>/ qtl</small></span>
                  <span className={`market-trend-pill ${isTrendUp ? 'up' : 'down'}`}>
                    {isTrendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    <span>{isTrendUp ? '+3.4%' : '-2.1%'}</span>
                  </span>
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>

              {/* Collapsible Chart */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div 
                    className="clean-chart-container"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div style={{ width: '100%', height: 140 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 8, right: 8, left: -25, bottom: 0 }}>
                          <XAxis 
                            dataKey="label" 
                            stroke="#5a7d68" 
                            fontSize={10} 
                            tickLine={false} 
                          />
                          <YAxis 
                            stroke="#5a7d68" 
                            fontSize={10} 
                            tickLine={false}
                            domain={['auto', 'auto']}
                          />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: '#071f12',
                              borderColor: 'rgba(74, 222, 128, 0.2)',
                              borderRadius: '8px',
                              fontSize: '11px',
                              color: '#fff'
                            }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="price" 
                            stroke="#4ade80" 
                            strokeWidth={2} 
                            dot={{ r: 2.5, fill: '#4ade80' }} 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
