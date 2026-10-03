import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { getSeasonalAdvice } from '../services/notificationService';
import { 
  CloudSun, 
  Droplets, 
  Wind, 
  Thermometer, 
  Sprout, 
  ShieldCheck, 
  Leaf, 
  Calendar,
  AlertCircle,
  Compass
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function MobileEnvironment() {
  const { language } = useLanguage();
  const [adviceList, setAdviceList] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    try {
      const tips = getSeasonalAdvice(language);
      setAdviceList(tips || []);
    } catch (e) {
      console.error(e);
      setAdviceList([]);
    }
  }, [language]);

  const categories = ['All', 'Irrigation', 'Soil Health', 'Pest Control', 'Fertilizer'];

  const filteredAdvice = adviceList.filter(item => {
    if (activeCategory === 'All') return true;
    return item.category?.toLowerCase().includes(activeCategory.toLowerCase()) ||
           item.title?.toLowerCase().includes(activeCategory.toLowerCase());
  });

  return (
    <div className="mobile-page-content mobile-environment-screen">
      {/* 1. HEADER */}
      <div className="mobile-subpage-header">
        <h2 className="mobile-subpage-title">Environmental Advisory</h2>
        <p className="mobile-subpage-desc">Micro-climate monitoring & seasonal farming guidelines</p>
      </div>

      {/* 2. LIVE AGRICULTURAL CLIMATE CARD */}
      <div className="mobile-climate-card">
        <div className="climate-card-top">
          <div className="climate-season-badge">
            <Calendar size={13} />
            <span>Active Agricultural Cycle</span>
          </div>
          <span className="climate-status-good">Optimal Growth</span>
        </div>

        <div className="climate-stats-grid">
          <div className="climate-stat-box">
            <div className="stat-icon-row">
              <Thermometer size={16} color="var(--accent-lime)" />
              <span className="stat-label">Air Temp</span>
            </div>
            <span className="stat-value">28.4°C</span>
            <span className="stat-sub">Moderate</span>
          </div>

          <div className="climate-stat-box">
            <div className="stat-icon-row">
              <Droplets size={16} color="var(--green-400)" />
              <span className="stat-label">Humidity</span>
            </div>
            <span className="stat-value">64%</span>
            <span className="stat-sub">Normal Range</span>
          </div>

          <div className="climate-stat-box">
            <div className="stat-icon-row">
              <Sprout size={16} color="var(--accent-lime)" />
              <span className="stat-label">Soil Moisture</span>
            </div>
            <span className="stat-value">72%</span>
            <span className="stat-sub">Adequate</span>
          </div>

          <div className="climate-stat-box">
            <div className="stat-icon-row">
              <Wind size={16} color="var(--green-400)" />
              <span className="stat-label">Wind Velocity</span>
            </div>
            <span className="stat-value">9 km/h</span>
            <span className="stat-sub">Gentle Breeze</span>
          </div>
        </div>
      </div>

      {/* 3. SOIL & WATER HEALTH INDICATORS */}
      <div className="mobile-env-summary-card">
        <div className="summary-card-header">
          <Leaf size={16} color="var(--accent-lime)" />
          <h4>Field Health Indicators</h4>
        </div>
        <div className="summary-meters-list">
          <div className="meter-row">
            <div className="meter-info">
              <span>Nitrogen-Phosphorus-Potassium (NPK)</span>
              <strong>Balanced</strong>
            </div>
            <div className="meter-bar-track">
              <div className="meter-bar-fill" style={{ width: '82%' }} />
            </div>
          </div>

          <div className="meter-row">
            <div className="meter-info">
              <span>Soil pH Level</span>
              <strong>6.8 (Neutral)</strong>
            </div>
            <div className="meter-bar-track">
              <div className="meter-bar-fill" style={{ width: '68%' }} />
            </div>
          </div>

          <div className="meter-row">
            <div className="meter-info">
              <span>Foliar Disease Susceptibility</span>
              <strong style={{ color: 'var(--accent-lime)' }}>Low Risk</strong>
            </div>
            <div className="meter-bar-track">
              <div className="meter-bar-fill" style={{ width: '22%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* 4. SEASONAL ADVISORY FILTER CHIPS */}
      <div className="advisory-chips-section">
        <div className="section-title-row">
          <h4 className="mobile-section-title">Seasonal Recommendations</h4>
        </div>
        
        <div className="market-category-chips">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`cat-chip ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 5. SEASONAL ADVICE CARDS LIST */}
      <div className="advisory-cards-list">
        {filteredAdvice.length === 0 ? (
          <div className="empty-market-state">
            <AlertCircle size={28} color="var(--text-muted)" />
            <p>No specific tips found for this category.</p>
          </div>
        ) : (
          filteredAdvice.map((item, index) => (
            <motion.div 
              key={item.id || index}
              className="mobile-advisory-card"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="advisory-card-top">
                <span className="advisory-badge">{item.category || 'General'}</span>
                <span className="advisory-icon"><Sprout size={16} /></span>
              </div>
              <h4 className="advisory-card-title">{item.title}</h4>
              <p className="advisory-card-text">{item.content}</p>
            </motion.div>
          ))
        )}
      </div>

      {/* BOTTOM SAFE AREA */}
      <div style={{ height: 'var(--space-8)' }} />
    </div>
  );
}
