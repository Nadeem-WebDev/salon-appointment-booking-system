import React, { useState } from 'react';

export default function AdminLogin({ onLogin, onBack, error }) {
  const [password, setPassword] = useState('');

  const handleSubmit = () => {
    onLogin(password);
    setPassword('');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-linear-to-br from-[#667eea] to-[#764ba2] p-4">
      <div className="w-full max-w-100 mb-4">
        <button onClick={onBack} className="text-white/80 hover:text-white flex items-center gap-2 font-medium transition-colors bg-transparent border-none cursor-pointer p-0">
          ← Back to Website
        </button>
      </div>
      
      <div className="bg-white p-6 md:p-10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] w-full max-w-100">
        <h2 className="mt-0 text-[#333] text-center text-xl md:text-2xl font-bold mb-4">Admin Panel</h2>
        <input
          type="password"
          placeholder="Enter admin password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSubmit()}
          className="w-full p-3 my-3 border-2 border-[#e0e0e0] rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-[#667eea]"
        />
        <button 
          onClick={handleSubmit}
          className="w-full p-3 bg-linear-to-br from-[#667eea] to-[#764ba2] text-white border-none rounded-lg text-base font-semibold cursor-pointer mt-4 transition-transform duration-200 hover:-translate-y-0.5"
        >
          Login
        </button>
        {error && <div className="text-[#e74c3c] text-center mt-3 font-medium text-sm">{error}</div>}
      </div>
    </div>
  );
}