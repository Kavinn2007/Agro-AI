import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SplashScreen({ onComplete }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Keep splash short and fast (850ms)
    const timer = setTimeout(() => {
      setVisible(false);
    }, 850);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {visible && (
        <motion.div
          className="agro-splash-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
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
            background: 'linear-gradient(145deg, #22c55e 0%, #15803d 30%, #0d4a25 65%, #052413 100%)',
            overflow: 'hidden',
            touchAction: 'none',
            userSelect: 'none',
          }}
        >
          <motion.h1
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.04 }}
            transition={{
              duration: 0.3,
              ease: [0.16, 1, 0.3, 1],
            }}
            style={{
              margin: 0,
              padding: 0,
              color: '#ffffff',
              fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              fontSize: 'clamp(2.4rem, 8vw, 3.4rem)',
              fontWeight: 800,
              letterSpacing: '0.16em',
              lineHeight: 1,
              textAlign: 'center',
              textTransform: 'uppercase',
              willChange: 'transform, opacity',
            }}
          >
            AGRO AI
          </motion.h1>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

