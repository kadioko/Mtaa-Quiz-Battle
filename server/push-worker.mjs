/**
 * push-worker.mjs — Expo Push Notification daily blast server
 *
 * Reads push_tokens from Supabase, sends a daily challenge reminder
 * to all registered devices via the Expo Push API.
 *
 * Run via cron (e.g. GitHub Actions / Railway / Render cron job) at 19:00 EAT:
 *   node server/push-worker.mjs
 *
 * Required env vars:
 *   SUPABASE_URL         — e.g. https://xxxx.supabase.co
 *   SUPABASE_SERVICE_KEY — service_role key (NOT anon key) with full table access
 *   EXPO_ACCESS_TOKEN    — (optional) Expo account access token for enhanced push
 *
 * See docs/CLOUD_SETUP.md for full setup instructions.
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const EXPO_ACCESS_TOKEN = process.env.EXPO_ACCESS_TOKEN ?? '';
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const BATCH_SIZE = 100; // Expo accepts up to 100 per request

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

async function fetchAllTokens() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/push_tokens?select=token,platform&limit=10000`,
    {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
    }
  );
  if (!res.ok) throw new Error(`Supabase fetch failed: ${res.status}`);
  return res.json();
}

function buildMessage(token) {
  return {
    to: token,
    title: '🇹🇿 Mtaa Quiz Battle',
    body: 'Changamoto ya Leo inakungoja! / Today\'s Daily Challenge awaits! 🎯',
    data: { screen: 'daily' },
    sound: 'default',
    badge: 1,
    channelId: 'daily-challenge',
    priority: 'high',
  };
}

async function sendBatch(messages) {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (EXPO_ACCESS_TOKEN) headers['Authorization'] = `Bearer ${EXPO_ACCESS_TOKEN}`;

  const res = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(messages),
  });
  return res.json();
}

async function main() {
  console.log(`[push-worker] Starting at ${new Date().toISOString()}`);

  const rows = await fetchAllTokens();
  const tokens = rows
    .map((r) => r.token)
    .filter((t) => typeof t === 'string' && t.startsWith('ExponentPushToken['));

  console.log(`[push-worker] Found ${tokens.length} Expo push tokens`);

  let sent = 0;
  let errors = 0;

  for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
    const batch = tokens.slice(i, i + BATCH_SIZE);
    const messages = batch.map(buildMessage);
    try {
      const result = await sendBatch(messages);
      const data = Array.isArray(result.data) ? result.data : [];
      const batchErrors = data.filter((r) => r.status === 'error').length;
      sent += batch.length - batchErrors;
      errors += batchErrors;
      console.log(`[push-worker] Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length - batchErrors} sent, ${batchErrors} errors`);
    } catch (err) {
      console.error(`[push-worker] Batch error:`, err.message);
      errors += batch.length;
    }
    // Rate-limit: 100ms between batches
    if (i + BATCH_SIZE < tokens.length) await new Promise((r) => setTimeout(r, 100));
  }

  console.log(`[push-worker] Done. Sent: ${sent}, Errors: ${errors}`);
}

main().catch((err) => {
  console.error('[push-worker] Fatal:', err);
  process.exit(1);
});
