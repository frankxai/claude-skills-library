// Runs the gate against the two fixture folders. Run with: npm run test:gate
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkDir } from "./check-publication.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const pass = checkDir(path.join(here, "fixtures", "pass")).flatMap((r) => r.errors);
const fail = checkDir(path.join(here, "fixtures", "fail")).flatMap((r) => r.errors);
if (pass.length) { console.error("pass fixture should have no errors:", pass); process.exit(1); }
if (!fail.length) { console.error("fail fixture should have errors"); process.exit(1); }
console.log("Gate test passed.");
