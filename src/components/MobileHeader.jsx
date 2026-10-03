import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Globe, Wifi, WifiOff, Sparkles, User } from 'lucide-react';

export default function MobileHeader({ onOpenLanguageModal }) {
  const { language, setLanguage, t } = useLanguage();
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
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
    { code: 'ta', label: 'தமிழ் (Tamil)' },
    { code: 'hi', label: 'हिंदी (Hindi)' },
    { code: 'te', label: 'తెలుగు (Telugu)' },
    { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
    { code: 'ml', label: 'മലയാളം (Malayalam)' }
  ];

  return (
    <header className="mobile-app-header">
      <div className="mobile-header-inner">
        {/* Brand */}
        <Link to="/" className="mobile-header-brand">
          <div className="mobile-logo-wrap">
            <img src="/logo.png" alt="AgroAI" />
          </div>
          <div className="mobile-brand-text">
            <span className="mobile-brand-title">AGRO AI</span>
            <span className="mobile-brand-tag">App</span>
          </div>
        </Link>

        {/* Right actions */}
        <div className="mobile-header-actions">
          {/* Online/Offline indicator */}
          <div 
            className={`network-chip ${isOnline ? 'online' : 'offline'}`}
            title={isOnline ? 'Online Engine Connected' : 'Offline Engine Active'}
          >
            {isOnline ? (
              <span className="live-dot" />
            ) : (
              <WifiOff size={13} />
            )}
            <span className="chip-text">{isOnline ? 'Live' : 'Offline'}</span>
          </div>

          {/* Language Switcher */}
          <div className="lang-dropdown-wrapper">
            <button
              className="mobile-lang-btn"
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              aria-label="Switch Language"
            >
              <Globe size={14} />
              <span>{languageLabels[language] || 'EN'}</span>
            </button>

            {langMenuOpen && (
              <>
                <div className="lang-menu-overlay" onClick={() => setLangMenuOpen(false)} />
                <div className="lang-dropdown-menu">
                  <div className="lang-dropdown-header">Select Language</div>
                  {languagesList.map((l) => (
                    <button
                      key={l.code}
                      className={`lang-option ${language === l.code ? 'active' : ''}`}
                      onClick={() => {
                        setLanguage(l.code);
                        setLangMenuOpen(false);
                      }}
                    >
                      {l.label}
                      {language === l.code && <span className="lang-check">✓</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* User Profile Avatar shortcut */}
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
