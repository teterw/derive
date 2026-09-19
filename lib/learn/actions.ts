"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/session";
import { getSkill } from "@/content/topics";
import { routing, type Locale } from "@/i18n/routing";
import { recordLessonTest, type LessonResult } from "./progress";

/**
 * Files a sat lesson test.
 *
 * The score arrives from the runner, which means it arrives from a browser -
 * so this is worth being clear about. It cannot be trusted as a claim about
 * skill, and it is not used as one: every question in the test was marked on
 * the server as it was answered, and those attempts are what `attempts`,
 * `daily_stats` and `skill_mastery` are built from. What this writes is only
 * the tick on a checklist and the gate on the daily challenge.
 *
 * The score is still clamped to the length of a real test, so the tick cannot
 * be obtained by posting a large number at it.
 */
export async function recordLessonTestAction(input: {
  skillId: string;
  correct: number;
  asked: number;
  locale: string;
}): Promise<LessonResult | null> {
  const user = await getSessionUser();
  if (!user) return null;

  // A skill that is not in the content is not a lesson anyone can pass.
  let skillId: string;
  try {
    skillId = getSkill(input.skillId).id;
  } catch {
    return null;
  }

  const asked = clampCount(input.asked);
  const correct = Math.min(asked, clampCount(input.correct));
  if (asked === 0) return null;

  const result = await recordLessonTest(user.id, skillId, correct, asked);

  const locale: Locale = (routing.locales as readonly string[]).includes(
    input.locale,
  )
    ? (input.locale as Locale)
    : routing.defaultLocale;
  revalidatePath(`/${locale}/learn`);
  revalidatePath(`/${locale}/learn/${skillId}`);
  revalidatePath(`/${locale}/daily`);

  return result;
}

/** A count off a form is a number only if it says it is, and only a small one. */
function clampCount(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(100, Math.floor(n));
}
