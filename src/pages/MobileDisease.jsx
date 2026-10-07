import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { analyzeImage } from '../services/aiService';
import { validateInput } from '../services/localAnalysis';
import { saveUploadRecord, saveResult } from '../services/uploadService';
import { processImage } from '../utils/imagePipeline';
import Camera from '../components/Camera';
import { 
  UploadCloud, 
  Video, 
  Camera as CameraIcon, 
  RotateCcw, 
  Trash2,
  Volume2, 
  VolumeX, 
  AlertCircle,
  ShieldCheck,
  Info
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function MobileDisease() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { language } = useLanguage();

  const fileInputRef = useRef(null);
  const takePhotoInputRef = useRef(null);

  // View state: 'select' (3 primary options), 'live-camera' (WebRTC), 'preview' (Image selected), 'result' (Analysis complete)
  const [currentView, setCurrentView] = useState(() => {
    const mode = searchParams.get('mode');
    if (mode === 'camera' || mode === 'live') return 'live-camera';
    return 'select';
  });

  const [previewUrl, setPreviewUrl] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // 1. UPLOAD PHOTO HANDLER
  const handleUploadFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setErrorMsg('');
      const dataUrl = await processImage(file);
      setPreviewUrl(dataUrl);
      setResult(null);
      setCurrentView('preview');
    } catch (err) {
      setErrorMsg(err.message || 'Could not process image');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 2. TAKE PHOTO (NATIVE MOBILE CAMERA) HANDLER
  const handleTakePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setErrorMsg('');
      const dataUrl = await processImage(file);
      setPreviewUrl(dataUrl);
      setResult(null);
      setCurrentView('preview');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to capture photo');
    } finally {
      if (takePhotoInputRef.current) takePhotoInputRef.current.value = '';
    }
  };

  // 3. LIVE CAMERA CAPTURE HANDLER
  const handleLiveCameraCapture = (capturedDataUrl) => {
    setPreviewUrl(capturedDataUrl);
    setResult(null);
    setErrorMsg('');
    setCurrentView('preview');
  };

  // REMOVE / RESET IMAGE
  const handleRemoveImage = () => {
    setPreviewUrl(null);
    setResult(null);
    setErrorMsg('');
    setCurrentView('select');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (takePhotoInputRef.current) takePhotoInputRef.current.value = '';
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingVoice(false);
  };

  // REPLACE IMAGE (TRIGGER UPLOAD)
  const handleReplaceImage = () => {
    fileInputRef.current?.click();
  };

  // 4. DISEASE ANALYSIS (PRESERVED AI INFERENCE)
  const handleAnalyze = async () => {
    if (!previewUrl) return;

    setAnalyzing(true);
    setErrorMsg('');
    setResult(null);

    try {
      // Input validation using existing local validator
      const validationStatus = await validateInput(previewUrl, 'plant');

      if (!validationStatus.isValidCrop) {
        setResult(validationStatus);
        setCurrentView('result');
        setAnalyzing(false);
        return;
      }

      // Execute AI inference via preserved service
      const aiResult = await analyzeImage(previewUrl, language, 'plant');

      // Persist to user history if authenticated
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
      setCurrentView('result');
    } catch (err) {
      console.error('Diagnosis error:', err);
      setErrorMsg(err.message || 'Analysis failed. Please try a clearer leaf photo.');
    } finally {
      setAnalyzing(false);
    }
  };

  // VOICE READOUT (ACCESSIBLE AUDIO READOUT)
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
    const reliabilityText = result.reliabilityLabel ? `Status: ${result.reliabilityLabel}.` : '';
    if (result.disease === 'Healthy') {
      textToRead = `AI Prediction: ${result.crop || 'Plant'} is healthy. Confidence: ${result.confidence || 75}%. ${reliabilityText}`;
    } else {
      textToRead = `AI Prediction: ${result.crop || 'Crop'} with ${result.disease}. Confidence: ${result.confidence || 75}%. ${reliabilityText} Treatment: ${result.remedy || result.prevention || 'Consult local agricultural extension officer.'}`;
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
      <h2 className="mobile-screen-title">Disease Detection</h2>

      {/* Hidden file inputs for Upload and Native Camera */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleUploadFileChange}
        style={{ display: 'none' }}
      />
      <input
        ref={takePhotoInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        capture="environment"
        onChange={handleTakePhotoChange}
        style={{ display: 'none' }}
      />

      {/* ====================================================
          STAGE 1: THREE PRIMARY INPUT METHODS (SELECT VIEW)
          ==================================================== */}
      {currentView === 'select' && (
        <div className="disease-input-options-container">
          {/* Option 1: UPLOAD PHOTO */}
          <motion.div
            className="disease-input-card"
            whileTap={{ scale: 0.98 }}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
            aria-label="Upload Photo from device"
          >
            <div className="disease-input-icon-wrap upload">
              <UploadCloud size={24} />
            </div>
            <div className="disease-input-card-info">
              <span className="disease-input-card-title">Upload Photo</span>
              <span className="disease-input-card-desc">Choose JPG, PNG, or WebP from device</span>
            </div>
          </motion.div>

          {/* Option 2: LIVE CAMERA */}
          <motion.div
            className="disease-input-card"
            whileTap={{ scale: 0.98 }}
            onClick={() => setCurrentView('live-camera')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setCurrentView('live-camera'); }}
            aria-label="Open Live Camera viewfinder"
          >
            <div className="disease-input-icon-wrap live">
              <Video size={24} />
            </div>
            <div className="disease-input-card-info">
              <span className="disease-input-card-title">Live Camera</span>
              <span className="disease-input-card-desc">Real-time viewfinder with shutter capture</span>
            </div>
          </motion.div>

          {/* Option 3: TAKE PHOTO */}
          <motion.div
            className="disease-input-card"
            whileTap={{ scale: 0.98 }}
            onClick={() => takePhotoInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') takePhotoInputRef.current?.click(); }}
            aria-label="Take Photo using native camera"
          >
            <div className="disease-input-icon-wrap photo">
              <CameraIcon size={24} />
            </div>
            <div className="disease-input-card-info">
              <span className="disease-input-card-title">Take Photo</span>
              <span className="disease-input-card-desc">Instant capture with device camera app</span>
            </div>
          </motion.div>

          {errorMsg && (
            <div className="clean-error-alert" role="alert">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      )}

      {/* ====================================================
          STAGE 2: LIVE CAMERA VIEWFINDER
          ==================================================== */}
      {currentView === 'live-camera' && (
        <div className="live-camera-wrapper">
          <Camera
            onCapture={handleLiveCameraCapture}
            onCancel={() => setCurrentView('select')}
          />
        </div>
      )}

      {/* ====================================================
          STAGE 3: IMAGE PREVIEW & ACTIONS (ANALYZE / REPLACE / REMOVE)
          ==================================================== */}
      {currentView === 'preview' && previewUrl && (
        <div className="clean-preview-wrapper">
          <div className="clean-preview-box">
            <img 
              src={previewUrl} 
              alt="Crop Leaf Preview" 
              className="clean-preview-img" 
            />
            <div className="clean-preview-overlay-actions">
              <button 
                type="button"
                className="clean-preview-pill-btn" 
                onClick={handleReplaceImage}
                disabled={analyzing}
                title="Replace Image"
                aria-label="Replace Image"
              >
                <RotateCcw size={14} />
                <span>Replace</span>
              </button>
              <button 
                type="button"
                className="clean-preview-pill-btn danger" 
                onClick={handleRemoveImage}
                disabled={analyzing}
                title="Remove Image"
                aria-label="Remove Image"
              >
                <Trash2 size={14} />
                <span>Remove</span>
              </button>
            </div>
          </div>

          {analyzing ? (
            <div className="clean-loading-box">
              <div className="clean-spinner" />
              <span className="clean-loading-text">Analyzing Crop Health...</span>
            </div>
          ) : (
            <button 
              type="button" 
              className="clean-analyze-btn" 
              onClick={handleAnalyze}
            >
              Analyze
            </button>
          )}

          {errorMsg && (
            <div className="clean-error-alert" role="alert">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      )}

      {/* ====================================================
          STAGE 4: AI RESULT SCREEN (SAFE & RESPONSIBLE)
          ==================================================== */}
      {currentView === 'result' && result && (
        <div className="clean-result-container">
          {!result.isValidCrop ? (
            <div className="clean-result-card error">
              <AlertCircle size={32} className="result-error-icon" />
              <h3 className="clean-result-title">Image Quality Check</h3>
              <p className="clean-result-text">
                {result.message || 'Image quality is too low for reliable analysis.'}
              </p>
              <p className="clean-result-subtext" style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: 600 }}>
                {result.subMessage || 'Please capture a clearer photo.'}
              </p>
              {result.guidance && (
                <p className="clean-result-guidance" style={{ fontSize: '0.80rem', color: 'var(--text-muted)', marginTop: '8px', maxWidth: '340px' }}>
                  {result.guidance}
                </p>
              )}
              <button type="button" className="clean-action-btn" onClick={handleRemoveImage} style={{ marginTop: '1.2rem' }}>
                <RotateCcw size={16} />
                <span>Try Another Image</span>
              </button>
            </div>
          ) : (
            <div className="clean-result-card">
              {/* Photo Banner */}
              {previewUrl && (
                <div className="clean-result-img-box">
                  <img src={previewUrl} alt="Analyzed Plant" className="clean-result-img" />
                </div>
              )}

              {/* Detected Condition & Confidence Header */}
              <div className="clean-result-header">
                <div className="clean-result-title-group">
                  <span className={`clean-result-status-tag ${result.badgeClass || (result.disease === 'Healthy' ? 'healthy' : 'disease')}`}>
                    {result.reliabilityLabel || (result.disease === 'Healthy' ? 'SUPPORTED / HIGH CONFIDENCE' : 'AI PREDICTION')}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                    <span style={{ fontSize: '0.70rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                      AI Prediction
                    </span>
                  </div>
                  <h3 className="clean-result-name">
                    {result.disease === 'Healthy' ? `${result.crop || 'Crop'} (Healthy)` : result.disease}
                  </h3>
                  <div className="clean-result-meta-badges">
                    <span className={`clean-confidence-pill ${result.badgeClass || 'high-confidence'}`}>
                      {result.confidence || 75}% Confidence
                    </span>
                    {result.crop && (
                      <span className="clean-crop-pill">
                        {result.crop}
                      </span>
                    )}
                  </div>
                </div>

                <button 
                  type="button"
                  className={`clean-voice-btn ${isPlayingVoice ? 'active' : ''}`}
                  onClick={handleToggleVoice}
                  aria-label={isPlayingVoice ? "Stop audio readout" : "Listen to prediction"}
                  title="Listen"
                >
                  {isPlayingVoice ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
              </div>

              {/* Prediction Uncertainty Notice if Ambiguous or Low Confidence */}
              {result.reliability === 'UNCERTAIN' && (
                <div className="clean-remedy-box uncertain">
                  <div className="detail-header-row" style={{ color: '#f97316' }}>
                    <AlertCircle size={15} />
                    <h4 className="clean-remedy-title" style={{ color: '#fdba74' }}>Prediction Uncertainty Notice</h4>
                  </div>
                  <p className="clean-remedy-text">
                    {result.uncertaintyReason || 'The AI detected visual ambiguity or moderate confidence. Please retake or upload a clearer, well-lit photo of a single leaf to confirm.'}
                  </p>
                </div>
              )}

              {/* Dataset Scope Warning if Crop is Outside Supported PlantVillage Classes */}
              {!result.isSupportedCrop && (
                <div className="clean-remedy-box scope-notice">
                  <div className="detail-header-row" style={{ color: '#eab308' }}>
                    <Info size={15} />
                    <h4 className="clean-remedy-title" style={{ color: '#fde047' }}>Dataset Scope Notice</h4>
                  </div>
                  <p className="clean-remedy-text">
                    This crop is outside the 14 trained PlantVillage crops (Apple, Blueberry, Cherry, Corn, Grape, Orange, Peach, Pepper, Potato, Raspberry, Soybean, Squash, Strawberry, Tomato). AI diagnosis cannot be certified for unverified crops.
                  </p>
                </div>
              )}

              {/* Top Prediction Candidates */}
              {Array.isArray(result.topPredictions) && result.topPredictions.length > 1 && (
                <div className="clean-remedy-box alternatives">
                  <div className="detail-header-row" style={{ color: '#c084fc' }}>
                    <Info size={15} />
                    <h4 className="clean-remedy-title" style={{ color: '#d8b4fe' }}>Top Prediction Candidates</h4>
                  </div>
                  <div className="clean-candidates-list">
                    {result.topPredictions.map((cand, idx) => (
                      <div key={idx} className="clean-candidate-row">
                        <span className="clean-candidate-title">
                          {cand.crop ? `${cand.crop} — ` : ''}{cand.disease}
                        </span>
                        <span className="clean-candidate-val">
                          {cand.confidence}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Symptoms / Disease Observations */}
              {result.symptoms && (
                <div className="clean-remedy-box symptoms">
                  <div className="detail-header-row">
                    <Info size={15} />
                    <h4 className="clean-remedy-title">Symptoms & Observations</h4>
                  </div>
                  <p className="clean-remedy-text">{result.symptoms}</p>
                </div>
              )}

              {/* Actionable Remedies */}
              {result.remedy && (
                <div className="clean-remedy-box remedy">
                  <div className="detail-header-row">
                    <ShieldCheck size={15} />
                    <h4 className="clean-remedy-title">Recommended Treatment</h4>
                  </div>
                  <p className="clean-remedy-text">{result.remedy}</p>
                </div>
              )}

              {/* Prevention & Care */}
              {result.prevention && (
                <div className="clean-remedy-box prevention">
                  <div className="detail-header-row">
                    <ShieldCheck size={15} />
                    <h4 className="clean-remedy-title">Prevention & Care</h4>
                  </div>
                  <p className="clean-remedy-text">{result.prevention}</p>
                </div>
              )}

              {/* Analyze Another Image Action */}
              <button type="button" className="clean-action-btn" onClick={handleRemoveImage}>
                <RotateCcw size={16} />
                <span>Analyze Another Image</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
