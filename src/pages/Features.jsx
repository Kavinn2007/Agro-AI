import { useLanguage } from '../context/LanguageContext';
import { Scan, Stethoscope, CloudSun, Globe, BarChart3, Bell, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Features() {
  const { t } = useLanguage();

  const features = [
    { icon: <Scan size={24} />, title: t('feature_1_title'), desc: t('feature_1_desc') },
    { icon: <Stethoscope size={24} />, title: t('feature_2_title'), desc: t('feature_2_desc') },
    { icon: <CloudSun size={24} />, title: t('feature_3_title'), desc: t('feature_3_desc') },
    { icon: <Globe size={24} />, title: t('feature_4_title'), desc: t('feature_4_desc') },
    { icon: <BarChart3 size={24} />, title: t('feature_5_title'), desc: t('feature_5_desc') },
    { icon: <Bell size={24} />, title: t('feature_6_title'), desc: t('feature_6_desc') },
  ];

  return (
    <div className="page" style={{ paddingTop: 'calc(var(--navbar-height) + var(--space-4))' }}>
      <section className="section">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
            <span className="section-badge">Comprehensive Suite</span>
            <h1 className="section-title">{t('features_title')}</h1>
            <p className="section-subtitle">{t('features_subtitle')}</p>
          </div>

          <div className="grid-3">
            {features.map((feature, i) => (
              <div className="card" key={i}>
                <div className="card-icon">{feature.icon}</div>
                <h3 className="card-title">{feature.title}</h3>
                <p className="card-text">{feature.desc}</p>
              </div>
            ))}
          </div>

          <div style={{
            textAlign: 'center',
            marginTop: 'var(--space-12)',
            padding: 'var(--space-10) var(--space-6)',
            background: 'var(--agri-charcoal)',
            borderRadius: 'var(--radius-2xl)',
            border: '1px solid var(--agri-border)'
          }}>
            <h3 style={{ fontSize: 'var(--fs-2xl)', color: '#ffffff', marginBottom: 'var(--space-3)' }}>
              Empower Your Farm with AgroAI
            </h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto var(--space-6)' }}>
              Start diagnosing crop diseases in seconds and make data-driven decisions.
            </p>
            <Link to="/signup" className="btn btn-primary btn-lg">
              <Sparkles size={18} />
              <span>Get Started Free</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
