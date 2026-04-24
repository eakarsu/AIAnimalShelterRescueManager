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

  const quickLogin = () => {
    setEmail('admin@shelter.com');
    setPassword('admin123');
    doLogin(null, 'admin@shelter.com', 'admin123');
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
            Quick Login (Demo)
          </button>
        </form>
      </div>
    </div>
  );
}
