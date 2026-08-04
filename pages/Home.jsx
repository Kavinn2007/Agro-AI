import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import DemoModal from '../components/DemoModal';

export default function Home() {
  const [demoOpen, setDemoOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <>
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="pulse"></span>
              {t('hero_badge')}
            </div>
            <h1>
              <span className="gradient-text">{t('hero_title_1')}</span>
              <br />
              {t('hero_title_2')}
            </h1>
            <p>{t('hero_subtitle')}</p>
            <div className="hero-actions">
              <Link to="/signup" className="btn btn-primary btn-lg">
                🚀 {t('hero_cta')}
              </Link>
              <button 
                className="btn btn-secondary btn-lg"
                onClick={() => setDemoOpen(true)}
              >
                👁️ {t('hero_demo')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="section" id="about-section">
        <div className="container">
          <h2 className="section-title">{t('about_title')}</h2>
          <p className="section-subtitle">{t('about_subtitle')}</p>
          <div className="grid-2" style={{ maxWidth: 900, margin: '0 auto' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 'var(--space-4)' }}>
                {t('about_p1')}
              </p>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                {t('about_p2')}
              </p>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div style={{
                width: '100%',
                maxWidth: 300,
                aspectRatio: '1',
                borderRadius: 'var(--radius-2xl)',
                background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(6,182,212,0.1))',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--space-4)',
                fontSize: '5rem',
              }}>
                🌾
                <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--green-400)', fontWeight: 600 }}>
                  AI + Agriculture
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <h2 className="section-title">{t('features_title')}</h2>
          <p className="section-subtitle">{t('features_subtitle')}</p>
          <div className="grid-3">
            {[
              { icon: '🔬', title: t('feature_1_title'), desc: t('feature_1_desc') },
              { icon: '💊', title: t('feature_2_title'), desc: t('feature_2_desc') },
              { icon: '🌤️', title: t('feature_3_title'), desc: t('feature_3_desc') },
              { icon: '🌐', title: t('feature_4_title'), desc: t('feature_4_desc') },
              { icon: '📊', title: t('feature_5_title'), desc: t('feature_5_desc') },
              { icon: '🔔', title: t('feature_6_title'), desc: t('feature_6_desc') },
            ].map((feature, i) => (
              <div className="card" key={i}>
                <div className="card-icon">{feature.icon}</div>
                <h3 className="card-title">{feature.title}</h3>
                <p className="card-text">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">{t('how_title')}</h2>
          <p className="section-subtitle">{t('how_subtitle')}</p>
          <div className="steps-container">
            {[
              { num: 1, icon: '📸', title: t('step_1_title'), desc: t('step_1_desc') },
              { num: 2, icon: '🤖', title: t('step_2_title'), desc: t('step_2_desc') },
              { num: 3, icon: '📋', title: t('step_3_title'), desc: t('step_3_desc') },
              { num: 4, icon: '📚', title: t('step_4_title'), desc: t('step_4_desc') },
            ].map((step) => (
              <div className="step-item" key={step.num}>
                <div className="step-number">{step.num}</div>
                <div className="step-content">
                  <h3>{step.icon} {step.title}</h3>
                  <p>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <h2 className="section-title">{t('benefits_title')}</h2>
          <p className="section-subtitle">{t('benefits_subtitle')}</p>
          <div className="grid-4">
            {[
              { icon: '🌱', title: t('benefit_1_title'), desc: t('benefit_1_desc') },
              { icon: '💰', title: t('benefit_2_title'), desc: t('benefit_2_desc') },
              { icon: '👆', title: t('benefit_3_title'), desc: t('benefit_3_desc') },
              { icon: '📱', title: t('benefit_4_title'), desc: t('benefit_4_desc') },
            ].map((benefit, i) => (
              <div className="card" key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-4)' }}>{benefit.icon}</div>
                <h3 className="card-title">{benefit.title}</h3>
                <p className="card-text">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">{t('testimonial_title')}</h2>
          <p className="section-subtitle">{t('testimonial_subtitle')}</p>
          <div className="grid-3">
            {[
              { text: t('testimonial_1'), name: t('testimonial_1_name'), role: t('testimonial_1_role'), initials: 'RK' },
              { text: t('testimonial_2'), name: t('testimonial_2_name'), role: t('testimonial_2_role'), initials: 'LD' },
              { text: t('testimonial_3'), name: t('testimonial_3_name'), role: t('testimonial_3_role'), initials: 'MS' },
            ].map((t, i) => (
              <div className="testimonial-card" key={i}>
                <p className="testimonial-text">{t.text}</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">{t.initials}</div>
                  <div>
                    <p className="testimonial-name">{t.name}</p>
                    <p className="testimonial-role">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section" style={{ 
        background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(6,182,212,0.05))',
        textAlign: 'center'
      }}>
        <div className="container">
          <h2 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--fs-3xl)' }}>
            Ready to Protect Your Crops?
          </h2>
          <p style={{ 
            color: 'var(--text-secondary)', 
            maxWidth: 500, 
            margin: '0 auto var(--space-8)',
            fontSize: 'var(--fs-lg)'
          }}>
            Join thousands of farmers using AI to detect diseases early and improve yields.
          </p>
          <Link to="/signup" className="btn btn-primary btn-lg">
            🚀 Get Started Free
          </Link>
        </div>
      </section>

      <DemoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
    </>
  );
}
