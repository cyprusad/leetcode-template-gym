import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getPeekTone, SolutionComparison } from "./SolutionComparison";

vi.mock("@monaco-editor/react", () => ({
  DiffEditor: () => <div data-testid="diff-editor" />
}));

describe("SolutionComparison peek timer", () => {
  afterEach(cleanup);

  it("renders peek ends text with lowercase s", () => {
    render(
      <SolutionComparison
        originalSource="a"
        canonicalSource="b"
        theme="dark"
        mode="peek"
        remainingSeconds={10}
        onClose={() => {}}
      />
    );
    const timer = screen.getByTestId("peek-timer");
    expect(timer.textContent).toBe("Peek ends in 10s");
    expect(timer.textContent).not.toMatch(/Peek ends in \d+S/);
    expect(timer.textContent).toMatch(/Peek ends in \d+s$/);
  });

  it("uses prominent peekTimer class", () => {
    render(
      <SolutionComparison
        originalSource="a"
        canonicalSource="b"
        theme="dark"
        mode="peek"
        remainingSeconds={10}
        onClose={() => {}}
      />
    );
    const timer = screen.getByTestId("peek-timer");
    // prominent badge should contain peekTimer base class
    expect(timer.className).toMatch(/peekTimer/);
    expect(timer.getAttribute("aria-live")).toBe("polite");
  });

  it("transitions green -> yellow -> red as time goes to 0", () => {
    // green safe for 7-10s
    expect(getPeekTone(10)).toBe("peekTimerSafe");
    expect(getPeekTone(7)).toBe("peekTimerSafe");
    // yellow warning for 4-6s
    expect(getPeekTone(6)).toBe("peekTimerWarning");
    expect(getPeekTone(4)).toBe("peekTimerWarning");
    // red danger for 0-3s
    expect(getPeekTone(3)).toBe("peekTimerDanger");
    expect(getPeekTone(0)).toBe("peekTimerDanger");

    const { rerender } = render(
      <SolutionComparison
        originalSource="a"
        canonicalSource="b"
        theme="light"
        mode="peek"
        remainingSeconds={10}
        onClose={() => {}}
      />
    );
    expect(screen.getByTestId("peek-timer").className).toMatch(/peekTimerSafe/);

    rerender(
      <SolutionComparison
        originalSource="a"
        canonicalSource="b"
        theme="light"
        mode="peek"
        remainingSeconds={5}
        onClose={() => {}}
      />
    );
    expect(screen.getByTestId("peek-timer").className).toMatch(/peekTimerWarning/);

    rerender(
      <SolutionComparison
        originalSource="a"
        canonicalSource="b"
        theme="light"
        mode="peek"
        remainingSeconds={1}
        onClose={() => {}}
      />
    );
    expect(screen.getByTestId("peek-timer").className).toMatch(/peekTimerDanger/);
  });

  it("shows reference unlocked without timer in permanent mode", () => {
    render(
      <SolutionComparison
        originalSource="a"
        canonicalSource="b"
        theme="dark"
        mode="permanent"
        remainingSeconds={0}
        onClose={() => {}}
      />
    );
    expect(screen.getByText("Reference unlocked")).toBeInTheDocument();
    expect(screen.queryByTestId("peek-timer")).not.toBeInTheDocument();
  });
});
