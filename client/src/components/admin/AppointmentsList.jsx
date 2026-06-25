import React, { useState, useEffect } from 'react';

const badgeColors = {
  'queued': 'bg-[#96E072]/30 text-[#134611] border border-[#96E072]/50',
  'in-progress': 'bg-[#3DA35D]/30 text-[#134611] border border-[#3DA35D]/50',
  'completed': 'bg-[#3E8914]/30 text-[#134611] border border-[#3E8914]/50',
  'cancelled': 'bg-red-500/20 text-red-800 border border-red-500/30'
};

export default function AppointmentsList({ bookings, apiBase, onRefresh, filters }) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [message, setMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [filters?.searchTerm, filters?.statusFilter, filters?.dateFilter]);

  const totalPages = Math.max(1, Math.ceil(bookings.length / itemsPerPage));
  
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const currentBookings = bookings.slice(startIndex, startIndex + itemsPerPage);

  const formatDateTime = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${dateStr} • ${timeStr}`;
  };

  // Helper to format ISO string for <input type="datetime-local">
  const formatForInput = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  async function handleSaveEdit() {
    try {
      const res = await fetch(`${apiBase}/bookings/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (!res.ok) throw new Error('Failed to update');
      setMessage('Booking updated successfully');
      setEditingId(null);
      onRefresh();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setMessage('Error updating booking');
    }
  }

  async function handleDelete(id) {
    if (window.confirm('Delete this booking?')) {
      try {
        const res = await fetch(`${apiBase}/bookings/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete');
        setMessage('Booking deleted');
        onRefresh();
        setTimeout(() => setMessage(''), 3000);
      } catch (err) {
        console.error(err);
        setMessage('Error deleting booking');
      }
    }
  }

  return (
    <div className="animate-slideIn">
      {message && <div className="bg-[#96E072]/30 text-[#134611] py-3 px-4 rounded-xl mb-4 border border-[#3E8914]/30 font-bold text-sm md:text-base backdrop-blur-md">{message}</div>}

      <div className="mb-3 px-1 text-sm text-[#134611]/70 font-bold">
        Showing {bookings.length} results
      </div>

      {/* --- MOBILE CARD VIEW --- */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {currentBookings.length === 0 && (
          <div className="text-center py-8 text-[#134611]/60 bg-white/40 backdrop-blur-xl border border-white/60 rounded-2xl shadow-[0_4px_20px_rgba(19,70,17,0.05)] font-bold">No appointments found.</div>
        )}
        {currentBookings.map(booking => (
          <div key={booking.id} className="bg-white/50 backdrop-blur-xl p-5 rounded-2xl shadow-[0_4px_20px_rgba(19,70,17,0.05)] flex flex-col gap-4 border border-[#3DA35D]/30 min-w-0">
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0 flex-1">
                <span className="text-xs text-[#3E8914] font-black uppercase tracking-wider">ID: {booking.id}</span>
                <h3 className="font-black text-[#134611] text-lg m-0 truncate mt-1">{booking.customer_name}</h3>
                <p className="text-xs text-[#3DA35D] font-bold mt-0.5 m-0 truncate">{booking.email}</p>
              </div>
              
              <div className="shrink-0">
                {editingId === booking.id ? (
                  <select
                    className="py-1.5 px-2 border border-[#3DA35D] rounded-lg text-xs bg-white/90 text-[#134611] font-bold outline-none focus:ring-2 focus:ring-[#96E072]"
                    value={editForm.status}
                    onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                  >
                    <option value="queued">Queued</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                ) : (
                  <span className={`inline-block py-1 px-3 rounded-lg font-black text-[10px] uppercase whitespace-nowrap ${badgeColors[booking.status]}`}>{booking.status}</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm text-[#134611] mt-1 bg-white/40 p-3 rounded-xl border border-white/50">
              <div className="min-w-0">
                <p className="text-[11px] text-[#3E8914] font-bold uppercase tracking-wider m-0 mb-1">Service</p>
                {editingId === booking.id ? (
                  <select
                    className="w-full py-1 px-2 border border-[#3DA35D] rounded-lg text-xs bg-white/90 text-[#134611] font-bold outline-none focus:ring-2 focus:ring-[#96E072]"
                    value={editForm.service}
                    onChange={e => setEditForm({ ...editForm, service: e.target.value })}
                  >
                    <option value="Haircut">Haircut</option>
                    <option value="Hair Color">Hair Color</option>
                    <option value="Styling">Styling</option>
                    <option value="Treatment">Hair Treatment</option>
                    <option value="Beard Trim">Beard Trim</option>
                  </select>
                ) : (
                  <p className="font-bold m-0 truncate">{booking.service}</p>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-[#3E8914] font-bold uppercase tracking-wider m-0 mb-1">Phone</p>
                <p className="font-bold m-0 truncate">{booking.phone || '-'}</p>
              </div>
              <div className="col-span-2 min-w-0">
                <p className="text-[11px] text-[#3E8914] font-bold uppercase tracking-wider m-0 mb-1">Time</p>
                {editingId === booking.id ? (
                  <input
                    type="datetime-local"
                    className="w-full py-1 px-2 border border-[#3DA35D] rounded-lg text-xs bg-white/90 text-[#134611] font-bold outline-none focus:ring-2 focus:ring-[#96E072]"
                    value={formatForInput(editForm.appointment_time)}
                    onChange={e => setEditForm({ ...editForm, appointment_time: new Date(e.target.value).toISOString() })}
                  />
                ) : (
                  <p className="font-bold m-0 truncate">{formatDateTime(booking.appointment_time)}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-1 pt-3 border-t border-[#3DA35D]/20">
              {editingId === booking.id ? (
                <>
                  <button className="flex-1 py-2.5 rounded-xl font-bold text-[#134611] bg-[#96E072] border-none shadow-sm cursor-pointer hover:bg-[#96E072]/80 transition-colors" onClick={() => setEditingId(null)}>Cancel</button>
                  <button className="flex-1 py-2.5 rounded-xl font-bold text-[#E8FCCF] bg-[#134611] border-none shadow-sm cursor-pointer hover:bg-[#134611]/90 transition-colors" onClick={handleSaveEdit}>Save</button>
                </>
              ) : (
                <>
                  <button className="flex-1 py-2.5 rounded-xl font-bold text-[#E8FCCF] bg-[#3E8914] border-none shadow-sm cursor-pointer hover:bg-[#3E8914]/90 transition-colors" onClick={() => { setEditingId(booking.id); setEditForm(booking); }}>Edit</button>
                  <button className="flex-1 py-2.5 rounded-xl font-bold text-white bg-red-500/90 border-none shadow-sm cursor-pointer hover:bg-red-600 transition-colors" onClick={() => handleDelete(booking.id)}>Delete</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* --- DESKTOP TABLE VIEW --- */}
      <div className="hidden md:block bg-white/50 backdrop-blur-xl border border-white/60 rounded-2xl shadow-[0_8px_32px_rgba(19,70,17,0.06)] overflow-hidden overflow-x-auto">
        <table className="w-full border-collapse min-w-250">
          <thead className="bg-[#134611] text-[#E8FCCF]">
            <tr>
              <th className="p-4 text-left font-bold text-sm tracking-wide">ID</th>
              <th className="p-4 text-left font-bold text-sm tracking-wide">Customer</th>
              <th className="p-4 text-left font-bold text-sm tracking-wide">Email</th>
              <th className="p-4 text-left font-bold text-sm tracking-wide">Phone</th>
              <th className="p-4 text-left font-bold text-sm tracking-wide">Service</th>
              <th className="p-4 text-left font-bold text-sm tracking-wide">Appointment Time</th>
              <th className="p-4 text-left font-bold text-sm tracking-wide">Status</th>
              <th className="p-4 text-left font-bold text-sm tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#3DA35D]/20">
            {currentBookings.length === 0 && (
              <tr><td colSpan="8" className="p-8 text-center text-[#134611]/60 font-bold">No appointments found.</td></tr>
            )}
            {currentBookings.map(booking => (
              <tr key={booking.id} className="transition-colors duration-200 hover:bg-white/40">
                <td className="p-4 text-sm text-[#3E8914] font-black align-middle">{booking.id}</td>
                <td className="p-4 text-sm font-black text-[#134611] align-middle">{booking.customer_name}</td>
                <td className="p-4 text-sm font-bold text-[#3DA35D] align-middle">{booking.email}</td>
                <td className="p-4 text-sm font-bold text-[#3DA35D] align-middle">{booking.phone || '-'}</td>
                
                <td className="p-4 text-sm align-middle">
                  {editingId === booking.id ? (
                    <select
                      className="py-1.5 px-2 border border-[#3DA35D] rounded-lg text-sm bg-white/90 text-[#134611] font-bold outline-none focus:ring-2 focus:ring-[#96E072] min-w-32.5"
                      value={editForm.service}
                      onChange={e => setEditForm({ ...editForm, service: e.target.value })}
                    >
                      <option value="Haircut">Haircut</option>
                      <option value="Hair Color">Hair Color</option>
                      <option value="Styling">Styling</option>
                      <option value="Treatment">Hair Treatment</option>
                      <option value="Beard Trim">Beard Trim</option>
                    </select>
                  ) : (
                    <span className="font-bold text-[#134611] bg-[#96E072]/20 rounded-lg inline-block px-3 py-1 border border-[#96E072]/40 whitespace-nowrap">{booking.service}</span>
                  )}
                </td>

                <td className="p-4 text-sm text-[#134611] font-bold whitespace-nowrap align-middle">
                  {editingId === booking.id ? (
                     <input
                      type="datetime-local"
                      className="py-1.5 px-2 border border-[#3DA35D] rounded-lg text-sm bg-white/90 text-[#134611] font-bold outline-none focus:ring-2 focus:ring-[#96E072]"
                      value={formatForInput(editForm.appointment_time)}
                      onChange={e => {
                        const newDate = new Date(e.target.value);
                        if (!isNaN(newDate.getTime())) {
                           setEditForm({ ...editForm, appointment_time: newDate.toISOString() })
                        }
                      }}
                    />
                  ) : (
                    formatDateTime(booking.appointment_time)
                  )}
                </td>

                <td className="p-4 text-sm align-middle">
                  {editingId === booking.id ? (
                    <select
                      className="py-1.5 px-3 border border-[#3DA35D] rounded-lg text-sm bg-white/90 text-[#134611] font-bold outline-none focus:ring-2 focus:ring-[#96E072]"
                      value={editForm.status}
                      onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                    >
                      <option value="queued">Queued</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  ) : (
                    <span className={`py-1.5 px-3 rounded-lg font-black text-[11px] uppercase whitespace-nowrap ${badgeColors[booking.status]}`}>{booking.status}</span>
                  )}
                </td>
                <td className="p-4 text-sm align-middle">
                  {editingId === booking.id ? (
                    <div className="flex gap-2">
                      <button className="py-2 px-4 rounded-xl font-bold text-[#E8FCCF] bg-[#134611] hover:shadow-lg transition-all border-none cursor-pointer" onClick={handleSaveEdit}>Save</button>
                      <button className="py-2 px-4 rounded-xl font-bold text-[#134611] bg-[#96E072] hover:shadow-lg transition-all border-none cursor-pointer" onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button className="py-2 px-4 rounded-xl font-bold text-[#E8FCCF] bg-[#3E8914] hover:bg-[#3DA35D] transition-colors border-none cursor-pointer" onClick={() => { setEditingId(booking.id); setEditForm(booking); }}>Edit</button>
                      <button className="py-2 px-4 rounded-xl font-bold text-white bg-red-500/90 hover:bg-red-600 transition-colors border-none cursor-pointer" onClick={() => handleDelete(booking.id)}>Delete</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- MOBILE PAGINATION FIX --- */}
      {bookings.length > itemsPerPage && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-6 bg-white/50 backdrop-blur-xl border border-white/60 p-4 rounded-2xl shadow-[0_4px_20px_rgba(19,70,17,0.05)]">
          <button
            disabled={safePage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
            className="w-full sm:w-auto py-2.5 px-5 rounded-xl font-bold text-sm bg-white/80 text-[#134611] border border-[#3DA35D]/30 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#96E072]/20 transition-colors cursor-pointer"
          >
            ← Previous
          </button>
          <span className="text-sm font-black text-[#3E8914] bg-white/80 py-2.5 px-5 rounded-xl border border-[#3DA35D]/30 w-full sm:w-auto text-center shadow-sm">
            Page {safePage} of {totalPages}
          </span>
          <button
            disabled={safePage === totalPages}
            onClick={() => setCurrentPage(prev => prev + 1)}
            className="w-full sm:w-auto py-2.5 px-5 rounded-xl font-bold text-sm bg-white/80 text-[#134611] border border-[#3DA35D]/30 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#96E072]/20 transition-colors cursor-pointer"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}