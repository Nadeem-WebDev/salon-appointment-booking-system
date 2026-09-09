import React, { useEffect, useState } from 'react';
import { Clock, RefreshCw, Scissors, User, CalendarCheck } from 'lucide-react';
import { StatusBadge, EmptyState, LoadingState } from './ui/index.js';

export default function QueueView({ apiBase, refreshKey }) {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchQueue() {
    try {
      setLoading(true);
      const res = await fetch(`${apiBase}/bookings/queue`);
      const data = await res.json();
      setQueue(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchQueue();
    const iv = setInterval(fetchQueue, 10000); // Poll every 10 seconds
    return () => clearInterval(iv);
  }, [refreshKey, apiBase]);

  // Only show appointments for the current day
  const displayQueue = queue.filter((booking) => {
    const bookingDate = new Date(booking.appointment_time);
    return bookingDate.toDateString() === new Date().toDateString();
  });

  // Privacy: "Isabella Lopez" -> "Isabella L."
  const maskName = (fullName) => {
    if (!fullName) return '';
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
  };

  if (loading && queue.length === 0) {
    return <LoadingState label="Loading live queue…" />;
  }

  return (
    <div className="flex flex-col">
      {displayQueue.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No appointments in the queue today"
          description="New bookings appear here the moment they're confirmed."
        />
      ) : (
        <ol className="list-none m-0 p-0 flex flex-col gap-2.5 md:max-h-[31rem] overflow-y-auto pr-1 custom-scrollbar">
          {displayQueue.map((booking, index) => {
            const getWaitTime = () => {
              if (booking.status === 'in-progress') return 'Currently in chair';

              const apptTime = new Date(booking.appointment_time);
              const timeString = apptTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const now = new Date();

              // Minutes until their appointment
              const minsUntilAppt = Math.ceil((apptTime - now) / 60000);

              // Delay from people ahead of them with the same stylist
              const peopleAhead = displayQueue
                .slice(0, index)
                .filter((b) => b.staff_id === booking.staff_id && b.status !== 'in-progress').length;
              const queueDelay = peopleAhead * 20;

              const waitMins = Math.max(minsUntilAppt, queueDelay, 0);

              if (waitMins === 0) return `${timeString} · Next in chair`;
              if (waitMins >= 120) return `${timeString} · Later today`;
              return `${timeString} · Wait ~${waitMins} min`;
            };

            const isActive = booking.status === 'in-progress';

            return (
              <li
                key={booking.id}
                className={[
                  'group flex flex-col sm:flex-row sm:items-center gap-3 p-3.5',
                  'rounded-[var(--radius-md)] border transition-all duration-[var(--transition-fast)]',
                  isActive
                    ? 'bg-primary-soft border-primary/30'
                    : 'bg-surface-sunken/60 border-subtle hover:border-line',
                ].join(' ')}
              >
                <div className="flex items-center justify-between w-full sm:w-auto sm:flex-1 gap-3 min-w-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={[
                        'grid place-items-center h-9 w-9 shrink-0 rounded-[var(--radius-sm)]',
                        'text-[13px] font-semibold tabular-nums border',
                        isActive
                          ? 'bg-primary text-primary-contrast border-primary'
                          : 'bg-surface-elevated text-content-secondary border-subtle',
                      ].join(' ')}
                      aria-label={`Position ${index + 1}`}
                    >
                      {index + 1}
                    </span>
                    <span className="font-medium text-content text-[15px] truncate">
                      {maskName(booking.customer_name)}
                    </span>
                  </div>
                  <StatusBadge status={booking.status} className="sm:hidden shrink-0" />
                </div>

                <div className="flex flex-wrap items-center gap-2 pl-12 sm:pl-0 sm:flex-1 min-w-0">
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-content-secondary bg-surface-elevated border border-subtle rounded-[var(--radius-sm)] px-2 py-1">
                    <Scissors size={11} className="text-primary shrink-0" aria-hidden="true" />
                    <span className="truncate max-w-[9rem]">{booking.service}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-content-secondary bg-surface-elevated border border-subtle rounded-[var(--radius-sm)] px-2 py-1">
                    <User size={11} className="text-accent shrink-0" aria-hidden="true" />
                    <span className="truncate max-w-[8rem]">{booking.staff_name || 'Stylist'}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[12px] text-content-muted">
                    <Clock size={11} aria-hidden="true" />
                    {getWaitTime()}
                  </span>
                </div>

                <StatusBadge status={booking.status} className="hidden sm:inline-flex shrink-0" />
              </li>
            );
          })}
        </ol>
      )}

      <p className="flex items-center justify-center gap-2 text-[12px] text-content-muted mt-5 pt-4 border-t border-subtle m-0">
        <RefreshCw size={11} className="animate-spin" style={{ animationDuration: '3s' }} aria-hidden="true" />
        Live · updates every 10 seconds
      </p>
    </div>
  );
}
