/**
 * Validate (and repair) the rater's candidate ratings JSON, then write the canonical file.
 *
 * Reads the raw model output, strips code fences / extracts embedded JSON / repairs JSON
 * as needed, and checks every rating: finite, within 0..1, a known symbol, unique, with a
 * rationale, and that all expected symbols are covered. On success writes the normalised
 * ratings file and prints {ok:true,...}; on failure prints {ok:false, errors:[...], rawOutput}
 * so the rating loop can retry with the validator feedback.
 *
 * Environment: SENTINEL_APP_ROOT, EXPECTED_SYMBOLS (JSON array),
 *              RATINGS_RAW_PATH (model output), RATINGS_PATH (canonical output).
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const appRoot = process.env.SENTINEL_APP_ROOT;
if (!appRoot) throw new Error('SENTINEL_APP_ROOT is required');
const appRequire = createRequire(import.meta.url);
const { jsonrepair } = appRequire(join(appRoot, 'sentinel/tasks/vendor/jsonrepair.cjs'));

const expectedSymbols = JSON.parse(process.env.EXPECTED_SYMBOLS || "[]");
const symbolsInUniverse = new Set(expectedSymbols);
const rawPath = stringValue(process.env.RATINGS_RAW_PATH);
const ratingsPath = stringValue(process.env.RATINGS_PATH);
const schema = {
  type: 'object',
  additionalProperties: false,
  required: ['ratings'],
  properties: {
    ratings: [{
      symbol: 'exact security symbol from the summaries',
      rating: 'number from 0.0 to 1.0',
      rationale: 'brief reason in one sentence',
    }],
  },
};

let raw = '';
try {
  if (!rawPath) throw new Error('ratingsRawPath is missing');
  if (!ratingsPath) throw new Error('ratingsPath is missing');
  raw = await readFile(rawPath, 'utf8');
  const value = normalizeJsonOutput(raw);
  const canonical = validateRatings(value);
  await mkdir(dirname(ratingsPath), { recursive: true });
  await writeFile(ratingsPath, JSON.stringify(canonical, null, 2) + '\n', 'utf8');
  console.log(JSON.stringify({
    ok: true,
    ratings: canonical.ratings,
    count: canonical.ratings.length,
    errors: [],
    rawPath,
    ratingsPath,
  }));
} catch (error) {
  console.log(JSON.stringify({
    ok: false,
    ratings: [],
    count: 0,
    errors: [errorMessage(error)],
    rawPath,
    ratingsPath,
    schema,
    rawOutput: raw.length > 12000 ? raw.slice(0, 12000) + '\n...[truncated]' : raw,
  }));
}

function normalizeJsonOutput(input) {
  const trimmed = stripJsonFence(String(input ?? '').trim());
  if (!trimmed) throw new Error('ratings.raw.json is empty');
  try {
    return JSON.parse(trimmed);
  } catch (originalError) {
    const embedded = embeddedJson(trimmed);
    const candidate = embedded ?? trimmed;
    const candidateStart = candidate.trimStart()[0];
    if (!embedded && candidateStart !== '{' && candidateStart !== '[') throw originalError;
    try {
      return JSON.parse(jsonrepair(candidate));
    } catch {
      throw originalError;
    }
  }
}

function validateRatings(value) {
  const rawRatings = Array.isArray(value) ? value : isRecord(value) ? value.ratings : null;
  if (!Array.isArray(rawRatings)) throw new Error('Rating JSON must contain a ratings array');

  const errors = [];
  const ratingsBySymbol = new Map();
  rawRatings.forEach((item, index) => {
    if (!isRecord(item)) {
      errors.push(`Rating item ${index + 1} is not an object`);
      return;
    }
    const symbol = stringValue(item.symbol);
    const rationale = stringValue(item.rationale ?? item.reason);
    const rating = typeof item.rating === 'number' ? item.rating : Number(item.rating);

    if (!Number.isFinite(rating)) {
      errors.push(`${symbol || `item ${index + 1}`}: invalid rating`);
      return;
    }
    if (rating < 0 || rating > 1) {
      errors.push(`${symbol || `item ${index + 1}`}: rating ${rating} out of range`);
      return;
    }
    if (!symbolsInUniverse.has(symbol)) {
      errors.push(`Unknown symbol: ${symbol || `item ${index + 1}`}`);
      return;
    }
    if (ratingsBySymbol.has(symbol)) {
      errors.push(`Duplicate symbol: ${symbol}`);
      return;
    }
    if (!rationale) {
      errors.push(`${symbol}: rationale is empty`);
      return;
    }

    ratingsBySymbol.set(symbol, { symbol, rating: Math.round(rating * 100) / 100, rationale });
  });

  const missing = expectedSymbols.filter((symbol) => !ratingsBySymbol.has(symbol));
  if (missing.length > 0) {
    errors.push(`Missing ratings for ${missing.length} securities: ${missing.slice(0, 20).join(', ')}${missing.length > 20 ? '...' : ''}`);
  }
  if (errors.length > 0) throw new Error(errors.join('; '));

  return { ratings: expectedSymbols.map((symbol) => ratingsBySymbol.get(symbol)) };
}

function stripJsonFence(input) {
  const match = input.match(/^```(?:json)?[ \t]*\r?\n([\s\S]*?)\r?\n```$/i);
  return match ? match[1].trim() : input;
}

function embeddedJson(input) {
  const objectStart = input.indexOf('{');
  const arrayStart = input.indexOf('[');
  const starts = [objectStart, arrayStart].filter((index) => index >= 0);
  if (starts.length === 0) return null;
  const start = Math.min(...starts);
  const end = Math.max(input.lastIndexOf('}'), input.lastIndexOf(']'));
  if (end < start) return null;
  return input.slice(start, end + 1).trim();
}

function stringValue(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
