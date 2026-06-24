import React, { useState } from 'react';

export default function BookingForm({ apiBase, onBooked }) {
  const [step, setStep] = useState(1); // 1 = Details, 2 = OTP Verification
  
  // Form Data
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [service, setService] = useState('Haircut');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [otp, setOtp] = useState('');

  // UI States
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); 
  const [loading, setLoading] = useState(false);

  // Step 1: Send Details & Request OTP
  async function handleRequestOtp(e) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    const appointmentDate = new Date(appointmentTime);
    const payload = {
      customer_name: customerName,
      phone,
      email,
      service,
      appointment_time: appointmentDate.toISOString()
    };

    try {
      const res = await fetch(`${apiBase}/bookings/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to request OTP');
      
      setMessageType('success');
      setMessage('✓ OTP sent to your email!');
      setStep(2); // Move to OTP step
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessageType('error');
      setMessage(`✗ ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Step 2: Verify OTP & Finalize Booking
  async function handleVerifyOtp(e) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch(`${apiBase}/bookings/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to verify OTP');
      
      if (typeof onBooked === 'function') {
        onBooked();
      }
      
      setMessageType('success');
      setMessage('✓ Booking confirmed! Your appointment has been scheduled.');
      
      // Reset Form
      setStep(1);
      setCustomerName('');
      setPhone('');
      setEmail('');
      setOtp('');
      setAppointmentTime('');
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setMessageType('error');
      setMessage(`✗ ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  const messageStyles = {
    'success': 'bg-[#d4edda] text-[#155724] border-l-4 border-[#28a745]',
    'error': 'bg-[#f8d7da] text-[#721c24] border-l-4 border-[#f5c6cb]'
  };

  return (
    <div className="grid gap-4 md:gap-5">
      {step === 1 ? (
        <form onSubmit={handleRequestOtp} className="grid gap-4 md:gap-5">
          <div className="flex flex-col">
            <label htmlFor="name" className="text-[14px] font-semibold text-[#333] mb-2">Full Name *</label>
            <input
              id="name"
              type="text"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              placeholder="Enter your name"
              required
              className="p-2.5 md:p-[12px_14px] border-2 border-[#e0e0e0] rounded-lg text-[16px] md:text-[14px] transition-all duration-300 focus:outline-none focus:border-[#667eea] focus:shadow-[0_0_0_3px_rgba(102,126,234,0.1)] placeholder-[#999]"
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="email" className="text-[14px] font-semibold text-[#333] mb-2">Email Address *</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="For OTP verification"
              required
              className="p-2.5 md:p-[12px_14px] border-2 border-[#e0e0e0] rounded-lg text-[16px] md:text-[14px] transition-all duration-300 focus:outline-none focus:border-[#667eea] focus:shadow-[0_0_0_3px_rgba(102,126,234,0.1)] placeholder-[#999]"
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="phone" className="text-[14px] font-semibold text-[#333] mb-2">Phone Number</label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="(optional) Your phone number"
              className="p-2.5 md:p-[12px_14px] border-2 border-[#e0e0e0] rounded-lg text-[16px] md:text-[14px] transition-all duration-300 focus:outline-none focus:border-[#667eea] focus:shadow-[0_0_0_3px_rgba(102,126,234,0.1)] placeholder-[#999]"
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="service" className="text-[14px] font-semibold text-[#333] mb-2">Service *</label>
            <select
              id="service"
              value={service}
              onChange={e => setService(e.target.value)}
              className="p-2.5 md:p-[12px_14px] border-2 border-[#e0e0e0] rounded-lg text-[16px] md:text-[14px] transition-all duration-300 focus:outline-none focus:border-[#667eea] focus:shadow-[0_0_0_3px_rgba(102,126,234,0.1)] bg-white"
            >
              <option value="Haircut">Haircut</option>
              <option value="Hair Color">Hair Color</option>
              <option value="Styling">Styling</option>
              <option value="Treatment">Hair Treatment</option>
              <option value="Beard Trim">Beard Trim</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label htmlFor="time" className="text-[14px] font-semibold text-[#333] mb-2">Appointment Date & Time *</label>
            <input
              id="time"
              type="datetime-local"
              value={appointmentTime}
              onChange={e => setAppointmentTime(e.target.value)}
              required
              className="p-2.5 md:p-[12px_14px] border-2 border-[#e0e0e0] rounded-lg text-[16px] md:text-[14px] transition-all duration-300 focus:outline-none focus:border-[#667eea] focus:shadow-[0_0_0_3px_rgba(102,126,234,0.1)]"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="mt-2 py-3 px-5 md:py-3.5 md:px-6 bg-linear-to-br from-[#667eea] to-[#764ba2] text-white border-none rounded-lg text-[14px] md:text-[16px] font-semibold cursor-pointer transition-all duration-300 hover:not(:disabled):-translate-y-0.5 hover:not(:disabled):shadow-[0_8px_20px_rgba(102,126,234,0.3)] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending Verification...' : 'Continue to Verification →'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="grid gap-4 md:gap-5 bg-gray-50 p-6 rounded-lg border border-gray-200">
          <div className="text-center mb-2">
            <h4 className="text-lg font-bold text-[#333] m-0">Check your email</h4>
            <p className="text-sm text-gray-600 mt-1">We sent a 6-digit code to <strong>{email}</strong></p>
          </div>
          
          <div className="flex flex-col">
            <input
              type="text"
              maxLength="6"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} // Allow only numbers
              placeholder="000000"
              required
              className="text-center tracking-[0.5em] font-bold p-3.5 border-2 border-[#e0e0e0] rounded-lg text-[20px] transition-all duration-300 focus:outline-none focus:border-[#667eea] focus:shadow-[0_0_0_3px_rgba(102,126,234,0.1)]"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading || otp.length < 6}
            className="mt-2 py-3 px-5 bg-linear-to-br from-[#28a745] to-[#218838] text-white border-none rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:not(:disabled):-translate-y-0.5 hover:not(:disabled):shadow-[0_8px_20px_rgba(40,167,69,0.3)] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Verifying...' : '✓ Confirm Booking'}
          </button>
          
          <button 
            type="button"
            onClick={() => setStep(1)}
            className="text-sm text-[#667eea] hover:underline font-medium text-center bg-transparent border-none cursor-pointer"
          >
            ← Back to edit details
          </button>
        </form>
      )}

      {message && (
        <div className={`p-[12px_16px] rounded-lg font-medium text-[14px] animate-slideIn ${messageStyles[messageType]}`}>
          {message}
        </div>
      )}
    </div>
  );
}