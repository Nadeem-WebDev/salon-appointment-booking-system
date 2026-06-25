import React, { useState } from 'react';

export default function BookingForm({ apiBase, onBooked }) {
  const [step, setStep] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [service, setService] = useState('Haircut');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); 
  const [loading, setLoading] = useState(false);

  // ... (keep handleRequestOtp and handleVerifyOtp the same) ...
  async function handleRequestOtp(e) {
    e.preventDefault(); setLoading(true); setMessage('');
    const payload = { customer_name: customerName, phone, email, service, appointment_time: new Date(appointmentTime).toISOString() };
    try {
      const res = await fetch(`${apiBase}/bookings/request-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to request OTP');
      setMessageType('success'); setMessage('✓ OTP sent to your email!'); setStep(2); setTimeout(() => setMessage(''), 3000);
    } catch (err) { setMessageType('error'); setMessage(`✗ ${err.message}`); } finally { setLoading(false); }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault(); setLoading(true); setMessage('');
    try {
      const res = await fetch(`${apiBase}/bookings/verify-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, otp }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to verify OTP');
      if (typeof onBooked === 'function') onBooked();
      setMessageType('success'); setMessage('✓ Booking confirmed! Your appointment has been scheduled.');
      setStep(1); setCustomerName(''); setPhone(''); setEmail(''); setOtp(''); setAppointmentTime('');
      setTimeout(() => setMessage(''), 4000);
    } catch (err) { setMessageType('error'); setMessage(`✗ ${err.message}`); } finally { setLoading(false); }
  }

  const messageStyles = {
    'success': 'bg-[#96E072]/30 text-[#134611] border-l-4 border-[#3E8914]',
    'error': 'bg-red-100 text-red-700 border-l-4 border-red-500'
  };

  const inputClass = "w-full bg-white/60 p-2.5 md:p-[12px_14px] min-h-[48px] border-2 border-[#3DA35D]/50 rounded-xl text-[#134611] transition-all duration-300 focus:outline-none focus:border-[#3E8914] focus:bg-white focus:ring-4 focus:ring-[#96E072]/50 placeholder-[#3DA35D]";

  return (
    <div className="grid gap-4 md:gap-5 relative">
      {step === 1 ? (
        <form onSubmit={handleRequestOtp} className="grid gap-4 md:gap-5">
          <div className="flex flex-col">
            <label htmlFor="name" className="text-[14px] font-bold text-[#134611] mb-2">Full Name *</label>
            <input id="name" type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Enter your name" required className={inputClass} />
          </div>
          <div className="flex flex-col">
            <label htmlFor="email" className="text-[14px] font-bold text-[#134611] mb-2">Email Address *</label>
            <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="For OTP verification" required className={inputClass} />
          </div>
          <div className="flex flex-col">
            <label htmlFor="phone" className="text-[14px] font-bold text-[#134611] mb-2">Phone Number</label>
            <input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(optional) Your phone number" className={inputClass} />
          </div>
          <div className="flex flex-col">
            <label htmlFor="service" className="text-[14px] font-bold text-[#134611] mb-2">Service *</label>
            <select id="service" value={service} onChange={e => setService(e.target.value)} className={inputClass}>
              <option value="Haircut">Haircut</option>
              <option value="Hair Color">Hair Color</option>
              <option value="Styling">Styling</option>
              <option value="Treatment">Hair Treatment</option>
              <option value="Beard Trim">Beard Trim</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label htmlFor="time" className="text-[14px] font-bold text-[#134611] mb-2">Appointment Date & Time *</label>
            <input id="time" type="datetime-local" value={appointmentTime} onChange={e => setAppointmentTime(e.target.value)} required className={inputClass} />
          </div>

          <button type="submit" disabled={loading} className="mt-2 py-3.5 px-6 bg-[#3E8914] text-[#E8FCCF] border-none rounded-xl text-[16px] font-bold cursor-pointer transition-all duration-300 hover:not(:disabled):bg-[#134611] hover:not(:disabled):shadow-[0_8px_20px_rgba(19,70,17,0.3)] hover:not(:disabled):-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? 'Sending Verification...' : 'Continue to Verification →'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="grid gap-4 md:gap-5 bg-white/50 backdrop-blur-md p-6 rounded-2xl border border-[#3DA35D]/30">
          <div className="text-center mb-2">
            <h4 className="text-xl font-black text-[#134611] m-0">Check your email</h4>
            <p className="text-sm text-[#3E8914] mt-1">We sent a 6-digit code to <strong>{email}</strong></p>
          </div>
          <div className="flex flex-col">
            <input type="text" maxLength="6" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="000000" required className="text-center tracking-[0.5em] font-black p-4 border-2 border-[#3DA35D] rounded-xl text-[24px] text-[#134611] bg-white transition-all focus:outline-none focus:border-[#3E8914] focus:ring-4 focus:ring-[#96E072]/50" />
          </div>
          <button type="submit" disabled={loading || otp.length < 6} className="mt-2 py-3.5 px-5 bg-[#134611] text-[#E8FCCF] border-none rounded-xl font-bold text-lg cursor-pointer transition-all duration-300 hover:not(:disabled):bg-[#3E8914] hover:not(:disabled):shadow-[0_8px_20px_rgba(62,137,20,0.3)] hover:not(:disabled):-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed w-full">
            {loading ? 'Verifying...' : '✓ Confirm Booking'}
          </button>
          <button type="button" onClick={() => setStep(1)} className="text-sm text-[#3DA35D] hover:text-[#134611] hover:underline font-bold text-center bg-transparent border-none cursor-pointer w-full mt-2">
            ← Back to edit details
          </button>
        </form>
      )}

      {message && (
        <div className={`p-4 rounded-xl font-bold text-[14px] animate-slideIn ${messageStyles[messageType]}`}>
          {message}
        </div>
      )}
    </div>
  );
}