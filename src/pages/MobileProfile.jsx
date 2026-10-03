import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getHistory } from '../services/uploadService';
import { getNotifications, getDefaultNotifications } from '../services/notificationService';
import { 
  User, 
  Globe, 
  History, 
  Bell, 
  LogOut, 
  LogIn, 
  UserPlus, 
  ShieldCheck, 
  Wifi, 
  Volume2, 
  Info,
  ChevronRight,
  Sparkles,
  Leaf
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function MobileProfile() {
  const { user, userProfile, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const [historyItems, setHistoryItems] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [activeSubTab, setActiveSubTab] = useState('settings'); // 'settings', 'history', 'notifications'

  useEffect(() => {
    if (user?.id) {
      setHistoryLoading(true);
      getHistory(user.id)
        .then(data => setHistoryItems(data || []))
        .catch(() => setHistoryItems([]))
        .finally(() => setHistoryLoading(false));

      getNotifications(user.id)
        .then(data => {
          if (data && data.length > 0) setNotifications(data);
          else setNotifications(getDefaultNotifications());
        })
        .catch(() => setNotifications(getDefaultNotifications()));
    } else {
      setNotifications(getDefaultNotifications());
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (err) {
      console.error('Logout error', err);
    }
  };

  const languagesList = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
    { code: 'hi', label: 'Hindi', native: 'हिंदी' },
    { code: 'te', label: 'Telugu', native: 'తెలుగు' },
    { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
    { code: 'ml', label: 'Malayalam', native: 'മലയാളം' }
  ];

  return (
    <div className="mobile-page-content mobile-profile-screen">
      {/* 1. HEADER */}
      <div className="mobile-subpage-header">
        <h2 className="mobile-subpage-title">Farmer Profile & Settings</h2>
        <p className="mobile-subpage-desc">Manage language preferences, diagnostic history, and account</p>
      </div>

      {/* 2. PROFILE HERO CARD */}
      <div className="mobile-profile-hero-card">
        <div className="profile-hero-avatar">
          {(userProfile?.name || user?.email || 'F').charAt(0).toUpperCase()}
        </div>
        <div className="profile-hero-info">
          <h3 className="profile-hero-name">
            {userProfile?.name || 'Farmer (Demo Account)'}
          </h3>
          <p className="profile-hero-email">
            {user?.email || 'demo@agroai.app'}
          </p>
          <div className="profile-hero-tag">
            <ShieldCheck size={13} color="var(--accent-lime)" />
            <span>{user ? 'Verified Account' : 'Demo Mode Active'}</span>
          </div>
        </div>
      </div>

      {/* Sub-tab pills */}
      <div className="profile-subtab-row">
        <button
          className={`subtab-pill ${activeSubTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('settings')}
        >
          <Globe size={15} />
          <span>Preferences</span>
        </button>

        <button
          className={`subtab-pill ${activeSubTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('history')}
        >
          <History size={15} />
          <span>History ({historyItems.length})</span>
        </button>

        <button
          className={`subtab-pill ${activeSubTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('notifications')}
        >
          <Bell size={15} />
          <span>Alerts ({notifications.length})</span>
        </button>
      </div>

      {/* =========================================================
          TAB 1: SETTINGS & LANGUAGE
          ========================================================= */}
      {activeSubTab === 'settings' && (
        <div className="profile-settings-section">
          {/* Language Switcher Grid */}
          <div className="profile-settings-card">
            <div className="card-section-title-row">
              <Globe size={16} color="var(--accent-lime)" />
              <h4>Application Language</h4>
            </div>
            <p className="card-section-desc">Choose your preferred language for diagnosis and advice</p>

            <div className="language-touch-grid">
              {languagesList.map((l) => (
                <button
                  key={l.code}
                  className={`lang-touch-card ${language === l.code ? 'selected' : ''}`}
                  onClick={() => setLanguage(l.code)}
                >
                  <span className="lang-native">{l.native}</span>
                  <span className="lang-english">{l.label}</span>
                  {language === l.code && <span className="lang-active-check">✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* System Status & Capabilities */}
          <div className="profile-settings-card">
            <div className="card-section-title-row">
              <Sparkles size={16} color="var(--accent-lime)" />
              <h4>Device & Engine Status</h4>
            </div>

            <div className="settings-list-rows">
              <div className="setting-list-item">
                <div className="setting-item-left">
                  <Wifi size={16} color="var(--green-400)" />
                  <div>
                    <span className="setting-item-title">Offline Engine</span>
                    <span className="setting-item-desc">Local vision neural fallback enabled</span>
                  </div>
                </div>
                <span className="setting-badge-green">Active</span>
              </div>

              <div className="setting-list-item">
                <div className="setting-item-left">
                  <Volume2 size={16} color="var(--green-400)" />
                  <div>
                    <span className="setting-item-title">Text-to-Speech Voice</span>
                    <span className="setting-item-desc">Farming diagnosis audio readout</span>
                  </div>
                </div>
                <span className="setting-badge-green">Ready</span>
              </div>

              <div className="setting-list-item">
                <div className="setting-item-left">
                  <Info size={16} color="var(--text-muted)" />
                  <div>
                    <span className="setting-item-title">App Version</span>
                    <span className="setting-item-desc">AgroAI Mobile Application</span>
                  </div>
                </div>
                <span className="setting-badge-muted">v2.4.0</span>
              </div>
            </div>
          </div>

          {/* Account Actions (Login / Signup or Logout) */}
          <div className="profile-auth-actions-card">
            {user ? (
              <button 
                className="btn-logout-mobile"
                onClick={handleLogout}
              >
                <LogOut size={18} />
                <span>Log Out of Account</span>
              </button>
            ) : (
              <div className="guest-auth-buttons">
                <Link to="/login" className="btn-primary-mobile">
                  <LogIn size={18} />
                  <span>Log In</span>
                </Link>
                <Link to="/signup" className="btn-secondary-mobile">
                  <UserPlus size={18} />
                  <span>Create Account</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 2: DIAGNOSTIC HISTORY
          ========================================================= */}
      {activeSubTab === 'history' && (
        <div className="profile-history-section">
          {historyLoading ? (
            <div className="loading-state-box">
              <div className="radar-ping-ring" />
              <p>Loading your past crop scans...</p>
            </div>
          ) : historyItems.length === 0 ? (
            <div className="empty-market-state">
              <History size={36} color="var(--text-muted)" />
              <h4 style={{ color: '#fff', marginTop: '1rem' }}>No Diagnostic History Yet</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Your crop disease detection records and photos will be saved here automatically.
              </p>
              <button 
                className="btn-primary-mobile"
                style={{ marginTop: '1rem' }}
                onClick={() => navigate('/disease')}
              >
                Scan Your First Crop
              </button>
            </div>
          ) : (
            <div className="history-cards-list">
              {historyItems.map((item) => (
                <div 
                  key={item.id} 
                  className="mobile-history-card"
                  onClick={() => navigate('/disease')}
                >
                  <img 
                    src={item.image_url} 
                    alt="Scan" 
                    className="history-thumb-img"
                    onError={(e) => { e.target.src = '/sample_early_blight.jpg'; }}
                  />
                  <div className="history-details-col">
                    <span className="history-disease-name">
                      {item.results?.[0]?.disease || 'Plant Condition Analysis'}
                    </span>
                    <span className="history-crop-type">
                      {item.results?.[0]?.crop || 'Crops'}
                    </span>
                    <span className="history-date-time">
                      {new Date(item.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <ChevronRight size={18} color="var(--text-muted)" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================
          TAB 3: NOTIFICATIONS & ALERTS
          ========================================================= */}
      {activeSubTab === 'notifications' && (
        <div className="profile-notifications-section">
          {notifications.length === 0 ? (
            <div className="empty-market-state">
              <Bell size={36} color="var(--text-muted)" />
              <p>No new agricultural notifications.</p>
            </div>
          ) : (
            <div className="notifications-list">
              {notifications.map((notif) => (
                <div key={notif.id} className="mobile-notification-card">
                  <div className="notif-dot" />
                  <div className="notif-body">
                    <p className="notif-message">{notif.message}</p>
                    <span className="notif-time">
                      {new Date(notif.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* BOTTOM SAFE AREA */}
      <div style={{ height: 'var(--space-8)' }} />
    </div>
  );
}
