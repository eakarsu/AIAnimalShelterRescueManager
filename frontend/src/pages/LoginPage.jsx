import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PawPrint, LogIn, Zap } from 'lucide-react';
import api from '../api';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const demoEmail = import.meta.env.VITE_DEMO_EMAIL || '';
  const demoPassword = import.meta.env.VITE_DEMO_PASSWORD || '';

  const doLogin = async (e, em, pw) => {
    if (e) e.preventDefault();
    const loginEmail = em || email;
    const loginPassword = pw || password;
    if (!loginEmail || !loginPassword) return;
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email: loginEmail, password: loginPassword });
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = async () => {
    if (demoEmail && demoPassword) { setEmail(demoEmail); setPassword(demoPassword); setError(''); return; }
    try {
      const res = await fetch('/api/auth/demo-credentials', { cache: 'no-store' });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.email && data?.password) { setEmail(data.email); setPassword(data.password); setError(''); return; }
    } catch {}
    setError('Demo credentials are not configured for this environment.');
  };

  const quickLogin = async () => {
    setError('');
    try {
      const res = await api.get('/auth/demo-credentials');
      setEmail(res.data.email);
      setPassword(res.data.password);
    } catch (err) {
      setError(err.response?.data?.error || 'Demo credentials are unavailable.');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-icon">
          <PawPrint size={48} />
        </div>
        <h1>Animal Shelter & Rescue Manager</h1>
        <p className="login-subtitle">Sign in to manage your shelter</p>
        {error && <div className="login-error">{error}</div>}
        <form className="login-form" onSubmit={doLogin}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>
            <LogIn size={18} />
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          <div className="login-divider">or</div>
          <button className="btn btn-accent btn-lg" type="button" onClick={quickLogin} disabled={loading}>
            <Zap size={18} />
            Fill Demo Credentials
          </button>
          <button className="btn btn-lg" type="button" aria-label="Fill demo credentials" onClick={fillDemoCredentials}>
            Fill demo credentials
          </button>
        </form>
      </div>
    </div>
  );
}
