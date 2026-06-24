import React, { useState, useEffect } from 'react';

const badgeColors = {
  'queued': 'bg-[#fff3cd] text-[#856404]',
  'in-progress': 'bg-[#cce5ff] text-[#004085]',
  'completed': 'bg-[#d4edda] text-[#155724]',
  'cancelled': 'bg-[#f8d7da] text-[#721c24]'
};

export default function AppointmentsList({ bookings, apiBase, onRefresh }) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [message, setMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset page when bookings array changes (e.g., search/filter triggered in parent)
  useEffect(() => {
    setCurrentPage(1);
  }, [bookings]);

  const totalPages = Math.max(1, Math.ceil(bookings.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentBookings = bookings.slice(startIndex, startIndex + itemsPerPage);

  const formatDateTime = (isoString) => {
    const d = new Date(isoString);
    const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${dateStr} • ${timeStr}`;
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
      {message && <div className="bg-[#d4edda] text-[#155724] py-3 px-4 rounded-lg mb-4 border-l-4 border-[#28a745] font-medium text-sm md:text-base">{message}</div>}

      <div className="mb-3 px-1 text-sm text-gray-500 font-medium">
        Showing {bookings.length} results
      </div>

      {/* --- MOBILE CARD VIEW --- */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {currentBookings.length === 0 && (
          <div className="text-center py-8 text-gray-500 bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.1)]">No appointments found.</div>
        )}
        {currentBookings.map(booking => (
          <div key={booking.id} className="bg-white p-4 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.1)] flex flex-col gap-3 border-l-4 border-[#667eea]">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">ID: {booking.id}</span>
                <h3 className="font-bold text-[#333] text-lg m-0">{booking.customer_name}</h3>
                <p className="text-xs text-[#667eea] font-medium mt-0.5 m-0">{booking.email}</p>
              </div>
              
              {editingId === booking.id ? (
                <select
                  className="py-1 px-2 border-2 border-[#667eea] rounded-md text-xs bg-white"
                  value={editForm.status}
                  onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                >
                  <option value="queued">Queued</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              ) : (
                <span className={`py-1 px-2.5 rounded-full font-bold text-[10px] uppercase ${badgeColors[booking.status]}`}>{booking.status}</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mt-1">
              <div>
                <p className="text-xs text-gray-400 m-0">Service</p>
                <p className="font-medium m-0">{booking.service}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 m-0">Phone</p>
                <p className="font-medium m-0">{booking.phone || '-'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-400 m-0">Time</p>
                <p className="font-medium m-0">{formatDateTime(booking.appointment_time)}</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-gray-100">
              {editingId === booking.id ? (
                <>
                  <button className="flex-1 py-2 rounded-md font-semibold text-white bg-[#95a5a6]" onClick={() => setEditingId(null)}>Cancel</button>
                  <button className="flex-1 py-2 rounded-md font-semibold text-white bg-[#27ae60]" onClick={handleSaveEdit}>Save</button>
                </>
              ) : (
                <>
                  <button className="flex-1 py-2 rounded-md font-semibold text-white bg-[#3498db]" onClick={() => { setEditingId(booking.id); setEditForm(booking); }}>Edit</button>
                  <button className="flex-1 py-2 rounded-md font-semibold text-white bg-[#e74c3c]" onClick={() => handleDelete(booking.id)}>Delete</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* --- DESKTOP TABLE VIEW --- */}
      <div className="hidden md:block bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.1)] overflow-hidden overflow-x-auto">
        <table className="w-full border-collapse min-w-250">
          <thead className="bg-linear-to-br from-[#667eea] to-[#764ba2] text-white">
            <tr>
              <th className="p-4 text-left font-semibold text-sm">ID</th>
              <th className="p-4 text-left font-semibold text-sm">Customer</th>
              <th className="p-4 text-left font-semibold text-sm">Email</th>
              <th className="p-4 text-left font-semibold text-sm">Phone</th>
              <th className="p-4 text-left font-semibold text-sm">Service</th>
              <th className="p-4 text-left font-semibold text-sm">Appointment Time</th>
              <th className="p-4 text-left font-semibold text-sm">Status</th>
              <th className="p-4 text-left font-semibold text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentBookings.length === 0 && (
              <tr><td colSpan="8" className="p-8 text-center text-gray-500">No appointments found.</td></tr>
            )}
            {currentBookings.map(booking => (
              <tr key={booking.id} className="transition-colors duration-200 hover:bg-[#f8f9fa]">
                <td className="p-4 border-b border-[#e0e0e0] text-sm">{booking.id}</td>
                <td className="p-4 border-b border-[#e0e0e0] text-sm font-medium">{booking.customer_name}</td>
                <td className="p-4 border-b border-[#e0e0e0] text-sm text-gray-600">{booking.email}</td>
                <td className="p-4 border-b border-[#e0e0e0] text-sm text-gray-600">{booking.phone || '-'}</td>
                <td className="p-4 border-b border-[#e0e0e0] text-sm">{booking.service}</td>
                <td className="p-4 border-b border-[#e0e0e0] text-sm text-gray-600 font-medium whitespace-nowrap">{formatDateTime(booking.appointment_time)}</td>
                <td className="p-4 border-b border-[#e0e0e0] text-sm">
                  {editingId === booking.id ? (
                    <select
                      className="py-1.5 px-2 border-2 border-[#667eea] rounded-md text-sm bg-white"
                      value={editForm.status}
                      onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                    >
                      <option value="queued">Queued</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  ) : (
                    <span className={`py-1.5 px-3 rounded-full font-semibold text-[11px] uppercase ${badgeColors[booking.status]}`}>{booking.status}</span>
                  )}
                </td>
                <td className="p-4 border-b border-[#e0e0e0] text-sm">
                  {editingId === booking.id ? (
                    <div className="flex gap-2">
                      <button className="py-1.5 px-3 rounded-md font-semibold text-white bg-[#27ae60] hover:bg-[#229954] transition-colors" onClick={handleSaveEdit}>Save</button>
                      <button className="py-1.5 px-3 rounded-md font-semibold text-white bg-[#95a5a6] hover:bg-[#7f8c8d] transition-colors" onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button className="py-1.5 px-3 rounded-md font-semibold text-white bg-[#3498db] hover:bg-[#2980b9] transition-colors" onClick={() => { setEditingId(booking.id); setEditForm(booking); }}>Edit</button>
                      <button className="py-1.5 px-3 rounded-md font-semibold text-white bg-[#e74c3c] hover:bg-[#c0392b] transition-colors" onClick={() => handleDelete(booking.id)}>Delete</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- PAGINATION CONTROLS --- */}
      {bookings.length > itemsPerPage && (
        <div className="flex justify-between items-center mt-6 bg-white p-3 md:p-4 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
            className="py-2 px-4 rounded-lg font-semibold text-sm bg-gray-100 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
          >
            ← Previous
          </button>
          <span className="text-sm font-semibold text-gray-600 bg-gray-50 py-2 px-4 rounded-lg border border-gray-100">
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => prev + 1)}
            className="py-2 px-4 rounded-lg font-semibold text-sm bg-gray-100 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}