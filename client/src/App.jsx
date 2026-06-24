import React, { useState } from 'react';
import BookingForm from './components/BookingForm.jsx';
import QueueView from './components/QueueView.jsx';
import AdminPanel from './components/admin/AdminPanel.jsx';

export default function App() {
  const [view, setView] = useState('customer'); // 'customer' or 'admin'
  const [queueRefreshKey, setQueueRefreshKey] = useState(0);
  const API_BASE = import.meta.env.MODE === "development" ? import.meta.env.VITE_API_BASE : "/api";

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans text-[#111]">
      {view === 'customer' ? (
        <>
          <nav className="sticky top-0 z-50 bg-linear-to-br from-[#667eea] to-[#764ba2] shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
            <div className="max-w-300 mx-auto py-4 px-6 flex flex-col md:flex-row justify-between items-center gap-3 md:gap-0">
              <h1 className="text-white text-2xl md:text-[28px] font-bold m-0">💇 Salon Booking</h1>
              <button 
                className="bg-white/20 text-white border-2 border-white py-2.5 px-5 rounded-lg cursor-pointer font-semibold transition-all duration-300 text-sm hover:bg-white/30 hover:-translate-y-0.5" 
                onClick={() => setView('admin')}
              >
                Admin Access
              </button>
            </div>
          </nav>

          <main className="py-10 px-5">
            <section className="text-center mb-12.5 text-[#333]">
              <h2 className="text-[32px] md:text-[42px] font-bold mb-3 bg-linear-to-br from-[#667eea] to-[#764ba2] text-transparent bg-clip-text">
                Welcome to Our Salon
              </h2>
              <p className="text-base md:text-lg text-[#666]">Book your perfect appointment and check the queue</p>
            </section>

            <div className="max-w-300 mx-auto grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-7.5">
              <div className="bg-white p-7.5 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-shadow duration-300 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
                <h3 className="text-[#333] mb-5 text-[20px] font-semibold">📅 Book Appointment</h3>
                <BookingForm apiBase={API_BASE} onBooked={() => setQueueRefreshKey(prev => prev + 1)} />
              </div>
              <div className="bg-white p-7.5 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-shadow duration-300 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
                <h3 className="text-[#333] mb-5 text-[20px] font-semibold">👥 Current Queue</h3>
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