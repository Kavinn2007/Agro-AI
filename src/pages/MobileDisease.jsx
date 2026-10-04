import React, { useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { analyzeImage } from '../services/aiService';
import { saveUploadRecord, saveResult } from '../services/uploadService';
import { processImage } from '../utils/imagePipeline';
import Camera from '../components/Camera';
import { 
  Camera as CameraIcon, 
  UploadCloud, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  AlertCircle 
} from 'lucide-react';

export default function MobileDisease() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { language } = useLanguage();
  const fileInputRef = useRef(null);

  // Input Mode: 'upload' or 'camera'
  const [inputMode, setInputMode] = useState(
    searchParams.get('mode') === 'camera' ? 'camera' : 'upload'
  );

  // States
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);

  // File Picker
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setErrorMsg('');
      const dataUrl = await processImage(file);
      setPreviewUrl(dataUrl);
      setResult(null);
    } catch (err) {
      setErrorMsg(err.message || 'Could not process image');
    }
  };

  // Camera Capture
  const handleCameraCapture = (imageDataUrl) => {
    setPreviewUrl(imageDataUrl);
    setResult(null);
    setErrorMsg('');
    setInputMode('upload');
  };

  // Reset
  const handleReset = () => {
    setPreviewUrl(null);
    setResult(null);
    setErrorMsg('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingVoice(false);
  };

  // Analyze
  const handleAnalyze = async () => {
    if (!previewUrl) return;

    setAnalyzing(true);
    setErrorMsg('');
    setResult(null);

    try {
      const { validateInput } = await import('../services/localAnalysis');
      const validationStatus = await validateInput(previewUrl, 'plant');

      if (!validationStatus.isValidCrop) {
        setResult(validationStatus);
        setAnalyzing(false);
        return;
      }

      const aiResult = await analyzeImage(previewUrl, language, 'plant');

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
    }
  };

  // Voice Readout
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

      {/* STAGE 1: CHOOSE / CAPTURE IMAGE */}
      {!result && !analyzing && (
        <>
          {/* Input Method Switcher */}
          {!previewUrl && (
            <div className="input-method-row">
              <button
                className={`input-tab-btn ${inputMode === 'upload' ? 'active' : ''}`}
                onClick={() => setInputMode('upload')}
              >
                <UploadCloud size={18} />
                <span>Upload</span>
              </button>
              <button
                className={`input-tab-btn ${inputMode === 'camera' ? 'active' : ''}`}
                onClick={() => setInputMode('camera')}
              >
                <CameraIcon size={18} />
                <span>Camera</span>
              </button>
            </div>
          )}

          {/* Camera View */}
          {inputMode === 'camera' && !previewUrl && (
            <div className="camera-view-wrapper">
              <Camera 
                onCapture={handleCameraCapture}
                onCancel={() => setInputMode('upload')}
              />
            </div>
          )}

          {/* Upload Dropzone */}
          {inputMode === 'upload' && !previewUrl && (
            <div 
              className="clean-upload-card"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <div className="clean-upload-icon">
                <UploadCloud size={32} />
              </div>
              <span className="clean-upload-text">Select Image</span>
            </div>
          )}

          {/* Preview & Analyze Button */}
          {previewUrl && (
            <div className="clean-preview-wrapper">
              <div className="clean-preview-box">
                <img src={previewUrl} alt="Crop Leaf" className="clean-preview-img" />
                <button className="clean-retake-btn" onClick={handleReset}>
                  <RotateCcw size={16} />
                  <span>Change</span>
                </button>
              </div>

              <button className="clean-analyze-btn" onClick={handleAnalyze}>
                Analyze
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="clean-error-alert">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}
        </>
      )}

      {/* STAGE 2: ANALYZING STATE */}
      {analyzing && (
        <div className="clean-loading-box">
          <div className="clean-spinner" />
          <span className="clean-loading-text">Analyzing</span>
        </div>
      )}

      {/* STAGE 3: RESULT */}
      {result && !analyzing && (
        <div className="clean-result-container">
          {!result.isValidCrop ? (
            <div className="clean-result-card error">
              <h3 className="clean-result-title">No Crop Recognized</h3>
              <p className="clean-result-text">
                {result.message || 'Please upload a clear leaf image.'}
              </p>
              <button className="clean-action-btn" onClick={handleReset}>
                <RotateCcw size={16} />
                <span>Try Another</span>
              </button>
            </div>
          ) : (
            <div className="clean-result-card">
              {previewUrl && (
                <div className="clean-result-img-box">
                  <img src={previewUrl} alt="Crop" className="clean-result-img" />
                </div>
              )}

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
                >
                  {isPlayingVoice ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
              </div>

              {result.remedy && (
                <div className="clean-remedy-box">
                  <h4 className="clean-remedy-title">Remedy</h4>
                  <p className="clean-remedy-text">{result.remedy}</p>
                </div>
              )}

              {result.prevention && !result.remedy && (
                <div className="clean-remedy-box">
                  <h4 className="clean-remedy-title">Care</h4>
                  <p className="clean-remedy-text">{result.prevention}</p>
                </div>
              )}

              <button className="clean-action-btn" onClick={handleReset}>
                <RotateCcw size={16} />
                <span>Analyze Another</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
