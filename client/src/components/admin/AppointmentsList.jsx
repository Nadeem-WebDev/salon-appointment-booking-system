import React, { useState, useEffect } from 'react';
import { PlusCircle, X } from 'lucide-react';

const badgeColors = {
  'queued': 'bg-[#96E072]/30 text-[#134611] border border-[#96E072]/50',
  'in-progress': 'bg-[#3DA35D]/30 text-[#134611] border border-[#3DA35D]/50',
  'completed': 'bg-[#3E8914]/30 text-[#134611] border border-[#3E8914]/50',
  'cancelled': 'bg-red-500/20 text-red-800 border border-red-500/30'
};

export default function AppointmentsList({ bookings, apiBase, onRefresh, filters, token, role }) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // NEW: Manual Booking Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ customer_name: '', phone: '', email: 'walkin@salon.local', service_id: '', staff_id: '', appointment_time: '' });

  // NEW: Dynamic Data for Dropdowns
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    // Fetch live services and staff for the dropdowns
    fetch(`${apiBase}/bookings/services`).then(r => r.json()).then(setServices);
    fetch(`${apiBase}/bookings/staff`).then(r => r.json()).then(setStaff);
  }, [apiBase]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters?.searchTerm, filters?.statusFilter, filters?.dateFilter]);

  const totalPages = Math.max(1, Math.ceil(bookings.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const currentBookings = bookings.slice(startIndex, startIndex + itemsPerPage);

  const showToast = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${dateStr} • ${timeStr}`;
  };

  const formatForInput = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  // --- NEW: Handle Walk-in Booking Submission ---
  async function handleAddSubmit(e) {
    e.preventDefault();
    try {
      const res = await fetch(`${apiBase}/bookings`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          ...addForm,
          appointment_time: new Date(addForm.appointment_time).toISOString()
        })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to add appointment');
      
      showToast('Walk-in appointment added successfully!');
      setShowAddForm(false);
      setAddForm({ customer_name: '', phone: '', email: 'walkin@salon.local', service_id: '', staff_id: '', appointment_time: '' });
      onRefresh();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleSaveEdit() {
    try {
      const res = await fetch(`${apiBase}/bookings/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(editForm)
      });
      
      if (!res.ok) throw new Error('Failed to update');
      
      // --- NEW: Smart Toast Notifications ---
      if (editForm.status === 'completed') {
        // If they have a real email, confirm the invoice dispatch
        if (editForm.email && editForm.email !== 'walkin@salon.local') {
          showToast(`✓ Booking completed! Invoice sent to ${editForm.email}`);
        } else {
          // If it's a walk-in, just confirm the closure
          showToast('✓ Walk-in appointment completed and closed!');
        }
      } else {
        // Fallback for other status changes (queued, in-progress, etc.)
        showToast('Booking updated successfully');
      }

      setEditingId(null);
      onRefresh();
    } catch (err) {
      showToast('Error updating booking', 'error');
    }
  }

  
  async function handleDelete(id) {
    if (window.confirm('Delete this booking?')) {
      try {
        const res = await fetch(`${apiBase}/bookings/${id}`, { 
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to delete');
        showToast('Booking deleted');
        onRefresh();
      } catch (err) {
        showToast('Error deleting booking', 'error');
      }
    }
  }

  const inputClass = "py-2 px-3 border border-[#3DA35D] rounded-lg text-sm bg-white/90 text-[#134611] font-bold outline-none focus:ring-2 focus:ring-[#96E072] w-full";

  return (
    <div className="animate-slideIn">
      {message.text && (
        <div className={`p-4 rounded-xl font-bold text-[14px] mb-4 animate-slideIn border-l-4 ${message.type === 'error' ? 'bg-red-100 text-red-700 border-red-500' : 'bg-[#96E072]/30 text-[#134611] border-[#3E8914]'}`}>
          {message.text}
        </div>
      )}

      {/* --- NEW: Walk-in Booking Section --- */}
      <div className="mb-6">
        {!showAddForm ? (
          <button 
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 bg-[#134611] text-[#E8FCCF] py-2.5 px-5 rounded-xl font-bold hover:bg-[#3E8914] transition-all border-none cursor-pointer shadow-sm"
          >
            <PlusCircle size={18} /> Walk-in / Phone Booking
          </button>
        ) : (
          <div className="bg-white/60 backdrop-blur-xl border border-[#3DA35D]/30 p-5 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#3DA35D]/20">
              <h3 className="font-black text-[#134611] m-0 flex items-center gap-2"><PlusCircle size={18} /> New Appointment</h3>
              <button onClick={() => setShowAddForm(false)} className="text-[#3DA35D] hover:text-red-500 bg-transparent border-none cursor-pointer p-1"><X size={20}/></button>
            </div>
            <form onSubmit={handleAddSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-[11px] font-bold text-[#3E8914] uppercase">Customer Name *</label>
                <input type="text" required value={addForm.customer_name} onChange={e => setAddForm({...addForm, customer_name: e.target.value})} className={inputClass} />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#3E8914] uppercase">Phone *</label>
                <input type="tel" required value={addForm.phone} onChange={e => setAddForm({...addForm, phone: e.target.value})} className={inputClass} />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#3E8914] uppercase">Date & Time *</label>
                <input type="datetime-local" required value={addForm.appointment_time} onChange={e => setAddForm({...addForm, appointment_time: e.target.value})} className={inputClass} />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#3E8914] uppercase">Service *</label>
                <select required value={addForm.service_id} onChange={e => setAddForm({...addForm, service_id: e.target.value})} className={inputClass}>
                  <option value="" disabled>Select Service</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#3E8914] uppercase">Stylist *</label>
                <select required value={addForm.staff_id} onChange={e => setAddForm({...addForm, staff_id: e.target.value})} className={inputClass}>
                  <option value="" disabled>Select Stylist</option>
                  {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="flex items-end">
                <button type="submit" className="w-full bg-[#3E8914] text-[#E8FCCF] py-2.5 rounded-lg font-bold border-none hover:bg-[#134611] transition-colors cursor-pointer shadow-sm">Save Booking</button>
              </div>
            </form>
          </div>
        )}
      </div>

      <div className="mb-3 px-1 text-sm text-[#134611]/70 font-bold">
        Showing {bookings.length} results
      </div>

      {/* --- MOBILE CARD VIEW --- */}
      <div className="grid grid-cols-1 gap-4 lg:hidden">
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
                    value={editForm.service_id}
                    onChange={e => setEditForm({ ...editForm, service_id: e.target.value })}
                  >
                    {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                ) : (
                  <p className="font-bold m-0 truncate">{booking.service}</p>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-[#3E8914] font-bold uppercase tracking-wider m-0 mb-1">Stylist</p>
                {editingId === booking.id ? (
                  <select
                    className="w-full py-1 px-2 border border-[#3DA35D] rounded-lg text-xs bg-white/90 text-[#134611] font-bold outline-none focus:ring-2 focus:ring-[#96E072]"
                    value={editForm.staff_id}
                    onChange={e => setEditForm({ ...editForm, staff_id: e.target.value })}
                  >
                    {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                ) : (
                  <p className="font-bold m-0 truncate">{booking.staff_name || '-'}</p>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-[#3E8914] font-bold uppercase tracking-wider m-0 mb-1">Phone</p>
                {editingId === booking.id ? (
                  <input
                    type="tel"
                    className="w-full py-1 px-2 border border-[#3DA35D] rounded-lg text-xs bg-white/90 text-[#134611] font-bold outline-none focus:ring-2 focus:ring-[#96E072]"
                    value={editForm.phone || ''}
                    onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                  />
                ) : (
                  <p className="font-bold m-0 truncate">{booking.phone || '-'}</p>
                )}
              </div>
              <div className="min-w-0">
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
                  {role === 'admin' && (
                    <button className="flex-1 py-2.5 rounded-xl font-bold text-white bg-red-500/90 border-none shadow-sm cursor-pointer hover:bg-red-600 transition-colors" onClick={() => handleDelete(booking.id)}>Delete</button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* --- DESKTOP TABLE VIEW --- */}
      <div className="hidden lg:block bg-white/50 backdrop-blur-xl border border-white/60 rounded-2xl shadow-[0_8px_32px_rgba(19,70,17,0.06)] overflow-hidden overflow-x-auto">
        <table className="w-full border-collapse min-w-[1000px]">
          <thead className="bg-[#134611] text-[#E8FCCF]">
            <tr>
              <th className="p-4 text-left font-bold text-sm tracking-wide rounded-tl-2xl">ID</th>
              <th className="p-4 text-left font-bold text-sm tracking-wide">Customer</th>
              <th className="p-4 text-left font-bold text-sm tracking-wide">Email</th>
              <th className="p-4 text-left font-bold text-sm tracking-wide">Phone</th>
              <th className="p-4 text-left font-bold text-sm tracking-wide">Service</th>
              <th className="p-4 text-left font-bold text-sm tracking-wide">Stylist</th>
              <th className="p-4 text-left font-bold text-sm tracking-wide">Appointment Time</th>
              <th className="p-4 text-left font-bold text-sm tracking-wide">Status</th>
              <th className="p-4 text-left font-bold text-sm tracking-wide rounded-tr-2xl">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#3DA35D]/20">
            {currentBookings.length === 0 && (
              <tr><td colSpan="9" className="p-8 text-center text-[#134611]/60 font-bold">No appointments found.</td></tr>
            )}
            {currentBookings.map(booking => (
              <tr key={booking.id} className="transition-colors duration-200 hover:bg-white/40">
                <td className="p-4 text-sm text-[#3E8914] font-black align-middle">{booking.id}</td>
                <td className="p-4 text-sm font-black text-[#134611] align-middle">{booking.customer_name}</td>
                <td className="p-4 text-sm font-bold text-[#3DA35D] align-middle">{booking.email}</td>
                <td className="p-4 text-sm font-bold text-[#3DA35D] align-middle">
                  {editingId === booking.id ? (
                    <input
                      type="tel"
                      className="py-1.5 px-2 border border-[#3DA35D] rounded-lg text-sm bg-white/90 text-[#134611] font-bold outline-none focus:ring-2 focus:ring-[#96E072] w-28"
                      value={editForm.phone || ''}
                      onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                    />
                  ) : (
                    booking.phone || '-'
                  )}
                </td>
                
                <td className="p-4 text-sm align-middle">
                  {editingId === booking.id ? (
                    <select
                      className="py-1.5 px-2 border border-[#3DA35D] rounded-lg text-sm bg-white/90 text-[#134611] font-bold outline-none focus:ring-2 focus:ring-[#96E072] min-w-[130px]"
                      value={editForm.service_id}
                      onChange={e => setEditForm({ ...editForm, service_id: e.target.value })}
                    >
                      {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  ) : (
                    <span className="font-bold text-[#134611] bg-[#96E072]/20 rounded-lg inline-block px-3 py-1 border border-[#96E072]/40 whitespace-nowrap">{booking.service}</span>
                  )}
                </td>

                <td className="p-4 text-sm font-bold text-[#134611] align-middle">
                  {editingId === booking.id ? (
                    <select
                      className="py-1.5 px-2 border border-[#3DA35D] rounded-lg text-sm bg-white/90 text-[#134611] font-bold outline-none focus:ring-2 focus:ring-[#96E072]"
                      value={editForm.staff_id}
                      onChange={e => setEditForm({ ...editForm, staff_id: e.target.value })}
                    >
                      {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  ) : (
                    <span className="font-bold text-[#3E8914] flex items-center gap-1.5 whitespace-nowrap">
                       {booking.staff_name || '-'}
                    </span>
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
                    <div>{formatDateTime(booking.appointment_time)}</div>
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
                      {role === 'admin' && (
                        <button className="py-2 px-4 rounded-xl font-bold text-white bg-red-500/90 hover:bg-red-600 transition-colors border-none cursor-pointer" onClick={() => handleDelete(booking.id)}>Delete</button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- PAGINATION --- */}
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