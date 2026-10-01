import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Sparkles, Menu, X, ChevronDown, LogOut, LayoutDashboard, Leaf } from 'lucide-react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const { user, userProfile, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setProfileMenuOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const handleNavClick = (hash) => {
    setMenuOpen(false);
    if (location.pathname === '/') {
      const element = document.getElementById(hash);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate(`/#${hash}`);
    }
  };

  const isHomeActive = location.pathname === '/' && !location.hash;
  const isAboutActive = location.pathname === '/about';

  return (
    <>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="navbar-inner">
          {/* Logo & Brand */}
          <Link to="/" className="navbar-brand">
            <img src="/logo.png" alt="AgroAI Logo" />
            <div className="navbar-brand-name">
              <span>AgroAI</span>
              <span className="navbar-brand-badge">AI</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
            <Link 
              to="/" 
              className={`navbar-link ${isHomeActive ? 'active' : ''}`}
              onClick={() => { setMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            >
              {t('nav_home')}
            </Link>

            <button 
              className="navbar-link"
              onClick={() => handleNavClick('diagnosis')}
              style={{ textAlign: 'left', cursor: 'pointer' }}
            >
              {t('nav_detection')}
            </button>

            <button 
              className="navbar-link"
              onClick={() => handleNavClick('market')}
              style={{ textAlign: 'left', cursor: 'pointer' }}
            >
              {t('nav_market')}
            </button>

            <button 
              className="navbar-link"
              onClick={() => handleNavClick('environment')}
              style={{ textAlign: 'left', cursor: 'pointer' }}
            >
              {t('nav_environment')}
            </button>

            <Link 
              to="/about" 
              className={`navbar-link ${isAboutActive ? 'active' : ''}`}
            >
              {t('nav_about')}
            </Link>

            {user && (
              <Link 
                to="/dashboard" 
                className={`navbar-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
              >
                {t('nav_dashboard')}
              </Link>
            )}

            {/* Mobile-Only Actions */}
            <div className="mobile-auth-section" style={{ display: 'none' }}>
              <div style={{ margin: '1rem 0 0.5rem' }}>
                <button
                  onClick={() => { setMenuOpen(false); handleNavClick('diagnosis'); }}
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <Sparkles size={16} />
                  {t('nav_analyze_btn')}
                </button>
              </div>

              {!user ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <Link 
                    to="/login" 
                    className="btn btn-secondary" 
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    {t('nav_login')}
                  </Link>
                  <Link 
                    to="/signup" 
                    className="btn btn-outline" 
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    {t('nav_signup')}
                  </Link>
                </div>
              ) : (
                <button 
                  onClick={handleSignOut} 
                  className="btn btn-outline" 
                  style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', color: 'var(--red-400)' }}
                >
                  <LogOut size={16} />
                  {t('nav_logout')}
                </button>
              )}
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="navbar-actions">
            {/* Language Selector */}
            <div className="lang-select-wrapper">
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                aria-label="Select Language"
              >
                <option value="en">English</option>
                <option value="ta">தமிழ்</option>
                <option value="hi">हिंदी</option>
                <option value="te">తెలుగు</option>
                <option value="kn">ಕನ್ನಡ</option>
                <option value="ml">മലയാളം</option>
              </select>
            </div>

            {/* Primary Action CTA */}
            <button 
              className="btn btn-primary btn-sm desktop-only-flex"
              onClick={() => handleNavClick('diagnosis')}
              style={{ fontWeight: 700 }}
            >
              <Sparkles size={15} />
              <span>{t('nav_analyze_btn')}</span>
            </button>

            {/* Desktop Auth Controls */}
            {!user ? (
              <Link to="/login" className="btn btn-secondary btn-sm desktop-only-flex">
                {t('nav_login')}
              </Link>
            ) : (
              <div style={{ position: 'relative' }} className="desktop-only-flex">
                <button 
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'rgba(14, 36, 26, 0.7)',
                    border: '1px solid var(--agri-border)',
                    borderRadius: 'var(--radius-full)',
                    padding: '3px 10px 3px 3px',
                    color: '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent-lime)'}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--agri-border)'}
                >
                  <img 
                    src={userProfile?.photoURL || `https://ui-avatars.com/api/?name=${userProfile?.name || 'User'}&background=16a34a&color=fff`} 
                    alt="Profile" 
                    style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    {userProfile?.name?.split(' ')[0] || 'Account'}
                  </span>
                  <ChevronDown size={14} color="var(--accent-lime)" />
                </button>
                
                {profileMenuOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '120%',
                    right: 0,
                    background: 'var(--agri-charcoal)',
                    border: '1px solid var(--agri-border-hover)',
                    borderRadius: 'var(--radius-lg)',
                    minWidth: '200px',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
                    overflow: 'hidden',
                    zIndex: 100
                  }}>
                    <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--agri-border)', background: 'rgba(0,0,0,0.2)' }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}>{userProfile?.name || 'User'}</p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.email || ''}</p>
                    </div>
                    <div style={{ padding: '0.4rem' }}>
                      <Link 
                        to="/dashboard" 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px', 
                          padding: '0.6rem 0.8rem', 
                          color: '#ffffff', 
                          borderRadius: 'var(--radius-md)', 
                          fontSize: '0.85rem' 
                        }} 
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        <LayoutDashboard size={15} color="var(--accent-lime)" />
                        <span>{t('nav_dashboard')}</span>
                      </Link>
                      <button 
                        onClick={() => { setProfileMenuOpen(false); handleSignOut(); }}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px', 
                          width: '100%', 
                          textAlign: 'left', 
                          padding: '0.6rem 0.8rem', 
                          color: 'var(--red-400)', 
                          borderRadius: 'var(--radius-md)', 
                          fontSize: '0.85rem' 
                        }}
                      >
                        <LogOut size={15} />
                        <span>{t('nav_logout')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button 
              className={`hamburger ${menuOpen ? 'open' : ''}`}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle navigation menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </nav>

      {/* Backdrop for mobile drawer */}
      {menuOpen && <div className="mobile-overlay" onClick={() => setMenuOpen(false)} />}

      <style>{`
        .desktop-only-flex {
          display: inline-flex !important;
        }
        @media (max-width: 900px) {
          .desktop-only-flex {
            display: none !important;
          }
          .mobile-auth-section {
            display: block !important;
          }
        }
      `}</style>
    </>
  );
}
