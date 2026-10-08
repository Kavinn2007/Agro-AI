import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Globe } from 'lucide-react';

const LANGUAGE_LABELS = {
  en: 'EN',
  ta: 'தமிழ்',
  hi: 'हिंदी',
  te: 'తెలుగు',
  kn: 'ಕನ್ನಡ',
  ml: 'മലയാളം'
};

const LANGUAGES_LIST = [
  { code: 'en', label: 'English' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'മലയാളം' }
];

export default function MobileHeader() {
  const { language, setLanguage } = useLanguage();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <header className="mobile-app-header">
      <div className="mobile-header-inner">
        {/* Brand */}
        <Link to="/" className="mobile-header-brand" aria-label="AgroAI Home">
          <div className="mobile-logo-wrap">
            <img src="/logo.png" alt="AgroAI Logo" width="28" height="28" loading="eager" />
          </div>
          <span className="mobile-brand-title">AGRO AI</span>
        </Link>


        {/* Header Actions */}
        <div className="mobile-header-actions">
          {/* Subtle Online/Offline indicator */}
          <span 
            className={`connection-dot ${isOnline ? 'online' : 'offline'}`}
            title={isOnline ? 'Online' : 'Offline'}
            aria-label={isOnline ? 'Online' : 'Offline'}
          />

          {/* Language Switcher */}
          <div className="lang-dropdown-wrapper">
            <button
              className="mobile-lang-btn"
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              aria-label="Switch Language"
              aria-expanded={langMenuOpen}
            >
              <Globe size={14} />
              <span>{LANGUAGE_LABELS[language] || 'EN'}</span>
            </button>

            {langMenuOpen && (
              <>
                <div 
                  className="lang-menu-overlay" 
                  onClick={() => setLangMenuOpen(false)} 
                  aria-hidden="true" 
                />
                <div className="lang-dropdown-menu" role="menu">
                  {LANGUAGES_LIST.map((l) => (
                    <button
                      key={l.code}
                      role="menuitem"
                      className={`lang-option ${language === l.code ? 'active' : ''}`}
                      onClick={() => {
                        setLanguage(l.code);
                        setLangMenuOpen(false);
                      }}
                    >
                      <span>{l.label}</span>
                      {language === l.code && <span className="lang-check">✓</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
