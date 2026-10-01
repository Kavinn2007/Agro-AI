import { useLanguage } from '../context/LanguageContext';
import { Target, Users, Scan, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function About() {
  const { t } = useLanguage();

  return (
    <div className="page" style={{ paddingTop: 'calc(var(--navbar-height) + var(--space-4))' }}>
      <section className="section">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
            <span className="section-badge">About AgroAI</span>
            <h1 className="section-title">{t('about_title')}</h1>
            <p className="section-subtitle">{t('about_subtitle')}</p>
          </div>

          <div style={{ maxWidth: 840, margin: '0 auto' }}>
            <div className="card" style={{ marginBottom: 'var(--space-8)', padding: 'var(--space-8)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: 'var(--radius-xl)',
                  background: 'rgba(34, 197, 94, 0.15)',
                  border: '1px solid rgba(74, 222, 128, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-lime)',
                  flexShrink: 0
                }}>
                  <Target size={28} />
                </div>
                <div>
                  <h3 style={{ color: '#ffffff', fontSize: 'var(--fs-xl)' }}>Our Mission</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-sm)' }}>Making AI accessible for every farmer</p>
                </div>
              </div>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 'var(--space-4)' }}>
                {t('about_p1')}
              </p>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 'var(--space-4)' }}>
                {t('about_p2')}
              </p>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                {t('about_p3')}
              </p>
            </div>

            <div className="grid-3">
              {[
                { icon: <Users size={24} />, num: '10K+', label: 'Farmers Empowered' },
                { icon: <Scan size={24} />, num: '50K+', label: 'Leaf Scans Completed' },
                { icon: <ShieldCheck size={24} />, num: '98.4%', label: 'Diagnostic Precision' },
              ].map((stat, i) => (
                <div className="card" key={i} style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
                  <div style={{ display: 'inline-flex', color: 'var(--accent-lime)', marginBottom: 'var(--space-2)' }}>
                    {stat.icon}
                  </div>
                  <div style={{ 
                    fontSize: 'var(--fs-3xl)', 
                    fontWeight: 800, 
                    fontFamily: 'var(--font-display)',
                    color: '#ffffff'
                  }}>
                    {stat.num}
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)' }}>{stat.label}</p>
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'center', marginTop: 'var(--space-10)' }}>
              <Link to="/signup" className="btn btn-primary btn-lg">
                <Sparkles size={18} />
                <span>Join AgroAI Today</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
