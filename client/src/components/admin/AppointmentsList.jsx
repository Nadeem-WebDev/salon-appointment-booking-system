import React, { useState, useEffect } from 'react';
import { PlusCircle, Pencil, Trash2, Check, X, Coins, CalendarSearch } from 'lucide-react';
import {
  Button, IconButton, Card, Field, Input, Select, Checkbox, Modal, Toast,
  StatusBadge, Badge, EmptyState, Pagination, Table, Td, Tr,
} from '../ui/index.js';

const STATUS_OPTIONS = [
  { value: 'queued', label: 'Queued' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function AppointmentsList({ bookings, apiBase, onRefresh, filters, token, role }) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [message, setMessage] = useState({ text: '', type: '' });

  const [customerData, setCustomerData] = useState(null);
  const [redeemCoins, setRedeemCoins] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({
    customer_name: '', phone: '', email: '', service_id: '', staff_id: '', date: '', time: '',
  });

  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetch(`${apiBase}/bookings/services`).then((r) => r.json()).then(setServices);
    fetch(`${apiBase}/bookings/staff`).then((r) => r.json()).then(setStaff);
  }, [apiBase]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters?.searchTerm, filters?.statusFilter, filters?.dateFilter]);

  // Live wallet lookup once a full phone number is entered
  useEffect(() => {
    const cleanPhone = addForm.phone.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      fetch(`${apiBase}/bookings/customer/${cleanPhone}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.exists) {
            setCustomerData(data);
            setAddForm((prev) => ({
              ...prev,
              customer_name: prev.customer_name || data.name,
              email: prev.email || data.email,
            }));
          } else {
            setCustomerData(null);
            setRedeemCoins(false);
          }
        })
        .catch((err) => console.error('Wallet check failed:', err));
    } else {
      setCustomerData(null);
      setRedeemCoins(false);
    }
  }, [addForm.phone, apiBase, token]);

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
    return `${dateStr} · ${timeStr}`;
  };

  const formatForInput = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const resetAddForm = () => {
    setShowAddForm(false);
    setAddForm({ customer_name: '', phone: '', email: '', service_id: '', staff_id: '', date: '', time: '' });
    setCustomerData(null);
    setRedeemCoins(false);
  };

  async function handleAddSubmit(e) {
    e.preventDefault();
    try {
      const finalAppointmentTime = new Date(`${addForm.date}T${addForm.time}:00`).toISOString();

      const res = await fetch(`${apiBase}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...addForm, appointment_time: finalAppointmentTime, redeem_coins: redeemCoins }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to add appointment');

      showToast('Walk-in appointment added.');
      resetAddForm();
      onRefresh();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleSaveEdit() {
    try {
      const res = await fetch(`${apiBase}/bookings/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editForm),
      });

      if (!res.ok) throw new Error('Failed to update');

      if (editForm.status === 'completed') {
        if (editForm.email && editForm.email !== 'walkin@salon.local') {
          showToast(`Booking completed. Invoice sent to ${editForm.email}`);
        } else {
          showToast('Walk-in appointment completed and closed.');
        }
      } else {
        showToast('Booking updated.');
      }

      setEditingId(null);
      onRefresh();
    } catch (err) {
      showToast('Error updating booking', 'error');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this booking? This cannot be undone.')) return;
    try {
      const res = await fetch(`${apiBase}/bookings/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete');
      showToast('Booking deleted.');
      onRefresh();
    } catch (err) {
      showToast('Error deleting booking', 'error');
    }
  }

  const chosenService = services.find((s) => String(s.id) === String(addForm.service_id));
  const servicePrice = chosenService ? Number(chosenService.price) : 0;
  const walletCoins = customerData ? Number(customerData.supercoins) : 0;

  return (
    <div className="animate-slideIn flex flex-col gap-5">
      <Toast message={message} onDismiss={() => setMessage({ text: '', type: '' })} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="m-0 text-[13px] text-content-secondary tabular-nums">
          Showing <span className="text-content font-semibold">{bookings.length}</span>{' '}
          {bookings.length === 1 ? 'appointment' : 'appointments'}
        </p>
        <Button size="sm" onClick={() => setShowAddForm(true)}>
          <PlusCircle size={16} aria-hidden="true" /> Walk-in booking
        </Button>
      </div>

      {/* ---------- MOBILE CARDS ---------- */}
      <div className="grid grid-cols-1 gap-3 lg:hidden">
        {currentBookings.length === 0 && (
          <EmptyState
            icon={CalendarSearch}
            title="No appointments found"
            description="Try a different date or clear the filters."
          />
        )}
        {currentBookings.map((booking) => {
          const isEditing = editingId === booking.id;
          return (
            <Card key={booking.id} className="p-4 flex flex-col gap-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-content-muted tabular-nums">
                    #{booking.id}
                  </span>
                  <p className="m-0 mt-1 font-semibold text-content text-[15px] truncate">
                    {booking.customer_name}
                  </p>
                  <p className="m-0 mt-0.5 text-[12px] text-content-muted truncate">{booking.email}</p>
                </div>
                {isEditing ? (
                  <Select
                    aria-label="Status"
                    className="h-9 w-36 shrink-0 text-[13px]"
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </Select>
                ) : (
                  <StatusBadge status={booking.status} className="shrink-0" />
                )}
              </div>

              <dl className="grid grid-cols-2 gap-3 m-0 bg-surface-sunken border border-subtle rounded-[var(--radius-md)] p-3">
                <div className="min-w-0">
                  <dt className="m-0 text-[10px] font-semibold uppercase tracking-[0.08em] text-content-muted mb-1">Service</dt>
                  <dd className="m-0">
                    {isEditing ? (
                      <Select
                        aria-label="Service"
                        className="h-9 text-[13px]"
                        value={editForm.service_id}
                        onChange={(e) => setEditForm({ ...editForm, service_id: e.target.value })}
                      >
                        {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </Select>
                    ) : (
                      <span className="text-[13px] text-content truncate block">{booking.service}</span>
                    )}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="m-0 text-[10px] font-semibold uppercase tracking-[0.08em] text-content-muted mb-1">Stylist</dt>
                  <dd className="m-0">
                    {isEditing ? (
                      <Select
                        aria-label="Stylist"
                        className="h-9 text-[13px]"
                        value={editForm.staff_id}
                        onChange={(e) => setEditForm({ ...editForm, staff_id: e.target.value })}
                      >
                        {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </Select>
                    ) : (
                      <span className="text-[13px] text-content truncate block">{booking.staff_name || '—'}</span>
                    )}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="m-0 text-[10px] font-semibold uppercase tracking-[0.08em] text-content-muted mb-1">Phone</dt>
                  <dd className="m-0">
                    {isEditing ? (
                      <Input
                        aria-label="Phone"
                        type="tel"
                        className="h-9 text-[13px]"
                        value={editForm.phone || ''}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      />
                    ) : (
                      <span className="text-[13px] text-content truncate block tabular-nums">{booking.phone || '—'}</span>
                    )}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="m-0 text-[10px] font-semibold uppercase tracking-[0.08em] text-content-muted mb-1">Time</dt>
                  <dd className="m-0">
                    {isEditing ? (
                      <Input
                        aria-label="Appointment time"
                        type="datetime-local"
                        className="h-9 text-[13px]"
                        value={formatForInput(editForm.appointment_time)}
                        onChange={(e) =>
                          setEditForm({ ...editForm, appointment_time: new Date(e.target.value).toISOString() })
                        }
                      />
                    ) : (
                      <span className="text-[13px] text-content truncate block tabular-nums">
                        {formatDateTime(booking.appointment_time)}
                      </span>
                    )}
                  </dd>
                </div>
              </dl>

              <div className="flex gap-2 pt-1">
                {isEditing ? (
                  <>
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                    <Button size="sm" className="flex-1" onClick={handleSaveEdit}>
                      <Check size={15} aria-hidden="true" /> Save
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      onClick={() => { setEditingId(booking.id); setEditForm(booking); }}
                    >
                      <Pencil size={14} aria-hidden="true" /> Edit
                    </Button>
                    {role === 'admin' && (
                      <Button variant="danger" size="sm" className="flex-1" onClick={() => handleDelete(booking.id)}>
                        <Trash2 size={14} aria-hidden="true" /> Delete
                      </Button>
                    )}
                  </>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* ---------- DESKTOP TABLE ---------- */}
      <div className="hidden lg:block">
        <Table
          minWidth="58rem"
          columns={['#', 'Customer', 'Contact', 'Service', 'Stylist', 'Appointment', 'Status', 'Actions']}
        >
          {currentBookings.length === 0 && (
            <tr>
              <Td colSpan={8} className="py-10">
                <EmptyState
                  icon={CalendarSearch}
                  title="No appointments found"
                  description="Try a different date or clear the filters."
                  className="border-none bg-transparent py-0"
                />
              </Td>
            </tr>
          )}
          {currentBookings.map((booking) => {
            const isEditing = editingId === booking.id;
            return (
              <Tr key={booking.id}>
                <Td className="text-content-muted tabular-nums">{booking.id}</Td>
                <Td className="font-medium max-w-[10rem] truncate">{booking.customer_name}</Td>
                <Td className="max-w-[12rem]">
                  <span className="block text-[13px] text-content-secondary truncate">{booking.email}</span>
                  {isEditing ? (
                    <Input
                      aria-label="Phone"
                      type="tel"
                      className="h-8 mt-1 text-[13px] w-32"
                      value={editForm.phone || ''}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    />
                  ) : (
                    <span className="block text-[13px] text-content-muted tabular-nums">{booking.phone || '—'}</span>
                  )}
                </Td>
                <Td>
                  {isEditing ? (
                    <Select
                      aria-label="Service"
                      className="h-9 min-w-[9rem] text-[13px]"
                      value={editForm.service_id}
                      onChange={(e) => setEditForm({ ...editForm, service_id: e.target.value })}
                    >
                      {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </Select>
                  ) : (
                    <Badge tone="primary" plain className="font-medium max-w-[11rem] truncate block">
                      {booking.service}
                    </Badge>
                  )}
                </Td>
                <Td>
                  {isEditing ? (
                    <Select
                      aria-label="Stylist"
                      className="h-9 min-w-[8rem] text-[13px]"
                      value={editForm.staff_id}
                      onChange={(e) => setEditForm({ ...editForm, staff_id: e.target.value })}
                    >
                      {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </Select>
                  ) : (
                    <span className="text-content-secondary whitespace-nowrap">{booking.staff_name || '—'}</span>
                  )}
                </Td>
                <Td className="whitespace-nowrap tabular-nums">
                  {isEditing ? (
                    <Input
                      aria-label="Appointment time"
                      type="datetime-local"
                      className="h-9 text-[13px]"
                      value={formatForInput(editForm.appointment_time)}
                      onChange={(e) => {
                        const newDate = new Date(e.target.value);
                        if (!isNaN(newDate.getTime())) {
                          setEditForm({ ...editForm, appointment_time: newDate.toISOString() });
                        }
                      }}
                    />
                  ) : (
                    formatDateTime(booking.appointment_time)
                  )}
                </Td>
                <Td>
                  {isEditing ? (
                    <Select
                      aria-label="Status"
                      className="h-9 min-w-[8.5rem] text-[13px]"
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    >
                      {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </Select>
                  ) : (
                    <StatusBadge status={booking.status} />
                  )}
                </Td>
                <Td>
                  <div className="flex gap-1.5">
                    {isEditing ? (
                      <>
                        <IconButton label="Save changes" variant="primary" size="sm" onClick={handleSaveEdit}>
                          <Check size={15} />
                        </IconButton>
                        <IconButton label="Cancel editing" variant="outline" size="sm" onClick={() => setEditingId(null)}>
                          <X size={15} />
                        </IconButton>
                      </>
                    ) : (
                      <>
                        <IconButton
                          label={`Edit booking ${booking.id}`}
                          variant="secondary"
                          size="sm"
                          onClick={() => { setEditingId(booking.id); setEditForm(booking); }}
                        >
                          <Pencil size={14} />
                        </IconButton>
                        {role === 'admin' && (
                          <IconButton
                            label={`Delete booking ${booking.id}`}
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(booking.id)}
                          >
                            <Trash2 size={14} />
                          </IconButton>
                        )}
                      </>
                    )}
                  </div>
                </Td>
              </Tr>
            );
          })}
        </Table>
      </div>

      <Pagination
        page={safePage}
        totalPages={totalPages}
        onPrev={() => setCurrentPage((p) => p - 1)}
        onNext={() => setCurrentPage((p) => p + 1)}
      />

      {/* ---------- WALK-IN MODAL ---------- */}
      <Modal
        open={showAddForm}
        onOpenChange={(next) => (next ? setShowAddForm(true) : resetAddForm())}
        title="New appointment"
        description="Block the schedule for a walk-in or phone booking."
        footer={
          <>
            <Button variant="outline" onClick={resetAddForm}>Cancel</Button>
            <Button type="submit" form="walkin-form">Save appointment</Button>
          </>
        }
      >
        <form id="walkin-form" onSubmit={handleAddSubmit} className="flex flex-col gap-6">
          <fieldset className="border-none p-0 m-0 min-w-0">
            <legend className="text-[11px] font-semibold uppercase tracking-[0.08em] text-content-secondary mb-3 p-0">
              Client details
            </legend>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Customer name" htmlFor="wi-name" required>
                <Input
                  id="wi-name" type="text" required placeholder="e.g. Jane Doe"
                  value={addForm.customer_name}
                  onChange={(e) => setAddForm({ ...addForm, customer_name: e.target.value })}
                />
              </Field>
              <Field label="Phone" htmlFor="wi-phone" required>
                <Input
                  id="wi-phone" type="tel" required placeholder="10-digit mobile"
                  value={addForm.phone}
                  onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                />
              </Field>
              <Field label="Email" htmlFor="wi-email" hint="Optional — for the e-receipt">
                <Input
                  id="wi-email" type="email" placeholder="you@example.com"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                />
              </Field>
            </div>

            {customerData && (
              <div className="mt-4 rounded-[var(--radius-md)] border border-primary/20 bg-primary-soft p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-slideIn">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="grid place-items-center h-9 w-9 shrink-0 rounded-full bg-primary/15 text-primary border border-primary/25">
                    <Coins size={16} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">
                      Loyalty wallet
                    </p>
                    <p className="m-0 mt-0.5 text-sm text-content tabular-nums">
                      {walletCoins.toLocaleString()} coins
                    </p>
                  </div>
                </div>

                {walletCoins >= 1000 ? (
                  servicePrice >= 1000 ? (
                    <Checkbox
                      id="wi-redeem"
                      checked={redeemCoins}
                      onChange={(e) => setRedeemCoins(e.target.checked)}
                      label="Redeem 1000 coins"
                      description="₹1,000 off this booking"
                    />
                  ) : (
                    <p className="m-0 text-[12px] text-content-secondary sm:text-right">
                      Service must be ₹1,000+ to redeem coins.
                    </p>
                  )
                ) : (
                  <p className="m-0 text-[12px] text-content-muted sm:text-right tabular-nums">
                    {(1000 - walletCoins).toLocaleString()} more coins for a discount.
                  </p>
                )}
              </div>
            )}
          </fieldset>

          <fieldset className="border-none p-0 m-0 min-w-0">
            <legend className="text-[11px] font-semibold uppercase tracking-[0.08em] text-content-secondary mb-3 p-0">
              Service & schedule
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <Field label="Service" htmlFor="wi-service" required>
                <Select
                  id="wi-service" required value={addForm.service_id}
                  onChange={(e) => setAddForm({ ...addForm, service_id: e.target.value })}
                >
                  <option value="" disabled>Select service</option>
                  {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </Select>
              </Field>
              <Field label="Stylist" htmlFor="wi-staff" required>
                <Select
                  id="wi-staff" required value={addForm.staff_id}
                  onChange={(e) => setAddForm({ ...addForm, staff_id: e.target.value })}
                >
                  <option value="" disabled>Select stylist</option>
                  {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </Select>
              </Field>
              <Field label="Date" htmlFor="wi-date" required>
                <Input
                  id="wi-date" type="date" required
                  min={new Date().toISOString().split('T')[0]}
                  value={addForm.date}
                  onChange={(e) => setAddForm({ ...addForm, date: e.target.value })}
                />
              </Field>
              <Field label="Time" htmlFor="wi-time" required>
                <Select
                  id="wi-time" required value={addForm.time}
                  onChange={(e) => setAddForm({ ...addForm, time: e.target.value })}
                >
                  <option value="" disabled>Select time</option>
                  {Array.from({ length: 23 }).map((_, i) => {
                    const hour = Math.floor(i / 2) + 9;
                    const mins = i % 2 === 0 ? '00' : '30';
                    const timeString = `${hour.toString().padStart(2, '0')}:${mins}`;
                    const ampm = hour >= 12 ? 'PM' : 'AM';
                    const displayHour = hour > 12 ? hour - 12 : hour;
                    return (
                      <option key={timeString} value={timeString}>
                        {`${displayHour}:${mins} ${ampm}`}
                      </option>
                    );
                  })}
                </Select>
              </Field>
            </div>
          </fieldset>
        </form>
      </Modal>
    </div>
  );
}
