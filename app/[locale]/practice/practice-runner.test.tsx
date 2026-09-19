// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { generateQuestion, toPublicQuestion } from "@/content/generators";
import { allRules } from "@/content/rules";
import { skills } from "@/content/topics";
import { DIFFICULTY_LABELS } from "@/content/types";
import messages from "@/messages/th.json";

/**
 * MathLive is not loadable under jsdom - the web component mounts but cannot
 * be typed into - so these tests pin the *fallback* path, which is a real
 * shipped code path: any learner whose browser fails to fetch the 220KB
 * field gets exactly this plain box. The maths-field path has its own file.
 */
vi.mock("mathlive", () => {
  throw new Error("mathlive is unavailable in this environment");
});


const submitAnswerAction = vi.fn();
const nextQuestionAction = vi.fn();
const hintAction = vi.fn();
const explainAction = vi.fn();

vi.mock("@/lib/practice/actions", () => ({
  submitAnswerAction: (...args: unknown[]) => submitAnswerAction(...args),
  nextQuestionAction: (...args: unknown[]) => nextQuestionAction(...args),
  hintAction: (...args: unknown[]) => hintAction(...args),
  explainAction: (...args: unknown[]) => explainAction(...args),
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const { PracticeRunner } = await import("./practice-runner");

const ruleNames = Object.fromEntries(
  allRules.map((rule) => [rule.id, rule.name]),
);
const skillNames = Object.fromEntries(
  skills.map((skill) => [skill.id, skill.name]),
);

/** A real question, so the component is fed exactly what the app feeds it. */
const first = generateQuestion("quad.solve-factor-simple", 7, 1);
const second = generateQuestion("quad.solve-factor-simple", 8, 1);

function renderRunner() {
  render(
    <NextIntlClientProvider locale="th" messages={messages}>
      <PracticeRunner
        config={{ skillIds: [first.skillId], difficulties: [1] }}
        first={toPublicQuestion(first)}
        ruleNames={ruleNames}
        skillNames={skillNames}
        difficultyLabels={DIFFICULTY_LABELS}
      />
    </NextIntlClientProvider>,
  );
}

const answerBox = () =>
  screen.getByLabelText(messages.practice.yourAnswer) as HTMLInputElement;

describe("PracticeRunner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the question, its skill and its difficulty", () => {
    renderRunner();
    expect(
      screen.getByText(skillNames[first.skillId]!.th),
    ).toBeInTheDocument();
    expect(screen.getByText(DIFFICULTY_LABELS[1].th)).toBeInTheDocument();
    expect(document.querySelector(".katex")).not.toBeNull();
  });

  it("marks a correct answer and shows the working", async () => {
    submitAnswerAction.mockResolvedValue({
      result: { correct: true },
      correctAnswer: "2, 3",
      steps: first.steps,
    });
    const user = userEvent.setup();
    renderRunner();

    await user.type(answerBox(), "2, 3{Enter}");

    await waitFor(() =>
      expect(screen.getByText(messages.practice.correct)).toBeInTheDocument(),
    );
    expect(submitAnswerAction).toHaveBeenCalledWith(
      expect.objectContaining({ questionId: first.id, answer: "2, 3" }),
    );
    expect(
      screen.getByText(messages.practice.workingOut),
    ).toBeInTheDocument();
  });

  it("shows the right answer beside yours when you are wrong", async () => {
    submitAnswerAction.mockResolvedValue({
      result: { correct: false, reason: "wrong" },
      correctAnswer: "2, 3",
      steps: first.steps,
    });
    const user = userEvent.setup();
    renderRunner();

    await user.type(answerBox(), "5{Enter}");

    await waitFor(() =>
      expect(screen.getByText(messages.practice.incorrect)).toBeInTheDocument(),
    );
    // Answers are rendered as maths, so KaTeX has split the text across many
    // spans; `data-answer` is the stable handle on what was actually shown.
    expect(document.querySelector('[data-answer="5"]')).toBeInTheDocument();
    expect(document.querySelector('[data-answer="2, 3"]')).toBeInTheDocument();
  });

  it("renders your answer as maths rather than as the keys you pressed", async () => {
    submitAnswerAction.mockResolvedValue({
      result: { correct: false, reason: "wrong" },
      correctAnswer: "3*sqrt(2)",
      steps: first.steps,
    });
    const user = userEvent.setup();
    renderRunner();

    await user.type(answerBox(), "sqrt(18){Enter}");

    await waitFor(() =>
      expect(screen.getByText(messages.practice.incorrect)).toBeInTheDocument(),
    );

    const shown = document.querySelector('[data-answer="3*sqrt(2)"]');
    expect(shown).toBeInTheDocument();
    // A root sign, not the letters s-q-r-t. Read `.katex-html` rather than
    // textContent: KaTeX also emits a MathML annotation holding the TeX
    // source, on purpose, so the formula can be copied out.
    expect(shown?.querySelector(".katex")).toBeTruthy();
    expect(shown?.querySelector(".katex-html")?.textContent).not.toContain(
      "sqrt",
    );
  });

  it("says when the value is right but the form is not", async () => {
    submitAnswerAction.mockResolvedValue({
      result: {
        correct: false,
        reason: "form",
        requirement: "simplified-radical",
      },
      correctAnswer: "2*sqrt(2)",
      steps: first.steps,
    });
    const user = userEvent.setup();
    renderRunner();

    await user.type(answerBox(), "sqrt(8){Enter}");

    await waitFor(() =>
      expect(
        screen.getByText(messages.practice.formError["simplified-radical"]),
      ).toBeInTheDocument(),
    );
  });

  it("moves on to the next question", async () => {
    submitAnswerAction.mockResolvedValue({
      result: { correct: true },
      correctAnswer: "2, 3",
      steps: first.steps,
    });
    nextQuestionAction.mockResolvedValue(toPublicQuestion(second));
    const user = userEvent.setup();
    renderRunner();

    await user.type(answerBox(), "2, 3{Enter}");
    await waitFor(() =>
      expect(screen.getByText(messages.practice.correct)).toBeInTheDocument(),
    );

    await user.click(
      screen.getByRole("button", { name: messages.practice.nextQuestion }),
    );

    await waitFor(() => expect(nextQuestionAction).toHaveBeenCalled());
    await waitFor(() => expect(answerBox().value).toBe(""));
  });

  it("gives one hint at a time, in order", async () => {
    hintAction.mockImplementation(async (_id: string, index: number) =>
      first.hints[index] ?? null,
    );
    const user = userEvent.setup();
    renderRunner();

    const hintButton = screen.getByRole("button", {
      name: new RegExp(messages.practice.hint),
    });

    await user.click(hintButton);
    await waitFor(() =>
      expect(hintAction).toHaveBeenLastCalledWith(first.id, 0),
    );

    await user.click(hintButton);
    await waitFor(() =>
      expect(hintAction).toHaveBeenLastCalledWith(first.id, 1),
    );
  });

  it("will not submit an empty answer", async () => {
    const user = userEvent.setup();
    renderRunner();

    await user.click(
      screen.getByRole("button", { name: messages.practice.submit }),
    );
    expect(submitAnswerAction).not.toHaveBeenCalled();
  });

  it("keeps the current question in the URL", async () => {
    renderRunner();
    await waitFor(() =>
      expect(new URL(window.location.href).searchParams.get("q")).toBe(first.id),
    );
  });
});
