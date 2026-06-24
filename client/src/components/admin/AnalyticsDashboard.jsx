import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const SERVICE_PRICES = {
  'Haircut': 50,
  'Hair Color': 150,
  'Styling': 80,
  'Treatment': 500,
  'Beard Trim': 50
};

const COLORS = ['#667eea', '#764ba2', '#4facfe', '#00f2fe', '#f093fb'];

export default function AnalyticsDashboard({ bookings }) {
  const totalAppointments = bookings.length;
  const completedAppointments = bookings.filter(b => b.status === 'completed').length;
  const cancelledAppointments = bookings.filter(b => b.status === 'cancelled').length;
  
  const estimatedRevenue = bookings.reduce((sum, b) => {
    if (b.status !== 'cancelled') {
      return sum + (SERVICE_PRICES[b.service] || 0);
    }
    return sum;
  }, 0);

  // Pie Chart Data
  const serviceCounts = bookings.reduce((acc, b) => {
    acc[b.service] = (acc[b.service] || 0) + 1;
    return acc;
  }, {});
  const serviceData = Object.keys(serviceCounts).map(key => ({ name: key, value: serviceCounts[key] }));

  // Bar Chart Data
  const statusData = [
    { name: 'Queued', count: bookings.filter(b => b.status === 'queued').length },
    { name: 'In Progress', count: bookings.filter(b => b.status === 'in-progress').length },
    { name: 'Completed', count: completedAppointments },
    { name: 'Cancelled', count: cancelledAppointments },
  ];

  return (
    <div className="animate-slideIn">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] border-l-4 border-[#667eea] hover:-translate-y-1 transition-transform">
          <h4 className="text-gray-500 text-sm font-bold uppercase m-0 truncate">Total Bookings</h4>
          <p className="text-3xl font-black text-[#333] mt-2 mb-0 truncate">{totalAppointments}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] border-l-4 border-[#28a745] hover:-translate-y-1 transition-transform">
          <h4 className="text-gray-500 text-sm font-bold uppercase m-0 truncate">Completed</h4>
          <p className="text-3xl font-black text-[#333] mt-2 mb-0 truncate">{completedAppointments}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] border-l-4 border-[#ffc107] hover:-translate-y-1 transition-transform">
          <h4 className="text-gray-500 text-sm font-bold uppercase m-0 truncate">Est. Revenue</h4>
          <p className="text-3xl font-black text-[#333] mt-2 mb-0 truncate">₹{estimatedRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] border-l-4 border-[#dc3545] hover:-translate-y-1 transition-transform">
          <h4 className="text-gray-500 text-sm font-bold uppercase m-0 truncate">Cancelled</h4>
          <p className="text-3xl font-black text-[#333] mt-2 mb-0 truncate">{cancelledAppointments}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ADDED: min-w-0 and overflow-hidden to prevent Recharts blowout */}
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] min-w-0 overflow-hidden w-full">
          <h3 className="text-lg font-bold text-[#333] mb-4 m-0 truncate">Service Popularity</h3>
          {serviceData.length > 0 ? (
            <div className="h-75 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={serviceData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                    {serviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value) => [`${value} bookings`, 'Count']} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-75 flex items-center justify-center text-gray-400">No data for selected date</div>
          )}
        </div>

        {/* ADDED: min-w-0 and overflow-hidden to prevent Recharts blowout */}
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] min-w-0 overflow-hidden w-full">
          <h3 className="text-lg font-bold text-[#333] mb-4 m-0 truncate">Appointment Status Flow</h3>
          <div className="h-75 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <RechartsTooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="count" fill="#667eea" radius={[4, 4, 0, 0]} barSize={40}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={
                      entry.name === 'Queued' ? '#ffc107' :
                      entry.name === 'In Progress' ? '#17a2b8' :
                      entry.name === 'Completed' ? '#28a745' : '#dc3545'
                    } />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}