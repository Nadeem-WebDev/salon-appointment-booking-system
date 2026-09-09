import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { CalendarClock, Users, ShieldCheck, Home, Sparkles } from 'lucide-react';

import BookingForm from './components/BookingForm.jsx';
import QueueView from './components/QueueView.jsx';
import AdminPanel from './components/admin/AdminPanel.jsx';
import { Button, GlassCard, SectionHeader } from './components/ui/index.js';
import logo from './assets/logo.svg';

function Brand({ size = 'md' }) {
  const box = size === 'sm' ? 'h-9 w-9' : 'h-11 w-11';
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div
        className={`${box} grid place-items-center shrink-0 rounded-[var(--radius-md)] bg-primary-soft border border-primary/25 p-2`}
      >
        <img src={logo} alt="" className="h-full w-full object-contain opacity-90" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="font-display text-lg leading-none text-content m-0 truncate">SalonBooker</p>
        <p className="text-[10px] uppercase tracking-[0.22em] text-primary m-0 mt-1">Studio</p>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <main className="relative min-h-screen grid place-items-center px-6 text-center">
      <div>
        <p className="font-display text-[7rem] md:text-[9rem] leading-none text-primary/25 m-0 select-none">
          404
        </p>
        <h1 className="font-display text-3xl md:text-4xl text-content m-0 -mt-4">
          This page has stepped out
        </h1>
        <p className="text-content-secondary mt-4 mb-8 max-w-md mx-auto text-[15px]">
          The page you're looking for doesn't exist, has moved, or is temporarily unavailable.
        </p>
        <Button as={Link} to="/" size="lg">
          <Home size={18} aria-hidden="true" /> Back to home
        </Button>
      </div>
    </main>
  );
}

function CustomerView({ apiBase }) {
  const [queueRefreshKey, setQueueRefreshKey] = useState(0);

  return (
    <>
      <header className="sticky top-0 z-50 glass glass-edge border-x-0 border-t-0 rounded-none">
        <div className="mx-auto max-w-[85rem] px-4 md:px-8 h-[4.5rem] flex items-center justify-between gap-4">
          <Brand />
          <Button as={Link} to="/admin" variant="secondary" size="sm">
            <ShieldCheck size={16} aria-hidden="true" />
            <span className="hidden sm:inline">Admin</span>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-[85rem] px-4 md:px-8 py-12 md:py-16">
        <section className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-soft border border-primary/20 text-primary text-[11px] font-semibold uppercase tracking-[0.14em]">
            <Sparkles size={13} aria-hidden="true" /> Now booking
          </span>
          <h1 className="font-display text-4xl md:text-[3.25rem] leading-[1.08] text-content mt-6 mb-0">
            Your perfect style,
            <br />
            <span className="text-primary">just an appointment away.</span>
          </h1>
          <p className="text-content-secondary text-base md:text-lg mt-5 mb-0">
            Reserve your slot in seconds and follow your place in the live queue.
          </p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6 lg:gap-8 items-start">
          <GlassCard className="p-6 md:p-8">
            <SectionHeader
              icon={CalendarClock}
              title="Book an appointment"
              description="Choose your service, stylist and time."
            />
            <BookingForm apiBase={apiBase} onBooked={() => setQueueRefreshKey((k) => k + 1)} />
          </GlassCard>

          <GlassCard className="p-6 md:p-8 lg:sticky lg:top-24">
            <SectionHeader
              icon={Users}
              title="Live queue"
              description="Updates automatically every 10 seconds."
            />
            <QueueView apiBase={apiBase} refreshKey={queueRefreshKey} />
          </GlassCard>
        </div>
      </main>

      <footer className="border-t border-subtle mt-8">
        <div className="mx-auto max-w-[85rem] px-4 md:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Brand size="sm" />
          <p className="text-[13px] text-content-muted m-0">
            Shashtri Nager, Mumbai · © {new Date().getFullYear()} SalonBooker Studio
          </p>
        </div>
      </footer>
    </>
  );
}

export default function App() {
  const API_BASE =
    import.meta.env.MODE === 'development' ? import.meta.env.VITE_API_BASE : '/api';

  return (
    <BrowserRouter>
      <div className="app-wash" aria-hidden="true" />
      <div className="min-h-screen text-content">
        <Routes>
          <Route path="/" element={<CustomerView apiBase={API_BASE} />} />
          <Route path="/admin/*" element={<AdminPanel apiBase={API_BASE} />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
