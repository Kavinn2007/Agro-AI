import { useLanguage } from '../context/LanguageContext';

export default function About() {
  const { t } = useLanguage();

  return (
    <div className="page">
      <section className="section">
        <div className="container">
          <h1 className="section-title">{t('about_title')}</h1>
          <p className="section-subtitle">{t('about_subtitle')}</p>

          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div className="card" style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-8)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                <div style={{
                  width: 64,
                  height: 64,
                  borderRadius: 'var(--radius-xl)',
                  background: 'linear-gradient(135deg, var(--green-600), var(--cyan-500))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  flexShrink: 0
                }}>🎯</div>
                <div>
                  <h3>Our Mission</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-sm)' }}>Making AI accessible for agriculture</p>
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
                { icon: '🌾', num: '10K+', label: 'Farmers Helped' },
                { icon: '🔬', num: '50K+', label: 'Scans Completed' },
                { icon: '🌍', num: '95%', label: 'Accuracy Rate' },
              ].map((stat, i) => (
                <div className="card" key={i} style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>{stat.icon}</div>
                  <div style={{ 
                    fontSize: 'var(--fs-3xl)', 
                    fontWeight: 800, 
                    fontFamily: 'var(--font-display)',
                    background: 'linear-gradient(135deg, var(--green-400), var(--cyan-400))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    {stat.num}
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)' }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
