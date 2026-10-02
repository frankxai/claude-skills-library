#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const script = path.join(path.dirname(fileURLToPath(import.meta.url)), "validate_skills.py");
const python = process.env.PYTHON ?? (process.platform === "win32" ? "python" : "python3");
const result = spawnSync(python, [script], { stdio: "inherit" });

if (result.error) {
  console.error(`Unable to run ${python}: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
