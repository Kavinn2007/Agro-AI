import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  LogOut, 
  LogIn, 
  UserPlus 
} from 'lucide-react';

export default function MobileProfile() {
  const { user, userProfile, signOut } = useAuth();
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();

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
      <h2 className="mobile-screen-title">Profile</h2>

      {/* User Card */}
      <div className="clean-profile-card">
        <div className="clean-avatar-circle">
          {(userProfile?.name || user?.email || 'F').charAt(0).toUpperCase()}
        </div>
        <div className="clean-profile-details">
          <span className="clean-profile-name">
            {userProfile?.name || (user ? 'Farmer' : 'Guest Farmer')}
          </span>
          <span className="clean-profile-sub">
            {user?.email || 'Offline mode'}
          </span>
        </div>
      </div>

      {/* Language Selector */}
      <div className="clean-section-card">
        <h3 className="clean-card-heading">Language</h3>
        <div className="clean-lang-grid">
          {languagesList.map((l) => (
            <button
              key={l.code}
              className={`clean-lang-chip ${language === l.code ? 'active' : ''}`}
              onClick={() => setLanguage(l.code)}
            >
              <span>{l.native}</span>
              {language === l.code && <span className="lang-check">✓</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Account Actions */}
      <div className="clean-section-card">
        {user ? (
          <button className="clean-logout-btn" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Log Out</span>
          </button>
        ) : (
          <div className="clean-auth-row">
            <Link to="/login" className="clean-auth-btn primary">
              <LogIn size={16} />
              <span>Log In</span>
            </Link>
            <Link to="/signup" className="clean-auth-btn secondary">
              <UserPlus size={16} />
              <span>Sign Up</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
