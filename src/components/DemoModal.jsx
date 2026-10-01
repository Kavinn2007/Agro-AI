import { useLanguage } from '../context/LanguageContext';
import { AlertTriangle, Stethoscope, ShieldCheck, CheckCircle2, X } from 'lucide-react';

export default function DemoModal({ isOpen, onClose }) {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--accent-lime)' }}>AI</span>
            <span>{t('demo_title')}</span>
          </h3>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          {/* Sample crop image */}
          <div style={{
            width: '100%',
            height: 220,
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            marginBottom: 'var(--space-6)',
            border: '1px solid var(--agri-border)',
            position: 'relative'
          }}>
            <img 
              src="/sample_early_blight.jpg" 
              alt="Demo Early Blight Diagnosis" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{
              position: 'absolute',
              bottom: '10px',
              left: '10px',
              background: 'rgba(7, 20, 14, 0.85)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid rgba(74, 222, 128, 0.3)',
              fontSize: '11px',
              color: 'var(--accent-mint)',
              fontWeight: 600
            }}>
              Sample: Tomato Leaf Pathogen
            </div>
          </div>

          {/* Demo result */}
          <div className="result-card" style={{ background: 'rgba(14, 36, 26, 0.65)' }}>
            <div className="result-header" style={{
              padding: 'var(--space-4) var(--space-5)',
              background: 'rgba(10, 27, 19, 0.9)',
              borderBottom: '1px solid var(--agri-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '0.2rem', textTransform: 'uppercase' }}>
                  {t('result_disease')}
                </p>
                <h3 className="result-disease" style={{ fontSize: 'var(--fs-xl)', color: '#ffffff' }}>
                  {t('demo_disease')}
                </h3>
              </div>
              <span className="badge-tag badge-healthy" style={{ padding: '4px 12px' }}>
                <CheckCircle2 size={13} />
                {t('demo_confidence')}
              </span>
            </div>

            <div className="result-sections" style={{ padding: 'var(--space-5)', display: 'grid', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: 'var(--radius-md)',
                  background: 'rgba(234, 179, 8, 0.15)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: 'var(--amber-400)', flexShrink: 0
                }}>
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', color: '#ffffff', marginBottom: '4px' }}>{t('result_symptoms')}</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.5 }}>{t('demo_symptoms')}</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: 'var(--radius-md)',
                  background: 'rgba(34, 197, 94, 0.15)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: 'var(--accent-lime)', flexShrink: 0
                }}>
                  <Stethoscope size={18} />
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', color: '#ffffff', marginBottom: '4px' }}>{t('result_remedy')}</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.5 }}>{t('demo_remedy')}</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: 'var(--radius-md)',
                  background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: 'var(--status-info)', flexShrink: 0
                }}>
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', color: '#ffffff', marginBottom: '4px' }}>{t('result_prevention')}</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.5 }}>{t('demo_prevention')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
