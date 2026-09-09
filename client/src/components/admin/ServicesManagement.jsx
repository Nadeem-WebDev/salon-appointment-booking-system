import React, { useState, useEffect } from 'react';
import { Scissors, PlusCircle, Save, X, Pencil, Trash2, ShieldAlert, IndianRupee, Clock } from 'lucide-react';
import {
  Alert, Badge, Button, Checkbox, EmptyState, Field, GlassCard, IconButton, Input,
  SectionHeader, Toast,
} from '../ui/index.js';

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
        headers: { Authorization: `Bearer ${token}` },
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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name,
          price: parseFloat(price),
          duration_minutes: parseInt(durationMinutes, 10) || 30,
        }),
      });
      if (res.ok) {
        showMessage('New service added.');
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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...editForm,
          price: parseFloat(editForm.price),
          duration_minutes: parseInt(editForm.duration_minutes, 10),
        }),
      });
      if (res.ok) {
        showMessage('Service updated.');
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
    if (!window.confirm('Delete this service?')) return;

    try {
      const res = await fetch(`${apiBase}/bookings/settings/services/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
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

  return (
    <div className="animate-slideIn grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Toast message={message} onDismiss={() => setMessage({ text: '', type: '' })} />

      <div className="lg:col-span-1 flex flex-col gap-5">
        <GlassCard className="p-5 md:p-6">
          <SectionHeader icon={PlusCircle} title="Add service" />
          <form onSubmit={handleAddService} className="flex flex-col gap-4">
            <Field label="Service name" htmlFor="svc-name" required>
              <Input
                id="svc-name" type="text" placeholder="e.g. Deluxe beard trim"
                value={name} onChange={(e) => setName(e.target.value)} required
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Price (₹)" htmlFor="svc-price" required>
                <Input
                  id="svc-price" type="number" placeholder="450" min="0" step="0.01"
                  value={price} onChange={(e) => setPrice(e.target.value)} required
                />
              </Field>
              <Field label="Duration (min)" htmlFor="svc-duration" required>
                <Input
                  id="svc-duration" type="number" placeholder="30" min="5" step="5"
                  value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} required
                />
              </Field>
            </div>
            <Button type="submit" className="w-full">Save service</Button>
          </form>
        </GlassCard>

        <Alert tone="info">
          <span className="flex items-start gap-2.5">
            <ShieldAlert size={15} className="shrink-0 mt-0.5 text-info" aria-hidden="true" />
            <span className="text-[13px] font-normal text-content-secondary leading-relaxed">
              Price changes apply immediately to new bookings. Deactivating a service keeps its name
              on existing historical bookings.
            </span>
          </span>
        </Alert>
      </div>

      <GlassCard className="lg:col-span-2 p-5 md:p-6">
        <SectionHeader
          icon={Scissors}
          title="Service catalog"
          description={`${services.length} configured`}
        />

        <div className="flex flex-col gap-2.5">
          {services.length === 0 ? (
            <EmptyState icon={Scissors} title="No services configured" description="Add a service so customers can book." />
          ) : (
            services.map((item) => {
              const isEditing = editingId === item.id;
              return (
                <div
                  key={item.id}
                  className={[
                    'flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4',
                    'rounded-[var(--radius-md)] border transition-colors duration-[var(--transition-fast)]',
                    !item.is_active
                      ? 'bg-surface-sunken/50 border-subtle'
                      : 'bg-surface-sunken border-line hover:border-strong',
                  ].join(' ')}
                >
                  {isEditing ? (
                    <div className="flex flex-col gap-3 w-full min-w-0">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Field label="Name" htmlFor={`svc-e-name-${item.id}`}>
                          <Input
                            id={`svc-e-name-${item.id}`} type="text" value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          />
                        </Field>
                        <Field label="Price (₹)" htmlFor={`svc-e-price-${item.id}`}>
                          <Input
                            id={`svc-e-price-${item.id}`} type="number" step="0.01" value={editForm.price}
                            onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                          />
                        </Field>
                        <Field label="Duration (min)" htmlFor={`svc-e-dur-${item.id}`}>
                          <Input
                            id={`svc-e-dur-${item.id}`} type="number" value={editForm.duration_minutes}
                            onChange={(e) => setEditForm({ ...editForm, duration_minutes: e.target.value })}
                          />
                        </Field>
                      </div>
                      <Checkbox
                        id={`svc-active-${item.id}`}
                        checked={editForm.is_active}
                        onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                        label="Active"
                        description="Visible to customers on the booking form"
                      />
                    </div>
                  ) : (
                    <div className="flex-1 min-w-0">
                      <p
                        className={[
                          'm-0 text-[15px] font-medium truncate',
                          item.is_active ? 'text-content' : 'text-content-muted line-through',
                        ].join(' ')}
                      >
                        {item.name}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="inline-flex items-center gap-1 text-[13px] text-primary tabular-nums">
                          <IndianRupee size={12} aria-hidden="true" />
                          {Number(item.price).toFixed(2)}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[13px] text-content-muted tabular-nums">
                          <Clock size={12} aria-hidden="true" />
                          {item.duration_minutes || 30} min
                        </span>
                        <Badge tone={item.is_active ? 'success' : 'neutral'}>
                          {item.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-1.5 shrink-0 self-end sm:self-center">
                    {isEditing ? (
                      <>
                        <IconButton label="Save changes" variant="primary" size="sm" onClick={handleUpdateService}>
                          <Save size={15} />
                        </IconButton>
                        <IconButton label="Cancel editing" variant="outline" size="sm" onClick={() => setEditingId(null)}>
                          <X size={15} />
                        </IconButton>
                      </>
                    ) : (
                      <>
                        <IconButton
                          label={`Edit ${item.name}`}
                          variant="secondary"
                          size="sm"
                          onClick={() => { setEditingId(item.id); setEditForm(item); }}
                        >
                          <Pencil size={14} />
                        </IconButton>
                        <IconButton
                          label={`Delete ${item.name}`}
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteService(item.id)}
                        >
                          <Trash2 size={14} />
                        </IconButton>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </GlassCard>
    </div>
  );
}
