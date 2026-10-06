import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import SplashScreen from './components/SplashScreen';
import MobileAppLayout from './components/MobileAppLayout';

// Core Application Screens
import MobileHome from './pages/MobileHome';
import MobileDisease from './pages/MobileDisease';
import MobileMarket from './pages/MobileMarket';
import MobileEnvironment from './pages/MobileEnvironment';

export default function App() {
  const [splashFinished, setSplashFinished] = useState(false);

  return (
    <Router>
      <AuthProvider>
        <LanguageProvider>
          {/* Fullscreen AGRO AI Splash Screen on Launch */}
          {!splashFinished && (
            <SplashScreen onComplete={() => setSplashFinished(true)} />
          )}

          {/* Master Mobile Application Experience */}
          <MobileAppLayout>
            <Routes>
              {/* Primary 4 Destinations */}
              <Route path="/" element={<MobileHome />} />
              <Route path="/disease" element={<MobileDisease />} />
              <Route path="/market" element={<MobileMarket />} />
              <Route path="/environment" element={<MobileEnvironment />} />

              {/* Backward-compatible dashboard route */}
              <Route path="/dashboard" element={<Navigate to="/disease" replace />} />

              {/* Catch-all redirect to Home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </MobileAppLayout>
        </LanguageProvider>
      </AuthProvider>
    </Router>
  );
}
