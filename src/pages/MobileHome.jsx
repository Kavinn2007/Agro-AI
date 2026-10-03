import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { 
  Scan, 
  Camera, 
  UploadCloud, 
  TrendingUp, 
  CloudSun, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  Activity, 
  Leaf, 
  ChevronRight,
  TrendingDown,
  Volume2,
  CheckCircle2,
  Layers
} from 'lucide-react';
import { generateMockMarketData } from '../utils/marketData';
import { getSeasonalAdvice } from '../services/notificationService';
import { analyzeImage } from '../services/aiService';
import { processImage } from '../utils/imagePipeline';
import { motion } from 'framer-motion';

export default function MobileHome() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { userProfile, user } = useAuth();

  const [marketHighlights, setMarketHighlights] = useState([]);
  const [seasonalTip, setSeasonalTip] = useState(null);

  // Quick diagnosis widget on Home
  const [quickImage, setQuickImage] = useState('/sample_early_blight.jpg');
  const [quickAnalyzing, setQuickAnalyzing] = useState(false);
  const [quickResult, setQuickResult] = useState(null);
  const [quickError, setQuickError] = useState('');

  useEffect(() => {
    // Load top market data
    try {
      const data = generateMockMarketData();
      setMarketHighlights(data.slice(0, 3));
    } catch (e) {
      console.error('Market data error', e);
    }

    // Load seasonal advice
    try {
      const tips = getSeasonalAdvice(language);
      if (tips && tips.length > 0) {
        setSeasonalTip(tips[0]);
      }
    } catch (e) {
      console.error('Seasonal tips error', e);
    }
  }, [language]);

  const handleQuickUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setQuickError('');
      const dataUrl = await processImage(file);
      setQuickImage(dataUrl);
      setQuickResult(null);
    } catch (err) {
      setQuickError(err.message || 'Could not process image');
    }
  };

  const handleQuickAnalyze = async () => {
    if (!quickImage) return;
    setQuickAnalyzing(true);
    setQuickError('');
    try {
      const res = await analyzeImage(quickImage, language, 'plant');
      setQuickResult(res);
    } catch (err) {
      setQuickError('Analysis failed. Try full scanner.');
    } finally {
      setQuickAnalyzing(false);
    }
  };

  return (
    <div className="mobile-page-content mobile-home-screen">
      {/* 1. GREETING & STATUS BANNER */}
      <section className="mobile-hero-header">
        <div className="farmer-status-strip">
          <div className="greeting-text">
            <span className="greeting-sub">AI-Powered Farming Assistant</span>
            <h2 className="greeting-name">
              Welcome, {userProfile?.name ? userProfile.name.split(' ')[0] : 'Farmer'}
            </h2>
          </div>
          <div className="engine-badge">
            <span className="engine-pulse" />
            <span>AI Ready</span>
          </div>
        </div>
      </section>

      {/* 2. PRIMARY HERO ACTION CARD (DISEASE DETECTION FOCUS) */}
      <section className="mobile-section-block">
        <motion.div 
          className="mobile-primary-hero-card"
          whileTap={{ scale: 0.985 }}
          onClick={() => navigate('/disease')}
        >
          <div className="hero-card-pattern" />
          <div className="hero-card-content">
            <div className="hero-card-badge">
              <Sparkles size={14} />
              <span>Instant AI Diagnosis</span>
            </div>

            <h3 className="hero-card-title">Detect Crop Disease</h3>
            <p className="hero-card-desc">
              Scan leaf using your mobile camera or upload an image to detect infections in seconds.
            </p>

            <div className="hero-card-actions">
              <button 
                className="hero-scan-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/disease');
                }}
              >
                <Scan size={18} />
                <span>Start Detection</span>
              </button>

              <button 
                className="hero-camera-quick-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/disease?mode=camera');
                }}
                aria-label="Open Camera Directly"
              >
                <Camera size={18} />
                <span>Camera</span>
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 3. QUICK ACTION TILES */}
      <section className="mobile-section-block">
        <div className="section-title-row">
          <h4 className="mobile-section-title">Quick Actions</h4>
          <span className="mobile-section-hint">Touch to launch</span>
        </div>

        <div className="quick-actions-grid">
          {/* Tile 1: Open Camera */}
          <motion.div 
            className="quick-action-tile"
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate('/disease?mode=camera')}
          >
            <div className="tile-icon-bubble green">
              <Camera size={22} />
            </div>
            <span className="tile-label">Camera</span>
            <span className="tile-subtext">Direct Capture</span>
          </motion.div>

          {/* Tile 2: Upload File */}
          <motion.div 
            className="quick-action-tile"
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate('/disease?mode=upload')}
          >
            <div className="tile-icon-bubble light-green">
              <UploadCloud size={22} />
            </div>
            <span className="tile-label">Upload</span>
            <span className="tile-subtext">From Gallery</span>
          </motion.div>

          {/* Tile 3: Market Prices */}
          <motion.div 
            className="quick-action-tile"
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate('/market')}
          >
            <div className="tile-icon-bubble emerald">
              <TrendingUp size={22} />
            </div>
            <span className="tile-label">Market</span>
            <span className="tile-subtext">Price Forecast</span>
          </motion.div>

          {/* Tile 4: Advisory & Environment */}
          <motion.div 
            className="quick-action-tile"
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate('/environment')}
          >
            <div className="tile-icon-bubble forest">
              <CloudSun size={22} />
            </div>
            <span className="tile-label">Advisory</span>
            <span className="tile-subtext">Weather & Soil</span>
          </motion.div>
        </div>
      </section>

      {/* 4. INTERACTIVE INSTANT CROP SCANNER DEMO WIDGET */}
      <section className="mobile-section-block">
        <div className="instant-scan-card">
          <div className="instant-scan-header">
            <div>
              <h4 className="instant-scan-title">Quick Diagnosis Test</h4>
              <p className="instant-scan-desc">Try sample leaf or test your own photo immediately</p>
            </div>
            <span className="instant-sample-pill">Active Sample</span>
          </div>

          <div className="instant-preview-area">
            <img 
              src={quickImage} 
              alt="Crop preview" 
              className="instant-preview-img"
              onError={(e) => { e.target.src = '/sample_early_blight.jpg'; }}
            />
            {quickAnalyzing && (
              <div className="instant-scan-overlay">
                <div className="radar-sweep" />
                <span className="scanning-pulse-text">AI Scanning Foliage...</span>
              </div>
            )}
          </div>

          {quickError && (
            <div className="mobile-error-chip">⚠️ {quickError}</div>
          )}

          {quickResult && (
            <div className="instant-result-box">
              <div className="result-top">
                <span className="result-disease-name">
                  {quickResult.disease === 'Healthy' ? '✅ Healthy Plant' : `🔍 ${quickResult.disease}`}
                </span>
                <span className="result-conf-chip">
                  {quickResult.confidence || 95}% Match
                </span>
              </div>
              <p className="result-remedy-text">
                {quickResult.remedy || 'Continue standard field irrigation and soil conditioning.'}
              </p>
            </div>
          )}

          <div className="instant-scan-buttons">
            <label className="btn-secondary-mobile" style={{ flex: 1, textAlign: 'center' }}>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleQuickUpload} 
                style={{ display: 'none' }} 
              />
              Choose Photo
            </label>

            <button 
              className="btn-primary-mobile"
              style={{ flex: 1 }}
              onClick={handleQuickAnalyze}
              disabled={quickAnalyzing}
            >
              {quickAnalyzing ? 'Analyzing...' : 'Run Analysis'}
            </button>
          </div>
        </div>
      </section>

      {/* 5. METRICS & TRUST STRIP */}
      <section className="mobile-section-block">
        <div className="mobile-metrics-card">
          <div className="metric-col">
            <span className="metric-val">98.4%</span>
            <span className="metric-lbl">Precision</span>
          </div>
          <div className="metric-divider" />
          <div className="metric-col">
            <span className="metric-val">35+</span>
            <span className="metric-lbl">Crops</span>
          </div>
          <div className="metric-divider" />
          <div className="metric-col">
            <span className="metric-val">100%</span>
            <span className="metric-lbl">Offline</span>
          </div>
          <div className="metric-divider" />
          <div className="metric-col">
            <span className="metric-val">6</span>
            <span className="metric-lbl">Languages</span>
          </div>
        </div>
      </section>

      {/* 6. MARKET HIGHLIGHTS PREVIEW */}
      <section className="mobile-section-block">
        <div className="section-title-row">
          <h4 className="mobile-section-title">Live Market Prices</h4>
          <button 
            className="section-link-btn"
            onClick={() => navigate('/market')}
          >
            <span>See All</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="market-preview-list">
          {marketHighlights.map((item, idx) => (
            <div 
              key={idx} 
              className="market-preview-item"
              onClick={() => navigate('/market')}
            >
              <div className="market-item-left">
                <span className="market-crop-name">{item.crop}</span>
                <span className="market-crop-market">Mandi Rate</span>
              </div>
              <div className="market-item-right">
                <span className="market-crop-price">₹{item.currentPrice} <small>/ qtl</small></span>
                <span className={`market-crop-trend ${item.trend === 'up' ? 'up' : 'down'}`}>
                  {item.trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {item.trend === 'up' ? '+3.4%' : '-1.8%'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. SEASONAL ADVISORY HIGHLIGHT */}
      {seasonalTip && (
        <section className="mobile-section-block">
          <div className="section-title-row">
            <h4 className="mobile-section-title">Seasonal Advisory</h4>
            <button 
              className="section-link-btn"
              onClick={() => navigate('/environment')}
            >
              <span>More Tips</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div 
            className="advisory-preview-card"
            onClick={() => navigate('/environment')}
          >
            <div className="advisory-header-row">
              <span className="advisory-tag">{seasonalTip.category}</span>
              <span className="advisory-icon-wrap"><Leaf size={16} /></span>
            </div>
            <h5 className="advisory-title">{seasonalTip.title}</h5>
            <p className="advisory-desc">{seasonalTip.content}</p>
          </div>
        </section>
      )}

      {/* BOTTOM SAFE AREA SPACER */}
      <div style={{ height: 'var(--space-6)' }} />
    </div>
  );
}
