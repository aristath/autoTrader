import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { jsonrepair } = require("./vendor/jsonrepair.cjs");

let input = "";
process.stdin.setEncoding("utf8");
for await (const chunk of process.stdin) input += chunk;

try {
  process.stdout.write(jsonrepair(input));
} catch (error) {
  process.stderr.write(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
