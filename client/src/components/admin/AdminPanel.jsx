import React, { useEffect, useState } from 'react';
import AdminLogin from './AdminLogin.jsx';
import AnalyticsDashboard from './AnalyticsDashboard.jsx';
import AppointmentsList from './AppointmentsList.jsx';

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

  const ADMIN_PASSWORD = 'admin123'; // In production, use proper auth

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
    <div className="p-4 md:p-6 pt-6 bg-[#f8f9fa] min-h-screen max-w-350 mx-auto overflow-x-hidden">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6 bg-white p-3 md:p-5 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.1)] gap-2 md:gap-4">
        <div className="flex items-center gap-2 md:gap-4 min-w-0">
          <button 
            onClick={onBack} 
            className="shrink-0 py-2 px-2.5 md:px-4 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg cursor-pointer font-semibold transition-colors duration-300 border-none text-xs md:text-sm"
          >
            ← <span className="hidden sm:inline">Website</span>
          </button>
          <h2 className="m-0 text-[#333] text-base md:text-xl font-bold truncate">
            <span className="sm:hidden">Admin</span>
            <span className="hidden sm:inline">Admin Control Center</span>
          </h2>
        </div>
        <button 
          className="shrink-0 py-2 px-3 md:px-5 bg-[#e74c3c] text-white border-none rounded-lg cursor-pointer font-semibold transition-colors duration-300 hover:bg-[#c0392b] text-xs md:text-sm" 
          onClick={() => setAdminMode(false)}
        >
          Logout
        </button>
      </div>

      {/* Mobile-Responsive Filter & Tabs Bar */}
      <div className="mb-6 bg-white p-4 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.05)] flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        
        {/* Tabs: Stacked vertically on tiny screens, side-by-side on sm+ */}
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full sm:w-auto py-2.5 px-4 rounded-lg font-semibold text-sm transition-all ${activeTab === 'dashboard' ? 'bg-[#667eea] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            📊 <span className="sm:hidden md:inline">Analytics</span> Overview
          </button>
          <button 
            onClick={() => setActiveTab('list')}
            className={`w-full sm:w-auto py-2.5 px-4 rounded-lg font-semibold text-sm transition-all ${activeTab === 'list' ? 'bg-[#667eea] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            📋 Manage <span className="sm:hidden md:inline">Appointments</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row items-center gap-3 w-full lg:w-auto">
          {activeTab === 'list' && (
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <input
                type="text"
                placeholder="🔍 Search..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full sm:w-auto md:w-48 p-2.5 border-2 border-[#e0e0e0] rounded-lg text-sm transition-colors duration-300 focus:outline-none focus:border-[#667eea]"
              />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto md:w-40 p-2.5 border-2 border-[#e0e0e0] rounded-lg text-sm transition-colors duration-300 focus:outline-none focus:border-[#667eea] bg-white cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="queued">Queued</option>
                <option value="in-progress">In-Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          )}

          <div className="relative w-full sm:w-auto md:w-48">
            <input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="w-full p-2.5 border-2 border-[#e0e0e0] rounded-lg text-sm transition-colors duration-300 focus:outline-none focus:border-[#667eea] text-gray-700 bg-white"
            />
            {dateFilter && (
              <button 
                onClick={() => setDateFilter('')}
                className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 bg-transparent border-none cursor-pointer"
                title="Clear date filter"
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