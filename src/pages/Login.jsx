import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { IconEye, IconEyeOff, IconLeave, IconLock, IconPay, IconPeople, IconUser } from '../components/Icons';

export default function Login() {
  const { user, ready, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (ready && user) {
    return <Navigate to={location.state?.from?.pathname || '/'} replace />;
  }

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    if (!form.username.trim() || !form.password) {
      setError('Username and password are required');
      return;
    }
    setBusy(true);
    try {
      await login(form.username.trim(), form.password);
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid username or password');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-orb login-orb-a" aria-hidden="true" />
      <div className="login-orb login-orb-b" aria-hidden="true" />

      <header className="login-top">
        <span className="brand-mark">EH</span>
        <div>
          <p className="login-eyebrow">Employee Hub</p>
          <strong>People workspace</strong>
        </div>
      </header>

      <main className="login-shell">
        <form className="login-card" onSubmit={handleSubmit}>
          <header className="login-card-head">
            <h2>Sign in</h2>
            <p>Use your account to open the dashboard.</p>
          </header>

          {error && <div className="banner banner-error">{error}</div>}

          <label className="login-field">
            <span>Username</span>
            <div className="login-input">
              <IconUser />
              <input
                name="username"
                value={form.username}
                onChange={updateField}
                autoComplete="username"
                placeholder="Username"
              />
            </div>
          </label>

          <label className="login-field">
            <span>Password</span>
            <div className="login-input">
              <IconLock />
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={updateField}
                autoComplete="current-password"
                placeholder="••••••••"
              />
              <button
                type="button"
                className="login-eye"
                onClick={() => setShowPassword((open) => !open)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <IconEyeOff /> : <IconEye />}
              </button>
            </div>
          </label>

          <button type="submit" className="button-primary login-submit" disabled={busy}>
            {busy ? 'Signing in…' : 'Continue'}
          </button>
        </form>

        <ul className="login-highlights">
          <li>
            <IconPeople />
            Directory
          </li>
          <li>
            <IconLeave />
            Leave
          </li>
          <li>
            <IconPay />
            Payroll
          </li>
        </ul>
      </main>
    </div>
  );
}
