import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Save, X, Edit2, Trash2, ShieldAlert } from 'lucide-react';

export default function StaffManagement({ apiBase, token }) {
  const [staff, setStaff] = useState([]);
  const [newStaffName, setNewStaffName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [message, setMessage] = useState({ text: '', type: '' });

  const fetchStaff = async () => {
    try {
      const res = await fetch(`${apiBase}/bookings/settings/staff`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setStaff(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!newStaffName.trim()) return;

    try {
      const res = await fetch(`${apiBase}/bookings/settings/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: newStaffName })
      });
      if (res.ok) {
        showMessage('New staff member added!');
        setNewStaffName('');
        fetchStaff();
      } else {
        showMessage('Failed to add staff', 'error');
      }
    } catch (err) {
      showMessage('Server error', 'error');
    }
  };

  const handleUpdateStaff = async () => {
    try {
      const res = await fetch(`${apiBase}/bookings/settings/staff/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        showMessage('Staff details updated!');
        setEditingId(null);
        fetchStaff();
      } else {
        showMessage('Failed to update staff', 'error');
      }
    } catch (err) {
      showMessage('Server error', 'error');
    }
  };

  const handleDeleteStaff = async (id) => {
    if (!window.confirm('Are you sure you want to delete this staff member?')) return;
    
    try {
      const res = await fetch(`${apiBase}/bookings/settings/staff/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        showMessage('Staff member deleted.');
        fetchStaff();
      } else {
        const data = await res.json();
        showMessage(data.error || 'Failed to delete', 'error');
      }
    } catch (err) {
      showMessage('Server error', 'error');
    }
  };

  const inputClass = "w-full p-3 bg-white/70 border border-[#3DA35D]/50 rounded-xl text-sm text-[#134611] font-bold focus:outline-none focus:ring-2 focus:ring-[#96E072]";

  return (
    <div className="animate-slideIn grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* Toast Message */}
      {message.text && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl font-bold shadow-xl backdrop-blur-md border ${message.type === 'error' ? 'bg-red-100 text-red-700 border-red-500' : 'bg-[#96E072]/90 text-[#134611] border-[#3E8914]'}`}>
          {message.text}
        </div>
      )}

      {/* LEFT COLUMN: Add New Staff */}
      <div className="lg:col-span-1 flex flex-col gap-6">
        <div className="bg-white/50 backdrop-blur-xl border border-white/60 p-6 rounded-3xl shadow-[0_8px_32px_rgba(19,70,17,0.06)]">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#3DA35D]/20">
            <div className="p-2.5 bg-[#134611] text-[#E8FCCF] rounded-xl shadow-inner"><UserPlus size={20} /></div>
            <h3 className="text-[#134611] text-lg font-black m-0">Add New Stylist</h3>
          </div>
          <form onSubmit={handleAddStaff} className="flex flex-col gap-4">
            <input 
              type="text" 
              placeholder="Enter staff name..." 
              value={newStaffName} 
              onChange={e => setNewStaffName(e.target.value)} 
              className={inputClass} 
              required 
            />
            <button type="submit" className="py-3 px-4 bg-[#3E8914] hover:bg-[#134611] text-[#E8FCCF] rounded-xl font-bold transition-all shadow-md">
              + Add to Roster
            </button>
          </form>
        </div>
        
        <div className="bg-[#96E072]/20 border border-[#3DA35D]/30 p-5 rounded-2xl flex items-start gap-3">
          <ShieldAlert size={20} className="text-[#3E8914] shrink-0 mt-0.5" />
          <p className="text-xs font-bold text-[#134611] m-0 leading-relaxed">
            <strong>Pro Tip:</strong> You cannot permanently delete a staff member if they have appointments in the system. Instead, toggle their status to <span className="text-red-600 bg-red-100 px-1 rounded">Inactive</span> to hide them from the public booking form while preserving your historical data!
          </p>
        </div>
      </div>

      {/* RIGHT COLUMN: Staff List */}
      <div className="lg:col-span-2 bg-white/50 backdrop-blur-xl border border-white/60 p-6 rounded-3xl shadow-[0_8px_32px_rgba(19,70,17,0.06)]">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#3DA35D]/20">
          <div className="p-2.5 bg-[#3E8914] text-[#E8FCCF] rounded-xl shadow-inner"><Users size={20} /></div>
          <h3 className="text-[#134611] text-lg font-black m-0">Manage Team</h3>
        </div>

        <div className="flex flex-col gap-3">
          {staff.length === 0 ? (
            <div className="text-center py-8 text-[#3DA35D] font-bold">No staff members found.</div>
          ) : (
            staff.map(person => (
              <div key={person.id} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border transition-all ${!person.is_active ? 'bg-gray-100/50 border-gray-300 opacity-80' : 'bg-white/70 border-[#3DA35D]/30 hover:border-[#3E8914]'}`}>
                
                {/* Staff Info Display / Edit Mode */}
                <div className="flex-1">
                  {editingId === person.id ? (
                    <div className="flex flex-col gap-3">
                      <input 
                        type="text" 
                        value={editForm.name} 
                        onChange={e => setEditForm({ ...editForm, name: e.target.value })} 
                        className={inputClass} 
                      />
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-sm text-[#134611]">
                        <input 
                          type="checkbox" 
                          checked={editForm.is_active} 
                          onChange={e => setEditForm({ ...editForm, is_active: e.target.checked })}
                          className="w-4 h-4 accent-[#3E8914]" 
                        />
                        Visible on Public Booking Form (Active)
                      </label>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <h4 className={`text-lg font-black m-0 ${!person.is_active ? 'text-gray-500 line-through' : 'text-[#134611]'}`}>
                        {person.name}
                      </h4>
                      <span className={`text-xs font-bold uppercase tracking-wider ${person.is_active ? 'text-[#3DA35D]' : 'text-red-500'}`}>
                        {person.is_active ? '🟢 Active Stylist' : '🔴 Inactive (Hidden)'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 shrink-0">
                  {editingId === person.id ? (
                    <>
                      <button onClick={handleUpdateStaff} className="p-2.5 bg-[#134611] text-[#E8FCCF] rounded-xl hover:shadow-lg transition-all" title="Save">
                        <Save size={18} />
                      </button>
                      <button onClick={() => setEditingId(null)} className="p-2.5 bg-[#96E072] text-[#134611] rounded-xl hover:shadow-lg transition-all" title="Cancel">
                        <X size={18} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { setEditingId(person.id); setEditForm(person); }} className="p-2.5 bg-[#3E8914] text-[#E8FCCF] rounded-xl hover:bg-[#134611] transition-colors" title="Edit Staff">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDeleteStaff(person.id)} className="p-2.5 bg-red-100 text-red-600 rounded-xl hover:bg-red-500 hover:text-white transition-colors" title="Permanently Delete">
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                </div>

              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}