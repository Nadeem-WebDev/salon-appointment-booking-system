import React, { useState } from 'react';
import BookingForm from './components/BookingForm.jsx';
import QueueView from './components/QueueView.jsx';
import AdminPanel from './components/admin/AdminPanel.jsx';

import logo from './assets/logo.svg';
import { CalendarClock, Users, ShieldCheck } from 'lucide-react';

export default function App() {
  const [view, setView] = useState('customer');
  const [queueRefreshKey, setQueueRefreshKey] = useState(0);
  
  const API_BASE = import.meta.env.MODE === "development" ? import.meta.env.VITE_API_BASE : "/api";

  return (
    <div className="min-h-screen bg-[#E8FCCF] font-sans text-[#134611] selection:bg-[#96E072] selection:text-[#134611]">
      {view === 'customer' ? (
        <>
          {/* Deep Green Glass Navbar */}
          <nav className="sticky top-0 z-50 bg-[#134611]/85 backdrop-blur-lg border-b border-[#3DA35D]/40 shadow-lg">
            <div className="max-w-350 mx-auto py-3 px-4 md:px-8 flex flex-wrap justify-between items-center gap-4">
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-white/10 rounded-xl flex items-center justify-center p-2 border border-[#96E072]/30 backdrop-blur-sm">
                  <img src={logo} alt="Salon Logo" className="w-full h-full object-contain filter invert" />
                </div>
                <h1 className="text-xl md:text-2xl font-black text-[#E8FCCF] m-0 tracking-tight">
                  SalonBooker
                </h1>
              </div>

              <button 
                className="flex items-center gap-2 bg-[#3E8914] text-[#E8FCCF] border border-[#96E072]/50 py-2 px-4 md:py-2.5 md:px-5 rounded-lg md:rounded-xl cursor-pointer font-semibold transition-all duration-300 text-sm hover:bg-[#3DA35D] hover:text-[#134611] hover:shadow-lg hover:-translate-y-0.5" 
                onClick={() => setView('admin')}
              >
                <ShieldCheck size={18} />
                <span className="hidden sm:inline">Admin Access</span>
              </button>
            </div>
          </nav>

          <main className="py-12 px-4 md:px-8 max-w-350 mx-auto relative">
            
            {/* Ambient Background Glow for extra depth */}
            <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[60%] h-100 bg-[#96E072]/40 blur-[120px] rounded-full pointer-events-none -z-10"></div>

            <section className="text-center mb-12 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-black mb-4 text-[#134611] tracking-tight">
                Your perfect style,<br/>
                <span className="text-[#3E8914]">just an appointment away.</span>
              </h2>
              <p className="text-base md:text-lg text-[#3DA35D] font-bold">Book your slot instantly and track your position in the live queue.</p>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10 items-start">
              {/* Glassmorphism Panel */}
              <div className="bg-white/40 backdrop-blur-xl border border-white/60 p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-[0_8px_30px_rgba(19,70,17,0.06)]">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#3DA35D]/20">
                  <div className="p-2.5 bg-[#134611] text-[#E8FCCF] rounded-xl shadow-inner">
                    <CalendarClock size={24} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-[#134611] text-xl font-bold m-0">Book Appointment</h3>
                </div>
                <BookingForm apiBase={API_BASE} onBooked={() => setQueueRefreshKey(prev => prev + 1)} />
              </div>
              
              {/* Glassmorphism Panel */}
              <div className="bg-white/40 backdrop-blur-xl border border-white/60 p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-[0_8px_30px_rgba(19,70,17,0.06)]">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#3DA35D]/20">
                  <div className="p-2.5 bg-[#134611] text-[#E8FCCF] rounded-xl shadow-inner">
                    <Users size={24} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-[#134611] text-xl font-bold m-0">Live Queue Status</h3>
                </div>
                <QueueView apiBase={API_BASE} refreshKey={queueRefreshKey} />
              </div>
            </div>
          </main>
        </>
      ) : (
        <AdminPanel apiBase={API_BASE} onBack={() => setView('customer')} />
      )}
    </div>
  );
}