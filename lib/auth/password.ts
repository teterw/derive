import { hash, verify, type Options } from "@node-rs/argon2";

/**
 * OWASP's argon2id baseline: 19 MiB, 2 passes, 1 lane.
 *
 * `Algorithm.Argon2id` is an ambient `const enum`, which `isolatedModules`
 * forbids reading, and whose runtime object is empty - so the literal it is.
 */
const ARGON2ID = 2;

const HASH_OPTIONS: Options = {
  algorithm: ARGON2ID,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

export function hashPassword(password: string): Promise<string> {
  return hash(password, HASH_OPTIONS);
}

/** Parameters are read back out of the stored PHC string, not passed in. */
export async function verifyPassword(
  passwordHash: string,
  password: string,
): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    // A malformed or truncated hash is a failed login, not a crash.
    return false;
  }
}
