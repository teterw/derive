/** Name of the session cookie. Also read by proxy.ts for the optimistic gate. */
export const SESSION_COOKIE = "derive_session";

/** "Remember me" ticked. */
export const SESSION_TTL_REMEMBER_MS = 30 * 24 * 60 * 60 * 1000;
/** "Remember me" unticked. */
export const SESSION_TTL_SHORT_MS = 12 * 60 * 60 * 1000;

/** Failed logins allowed per username, and per IP, inside the window. */
export const LOGIN_FAILURE_LIMIT = 8;
/** Invite-code guesses allowed per IP inside the window. */
export const INVITE_FAILURE_LIMIT = 8;
export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 24;
export const PASSWORD_MIN = 8;

export const INVITE_CODE_LENGTH = 12;
/** No 0/O/1/I/l: invite codes get read aloud and retyped. */
export const INVITE_CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
