import Razorpay from 'razorpay';
import crypto from 'crypto';
import PDFDocument from 'pdfkit';
import { renderInvoice } from '../theme/invoicePdf.js';
import { emailLayout, detailPanel, rewardBanner, codeBlock } from '../theme/emailTheme.js';

import { pool } from '../config/db.js';

// Temporary in-memory store for OTPs (Key: Email, Value: OTP Data)
const otpStore = new Map();

// --- NEW: Fetch dynamic configuration data ---
export const getServices = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM services WHERE is_active = true ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getStaff = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM staff WHERE is_active = true ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
// ---------------------------------------------

export const getBookedTimes = async (req, res) => {
  try {
    const { date, staff_id } = req.query; 
    if (!date || !staff_id) return res.status(400).json({ error: 'Date and staff ID are required' });

    const result = await pool.query(
      `SELECT TO_CHAR(appointment_time AT TIME ZONE 'Asia/Kolkata', 'HH24:MI') as time_slot
       FROM bookings 
       WHERE DATE(appointment_time AT TIME ZONE 'Asia/Kolkata') = $1
       AND staff_id = $2
       AND status IN ('queued', 'in-progress')`,
      [date, staff_id]
    );

    res.json(result.rows.map(row => row.time_slot));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// 1. Request OTP (Updated payload)
export const requestOtp = async (req, res) => {
  const { customer_name, phone, email, service_id, staff_id, appointment_time } = req.body;

  if (!email) return res.status(400).json({ error: 'Email is required for verification' });

  // DEFENSE 1: Check if THIS specific staff member is booked at this time
  const checkConflict = await pool.query(
    `SELECT id FROM bookings WHERE appointment_time = $1 AND staff_id = $2 AND status IN ('queued', 'in-progress')`,
    [appointment_time, staff_id]
  );
  if (checkConflict.rows.length > 0) {
    return res.status(409).json({ error: 'This stylist is already booked at that time. Please choose another time or stylist.' });
  }

  const serviceQuery = await pool.query(`SELECT name FROM services WHERE id = $1`, [service_id]);
  const serviceName = serviceQuery.rows[0]?.name || 'a service';

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  otpStore.set(email, {
    otp,
    bookingData: { customer_name, phone, email, service_id, staff_id, appointment_time },
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  try {
    // ... (Keep your Brevo email fetch logic exactly the same here) ...
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY },
      body: JSON.stringify({
        sender: { name: "Salon Booking System", email: process.env.EMAIL_USER },
        to: [{ email: email, name: customer_name }],
        subject: 'Salon Booking OTP Verification',
        htmlContent: emailLayout({
          title: 'Verify your appointment',
          intro: `<p style="margin:0 0 10px;">Hi <strong>${customer_name}</strong>,</p>
                  <p style="margin:0;">Your verification code for the <strong>${serviceName}</strong> appointment at
                  <strong>${new Date(appointment_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong> is:</p>`,
          body: codeBlock(otp),
          footerNote: 'This code expires in 10 minutes.'
        })
      })
    });

    if (!response.ok) throw new Error('Failed to send OTP email via Brevo');
    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send OTP email' });
  }
};

// 2. Verify OTP and Create Booking (Updated INSERT)
export const verifyOtpAndBook = async (req, res) => {
  const { email, otp } = req.body;
  const record = otpStore.get(email);

  if (!record) return res.status(400).json({ error: 'No OTP requested for this email' });
  if (Date.now() > record.expiresAt) {
    otpStore.delete(email);
    return res.status(400).json({ error: 'OTP has expired' });
  }
  if (record.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });

  const { customer_name, phone, service_id, staff_id, appointment_time } = record.bookingData;

  try {
    // DEFENSE 2: Final check right before insert (with staff_id)
    const checkConflict = await pool.query(
      `SELECT id FROM bookings WHERE appointment_time = $1 AND staff_id = $2 AND status IN ('queued', 'in-progress')`,
      [appointment_time, staff_id]
    );
    
    if (checkConflict.rows.length > 0) {
      otpStore.delete(email); 
      return res.status(409).json({ error: 'Sorry, this stylist was just booked by someone else for that time. Please start over.' });
    }

    const newBooking = await pool.query(
      `INSERT INTO bookings 
       (customer_name, phone, email, service_id, staff_id, appointment_time, status, payment_status, amount_paid) 
       VALUES ($1, $2, $3, $4, $5, $6, 'queued', 'manual-walkin', 0) 
       RETURNING *`,
      [customer_name, phone || null, email || null, service_id, staff_id, appointment_time]
    );
    
    otpStore.delete(email);
    res.status(201).json(newBooking.rows[0]);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

// --- UPDATED JOINS: These queries alias s.name to 'service' so your frontend code doesn't break! ---
const bookingJoinQuery = `
  SELECT b.id, b.customer_name, b.phone, b.email, b.appointment_time, b.status, 
         b.service_id, b.staff_id,
         s.name as service, s.price as service_price, s.duration_minutes,
         st.name as staff_name
  FROM bookings b
  JOIN services s ON b.service_id = s.id
  JOIN staff st ON b.staff_id = st.id
`;

export async function listBookings(req, res) {
  try {
    const result = await pool.query(`${bookingJoinQuery} ORDER BY b.appointment_time ASC`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

export async function getQueue(req, res) {
  try {
    const all = req.query.all === '1' || req.query.all === 'true';
    if (all) {
      const result = await pool.query(`${bookingJoinQuery} WHERE b.status IN ('queued', 'in-progress') ORDER BY b.appointment_time ASC`);
      return res.json(result.rows);
    }
    const now = new Date().toISOString();
    const result = await pool.query(
      `${bookingJoinQuery}
       WHERE b.status IN ('queued', 'in-progress') 
       AND (b.appointment_time >= $1 OR b.status = 'in-progress')
       AND DATE(b.appointment_time AT TIME ZONE 'Asia/Kolkata') = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::DATE
       ORDER BY b.appointment_time ASC`,
      [now]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

export async function updateBooking(req, res) {
  try {
    const { id } = req.params;
    const { customer_name, phone, service_id, appointment_time, status } = req.body;

    // 1. Fetch the OLD status, payment, AND redeemed coins before updating
    const currentBookingRes = await pool.query(
      `SELECT b.status, b.amount_paid, b.coins_redeemed, s.name as service_name, s.price as service_price, st.name as staff_name 
       FROM bookings b 
       JOIN services s ON b.service_id = s.id 
       JOIN staff st ON b.staff_id = st.id 
       WHERE b.id = $1`, 
      [id]
    );

    if (currentBookingRes.rows.length === 0) return res.status(404).json({ error: 'Booking not found' });
    const currentBooking = currentBookingRes.rows[0];
    const oldStatus = currentBooking.status;

    // 2. Perform the standard booking update
    const result = await pool.query(
      `UPDATE bookings SET customer_name = $1, phone = $2, service_id = $3, appointment_time = $4, status = $5 WHERE id = $6 RETURNING *`,
      [customer_name, phone || null, service_id, appointment_time, status, id]
    );

    // 3. --- NEW: THE SUPERCOIN & INVOICE LOGIC ---
    if (status === 'completed' && oldStatus !== 'completed') {
      const serviceRes = await pool.query(`SELECT name, price FROM services WHERE id = $1`, [service_id]);
      const serviceData = serviceRes.rows[0];

      const emailToSend = result.rows[0].email;
      const clientPhone = result.rows[0].phone;
      const clientName = result.rows[0].customer_name;
      
      // --- NEW: DISCOUNT MATH ---
      const totalAmount = Number(serviceData.price);
      const paidAmount = Number(currentBooking.amount_paid || 0);
      const discountAmount = Number(currentBooking.coins_redeemed || 0); 
      // Ensure balance doesn't go below 0 if discount > total
      const dueAmount = Math.max(0, totalAmount - paidAmount - discountAmount);

      let earnedCoins = 0;
      let totalCoinsBalance = 0;

      // Check if eligible for Supercoins (Price > 1000 and has a phone number)
      if (totalAmount > 1000 && clientPhone) {
        // Calculate 5% of the total amount
        earnedCoins = Number((totalAmount * 0.05).toFixed(2));
        
        // Add coins to customer's wallet
        const walletRes = await pool.query(
          `UPDATE customers SET supercoins = supercoins + $1 WHERE phone = $2 RETURNING supercoins`,
          [earnedCoins, clientPhone]
        );
        
        if (walletRes.rows.length > 0) {
          totalCoinsBalance = Number(walletRes.rows[0].supercoins);
        }

        // Stamp the booking record with the coins earned for history
        await pool.query(`UPDATE bookings SET coins_earned = $1 WHERE id = $2`, [earnedCoins, id]);
      }

      // Trigger Email Invoice if they have a real email
      if (emailToSend && emailToSend !== 'walkin@salon.local') {
        generateAndSendInvoiceEmail({
          email: emailToSend,
          clientPhone: phone,
          customerName: clientName,
          serviceName: serviceData.name,
          staffName: currentBooking.staff_name,
          totalAmount,
          paidAmount,
          dueAmount,
          discountAmount,
          bookingId: id,
          // Pass the new coin data to the PDF generator!
          earnedCoins,
          totalCoinsBalance
        });
      }
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update Booking Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function deleteBooking(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query(`DELETE FROM bookings WHERE id = $1 RETURNING *`, [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Booking not found' });
    res.json({ message: 'Booking deleted', booking: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

export const getBusinessHours = async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM business_hours ORDER BY day_of_week ASC`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateBusinessHours = async (req, res) => {
  try {
    const { day_of_week, is_closed, open_time, close_time } = req.body;
    await pool.query(
      `UPDATE business_hours SET is_closed = $1, open_time = $2, close_time = $3 WHERE day_of_week = $4`,
      [is_closed, open_time, close_time, day_of_week]
    );
    res.json({ message: 'Hours updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getBlockedDates = async (req, res) => {
  try {
    const result = await pool.query(`SELECT id, TO_CHAR(blocked_date, 'YYYY-MM-DD') as blocked_date, reason FROM blocked_dates ORDER BY blocked_date ASC`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const addBlockedDate = async (req, res) => {
  try {
    const { blocked_date, reason } = req.body;
    const result = await pool.query(
      `INSERT INTO blocked_dates (blocked_date, reason) VALUES ($1, $2) RETURNING id, TO_CHAR(blocked_date, 'YYYY-MM-DD') as blocked_date, reason`,
      [blocked_date, reason]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'This date is already blocked.' });
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteBlockedDate = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`DELETE FROM blocked_dates WHERE id = $1`, [id]);
    res.json({ message: 'Date unblocked successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};


// Initialize Razorpay Instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create a Razorpay Order (WITH DOUBLE-BOOKING DEFENSE 1)
export const createPaymentOrder = async (req, res) => {
  try {
    // --- Accept phone and redeem_coins ---
    const { service_id, staff_id, appointment_time, payment_type, phone, redeem_coins } = req.body;
    // DEFENSE 1: Check if slot is already booked BEFORE generating a payment order
    const checkConflict = await pool.query(
      `SELECT id FROM bookings WHERE appointment_time = $1 AND staff_id = $2 AND status IN ('queued', 'in-progress')`,
      [appointment_time, staff_id]
    );

    if (checkConflict.rows.length > 0) {
      return res.status(409).json({ error: 'This stylist was just booked for this time. Please select another slot.' });
    }

    // Fetch the service price from database
    const serviceRes = await pool.query(`SELECT price FROM services WHERE id = $1`, [service_id]);
    if (serviceRes.rows.length === 0) return res.status(404).json({ error: 'Service not found' });

    const fullPrice = Number(serviceRes.rows[0].price);
    
    // --- NEW: SAFEGUARDED DISCOUNT MATH ---
    let discount = 0;
    if (redeem_coins && phone && fullPrice >= 1000) {
      const walletCheck = await pool.query(`SELECT supercoins FROM customers WHERE phone = $1`, [phone]);
      if (walletCheck.rows.length > 0 && Number(walletCheck.rows[0].supercoins) >= 1000) {
        discount = 1000;
      }
    }

    const finalPriceAfterDiscount = fullPrice - discount;
    const amountToPay = payment_type === 'full' ? finalPriceAfterDiscount : Math.round(finalPriceAfterDiscount * 0.30);

    // Create Razorpay Order
    const options = {
      amount: amountToPay * 100, 
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    
    res.json({
      order_id: order.id,
      payable_amount: amountToPay, // Renamed to reflect it could be full or partial
      full_price: fullPrice,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    console.error('Razorpay Order Error:', err);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
};

// Verify Payment Signature & Confirm Booking (WITH DOUBLE-BOOKING DEFENSE 2)
export const verifyPaymentAndBook = async (req, res) => {
  const { 
    razorpay_order_id, 
    razorpay_payment_id, 
    razorpay_signature,
    bookingData 
  } = req.body;

  // Verify Razorpay Signature
  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ error: 'Invalid payment signature. Transaction failed.' });
  }

// --- Extract redeem_coins ---
  const { customer_name, phone, email, service_id, staff_id, appointment_time, amount_paid, redeem_coins } = bookingData;

  try {
    // Final double-booking check
    const checkConflict = await pool.query(
      `SELECT id FROM bookings WHERE appointment_time = $1 AND staff_id = $2 AND status IN ('queued', 'in-progress')`,
      [appointment_time, staff_id]
    );
    
    if (checkConflict.rows.length > 0) {
      // --- AUTOMATED REFUND FOR RACE CONDITIONS ---
      try {
        console.log(`Race condition detected! Refunding payment: ${razorpay_payment_id}`);
        
        await razorpay.payments.refund(razorpay_payment_id, {
          amount: amount_paid * 100, // Amount in paise
          speed: "optimum" // Processes the refund as quickly as possible
        });

        return res.status(409).json({ 
          error: 'Someone else just booked this exact slot a second ago! Your payment has been automatically refunded to your original payment method.' 
        });

      } catch (refundErr) {
        console.error("Razorpay Automated Refund Failed:", refundErr);
        return res.status(409).json({ 
          error: 'Slot taken during checkout. Please contact the salon for a manual refund.' 
        });
      }
    }

    let coinsToDeduct = 0;
    // --- NEW: THE SUPERCOIN WALLET HOOK ---
    // If phone exists, update name/email. If new, create wallet with 0 coins.
    if (phone) {
      await pool.query(
        `INSERT INTO customers (phone, name, email) 
         VALUES ($1, $2, $3)
         ON CONFLICT (phone) 
         DO UPDATE SET name = EXCLUDED.name, email = COALESCE(EXCLUDED.email, customers.email)`,
        [phone, customer_name, email || null]
      );
    // Deduct coins safely if redeemed
      if (redeem_coins) {
        const servicePriceRes = await pool.query(`SELECT price FROM services WHERE id = $1`, [service_id]);
        const servicePrice = servicePriceRes.rows.length > 0 ? Number(servicePriceRes.rows[0].price) : 0;
        const walletCheck = await pool.query(`SELECT supercoins FROM customers WHERE phone = $1`, [phone]);
        
        if (walletCheck.rows.length > 0 && Number(walletCheck.rows[0].supercoins) >= 1000 && servicePrice >= 1000) {
          await pool.query(`UPDATE customers SET supercoins = supercoins - 1000 WHERE phone = $1`, [phone]);
          coinsToDeduct = 1000;
        }
      }
    }

    
    // --- NEW: Save coins_redeemed in DB ---
    const newBooking = await pool.query(
      `INSERT INTO bookings 
       (customer_name, phone, email, service_id, staff_id, appointment_time, status, payment_status, razorpay_order_id, razorpay_payment_id, amount_paid, coins_redeemed) 
       VALUES ($1, $2, $3, $4, $5, $6, 'queued', 'paid', $7, $8, $9, $10) 
       RETURNING *`,
      [customer_name, phone, email, service_id, staff_id, appointment_time, razorpay_order_id, razorpay_payment_id, amount_paid, coinsToDeduct]
    );

    // Fetch details for Email
    const detailsRes = await pool.query(
      `SELECT s.name as service_name, s.price as full_price, st.name as staff_name 
       FROM services s, staff st 
       WHERE s.id = $1 AND st.id = $2`,
      [service_id, staff_id]
    );
    
    const { service_name, full_price, staff_name } = detailsRes.rows[0];
    
    // --- NEW: Email Math with Discount ---
    const remainingAmount = Math.max(0, Number(full_price) - Number(amount_paid) - coinsToDeduct);
    const paymentLabel = remainingAmount === 0 ? "100% Full Payment:" : "30% Deposit Paid:";
    
    // Add discount HTML row if coins were used
    const discountHtmlRow = coinsToDeduct > 0 
      ? `<tr><td style="padding:6px 0;color:#5c554f;">Supercoin discount</td><td style="padding:6px 0;text-align:right;color:#9c7b34;font-weight:600;">- &#8377;${coinsToDeduct}</td></tr>` 
      : '';

    const formattedDate = new Date(appointment_time).toLocaleString('en-IN', {
      dateStyle: 'full', timeStyle: 'short', timeZone: 'Asia/Kolkata'
    });

    // Send Confirmation Email via Brevo API
    fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY
      },
      body: JSON.stringify({
        sender: { name: "SalonBooker", email: process.env.EMAIL_USER },
        to: [{ email: email, name: customer_name }],
        subject: `Booking Confirmed! - ${service_name} on ${formattedDate}`,
        htmlContent: emailLayout({
          title: 'Booking confirmed',
          intro: `<p style="margin:0 0 10px;">Hi <strong>${customer_name}</strong>,</p>
                  <p style="margin:0;">Your appointment is scheduled. We look forward to seeing you.</p>`,
          body: detailPanel([
            ['Service', service_name],
            ['Stylist', staff_name],
            ['Date &amp; time', formattedDate],
          ]) + `
            <h3 style="margin:22px 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:1.2px;color:#8c847d;font-weight:600;">Payment summary</h3>
            <table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr><td style="padding:6px 0;color:#5c554f;">Total service price</td><td style="padding:6px 0;text-align:right;color:#1b1720;font-weight:600;">&#8377;${full_price}</td></tr>
              ${discountHtmlRow}
              <tr><td style="padding:6px 0;color:#5c554f;">${paymentLabel}</td><td style="padding:6px 0;text-align:right;color:#9c7b34;font-weight:600;">- &#8377;${amount_paid}</td></tr>
              <tr><td style="padding:12px 0 0;border-top:1px solid #ddd6ca;color:#1b1720;font-weight:600;">Remaining due at salon</td><td style="padding:12px 0 0;border-top:1px solid #ddd6ca;text-align:right;color:#1b1720;font-weight:700;font-size:16px;">&#8377;${remainingAmount}</td></tr>
            </table>`
        })
      })
    }).catch(err => console.error("Brevo Email Sending Error:", err));

    sendWhatsAppConfirmation(phone, customer_name, service_name, formattedDate, null, null, 'booking');
    res.status(201).json(newBooking.rows[0]);
  } catch (err) {
    console.error('Database Booking Error:', err);
    res.status(500).json({ error: 'Failed to record booking after payment.' });
  }
};



// Get ALL staff (including deactivated ones) for the admin panel
export const getAdminStaff = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM staff ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Add new staff member
export const addStaff = async (req, res) => {
  try {
    const { name } = req.body;
    const result = await pool.query(
      'INSERT INTO staff (name, is_active) VALUES ($1, true) RETURNING *',
      [name]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Update staff member (Name or Active Status)
export const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, is_active } = req.body;
    const result = await pool.query(
      'UPDATE staff SET name = $1, is_active = $2 WHERE id = $3 RETURNING *',
      [name, is_active, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete staff member (Only works if they have NO bookings)
export const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM staff WHERE id = $1', [id]);
    res.json({ message: 'Staff deleted successfully' });
  } catch (err) {
    // 23503 is the PostgreSQL error code for Foreign Key Violation
    if (err.code === '23503') { 
      return res.status(400).json({ error: 'Cannot delete a stylist who has existing bookings. Please deactivate them instead.' });
    }
    res.status(500).json({ error: 'Server error' });
  }
};


// Fetch ALL services (including inactive) for Admin
export const getAdminServices = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM services ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Create a new Service
export const addService = async (req, res) => {
  try {
    const { name, price, duration_minutes } = req.body;
    const result = await pool.query(
      'INSERT INTO services (name, price, duration_minutes, is_active) VALUES ($1, $2, $3, true) RETURNING *',
      [name, price, duration_minutes || 30]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Update existing Service (Name, Price, Duration, Active Status)
export const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, duration_minutes, is_active } = req.body;
    const result = await pool.query(
      'UPDATE services SET name = $1, price = $2, duration_minutes = $3, is_active = $4 WHERE id = $5 RETURNING *',
      [name, price, duration_minutes, is_active, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete a Service (Catches FK Violation if bookings exist)
export const deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM services WHERE id = $1', [id]);
    res.json({ message: 'Service deleted successfully' });
  } catch (err) {
    if (err.code === '23503') { // Foreign Key Violation code in Postgres
      return res.status(400).json({ error: 'Cannot delete a service that has existing bookings. Deactivate it instead.' });
    }
    res.status(500).json({ error: 'Server error' });
  }
};


// --- Manual Admin/Walk-in Booking ---
export async function createManualBooking(req, res) {
  try {
    // --- NEW: Added redeem_coins to the destructured body ---
    const { customer_name, phone, email, service_id, staff_id, appointment_time, redeem_coins } = req.body;

    // Double-booking defense
    const checkConflict = await pool.query(
      `SELECT id FROM bookings WHERE appointment_time = $1 AND staff_id = $2 AND status IN ('queued', 'in-progress')`,
      [appointment_time, staff_id]
    );
    
    if (checkConflict.rows.length > 0) {
      return res.status(409).json({ error: 'This stylist is already booked at that exact time.' });
    }

    let coinsToDeduct = 0;

    // THE SUPERCOIN WALLET HOOK
    if (phone) {
      // 1. Create or update the user
      await pool.query(
        `INSERT INTO customers (phone, name, email) 
         VALUES ($1, $2, $3)
         ON CONFLICT (phone) 
         DO UPDATE SET name = EXCLUDED.name, email = COALESCE(EXCLUDED.email, customers.email)`,
        [phone, customer_name, email || null]
      );

      // 2. --- NEW: PROCESS COIN REDEMPTION ---
      if (redeem_coins) {
        // Fetch the service price to ensure it's worth at least 1000
        const servicePriceRes = await pool.query(`SELECT price FROM services WHERE id = $1`, [service_id]);
        const servicePrice = servicePriceRes.rows.length > 0 ? Number(servicePriceRes.rows[0].price) : 0;

        // Security check: Must have 1000+ coins AND service price must be >= 1000
        const walletCheck = await pool.query(`SELECT supercoins FROM customers WHERE phone = $1`, [phone]);
        
        if (walletCheck.rows.length > 0 && Number(walletCheck.rows[0].supercoins) >= 1000 && servicePrice >= 1000) {
          // Deduct 1000 coins from their wallet
          await pool.query(`UPDATE customers SET supercoins = supercoins - 1000 WHERE phone = $1`, [phone]);
          coinsToDeduct = 1000;
        } else {
          // If they tried to cheat the system on a cheap service, reject the coin deduction
          coinsToDeduct = 0;
        }
      }
    }

    // Insert with payment_status as 'manual-walkin', and save the coins_redeemed
    const newBooking = await pool.query(
      `INSERT INTO bookings 
       (customer_name, phone, email, service_id, staff_id, appointment_time, status, payment_status, amount_paid, coins_redeemed) 
       VALUES ($1, $2, $3, $4, $5, $6, 'queued', 'manual-walkin', 0, $7) 
       RETURNING *`,
      [customer_name, phone || null, email || null, service_id, staff_id, appointment_time, coinsToDeduct]
    );

    res.status(201).json(newBooking.rows[0]);
  } catch (err) {
    console.error('Manual Booking Error:', err);
    res.status(500).json({ error: 'Server error while creating manual booking.' });
  }
}


// --- Modernized PDF Generation & Brevo Email Dispatcher ---
async function generateAndSendInvoiceEmail(data) {
  try {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const buffers = [];
    
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', async () => {
      const pdfBuffer = Buffer.concat(buffers);
      const base64Pdf = pdfBuffer.toString('base64');

      // --- EXISTING: Dynamic Email HTML (Shows coins if earned) ---
      const coinHtmlBanner = data.earnedCoins > 0
        ? rewardBanner({
            heading: `You earned ${data.earnedCoins} Supercoins`,
            subline: 'Reach 1,000 coins for a flat discount on a future visit.',
            value: `${data.totalCoinsBalance} coins`,
          })
        : '';

      fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'api-key': process.env.BREVO_API_KEY
        },
        body: JSON.stringify({
          sender: { name: "SalonBooker", email: process.env.EMAIL_USER },
          to: [{ email: data.email, name: data.customerName }],
          subject: `Thank you for visiting! - Your Invoice #${data.bookingId}`,
          htmlContent: emailLayout({
            title: 'Thank you for visiting',
            intro: `<p style="margin:0 0 10px;">Hi <strong>${data.customerName}</strong>,</p>
                    <p style="margin:0;">We hope you loved your visit. Your final receipt is attached to this email.</p>`,
            body: coinHtmlBanner,
            footerNote: 'We look forward to seeing you again soon.'
          }),
          attachment: [{ content: base64Pdf, name: `Invoice_INV-${data.bookingId}.pdf` }]
        })
      }).catch(err => console.error("Brevo Email Error:", err));
      
      console.log(`Invoice email sent successfully to ${data.email}`);

      // --- NEW: Route the generated PDF to WhatsApp ---
      if (data.clientPhone) {
        await sendWhatsAppConfirmation(
          data.clientPhone,
          data.customerName,
          data.serviceName,
          data.appointmentDate,
          pdfBuffer,
          data.bookingId,
          'completion'
        );
      }
    });

    renderInvoice(doc, data);

    doc.end();
  } catch (err) {
    console.error("Failed to generate PDF:", err);
  }
}


// --- NEW: Fetch Customer Wallet by Phone ---
export async function getCustomerByPhone(req, res) {
  try {
    const { phone } = req.params;
    const result = await pool.query('SELECT name, email, supercoins FROM customers WHERE phone = $1', [phone]);
    
    if (result.rows.length === 0) {
      return res.json({ exists: false, supercoins: 0 });
    }
    
    res.json({ exists: true, ...result.rows[0] });
  } catch (err) {
    console.error('Error fetching customer:', err);
    res.status(500).json({ error: 'Server error' });
  }
}


// --- NEW: Public Wallet Check (No Token Required) ---
export async function checkWallet(req, res) {
  try {
    const { phone } = req.params;
    const result = await pool.query('SELECT name, supercoins FROM customers WHERE phone = $1', [phone]);
    
    if (result.rows.length === 0) return res.json({ exists: false, supercoins: 0 });
    res.json({ exists: true, supercoins: result.rows[0].supercoins, name: result.rows[0].name });
  } catch (err) {
    console.error('Error checking wallet:', err);
    res.status(500).json({ error: 'Server error' });
  }
}


// --- WhatsApp API Dispatcher (Dual Mode: Booking & Completion) ---
async function sendWhatsAppConfirmation(clientPhone, clientName, serviceName, date, pdfBuffer = null, bookingId = null, eventType = 'completion') {
  const cleanPhone = clientPhone.replace(/\D/g, ''); 
  const finalPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  try {
    // ==========================================
    // MODE 1: BOOKING CONFIRMATION (Text Only)
    // ==========================================
    if (eventType === 'booking') {
      console.log(`\n[WhatsApp] Sending Booking Confirmation text to ${finalPhone}...`);
      
      const bookingMessage = `🎉 *Booking Confirmed!* 🎉\n\nHi *${clientName}*, your appointment for *${serviceName}* on ${date} is officially confirmed.\n\nThank you for choosing SalonBooker Studio! We look forward to seeing you.`;

      await fetch(`https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: finalPhone,
          type: "text",
          text: { preview_url: false, body: bookingMessage }
        })
      });
      console.log(`[WhatsApp] Booking text successfully sent!\n`);
    } 
    
    // ==========================================
    // MODE 2: SERVICE COMPLETED (PDF + Caption)
    // ==========================================
    else if (eventType === 'completion' && pdfBuffer) {
      console.log(`\n[WhatsApp] 1. Preparing PDF invoice for upload...`);
      const invoiceCaption = `✨ *Thank you for visiting!* ✨\n\nHi *${clientName}*, we hope you loved your *${serviceName}* today.\n\nYour final official receipt is attached with the message.\n\nWe look forward to seeing you again at SalonBooker Studio!`;
      
      const formData = new FormData();
      formData.append('messaging_product', 'whatsapp');
      const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });
      formData.append('file', pdfBlob, `Invoice_INV-${bookingId}.pdf`);

      console.log(`[WhatsApp] 2. Uploading PDF to Meta...`);
      const uploadRes = await fetch(`https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_ID}/media`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}` }, 
        body: formData
      });

      const uploadData = await uploadRes.json();
      
      if (uploadData.id) {
        console.log(`[WhatsApp] 3. Upload Success! Sending combined message to client...`);
        await fetch(`https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: finalPhone,
            type: "document",
            document: {
              id: uploadData.id,
              caption: invoiceCaption,
              filename: `Invoice_INV-${bookingId}.pdf`
            }
          })
        });
        console.log(`[WhatsApp] Combined Invoice successfully sent to ${finalPhone}!\n`);
      } else {
        console.error("[WhatsApp] Media Upload Error:", uploadData);
      }
    }
  } catch (err) {
    console.error("[WhatsApp] CRITICAL ERROR executing fetch:", err);
  }
}


// --- NEW: Get All Users with Pagination ---
export const getAllUsers = async (req, res) => {
  try {
    // 1. Get page and limit from the query URL (defaults to page 1, 10 users per page)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // 2. Count total users to calculate total pages
    // Note: Change 'users' to 'customers' if that is your table name!
    const countResult = await pool.query('SELECT COUNT(*) FROM customers');
    const totalUsers = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalUsers / limit);

    // 3. Fetch exactly the 10 users for the current page
    const usersResult = await pool.query(
      `SELECT id, name, phone, email, supercoins, created_at 
       FROM customers 
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    // 4. Send it all to the frontend
    res.status(200).json({
      users: usersResult.rows,
      pagination: {
        totalUsers,
        totalPages,
        currentPage: page,
        limit
      }
    });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};