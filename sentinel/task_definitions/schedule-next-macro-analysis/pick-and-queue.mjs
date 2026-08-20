/**
 * Selects the single macro bucket most overdue for analysis and enqueues an
 * `analyze-macro-bucket` run for it. Designed to be invoked on an idle/stale
 * cadence: each invocation advances at most one bucket, so the whole universe of
 * buckets gets refreshed gradually and evenly over many runs.
 *
 * A bucket is "due" when its analysis file is missing entirely, or older than the
 * staleness window below. Among all due buckets, the one whose analysis is oldest
 * (or absent) wins, keeping coverage as even as possible.
 *
 * Environment:
 *   SENTINEL_TASKS_HOME  (required) - Clara's data root; the bucket list and analysis
 *                                artifacts both live beneath it.
 *   SENTINEL_BASE_URL  (optional) - base URL of the local Clara API
 *                                (defaults to http://127.0.0.1:8000).
 *
 * Prints one JSON line describing the decision:
 *   {"queued":true,"bucket":"...","slug":"...","workItemId":"..."}   when a run was enqueued
 *   {"queued":false,"reason":"no stale macro buckets"}               when nothing was due
 */
import { mkdirSync, statSync, readFileSync } from "node:fs";
import { join } from "node:path";

const dataDir = process.env.SENTINEL_TASKS_HOME;
if (!dataDir) throw new Error("SENTINEL_TASKS_HOME is required");
const base = process.env.SENTINEL_BASE_URL || "http://127.0.0.1:8000";

// Source list of macro buckets (maintained by the refresh-macro-buckets task) and
// the directory where each bucket's analysis markdown is written.
const bucketsPath = join(dataDir, "tasks/artifacts/refresh-macro-buckets/macro-buckets.json");
const outputDir = join(dataDir, "tasks/artifacts/analyze-macro-bucket");

// A bucket's analysis is considered stale once it is older than seven days.
const staleMs = 7 * 24 * 60 * 60 * 1000;
const now = Date.now();

// Ensure the analysis output directory exists before we stat files inside it.
mkdirSync(outputDir, { recursive: true });

// Load the bucket universe. Each entry carries at least a `bucket` name and,
// optionally, a `slug` used to derive its analysis filename.
const buckets = JSON.parse(readFileSync(bucketsPath, "utf8"));
if (!Array.isArray(buckets)) throw new Error("macro-buckets.json must contain an array");

// Build the candidate list: for every named bucket, locate its analysis file and
// compute how stale it is. A missing file is treated as infinitely old so that
// never-analysed buckets are always prioritised. Then keep only the stale ones.
const candidates = buckets
  .filter((item) => item && typeof item.bucket === "string" && item.bucket.trim())
  .map((item) => {
    const bucket = item.bucket.trim();
    // Derive a filesystem-safe slug for the analysis filename: prefer an explicit
    // slug, otherwise fall back to the bucket name with unsafe chars collapsed to
    // dashes and leading/trailing dashes trimmed.
    const slug = String(item.slug || bucket).replace(/[^A-Za-z0-9_.-]+/g, "-").replace(/^-+|-+$/g, "") || "bucket";
    const path = join(outputDir, `${slug}.md`);
    // mtimeMs stays 0 (and ageMs Infinity) when the analysis file does not exist.
    let mtimeMs = 0;
    try { mtimeMs = statSync(path).mtimeMs; } catch {}
    return { bucket, slug, path, mtimeMs, ageMs: mtimeMs ? now - mtimeMs : Infinity };
  })
  .filter((item) => item.ageMs >= staleMs);

// Oldest analysis first (missing files, being Infinity, sort to the front); break
// ties by slug so the ordering is deterministic from one run to the next.
candidates.sort((a, b) => a.mtimeMs - b.mtimeMs || a.slug.localeCompare(b.slug));
const selected = candidates[0];

// Nothing is due — report it and exit 0 so the run is recorded as a clean success.
if (!selected) {
  console.log(JSON.stringify({ queued: false, reason: "no stale macro buckets" }));
  process.exit(0);
}

// Enqueue an analysis run for the chosen bucket through Clara's scheduler API.
const response = await fetch(`${base}/api/scheduler`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ task: "analyze-macro-bucket", inputs: { bucket: selected.bucket } }),
});

// Treat any API failure as fatal so the orchestrator surfaces the run as failed.
if (!response.ok) {
  const text = await response.text();
  throw new Error(`Queue request failed: HTTP ${response.status} ${text}`);
}
const result = await response.json();

// Emit a structured record of exactly what was queued, for observability.
console.log(JSON.stringify({
  queued: true,
  taskId: "analyze-macro-bucket",
  workItemId: result.item?.id ?? null,
  bucket: selected.bucket,
  slug: selected.slug,
  previousMtimeMs: selected.mtimeMs || null,
}));
