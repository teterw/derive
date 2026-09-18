import { describe, expect, it } from "vitest";
import {
  formatInviteCode,
  generateInviteCode,
  normalizeInviteCode,
} from "./invite";
import { isValidUsername, normalizeUsername } from "./username";
import { hashPassword, verifyPassword } from "./password";
import { INVITE_CODE_ALPHABET, INVITE_CODE_LENGTH } from "./constants";

describe("invite codes", () => {
  it("are the right length and avoid look-alike characters", () => {
    for (let i = 0; i < 200; i++) {
      const code = generateInviteCode();
      expect(code).toHaveLength(INVITE_CODE_LENGTH);
      for (const ch of code) expect(INVITE_CODE_ALPHABET).toContain(ch);
      expect(code).not.toMatch(/[01IOL]/);
    }
  });

  it("do not repeat", () => {
    const codes = new Set(
      Array.from({ length: 500 }, () => generateInviteCode()),
    );
    expect(codes.size).toBe(500);
  });

  it("normalize what a human actually types", () => {
    const code = generateInviteCode();
    expect(normalizeInviteCode(formatInviteCode(code))).toBe(code);
    expect(normalizeInviteCode(` ${code.toLowerCase()} `)).toBe(code);
    expect(normalizeInviteCode(code.split("").join(" "))).toBe(code);
  });

  it("format in groups of four", () => {
    expect(formatInviteCode("ABCDEFGHJKMN")).toBe("ABCD-EFGH-JKMN");
  });
});

describe("usernames", () => {
  it("are stored lower-cased and trimmed", () => {
    expect(normalizeUsername("  SomeBody ")).toBe("somebody");
  });

  it("accept the documented character set", () => {
    for (const ok of ["abc", "a_b.c-d", "student2026", "x".repeat(24)]) {
      expect(isValidUsername(ok)).toBe(true);
    }
    for (const bad of ["ab", "x".repeat(25), "has space", "ไทย", "Upper", ""]) {
      expect(isValidUsername(bad)).toBe(false);
    }
  });
});

describe("passwords", () => {
  it("round-trip through argon2id", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(hash.startsWith("$argon2id$")).toBe(true);
    expect(await verifyPassword(hash, "correct horse battery staple")).toBe(
      true,
    );
    expect(await verifyPassword(hash, "Correct horse battery staple")).toBe(
      false,
    );
  });

  it("salt, so the same password hashes differently every time", async () => {
    const [a, b] = await Promise.all([
      hashPassword("same-password"),
      hashPassword("same-password"),
    ]);
    expect(a).not.toBe(b);
  });

  it("treat a corrupt hash as a failed login, not a crash", async () => {
    expect(await verifyPassword("not-a-hash", "anything")).toBe(false);
  });
});
