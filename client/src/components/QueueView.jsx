import React, { useEffect, useState } from 'react';
import { Clock, RefreshCw, Scissors } from 'lucide-react';

export default function QueueView({ apiBase, refreshKey }) {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchQueue() {
    try {
      setLoading(true);
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

  const displayQueue = queue.filter(booking => {
    const bookingDate = new Date(booking.appointment_time);
    const today = new Date();
    return bookingDate.toDateString() === today.toDateString();
  });

  if (loading && queue.length === 0) {
    return <div className="text-center py-10 px-5 text-[#99582A] font-bold text-sm flex flex-col items-center gap-3">
      <RefreshCw className="animate-spin" size={24} />
      Loading live queue...
    </div>;
  }

const indicatorColors = {
    'queued': 'bg-[#96E072]',
    'in-progress': 'bg-[#3DA35D]',
    'completed': 'bg-[#3E8914]',
    'cancelled': 'bg-red-500'
  };

  const chipColors = {
    'queued': 'bg-[#96E072]/20 text-[#134611] ring-1 ring-[#96E072]/50',
    'in-progress': 'bg-[#3DA35D]/20 text-[#134611] ring-1 ring-[#3DA35D]/50',
    'completed': 'bg-[#3E8914]/20 text-[#134611] ring-1 ring-[#3E8914]/50',
    'cancelled': 'bg-red-50 text-red-700 ring-1 ring-red-200'
  };

  return (
    <div className="flex flex-col">
      {displayQueue.length === 0 ? (
        <div className="text-center py-12 px-5 text-[#3DA35D] flex flex-col items-center gap-3 bg-white/40 rounded-2xl border border-dashed border-[#3DA35D]/50">
          <Clock size={32} className="text-[#3DA35D]" />
          <p className="text-base font-bold m-0">No appointments in the queue today</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 md:max-h-125 overflow-y-auto pr-2 custom-scrollbar">
          {displayQueue.map((booking, index) => (
            <div key={booking.id} className="group flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-white/70 backdrop-blur-md border border-[#3DA35D]/30 rounded-2xl transition-all duration-300 hover:shadow-[0_8px_20px_rgba(19,70,17,0.1)] hover:border-[#3E8914]">
              
              <div className="flex items-center justify-between w-full sm:w-auto sm:flex-1 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 flex items-center justify-center bg-[#134611] text-[#E8FCCF] rounded-xl font-bold text-sm shadow-sm group-hover:bg-[#3E8914] transition-colors">
                    {index + 1}
                  </div>
                  <div className="font-bold text-[#134611] text-base truncate">
                    {booking.customer_name}
                  </div>
                </div>

                <div className="flex sm:hidden items-center gap-2 shrink-0">
                  <div className={`w-2 h-2 rounded-full ${indicatorColors[booking.status]}`}></div>
                  <div className={`px-2.5 py-1 text-[10px] rounded-md font-bold uppercase tracking-wide ${chipColors[booking.status]}`}>
                    {booking.status.replace('-', ' ')}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pl-13 sm:pl-0 sm:flex-1">
                <div className="flex items-center gap-1.5 text-[#134611] bg-[#E8FCCF]/60 px-2.5 py-1.5 rounded-lg text-xs font-bold border border-[#3DA35D]/30">
                  <Scissors size={12} className="text-[#3E8914]"/> {booking.service}
                </div>
                <div className="flex items-center gap-1.5 text-[#3DA35D] text-xs font-bold">
                  <Clock size={12} /> {new Date(booking.appointment_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-3 shrink-0">
                <div className={`w-2.5 h-2.5 rounded-full ${indicatorColors[booking.status]}`}></div>
                <div className={`px-3 py-1.5 text-xs rounded-lg font-bold uppercase tracking-wider ${chipColors[booking.status]}`}>
                  {booking.status.replace('-', ' ')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center justify-center gap-2 text-[#3DA35D] text-xs mt-6 pt-4 border-t border-[#3DA35D]/30 font-bold">
        <RefreshCw size={12} className="animate-spin" style={{ animationDuration: '3s' }} /> 
        Live updating every 10 seconds
      </div>
    </div>
  );
}