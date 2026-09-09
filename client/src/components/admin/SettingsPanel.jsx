import React, { useState, useEffect } from 'react';
import { CalendarX, Clock, Trash2, Info } from 'lucide-react';
import {
  Button, GlassCard, IconButton, Input, SectionHeader, Toast, Badge, EmptyState, Checkbox,
} from '../ui/index.js';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function SettingsPanel({ apiBase, token }) {
  const [hours, setHours] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);
  const [newBlockDate, setNewBlockDate] = useState(new Date().toISOString().split('T')[0]);
  const [newBlockReason, setNewBlockReason] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [hoursRes, blockedRes] = await Promise.all([
        fetch(`${apiBase}/bookings/settings/hours`),
        fetch(`${apiBase}/bookings/settings/blocked-dates`),
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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(dayData),
      });
      if (res.ok) {
        showMessage('Hours updated.');
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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ blocked_date: newBlockDate, reason: newBlockReason }),
      });
      if (res.ok) {
        showMessage('Date blocked.');
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
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showMessage('Date unblocked.');
        fetchData();
      }
    } catch (err) {
      showMessage('Error connecting to server', 'error');
    }
  };

  return (
    <div className="animate-slideIn grid grid-cols-1 xl:grid-cols-2 gap-6">
      <Toast message={message} onDismiss={() => setMessage({ text: '', type: '' })} />

      <GlassCard className="p-5 md:p-6">
        <SectionHeader
          icon={Clock}
          title="Weekly operating hours"
          description="Uncheck a day to close the salon."
        />

        <div className="flex flex-col gap-2.5">
          {hours.map((day) => (
            <div
              key={day.day_of_week}
              className={[
                'flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5',
                'rounded-[var(--radius-md)] border transition-colors duration-[var(--transition-fast)]',
                day.is_closed
                  ? 'bg-surface-sunken/50 border-subtle'
                  : 'bg-surface-sunken border-line hover:border-strong',
              ].join(' ')}
            >
              <Checkbox
                id={`day-${day.day_of_week}`}
                checked={!day.is_closed}
                onChange={(e) => handleUpdateHours({ ...day, is_closed: !e.target.checked })}
                label={
                  <span className={day.is_closed ? 'text-content-muted line-through' : 'text-content'}>
                    {DAYS[day.day_of_week]}
                  </span>
                }
                className="sm:w-36 shrink-0"
              />

              {!day.is_closed ? (
                <div className="flex items-center gap-2">
                  <Input
                    aria-label={`${DAYS[day.day_of_week]} opening time`}
                    type="time"
                    value={day.open_time}
                    onChange={(e) => handleUpdateHours({ ...day, open_time: e.target.value })}
                    className="h-10 w-32 text-[13px]"
                  />
                  <span className="text-content-muted text-[13px]">to</span>
                  <Input
                    aria-label={`${DAYS[day.day_of_week]} closing time`}
                    type="time"
                    value={day.close_time}
                    onChange={(e) => handleUpdateHours({ ...day, close_time: e.target.value })}
                    className="h-10 w-32 text-[13px]"
                  />
                </div>
              ) : (
                <Badge tone="danger">Closed</Badge>
              )}
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="p-5 md:p-6 flex flex-col">
        <SectionHeader
          icon={CalendarX}
          title="Holidays & closures"
          description="One-off dates the salon won't take bookings."
        />

        <form
          onSubmit={handleAddBlockedDate}
          className="flex flex-col sm:flex-row gap-2.5 mb-5 p-3.5 rounded-[var(--radius-md)] bg-surface-sunken border border-subtle"
        >
          <Input
            aria-label="Date to block"
            type="date"
            required
            value={newBlockDate}
            onChange={(e) => setNewBlockDate(e.target.value)}
            className="flex-1 h-10 text-[13px]"
          />
          <Input
            aria-label="Reason for closure"
            type="text"
            placeholder="Reason (e.g. Diwali)"
            required
            value={newBlockReason}
            onChange={(e) => setNewBlockReason(e.target.value)}
            className="flex-1 h-10 text-[13px]"
          />
          <Button type="submit" size="sm">Block</Button>
        </form>

        <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto custom-scrollbar pr-1 max-h-[26rem]">
          {blockedDates.length === 0 ? (
            <EmptyState
              icon={Info}
              title="No closures configured"
              description="Blocked dates are hidden from the public booking form."
            />
          ) : (
            blockedDates.map((date) => (
              <div
                key={date.id}
                className="flex items-center justify-between gap-3 p-3.5 rounded-[var(--radius-md)] bg-surface-sunken border border-subtle"
              >
                <div className="min-w-0">
                  <p className="m-0 text-sm font-medium text-content truncate">
                    {new Date(date.blocked_date).toLocaleDateString('en-US', {
                      weekday: 'long', month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </p>
                  <p className="m-0 mt-0.5 text-[12px] text-content-muted truncate">{date.reason}</p>
                </div>
                <IconButton
                  label={`Remove closure on ${date.blocked_date}`}
                  variant="danger"
                  size="sm"
                  onClick={() => handleDeleteBlockedDate(date.id)}
                >
                  <Trash2 size={15} />
                </IconButton>
              </div>
            ))
          )}
        </div>
      </GlassCard>
    </div>
  );
}
