import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const SERVICE_PRICES = {
  'Haircut': 300,
  'Hair Color': 1500,
  'Styling': 800,
  'Treatment': 1200,
  'Beard Trim': 200
};

const COLORS = ['#134611', '#3E8914', '#3DA35D', '#96E072', '#E8FCCF'];

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

  const serviceCounts = bookings.reduce((acc, b) => {
    acc[b.service] = (acc[b.service] || 0) + 1;
    return acc;
  }, {});
  const serviceData = Object.keys(serviceCounts).map(key => ({ name: key, value: serviceCounts[key] }));

  const statusData = [
    { name: 'Queued', count: bookings.filter(b => b.status === 'queued').length },
    { name: 'In Progress', count: bookings.filter(b => b.status === 'in-progress').length },
    { name: 'Completed', count: completedAppointments },
    { name: 'Cancelled', count: cancelledAppointments },
  ];

  return (
    <div className="animate-slideIn">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl shadow-lg border border-[#BB9457]/30 border-l-[6px] border-l-[#432818] transition-transform hover:-translate-y-1">
          <h4 className="text-[#99582A] text-sm font-bold uppercase m-0 truncate">Total Bookings</h4>
          <p className="text-3xl font-black text-[#432818] mt-2 mb-0 truncate">{totalAppointments}</p>
        </div>
        <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl shadow-lg border border-[#BB9457]/30 border-l-[6px] border-l-[#BB9457] transition-transform hover:-translate-y-1">
          <h4 className="text-[#99582A] text-sm font-bold uppercase m-0 truncate">Completed</h4>
          <p className="text-3xl font-black text-[#432818] mt-2 mb-0 truncate">{completedAppointments}</p>
        </div>
        <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl shadow-lg border border-[#BB9457]/30 border-l-[6px] border-l-[#99582A] transition-transform hover:-translate-y-1">
          <h4 className="text-[#99582A] text-sm font-bold uppercase m-0 truncate">Est. Revenue</h4>
          <p className="text-3xl font-black text-[#432818] mt-2 mb-0 truncate">₹{estimatedRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl shadow-lg border border-[#BB9457]/30 border-l-[6px] border-l-[#6F1D1B] transition-transform hover:-translate-y-1">
          <h4 className="text-[#99582A] text-sm font-bold uppercase m-0 truncate">Cancelled</h4>
          <p className="text-3xl font-black text-[#432818] mt-2 mb-0 truncate">{cancelledAppointments}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/80 backdrop-blur-md p-4 md:p-6 rounded-2xl shadow-lg border border-[#BB9457]/30 min-w-0 overflow-hidden w-full">
          <h3 className="text-lg font-black text-[#432818] mb-4 m-0 truncate">Service Popularity</h3>
          {serviceData.length > 0 ? (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={serviceData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none">
                    {serviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value) => [`${value} bookings`, 'Count']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(67,40,24,0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontWeight: 'bold', color: '#432818' }}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-[#99582A] font-bold">No data for selected date</div>
          )}
        </div>

        <div className="bg-white/80 backdrop-blur-md p-4 md:p-6 rounded-2xl shadow-lg border border-[#BB9457]/30 min-w-0 overflow-hidden w-full">
          <h3 className="text-lg font-black text-[#432818] mb-4 m-0 truncate">Appointment Status Flow</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} margin={{ top: 20, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3DA35D" strokeOpacity={0.3} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} interval={0} angle={-35} textAnchor="end" tick={{ fontSize: 12, fill: '#3E8914', fontWeight: 'bold' }} height={50} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#3E8914', fontWeight: 'bold' }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={45}>
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={
                        entry.name === 'Queued' ? '#96E072' :
                        entry.name === 'In Progress' ? '#3DA35D' :
                        entry.name === 'Completed' ? '#3E8914' : '#ef4444'
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