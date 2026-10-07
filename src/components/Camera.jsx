import React, { useState, useRef, useCallback, useEffect } from 'react';
import { processImage } from '../utils/imagePipeline';
import { RotateCw, X, AlertCircle } from 'lucide-react';

export default function Camera({ onCapture, onCancel }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState('');
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (rear) or 'user' (front)
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
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

  // Stop active stream tracks cleanly and release hardware camera
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
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Start Camera with Highest Practical Supported Resolution
  const startCamera = useCallback(async (currentFacing) => {
    setError('');
    setIsReady(false);
    stopTracks();

    // 1. Practical high resolution target (up to 4K / 1080p without restrictive min bounds)
    const primaryConstraints = {
      audio: false,
      video: {
        facingMode: { ideal: currentFacing },
        width: { ideal: 1920, max: 3840 },
        height: { ideal: 1080, max: 2160 },
      }
    };

    // 2. High-performance fallback: 720p HD
    const fallbackConstraints = {
      audio: false,
      video: {
        facingMode: { ideal: currentFacing },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    };

    // 3. Basic device fallback
    const basicConstraints = {
      audio: false,
      video: {
        facingMode: currentFacing
      }
    };

    let mediaStream = null;

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API is not supported in this browser. Please use 'Upload Photo' or 'Take Photo'.");
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
        videoRef.current.setAttribute('webkit-playsinline', 'true');
        videoRef.current.setAttribute('muted', 'true');

        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().then(() => {
            setIsReady(true);
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

      // Trigger optional haptic feedback on mobile devices
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate(30);
        } catch (_) {}
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
        <span className="camera-live-label">LIVE CAMERA</span>

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
          className={`camera-video-feed ${isReady ? 'ready' : ''} ${facingMode === 'user' ? 'mirrored' : ''}`}
        />

        {/* Viewfinder Target Reticle */}
        {isReady && !error && (
          <div className="camera-reticle-overlay" aria-hidden="true">
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
