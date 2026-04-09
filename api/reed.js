/**
 * /api/reed - Vercel serverless function
 * Proxies requests to the Anthropic API with rate limiting.
 *
 * Rate limiting strategy:
 *   - Uses Vercel KV (Upstash Redis) when KV_REST_API_URL is set.
 *   - Falls back to in-memory when KV is not configured (resets on cold start).
 *
 * To enable persistent rate limiting:
 *   1. vercel kv create chins-rate-limit
 *   2. vercel link && vercel env pull
 *   The KV_REST_API_URL and KV_REST_API_TOKEN env vars are set automatically.
 */

const memStore = new Map();
const PER_MINUTE = 20;
const PER_HOUR   = 100;
const MINUTE     = 60000;
const HOUR       = 3600000;

function getClientKey(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    'unknown'
  );
}

async function getKv() {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return null;
  try { const { kv } = await import('@vercel/kv'); return kv; } catch { return null; }
}

async function checkRateLimitKv(kv, key) {
  const now = Date.now();
  const minKey  = 'rl:min:' + key + ':' + Math.floor(now / MINUTE);
  const hourKey = 'rl:hr:'  + key + ':' + Math.floor(now / HOUR);
  const [minCount, hourCount] = await Promise.all([kv.incr(minKey), kv.incr(hourKey)]);
  if (minCount  === 1) await kv.expire(minKey,  120);
  if (hourCount === 1) await kv.expire(hourKey, 7200);
  if (minCount  > PER_MINUTE) return { allowed: false, reason: 'Too many messages — please wait a moment.',  retryAfter: 60   };
  if (hourCount > PER_HOUR)   return { allowed: false, reason: 'Hourly limit reached — try again later.',    retryAfter: 3600 };
  return { allowed: true };
}

function checkRateLimitMemory(key) {
  const now = Date.now();
  if (!memStore.has(key)) memStore.set(key, []);
  let requests = memStore.get(key).filter(t => now - t < HOUR);
  const lastMin = requests.filter(t => now - t < MINUTE).length;
  if (lastMin         >= PER_MINUTE) return { allowed: false, reason: 'Too many messages — please wait a moment.',  retryAfter: 60   };
  if (requests.length >= PER_HOUR)   return { allowed: false, reason: 'Hourly limit reached — try again later.',    retryAfter: 3600 };
  requests.push(now);
  memStore.set(key, requests);
  if (memStore.size > 5000) {
    for (const [k, v] of memStore) { if (v.every(t => now - t > HOUR)) memStore.delete(k); }
  }
  return { allowed: true };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const key = getClientKey(req);
  const kv  = await getKv();
  const rateResult = kv ? await checkRateLimitKv(kv, key) : checkRateLimitMemory(key);

  if (!rateResult.allowed) {
    res.setHeader('Retry-After', String(rateResult.retryAfter ?? 60));
    return res.status(429).json({ error: { type: 'rate_limit_error', message: rateResult.reason } });
  }

  const body = req.body;
  if (!body || !Array.isArray(body.messages)) {
    return res.status(400).json({ error: 'Invalid request: messages array required' });
  }

  if (!body.max_tokens || body.max_tokens > 1000) body.max_tokens = 1000;

  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) { console.error('[reed] Missing API key'); return res.status(500).json({ error: 'Server configuration error' }); }

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'web-search-2025-03-05',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!upstream.ok) {
      const err = await upstream.json().catch(() => ({}));
      console.error('[reed] Anthropic error', upstream.status, err);
      return res.status(upstream.status === 529 ? 503 : upstream.status).json({
        error: err.error || { type: 'api_error', message: 'AI service request failed' }
      });
    }

    return res.status(200).json(await upstream.json());
  } catch (err) {
    console.error('[reed] Error:', err.message);
    return res.status(500).json({ error: { type: 'server_error', message: 'Temporarily unavailable — please try again shortly.' } });
  }
}
