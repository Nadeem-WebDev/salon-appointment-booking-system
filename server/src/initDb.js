import { pool } from './config/db.js';

const initDb = async () => {
  try {
    const sql = `
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        customer_name TEXT NOT NULL,
        phone TEXT,
        service TEXT NOT NULL,
        appointment_time TIMESTAMP WITH TIME ZONE NOT NULL,
        status TEXT NOT NULL DEFAULT 'queued',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `;
    await pool.query(sql);
    console.log('✓ Database initialized successfully');
    process.exit(0);
  } catch (err) {
    console.error('✗ Error initializing database:', err);
    process.exit(1);
  }
};

initDb();
