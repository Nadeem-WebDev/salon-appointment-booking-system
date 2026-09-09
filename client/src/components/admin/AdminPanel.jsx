import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ListTodo, Settings, Users, Scissors, UsersRound,
} from 'lucide-react';

import SettingsPanel from './SettingsPanel.jsx';
import AdminLogin from './AdminLogin.jsx';
import AnalyticsDashboard from './AnalyticsDashboard.jsx';
import AppointmentsList from './AppointmentsList.jsx';
import StaffManagement from './StaffManagement.jsx';
import ServicesManagement from './ServicesManagement.jsx';
import Customers from './Customers.jsx';
import Sidebar from './layout/Sidebar.jsx';
import Topbar from './layout/Topbar.jsx';

const PAGE_TITLES = {
  '/admin/dashboard': 'Analytics',
  '/admin/appointments': 'Appointments',
  '/admin/settings': 'Work hours',
  '/admin/staff': 'Team',
  '/admin/services': 'Services',
  '/admin/customers': 'Clients',
};

export default function AdminPanel({ apiBase }) {
  const [token, setToken] = useState(sessionStorage.getItem('salonAdminToken') || null);
  const [role, setRole] = useState(sessionStorage.getItem('salonAdminRole') || 'admin');
  const [bookings, setBookings] = useState([]);
  const [navOpen, setNavOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const getTodayString = () => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${today.getFullYear()}-${month}-${day}`;
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState(getTodayString());

  const loadBookings = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${apiBase}/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401 || res.status === 403) {
        handleLogout();
        return;
      }

      setBookings(await res.json());
    } catch (err) {
      console.error('Failed to load bookings:', err);
    }
  };

  useEffect(() => {
    if (token) {
      loadBookings();
      const interval = setInterval(loadBookings, 5000);
      return () => clearInterval(interval);
    }
  }, [token]);

  // Close the mobile drawer whenever the route changes
  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  const handleLoginSuccess = (receivedToken, receivedRole) => {
    setToken(receivedToken);
    setRole(receivedRole || 'admin');

    sessionStorage.setItem('salonAdminToken', receivedToken);
    sessionStorage.setItem('salonAdminRole', receivedRole || 'admin');

    navigate(receivedRole === 'staff' ? '/admin/appointments' : '/admin/dashboard');
  };

  const handleLogout = () => {
    setToken(null);
    setRole(null);
    sessionStorage.removeItem('salonAdminToken');
    sessionStorage.removeItem('salonAdminRole');
    navigate('/');
  };

  if (!token) {
    return <AdminLogin apiBase={apiBase} onLoginSuccess={handleLoginSuccess} onBack={() => navigate('/')} />;
  }

  const filteredBookings = bookings.filter((booking) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      booking.customer_name?.toLowerCase().includes(searchLower) ||
      booking.email?.toLowerCase().includes(searchLower) ||
      booking.phone?.includes(searchTerm);

    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;

    let matchesDate = true;
    if (dateFilter) {
      const bookingDate = new Date(booking.appointment_time);
      const month = String(bookingDate.getMonth() + 1).padStart(2, '0');
      const day = String(bookingDate.getDate()).padStart(2, '0');
      matchesDate = `${bookingDate.getFullYear()}-${month}-${day}` === dateFilter;
    }
    return matchesSearch && matchesStatus && matchesDate;
  });

  const isAppointmentsPage = location.pathname.includes('/admin/appointments');

  // RBAC: staff only ever see the appointments group
  const navGroups = [
    {
      label: 'Operations',
      items: [
        ...(role === 'admin'
          ? [{ to: '/admin/dashboard', icon: LayoutDashboard, label: 'Analytics' }]
          : []),
        { to: '/admin/appointments', icon: ListTodo, label: 'Appointments' },
      ],
    },
    ...(role === 'admin'
      ? [
          {
            label: 'Manage',
            items: [
              { to: '/admin/services', icon: Scissors, label: 'Services' },
              { to: '/admin/staff', icon: Users, label: 'Team' },
              { to: '/admin/customers', icon: UsersRound, label: 'Clients' },
              { to: '/admin/settings', icon: Settings, label: 'Work hours' },
            ],
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen">
      <Sidebar
        groups={navGroups}
        role={role}
        open={navOpen}
        onClose={() => setNavOpen(false)}
        onLogout={handleLogout}
        onBackToSite={() => navigate('/')}
      />

      <div className="lg:pl-[17rem] min-h-screen flex flex-col">
        <Topbar
          title={PAGE_TITLES[location.pathname] || 'Admin'}
          onOpenNav={() => setNavOpen(true)}
          showRecordFilters={isAppointmentsPage}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          dateFilter={dateFilter}
          onDateChange={setDateFilter}
        />

        <main className="flex-1 px-4 md:px-6 lg:px-8 py-6 md:py-8 max-w-[100rem] w-full mx-auto">
          <Routes>
            {role === 'admin' && (
              <Route path="dashboard" element={<AnalyticsDashboard bookings={filteredBookings} />} />
            )}

            <Route
              path="appointments"
              element={
                <AppointmentsList
                  bookings={filteredBookings}
                  apiBase={apiBase}
                  onRefresh={loadBookings}
                  filters={{ searchTerm, statusFilter, dateFilter }}
                  token={token}
                  role={role}
                />
              }
            />

            {role === 'admin' && (
              <>
                <Route path="settings" element={<SettingsPanel apiBase={apiBase} token={token} />} />
                <Route path="staff" element={<StaffManagement apiBase={apiBase} token={token} />} />
                <Route path="services" element={<ServicesManagement apiBase={apiBase} token={token} />} />
                <Route path="customers" element={<Customers apiBase={apiBase} token={token} />} />
              </>
            )}

            <Route
              path="*"
              element={<Navigate to={role === 'admin' ? 'dashboard' : 'appointments'} replace />}
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}
