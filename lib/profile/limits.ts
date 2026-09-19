/**
 * Shared limits for the profile form.
 *
 * These live apart from `actions.ts` because a `"use server"` module may only
 * export async functions - exporting a constant from one makes Turbopack treat
 * the whole file as having no exports at all, and the error it gives
 * ("The module has no exports") points at the importer rather than the cause.
 */

/** The longest bio worth having on a card this size. */
export const BIO_MAX = 160;

/** Long enough for a Thai full name, short enough to fit a leaderboard row. */
export const DISPLAY_NAME_MAX = 40;

/*
 * The avatar limits live here rather than beside `prepareAvatar` for the same
 * reason: that module imports sharp, and the settings form is a client
 * component. Importing one constant from it drags a native image library
 * towards the browser, and the build fails on `child_process` with a stack
 * that points at the form rather than at the import.
 */

/** What the file picker offers. The stored image is always WebP regardless. */
export const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

/** Before re-encoding. Comfortably more than a phone photo needs. */
export const MAX_UPLOAD_BYTES = 6 * 1024 * 1024;

/** Avatars are shown between 28px and 80px; 256 covers every retina case. */
export const AVATAR_SIZE = 256;
