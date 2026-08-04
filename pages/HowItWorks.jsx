import { useLanguage } from '../context/LanguageContext';

export default function HowItWorks() {
  const { t } = useLanguage();

  const steps = [
    { num: 1, icon: '📸', title: t('step_1_title'), desc: t('step_1_desc') },
    { num: 2, icon: '🤖', title: t('step_2_title'), desc: t('step_2_desc') },
    { num: 3, icon: '📋', title: t('step_3_title'), desc: t('step_3_desc') },
    { num: 4, icon: '📚', title: t('step_4_title'), desc: t('step_4_desc') },
  ];

  return (
    <div className="page">
      <section className="section">
        <div className="container">
          <h1 className="section-title">{t('how_title')}</h1>
          <p className="section-subtitle">{t('how_subtitle')}</p>
          
          <div className="steps-container">
            {steps.map((step) => (
              <div className="step-item" key={step.num}>
                <div className="step-number">{step.num}</div>
                <div className="step-content">
                  <h3>{step.icon} {step.title}</h3>
                  <p>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{
            textAlign: 'center',
            marginTop: 'var(--space-12)',
            padding: 'var(--space-8)',
            background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(6,182,212,0.05))',
            borderRadius: 'var(--radius-2xl)',
            border: '1px solid var(--border-color)'
          }}>
            <p style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
              It's that simple! Get started in minutes.
            </p>
            <a href="/signup" className="btn btn-primary btn-lg">
              🚀 {t('hero_cta')}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
