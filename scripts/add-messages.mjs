/**
 * Adds message keys to both locale files in one go, so they cannot drift
 * apart: {"namespace": {"key": {"th": "...", "en": "..."}}}
 *
 *   node scripts/add-messages.mjs batch.json
 *
 * Pass the path. Do not pipe the file in from PowerShell - `Get-Content x |
 * node this` re-encodes UTF-8 on the way through, and Thai arrives as a run of
 * accented Latin letters. That happened, and it was invisible: the JSON still
 * parsed, every test passed, and three keys shipped as gibberish. Worse, this
 * script used to strip the BOM PowerShell adds, which removed the only symptom
 * that would have stopped it at the door.
 *
 * Reading the path here means the bytes are never handed to a shell. Stdin
 * still works for Bash redirection, and either way the input is checked before
 * anything is written.
 *
 * `scripts/encoding.test.ts` is what catches this afterwards, across every text
 * file in the repo; `i18n/messages.test.ts` covers the two locales agreeing.
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/*
 * Built from code points, and this file is kept ASCII. Writing the characters
 * out means the file contains an example of what it rejects - and a `\u`
 * escape is not reliably still an escape once some of the editing tools here
 * have written it to disk.
 */
const BOM = String.fromCharCode(0xfeff);
const LEADS = new Set([0x00c2, 0x00c3, 0x00e0, 0x00e1, 0x00e2, 0x00e3]);

/** A UTF-8 lead byte followed by a continuation byte, both read as Latin-1. */
function isMojibake(text) {
  for (let i = 0; i < text.length - 1; i += 1) {
    if (!LEADS.has(text.charCodeAt(i))) continue;
    const next = text.charCodeAt(i + 1);
    if (next >= 0x0080 && next <= 0x00bf) return true;
  }
  return false;
}

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
 * Before parsing, not after. Re-encoded text is still valid JSON, so
 * JSON.parse is no defence at all - by the time the object exists the damage
 * looks exactly like content someone meant to write.
 */
if (raw.startsWith(BOM)) {
  fail(
    "input begins with a byte-order mark, which means it came through a shell\n" +
      "  that re-encodes. Pass the path instead of piping the file.",
  );
}
if (isMojibake(raw)) {
  fail(
    "input is mojibake - UTF-8 read as Latin-1. Pass the path instead of\n" +
      "  piping the file, and check the source file is still intact.",
  );
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
