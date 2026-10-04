import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Globe, User } from 'lucide-react';

export default function MobileHeader() {
  const { language, setLanguage } = useLanguage();
  const { user, userProfile } = useAuth();
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

  const languageLabels = {
    en: 'EN',
    ta: 'தமிழ்',
    hi: 'हिंदी',
    te: 'తెలుగు',
    kn: 'ಕನ್ನಡ',
    ml: 'മലയാളം'
  };

  const languagesList = [
    { code: 'en', label: 'English' },
    { code: 'ta', label: 'தமிழ்' },
    { code: 'hi', label: 'हिंदी' },
    { code: 'te', label: 'తెలుగు' },
    { code: 'kn', label: 'ಕನ್ನಡ' },
    { code: 'ml', label: 'മലയാളം' }
  ];

  return (
    <header className="mobile-app-header">
      <div className="mobile-header-inner">
        {/* Brand */}
        <Link to="/" className="mobile-header-brand">
          <div className="mobile-logo-wrap">
            <img src="/logo.png" alt="AgroAI" />
          </div>
          <span className="mobile-brand-title">AGRO AI</span>
        </Link>

        {/* Header Actions */}
        <div className="mobile-header-actions">
          {/* Subtle Online/Offline dot */}
          <span 
            className={`connection-dot ${isOnline ? 'online' : 'offline'}`}
            title={isOnline ? 'Online' : 'Offline'}
          />

          {/* Language Switcher */}
          <div className="lang-dropdown-wrapper">
            <button
              className="mobile-lang-btn"
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              aria-label="Language"
            >
              <Globe size={14} />
              <span>{languageLabels[language] || 'EN'}</span>
            </button>

            {langMenuOpen && (
              <>
                <div className="lang-menu-overlay" onClick={() => setLangMenuOpen(false)} />
                <div className="lang-dropdown-menu">
                  {languagesList.map((l) => (
                    <button
                      key={l.code}
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

          {/* User Profile Shortcut */}
          <Link to="/profile" className="mobile-profile-avatar" aria-label="Profile">
            <div className="avatar-circle">
              {(userProfile?.name || user?.email || 'F').charAt(0).toUpperCase()}
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
