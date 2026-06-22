'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await signIn('credentials', {
      redirect: false,
      username,
      password
    });

    if (res?.error) {
      setError(res.error);
      setLoading(false);
    } else {
      router.push('/');
      router.refresh();
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: 'var(--sp-2xl) var(--sp-lg)' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--sp-xl)' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--lime)', marginBottom: '8px' }}>
            Team Standup Tracker
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Sign in to continue</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(255, 42, 85, 0.1)', border: '1px solid var(--danger)', padding: '12px', borderRadius: '8px', color: 'var(--danger)', fontSize: '0.85rem', marginBottom: 'var(--sp-md)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-input"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="sreesh"
            />
          </div>

          <div className="form-group" style={{ marginBottom: 'var(--sp-lg)' }}>
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="btn btn-lime btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: 'var(--sp-xl)', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          For testing: Use <strong>sreesh</strong> / <strong>sreesh</strong> or <strong>admin@example.com</strong> / <strong>password123</strong>
        </div>
      </div>
    </div>
  );
}
