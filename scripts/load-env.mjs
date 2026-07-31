/**
 * Loads environment variables for tests without depending on a CI-provided shell.
 *
 * Reads the first existing file out of `.env` / `.env.example` and populates
 * `process.env` — but only for keys that are not already set, so inline vars
 * (e.g. `DB_DATABASE=connectdots_test`) always win.
 */
import fs from "node:fs";

const CANDIDATE_FILES = [".env", ".env.example"];

for (const file of CANDIDATE_FILES) {
  if (!fs.existsSync(file)) continue;

  const content = fs.readFileSync(file, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();

    // Strip surrounding single/double quotes (shell-style .env syntax)
    if (value.length >= 2) {
      const first = value[0];
      const last = value[value.length - 1];
      if (
        ((first === '"' && last === '"') || (first === "'" && last === "'")) &&
        value.length >= 2
      ) {
        value = value.slice(1, -1);
      }
    }

    if (!(key in process.env)) process.env[key] = value;
  }

  break;
}