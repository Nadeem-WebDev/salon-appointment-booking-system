import React, { useEffect, useState } from 'react';
import AdminLogin from './AdminLogin.jsx';
import AnalyticsDashboard from './AnalyticsDashboard.jsx';
import AppointmentsList from './AppointmentsList.jsx';

import logo from '../../assets/logo.svg';
import { ArrowLeft, LogOut, LayoutDashboard, ListTodo, Search, Calendar, Filter } from 'lucide-react';

export default function AdminPanel({ apiBase, onBack }) {
  const [adminMode, setAdminMode] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState(getTodayString());

  const ADMIN_PASSWORD = 'admin123';

  const loadBookings = async () => {
    try {
      const res = await fetch(`${apiBase}/bookings`);
      const data = await res.json();
      setBookings(data);
    } catch (err) {
      console.error('Failed to load bookings:', err);
    }
  };

  useEffect(() => {
    if (adminMode) {
      loadBookings();
      const interval = setInterval(loadBookings, 5000);
      return () => clearInterval(interval);
    }
  }, [adminMode]);

  const handleLogin = (password) => {
    if (password === ADMIN_PASSWORD) {
      setAdminMode(true);
      setLoginError('');
    } else {
      setLoginError('Invalid password');
    }
  };

  if (!adminMode) {
    return <AdminLogin onLogin={handleLogin} onBack={onBack} error={loginError} />;
  }

  const filteredBookings = bookings.filter(booking => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      booking.customer_name?.toLowerCase().includes(searchLower) ||
      booking.email?.toLowerCase().includes(searchLower) ||
      booking.phone?.includes(searchTerm);
      
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    
    let matchesDate = true;
    if (dateFilter) {
      const bookingDate = new Date(booking.appointment_time);
      const year = bookingDate.getFullYear();
      const month = String(bookingDate.getMonth() + 1).padStart(2, '0');
      const day = String(bookingDate.getDate()).padStart(2, '0');
      matchesDate = `${year}-${month}-${day}` === dateFilter;
    }
    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-[#E8FCCF] min-h-screen max-w-[1600px] mx-auto overflow-x-hidden text-[#134611] relative">
      
      {/* Background glow for admin area */}
      <div className="absolute top-20 right-0 w-125 h-125 bg-[#96E072]/30 blur-[150px] rounded-full pointer-events-none -z-10"></div>

      {/* Header (Glassmorphism) */}
      <div className="flex justify-between items-center mb-6 bg-[#134611]/90 backdrop-blur-md border border-[#134611] p-4 md:p-5 rounded-2xl shadow-lg gap-3">
        <div className="flex items-center gap-4 min-w-0">
          <button 
            onClick={onBack} 
            className="flex items-center gap-2 py-2 px-3 bg-white/10 text-[#E8FCCF] hover:bg-white/20 rounded-lg cursor-pointer font-bold transition-colors duration-200 text-sm border border-white/10"
          >
            <ArrowLeft size={18} /> <span className="hidden sm:inline">Website</span>
          </button>
          
          <div className="hidden sm:flex w-9 h-9 bg-white/10 rounded-lg items-center justify-center p-1.5 shadow-inner border border-white/20 backdrop-blur-sm">
            <img src={logo} alt="Logo" className="w-full h-full object-contain filter invert" />
          </div>
          
          <h2 className="m-0 text-[#E8FCCF] text-lg md:text-xl font-black truncate tracking-tight">
            Admin Control Center
          </h2>
        </div>
        
        <button 
          className="flex items-center gap-2 py-2 px-4 bg-red-500/20 text-red-200 hover:bg-red-500/40 border border-red-500/30 rounded-lg cursor-pointer font-bold transition-colors duration-200 text-sm" 
          onClick={() => setAdminMode(false)}
        >
          <LogOut size={16} strokeWidth={2.5} /> <span className="hidden sm:inline">Logout</span>
        </button>
      </div>

      {/* Control Bar (Glassmorphism) */}
      <div className="mb-8 bg-white/50 backdrop-blur-xl border border-[#3DA35D]/30 p-2 rounded-2xl shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        
        {/* Tabs */}
        <div className="flex p-1 bg-white/50 rounded-xl w-full xl:w-auto border border-[#3DA35D]/20">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 xl:flex-none flex items-center justify-center gap-2 py-2.5 px-6 rounded-lg font-bold text-sm transition-all duration-300 border-none cursor-pointer ${activeTab === 'dashboard' ? 'bg-[#3E8914] text-[#E8FCCF] shadow-md' : 'bg-transparent text-[#3E8914] hover:text-[#134611] hover:bg-[#96E072]/20'}`}
          >
            <LayoutDashboard size={18} /> <span className="hidden sm:inline">Analytics</span>
          </button>
          <button 
            onClick={() => setActiveTab('list')}
            className={`flex-1 xl:flex-none flex items-center justify-center gap-2 py-2.5 px-6 rounded-lg font-bold text-sm transition-all duration-300 border-none cursor-pointer ${activeTab === 'list' ? 'bg-[#3E8914] text-[#E8FCCF] shadow-md' : 'bg-transparent text-[#3E8914] hover:text-[#134611] hover:bg-[#96E072]/20'}`}
          >
            <ListTodo size={18} /> <span className="hidden sm:inline">Appointments</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row items-center gap-3 w-full xl:w-auto p-2 xl:p-0">
          {activeTab === 'list' && (
            <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
              <div className="relative w-full sm:w-auto md:w-56">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3DA35D]" />
                <input
                  type="text"
                  placeholder="Search records..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white/70 border border-[#3DA35D]/50 rounded-xl text-sm text-[#134611] placeholder-[#3DA35D] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#96E072]/50 focus:border-[#3E8914] focus:bg-white"
                />
              </div>
              <div className="relative w-full sm:w-auto md:w-40">
                <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3DA35D] pointer-events-none" />
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white/70 border border-[#3DA35D]/50 rounded-xl text-sm text-[#134611] font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-[#96E072]/50 focus:border-[#3E8914] focus:bg-white appearance-none cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="queued">Queued</option>
                  <option value="in-progress">In-Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          )}

          <div className="relative w-full sm:w-auto md:w-48">
             <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3DA35D] pointer-events-none" />
            <input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-white/70 border border-[#3DA35D]/50 rounded-xl text-sm text-[#134611] font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-[#96E072]/50 focus:border-[#3E8914] focus:bg-white"
            />
            {dateFilter && (
              <button 
                onClick={() => setDateFilter('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3DA35D] hover:text-red-500 transition-colors bg-transparent border-none cursor-pointer font-bold"
                title="Clear date"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {activeTab === 'dashboard' ? (
        <AnalyticsDashboard bookings={filteredBookings} />
      ) : (
        <AppointmentsList 
          bookings={filteredBookings} 
          apiBase={apiBase} 
          onRefresh={loadBookings} 
          filters={{ searchTerm, statusFilter, dateFilter }} 
        />
      )}
    </div>
  );
}