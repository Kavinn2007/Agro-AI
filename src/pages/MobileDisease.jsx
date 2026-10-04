import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { analyzeImage } from '../services/aiService';
import { saveUploadRecord, saveResult } from '../services/uploadService';
import { processImage } from '../utils/imagePipeline';
import Camera from '../components/Camera';
import { 
  UploadCloud, 
  Video, 
  Camera as CameraIcon, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  AlertCircle,
  ShieldCheck,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MobileDisease() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { language } = useLanguage();

  const fileInputRef = useRef(null);
  const takePhotoInputRef = useRef(null);

  // View state: 'select' (3 options), 'live-camera' (WebRTC), 'preview' (Image selected), 'result' (Analysis done)
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

  // Cleanup speech synthesis if active on unmount
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

  // RETAKE / REMOVE / RESET
  const handleReset = () => {
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

  // 4. DISEASE ANALYSIS (EXISTING AI / BACKEND MODEL)
  const handleAnalyze = async () => {
    if (!previewUrl) return;

    setAnalyzing(true);
    setErrorMsg('');
    setResult(null);

    try {
      // Input validation using existing local validator
      const { validateInput } = await import('../services/localAnalysis');
      const validationStatus = await validateInput(previewUrl, 'plant');

      if (!validationStatus.isValidCrop) {
        setResult(validationStatus);
        setCurrentView('result');
        setAnalyzing(false);
        return;
      }

      // Execute AI inference via existing service
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

  // VOICE READOUT
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
      textToRead = `${result.crop || 'Plant'} is healthy. No critical diseases detected.`;
    } else {
      textToRead = `Detected: ${result.crop || 'Crop'} with ${result.disease}. Remedy: ${result.remedy || result.prevention || 'Consult agricultural specialist.'}`;
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
          STAGE 1: THREE CLEAR INPUT OPTIONS (SELECT VIEW)
          ==================================================== */}
      {currentView === 'select' && (
        <div className="disease-input-options-container">
          {/* Option 1: UPLOAD PHOTO */}
          <motion.div
            className="disease-input-card"
            whileTap={{ scale: 0.98 }}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="disease-input-icon-wrap upload">
              <UploadCloud size={24} />
            </div>
            <div className="disease-input-card-info">
              <span className="disease-input-card-title">Upload Photo</span>
              <span className="disease-input-card-desc">Choose from device gallery (JPG, PNG, WebP)</span>
            </div>
          </motion.div>

          {/* Option 2: LIVE CAMERA */}
          <motion.div
            className="disease-input-card"
            whileTap={{ scale: 0.98 }}
            onClick={() => setCurrentView('live-camera')}
          >
            <div className="disease-input-icon-wrap live">
              <Video size={24} />
            </div>
            <div className="disease-input-card-info">
              <span className="disease-input-card-title">Live Camera</span>
              <span className="disease-input-card-desc">Real-time viewfinder with camera controls</span>
            </div>
          </motion.div>

          {/* Option 3: TAKE PHOTO */}
          <motion.div
            className="disease-input-card"
            whileTap={{ scale: 0.98 }}
            onClick={() => takePhotoInputRef.current?.click()}
          >
            <div className="disease-input-icon-wrap photo">
              <CameraIcon size={24} />
            </div>
            <div className="disease-input-card-info">
              <span className="disease-input-card-title">Take Photo</span>
              <span className="disease-input-card-desc">Quick capture using device camera</span>
            </div>
          </motion.div>

          {errorMsg && (
            <div className="clean-error-alert">
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
          STAGE 3: IMAGE PREVIEW & ANALYZE ACTION
          ==================================================== */}
      {currentView === 'preview' && previewUrl && (
        <div className="clean-preview-wrapper">
          <div className="clean-preview-box">
            <img 
              src={previewUrl} 
              alt="Crop Leaf Preview" 
              className="clean-preview-img" 
            />
            <button 
              className="clean-retake-btn" 
              onClick={handleReset}
              disabled={analyzing}
            >
              <RotateCcw size={15} />
              <span>Retake</span>
            </button>
          </div>

          {analyzing ? (
            <div className="clean-loading-box">
              <div className="clean-spinner" />
              <span className="clean-loading-text">Analyzing Crop Health...</span>
            </div>
          ) : (
            <button className="clean-analyze-btn" onClick={handleAnalyze}>
              Analyze
            </button>
          )}

          {errorMsg && (
            <div className="clean-error-alert">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      )}

      {/* ====================================================
          STAGE 4: AI RESULT SCREEN
          ==================================================== */}
      {currentView === 'result' && result && (
        <div className="clean-result-container">
          {!result.isValidCrop ? (
            <div className="clean-result-card error">
              <AlertCircle size={32} className="result-error-icon" />
              <h3 className="clean-result-title">No Crop Recognized</h3>
              <p className="clean-result-text">
                {result.message || 'Please provide a clear crop leaf photo.'}
              </p>
              <button className="clean-action-btn" onClick={handleReset}>
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

              {/* Diagnosis Header */}
              <div className="clean-result-header">
                <div>
                  <h3 className="clean-result-name">
                    {result.disease === 'Healthy' ? 'Healthy Crop' : result.disease}
                  </h3>
                  <span className="clean-result-confidence">
                    {result.crop && `${result.crop} • `}{result.confidence || 95}% Confidence
                  </span>
                </div>

                <button 
                  className={`clean-voice-btn ${isPlayingVoice ? 'active' : ''}`}
                  onClick={handleToggleVoice}
                  aria-label="Listen"
                  title="Listen"
                >
                  {isPlayingVoice ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
              </div>

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
              <button className="clean-action-btn" onClick={handleReset}>
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
