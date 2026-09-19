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

const answerExamQuestionAction = vi.fn();
const finishExamAction = vi.fn();
const setExplainModeAction = vi.fn();
const refresh = vi.fn();

vi.mock("@/lib/exam/actions", () => ({
  answerExamQuestionAction: (...args: unknown[]) =>
    answerExamQuestionAction(...args),
  finishExamAction: (...args: unknown[]) => finishExamAction(...args),
  setExplainModeAction: (...args: unknown[]) => setExplainModeAction(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const { ExamRunner } = await import("./exam-runner");

const ruleNames = Object.fromEntries(
  allRules.map((rule) => [rule.id, rule.name]),
);
const skillNames = Object.fromEntries(
  skills.map((skill) => [skill.id, skill.name]),
);

const questions = [11, 12, 13].map((seed) =>
  generateQuestion("quad.solve-factor-simple", seed, 1),
);

function renderExam(
  overrides: Partial<{
    timeLimitSec: number;
    elapsedSec: number;
    initialAnswered: Record<string, { answer: string; correct: boolean }>;
    mode: "exam" | "daily";
  }> = {},
) {
  render(
    <NextIntlClientProvider locale="th" messages={messages}>
      <ExamRunner
        runId="run-1"
        questions={questions.map(toPublicQuestion)}
        initialAnswered={overrides.initialAnswered ?? {}}
        initialExplainMode="onWrong"
        timeLimitSec={overrides.timeLimitSec ?? 0}
        elapsedSec={overrides.elapsedSec ?? 0}
        mode={overrides.mode ?? "exam"}
        skillNames={skillNames}
        ruleNames={ruleNames}
        difficultyLabels={DIFFICULTY_LABELS}
      />
    </NextIntlClientProvider>,
  );
}

const answerBox = () =>
  screen.getByLabelText(messages.practice.yourAnswer) as HTMLInputElement;

describe("ExamRunner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    answerExamQuestionAction.mockResolvedValue({
      correct: true,
      steps: null,
      correctAnswer: null,
    });
  });

  it("says where you are in the set", () => {
    renderExam();
    expect(
      screen.getByText(
        messages.exam.questionOf
          .replace("{index}", "1")
          .replace("{total}", "3"),
      ),
    ).toBeInTheDocument();
  });

  /**
   * Moving on without answering was always possible - the arrows do not care -
   * but nothing said so, so a question you could not do read as a wall.
   */
  describe("skipping a question", () => {
    const at = (index: number) =>
      messages.exam.questionOf
        .replace("{index}", String(index))
        .replace("{total}", "3");
    const skipButton = () =>
      screen.getByRole("button", { name: new RegExp(messages.exam.skip) });

    it("moves to the next question you have not answered", async () => {
      const user = userEvent.setup();
      renderExam();

      await user.click(skipButton());

      expect(screen.getByText(at(2))).toBeInTheDocument();
    });

    /**
     * The part worth getting right. Skipping the last question with an earlier
     * one outstanding must go back to it, not sit on the end of the paper with
     * nowhere to go.
     */
    it("wraps back to an earlier unanswered question", async () => {
      const user = userEvent.setup();
      renderExam({
        // The middle one is done; only the first and last are outstanding.
        initialAnswered: {
          [questions[1]!.id]: { answer: "x", correct: true },
        },
      });

      // Start on the first outstanding question, skip to the last, skip again.
      expect(screen.getByText(at(1))).toBeInTheDocument();
      await user.click(skipButton());
      expect(screen.getByText(at(3))).toBeInTheDocument();

      await user.click(skipButton());
      expect(screen.getByText(at(1))).toBeInTheDocument();
    });

    it("flags what it skips, so the strip shows where you left off", async () => {
      const user = userEvent.setup();
      renderExam();

      const flagBefore = screen.getAllByRole("button", {
        name: new RegExp(messages.exam.flag),
      });
      expect(flagBefore.length).toBeGreaterThan(0);

      await user.click(skipButton());

      // Back to the skipped question: it is now flagged, so the toggle reads
      // as active rather than offering to flag it.
      await user.click(
        screen.getByRole("button", { name: messages.exam.previous }),
      );
      expect(screen.getByText(at(1))).toBeInTheDocument();
    });

    /** A button that would move nothing is worse than no button. */
    it("is not offered when there is nowhere to skip to", () => {
      renderExam({
        initialAnswered: {
          [questions[1]!.id]: { answer: "x", correct: true },
          [questions[2]!.id]: { answer: "x", correct: true },
        },
      });

      expect(
        screen.queryByRole("button", { name: new RegExp(messages.exam.skip) }),
      ).not.toBeInTheDocument();
    });

    it("is not offered once the question is answered", async () => {
      const user = userEvent.setup();
      renderExam();

      await user.type(answerBox(), "2, 3{Enter}");
      await waitFor(() => expect(answerExamQuestionAction).toHaveBeenCalled());

      await waitFor(() =>
        expect(
          screen.queryByRole("button", { name: new RegExp(messages.exam.skip) }),
        ).not.toBeInTheDocument(),
      );
    });
  });

  it("records an answer and locks that question", async () => {
    const user = userEvent.setup();
    renderExam();

    await user.type(answerBox(), "2, 3{Enter}");

    await waitFor(() =>
      expect(answerExamQuestionAction).toHaveBeenCalledWith(
        expect.objectContaining({
          runId: "run-1",
          questionId: questions[0]!.id,
        }),
      ),
    );
    await waitFor(() => expect(answerBox()).toBeDisabled());
  });

  it("lets you move between questions and keeps a part-typed answer", async () => {
    const user = userEvent.setup();
    renderExam();

    await user.type(answerBox(), "half-written");
    await user.click(
      screen.getByRole("button", {
        name: messages.exam.goToQuestion.replace("{index}", "2"),
      }),
    );
    expect(answerBox().value).toBe("");

    await user.click(
      screen.getByRole("button", {
        name: messages.exam.goToQuestion.replace("{index}", "1"),
      }),
    );
    expect(answerBox().value).toBe("half-written");
  });

  it("does not show the working when explanations are hidden", async () => {
    answerExamQuestionAction.mockResolvedValue({
      correct: false,
      steps: null,
      correctAnswer: null,
    });
    const user = userEvent.setup();
    renderExam();

    await user.type(answerBox(), "0{Enter}");

    await waitFor(() =>
      expect(screen.getByText(messages.exam.incorrect)).toBeInTheDocument(),
    );
    expect(screen.queryByText(messages.practice.showAllSteps)).toBeNull();
    expect(screen.queryByText(messages.exam.theAnswerIs)).toBeNull();
  });

  it("shows the working when the server sends it", async () => {
    answerExamQuestionAction.mockResolvedValue({
      correct: false,
      steps: questions[0]!.steps,
      correctAnswer: "2, 3",
    });
    const user = userEvent.setup();
    renderExam();

    await user.type(answerBox(), "0{Enter}");

    await waitFor(() =>
      expect(
        document.querySelector('[data-answer="2, 3"]'),
      ).toBeInTheDocument(),
    );
    expect(document.querySelector(".katex")).not.toBeNull();
  });

  it("tells the server when explanations are switched mid-test", async () => {
    const user = userEvent.setup();
    renderExam();

    await user.selectOptions(
      screen.getByLabelText(messages.exam.explainMode),
      "always",
    );
    await waitFor(() =>
      expect(setExplainModeAction).toHaveBeenCalledWith("run-1", "always"),
    );
  });

  /**
   * Finishing throws away every question left blank, and for the daily there
   * is no second attempt that day. One stray click used to be enough.
   */
  describe("finishing", () => {
    const finishButton = () =>
      screen.getByRole("button", { name: messages.exam.submitExam });

    it("does not finish on the first click while questions are unanswered", async () => {
      const user = userEvent.setup();
      renderExam();

      await user.click(finishButton());

      expect(finishExamAction).not.toHaveBeenCalled();
      expect(
        screen.getByText(
          messages.exam.unansweredWarning.replace("{count}", "3"),
        ),
      ).toBeInTheDocument();
    });

    it("offers the unanswered questions as a way back", async () => {
      const user = userEvent.setup();
      renderExam();

      await user.click(finishButton());
      await user.click(
        screen.getByRole("button", { name: messages.exam.keepGoing }),
      );

      expect(finishExamAction).not.toHaveBeenCalled();
      expect(
        screen.getByText(
          messages.exam.questionOf
            .replace("{index}", "1")
            .replace("{total}", "3"),
        ),
      ).toBeInTheDocument();
    });

    it("finishes once the warning has been acknowledged", async () => {
      const user = userEvent.setup();
      renderExam();

      await user.click(finishButton());
      await user.click(
        screen.getByRole("button", { name: messages.exam.finishAnyway }),
      );

      await waitFor(() =>
        expect(finishExamAction).toHaveBeenCalledWith("run-1"),
      );
    });

    it("finishes on one click once every question is answered", async () => {
      const user = userEvent.setup();
      renderExam({
        initialAnswered: Object.fromEntries(
          questions.map((question) => [
            question.id,
            { answer: "2, 3", correct: true },
          ]),
        ),
      });

      await user.click(finishButton());

      await waitFor(() =>
        expect(finishExamAction).toHaveBeenCalledWith("run-1"),
      );
    });

    it("calls it the daily rather than an exam in daily mode", () => {
      renderExam({ mode: "daily" });
      expect(
        screen.getByRole("button", { name: messages.exam.finishDaily }),
      ).toBeInTheDocument();
    });
  });

  it("starts on the first unanswered question when you come back", () => {
    renderExam({
      initialAnswered: {
        [questions[0]!.id]: { answer: "2, 3", correct: true },
      },
    });
    expect(
      screen.getByText(
        messages.exam.questionOf
          .replace("{index}", "2")
          .replace("{total}", "3"),
      ),
    ).toBeInTheDocument();
  });

  it("shows the clock counting down from what is left", () => {
    renderExam({ timeLimitSec: 600, elapsedSec: 60 });
    expect(screen.getByText("9:00")).toBeInTheDocument();
  });
});
