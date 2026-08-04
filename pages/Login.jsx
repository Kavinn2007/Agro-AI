import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function Login() {
  const { t } = useLanguage();
  const { signIn, signInWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: 'var(--space-6)' }}>
          <Link to="/login" style={{ flex: 1, textAlign: 'center', padding: '1rem', fontWeight: 'bold', color: 'var(--green-400)', borderBottom: '3px solid var(--green-400)', textDecoration: 'none' }}>
            Login
          </Link>
          <Link to="/signup" style={{ flex: 1, textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
            Sign in
          </Link>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
          <h2>{t('login_title') || 'Welcome Back'}</h2>
          <p className="auth-subtitle">{t('login_subtitle') || 'Login to your account'}</p>
        </div>

        {error && (
          <div style={{
            padding: 'var(--space-3) var(--space-4)',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid var(--red-400)',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--red-400)',
            fontSize: 'var(--fs-sm)',
            marginBottom: 'var(--space-4)'
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">{t('auth_email')}</label>
            <input
              id="login-email"
              className="form-input"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="farmer@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">{t('auth_password')}</label>
            <div className="password-input-wrapper">
              <input
                id="login-password"
                className="form-input"
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <button 
                type="button" 
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginBottom: '1rem' }}
            disabled={loading}
          >
            {loading ? '⏳ Signing in...' : `🔐 ${t('auth_login')}`}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', margin: '1rem 0', color: 'var(--text-muted)' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
            <span style={{ padding: '0 1rem', fontSize: 'var(--fs-sm)' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
          </div>
          
          <button
            type="button"
            className="btn btn-secondary btn-lg"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
            onClick={async () => {
              setLoading(true);
              try {
                await signInWithGoogle();
                // We do not navigate here manually because signInWithRedirect 
                // will transition the page away from our app completely.
                // The useEffect mapped to `user` will handle post-redirect UI.
              } catch (err) {
                setError('Google Login failed');
                setLoading(false);
              }
            }}
            disabled={loading}
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{width: '24px', height: '24px'}} />
            Sign in with Google
          </button>
        </form>

        <p className="auth-footer">
          {t('auth_no_account')}{' '}
          <Link to="/signup">{t('auth_signup_link')}</Link>
        </p>
      </div>
    </div>
  );
}
