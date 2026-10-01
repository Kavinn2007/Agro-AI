import React, { useState, useRef, useCallback, useEffect } from 'react';

const Camera = ({ onCapture, onCancel, isLive = false, onFrame }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(true);

  const startCamera = async () => {
    setError('');
    setIsReady(false);
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('muted', 'true');
        
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().then(() => {
            setIsReady(true);
          }).catch(err => {
            console.error('Play error:', err);
            setError('Could not autoplay video.');
          });
        };
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Camera permission denied or camera not found.');
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line
  }, []);

  const handleCancel = () => {
    stopCamera();
    if (onCancel) onCancel();
  };

  const captureFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas) return null;
    if (video.readyState !== 4) return null;
    if (video.videoWidth === 0 || video.videoHeight === 0) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Image validation (Prevent black frame)
    const frameData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let isBlack = true;
    for (let i = 0; i < frameData.length; i += 40) {
      if (frameData[i] > 10 || frameData[i+1] > 10 || frameData[i+2] > 10) {
        isBlack = false;
        break;
      }
    }

    if (isBlack) {
      return null;
    }

    return canvas.toDataURL("image/jpeg");
  };

  useEffect(() => {
    let intervalId;
    
    if (isLive && isReady && isScanning) {
      intervalId = setInterval(() => {
        const image = captureFrame();
        if (!image) {
          console.warn("Camera not ready or frame invalid");
          return;
        }
        if (onFrame) {
          onFrame(image);
        }
      }, 2000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isLive, isReady, isScanning, onFrame]);

  const handleCaptureClick = () => {
    const image = captureFrame();
    if (!image) {
      setError('Camera not ready or invalid image captured.');
      return;
    }
    stopCamera();
    if (onCapture) onCapture(image);
  };

  return (
    <div className="camera-container" style={{ position: 'relative', width: '100%', maxWidth: '600px', margin: '0 auto', overflow: 'hidden', borderRadius: '12px', background: '#000' }}>
      {error ? (
        <div style={{ padding: '20px', color: '#ff4444', textAlign: 'center' }}>
          <h3>⚠️ {error}</h3>
          <button className="btn btn-secondary" onClick={handleCancel}>Go Back</button>
        </div>
      ) : (
        <>
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            style={{ width: '100%', display: 'block', minHeight: '300px', backgroundColor: '#000' }}
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {!isReady && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <p>Initializing Camera...</p>
            </div>
          )}

          {isReady && (
            <div style={{ position: 'absolute', bottom: '20px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '20px' }}>
              <button onClick={handleCancel} className="btn btn-secondary" style={{ padding: '10px 20px', borderRadius: '8px' }}>
                Cancel
              </button>

              {isLive ? (
                <button 
                  onClick={() => setIsScanning(!isScanning)}
                  style={{ 
                    padding: '10px 20px', 
                    borderRadius: '8px', 
                    background: isScanning ? '#ef4444' : '#10b981', 
                    color: '#fff', 
                    border: 'none', 
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  {isScanning ? 'Stop Live' : 'Start Live'}
                </button>
              ) : (
                <button 
                  onClick={handleCaptureClick}
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: '#10b981',
                    border: '4px solid #fff',
                    cursor: 'pointer'
                  }}
                />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Camera;
