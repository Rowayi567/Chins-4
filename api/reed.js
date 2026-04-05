// In-memory rate limiting store
// Limits: 20 requests per user per minute, 100 per hour
const rateLimitStore = new Map();

function getRateLimitKey(req) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.headers['x-real-ip']
    || 'unknown';
  return ip;
}

function checkRateLimit(key) {
  const now = Date.now();
  const minuteWindow = 60 * 1000;
  const hourWindow = 60 * 60 * 1000;
  const minuteLimit = 20;
  const hourLimit = 100;

  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, { requests: [] });
  }

  const record = rateLimitStore.get(key);
  record.requests = record.requests.filter(t => now - t < hourWindow);

  const requestsLastMinute = record.requests.filter(t => now - t < minuteWindow).length;
  const requestsLastHour = record.requests.length;

  if (requestsLastMinute >= minuteLimit) {
    return { allowed: false, reason: 'Too many requests. Please wait a moment.' };
  }
  if (requestsLastHour >= hourLimit) {
    return { allowed: false, reason: 'Hourly limit reached. Please try again later.' };
  }

  record.requests.push(now);

  // Prevent memory leak
  if (rateLimitStore.size > 10000) {
    const keysToDelete = [];
    rateLimitStore.forEach((val, k) => {
      if (val.requests.every(t => now - t > hourWindow)) keysToDelete.push(k);
    });
    keysToDelete.forEach(k => rateLimitStore.delete(k));
  }

  return { allowed: true };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  const key = getRateLimitKey(req);
  const { allowed, reason } = checkRateLimit(key);
  if (!allowed) {
    return res.status(429).json({ error: { type: 'rate_limit_error', message: reason } });
  }

  // Basic validation
  const body = req.body;
  if (!body || !body.messages || !Array.isArray(body.messages)) {
    return res.status(400).json({ error: 'Invalid request format' });
  }

  // Cap max tokens to prevent abuse
  if (body.max_tokens && body.max_tokens > 1000) {
    body.max_tokens = 1000;
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'web-search-2025-03-05',
        'x-api-key': process.env.VITE_ANTHROPIC_API_KEY,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to contact Anthropic' });
  }
}
