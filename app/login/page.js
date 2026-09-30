'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { splitList } from '@/lib/api';

export default function LoginPage() {
  const { user, loading, login, register } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [tab, setTab] = useState('login');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace('/notes');
  }, [user, loading, router]);

  async function handleSubmit(e) {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.currentTarget));
    setBusy(true);
    try {
      if (tab === 'login') {
        await login(form.email, form.password);
      } else {
        await register({ ...form, interests: splitList(form.interests) });
        toast('Account created', 'success');
      }
      router.replace('/notes');
    } catch (err) {
      toast(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth">
      <div className="auth-card card">
        <div className="brand brand-lg">
          <span className="logo">SN</span> Secure Notes
        </div>
        <p className="muted">Sign in to manage your notes.</p>

        <div className="tabs" role="tablist">
          <button type="button" className={`tab ${tab === 'login' ? 'active' : ''}`} onClick={() => setTab('login')}>
            Login
          </button>
          <button type="button" className={`tab ${tab === 'register' ? 'active' : ''}`} onClick={() => setTab('register')}>
            Register
          </button>
        </div>

        {/* key makes react give each tab a fresh form */}
        <form key={tab} className="stack" onSubmit={handleSubmit}>
          {tab === 'register' && (
            <label>
              Name <input name="name" autoComplete="name" required />
            </label>
          )}
          <label>
            Email <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
              minLength={tab === 'register' ? 8 : undefined}
              maxLength={72}
              required
            />
            {tab === 'register' && <small className="muted">8 to 72 characters</small>}
          </label>
          {tab === 'register' && (
            <label>
              Interests <input name="interests" placeholder="chess, reading, coding" />
              <small className="muted">Comma separated, optional</small>
            </label>
          )}
          <button className="btn btn-primary btn-block" disabled={busy}>
            {tab === 'login' ? 'Login' : 'Create account'}
          </button>
        </form>
      </div>
    </main>
  );
}
