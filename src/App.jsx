import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import SplashScreen from './components/SplashScreen';
import MobileAppLayout from './components/MobileAppLayout';

// Mobile Screens
import MobileHome from './pages/MobileHome';
import MobileDisease from './pages/MobileDisease';
import MobileMarket from './pages/MobileMarket';
import MobileEnvironment from './pages/MobileEnvironment';
import MobileProfile from './pages/MobileProfile';

// Existing Pages preserved
import Login from './pages/Login';
import Signup from './pages/Signup';
import About from './pages/About';
import Features from './pages/Features';
import HowItWorks from './pages/HowItWorks';
import Contact from './pages/Contact';

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
              {/* Core Mobile Application Navigation */}
              <Route path="/" element={<MobileHome />} />
              <Route path="/disease" element={<MobileDisease />} />
              <Route path="/market" element={<MobileMarket />} />
              <Route path="/environment" element={<MobileEnvironment />} />
              <Route path="/profile" element={<MobileProfile />} />

              {/* Backward-compatible dashboard route */}
              <Route path="/dashboard" element={<MobileDisease />} />

              {/* Preserved Auth & Info Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/about" element={<About />} />
              <Route path="/features" element={<Features />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/contact" element={<Contact />} />

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </MobileAppLayout>
        </LanguageProvider>
      </AuthProvider>
    </Router>
  );
}
