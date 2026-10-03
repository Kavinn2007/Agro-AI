import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { analyzeImage } from '../services/aiService';
import { uploadImage, saveUploadRecord, saveResult } from '../services/uploadService';
import { processImage } from '../utils/imagePipeline';
import { generateMockMarketData, getSmartRecommendation } from '../utils/marketData';
import Camera from '../components/Camera';
import { 
  Camera as CameraIcon, 
  UploadCloud, 
  Video, 
  RotateCcw, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Leaf, 
  Info,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MobileDisease() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const fileInputRef = useRef(null);

  // Scan Mode: 'plant' or 'soil'
  const [scanMode, setScanMode] = useState('plant');

  // Input Mode: 'upload', 'camera', 'live'
  const [inputMode, setInputMode] = useState(searchParams.get('mode') === 'camera' ? 'camera' : 'upload');

  // Image & Flow state
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeStep, setAnalyzeStep] = useState('');
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Voice synthesis
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);

  // Market data for smart recommendations
  const [marketData, setMarketData] = useState([]);

  useEffect(() => {
    try {
      const data = generateMockMarketData();
      setMarketData(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const smartRec = getSmartRecommendation(marketData, scanMode, result);

  // File Picker
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setErrorMsg('');
      const dataUrl = await processImage(file);
      setSelectedFile(file);
      setPreviewUrl(dataUrl);
      setResult(null);
    } catch (err) {
      setErrorMsg(err.message || 'Could not process image');
    }
  };

  // Camera Capture
  const handleCameraCapture = (imageDataUrl) => {
    setPreviewUrl(imageDataUrl);
    setSelectedFile(null);
    setResult(null);
    setErrorMsg('');
    setInputMode('upload'); // return to preview stage
  };

  // Live Analysis Callback
  const handleLiveFrame = async (frameUrl) => {
    // Process single frame
    try {
      const { validateInput } = await import('../services/localAnalysis');
      const val = await validateInput(frameUrl, scanMode);
      if (val.isValidCrop) {
        const res = await analyzeImage(frameUrl, language, scanMode);
        if (res) {
          setResult(res);
        }
      }
    } catch (e) {
      console.warn('Live frame analysis skipped', e);
    }
  };

  // Reset / Clear
  const handleReset = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    setResult(null);
    setErrorMsg('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingVoice(false);
  };

  // Analyze Action
  const handleAnalyze = async () => {
    if (!previewUrl) {
      setErrorMsg('Please select or capture a crop photo first.');
      return;
    }

    setAnalyzing(true);
    setErrorMsg('');
    setResult(null);
    setAnalyzeStep('Validating leaf characteristics...');

    try {
      // 1. Validation
      const { validateInput } = await import('../services/localAnalysis');
      const validationStatus = await validateInput(previewUrl, scanMode);
      
      if (!validationStatus.isValidCrop) {
        setResult(validationStatus);
        setAnalyzing(false);
        return;
      }

      setAnalyzeStep(scanMode === 'plant' 
        ? 'Scanning foliar health & pathogens...' 
        : 'Evaluating soil composition & nutrients...');

      // 2. Perform AI Vision inference
      const aiResult = await analyzeImage(previewUrl, language, scanMode);

      // 3. Save to history if logged in
      if (user && aiResult) {
        try {
          const uploadRecord = await saveUploadRecord(user.id, previewUrl);
          if (uploadRecord?.id) {
            await saveResult(uploadRecord.id, aiResult);
          }
        } catch (dbErr) {
          console.warn('Upload history save fallback:', dbErr);
        }
      }

      setResult(aiResult);
    } catch (err) {
      console.error('Diagnosis failed:', err);
      setErrorMsg(err.message || 'Analysis failed. Please try a clearer leaf photo.');
    } finally {
      setAnalyzing(false);
      setAnalyzeStep('');
    }
  };

  // Text-to-speech voice readout
  const handleToggleVoice = () => {
    if (!window.speechSynthesis || !result) return;

    if (isPlayingVoice) {
      window.speechSynthesis.cancel();
      setIsPlayingVoice(false);
      return;
    }

    const langMap = {
      en: 'en-US',
      ta: 'ta-IN',
      hi: 'hi-IN',
      te: 'te-IN',
      kn: 'kn-IN',
      ml: 'ml-IN'
    };

    let textToRead = '';
    if (result.disease === 'Healthy') {
      textToRead = `${result.crop || 'Plant'} is healthy. No critical diseases detected. Continue good farming practices.`;
    } else {
      textToRead = `Detected: ${result.crop || 'Crop'} with ${result.disease}. Remedy: ${result.remedy || result.prevention || 'Consult agricultural officer.'}`;
    }

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = langMap[language] || 'en-US';
    utterance.onend = () => setIsPlayingVoice(false);
    utterance.onerror = () => setIsPlayingVoice(false);

    window.speechSynthesis.speak(utterance);
    setIsPlayingVoice(true);
  };

  return (
    <div className="mobile-page-content mobile-disease-screen">
      {/* 1. TOP TITLE & MODE TOGGLE */}
      <div className="mobile-subpage-header">
        <h2 className="mobile-subpage-title">AI Diagnosis Engine</h2>
        <p className="mobile-subpage-desc">Instant foliar disease identification & treatment guide</p>
      </div>

      {/* Mode Switcher Pill (Plant / Soil) */}
      <div className="disease-mode-toggle">
        <button
          className={`mode-pill ${scanMode === 'plant' ? 'active' : ''}`}
          onClick={() => { setScanMode('plant'); setResult(null); }}
        >
          <Leaf size={16} />
          <span>Plant Health</span>
        </button>
        <button
          className={`mode-pill ${scanMode === 'soil' ? 'active' : ''}`}
          onClick={() => { setScanMode('soil'); setResult(null); }}
        >
          <span>🌍 Soil Analysis</span>
        </button>
      </div>

      {/* ====================================================
          STAGE 1: CAPTURE / SELECT (IF NO RESULT & NO PREVIEW OR CAMERA)
          ==================================================== */}
      {!result && (
        <>
          {/* Input Method Buttons */}
          <div className="input-method-row">
            <button
              className={`input-tab-btn ${inputMode === 'camera' ? 'active' : ''}`}
              onClick={() => setInputMode('camera')}
            >
              <CameraIcon size={18} />
              <span>Camera</span>
            </button>
            <button
              className={`input-tab-btn ${inputMode === 'upload' ? 'active' : ''}`}
              onClick={() => setInputMode('upload')}
            >
              <UploadCloud size={18} />
              <span>Upload Photo</span>
            </button>
            <button
              className={`input-tab-btn ${inputMode === 'live' ? 'active' : ''}`}
              onClick={() => setInputMode('live')}
            >
              <Video size={18} />
              <span>Live Scanner</span>
            </button>
          </div>

          {/* ACTIVE CAMERA VIEW */}
          {(inputMode === 'camera' || inputMode === 'live') && (
            <div className="camera-view-wrapper">
              <Camera 
                isLive={inputMode === 'live'}
                onCapture={handleCameraCapture}
                onFrame={handleLiveFrame}
                onCancel={() => setInputMode('upload')}
              />
            </div>
          )}

          {/* ACTIVE UPLOAD VIEW */}
          {inputMode === 'upload' && !previewUrl && (
            <div 
              className="mobile-upload-box"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                id="mobile-crop-file-input"
              />

              <div className="upload-box-icon-wrap">
                <UploadCloud size={36} color="var(--accent-lime)" />
              </div>

              <h4 className="upload-box-heading">Tap to Select Crop Photo</h4>
              <p className="upload-box-sub">Take photo with camera or browse photo gallery</p>

              <div className="upload-sample-strip" onClick={(e) => e.stopPropagation()}>
                <span className="sample-label">Or test with demo sample:</span>
                <button 
                  className="sample-leaf-chip"
                  onClick={() => {
                    setPreviewUrl('/sample_early_blight.jpg');
                    setResult(null);
                    setErrorMsg('');
                  }}
                >
                  🍃 Tomato Early Blight
                </button>
              </div>
            </div>
          )}

          {/* IMAGE PREVIEW & READY TO ANALYZE */}
          {inputMode === 'upload' && previewUrl && !analyzing && (
            <div className="preview-card-wrapper">
              <div className="preview-image-container">
                <img src={previewUrl} alt="Crop Leaf Preview" className="preview-crop-image" />
                <button 
                  className="preview-retake-btn" 
                  onClick={handleReset}
                  title="Retake or Choose Another Photo"
                >
                  <RotateCcw size={16} />
                  <span>Change Photo</span>
                </button>
              </div>

              {/* Large Touch-friendly Analyze Button */}
              <button 
                className="btn-analyze-large"
                onClick={handleAnalyze}
                disabled={analyzing}
              >
                <Sparkles size={20} />
                <span>Analyze Crop Condition</span>
              </button>
            </div>
          )}

          {/* LOADING STATE ANIMATION */}
          {analyzing && (
            <div className="analysis-loading-card">
              <div className="radar-circle-wrap">
                <div className="radar-ping-ring" />
                <div className="radar-core">
                  <Leaf size={28} color="#22c55e" />
                </div>
              </div>
              <h4 className="loading-title">Neural Vision Analyzing...</h4>
              <p className="loading-step">{analyzeStep || 'Detecting crop and foliage condition...'}</p>
            </div>
          )}

          {/* ERROR ALERT */}
          {errorMsg && (
            <div className="mobile-error-alert">
              <AlertTriangle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}
        </>
      )}

      {/* ====================================================
          STAGE 2: PREDICTION RESULT CARD (STRICT REQUIREMENT)
          ==================================================== */}
      {result && (
        <div className="mobile-result-screen">
          {/* Invalid crop fallback */}
          {!result.isValidCrop ? (
            <div className="result-alert-box error">
              <HelpCircle size={36} color="var(--red-400)" />
              <h3 className="result-heading">No Crop Leaf Recognized</h3>
              <p className="result-desc">
                {result.message || 'Please capture a clear, close-up photo of the leaf or soil.'}
              </p>
              <button className="btn-primary-mobile" onClick={handleReset}>
                <RotateCcw size={16} />
                <span>Scan Another Image</span>
              </button>
            </div>
          ) : (
            <div className="mobile-result-card">
              {/* Image banner & header */}
              {previewUrl && (
                <div className="result-photo-strip">
                  <img src={previewUrl} alt="Analyzed Crop" />
                  <div className="result-photo-overlay" />
                  <div className="result-badge-row">
                    <span className="result-crop-tag">
                      {result.crop || 'Crop'}
                    </span>
                    <span className={`result-status-tag ${result.disease === 'Healthy' ? 'healthy' : 'diseased'}`}>
                      {result.disease === 'Healthy' ? 'Healthy Foliage' : 'Disease Detected'}
                    </span>
                  </div>
                </div>
              )}

              {/* Diagnosis Top Line */}
              <div className="result-main-info">
                <div className="result-diagnosis-row">
                  <div>
                    <span className="result-sub-label">Diagnosis Result</span>
                    <h3 className="result-disease-title">
                      {result.disease === 'Healthy' ? 'Healthy Crop' : result.disease}
                    </h3>
                  </div>

                  {/* Audio Readout */}
                  <button 
                    className={`btn-voice-round ${isPlayingVoice ? 'speaking' : ''}`}
                    onClick={handleToggleVoice}
                    aria-label="Read Out Diagnosis"
                  >
                    {isPlayingVoice ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </button>
                </div>

                {/* Confidence Bar */}
                <div className="result-confidence-box">
                  <div className="conf-header">
                    <span>Confidence Score</span>
                    <span className="conf-value">{result.confidence || 95}%</span>
                  </div>
                  <div className="conf-progress-track">
                    <div 
                      className="conf-progress-fill"
                      style={{ width: `${Math.min(100, Math.max(30, result.confidence || 95))}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Symptoms / Observation */}
              {result.symptoms && (
                <div className="result-detail-section">
                  <div className="detail-section-header">
                    <Info size={16} className="detail-icon symptoms" />
                    <h4>Symptoms & Observations</h4>
                  </div>
                  <p className="detail-section-body">{result.symptoms}</p>
                </div>
              )}

              {/* Actionable Remedy / Organic Solution */}
              {result.remedy && (
                <div className="result-detail-section remedy-section">
                  <div className="detail-section-header">
                    <ShieldCheck size={16} className="detail-icon remedy" />
                    <h4>Recommended Action & Remedy</h4>
                  </div>
                  <p className="detail-section-body">{result.remedy}</p>
                </div>
              )}

              {/* Preventive Measures */}
              {result.prevention && (
                <div className="result-detail-section">
                  <div className="detail-section-header">
                    <CheckCircle2 size={16} className="detail-icon prevention" />
                    <h4>Prevention & Future Care</h4>
                  </div>
                  <p className="detail-section-body">{result.prevention}</p>
                </div>
              )}

              {/* Soil details if soil mode */}
              {result.soilType && (
                <div className="result-detail-section">
                  <div className="detail-section-header">
                    <Leaf size={16} className="detail-icon soil" />
                    <h4>Soil Characteristics & Fertilizers</h4>
                  </div>
                  <p className="detail-section-body">
                    <strong>Type:</strong> {result.soilType}<br />
                    {result.characteristics && <><strong>Features:</strong> {result.characteristics}<br /></>}
                    {result.fertilizerSuggestions && <><strong>Fertilizer:</strong> {result.fertilizerSuggestions}</>}
                  </p>
                </div>
              )}

              {/* Smart Market Recommendation linked to crop/disease */}
              {smartRec && (
                <div className="result-smart-rec">
                  <div className="smart-rec-icon">{smartRec.icon}</div>
                  <div>
                    <h5 className="smart-rec-title">{smartRec.title}</h5>
                    <p className="smart-rec-text">{smartRec.text}</p>
                  </div>
                </div>
              )}

              {/* ACTION: ANALYZE ANOTHER IMAGE */}
              <div className="result-action-footer">
                <button className="btn-primary-mobile" onClick={handleReset}>
                  <RotateCcw size={18} />
                  <span>Analyze Another Crop</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* BOTTOM SAFE AREA */}
      <div style={{ height: 'var(--space-8)' }} />
    </div>
  );
}
