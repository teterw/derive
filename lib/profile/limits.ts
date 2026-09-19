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

/**
 * The most the server will accept, after the editor has downscaled.
 *
 * It used to say 6MB, which was a promise the platform could not keep: server
 * actions cap a request body at 1MB by default and Vercel caps a serverless
 * request at 4.5MB whatever the framework says. A real phone photo therefore
 * failed inside the framework before this constant was ever consulted.
 *
 * 4MB sits under the platform ceiling, and the editor means a real upload is
 * a couple of hundred kilobytes anyway - this is the backstop, not the path.
 */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

/**
 * What the browser downscales to before uploading.
 *
 * Large enough that the server's crop still has pixels to work with, small
 * enough that the upload is quick on mobile data - which is the connection
 * this app is actually used on.
 */
export const UPLOAD_MAX_EDGE = 1024;

/** Avatars are shown between 28px and 80px; 256 covers every retina case. */
export const AVATAR_SIZE = 256;
