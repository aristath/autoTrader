import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import readline from "node:readline";
import vm from "node:vm";

const scriptPath = process.argv[2];
if (!scriptPath) throw new Error("task.js path is required");
const taskId = process.argv[3] || "task";
const taskDir = dirname(scriptPath);
const pending = new Map();
let requestId = 0;

const input = readline.createInterface({ input: process.stdin, terminal: false });
input.on("line", (line) => {
  let message;
  try { message = JSON.parse(line); } catch { return; }
  const waiter = pending.get(message.id);
  if (!waiter) return;
  pending.delete(message.id);
  if (message.error) waiter.reject(new Error(message.error));
  else waiter.resolve(message.result ?? "");
});

function emit(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

function call(method, params = {}) {
  const id = ++requestId;
  emit({ type: "call", id, method, params });
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

const log = (...args) => emit({ type: "log", text: args.map((value) => {
  if (typeof value === "string") return value;
  try { return JSON.stringify(value); } catch { return String(value); }
}).join(" ") });

const sandboxProcess = Object.create(process);
sandboxProcess.env = { ...process.env };
sandboxProcess.exit = (code = 0) => { const error = new Error(`__SENTINEL_EXIT__${code}`); error.exitCode = code; throw error; };

const source = await readFile(scriptPath, "utf8");
const require = createRequire(scriptPath);
const names = ["require", "module", "exports", "__filename", "__dirname", "console", "process", "prompt", "run", "tool", "task"];
const wrapped = `(async function (${names.join(",")}) {\n${source}\n})`;
const moduleObject = { exports: {} };

try {
  const fn = vm.runInThisContext(wrapped, { filename: scriptPath, lineOffset: -1 });
  await fn(
    require, moduleObject, moduleObject.exports, scriptPath, taskDir,
    { log, info: log, warn: log, error: log, debug: log }, sandboxProcess,
    (file, options) => call("prompt", { file, options, env: sandboxProcess.env }),
    (file, options) => call("run", { file, options, env: sandboxProcess.env }),
    (name, args, options) => call("tool", { name, args, options, env: sandboxProcess.env }),
    { id: taskId, dir: taskDir },
  );
  emit({ type: "done" });
} catch (error) {
  if (error?.exitCode === 0) emit({ type: "done" });
  else emit({ type: "error", error: error?.stack || String(error) });
} finally {
  input.close();
}
