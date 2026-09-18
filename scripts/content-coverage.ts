/**
 * `pnpm content:coverage`
 *
 * Prints, per skill: how many generators it has, which difficulties are
 * reachable, whether a lesson exists, whether every rule it references is in
 * the registry, and how the shape catalogue is doing.
 *
 * This is the first thing the weekly content session runs
 * (docs/CONTENT-PIPELINE.md §5). The repo is the memory; a session next month
 * knows nothing except what is committed.
 */
import { readFileSync } from "node:fs";
import { hasRule } from "../content/rules";
import { skills, topics } from "../content/topics";
import { hasLesson } from "../content/lessons";
import {
  difficultiesForSkill,
  generatorsForSkill,
} from "../content/generators";

type ShapeCounts = { done: number; todo: number };

function shapeCounts(topicId: string): Record<string, ShapeCounts> | null {
  let text: string;
  try {
    text = readFileSync(`content/shapes/${topicId}.md`, "utf8");
  } catch {
    return null;
  }

  const counts: Record<string, ShapeCounts> = {};
  let current: string | null = null;
  for (const line of text.split(/\r?\n/)) {
    const heading = /^##\s+(\S+)/.exec(line);
    if (heading) {
      current = heading[1]!;
      counts[current] = { done: 0, todo: 0 };
      continue;
    }
    if (!current) continue;
    if (/^- \[x\]/i.test(line)) counts[current]!.done += 1;
    else if (/^- \[ \]/.test(line)) counts[current]!.todo += 1;
  }
  return counts;
}

function pad(text: string, width: number): string {
  return text.length >= width ? text : text + " ".repeat(width - text.length);
}

let problems = 0;

for (const topic of topics) {
  const shapes = shapeCounts(topic.id);
  console.log(`\n${topic.id}  ${topic.name.th}`);
  if (!shapes) {
    console.log("  (no content/shapes/*.md - the weekly session has no map)");
  }
  console.log(
    `  ${pad("skill", 26)} ${pad("gens", 5)} ${pad("difficulties", 14)} ${pad(
      "lesson",
      7
    )} shapes`,
  );

  for (const skill of skills.filter((s) => s.topicId === topic.id)) {
    const generators = generatorsForSkill(skill.id);
    const difficulties = difficultiesForSkill(skill.id);
    const lesson = hasLesson(skill.id);
    const shape = shapes?.[skill.id];

    const missingRules = skill.ruleIds.filter((id) => !hasRule(id));
    const missingDifficulties = [1, 2, 3, 4].filter(
      (d) => !difficulties.includes(d as 1 | 2 | 3 | 4),
    );

    if (generators.length === 0) problems += 1;
    if (missingDifficulties.length > 0) problems += 1;
    if (!lesson) problems += 1;
    if (missingRules.length > 0) problems += 1;

    console.log(
      `  ${pad(skill.id, 26)} ${pad(String(generators.length), 5)} ${pad(
        difficulties.join(",") || "-",
        14,
      )} ${pad(lesson ? "yes" : "NO", 7)} ${
        shape ? `${shape.done} done, ${shape.todo} to build` : "-"
      }`,
    );

    if (missingRules.length > 0) {
      console.log(`      missing rules: ${missingRules.join(", ")}`);
    }
    if (missingDifficulties.length > 0) {
      console.log(
        `      no generator at difficulty ${missingDifficulties.join(", ")}`,
      );
    }
  }
}

console.log(
  problems === 0
    ? "\nEverything a skill needs is present."
    : `\n${problems} gap(s) above.`,
);
