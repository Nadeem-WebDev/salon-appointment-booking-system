import React, { useState } from 'react';
import { Lock, ArrowLeft, ShieldCheck } from 'lucide-react';
import logo from '../../assets/logo.svg';

export default function AdminLogin({ onLogin, onBack, error }) {
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(password);
    setPassword('');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#E8FCCF] p-4 font-sans text-[#134611] relative overflow-hidden">
      
      {/* Ambient Orbs for Glass Effect */}
      <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-[#96E072]/50 blur-[100px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[300px] h-[300px] bg-[#3DA35D]/40 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-[420px] mb-6 z-10">
        <button onClick={onBack} className="flex items-center gap-2 text-[#3E8914] hover:text-[#134611] transition-colors bg-transparent border-none cursor-pointer text-sm font-bold">
          <ArrowLeft size={16} /> Back to Website
        </button>
      </div>

      {/* Clean Glassmorphism Card */}
      <div className="bg-white/40 backdrop-blur-2xl border border-white/60 p-8 md:p-10 rounded-3xl shadow-[0_8px_32px_rgba(19,70,17,0.1)] w-full max-w-[420px] z-10 relative">
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-[#134611] rounded-2xl flex items-center justify-center p-3 shadow-lg mb-5 border border-[#3DA35D]/30">
            <img src={logo} alt="Logo" className="w-full h-full object-contain filter invert opacity-90" />
          </div>
          <h2 className="text-2xl font-black text-[#134611] tracking-tight m-0">Admin Portal</h2>
          <p className="text-[#3E8914] font-medium text-sm mt-2 m-0">Authenticate to access control center</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="relative">
            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3DA35D]" />
            <input
              type="password"
              placeholder="Enter access key..."
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-white/60 border-2 border-[#3DA35D]/40 rounded-xl text-[#134611] placeholder-[#3DA35D] font-medium transition-all focus:outline-none focus:ring-4 focus:ring-[#96E072]/40 focus:border-[#3E8914] focus:bg-white"
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#134611] hover:bg-[#3E8914] text-[#E8FCCF] rounded-xl font-bold shadow-lg shadow-[#134611]/20 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 border-none cursor-pointer"
          >
            <ShieldCheck size={18} />
            Secure Login
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