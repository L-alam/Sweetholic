import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true'
    ? { rejectUnauthorized: false }
    : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export const testConnection = async () => {
  try {
    console.log("Connecting to:", process.env.DATABASE_URL);

    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    
    console.log('Database connected successfully!');
    console.log('Current time from DB:', result.rows[0].now);
    
    client.release();
    return true;
  } catch (err: any) {
    console.error('Database connection failed:', err.message);
    return false;
  }
};

export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('Executed query', { text, duration, rows: res.rowCount });
  return res;
};

export default pool;
