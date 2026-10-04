import React, { useState, useRef, useCallback, useEffect } from 'react';
import { processImage } from '../utils/imagePipeline';
import { Camera as CameraIcon, RotateCw, X, AlertCircle } from 'lucide-react';

export default function Camera({ onCapture, onCancel }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState('');
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (rear) or 'user' (front)
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [streamInfo, setStreamInfo] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // Check if device has multiple cameras (front & back)
  useEffect(() => {
    async function checkCameras() {
      try {
        if (navigator.mediaDevices?.enumerateDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoInputs = devices.filter(d => d.kind === 'videoinput');
          if (videoInputs.length > 1) {
            setHasMultipleCameras(true);
          }
        }
      } catch (e) {
        // Non-blocking fallback
      }
    }
    checkCameras();
  }, []);

  // Stop active stream tracks cleanly
  const stopTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {
          console.warn("Error stopping track", e);
        }
      });
      streamRef.current = null;
    }
  }, []);

  // Start Camera with Best Supported Resolution & FPS (60 - 120 FPS baseline)
  const startCamera = useCallback(async (currentFacing) => {
    setError('');
    setIsReady(false);
    stopTracks();

    // 1. Preferred constraints: 4K / High resolution + 60-120 FPS target
    const primaryConstraints = {
      audio: false,
      video: {
        facingMode: { ideal: currentFacing },
        width: { ideal: 3840, min: 1280 },
        height: { ideal: 2160, min: 720 },
        frameRate: { ideal: 60, max: 120 }
      }
    };

    // 2. High-performance fallback: Full HD 1080p + 60-120 FPS target
    const fallbackConstraints = {
      audio: false,
      video: {
        facingMode: { ideal: currentFacing },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 60, max: 120 }
      }
    };

    // 3. Basic fallback
    const basicConstraints = {
      audio: false,
      video: {
        facingMode: currentFacing
      }
    };

    let mediaStream = null;

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API is not supported in this browser. Please use 'Upload' or 'Take Photo'.");
      }

      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(primaryConstraints);
      } catch (err1) {
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
        } catch (err2) {
          mediaStream = await navigator.mediaDevices.getUserMedia(basicConstraints);
        }
      }

      streamRef.current = mediaStream;

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('muted', 'true');

        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().then(() => {
            setIsReady(true);

            // Read actual hardware stream resolution & FPS (real values, no fake metrics)
            const track = mediaStream.getVideoTracks()[0];
            if (track?.getSettings) {
              const settings = track.getSettings();
              const width = settings.width || videoRef.current.videoWidth;
              const height = settings.height || videoRef.current.videoHeight;
              const fps = settings.frameRate ? Math.round(settings.frameRate) : null;
              setStreamInfo({ width, height, fps });
            }
          }).catch(err => {
            console.error("Camera play error:", err);
            setError("Unable to start video preview");
          });
        };
      }
    } catch (err) {
      console.error("Camera access error:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError("Camera permission denied. Please allow camera access in browser settings.");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError("No camera device found on this system.");
      } else {
        setError(err.message || "Failed to access camera.");
      }
    }
  }, [stopTracks]);

  // Start on mount or facingMode change
  useEffect(() => {
    startCamera(facingMode);
    return () => {
      stopTracks();
    };
  }, [facingMode, startCamera, stopTracks]);

  // Toggle front / rear camera
  const handleToggleFacingMode = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  // High-Resolution Shutter Capture
  const handleCapture = async () => {
    if (!videoRef.current || !streamRef.current || isCapturing) return;

    try {
      setIsCapturing(true);

      // Trigger optional haptic feedback on mobile
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(30);
      }

      const track = streamRef.current.getVideoTracks()[0];
      let capturedDataUrl = null;

      // Try ImageCapture API for native sensor capture if supported
      if (window.ImageCapture && track) {
        try {
          const imageCapture = new window.ImageCapture(track);
          const blob = await imageCapture.takePhoto();
          capturedDataUrl = await processImage(blob);
        } catch (icErr) {
          console.warn("ImageCapture fallback to canvas:", icErr);
        }
      }

      // Standard Full-Resolution Canvas Capture Fallback
      if (!capturedDataUrl && videoRef.current) {
        capturedDataUrl = await processImage(videoRef.current);
      }

      stopTracks();

      if (capturedDataUrl && onCapture) {
        onCapture(capturedDataUrl);
      } else {
        throw new Error("Failed to capture image frame");
      }
    } catch (err) {
      console.error("Capture failed:", err);
      setError(err.message || "Capture failed. Please try again.");
      setIsCapturing(false);
    }
  };

  const handleCancelClick = () => {
    stopTracks();
    if (onCancel) onCancel();
  };

  return (
    <div className="live-camera-container">
      {/* Top Floating Controls */}
      <div className="camera-top-bar">
        {streamInfo && (
          <span className="camera-resolution-tag">
            {streamInfo.width >= 3840 ? '4K' : streamInfo.width >= 1920 ? '1080p' : 'HD'}
            {streamInfo.fps ? ` • ${streamInfo.fps} FPS` : ''}
          </span>
        )}

        <button
          className="camera-close-btn"
          onClick={handleCancelClick}
          aria-label="Close camera"
        >
          <X size={18} />
        </button>
      </div>

      {/* Video Viewfinder */}
      <div className="camera-viewport-box">
        <video
          ref={videoRef}
          playsInline
          autoPlay
          muted
          className={`camera-video-feed ${isReady ? 'ready' : ''}`}
        />

        {/* Viewfinder Target Reticle */}
        {isReady && !error && (
          <div className="camera-reticle-overlay">
            <div className="reticle-corner top-left" />
            <div className="reticle-corner top-right" />
            <div className="reticle-corner bottom-left" />
            <div className="reticle-corner bottom-right" />
          </div>
        )}

        {/* Loading Spinner */}
        {!isReady && !error && (
          <div className="camera-loading-overlay">
            <div className="clean-spinner" />
            <span>Connecting Camera...</span>
          </div>
        )}

        {/* Error Overlay */}
        {error && (
          <div className="camera-error-overlay">
            <AlertCircle size={28} />
            <p className="camera-error-text">{error}</p>
            <button className="camera-retry-btn" onClick={() => startCamera(facingMode)}>
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Bottom Shutter Controls */}
      {isReady && !error && (
        <div className="camera-bottom-controls">
          {/* Flip / Switch Camera Button */}
          {hasMultipleCameras ? (
            <button
              className="camera-flip-btn"
              onClick={handleToggleFacingMode}
              aria-label="Switch Camera"
              title="Switch Camera"
            >
              <RotateCw size={20} />
            </button>
          ) : (
            <div style={{ width: 44 }} />
          )}

          {/* Primary Shutter Button */}
          <button
            className="camera-shutter-btn"
            onClick={handleCapture}
            disabled={isCapturing}
            aria-label="Capture Photo"
          >
            <div className="shutter-inner-ring" />
          </button>

          {/* Spacer for symmetrical layout */}
          <div style={{ width: 44 }} />
        </div>
      )}
    </div>
  );
}
