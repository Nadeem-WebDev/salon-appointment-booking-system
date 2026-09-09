import React, { useState } from 'react';
import { Lock, User as UserIcon, ArrowLeft, ShieldCheck } from 'lucide-react';
import { Alert, Button, Field, GlassCard, Input } from '../ui/index.js';
import logo from '../../assets/logo.svg';

export default function AdminLogin({ apiBase, onLoginSuccess, onBack }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      onLoginSuccess(data.token, data.role);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-[26rem] mb-5">
        <Button variant="ghost" size="sm" onClick={onBack} className="-ml-3">
          <ArrowLeft size={15} aria-hidden="true" /> Back to website
        </Button>
      </div>

      <GlassCard className="w-full max-w-[26rem] p-8 md:p-10 relative overflow-hidden">
        <div
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-60"
          aria-hidden="true"
        />

        <div className="flex flex-col items-center text-center mb-8">
          <div className="h-14 w-14 grid place-items-center rounded-[var(--radius-lg)] bg-primary-soft border border-primary/25 p-3 mb-5">
            <img src={logo} alt="" className="h-full w-full object-contain opacity-90" aria-hidden="true" />
          </div>
          <h1 className="font-display text-2xl text-content m-0">Admin portal</h1>
          <p className="text-[13px] text-content-secondary mt-2 m-0">
            Sign in to manage appointments and settings.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Username" htmlFor="username">
            <div className="relative">
              <UserIcon
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-content-muted pointer-events-none"
                aria-hidden="true"
              />
              <Input
                id="username"
                type="text"
                autoComplete="username"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </Field>

          <Field label="Password" htmlFor="password">
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-content-muted pointer-events-none"
                aria-hidden="true"
              />
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </Field>

          <Button type="submit" size="lg" loading={loading} className="mt-2 w-full">
            <ShieldCheck size={17} aria-hidden="true" />
            {loading ? 'Authenticating…' : 'Secure sign in'}
          </Button>
        </form>

        {error && (
          <Alert tone="danger" className="mt-5">
            {error}
          </Alert>
        )}
      </GlassCard>
    </div>
  );
}
