import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import s from './Auth.module.css';

export default function Auth() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (mode === 'login') await login(form.email, form.password);
      else await register(form.name, form.email, form.password);
    } catch (err) {
      setError(err.response?.data?.error || 'something went wrong');
    } finally { setLoading(false); }
  };

  return (
    <div className={s.page}>
      <div className={s.card}>
        <div className={s.brand}>
          <div className={s.logo}>S</div>
          <span className={s.wordmark}>ShopFlow</span>
        </div>
        <p className={s.sub}>{mode === 'login' ? 'Sign in to your account' : 'Create your account'}</p>

        <form onSubmit={submit} className={s.form}>
          {mode === 'register' && (
            <div className={s.field}>
              <label>Name</label>
              <input value={form.name} onChange={set('name')} placeholder="Your name" required />
            </div>
          )}
          <div className={s.field}>
            <label>Email</label>
            <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required />
          </div>
          <div className={s.field}>
            <label>Password</label>
            <input type="password" value={form.password} onChange={set('password')} placeholder="••••••••" required minLength={6} />
          </div>
          {error && <p className={s.error}>{error}</p>}
          <button type="submit" className={s.submit} disabled={loading}>
            {loading ? 'loading...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {mode === 'register' && (
          <p className={s.note}>First registered user becomes admin.</p>
        )}

        <p className={s.toggle}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError(''); }}>
            {mode === 'login' ? 'Register' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
}
