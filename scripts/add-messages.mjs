/**
 * Adds message keys to both locale files in one go, so they cannot drift
 * apart: {"namespace": {"key": {"th": "...", "en": "..."}}}
 *
 *   node scripts/add-messages.mjs batch.json
 *
 * Pass the path. Do not pipe the file in from PowerShell - `Get-Content x |
 * node this` re-encodes UTF-8 on the way through and Thai arrives as
 * `à¸¥à¸²à¸`. That happened, and it was invisible: the JSON still parsed,
 * every test passed, and three keys shipped as gibberish. Worse, this script
 * used to strip the BOM PowerShell adds, which removed the only symptom that
 * would have stopped it at the door.
 *
 * Reading the path here means the bytes are never handed to a shell. Stdin
 * still works for Bash redirection, and either way the input is checked before
 * anything is written.
 *
 * `i18n/messages.test.ts` is what enforces this afterwards - the two files
 * agreeing, and neither of them being mojibake.
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** A UTF-8 lead byte followed by a continuation byte, both read as Latin-1. */
const MOJIBAKE = /[ÂÃàáâã][\u0080-¿]/;

function fail(message) {
  console.error(`add-messages: ${message}`);
  process.exit(1);
}

async function readInput() {
  const path = process.argv[2];
  if (path) return readFile(path, "utf8");

  if (process.stdin.isTTY) {
    fail("no input. Pass a path: node scripts/add-messages.mjs batch.json");
  }
  return new Promise((resolve) => {
    let buffer = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => (buffer += chunk));
    process.stdin.on("end", () => resolve(buffer));
  });
}

const raw = await readInput();

/*
 * Before parsing, not after. A re-encoded file is still valid JSON, so
 * JSON.parse is no defence at all - by the time the object exists the damage
 * looks exactly like content someone meant to write.
 */
if (raw.startsWith("﻿")) {
  fail("input begins with a BOM, which means it came through a shell that\n" +
    "  re-encodes. Pass the path instead of piping the file.");
}
if (MOJIBAKE.test(raw)) {
  fail("input is mojibake - UTF-8 read as Latin-1. Pass the path instead of\n" +
    "  piping the file, and check the source file is still intact.");
}

let input;
try {
  input = JSON.parse(raw);
} catch (error) {
  fail(`input is not JSON: ${error.message}`);
}

// Every key needs both locales, or this script is the thing that breaks parity.
for (const [namespace, keys] of Object.entries(input)) {
  for (const [key, values] of Object.entries(keys)) {
    for (const locale of ["th", "en"]) {
      if (typeof values[locale] !== "string" || values[locale].trim() === "") {
        fail(`${namespace}.${key} has no ${locale} string`);
      }
    }
  }
}

const added = Object.values(input).reduce((n, keys) => n + Object.keys(keys).length, 0);

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
  console.log(`${locale}: +${added}`);
}
