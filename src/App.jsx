import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import SplashScreen from './components/SplashScreen';
import MobileAppLayout from './components/MobileAppLayout';

// Core Application Screens
import MobileHome from './pages/MobileHome';
import MobileDisease from './pages/MobileDisease';
import MobileMarket from './pages/MobileMarket';
import MobileEnvironment from './pages/MobileEnvironment';

const TAB_INDEX = {
  '/': 0,
  '/disease': 1,
  '/dashboard': 1,
  '/market': 2,
  '/environment': 3,
};

function AppRoutes() {
  const location = useLocation();
  const prevTabRef = React.useRef(null);
  const currentTab = TAB_INDEX[location.pathname] ?? 0;

  let transitionClass = 'slide-fade';
  if (prevTabRef.current === null) {
    transitionClass = 'slide-initial';
  } else if (currentTab > prevTabRef.current) {
    transitionClass = 'slide-forward';
  } else if (currentTab < prevTabRef.current) {
    transitionClass = 'slide-backward';
  }

  React.useEffect(() => {
    prevTabRef.current = currentTab;
  }, [currentTab]);

  return (
    <div key={location.pathname} className={`route-page-container ${transitionClass}`}>
      <Routes location={location}>
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
    </div>
  );
}

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
            <AppRoutes />
          </MobileAppLayout>
        </LanguageProvider>
      </AuthProvider>
    </Router>
  );
}

