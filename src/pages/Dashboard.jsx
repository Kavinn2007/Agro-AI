import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { analyzeImage } from '../services/aiService';
import { uploadImage, saveUploadRecord, saveResult, getHistory, getLocalImageUrl } from '../services/uploadService';
import { getNotifications, getDefaultNotifications, getSeasonalAdvice } from '../services/notificationService';
import LoadingSpinner from '../components/LoadingSpinner';
import MarketPrediction from '../components/MarketPrediction';
import Camera from '../components/Camera';
import { generateMockMarketData, getSmartRecommendation } from '../utils/marketData';
import { processImage } from '../utils/imagePipeline';

export default function Dashboard() {
  const { user, userProfile } = useAuth();
  const { t, language } = useLanguage();
  const fileInputRef = useRef(null);

  // Active tab
  const [activeTab, setActiveTab] = useState('upload');

  // Upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [dragover, setDragover] = useState(false);
  // Input modes
  const [scanMode, setScanMode] = useState('plant'); // 'plant' or 'soil'
  const [inputMode, setInputMode] = useState('upload'); // 'upload', 'camera', 'live'
  
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const voiceSynthesis = window.speechSynthesis;

  // Result state
  const [result, setResult] = useState(null);
  const [resultError, setResultError] = useState('');
  const processingLiveRef = useRef(false);
  const lastLiveApiCallRef = useRef(0);
  const lastLiveResultRef = useRef(null);

  // History state
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState([]);

  // Advice
  const advice = getSeasonalAdvice(language);

  const [marketData, setMarketData] = useState([]);
  
  useEffect(() => {
    try {
      let data = localStorage.getItem('agroai_market_data');
      if (!data) {
        data = generateMockMarketData();
        localStorage.setItem('agroai_market_data', JSON.stringify(data));
        setMarketData(data);
      } else {
        setMarketData(JSON.parse(data));
      }
    } catch (e) {
      setMarketData(generateMockMarketData());
    }
  }, []);

  const smartRec = getSmartRecommendation(marketData, scanMode, result);

  // Load history
  const loadHistory = useCallback(async () => {
    if (!user) return;
    setHistoryLoading(true);
    try {
      const data = await getHistory(user.id);
      setHistory(data);
    } catch (err) {
      console.error('Failed to load history:', err);
      // Use demo history if Supabase not configured
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [user]);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getNotifications(user.id);
      if (data.length === 0) {
        setNotifications(getDefaultNotifications());
      } else {
        setNotifications(data);
      }
    } catch {
      setNotifications(getDefaultNotifications());
    }
  }, [user]);

  useEffect(() => {
    loadHistory();
    loadNotifications();
  }, [loadHistory, loadNotifications]);

  // File handling
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const processFile = async (file) => {
    try {
      const dataUrl = await processImage(file);
      setSelectedFile(file);
      setPreviewUrl(dataUrl);
      setResult(null);
      setResultError('');
    } catch (err) {
      setResultError(err.message || 'Invalid image selected');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragover(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragover(true);
  };

  const handleDragLeave = () => {
    setDragover(false);
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setResultError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    voiceSynthesis.cancel();
    setIsPlayingVoice(false);
  };

  // Analyze image
  const handleAnalyze = async () => {
    if (!selectedFile && !previewUrl) {
      setResultError('Invalid image captured');
      return;
    }
    
    setUploading(true);
    setLoadingText(t('dash_analyzing'));
    setResultError('');
    setResult(null);

    try {
      let imageUrl = previewUrl;

      // Validation
      const { validateInput } = await import('../services/localAnalysis');
      const validationStatus = await validateInput(imageUrl, scanMode);
      if (!validationStatus.isValidCrop) {
        setResult(validationStatus);
        setUploading(false);
        return;
      }

      setLoadingText(scanMode === 'plant' ? 'Crop detected. Analyzing condition...' : 'Soil detected. Analyzing characteristics...');

      // Try to upload to Supabase if configured
      try {
        if (user) {
          const upload = await saveUploadRecord(user.id, imageUrl);

          const aiResult = await analyzeImage(imageUrl, language, scanMode);
          
          await saveResult(upload.id, aiResult);
          
          setResult(aiResult);
          loadHistory();
          return;
        }
      } catch (supabaseErr) {
        console.warn('Supabase not configured, using demo mode:', supabaseErr);
      }

      const aiResult = await analyzeImage(imageUrl, language, scanMode);
      setResult(aiResult);

    } catch (err) {
      setResultError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyzeLive = async (imageUrl) => {
    if (processingLiveRef.current) return;
    processingLiveRef.current = true;
    try {
      // Process locally first for live frames to avoid API rate limits
      const { validateInput, processLocally } = await import('../services/localAnalysis');
      const validationStatus = await validateInput(imageUrl, scanMode);
      if (!validationStatus.isValidCrop) {
        setResult(validationStatus);
        setResultError('');
        return;
      }

      const now = Date.now();
      if (now - lastLiveApiCallRef.current > 4500) {
        lastLiveApiCallRef.current = now;
        try {
          const aiResult = await analyzeImage(imageUrl, language, scanMode);
          lastLiveResultRef.current = aiResult;
          setResult(aiResult);
        } catch (apiErr) {
          if (lastLiveResultRef.current) {
            setResult(lastLiveResultRef.current);
          } else {
            const local = await processLocally(imageUrl, language, scanMode);
            setResult(local);
          }
        }
      } else if (lastLiveResultRef.current) {
        setResult(lastLiveResultRef.current);
      } else {
        const aiResult = await processLocally(imageUrl, language, scanMode);
        setResult(aiResult);
      }
      setResultError('');
    } catch (err) {
      console.error('Live analysis error', err);
      // Suppress technical errors during live scan, just rely on last result
      setResultError('');
    } finally {
      processingLiveRef.current = false;
    }
  };

  // View history item
  const viewHistoryItem = (item) => {
    if (item.results && item.results.length > 0) {
      const r = item.results[0];
      setResult({
        isValidCrop: r.isValidCrop !== false,
        multiLeaf: r.multiLeaf || false,
        severity: r.severity || '',
        disease: r.disease,
        symptoms: r.symptoms,
        remedy: r.remedy,
        prevention: r.prevention,
        confidence: r.confidence
      });
      setPreviewUrl(item.image_url);
      setActiveTab('upload');
    }
  };

  const playVoice = () => {
    if (!result) return;
    
    if (isPlayingVoice) {
      voiceSynthesis.cancel();
      setIsPlayingVoice(false);
      return;
    }

    const langMap = {
      'en': 'en-US',
      'ta': 'ta-IN',
      'hi': 'hi-IN',
      'te': 'te-IN',
      'kn': 'kn-IN',
      'ml': 'ml-IN'
    };

    const textToRead = result.disease === 'Healthy' 
      ? t('result_healthy_msg')
      : `${result.disease}. ${t('result_symptoms')}: ${result.symptoms}. ${t('result_remedy')}: ${result.remedy}`;

    const utterance = new SpeechSynthesisUtterance(textToRead);
    const targetLang = langMap[language] || 'en-US';
    utterance.lang = targetLang;
    
    // Select the best voice for the language
    const voices = voiceSynthesis.getVoices();
    const voice = voices.find(v => v.lang === targetLang) || 
                  voices.find(v => v.lang.startsWith(targetLang.split('-')[0]));
    if (voice) {
      utterance.voice = voice;
    }
    
    utterance.onend = () => setIsPlayingVoice(false);
    utterance.onerror = () => setIsPlayingVoice(false);

    voiceSynthesis.speak(utterance);
    setIsPlayingVoice(true);
  };

  const tabs = [
    { id: 'upload', icon: '📤', label: t('dash_upload') },
    { id: 'market', icon: '📈', label: 'Market Prices' },
    { id: 'history', icon: '📚', label: t('dash_history') },
    { id: 'notifications', icon: '🔔', label: t('dash_notifications') },
    { id: 'advice', icon: '🌾', label: t('dash_advice') },
  ];

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString(language === 'ta' ? 'ta-IN' : 'en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-grid">
          {/* Sidebar */}
          <aside className="dashboard-sidebar">
            <div style={{ 
              padding: 'var(--space-4)', 
              borderBottom: '1px solid var(--border-color)',
              marginBottom: 'var(--space-4)'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 'var(--space-3)',
                marginBottom: 'var(--space-2)'
              }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 'var(--radius-full)',
                  background: 'linear-gradient(135deg, var(--green-600), var(--cyan-500))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 'var(--fs-sm)',
                  fontWeight: 700
                }}>
                  {(userProfile?.name || user?.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 'var(--fs-sm)' }}>
                    {userProfile?.name || 'Farmer'}
                  </p>
                  <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
                    {user?.email || ''}
                  </p>
                </div>
              </div>
            </div>
            <nav className="sidebar-nav">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`sidebar-link ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="icon">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="dashboard-main">
            {/* Upload Tab */}
            {activeTab === 'upload' && (
              <div>
                <div className="dashboard-header">
                  <h2>📤 {t('dash_upload_title')}</h2>
                  <p>{t('dash_upload_desc')}</p>
                </div>
                
                {/* Input Modes Selection */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: 'var(--radius-full)' }}>
                    <button 
                      className={`btn ${scanMode === 'plant' ? 'btn-primary' : ''}`} 
                      style={{ borderRadius: 'var(--radius-full)', padding: '0.5rem 1.5rem', background: scanMode !== 'plant' ? 'transparent' : '', color: scanMode !== 'plant' ? 'var(--text-color)' : '' }}
                      onClick={() => setScanMode('plant')}
                    >
                      🍃 Plant Mode
                    </button>
                    <button 
                      className={`btn ${scanMode === 'soil' ? 'btn-primary' : ''}`} 
                      style={{ borderRadius: 'var(--radius-full)', padding: '0.5rem 1.5rem', background: scanMode !== 'soil' ? 'transparent' : '', color: scanMode !== 'soil' ? 'var(--text-color)' : '' }}
                      onClick={() => setScanMode('soil')}
                    >
                      🌍 Soil Mode
                    </button>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button className={`btn ${inputMode === 'upload' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setInputMode('upload')}>📤 Upload Image</button>
                    <button className={`btn ${inputMode === 'camera' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setInputMode('camera')}>📸 Open Camera</button>
                    <button className={`btn ${inputMode === 'live' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setInputMode('live')}>🔴 Live Video</button>
                  </div>
                </div>

                {/* Upload / Camera / Live Zone */}
                {inputMode === 'camera' || inputMode === 'live' ? (
                  <div style={{ marginBottom: 'var(--space-6)' }}>
                    <Camera 
                      isLive={inputMode === 'live'}
                      onCapture={(file) => {
                        processFile(file);
                        setInputMode('upload');
                      }}
                      onFrame={handleAnalyzeLive}
                      onCancel={() => setInputMode('upload')}
                    />
                  </div>
                ) : (
                  <div
                    className={`upload-zone ${dragover ? 'dragover' : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                      id="file-upload"
                    />
                    
                    {!previewUrl ? (
                      <>
                        <span className="upload-icon">📸</span>
                        <h3>Upload Image</h3>
                        <p>{t('dash_upload_hint')}</p>
                      </>
                    ) : (
                      <div className="upload-preview" onClick={e => e.stopPropagation()}>
                        <img src={previewUrl} alt="Crop preview" />
                        <button className="remove-btn" onClick={removeFile}>✕</button>
                      </div>
                    )}
                  </div>
                )}

                {/* Analyze Button */}
                {previewUrl && !uploading && (
                  <div style={{ textAlign: 'center', marginTop: 'var(--space-6)' }}>
                    <button 
                      className="btn btn-primary btn-lg"
                      onClick={handleAnalyze}
                      disabled={uploading}
                    >
                      🤖 {t('dash_analyze')}
                    </button>
                  </div>
                )}

                {/* Loading */}
                {uploading && (
                  <LoadingSpinner text={loadingText || t('dash_analyzing')} />
                )}

                {/* Error */}
                {resultError && (
                  <div style={{
                    marginTop: 'var(--space-6)',
                    padding: 'var(--space-4) var(--space-6)',
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid var(--red-400)',
                    borderRadius: 'var(--radius-lg)',
                    color: 'var(--red-400)',
                    fontSize: 'var(--fs-sm)'
                  }}>
                    ⚠️ {resultError}
                  </div>
                )}

                {/* Result */}
                {result && (
                  <div style={{ marginTop: 'var(--space-6)' }}>
                    {!result.isValidCrop ? (
                      <div className="result-card" style={{ borderLeft: '4px solid var(--red-500)' }}>
                        <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
                          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>❓</div>
                          <h3 style={{ color: 'var(--red-400)', marginBottom: 'var(--space-2)' }}>
                            {result.message || 'Invalid input. Please show plant leaves or soil clearly.'}
                          </h3>
                          <p></p>
                        </div>
                      </div>
                    ) : result.confidence < 60 ? (
                      <div className="result-card" style={{ borderLeft: '4px solid var(--yellow-500)' }}>
                        <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
                          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>⚠️</div>
                          <h3 style={{ color: 'var(--yellow-400)', marginBottom: 'var(--space-2)' }}>{t('result_uncertain')}</h3>
                          <p>{t('result_uncertain_msg')}</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {result.multiLeaf && scanMode === 'plant' && (
                          <div style={{ 
                            marginBottom: 'var(--space-4)', 
                            padding: 'var(--space-3)', 
                            background: 'rgba(59, 130, 246, 0.1)', 
                            borderLeft: '4px solid var(--blue-500)',
                            borderRadius: 'var(--radius-md)'
                          }}>
                            ℹ️ Multiple leaves detected. {result.disease === 'Healthy' ? 'All leaves appear healthy.' : 'Some leaves are healthy, some show disease.'}
                          </div>
                        )}
                        
                        {(scanMode === 'soil' || result.isSoil) ? (
                          <div className="result-card">
                            <div className="result-header">
                              <div>
                                <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                                  Soil Classification
                                </p>
                                <h3 className="result-disease" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                  🌍 {result.soilType || 'Soil'}
                                  <button 
                                    onClick={playVoice}
                                    className="btn-secondary"
                                    style={{
                                      padding: '4px 8px',
                                      borderRadius: '50%',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '1rem',
                                      border: '1px solid var(--border-color)',
                                      background: isPlayingVoice ? 'var(--green-500)' : 'transparent',
                                    }}
                                    title={isPlayingVoice ? "Stop Voice" : "Read Aloud"}
                                  >
                                    {isPlayingVoice ? '⏸️' : '🔊'}
                                  </button>
                                </h3>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                {result.confidence && (
                                  <span className="result-confidence">
                                    📊 {result.confidence}%
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="result-sections">
                              <div className="result-section">
                                <div className="result-section-icon symptoms">💧</div>
                                <div className="result-section-content">
                                  <h4>Characteristics & Water</h4>
                                  <p>{result.characteristics} • <strong>Water Requirement:</strong> {result.waterRequirement}</p>
                                </div>
                              </div>

                              <div className="result-section">
                                <div className="result-section-icon remedy">🌾</div>
                                <div className="result-section-content">
                                  <h4>Suitable Crops</h4>
                                  <p>{result.suitableCrops}</p>
                                </div>
                              </div>

                              <div className="result-section">
                                <div className="result-section-icon prevention">📦</div>
                                <div className="result-section-content">
                                  <h4>Fertilizer Suggestions</h4>
                                  <p>{result.fertilizerSuggestions}</p>
                                </div>
                              </div>
                            </div>
                            
                            {smartRec && (
                              <div style={{ 
                                marginTop: 'var(--space-6)', 
                                padding: 'var(--space-4)', 
                                background: 'rgba(16, 185, 129, 0.1)', 
                                border: '1px solid var(--green-400)',
                                borderRadius: 'var(--radius-lg)',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 'var(--space-4)'
                              }}>
                                <div style={{ fontSize: '2rem' }}>{smartRec.icon}</div>
                                <div>
                                  <h4 style={{ color: 'var(--green-600)', margin: '0 0 var(--space-2) 0' }}>{smartRec.title}</h4>
                                  <p style={{ margin: 0 }}>{smartRec.text}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="result-card">
                            <div className="result-header">
                              <div>
                                <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                                  {result.confidence < 50 
                                    ? "Crop detected (confidence low)" 
                                    : `Detected Crop: ${result.crop && result.crop !== 'Unknown Crop' ? result.crop : 'Plant'}`}
                                </p>
                                <h3 className="result-disease" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                  {result.disease === 'Healthy' ? `✅ ${t('result_healthy')}` : `🔍 ${result.disease}`}
                                  <button 
                                    onClick={playVoice}
                                    className="btn-secondary"
                                    style={{
                                      padding: '4px 8px',
                                      borderRadius: '50%',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '1rem',
                                      border: '1px solid var(--border-color)',
                                      background: isPlayingVoice ? 'var(--green-500)' : 'transparent',
                                    }}
                                    title={isPlayingVoice ? "Stop Voice" : "Read Aloud"}
                                  >
                                    {isPlayingVoice ? '⏸️' : '🔊'}
                                  </button>
                                </h3>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                {result.confidence && (
                                  <span className="result-confidence">
                                    📊 {result.confidence}%
                                  </span>
                                )}
                                {result.severity && result.disease !== 'Healthy' && (
                                  <div style={{ 
                                    marginTop: '0.5rem', 
                                    fontSize: 'var(--fs-xs)',
                                    padding: '0.2rem 0.6rem',
                                    borderRadius: 'var(--radius-full)',
                                    display: 'inline-block',
                                    background: String(result.severity).toLowerCase().includes('high') ? 'rgba(239, 68, 68, 0.2)' : 
                                                String(result.severity).toLowerCase().includes('med') ? 'rgba(245, 158, 11, 0.2)' : 
                                                'rgba(16, 185, 129, 0.2)',
                                    color: String(result.severity).toLowerCase().includes('high') ? 'var(--red-400)' : 
                                           String(result.severity).toLowerCase().includes('med') ? 'var(--yellow-400)' : 
                                           'var(--green-400)'
                                  }}>
                                    Severity: {result.severity}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="result-sections">
                              <div className="result-section">
                                <div className="result-section-icon symptoms">📊</div>
                                <div className="result-section-content" style={{ width: '100%' }}>
                                  <h4>Crops Analysis Result</h4>
                                  <ul style={{ listStyleType: 'disc', paddingLeft: '20px', lineHeight: '1.8' }}>
                                    <li><strong>Crop Name:</strong> {result.crop || 'Plant'}</li>
                                    <li><strong>Health Status:</strong> {result.disease === 'Healthy' ? 'Healthy' : 'Diseased'}</li>
                                    {result.disease !== 'Healthy' && (
                                      <li><strong>Disease Name:</strong> {result.disease}</li>
                                    )}
                                    <li><strong>Confidence:</strong> {result.confidence}%</li>
                                    <li><strong>Solution:</strong> {result.remedy || result.prevention || 'Maintain balanced soil nutrients and proper watering.'}</li>
                                    {result.soilType && (
                                      <li><strong>Soil Info:</strong> {result.soilType} {result.characteristics ? `- ${result.characteristics}` : ''}</li>
                                    )}
                                  </ul>
                                </div>
                              </div>
                            </div>
                            
                            {smartRec && (
                              <div style={{ 
                                marginTop: 'var(--space-6)', 
                                padding: 'var(--space-4)', 
                                background: 'rgba(16, 185, 129, 0.1)', 
                                border: '1px solid var(--green-400)',
                                borderRadius: 'var(--radius-lg)',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 'var(--space-4)'
                              }}>
                                <div style={{ fontSize: '2rem' }}>{smartRec.icon}</div>
                                <div>
                                  <h4 style={{ color: 'var(--green-600)', margin: '0 0 var(--space-2) 0' }}>{smartRec.title}</h4>
                                  <p style={{ margin: 0 }}>{smartRec.text}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Market Prices Tab */}
            {activeTab === 'market' && (
              <div>
                <div className="dashboard-header">
                  <h2>📈 Market Trends & Predictions</h2>
                  <p>AI-powered insights for best selling time and price forecasting.</p>
                </div>
                <MarketPrediction />
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div>
                <div className="dashboard-header">
                  <h2>📚 {t('dash_history_title')}</h2>
                  <p>{t('dash_history_desc')}</p>
                </div>

                {historyLoading ? (
                  <LoadingSpinner />
                ) : history.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📋</div>
                    <h3>{t('dash_no_history')}</h3>
                    <p>{t('dash_no_history_desc')}</p>
                    <button 
                      className="btn btn-primary" 
                      style={{ marginTop: 'var(--space-4)' }}
                      onClick={() => setActiveTab('upload')}
                    >
                      📤 {t('dash_upload')}
                    </button>
                  </div>
                ) : (
                  <div className="history-list">
                    {history.map((item) => (
                      <div 
                        className="history-item" 
                        key={item.id}
                        onClick={() => viewHistoryItem(item)}
                      >
                        <img 
                          src={item.image_url} 
                          alt="Crop" 
                          onError={(e) => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect fill="%23064e3b" width="80" height="80"/><text x="40" y="45" text-anchor="middle" fill="%2310b981" font-size="24">🌿</text></svg>'; }}
                        />
                        <div className="history-info">
                          <h4>{item.results?.[0]?.disease || 'Analysis'}</h4>
                          <p>{item.results?.[0]?.symptoms?.substring(0, 100) || 'View details'}...</p>
                          <p className="history-date">{formatDate(item.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div>
                <div className="dashboard-header">
                  <h2>🔔 {t('dash_notif_title')}</h2>
                  <p>{t('dash_notif_desc')}</p>
                </div>

                {notifications.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">🔕</div>
                    <h3>{t('dash_no_notif')}</h3>
                    <p>{t('dash_no_notif_desc')}</p>
                  </div>
                ) : (
                  <div>
                    {notifications.map((notif) => (
                      <div className="notification-item" key={notif.id}>
                        <div className="notification-dot"></div>
                        <div className="notification-content">
                          <p>{notif.message}</p>
                          <p className="notification-time">{formatDate(notif.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Advice Tab */}
            {activeTab === 'advice' && (
              <div>
                <div className="dashboard-header">
                  <h2>🌾 {t('dash_advice_title')}</h2>
                  <p>{t('dash_advice_desc')}</p>
                </div>

                <div className="grid-2">
                  {advice.map((item) => (
                    <div className="advice-card" key={item.id}>
                      <span className="advice-category">{item.category}</span>
                      <h4>{item.title}</h4>
                      <p>{item.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
