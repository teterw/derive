import { USERNAME_MAX, USERNAME_MIN } from "./constants";

const USERNAME_RE = /^[a-z0-9_.-]+$/;

/** Usernames are stored lower-cased; this is the only way they are written. */
export function normalizeUsername(input: string): string {
  return input.trim().toLowerCase();
}

export function isValidUsername(username: string): boolean {
  return (
    username.length >= USERNAME_MIN &&
    username.length <= USERNAME_MAX &&
    USERNAME_RE.test(username)
  );
}
