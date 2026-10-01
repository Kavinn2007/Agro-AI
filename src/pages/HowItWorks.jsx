import { useLanguage } from '../context/LanguageContext';
import { Camera, Cpu, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HowItWorks() {
  const { t } = useLanguage();

  const steps = [
    { num: '01', icon: <Camera size={22} color="var(--accent-lime)" />, title: t('step_1_title'), desc: t('step_1_desc') },
    { num: '02', icon: <Cpu size={22} color="var(--accent-lime)" />, title: t('step_2_title'), desc: t('step_2_desc') },
    { num: '03', icon: <CheckCircle2 size={22} color="var(--accent-lime)" />, title: t('step_3_title'), desc: t('step_3_desc') },
    { num: '04', icon: <ShieldCheck size={22} color="var(--accent-lime)" />, title: t('step_4_title'), desc: t('step_4_desc') },
  ];

  return (
    <div className="page" style={{ paddingTop: 'calc(var(--navbar-height) + var(--space-4))' }}>
      <section className="section">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
            <span className="section-badge">How It Works</span>
            <h1 className="section-title">{t('how_title')}</h1>
            <p className="section-subtitle">{t('how_subtitle')}</p>
          </div>
          
          <div className="how-steps-grid">
            {steps.map((step) => (
              <div className="step-card" key={step.num}>
                <div className="step-badge-number">
                  <span>{step.num}</span>
                  {step.icon}
                </div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
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
              Accurate Diagnosis in Minutes
            </h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto var(--space-6)' }}>
              Take control of your crop health today with AgroAI.
            </p>
            <Link to="/signup" className="btn btn-primary btn-lg">
              <Sparkles size={18} />
              <span>{t('hero_cta')}</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
