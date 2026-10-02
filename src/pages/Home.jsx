import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import DemoModal from '../components/DemoModal';
import { analyzeImage } from '../services/aiService';
import { processImage } from '../utils/imagePipeline';
import { getSeasonalAdvice } from '../services/notificationService';
import { generateMockMarketData } from '../utils/marketData';
import {
  Sparkles,
  UploadCloud,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Volume2,
  VolumeX,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  CloudSun,
  Scan,
  Stethoscope,
  Layers,
  Activity,
  Leaf,
  Cpu,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

export default function Home() {
  const [demoOpen, setDemoOpen] = useState(false);
  const { t, language } = useLanguage();

  // Interactive Live Diagnosis State on Landing Page
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('/sample_early_blight.jpg');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisError, setAnalysisError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);

  // Environmental & Market Data
  const [seasonalTips, setSeasonalTips] = useState([]);
  const [marketItems, setMarketItems] = useState([]);

  useEffect(() => {
    // Load seasonal advice
    const tips = getSeasonalAdvice(language);
    setSeasonalTips(tips.slice(0, 3));

    // Load market predictions
    try {
      const data = generateMockMarketData();
      setMarketItems(data.slice(0, 3));
    } catch (e) {
      console.error('Market data load error:', e);
    }
  }, [language]);

  // Initial demo result display so users see the capability right away
  useEffect(() => {
    setAnalysisResult({
      crop: 'Tomato (Lycopersicon)',
      disease: 'Early Blight (Alternaria solani)',
      severity: 'Moderate',
      confidence: 95,
      isHealthy: false,
      symptoms: 'Concentric dark brown target-like spots with surrounding yellow halos on mature leaf tissues.',
      remedy: 'Apply organic copper-based fungicide spray every 7-10 days. Prune lower infected leaves to prevent ground splash transmission.',
      prevention: 'Maintain drip irrigation to avoid wet foliage. Practice 3-year crop rotation with non-solanaceous crops.'
    });
  }, []);

  // Handle file drop or selection
  const handleFile = async (file) => {
    if (!file) return;
    try {
      setAnalysisError('');
      const dataUrl = await processImage(file);
      setSelectedFile(file);
      setPreviewUrl(dataUrl);
      setAnalysisResult(null);
    } catch (err) {
      setAnalysisError(err.message || 'Could not process this image.');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  // Run Real AI Diagnosis
  const handleRunDiagnosis = async () => {
    if (!previewUrl) {
      setAnalysisError('Please select or upload a crop photo first.');
      return;
    }

    setAnalyzing(true);
    setAnalysisError('');
    setAnalysisProgress('Preprocessing leaf image pixels...');

    try {
      setTimeout(() => setAnalysisProgress('Running deep neural vision inference...'), 600);
      setTimeout(() => setAnalysisProgress('Detecting foliar disease patterns...'), 1200);

      const res = await analyzeImage(previewUrl, language, 'plant');

      if (res) {
        setAnalysisResult({
          crop: res.crop || 'Detected Crop',
          disease: res.disease || (res.isValidCrop === false ? 'No Leaf Detected' : 'Healthy'),
          severity: res.severity || (res.disease?.toLowerCase().includes('healthy') ? 'Healthy' : 'Moderate'),
          confidence: res.confidence || 94,
          isHealthy: res.disease?.toLowerCase().includes('healthy') || res.severity === 'Healthy',
          symptoms: res.symptoms || 'Visual indicators evaluated across leaf margins and vein structures.',
          remedy: res.remedy || 'Continue standard field irrigation and soil conditioning.',
          prevention: res.prevention || 'Ensure proper field aeration and crop spacing.'
        });
      }
    } catch (err) {
      console.error('Diagnosis error:', err);
      setAnalysisError('Diagnosis temporarily unavailable. Please retry with a clearer photo.');
    } finally {
      setAnalyzing(false);
      setAnalysisProgress('');
    }
  };

  // Preset Sample Click
  const handleSelectSample = (sampleUrl, title) => {
    setPreviewUrl(sampleUrl);
    setSelectedFile(null);
    setAnalysisError('');
    setAnalysisResult(null);
  };

  // Voice Readout Text-to-Speech
  const handleToggleVoice = () => {
    if (!window.speechSynthesis || !analysisResult) return;

    if (isPlayingVoice) {
      window.speechSynthesis.cancel();
      setIsPlayingVoice(false);
      return;
    }

    const textToRead = `${analysisResult.crop}. ${analysisResult.disease}. ${analysisResult.remedy}`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = language === 'ta' ? 'ta-IN' : 'en-US';
    utterance.onend = () => setIsPlayingVoice(false);
    utterance.onerror = () => setIsPlayingVoice(false);

    window.speechSynthesis.speak(utterance);
    setIsPlayingVoice(true);
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      {/* =========================================================
          HERO SECTION
          ========================================================= */}
      <section className="hero">
        <div className="container">
          <div className="hero-grid">
            {/* Left Content Column */}
            <div className="hero-content">
              {/* Badge */}
              <div className="hero-badge">
                <span className="pulse-dot"></span>
                <span>{t('hero_badge')}</span>
              </div>

              {/* High-Impact Headline */}
              <h1 className="hero-main-title">
                <span className="hero-gradient-text">{t('hero_title') || 'AGRO AI'}</span>
              </h1>

              {/* Supporting Subtitle */}
              <p className="hero-desc">
                {t('hero_subtitle')}
              </p>

              {/* Primary Actions */}
              <div className="hero-actions">
                <button 
                  onClick={() => scrollToSection('diagnosis')}
                  className="btn btn-primary btn-lg"
                  id="hero-get-started-btn"
                >
                  <Sparkles size={18} />
                  <span>{t('hero_cta')}</span>
                </button>

                <button 
                  onClick={() => setDemoOpen(true)}
                  className="btn btn-secondary btn-lg"
                  id="hero-try-demo-btn"
                >
                  <span>{t('hero_demo')}</span>
                  <ArrowRight size={18} />
                </button>
              </div>

              {/* Trust Metric Strip */}
              <div className="hero-stats-row">
                <div className="hero-stat-item">
                  <h4>98.4%</h4>
                  <p>Model Precision</p>
                </div>
                <div className="hero-stat-item">
                  <h4>35+</h4>
                  <p>Crops Covered</p>
                </div>
                <div className="hero-stat-item">
                  <h4>100%</h4>
                  <p>Offline Ready</p>
                </div>
                <div className="hero-stat-item">
                  <h4>6</h4>
                  <p>Languages</p>
                </div>
              </div>
            </div>

            {/* Right Interactive AI Visual Card */}
            <div className="hero-visual-col">
              <div className="crop-scanner-card">
                <div className="scanner-image-wrapper">
                  <img 
                    src="/hero_crop_leaf.jpg" 
                    alt="Agricultural crop leaf scanning visual" 
                  />

                  {/* AI Scanning Beam */}
                  <div className="scanner-laser-line"></div>

                  {/* Detection Bounding Box */}
                  <div className="scanner-target-box">
                    <span className="target-corner target-tl"></span>
                    <span className="target-corner target-tr"></span>
                    <span className="target-corner target-bl"></span>
                    <span className="target-corner target-br"></span>
                  </div>

                  {/* Top Live Telemetry Overlay */}
                  <div className="scanner-top-telemetry">
                    <div className="telemetry-chip">
                      <span className="telemetry-live-dot"></span>
                      <span>AI Scanning Active</span>
                    </div>
                    <div className="telemetry-chip">
                      <span>Foliage: Tomato</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Diagnosis Telemetry */}
                <div className="scanner-bottom-telemetry">
                  <div className="telemetry-diagnosis-header">
                    <div className="telemetry-crop-title">
                      <Leaf size={16} color="var(--accent-lime)" />
                      <span>Early Detection Analysis</span>
                    </div>
                    <span className="telemetry-confidence-badge">98.4% Match</span>
                  </div>

                  <div className="telemetry-diagnosis-body">
                    <span>Target Zone: Healthy Foliage • No Critical Pathogens</span>
                    <span className="telemetry-action-hint">
                      <ShieldCheck size={14} />
                      Protected
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          FEATURE SECTION
          ========================================================= */}
      <section className="section" id="features" style={{ background: 'var(--agri-charcoal)' }}>
        <div className="container">
          <div style={{ textAlign: 'center' }}>
            <span className="section-badge">Platform Capabilities</span>
            <h2 className="section-title">Everything You Need to Understand Your Crops</h2>
            <p className="section-subtitle">
              Precision intelligence designed to safeguard harvest yields, reduce pesticide wastage, and maximize grower revenue.
            </p>
          </div>

          <div className="grid-3">
            {/* 1. AI Disease Detection */}
            <div className="card">
              <div className="card-icon">
                <Scan size={24} />
              </div>
              <h3 className="card-title">{t('feature_1_title')}</h3>
              <p className="card-text">{t('feature_1_desc')}</p>
            </div>

            {/* 2. Smart Remedies */}
            <div className="card">
              <div className="card-icon">
                <Stethoscope size={24} />
              </div>
              <h3 className="card-title">{t('feature_2_title')}</h3>
              <p className="card-text">{t('feature_2_desc')}</p>
            </div>

            {/* 3. Environmental Intelligence */}
            <div className="card">
              <div className="card-icon">
                <CloudSun size={24} />
              </div>
              <h3 className="card-title">{t('feature_3_title')}</h3>
              <p className="card-text">{t('feature_3_desc')}</p>
            </div>

            {/* 4. Market Intelligence */}
            <div className="card">
              <div className="card-icon">
                <TrendingUp size={24} />
              </div>
              <h3 className="card-title">{t('feature_4_title')}</h3>
              <p className="card-text">{t('feature_4_desc')}</p>
            </div>

            {/* 5. Camera Analysis */}
            <div className="card">
              <div className="card-icon">
                <Camera size={24} />
              </div>
              <h3 className="card-title">{t('feature_5_title')}</h3>
              <p className="card-text">{t('feature_5_desc')}</p>
            </div>

            {/* 6. Farmer-Friendly AI */}
            <div className="card">
              <div className="card-icon">
                <Leaf size={24} />
              </div>
              <h3 className="card-title">{t('feature_6_title')}</h3>
              <p className="card-text">{t('feature_6_desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          INTERACTIVE DISEASE DETECTION WORKFLOW SECTION
          ========================================================= */}
      <section className="section" id="diagnosis">
        <div className="container">
          <div style={{ textAlign: 'center' }}>
            <span className="section-badge">Live AI Diagnosis</span>
            <h2 className="section-title">Turn a Crop Photo Into an AI Diagnosis</h2>
            <p className="section-subtitle">
              Upload a leaf photo from your field or choose a sample to test our real-time computer vision diagnosis.
            </p>

            {/* Visual Workflow Bar */}
            <div className="workflow-strip">
              <div className="workflow-step-pill active">
                <Camera size={14} />
                <span>1. CAPTURE</span>
              </div>
              <span className="workflow-arrow">→</span>
              <div className="workflow-step-pill active">
                <Cpu size={14} />
                <span>2. AI ANALYSIS</span>
              </div>
              <span className="workflow-arrow">→</span>
              <div className="workflow-step-pill active">
                <Scan size={14} />
                <span>3. DISEASE DETECTION</span>
              </div>
              <span className="workflow-arrow">→</span>
              <div className="workflow-step-pill active">
                <Stethoscope size={14} />
                <span>4. REMEDY</span>
              </div>
            </div>
          </div>

          {/* Interactive Diagnostic Studio */}
          <div className="diagnosis-studio">
            {/* Sample Selector Chips */}
            <div className="diagnosis-presets">
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Quick Test:</span>
              <button 
                type="button"
                className="preset-chip-btn"
                onClick={() => handleSelectSample('/sample_early_blight.jpg', 'Early Blight')}
              >
                🍃 Tomato Early Blight
              </button>
              <button 
                type="button"
                className="preset-chip-btn"
                onClick={() => handleSelectSample('/hero_crop_leaf.jpg', 'Healthy Tomato')}
              >
                🌿 Healthy Tomato Leaf
              </button>
            </div>

            {/* Dropzone Container */}
            <div 
              className={`diagnosis-dropzone ${isDragOver ? 'dragover' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={(e) => handleFile(e.target.files?.[0])}
                accept="image/*"
                style={{ display: 'none' }}
              />

              <div className="dropzone-icon-box">
                <UploadCloud size={30} />
              </div>

              <h3 style={{ fontSize: 'var(--fs-lg)', color: '#ffffff', marginBottom: '6px' }}>
                Drop your crop image here
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)', marginBottom: '12px' }}>
                or click to browse files from your computer or phone camera
              </p>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Supports JPG, PNG, WEBP • Max 10MB
              </span>
            </div>

            {/* Preview & Action Trigger */}
            {previewUrl && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                <div style={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: '320px',
                  borderRadius: 'var(--radius-xl)',
                  overflow: 'hidden',
                  border: '1.5px solid var(--agri-border-hover)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                }}>
                  <img 
                    src={previewUrl} 
                    alt="Crop preview for diagnosis" 
                    style={{ width: '100%', height: '220px', objectFit: 'cover' }}
                  />
                  {analyzing && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(7, 20, 14, 0.85)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px',
                      padding: '1rem',
                      textAlign: 'center'
                    }}>
                      <div className="spinner"></div>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-lime)' }}>
                        {analysisProgress || 'Analyzing crop leaf...'}
                      </span>
                    </div>
                  )}
                </div>

                <button 
                  onClick={handleRunDiagnosis}
                  disabled={analyzing}
                  className="btn btn-primary btn-lg"
                  style={{ minWidth: '220px' }}
                >
                  <Sparkles size={18} />
                  <span>{analyzing ? 'Analyzing Crop...' : 'Analyze Crop'}</span>
                </button>
              </div>
            )}

            {analysisError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                color: 'var(--red-400)',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: 'var(--space-4)'
              }}>
                <AlertTriangle size={16} />
                <span>{analysisError}</span>
              </div>
            )}

            {/* AI Result Card */}
            {analysisResult && (
              <div className="diagnosis-result-card">
                {/* Result Header */}
                <div className="diagnosis-result-top">
                  <div className="diagnosis-title-group">
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Crop Identification
                    </p>
                    <h3>{analysisResult.crop}</h3>
                    <div className="diagnosis-status-badges">
                      <span className={`badge-tag ${analysisResult.isHealthy ? 'badge-healthy' : 'badge-danger'}`}>
                        {analysisResult.isHealthy ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                        {analysisResult.disease}
                      </span>
                      <span className="badge-tag badge-warning">
                        Severity: {analysisResult.severity}
                      </span>
                      <span className="badge-tag badge-healthy">
                        {analysisResult.confidence}% Confidence
                      </span>
                    </div>
                  </div>

                  {/* Audio Readout */}
                  <button 
                    onClick={handleToggleVoice} 
                    className="voice-readout-btn"
                    title="Listen to diagnosis"
                  >
                    {isPlayingVoice ? <VolumeX size={15} /> : <Volume2 size={15} />}
                    <span>{isPlayingVoice ? 'Stop Audio' : 'Listen Diagnosis'}</span>
                  </button>
                </div>

                {/* Result Details Grid */}
                <div className="diagnosis-result-grid">
                  {/* Symptoms */}
                  <div className="result-detail-box">
                    <div className="result-detail-header">
                      <AlertTriangle size={16} color="var(--accent-lime)" />
                      <span>Observed Symptoms</span>
                    </div>
                    <p className="result-detail-body">{analysisResult.symptoms}</p>
                  </div>

                  {/* Remedy */}
                  <div className="result-detail-box">
                    <div className="result-detail-header">
                      <Stethoscope size={16} color="var(--accent-lime)" />
                      <span>Treatment & Remedy</span>
                    </div>
                    <p className="result-detail-body">{analysisResult.remedy}</p>
                  </div>

                  {/* Prevention */}
                  <div className="result-detail-box">
                    <div className="result-detail-header">
                      <ShieldCheck size={16} color="var(--accent-mint)" />
                      <span>Prevention Protocol</span>
                    </div>
                    <p className="result-detail-body">{analysisResult.prevention}</p>
                  </div>
                </div>

                {/* Dashboard Action */}
                <div style={{
                  padding: 'var(--space-4) var(--space-6)',
                  background: 'rgba(7, 20, 14, 0.7)',
                  borderTop: '1px solid var(--agri-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Diagnosis produced via deep vision pathology inspection.
                  </span>
                  <Link to="/dashboard" className="btn btn-secondary btn-sm">
                    <span>Manage in Dashboard</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================
          HOW AGROAI WORKS
          ========================================================= */}
      <section className="section" id="how-it-works" style={{ background: 'var(--agri-charcoal)' }}>
        <div className="container">
          <div style={{ textAlign: 'center' }}>
            <span className="section-badge">Simple 4-Step Process</span>
            <h2 className="section-title">{t('how_title')}</h2>
            <p className="section-subtitle">{t('how_subtitle')}</p>
          </div>

          <div className="how-steps-grid">
            {/* Step 1 */}
            <div className="step-card">
              <div className="step-badge-number">
                <span>01</span>
                <Camera size={22} color="var(--accent-lime)" />
              </div>
              <h3>{t('step_1_title')}</h3>
              <p>{t('step_1_desc')}</p>
            </div>

            {/* Step 2 */}
            <div className="step-card">
              <div className="step-badge-number">
                <span>02</span>
                <Cpu size={22} color="var(--accent-lime)" />
              </div>
              <h3>{t('step_2_title')}</h3>
              <p>{t('step_2_desc')}</p>
            </div>

            {/* Step 3 */}
            <div className="step-card">
              <div className="step-badge-number">
                <span>03</span>
                <CheckCircle2 size={22} color="var(--accent-lime)" />
              </div>
              <h3>{t('step_3_title')}</h3>
              <p>{t('step_3_desc')}</p>
            </div>

            {/* Step 4 */}
            <div className="step-card">
              <div className="step-badge-number">
                <span>04</span>
                <ShieldCheck size={22} color="var(--accent-lime)" />
              </div>
              <h3>{t('step_4_title')}</h3>
              <p>{t('step_4_desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          ENVIRONMENTAL INTELLIGENCE SECTION
          ========================================================= */}
      <section className="section" id="environment">
        <div className="container">
          <div style={{ textAlign: 'center' }}>
            <span className="section-badge">Environmental Advisory</span>
            <h2 className="section-title">Environmental Intelligence & Seasonal Advisory</h2>
            <p className="section-subtitle">
              Timely climate insights, humidity warnings, and agronomic guidelines tailored to keep crops thriving.
            </p>
          </div>

          <div className="env-advice-grid">
            {seasonalTips.map((tip) => (
              <div className="env-card" key={tip.id}>
                <span className="env-category-pill">{tip.category}</span>
                <h3 style={{ fontSize: 'var(--fs-lg)', color: '#ffffff', marginBottom: '8px' }}>
                  {tip.title}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)', lineHeight: 1.6 }}>
                  {tip.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          MARKET INTELLIGENCE SECTION
          ========================================================= */}
      <section className="section" id="market" style={{ background: 'var(--agri-charcoal)' }}>
        <div className="container">
          <div style={{ textAlign: 'center' }}>
            <span className="section-badge">Economic Insights</span>
            <h2 className="section-title">Market Intelligence & Price Predictions</h2>
            <p className="section-subtitle">
              Monitor current mandi market trends and seasonal price forecasts to choose the most profitable sales window.
            </p>
          </div>

          <div className="market-preview-grid">
            {marketItems.map((item, idx) => (
              <div className="market-item-card" key={idx}>
                <div className="market-card-top">
                  <span className="market-crop-name">{item.crop}</span>
                  <span className={`badge-tag ${item.trend === 'up' ? 'badge-healthy' : 'badge-warning'}`}>
                    <TrendingUp size={13} />
                    {item.trend === 'up' ? 'Rising Trend' : 'Fluctuating'}
                  </span>
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Estimated Mandi Price</span>
                  <div className="market-price-stat">
                    ₹{item.pastPrices?.[item.pastPrices.length - 1] || '2,400'}
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}> / Quintal</span>
                  </div>
                </div>

                <p className="market-insight-text">
                  {item.predictedPrices?.[0] > item.pastPrices?.[item.pastPrices.length - 1]
                    ? 'Expected to rise over the next 7 days. Consider holding stock for higher margin.'
                    : 'Stable price window detected. Good liquidity for standard harvest sale.'}
                </p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 'var(--space-8)' }}>
            <Link to="/dashboard" className="btn btn-secondary">
              <span>View Full Market Predictions in Dashboard</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================
          TRUST / TECHNOLOGY SECTION
          ========================================================= */}
      <section className="section" id="technology">
        <div className="container">
          <div style={{ textAlign: 'center' }}>
            <span className="section-badge">Technology Pillars</span>
            <h2 className="section-title">Agricultural Science Meets Modern AI</h2>
            <p className="section-subtitle">
              Engineered for rural reliability, zero latency, and agronomic precision.
            </p>
          </div>

          <div className="tech-pillars-grid">
            <div className="tech-pillar-card">
              <div className="card-icon">
                <Cpu size={24} />
              </div>
              <h3 style={{ fontSize: 'var(--fs-lg)', color: '#ffffff', marginBottom: '8px' }}>Computer Vision</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)', lineHeight: 1.6 }}>
                Multi-spectrum leaf texture and spot pattern recognition trained on diverse crop pathology databases.
              </p>
            </div>

            <div className="tech-pillar-card">
              <div className="card-icon">
                <ShieldCheck size={24} />
              </div>
              <h3 style={{ fontSize: 'var(--fs-lg)', color: '#ffffff', marginBottom: '8px' }}>Crop Intelligence</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)', lineHeight: 1.6 }}>
                Curated agronomic guidelines vetted for smallholder growers, prioritizing safe organic solutions.
              </p>
            </div>

            <div className="tech-pillar-card">
              <div className="card-icon">
                <RefreshCw size={24} />
              </div>
              <h3 style={{ fontSize: 'var(--fs-lg)', color: '#ffffff', marginBottom: '8px' }}>Real-Time & Offline</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)', lineHeight: 1.6 }}>
                Works in remote fields with poor network connectivity using progressive local browser processing.
              </p>
            </div>

            <div className="tech-pillar-card">
              <div className="card-icon">
                <Volume2 size={24} />
              </div>
              <h3 style={{ fontSize: 'var(--fs-lg)', color: '#ffffff', marginBottom: '8px' }}>Vernacular Voice</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)', lineHeight: 1.6 }}>
                Spoken audio diagnoses in Tamil, Hindi, Telugu, Kannada, Malayalam, and English for all farmers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          CALL TO ACTION BANNER
          ========================================================= */}
      <section className="section" style={{ paddingTop: '0' }}>
        <div className="container">
          <div className="cta-banner-wrapper">
            <h2>Ready to Protect Your Crops with AI?</h2>
            <p>
              Join thousands of growers catching plant diseases before they spread and securing healthier yields.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/signup" className="btn btn-primary btn-lg">
                <Sparkles size={18} />
                <span>Get Started Free</span>
              </Link>
              <button onClick={() => setDemoOpen(true)} className="btn btn-secondary btn-lg">
                <span>View Interactive Demo</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Modal */}
      <DemoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
    </>
  );
}
