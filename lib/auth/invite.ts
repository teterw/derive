import { randomInt } from "node:crypto";
import { INVITE_CODE_ALPHABET, INVITE_CODE_LENGTH } from "./constants";

/**
 * 12 characters from a 31-symbol alphabet with the look-alikes removed
 * (0/O/1/I/l). Codes are shown to the admin in plaintext on purpose - they
 * have to be able to send one to someone.
 */
export function generateInviteCode(): string {
  let code = "";
  for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
    code += INVITE_CODE_ALPHABET[randomInt(INVITE_CODE_ALPHABET.length)];
  }
  return code;
}

/**
 * Accepts what a human types: spaces, dashes, and the wrong case. No
 * look-alike substitution - the alphabet already contains neither member of
 * any confusable pair, so a typed `O` or `1` is a misread we cannot repair.
 */
export function normalizeInviteCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** Formats a code for display in groups of four: ABCD-EFGH-JKMN. */
export function formatInviteCode(code: string): string {
  return code.replace(/(.{4})(?=.)/g, "$1-");
}
