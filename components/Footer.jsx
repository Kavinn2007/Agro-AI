import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to="/" className="navbar-brand">
              <img src="/logo.png" alt="AgroAI" style={{ height: 36, width: 36, borderRadius: '0.5rem' }} />
              <span style={{ 
                background: 'linear-gradient(135deg, #34d399, #22d3ee)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: 'var(--fs-xl)'
              }}>AgroAI</span>
            </Link>
            <p>{t('footer_tagline')}</p>
          </div>

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

          <div>
            <h4 className="footer-title">{t('footer_resources')}</h4>
            <div className="footer-links">
              <a href="#faq">{t('footer_faq')}</a>
              <a href="#support">{t('footer_support')}</a>
              <Link to="/dashboard">{t('nav_dashboard')}</Link>
            </div>
          </div>

          <div>
            <h4 className="footer-title">{t('footer_legal')}</h4>
            <div className="footer-links">
              <a href="#privacy">{t('footer_privacy')}</a>
              <a href="#terms">{t('footer_terms')}</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>{t('footer_rights')}</p>
          <p className="footer-tagline">"{t('footer_tagline')}"</p>
        </div>
      </div>
    </footer>
  );
}
