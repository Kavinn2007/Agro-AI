import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SplashScreen({ onComplete }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Keep splash short and professional (~1.7s total)
    const timer = setTimeout(() => {
      setVisible(false);
    }, 1600);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {visible && (
        <motion.div
          className="agro-splash-screen"
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
            transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] }
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100vw',
            height: '100vh',
            height: '100dvh',
            background: 'radial-gradient(ellipse 90% 70% at 50% 42%, #16a34a 0%, #0e5b2e 28%, #063d1e 60%, #032110 88%, #02140a 100%)',
            overflow: 'hidden',
            touchAction: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
        >
          {/* Subtle Ambient Depth Rings (Light & Dark Green only) */}
          <div
            style={{
              position: 'absolute',
              width: 'min(90vw, 420px)',
              height: 'min(90vw, 420px)',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(74, 222, 128, 0.18) 0%, rgba(22, 163, 74, 0.08) 45%, transparent 70%)',
              pointerEvents: 'none',
              filter: 'blur(30px)',
            }}
          />

          {/* Centered AGRO AI Wordmark */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 8 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              transition: { 
                duration: 0.65, 
                ease: [0.16, 1, 0.3, 1] 
              } 
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2,
            }}
          >
            <h1
              style={{
                margin: 0,
                padding: 0,
                color: '#ffffff',
                fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                fontSize: 'clamp(2.4rem, 8vw, 3.8rem)',
                fontWeight: 800,
                letterSpacing: '0.18em',
                lineHeight: 1,
                textAlign: 'center',
                textTransform: 'uppercase',
                textShadow: '0 2px 24px rgba(74, 222, 128, 0.35)',
              }}
            >
              AGRO AI
            </h1>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
