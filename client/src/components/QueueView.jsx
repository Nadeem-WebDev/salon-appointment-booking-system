import React, { useEffect, useState } from 'react';

export default function QueueView({ apiBase, refreshKey }) {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchQueue() {
    try {
      setLoading(true);
      // Fetch only the active live queue
      const url = `${apiBase}/bookings/queue`;
      const res = await fetch(url);
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
    const iv = setInterval(fetchQueue, 10000);
    return () => clearInterval(iv);
  }, [refreshKey]);

  // Filter the queue to ONLY show appointments for the current day
  const displayQueue = queue.filter(booking => {
    const bookingDate = new Date(booking.appointment_time);
    const today = new Date();
    // Compare just the date portion (e.g., "Tue Oct 24 2023")
    return bookingDate.toDateString() === today.toDateString();
  });

  if (loading && queue.length === 0) {
    return <div className="flex flex-col"><div className="text-center py-10 px-5 text-[#999] text-[14px]">Loading queue...</div></div>;
  }

  const indicatorColors = {
    'queued': 'bg-[#ffc107]',
    'in-progress': 'bg-[#17a2b8]',
    'completed': 'bg-[#28a745]',
    'cancelled': 'bg-[#dc3545]'
  };

  const chipColors = {
    'queued': 'bg-[#ffc107]/15 text-[#856404]',
    'in-progress': 'bg-[#17a2b8]/15 text-[#0c5460]',
    'completed': 'bg-[#28a745]/15 text-[#155724]',
    'cancelled': 'bg-[#dc3545]/15 text-[#721c24]'
  };

  return (
    <div className="flex flex-col">
      {displayQueue.length === 0 ? (
        <div className="text-center py-10 px-5 text-[#999]">
          <p className="text-[16px] m-0">No appointments in today's queue</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 md:max-h-125 overflow-y-auto pr-1">
          {displayQueue.map((booking, index) => (
            <div key={booking.id} className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4 p-3.5 md:p-4 bg-linear-to-br from-[#f5f7fa] to-[#c3cfe2] rounded-lg transition-all duration-300 border-l-4 border-[#667eea] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:translate-x-1">
              
              {/* TOP ROW (Mobile) / LEFT COLUMN (Desktop) */}
              <div className="flex items-center justify-between w-full sm:w-auto sm:flex-1 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="min-w-9 h-9 md:min-w-10 md:h-10 flex items-center justify-center bg-linear-to-br from-[#667eea] to-[#764ba2] text-white rounded-full font-bold text-[14px] md:text-[16px] shrink-0 shadow-sm">
                    {index + 1}
                  </div>
                  <div className="font-semibold text-[#333] text-[15px] md:text-[16px] truncate">
                    {booking.customer_name}
                  </div>
                </div>

                {/* Status indicator - Mobile Only (Top Right) */}
                <div className="flex sm:hidden items-center gap-2 shrink-0">
                  <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${indicatorColors[booking.status]}`}></div>
                  <div className={`py-1 px-2.5 text-[10px] rounded-full font-bold capitalize border border-black/5 whitespace-nowrap ${chipColors[booking.status]}`}>
                    {booking.status.replace('-', ' ')}
                  </div>
                </div>
              </div>

              {/* BOTTOM ROW (Mobile) / MIDDLE COLUMN (Desktop) */}
              <div className="flex flex-wrap items-center gap-2.5 pl-12 sm:pl-0 sm:flex-1">
                <span className="bg-[#667eea]/15 text-[#667eea] py-1 px-3 rounded-full font-medium text-[11px] md:text-[12px] whitespace-nowrap border border-[#667eea]/20">
                  {booking.service}
                </span>
                <span className="text-[#555] font-medium text-[11px] md:text-[13px] whitespace-nowrap">
                  {new Date(booking.appointment_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Status indicator - Desktop Only (Far Right) */}
              <div className="hidden sm:flex items-center gap-3 shrink-0">
                <div className={`w-3 h-3 rounded-full animate-pulse ${indicatorColors[booking.status]}`}></div>
                <div className={`py-1 px-3 text-[12px] rounded-full font-bold capitalize border border-black/5 whitespace-nowrap ${chipColors[booking.status]}`}>
                  {booking.status.replace('-', ' ')}
                </div>
              </div>
              
            </div>
          ))}
        </div>
      )}
      <div className="text-center text-[#999] text-[12px] mt-4 pt-4 border-t border-[#e0e0e0]">
        ↻ Auto-refreshing every 10 seconds
      </div>
    </div>
  );
}