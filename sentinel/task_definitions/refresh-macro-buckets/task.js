/**
 * Refresh Macro Buckets
 *
 * Rebuilds the macro-bucket list from the latest securities-universe snapshot by
 * running write-macro-buckets.py, then echoes the script's JSON summary (bucket
 * count, skipped count, output paths) into the run record. Downstream tasks
 * (schedule-next-macro-analysis, analyze-macro-bucket) consume the bucket list.
 */
const result = await run("write-macro-buckets.py");
console.log(result.trim());
