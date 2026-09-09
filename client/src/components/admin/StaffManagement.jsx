import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Save, X, Pencil, Trash2, ShieldAlert } from 'lucide-react';
import {
  Alert, Badge, Button, Checkbox, EmptyState, Field, GlassCard, IconButton, Input,
  SectionHeader, Toast,
} from '../ui/index.js';

export default function StaffManagement({ apiBase, token }) {
  const [staff, setStaff] = useState([]);
  const [newStaffName, setNewStaffName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [message, setMessage] = useState({ text: '', type: '' });

  const fetchStaff = async () => {
    try {
      const res = await fetch(`${apiBase}/bookings/settings/staff`, {
        headers: { Authorization: `Bearer ${token}` },
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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newStaffName }),
      });
      if (res.ok) {
        showMessage('New staff member added.');
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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        showMessage('Staff details updated.');
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
    if (!window.confirm('Delete this staff member?')) return;

    try {
      const res = await fetch(`${apiBase}/bookings/settings/staff/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
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

  return (
    <div className="animate-slideIn grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Toast message={message} onDismiss={() => setMessage({ text: '', type: '' })} />

      <div className="lg:col-span-1 flex flex-col gap-5">
        <GlassCard className="p-5 md:p-6">
          <SectionHeader icon={UserPlus} title="Add stylist" />
          <form onSubmit={handleAddStaff} className="flex flex-col gap-4">
            <Field label="Name" htmlFor="staff-name" required>
              <Input
                id="staff-name"
                type="text"
                placeholder="e.g. Priya Sharma"
                value={newStaffName}
                onChange={(e) => setNewStaffName(e.target.value)}
                required
              />
            </Field>
            <Button type="submit" className="w-full">Add to roster</Button>
          </form>
        </GlassCard>

        <Alert tone="info">
          <span className="flex items-start gap-2.5">
            <ShieldAlert size={15} className="shrink-0 mt-0.5 text-info" aria-hidden="true" />
            <span className="text-[13px] font-normal text-content-secondary leading-relaxed">
              A stylist with existing appointments can't be deleted. Set them{' '}
              <strong className="text-content font-medium">inactive</strong> instead — they disappear
              from the public booking form and your history stays intact.
            </span>
          </span>
        </Alert>
      </div>

      <GlassCard className="lg:col-span-2 p-5 md:p-6">
        <SectionHeader icon={Users} title="Manage team" description={`${staff.length} on the roster`} />

        <div className="flex flex-col gap-2.5">
          {staff.length === 0 ? (
            <EmptyState icon={Users} title="No staff members yet" description="Add your first stylist to start taking bookings." />
          ) : (
            staff.map((person) => {
              const isEditing = editingId === person.id;
              return (
                <div
                  key={person.id}
                  className={[
                    'flex justify-between gap-4 p-4',
                    'rounded-[var(--radius-md)] border transition-colors duration-[var(--transition-fast)]',
                    isEditing ? 'flex-col' : 'flex-row items-center',
                    !person.is_active
                      ? 'bg-surface-sunken/50 border-subtle'
                      : 'bg-surface-sunken border-line hover:border-strong',
                  ].join(' ')}
                >
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="flex flex-col gap-3">
                        <Input
                          aria-label="Staff name"
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        />
                        <Checkbox
                          id={`staff-active-${person.id}`}
                          checked={editForm.is_active}
                          onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                          label="Active"
                          description="Visible on the public booking form"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="grid place-items-center h-10 w-10 shrink-0 rounded-full bg-accent-soft text-accent border border-accent/20 text-sm font-semibold uppercase">
                          {person.name?.slice(0, 2)}
                        </span>
                        <div className="min-w-0">
                          <p
                            className={[
                              'm-0 text-[15px] font-medium truncate',
                              person.is_active ? 'text-content' : 'text-content-muted line-through',
                            ].join(' ')}
                          >
                            {person.name}
                          </p>
                          <Badge tone={person.is_active ? 'success' : 'neutral'} className="mt-1.5">
                            {person.is_active ? 'Active' : 'Hidden'}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-1.5 shrink-0">
                    {isEditing ? (
                      <>
                        <IconButton label="Save changes" variant="primary" size="sm" onClick={handleUpdateStaff}>
                          <Save size={15} />
                        </IconButton>
                        <IconButton label="Cancel editing" variant="outline" size="sm" onClick={() => setEditingId(null)}>
                          <X size={15} />
                        </IconButton>
                      </>
                    ) : (
                      <>
                        <IconButton
                          label={`Edit ${person.name}`}
                          variant="secondary"
                          size="sm"
                          onClick={() => { setEditingId(person.id); setEditForm(person); }}
                        >
                          <Pencil size={14} />
                        </IconButton>
                        <IconButton
                          label={`Delete ${person.name}`}
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteStaff(person.id)}
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
