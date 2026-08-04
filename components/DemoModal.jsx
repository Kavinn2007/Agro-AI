import { useLanguage } from '../context/LanguageContext';

export default function DemoModal({ isOpen, onClose }) {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{t('demo_title')}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {/* Sample crop image */}
          <div style={{
            width: '100%',
            height: 200,
            borderRadius: 'var(--radius-xl)',
            background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(6,182,212,0.1))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 'var(--space-6)',
            border: '1px solid var(--border-color)',
            fontSize: '4rem'
          }}>
            🌿
          </div>

          {/* Demo result */}
          <div className="result-card">
            <div className="result-header">
              <div>
                <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                  {t('result_disease')}
                </p>
                <h3 className="result-disease">{t('demo_disease')}</h3>
              </div>
              <span className="result-confidence">{t('demo_confidence')}</span>
            </div>

            <div className="result-sections">
              <div className="result-section">
                <div className="result-section-icon symptoms">⚠️</div>
                <div className="result-section-content">
                  <h4>{t('result_symptoms')}</h4>
                  <p>{t('demo_symptoms')}</p>
                </div>
              </div>

              <div className="result-section">
                <div className="result-section-icon remedy">💊</div>
                <div className="result-section-content">
                  <h4>{t('result_remedy')}</h4>
                  <p>{t('demo_remedy')}</p>
                </div>
              </div>

              <div className="result-section">
                <div className="result-section-icon prevention">🛡️</div>
                <div className="result-section-content">
                  <h4>{t('result_prevention')}</h4>
                  <p>{t('demo_prevention')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
