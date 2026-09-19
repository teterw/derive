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
