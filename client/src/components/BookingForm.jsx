import React, { useState, useEffect, useMemo } from 'react';
import { CalendarX, Coins, CreditCard, Scissors, UserRound, CalendarDays } from 'lucide-react';
import { Alert, Button, Checkbox, Field, Input, RadioCard, Select } from './ui/index.js';
import { brand } from '../theme/theme.js';

/** Small numbered section heading, so the flow reads as clear steps. */
function Step({ index, icon: Icon, title, children }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-2.5">
        <span className="grid place-items-center h-6 w-6 shrink-0 rounded-full bg-primary-soft border border-primary/25 text-primary text-[11px] font-semibold tabular-nums">
          {index}
        </span>
        <h4 className="m-0 text-[13px] font-semibold uppercase tracking-[0.09em] text-content-secondary flex items-center gap-1.5">
          {Icon && <Icon size={13} className="text-primary" aria-hidden="true" />}
          {title}
        </h4>
        <span className="flex-1 h-px bg-[var(--border-subtle)]" aria-hidden="true" />
      </div>
      {children}
    </section>
  );
}

export default function BookingForm({ apiBase, onBooked }) {
  // Form States
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [paymentType, setPaymentType] = useState('deposit'); // 'deposit' or 'full'
  const [walletBalance, setWalletBalance] = useState(0);
  const [redeemCoins, setRedeemCoins] = useState(false);

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
          fetch(`${apiBase}/bookings/settings/blocked-dates`),
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
        console.error('Failed to load salon config', err);
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
        if (res.ok) setBookedSlots(await res.json());
      } catch (err) {
        console.error('Failed to fetch booked slots', err);
      }
    };
    fetchBookedSlots();
  }, [appointmentDate, staffId, apiBase]);

  useEffect(() => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      fetch(`${apiBase}/bookings/check-wallet/${cleanPhone}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.exists) {
            setWalletBalance(Number(data.supercoins));
            setCustomerName((prev) => prev || data.name);
          } else {
            setWalletBalance(0);
            setRedeemCoins(false);
          }
        })
        .catch((err) => console.error('Wallet check failed:', err));
    } else {
      setWalletBalance(0);
      setRedeemCoins(false);
    }
  }, [phone, apiBase]);

  const upcomingClosures = useMemo(
    () => blockedDates.filter((bd) => bd.blocked_date >= todayString),
    [blockedDates, todayString]
  );

  const formatHolidayDate = (dateString) => {
    const [year, month, day] = dateString.split('-');
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const handleDateChange = (e) => {
    const selectedDate = e.target.value;
    setMessage('');

    const blockedDateEntry = blockedDates.find((bd) => bd.blocked_date === selectedDate);
    if (blockedDateEntry) {
      setMessageType('error');
      setMessage(`Sorry, we are closed on this date. Reason: ${blockedDateEntry.reason}`);
      setAppointmentDate('');
      setAppointmentSlot('');
      return;
    }

    const dateObj = new Date(selectedDate);
    const dayOfWeek = dateObj.getUTCDay();
    const daySettings = businessHours.find((h) => h.day_of_week === dayOfWeek);

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
    const daySettings = businessHours.find((h) => h.day_of_week === dayOfWeek);

    if (!daySettings || daySettings.is_closed) return [];

    const slots = [];
    const isToday = appointmentDate === todayString;
    const now = new Date();

    const [openH, openM] = daySettings.open_time.split(':').map(Number);
    const [closeH, closeM] = daySettings.close_time.split(':').map(Number);

    const startMins = openH * 60 + openM;
    const endMins = closeH * 60 + closeM;

    for (let currentMins = startMins; currentMins <= endMins; currentMins += 30) {
      const h = Math.floor(currentMins / 60);
      const m = currentMins % 60;

      const timeString = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

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
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${m} ${ampm}`;
  };

  // --- Amounts, including Supercoin discount ---
  const selectedServiceObj = servicesList.find((s) => String(s.id) === String(serviceId));
  const baseFullPrice = selectedServiceObj ? Number(selectedServiceObj.price) : 0;
  const discountAmount = redeemCoins && walletBalance >= 1000 && baseFullPrice >= 1000 ? 1000 : 0;

  const uiFullPrice = Math.max(0, baseFullPrice - discountAmount);
  const uiDepositPrice = Math.round(uiFullPrice * 0.3);
  const payableNow = paymentType === 'full' ? uiFullPrice : uiDepositPrice;

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

      const orderRes = await fetch(`${apiBase}/bookings/create-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: serviceId,
          staff_id: staffId,
          appointment_time: finalAppointmentTime,
          payment_type: paymentType,
          phone: phone,
          redeem_coins: redeemCoins,
        }),
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
        name: 'SalonBooker',
        description: paymentType === 'full' ? '100% Appointment Payment' : '30% Appointment Deposit',
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
                amount_paid: orderData.payable_amount,
                redeem_coins: redeemCoins,
              },
            }),
          });

          if (verifyRes.ok) {
            if (typeof onBooked === 'function') onBooked();
            setMessageType('success');
            setMessage(`Payment of ₹${orderData.payable_amount} received. Your appointment is confirmed.`);
            setCustomerName('');
            setPhone('');
            setEmail('');
            setAppointmentDate('');
            setAppointmentSlot('');
          } else {
            const errorData = await verifyRes.json();
            setMessageType('error');
            setMessage(errorData.error || 'Payment verification failed. Please contact support.');
          }
        },
        prefill: { name: customerName, email: email, contact: phone },
        theme: { color: brand.primary },
      };

      const paymentObject = new window.Razorpay(options);

      paymentObject.on('payment.failed', function () {
        setMessageType('error');
        setMessage('Payment was cancelled or failed. Please try again.');
      });

      paymentObject.open();
    } catch (err) {
      setMessageType('error');
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = appointmentDate && appointmentSlot && serviceId && staffId;

  return (
    <div className="flex flex-col gap-6">
      {upcomingClosures.length > 0 && (
        <Alert tone="warning">
          <p className="flex items-center gap-2 font-semibold m-0 mb-2">
            <CalendarX size={15} aria-hidden="true" /> Upcoming closures
          </p>
          <ul className="m-0 pl-4 space-y-1 list-disc marker:text-warning">
            {upcomingClosures.map((holiday) => (
              <li key={holiday.id} className="text-[13px] font-normal text-content-secondary">
                <span className="text-content font-medium">{formatHolidayDate(holiday.blocked_date)}</span>
                {' — '}
                {holiday.reason}
              </li>
            ))}
          </ul>
        </Alert>
      )}

      <form onSubmit={handlePaymentCheckout} className="flex flex-col gap-7">
        <Step index={1} icon={UserRound} title="Your details">
          <div className="grid gap-4">
            <Field label="Full name" htmlFor="name" required>
              <Input
                id="name"
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter your name"
                required
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Email address" htmlFor="email" required hint="For your receipt">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </Field>
              <Field label="Phone number" htmlFor="phone" required hint="Used to verify payment">
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit mobile"
                  required
                />
              </Field>
            </div>
          </div>
        </Step>

        <Step index={2} icon={Scissors} title="Service & stylist">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Service" htmlFor="service" required>
              <Select
                id="service"
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                required
              >
                {servicesList.length === 0 && <option value="">Loading services…</option>}
                {servicesList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — ₹{s.price}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Preferred stylist" htmlFor="staff" required>
              <Select
                id="staff"
                value={staffId}
                onChange={(e) => {
                  setStaffId(e.target.value);
                  setAppointmentSlot('');
                }}
                required
              >
                {staffList.length === 0 && <option value="">Loading staff…</option>}
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </Step>

        <Step index={3} icon={CalendarDays} title="Date & time">
          <Field label="Date" htmlFor="date" required>
            <Input
              id="date"
              type="date"
              min={todayString}
              value={appointmentDate}
              onChange={handleDateChange}
              required
            />
          </Field>

          <fieldset className="border-none p-0 m-0 min-w-0">
            <legend className="text-[11px] font-semibold uppercase tracking-[0.07em] text-content-secondary mb-2 p-0">
              Time slot <span className="text-primary">*</span>
            </legend>

            {!appointmentDate ? (
              <p className="m-0 text-[13px] text-content-muted bg-surface-sunken border border-dashed border-line rounded-[var(--radius-md)] px-4 py-4 text-center">
                Choose a date to see available times.
              </p>
            ) : availableSlots.length === 0 ? (
              <p className="m-0 text-[13px] text-content-secondary bg-danger-soft border border-danger/20 rounded-[var(--radius-md)] px-4 py-4 text-center">
                No slots available for this date. Try another day or stylist.
              </p>
            ) : (
              <div
                role="radiogroup"
                aria-label="Available time slots"
                className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-52 overflow-y-auto custom-scrollbar pr-1"
              >
                {availableSlots.map((slot) => {
                  const selected = appointmentSlot === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setAppointmentSlot(slot)}
                      className={[
                        'h-10 rounded-[var(--radius-sm)] text-[13px] font-medium tabular-nums cursor-pointer',
                        'border transition-all duration-[var(--transition-fast)]',
                        selected
                          ? 'bg-primary text-primary-contrast border-primary shadow-[var(--shadow-glow)]'
                          : 'bg-surface-sunken text-content-secondary border-line hover:border-primary/50 hover:text-content',
                      ].join(' ')}
                    >
                      {formatTimeDisplay(slot)}
                    </button>
                  );
                })}
              </div>
            )}
          </fieldset>
        </Step>

        {walletBalance > 0 && (
          <div className="rounded-[var(--radius-md)] border border-primary/20 bg-primary-soft p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="grid place-items-center h-9 w-9 shrink-0 rounded-full bg-primary/15 text-primary border border-primary/25">
                <Coins size={16} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">
                  Loyalty wallet
                </p>
                <p className="m-0 text-sm text-content mt-0.5 tabular-nums">
                  {walletBalance.toLocaleString()} coins
                </p>
              </div>
            </div>

            {walletBalance >= 1000 ? (
              baseFullPrice >= 1000 ? (
                <Checkbox
                  id="redeem"
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
                {(1000 - walletBalance).toLocaleString()} more coins for a discount.
              </p>
            )}
          </div>
        )}

        <Step index={4} icon={CreditCard} title="Payment">
          <div className="flex flex-col sm:flex-row gap-3">
            <RadioCard
              id="pay-deposit"
              name="paymentType"
              value="deposit"
              checked={paymentType === 'deposit'}
              onChange={() => setPaymentType('deposit')}
              label="Pay 30% deposit"
              description={`₹${uiDepositPrice.toLocaleString()} now, rest at the salon`}
            />
            <RadioCard
              id="pay-full"
              name="paymentType"
              value="full"
              checked={paymentType === 'full'}
              onChange={() => setPaymentType('full')}
              label="Pay 100% upfront"
              description={`₹${uiFullPrice.toLocaleString()} now, nothing due later`}
            />
          </div>

          {selectedServiceObj && (
            <dl className="m-0 rounded-[var(--radius-md)] border border-subtle bg-surface-sunken divide-y divide-[var(--border-subtle)]">
              <div className="flex items-center justify-between px-4 py-2.5">
                <dt className="m-0 text-[13px] text-content-secondary">{selectedServiceObj.name}</dt>
                <dd className="m-0 text-[13px] text-content tabular-nums">
                  ₹{baseFullPrice.toLocaleString()}
                </dd>
              </div>
              {discountAmount > 0 && (
                <div className="flex items-center justify-between px-4 py-2.5">
                  <dt className="m-0 text-[13px] text-primary">Supercoin discount</dt>
                  <dd className="m-0 text-[13px] text-primary tabular-nums">
                    −₹{discountAmount.toLocaleString()}
                  </dd>
                </div>
              )}
              <div className="flex items-center justify-between px-4 py-3">
                <dt className="m-0 text-[13px] font-semibold text-content">Payable now</dt>
                <dd className="m-0 font-display text-xl text-primary tabular-nums">
                  ₹{payableNow.toLocaleString()}
                </dd>
              </div>
            </dl>
          )}
        </Step>

        <Button type="submit" size="lg" loading={loading} disabled={!canSubmit} className="w-full">
          {loading ? 'Connecting to secure checkout…' : `Pay ₹${payableNow.toLocaleString()} & confirm`}
        </Button>
      </form>

      {message && <Alert tone={messageType === 'error' ? 'danger' : 'success'}>{message}</Alert>}
    </div>
  );
}
