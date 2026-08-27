import React, { useState, useEffect, useMemo } from 'react';
import { CalendarX } from 'lucide-react';

export default function BookingForm({ apiBase, onBooked }) {
  // Form States
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [paymentType, setPaymentType] = useState('deposit'); // 'deposit' or 'full'
  
  // Dynamic Config Data
  const [servicesList, setServicesList] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [serviceId, setServiceId] = useState('');
  const [staffId, setStaffId] = useState('');
  
  // Settings & Availability Data
  const [businessHours, setBusinessHours] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentSlot, setAppointmentSlot] = useState('');
  const [bookedSlots, setBookedSlots] = useState([]); 
  
  // UI States
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); 
  const [loading, setLoading] = useState(false);

  const todayString = new Date().toLocaleDateString('en-CA'); 

  useEffect(() => {
    const fetchSalonData = async () => {
      try {
        const [servicesRes, staffRes, hoursRes, blockedRes] = await Promise.all([
          fetch(`${apiBase}/bookings/services`),
          fetch(`${apiBase}/bookings/staff`),
          fetch(`${apiBase}/bookings/settings/hours`),
          fetch(`${apiBase}/bookings/settings/blocked-dates`)
        ]);
        
        const servicesData = await servicesRes.json();
        const staffData = await staffRes.json();
        
        setServicesList(servicesData);
        setStaffList(staffData);
        setBusinessHours(await hoursRes.json());
        setBlockedDates(await blockedRes.json());
        
        if (servicesData.length > 0) setServiceId(servicesData[0].id);
        if (staffData.length > 0) setStaffId(staffData[0].id);
      } catch (err) {
        console.error("Failed to load salon config", err);
      }
    };
    fetchSalonData();
  }, [apiBase]);

  useEffect(() => {
    if (!appointmentDate || !staffId) {
      setBookedSlots([]);
      return;
    }
    const fetchBookedSlots = async () => {
      try {
        const res = await fetch(`${apiBase}/bookings/booked-times?date=${appointmentDate}&staff_id=${staffId}`);
        if (res.ok) {
          const data = await res.json();
          setBookedSlots(data);
        }
      } catch (err) {
        console.error("Failed to fetch booked slots", err);
      }
    };
    fetchBookedSlots();
  }, [appointmentDate, staffId, apiBase]);

  const upcomingClosures = useMemo(() => {
    return blockedDates.filter(bd => bd.blocked_date >= todayString);
  }, [blockedDates, todayString]);

  const formatHolidayDate = (dateString) => {
    const [year, month, day] = dateString.split('-');
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const handleDateChange = (e) => {
    const selectedDate = e.target.value;
    setMessage('');
    
    const blockedDateEntry = blockedDates.find(bd => bd.blocked_date === selectedDate);
    if (blockedDateEntry) {
      setMessageType('error');
      setMessage(`Sorry, we are closed on this date. Reason: ${blockedDateEntry.reason}`);
      setAppointmentDate('');
      setAppointmentSlot('');
      return;
    }

    const dateObj = new Date(selectedDate);
    const dayOfWeek = dateObj.getUTCDay();
    const daySettings = businessHours.find(h => h.day_of_week === dayOfWeek);

    if (daySettings && daySettings.is_closed) {
      setMessageType('error');
      setMessage('Sorry, the salon is closed on this day of the week.');
      setAppointmentDate('');
      setAppointmentSlot('');
      return;
    }

    setAppointmentDate(selectedDate);
    setAppointmentSlot(''); 
  };

  const availableSlots = useMemo(() => {
    if (!appointmentDate || businessHours.length === 0) return [];

    const dateObj = new Date(appointmentDate);
    const dayOfWeek = dateObj.getUTCDay();
    const daySettings = businessHours.find(h => h.day_of_week === dayOfWeek);

    if (!daySettings || daySettings.is_closed) return [];

    const slots = [];
    const isToday = appointmentDate === todayString;
    const now = new Date();
    
    const [openH, openM] = daySettings.open_time.split(':').map(Number);
    const [closeH, closeM] = daySettings.close_time.split(':').map(Number);
    
    const startMins = openH * 60 + openM;
    const endMins = closeH * 60 + closeM;

    for (let currentMins = startMins; currentMins <= endMins; currentMins += 20) {
      const h = Math.floor(currentMins / 60);
      const m = currentMins % 60;
      
      const hour = h.toString().padStart(2, '0');
      const min = m.toString().padStart(2, '0');
      const timeString = `${hour}:${min}`;

      if (isToday) {
        const nowMins = now.getHours() * 60 + now.getMinutes();
        if (currentMins <= nowMins) continue;
      }
      
      if (bookedSlots.includes(timeString)) continue;
      slots.push(timeString);
    }
    return slots;
  }, [appointmentDate, todayString, bookedSlots, businessHours]);

  const formatTimeDisplay = (time24) => {
    const [h, m] = time24.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
    return `${displayHour}:${m} ${ampm}`;
  };

  // --- NEW: Calculate exact amounts for UI display ---
  const selectedServiceObj = servicesList.find(s => String(s.id) === String(serviceId));
  const uiFullPrice = selectedServiceObj ? Number(selectedServiceObj.price) : 0;
  const uiDepositPrice = Math.round(uiFullPrice * 0.30);

  // Handle Razorpay Checkout
  async function handlePaymentCheckout(e) {
    e.preventDefault(); 
    setLoading(true); 
    setMessage('');

    if (!appointmentDate || !appointmentSlot) {
      setMessageType('error');
      setMessage('Please select both a date and a time slot.');
      setLoading(false);
      return;
    }

    try {
      const [year, month, day] = appointmentDate.split('-');
      const [hour, minute] = appointmentSlot.split(':');
      const finalAppointmentTime = new Date(year, month - 1, day, hour, minute).toISOString();

      // Pass the payment_type flag to the backend
      const orderRes = await fetch(`${apiBase}/bookings/create-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          service_id: serviceId,
          staff_id: staffId,
          appointment_time: finalAppointmentTime,
          payment_type: paymentType
        })
      });
      const orderData = await orderRes.json();

      if (orderRes.status === 409) {
        setAppointmentSlot('');
        throw new Error(orderData.error);
      }
      
      if (!orderRes.ok) throw new Error(orderData.error);

      const options = {
        key: orderData.key_id,
        amount: orderData.payable_amount * 100,
        currency: orderData.currency,
        name: "SalonBooker",
        description: paymentType === 'full' ? "100% Appointment Payment" : "30% Appointment Deposit",
        order_id: orderData.order_id,
        handler: async function (response) {
          
          const verifyRes = await fetch(`${apiBase}/bookings/verify-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingData: {
                customer_name: customerName,
                phone,
                email,
                service_id: serviceId,
                staff_id: staffId,
                appointment_time: finalAppointmentTime,
                amount_paid: orderData.payable_amount // Pass the dynamically charged amount back
              }
            })
          });

          if (verifyRes.ok) {
            if (typeof onBooked === 'function') onBooked();
            setMessageType('success');
            setMessage(`✓ Payment of ₹${orderData.payable_amount} received! Appointment confirmed.`);
            setCustomerName(''); setPhone(''); setEmail(''); setAppointmentDate(''); setAppointmentSlot('');
          } else {
            setMessageType('error');
            setMessage('Payment verification failed. Please contact support.');
          }
        },
        prefill: { name: customerName, email: email, contact: phone },
        theme: { color: "#134611" }
      };

      const paymentObject = new window.Razorpay(options);
      
      paymentObject.on('payment.failed', function (response) {
        setMessageType('error');
        setMessage('Payment was cancelled or failed. Please try again.');
      });
      
      paymentObject.open();

    } catch (err) {
      setMessageType('error');
      setMessage(`✗ ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  const messageStyles = {
    'success': 'bg-[#96E072]/30 text-[#134611] border-l-4 border-[#3E8914]',
    'error': 'bg-red-100 text-red-700 border-l-4 border-red-500'
  };

  const inputClass = "w-full bg-white/50 backdrop-blur-sm p-2.5 md:p-[12px_14px] min-h-[48px] border-2 border-[#3DA35D]/40 rounded-xl text-[#134611] font-bold transition-all duration-300 focus:outline-none focus:border-[#3E8914] focus:bg-white/80 focus:ring-4 focus:ring-[#96E072]/40 placeholder-[#134611]/50";

  return (
    <div className="grid gap-4 md:gap-5 relative animate-slideIn">
      
      {upcomingClosures.length > 0 && (
        <div className="bg-amber-100/60 backdrop-blur-sm border border-amber-300/60 rounded-xl p-4 shadow-sm mb-2">
          <div className="flex items-center gap-2 text-amber-800 font-black mb-2 text-sm">
            <CalendarX size={18} />
            Upcoming Closures & Holidays
          </div>
          <ul className="m-0 pl-6 list-disc space-y-1">
            {upcomingClosures.map(holiday => (
              <li key={holiday.id} className="text-sm font-bold text-amber-900/80">
                <span className="text-amber-900">{formatHolidayDate(holiday.blocked_date)}</span> — {holiday.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handlePaymentCheckout} className="grid gap-4 md:gap-5">
        <div className="flex flex-col">
          <label htmlFor="name" className="text-[14px] font-bold text-[#134611] mb-2">Full Name *</label>
          <input id="name" type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Enter your name" required className={inputClass} />
        </div>
        
        <div className="flex flex-col">
          <label htmlFor="email" className="text-[14px] font-bold text-[#134611] mb-2">Email Address *</label>
          <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="For receipt & confirmation" required className={inputClass} />
        </div>
        
        <div className="flex flex-col">
          <label htmlFor="phone" className="text-[14px] font-bold text-[#134611] mb-2">Phone Number *</label>
          <input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Required for payment verification" required className={inputClass} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          <div className="flex flex-col">
            <label htmlFor="service" className="text-[14px] font-bold text-[#134611] mb-2">Service *</label>
            <select id="service" value={serviceId} onChange={e => setServiceId(e.target.value)} required className={inputClass}>
              {servicesList.length === 0 && <option value="">Loading services...</option>}
              {servicesList.map(s => (
                <option key={s.id} value={s.id}>{s.name} - ₹{s.price}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label htmlFor="staff" className="text-[14px] font-bold text-[#134611] mb-2">Preferred Stylist *</label>
            <select id="staff" value={staffId} onChange={e => { setStaffId(e.target.value); setAppointmentSlot(''); }} required className={inputClass}>
              {staffList.length === 0 && <option value="">Loading staff...</option>}
              {staffList.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          <div className="flex flex-col">
            <label htmlFor="date" className="text-[14px] font-bold text-[#134611] mb-2">Date *</label>
            <input id="date" type="date" min={todayString} value={appointmentDate} onChange={handleDateChange} required className={inputClass} />
          </div>
          <div className="flex flex-col">
            <label htmlFor="time" className="text-[14px] font-bold text-[#134611] mb-2">Time Slot *</label>
            <select 
              id="time" value={appointmentSlot} onChange={e => setAppointmentSlot(e.target.value)} required 
              disabled={!appointmentDate} className={`${inputClass} ${!appointmentDate ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <option value="" disabled>{!appointmentDate ? 'Select a date first' : 'Choose a time'}</option>
              {availableSlots.length > 0 ? (
                availableSlots.map(slot => (<option key={slot} value={slot}>{formatTimeDisplay(slot)}</option>))
              ) : (
                appointmentDate && <option value="" disabled>No slots available</option>
              )}
            </select>
          </div>
        </div>

        {/* --- NEW: Payment Options Radio Buttons --- */}
        <div className="flex flex-col mt-2">
          <label className="text-[14px] font-bold text-[#134611] mb-3">Payment Option *</label>
          <div className="flex flex-col sm:flex-row gap-3">
            <label className={`flex-1 p-3.5 rounded-xl border-2 flex items-start gap-3 cursor-pointer transition-all ${paymentType === 'deposit' ? 'border-[#3E8914] bg-[#96E072]/20' : 'border-[#3DA35D]/40 bg-white/50 hover:border-[#3E8914]/50'}`}>
              <input 
                type="radio" 
                name="paymentType" 
                value="deposit" 
                checked={paymentType === 'deposit'} 
                onChange={() => setPaymentType('deposit')} 
                className="w-4 h-4 mt-0.5 accent-[#3E8914]" 
              />
              <div className="flex flex-col">
                <span className="text-[#134611] font-black text-[15px]">Pay 30% Deposit</span>
                <span className="text-[#3DA35D] font-bold text-[13px] mt-1">₹{uiDepositPrice} now, rest at salon</span>
              </div>
            </label>
            
            <label className={`flex-1 p-3.5 rounded-xl border-2 flex items-start gap-3 cursor-pointer transition-all ${paymentType === 'full' ? 'border-[#3E8914] bg-[#96E072]/20' : 'border-[#3DA35D]/40 bg-white/50 hover:border-[#3E8914]/50'}`}>
              <input 
                type="radio" 
                name="paymentType" 
                value="full" 
                checked={paymentType === 'full'} 
                onChange={() => setPaymentType('full')} 
                className="w-4 h-4 mt-0.5 accent-[#3E8914]" 
              />
              <div className="flex flex-col">
                <span className="text-[#134611] font-black text-[15px]">Pay 100% Upfront</span>
                <span className="text-[#3DA35D] font-bold text-[13px] mt-1">₹{uiFullPrice} now, nothing due later</span>
              </div>
            </label>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading || !appointmentDate || !appointmentSlot || !serviceId || !staffId} 
          className="mt-3 py-4 px-6 bg-[#3E8914] text-[#E8FCCF] border-none rounded-xl text-[16px] font-black cursor-pointer transition-all duration-300 hover:not(:disabled):bg-[#134611] hover:not(:disabled):shadow-[0_8px_20px_rgba(19,70,17,0.3)] hover:not(:disabled):-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? 'Connecting to Secure Checkout...' : `Pay ₹${paymentType === 'full' ? uiFullPrice : uiDepositPrice} & Book →`}
        </button>
      </form>

      {message && (
        <div className={`p-4 rounded-xl font-bold text-[14px] animate-slideIn ${messageStyles[messageType]}`}>
          {message}
        </div>
      )}
    </div>
  );
}