import React, { useState, useEffect } from 'react';
import { Settings, CalendarX, Clock, Trash2 } from 'lucide-react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function SettingsPanel({ apiBase, token }) {
  const [hours, setHours] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);
  const [newBlockDate, setNewBlockDate] = useState('');
  const [newBlockReason, setNewBlockReason] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [hoursRes, blockedRes] = await Promise.all([
        fetch(`${apiBase}/bookings/settings/hours`),
        fetch(`${apiBase}/bookings/settings/blocked-dates`)
      ]);
      setHours(await hoursRes.json());
      setBlockedDates(await blockedRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const handleUpdateHours = async (dayData) => {
    try {
      const res = await fetch(`${apiBase}/bookings/settings/hours`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(dayData)
      });
      if (res.ok) {
        showMessage('Hours updated successfully');
        fetchData();
      } else {
        showMessage('Failed to update hours', 'error');
      }
    } catch (err) {
      showMessage('Error connecting to server', 'error');
    }
  };

  const handleAddBlockedDate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiBase}/bookings/settings/blocked-dates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ blocked_date: newBlockDate, reason: newBlockReason })
      });
      if (res.ok) {
        showMessage('Date blocked successfully');
        setNewBlockDate('');
        setNewBlockReason('');
        fetchData();
      } else {
        const data = await res.json();
        showMessage(data.error || 'Failed to block date', 'error');
      }
    } catch (err) {
      showMessage('Error connecting to server', 'error');
    }
  };

  const handleDeleteBlockedDate = async (id) => {
    try {
      const res = await fetch(`${apiBase}/bookings/settings/blocked-dates/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showMessage('Date unblocked');
        fetchData();
      }
    } catch (err) {
      showMessage('Error connecting to server', 'error');
    }
  };

  const inputClass = "p-2 bg-white/70 border border-[#3DA35D]/50 rounded-lg text-sm text-[#134611] font-bold focus:outline-none focus:ring-2 focus:ring-[#96E072]";

  return (
    <div className="animate-slideIn grid grid-cols-1 lg:grid-cols-2 gap-8">
      
      {/* Toast Message */}
      {message.text && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl font-bold shadow-xl backdrop-blur-md border ${message.type === 'error' ? 'bg-red-100 text-red-700 border-red-500' : 'bg-[#96E072]/90 text-[#134611] border-[#3E8914]'}`}>
          {message.text}
        </div>
      )}

      {/* Operating Hours Panel */}
      <div className="bg-white/50 backdrop-blur-xl border border-white/60 p-6 md:p-8 rounded-3xl shadow-[0_8px_32px_rgba(19,70,17,0.06)]">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#3DA35D]/20">
          <div className="p-2.5 bg-[#134611] text-[#E8FCCF] rounded-xl shadow-inner"><Clock size={20} /></div>
          <h3 className="text-[#134611] text-xl font-black m-0">Weekly Operating Hours</h3>
        </div>

        <div className="flex flex-col gap-4">
          {hours.map(day => (
            <div key={day.day_of_week} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white/60 border border-[#3DA35D]/30 rounded-2xl hover:border-[#3E8914] transition-colors">
              <div className="flex items-center gap-3 w-32">
                <input 
                  type="checkbox" 
                  checked={!day.is_closed} 
                  onChange={(e) => handleUpdateHours({ ...day, is_closed: !e.target.checked })}
                  className="w-5 h-5 accent-[#3E8914] cursor-pointer"
                />
                <span className={`font-bold ${day.is_closed ? 'text-[#3DA35D] line-through' : 'text-[#134611]'}`}>{DAYS[day.day_of_week]}</span>
              </div>
              
              {!day.is_closed ? (
                <div className="flex items-center gap-2">
                  <input type="time" value={day.open_time} onChange={(e) => handleUpdateHours({ ...day, open_time: e.target.value })} className={inputClass} />
                  <span className="text-[#3DA35D] font-bold">to</span>
                  <input type="time" value={day.close_time} onChange={(e) => handleUpdateHours({ ...day, close_time: e.target.value })} className={inputClass} />
                </div>
              ) : (
                <span className="text-red-500 font-bold bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 text-sm">Closed</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Blocked Dates Panel */}
      <div className="bg-white/50 backdrop-blur-xl border border-white/60 p-6 md:p-8 rounded-3xl shadow-[0_8px_32px_rgba(19,70,17,0.06)] flex flex-col">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#3DA35D]/20">
          <div className="p-2.5 bg-[#3E8914] text-[#E8FCCF] rounded-xl shadow-inner"><CalendarX size={20} /></div>
          <h3 className="text-[#134611] text-xl font-black m-0">Holidays & Closures</h3>
        </div>

        <form onSubmit={handleAddBlockedDate} className="flex flex-col sm:flex-row gap-3 mb-6 bg-white/60 p-4 rounded-2xl border border-[#3DA35D]/30">
          <input type="date" required value={newBlockDate} onChange={e => setNewBlockDate(e.target.value)} className={`${inputClass} flex-1`} />
          <input type="text" placeholder="Reason (e.g. Christmas)" required value={newBlockReason} onChange={e => setNewBlockReason(e.target.value)} className={`${inputClass} flex-1`} />
          <button type="submit" className="py-2 px-4 bg-[#134611] hover:bg-[#3E8914] text-[#E8FCCF] rounded-lg font-bold transition-colors">Block</button>
        </form>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-3">
          {blockedDates.length === 0 ? (
            <div className="text-center py-8 text-[#3DA35D] font-bold">No upcoming closures configured.</div>
          ) : (
            blockedDates.map(date => (
              <div key={date.id} className="flex items-center justify-between p-4 bg-white/70 border border-[#3DA35D]/30 rounded-xl">
                <div>
                  <p className="font-black text-[#134611] m-0">{new Date(date.blocked_date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  <p className="text-xs text-[#3E8914] font-bold mt-1 m-0">Reason: {date.reason}</p>
                </div>
                <button onClick={() => handleDeleteBlockedDate(date.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Remove closure">
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}