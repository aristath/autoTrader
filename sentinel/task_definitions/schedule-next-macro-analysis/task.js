/**
 * Schedule Next Macro Analysis
 *
 * Advances macro-bucket coverage one bucket at a time. Each run asks
 * pick-and-queue.mjs to find the macro bucket whose analysis is most overdue and
 * enqueue an `analyze-macro-bucket` run for it. The selection/queue logic lives in
 * the script (which runs as a subprocess); this orchestrator simply invokes it and
 * echoes the JSON decision it returns so the run record captures what happened.
 */
const result = await run("pick-and-queue.mjs");
console.log(result.trim());
