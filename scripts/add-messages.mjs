/**
 * Adds message keys to both locale files in one go, so they cannot drift
 * apart. Takes JSON on stdin: {"namespace": {"key": {"th": "...", "en": "..."}}}
 *
 * Used during development rather than in the app; `messages.test.ts` is what
 * enforces the two files agreeing.
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const input = await new Promise((resolve) => {
  let buffer = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk) => (buffer += chunk));
  // PowerShell's Get-Content prepends a BOM, which JSON.parse will not eat.
  process.stdin.on("end", () => resolve(JSON.parse(buffer.replace(/^﻿/, ""))));
});

for (const locale of ["th", "en"]) {
  const path = join(root, "messages", `${locale}.json`);
  const messages = JSON.parse(await readFile(path, "utf8"));

  for (const [namespace, keys] of Object.entries(input)) {
    messages[namespace] ??= {};
    for (const [key, values] of Object.entries(keys)) {
      messages[namespace][key] = values[locale];
    }
  }

  await writeFile(path, JSON.stringify(messages, null, 2) + "\n", "utf8");
  console.log(`${locale}: +${Object.values(input).reduce((n, k) => n + Object.keys(k).length, 0)}`);
}
