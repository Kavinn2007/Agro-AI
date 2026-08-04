import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function Contact() {
  const { t } = useLanguage();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setSubmitted(true);
    setSending(false);
    setForm({ name: '', email: '', message: '' });

    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <div className="page">
      <section className="section">
        <div className="container">
          <h1 className="section-title">{t('contact_title')}</h1>
          <p className="section-subtitle">{t('contact_subtitle')}</p>

          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            {submitted && (
              <div className="toast success" style={{ position: 'relative', top: 0, right: 0, marginBottom: 'var(--space-4)', maxWidth: '100%' }}>
                ✅ {t('contact_success')}
              </div>
            )}

            <div className="card" style={{ padding: 'var(--space-8)' }}>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label" htmlFor="contact-name">{t('contact_name')}</label>
                  <input
                    id="contact-name"
                    className="form-input"
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder={t('contact_name')}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="contact-email">{t('contact_email')}</label>
                  <input
                    id="contact-email"
                    className="form-input"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder={t('contact_email')}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="contact-message">{t('contact_message')}</label>
                  <textarea
                    id="contact-message"
                    className="form-input"
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder={t('contact_message')}
                    rows={5}
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%' }}
                  disabled={sending}
                >
                  {sending ? '⏳ Sending...' : `📩 ${t('contact_send')}`}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
