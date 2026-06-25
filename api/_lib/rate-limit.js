const buckets = new Map();
let lastCleanup = 0;

function clientIp(req) {
  const forwarded = req && req.headers &&
    (req.headers['x-vercel-forwarded-for'] || req.headers['x-forwarded-for']);
  const value = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return String(
    (value && value.split(',')[0]) ||
    (req && req.headers && (req.headers['x-real-ip'] || req.headers['cf-connecting-ip'])) ||
    (req && req.socket && req.socket.remoteAddress) ||
    'unknown'
  ).trim();
}

function cleanup(now) {
  if (now - lastCleanup < 60 * 1000) return;
  lastCleanup = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

function take(key, limit, windowMs) {
  const now = Date.now();
  cleanup(now);
  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  return {
    allowed: bucket.count <= limit,
    remaining: Math.max(limit - bucket.count, 0),
    retryAfter: Math.max(Math.ceil((bucket.resetAt - now) / 1000), 1),
  };
}

function enforceRateLimit(req, res, scope, limit, windowMs, identifier) {
  const identity = identifier || clientIp(req);
  const result = take(`${scope}:${identity}`, limit, windowMs);
  res.setHeader('X-RateLimit-Limit', String(limit));
  res.setHeader('X-RateLimit-Remaining', String(result.remaining));
  if (!result.allowed) {
    res.setHeader('Retry-After', String(result.retryAfter));
    res.status(429).json({ error: 'Too many requests. Please wait and try again.' });
    return false;
  }
  return true;
}

module.exports = {
  clientIp,
  enforceRateLimit,
  take,
};
