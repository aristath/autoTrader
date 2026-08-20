/**
 * Submit the validated security rating to Sentinel as a user preference.
 *
 * POSTs {symbol, user_multiplier, analysis} to Sentinel and echoes the stored values.
 * Fails the run on a non-2xx response.
 *
 * Environment: RATING_JSON (the canonical rating),
 *              SENTINEL_BASE_URL (optional, default http://127.0.0.1:8000).
 */
const rating = JSON.parse(process.env.RATING_JSON);
const symbol = stringValue(rating.symbol);
const userMultiplier = rating.rating;
const analysis = stringValue(rating.rationale);
const baseUrl = String(process.env.SENTINEL_BASE_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');

if (!symbol) throw new Error('Rating JSON is missing symbol');
if (typeof userMultiplier !== 'number' || !Number.isFinite(userMultiplier) || userMultiplier < 0 || userMultiplier > 1) {
  throw new Error('Rating must be a finite number from 0.0 to 1.0');
}
if (!analysis) throw new Error('Rating rationale is required for Sentinel analysis');

const payload = {
  symbol,
  user_multiplier: userMultiplier,
  analysis,
};
const response = await fetch(`${baseUrl}/api/securities/preference`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(payload),
});
const text = await response.text();
let body = null;
try {
  body = text ? JSON.parse(text) : null;
} catch {
  body = text;
}
if (!response.ok) {
  const detail = typeof body === 'string' ? body : JSON.stringify(body);
  throw new Error(`Sentinel preference POST failed: HTTP ${response.status} ${detail}`);
}

console.log(JSON.stringify({
  posted: true,
  symbol,
  user_multiplier: userMultiplier,
  sentinel: {
    symbol: isRecord(body) ? body.symbol : undefined,
    user_multiplier: isRecord(body) ? body.user_multiplier : undefined,
    effective_user_multiplier: isRecord(body) ? body.effective_user_multiplier : undefined,
    user_multiplier_source: isRecord(body) ? body.user_multiplier_source : undefined,
    user_multiplier_updated_at: isRecord(body) ? body.user_multiplier_updated_at : undefined,
  },
}));

function stringValue(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
