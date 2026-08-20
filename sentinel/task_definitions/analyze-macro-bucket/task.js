/**
 * Analyze Macro Bucket
 *
 * Researches one macro bucket (a country + industry segment) for a 5-10 year
 * horizon and persists the findings. Takes a manual `bucket` input. Flow:
 *
 *   1. resolve-bucket.py looks the bucket up in macro-buckets.json and prepares paths.
 *   2. Web-search for relevant macro sources, then collect-macro-source-urls.py
 *      filters the results down to readable URLs.
 *   3. read-macro-sources.py summarises each source (via the url-summarizer service)
 *      and builds a numbered citation index; load-macro-source-summaries.py reads them back.
 *   4. The research prompt extracts structural findings (and may pull more sources);
 *      the distill prompt condenses them into actionable theses.
 *   5. finalize-macro-report.py writes the <bucket>.md report and stores one mem0
 *      memory per finding.
 *
 * Triggered by schedule-next-macro-analysis (manual `bucket` input).
 */

// Resolve the requested bucket and prepare its scratch + report paths.
const resolved = JSON.parse(await run("resolve-bucket.py", { env: { BUCKET: process.env.bucket || "" } }));
const item = resolved[0];
const names = Array.isArray(item.names) ? item.names.join(", ") : (item.names || "");

// 1. Search the web for macro sources on this country + industry.
const searchResults = await tool("searxng_web_search", {
  query: `${item.country_name} ${item.industry} macro regulation policy trade supply chain demand capital spending infrastructure`,
  language: "all",
  time_range: "month",
  pageno: 1,
}, { timeoutSeconds: 120 });

// 2. Filter the results down to readable source URLs.
const sources = await run("collect-macro-source-urls.py", { env: { SEARCH_TEXT: searchResults, WORK_ROOT: item.workRoot } });

// 3. Summarise each source, then load the accumulated summaries back.
await run("read-macro-sources.py", { timeoutSeconds: 900, env: { SOURCES_JSON: sources, WORK_ROOT: item.workRoot } });
const sourceSummaries = await run("load-macro-source-summaries.py", { env: { WORK_ROOT: item.workRoot } });

// 4. Research the structural picture, then distill it into actionable theses.
const promptContext = { bucket: item.bucket, country_name: item.country_name, country_code: item.country_code, industry: item.industry, names };
const rawFindings = await prompt("extract-macro-findings.md", { timeoutSeconds: 1500, context: { ...promptContext, sourceSummaries } });
const distilled = await prompt("distill-macro-findings.md", { timeoutSeconds: 900, context: { ...promptContext, rawFindings } });

// 5. Write the canonical report and persist findings to mem0.
const result = await run("finalize-macro-report.py", { timeoutSeconds: 300, env: { ITEM_JSON: JSON.stringify(item), DISTILL_OUTPUT: distilled } });
console.log(result.trim());
