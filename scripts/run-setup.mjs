import { readFileSync } from 'fs';
import { Client } from 'pg';

const connString = 'postgresql://postgres:Kadioko1997!@db.uthvgrtptvoufdpjwfyo.supabase.co:5432/postgres';
const sql = readFileSync(new URL('./setup-supabase.sql', import.meta.url), 'utf8');

const client = new Client({
  connectionString: connString,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to Supabase database.\n');
    await client.query(sql);
    console.log('All tables + RLS policies created successfully.');
  } catch (err) {
    console.error('Setup failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
