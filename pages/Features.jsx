import { useLanguage } from '../context/LanguageContext';

export default function Features() {
  const { t } = useLanguage();

  const features = [
    { icon: '🔬', title: t('feature_1_title'), desc: t('feature_1_desc'), color: 'var(--green-500)' },
    { icon: '💊', title: t('feature_2_title'), desc: t('feature_2_desc'), color: 'var(--cyan-500)' },
    { icon: '🌤️', title: t('feature_3_title'), desc: t('feature_3_desc'), color: 'var(--amber-500)' },
    { icon: '🌐', title: t('feature_4_title'), desc: t('feature_4_desc'), color: 'var(--purple-500)' },
    { icon: '📊', title: t('feature_5_title'), desc: t('feature_5_desc'), color: 'var(--green-400)' },
    { icon: '🔔', title: t('feature_6_title'), desc: t('feature_6_desc'), color: 'var(--cyan-400)' },
  ];

  return (
    <div className="page">
      <section className="section">
        <div className="container">
          <h1 className="section-title">{t('features_title')}</h1>
          <p className="section-subtitle">{t('features_subtitle')}</p>
          <div className="grid-3">
            {features.map((feature, i) => (
              <div className="card" key={i} style={{ position: 'relative', overflow: 'hidden' }}>
                <div style={{
                  position: 'absolute',
                  top: -20,
                  right: -20,
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${feature.color}15, transparent 70%)`,
                  pointerEvents: 'none'
                }} />
                <div className="card-icon" style={{ fontSize: '1.5rem' }}>{feature.icon}</div>
                <h3 className="card-title">{feature.title}</h3>
                <p className="card-text">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
