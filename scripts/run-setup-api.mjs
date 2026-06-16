import { readFileSync } from 'fs';

const PROJECT_REF = 'uthvgrtptvoufdpjwfyo';
const PAT = process.env.SUPABASE_PAT;
const API_URL = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;

if (!PAT) {
  console.error('Error: SUPABASE_PAT environment variable is required.');
  console.error('Get it from Supabase Dashboard → Account → Access Tokens.');
  process.exit(1);
}

const sql = readFileSync(new URL('./setup-supabase.sql', import.meta.url), 'utf8');

async function runQuery(query) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PAT}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, text };
}

async function run() {
  console.log('Running full SQL setup script via Supabase Management API...\n');
  const result = await runQuery(sql);
  if (result.ok) {
    console.log('SUCCESS: All tables and policies created.');
    console.log(result.text);
  } else {
    console.log(`FAILED (${result.status}):`);
    console.log(result.text);
    process.exit(1);
  }
}

run();
