/**
 * Submit the validated AI research rating to Sentinel.
 *
 * POSTs {symbol, ai_research_multiplier, analysis} to Sentinel and echoes the stored values.
 * Fails the run on a non-2xx response.
 *
 * Environment: RATING_JSON (the canonical rating),
 *              SENTINEL_BASE_URL (optional, default http://127.0.0.1:8000).
 */
const rating = JSON.parse(process.env.RATING_JSON);
const symbol = stringValue(rating.symbol);
const aiResearchMultiplier = rating.rating;
const analysis = stringValue(rating.rationale);
const baseUrl = String(process.env.SENTINEL_BASE_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');

if (!symbol) throw new Error('Rating JSON is missing symbol');
if (typeof aiResearchMultiplier !== 'number' || !Number.isFinite(aiResearchMultiplier) || aiResearchMultiplier < 0 || aiResearchMultiplier > 1) {
  throw new Error('Rating must be a finite number from 0.0 to 1.0');
}
if (!analysis) throw new Error('Rating rationale is required for Sentinel analysis');

const payload = {
  symbol,
  ai_research_multiplier: aiResearchMultiplier,
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
  ai_research_multiplier: aiResearchMultiplier,
  sentinel: {
    symbol: isRecord(body) ? body.symbol : undefined,
    ai_research_multiplier: isRecord(body) ? body.ai_research_multiplier : undefined,
    ai_research_multiplier_source: isRecord(body) ? body.ai_research_multiplier_source : undefined,
    ai_research_multiplier_updated_at: isRecord(body) ? body.ai_research_multiplier_updated_at : undefined,
  },
}));

function stringValue(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
