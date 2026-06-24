import { pool } from '../config/db.js';

// Temporary in-memory store for OTPs (Key: Email, Value: OTP Data)
const otpStore = new Map();

// 1. Request OTP
export const requestOtp = async (req, res) => {
  const { customer_name, phone, email, service, appointment_time } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required for verification' });
  }

  // Generate a 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Store OTP and booking data, expiring in 10 minutes
  otpStore.set(email, {
    otp,
    bookingData: { customer_name, phone, email, service, appointment_time },
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  try {
    // Send email using Brevo's REST API
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY
      },
      body: JSON.stringify({
        sender: { 
          name: "Salon Booking System", 
          email: process.env.EMAIL_USER // This must be the email you registered on Brevo with
        },
        to: [{ email: email, name: customer_name }],
        subject: 'Salon Booking OTP Verification',
        htmlContent: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #667eea; text-align: center;">Verify your appointment</h2>
            <p>Hi <strong>${customer_name}</strong>,</p>
            <p>Your OTP for booking a ${service} appointment is:</p>
            <div style="background: #f4f4f4; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
              <strong style="font-size: 32px; letter-spacing: 5px; color: #333;">${otp}</strong>
            </div>
            <p style="color: #888; font-size: 12px; text-align: center;">This code will expire in 10 minutes.</p>
          </div>
        `
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Brevo API Error:', errorData);
      throw new Error('Failed to send OTP email via Brevo');
    }
    
    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (err) {
    console.error('Email error:', err);
    res.status(500).json({ error: 'Failed to send OTP email' });
  }
};

// 2. Verify OTP and Create Booking
export const verifyOtpAndBook = async (req, res) => {
  const { email, otp } = req.body;
  const record = otpStore.get(email);

  if (!record) {
    return res.status(400).json({ error: 'No OTP requested for this email' });
  }
  if (Date.now() > record.expiresAt) {
    otpStore.delete(email);
    return res.status(400).json({ error: 'OTP has expired' });
  }
  if (record.otp !== otp) {
    return res.status(400).json({ error: 'Invalid OTP' });
  }

  const { customer_name, phone, service, appointment_time } = record.bookingData;
  try {
    const newBooking = await pool.query(
      'INSERT INTO bookings (customer_name, phone, email, service, appointment_time) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [customer_name, phone, email, service, appointment_time]
    );
    
    otpStore.delete(email);
    res.status(201).json(newBooking.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

export async function listBookings(req, res) {
  try {
    const result = await pool.query(`SELECT * FROM bookings ORDER BY appointment_time ASC`);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function getQueue(req, res) {
  try {
    const all = req.query.all === '1' || req.query.all === 'true';
    if (all) {
      const result = await pool.query(
        `SELECT * FROM bookings WHERE status IN ('queued', 'in-progress') ORDER BY appointment_time ASC`
      );
      return res.json(result.rows);
    }

    const now = new Date().toISOString();
    const result = await pool.query(
      `SELECT * FROM bookings 
       WHERE status IN ('queued', 'in-progress') 
       AND (appointment_time >= $1 OR status = 'in-progress')
       AND DATE(appointment_time AT TIME ZONE 'Asia/Kolkata') = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::DATE
       ORDER BY appointment_time ASC`,
      [now]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function updateBooking(req, res) {
  try {
    const { id } = req.params;
    const { customer_name, phone, service, appointment_time, status } = req.body;

    const result = await pool.query(
      `UPDATE bookings SET customer_name = $1, phone = $2, service = $3, appointment_time = $4, status = $5 WHERE id = $6 RETURNING *`,
      [customer_name, phone || null, service, appointment_time, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function deleteBooking(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query(`DELETE FROM bookings WHERE id = $1 RETURNING *`, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({ message: 'Booking deleted', booking: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}