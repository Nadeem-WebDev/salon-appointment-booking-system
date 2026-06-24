import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('Missing DATABASE_URL in environment');
  process.exit(1);
}

export const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
