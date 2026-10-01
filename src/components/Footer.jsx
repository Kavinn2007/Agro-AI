import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Leaf, ShieldCheck, Heart } from 'lucide-react';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand Column */}
          <div className="footer-brand">
            <Link to="/" className="navbar-brand" style={{ marginBottom: '0.75rem' }}>
              <img src="/logo.png" alt="AgroAI" style={{ height: 36, width: 36, borderRadius: 'var(--radius-md)' }} />
              <div className="navbar-brand-name">
                <span>AgroAI</span>
                <span className="navbar-brand-badge">AI</span>
              </div>
            </Link>
            <p>
              AI-powered agricultural assistant delivering instant crop disease detection, localized treatments, and market intelligence for farmers.
            </p>
          </div>

          {/* Navigation Links */}
          <div>
            <h4 className="footer-title">{t('footer_nav')}</h4>
            <div className="footer-links">
              <Link to="/">{t('nav_home')}</Link>
              <Link to="/about">{t('nav_about')}</Link>
              <Link to="/features">{t('nav_features')}</Link>
              <Link to="/how-it-works">{t('nav_how')}</Link>
              <Link to="/contact">{t('nav_contact')}</Link>
            </div>
          </div>

          {/* Resources */}
          <div>
            <h4 className="footer-title">{t('footer_resources')}</h4>
            <div className="footer-links">
              <Link to="/#diagnosis">Disease Diagnosis</Link>
              <Link to="/#market">Market Prices</Link>
              <Link to="/#environment">Seasonal Advice</Link>
              <Link to="/dashboard">{t('nav_dashboard')}</Link>
            </div>
          </div>

          {/* Legal / Trust */}
          <div>
            <h4 className="footer-title">{t('footer_legal')}</h4>
            <div className="footer-links">
              <a href="#privacy">{t('footer_privacy')}</a>
              <a href="#terms">{t('footer_terms')}</a>
              <a href="#support">{t('footer_support')}</a>
            </div>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="footer-bottom">
          <p>{t('footer_rights')}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
            <span>Built for smarter agriculture</span>
            <Leaf size={14} color="var(--accent-lime)" />
          </div>
        </div>
      </div>
    </footer>
  );
}
