import React, { useState } from 'react';
import { Lock, User as UserIcon, ArrowLeft, ShieldCheck } from 'lucide-react';
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
        body: JSON.stringify({ username, password })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Success! Pass the token back to AdminPanel
      onLoginSuccess(data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#E8FCCF] p-4 font-sans text-[#134611] relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-[#96E072]/50 blur-[100px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[300px] h-[300px] bg-[#3DA35D]/40 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-[420px] mb-6 z-10">
        <button onClick={onBack} className="flex items-center gap-2 text-[#3E8914] hover:text-[#134611] transition-colors bg-transparent border-none cursor-pointer text-sm font-bold">
          <ArrowLeft size={16} /> Back to Website
        </button>
      </div>

      <div className="bg-white/40 backdrop-blur-2xl border border-white/60 p-8 md:p-10 rounded-3xl shadow-[0_8px_32px_rgba(19,70,17,0.1)] w-full max-w-[420px] z-10 relative">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-[#134611] rounded-2xl flex items-center justify-center p-3 shadow-lg mb-5 border border-[#3DA35D]/30">
            <img src={logo} alt="Logo" className="w-full h-full object-contain filter invert opacity-90" />
          </div>
          <h2 className="text-2xl font-black text-[#134611] tracking-tight m-0">Admin Portal</h2>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="relative">
            <UserIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3DA35D]" />
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-white/60 border-2 border-[#3DA35D]/40 rounded-xl text-[#134611] placeholder-[#3DA35D] font-bold transition-all focus:outline-none focus:border-[#3E8914] focus:bg-white"
              required
            />
          </div>
          <div className="relative">
            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3DA35D]" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-white/60 border-2 border-[#3DA35D]/40 rounded-xl text-[#134611] placeholder-[#3DA35D] font-bold transition-all focus:outline-none focus:border-[#3E8914] focus:bg-white"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 py-3.5 bg-[#134611] hover:bg-[#3E8914] text-[#E8FCCF] rounded-xl font-bold shadow-lg transition-all duration-300 hover:-translate-y-0.5 border-none cursor-pointer disabled:opacity-50"
          >
            <ShieldCheck size={18} />
            {loading ? 'Authenticating...' : 'Secure Login'}
          </button>
        </form>

        {error && (
          <div className="mt-5 p-3 rounded-xl bg-red-100 border border-red-200 text-red-600 text-center text-sm font-bold animate-slideIn">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}