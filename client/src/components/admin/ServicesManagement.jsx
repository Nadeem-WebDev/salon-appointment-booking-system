import React, { useState, useEffect } from 'react';
import { Scissors, PlusCircle, Save, X, Edit2, Trash2, ShieldAlert, IndianRupee, Clock } from 'lucide-react';

export default function ServicesManagement({ apiBase, token }) {
  const [services, setServices] = useState([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('30');
  
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [message, setMessage] = useState({ text: '', type: '' });

  const fetchServices = async () => {
    try {
      const res = await fetch(`${apiBase}/bookings/settings/services`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setServices(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    if (!name.trim() || !price) return;

    try {
      const res = await fetch(`${apiBase}/bookings/settings/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          name, 
          price: parseFloat(price), 
          duration_minutes: parseInt(durationMinutes, 10) || 30 
        })
      });
      if (res.ok) {
        showMessage('New service added!');
        setName('');
        setPrice('');
        setDurationMinutes('30');
        fetchServices();
      } else {
        showMessage('Failed to add service', 'error');
      }
    } catch (err) {
      showMessage('Server error', 'error');
    }
  };

  const handleUpdateService = async () => {
    try {
      const res = await fetch(`${apiBase}/bookings/settings/services/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          ...editForm,
          price: parseFloat(editForm.price),
          duration_minutes: parseInt(editForm.duration_minutes, 10)
        })
      });
      if (res.ok) {
        showMessage('Service details updated!');
        setEditingId(null);
        fetchServices();
      } else {
        showMessage('Failed to update service', 'error');
      }
    } catch (err) {
      showMessage('Server error', 'error');
    }
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;

    try {
      const res = await fetch(`${apiBase}/bookings/settings/services/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        showMessage('Service deleted.');
        fetchServices();
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

      {/* LEFT COLUMN: Add New Service Form */}
      <div className="lg:col-span-1 flex flex-col gap-6">
        <div className="bg-white/50 backdrop-blur-xl border border-white/60 p-6 rounded-3xl shadow-[0_8px_32px_rgba(19,70,17,0.06)]">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#3DA35D]/20">
            <div className="p-2.5 bg-[#134611] text-[#E8FCCF] rounded-xl shadow-inner"><PlusCircle size={20} /></div>
            <h3 className="text-[#134611] text-lg font-black m-0">Add New Service</h3>
          </div>

          <form onSubmit={handleAddService} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-bold text-[#134611] uppercase tracking-wider mb-1 block">Service Name</label>
              <input 
                type="text" 
                placeholder="e.g. Deluxe Beard Trim" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                className={inputClass} 
                required 
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#134611] uppercase tracking-wider mb-1 block">Price (₹)</label>
              <input 
                type="number" 
                placeholder="450" 
                min="0"
                step="0.01"
                value={price} 
                onChange={e => setPrice(e.target.value)} 
                className={inputClass} 
                required 
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#134611] uppercase tracking-wider mb-1 block">Est. Duration (Mins)</label>
              <input 
                type="number" 
                placeholder="30" 
                min="5"
                step="5"
                value={durationMinutes} 
                onChange={e => setDurationMinutes(e.target.value)} 
                className={inputClass} 
                required 
              />
            </div>

            <button type="submit" className="mt-2 py-3 px-4 bg-[#3E8914] hover:bg-[#134611] text-[#E8FCCF] rounded-xl font-bold transition-all shadow-md">
              + Save Service
            </button>
          </form>
        </div>

        <div className="bg-[#96E072]/20 border border-[#3DA35D]/30 p-5 rounded-2xl flex items-start gap-3">
          <ShieldAlert size={20} className="text-[#3E8914] shrink-0 mt-0.5" />
          <p className="text-xs font-bold text-[#134611] m-0 leading-relaxed">
            <strong>Note:</strong> Price updates take effect immediately for all upcoming bookings. If you deactivate a service, existing historical bookings will keep their service name intact!
          </p>
        </div>
      </div>

      {/* RIGHT COLUMN: Service Catalog List */}
      <div className="lg:col-span-2 bg-white/50 backdrop-blur-xl border border-white/60 p-6 rounded-3xl shadow-[0_8px_32px_rgba(19,70,17,0.06)]">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#3DA35D]/20">
          <div className="p-2.5 bg-[#3E8914] text-[#E8FCCF] rounded-xl shadow-inner"><Scissors size={20} /></div>
          <h3 className="text-[#134611] text-lg font-black m-0">Service Catalog</h3>
        </div>

        <div className="flex flex-col gap-3">
          {services.length === 0 ? (
            <div className="text-center py-8 text-[#3DA35D] font-bold">No services configured.</div>
          ) : (
            services.map(item => (
              <div key={item.id} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border transition-all ${!item.is_active ? 'bg-gray-100/50 border-gray-300 opacity-80' : 'bg-white/70 border-[#3DA35D]/30 hover:border-[#3E8914]'}`}>
                
                {/* Editing View */}
                {editingId === item.id ? (
                  <div className="flex flex-col gap-3 w-full">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-[#3E8914] uppercase">Name</label>
                        <input 
                          type="text" 
                          value={editForm.name} 
                          onChange={e => setEditForm({ ...editForm, name: e.target.value })} 
                          className={inputClass} 
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-[#3E8914] uppercase">Price (₹)</label>
                        <input 
                          type="number" 
                          step="0.01"
                          value={editForm.price} 
                          onChange={e => setEditForm({ ...editForm, price: e.target.value })} 
                          className={inputClass} 
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-[#3E8914] uppercase">Duration (Mins)</label>
                        <input 
                          type="number" 
                          value={editForm.duration_minutes} 
                          onChange={e => setEditForm({ ...editForm, duration_minutes: e.target.value })} 
                          className={inputClass} 
                        />
                      </div>
                    </div>
                    
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-sm text-[#134611] mt-1">
                      <input 
                        type="checkbox" 
                        checked={editForm.is_active} 
                        onChange={e => setEditForm({ ...editForm, is_active: e.target.checked })}
                        className="w-4 h-4 accent-[#3E8914]" 
                      />
                      Active (Visible to customers)
                    </label>
                  </div>
                ) : (
                  /* Normal Display View */
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2">
                    <div>
                      <h4 className={`text-lg font-black m-0 ${!item.is_active ? 'text-gray-500 line-through' : 'text-[#134611]'}`}>
                        {item.name}
                      </h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs font-bold text-[#3E8914] flex items-center gap-0.5">
                          <IndianRupee size={12} /> {Number(item.price).toFixed(2)}
                        </span>
                        <span className="text-xs font-bold text-[#3DA35D] flex items-center gap-1">
                          <Clock size={12} /> {item.duration_minutes || 30} mins
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${item.is_active ? 'bg-[#96E072]/30 text-[#134611] border border-[#96E072]/50' : 'bg-gray-200 text-gray-600'}`}>
                        {item.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 shrink-0 self-end sm:self-center">
                  {editingId === item.id ? (
                    <>
                      <button onClick={handleUpdateService} className="p-2.5 bg-[#134611] text-[#E8FCCF] rounded-xl hover:shadow-lg transition-all border-none cursor-pointer" title="Save">
                        <Save size={18} />
                      </button>
                      <button onClick={() => setEditingId(null)} className="p-2.5 bg-[#96E072] text-[#134611] rounded-xl hover:shadow-lg transition-all border-none cursor-pointer" title="Cancel">
                        <X size={18} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { setEditingId(item.id); setEditForm(item); }} className="p-2.5 bg-[#3E8914] text-[#E8FCCF] rounded-xl hover:bg-[#134611] transition-colors border-none cursor-pointer" title="Edit Service">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDeleteService(item.id)} className="p-2.5 bg-red-100 text-red-600 rounded-xl hover:bg-red-500 hover:text-white transition-colors border-none cursor-pointer" title="Delete Service">
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