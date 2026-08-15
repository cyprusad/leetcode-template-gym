import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AttemptSessionView } from "./canonicalTypes";
import { SolutionCoach } from "./SolutionCoach";

vi.mock("@monaco-editor/react", () => ({
  DiffEditor: () => <div data-testid="diff-editor" />
}));

function session(overrides: Partial<AttemptSessionView> = {}): AttemptSessionView {
  return {
    attemptId: "attempt-1",
    drillId: "normal:binary_search",
    phase: "active",
    startedAtMs: 0,
    elapsedSeconds: 0,
    failedRunCount: 0,
    currentSource: "your source",
    passingSource: null,
    pointsEnabled: false,
    ...overrides
  };
}

describe("SolutionCoach", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders no card when the registry has no solution", () => {
    const { container } = render(
      <SolutionCoach session={session()} canonicalSource={null} theme="dark" />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("opens a one-time Peek and consumes it after expiry", () => {
    vi.useFakeTimers();
    render(
      <SolutionCoach session={session()} canonicalSource="canonical source" theme="dark" />
    );

    fireEvent.click(screen.getByRole("button", { name: "Peek for 10 seconds" }));
    expect(screen.getByText("Use your one-time 10-second canonical peek?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Use 10-second peek" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Peek ends in 10s")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(10_000);
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Peek used" })).toBeDisabled();
  });

  it("unlocks immediately after PASS and compares the passing snapshot", () => {
    render(
      <SolutionCoach
        session={session({ phase: "passed", passingSource: "the passing snapshot" })}
        canonicalSource="canonical source"
        theme="light"
      />
    );

    expect(screen.getByText("Passed. Compare your rep with the reference pattern.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Compare solution" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByTestId("diff-editor")).toBeInTheDocument();
  });

  it("blocks clipboard actions while comparison is open", () => {
    render(
      <SolutionCoach
        session={session({ phase: "passed", passingSource: "passing source" })}
        canonicalSource="canonical source"
        theme="dark"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Compare solution" }));
    const copyEvent = new Event("copy", { cancelable: true });
    document.dispatchEvent(copyEvent);
    expect(copyEvent.defaultPrevented).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Close canonical comparison" }));
    const afterCloseEvent = new Event("copy", { cancelable: true });
    document.dispatchEvent(afterCloseEvent);
    expect(afterCloseEvent.defaultPrevented).toBe(false);
  });

  it("notifies the app when Peek pauses and resumes the timer", () => {
    const onPeekStateChange = vi.fn();
    render(
      <SolutionCoach
        session={session()}
        canonicalSource="canonical source"
        theme="dark"
        onPeekStateChange={onPeekStateChange}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Peek for 10 seconds" }));
    fireEvent.click(screen.getByRole("button", { name: "Use 10-second peek" }));
    expect(onPeekStateChange).toHaveBeenLastCalledWith(true);

    fireEvent.click(screen.getByRole("button", { name: "Close canonical comparison" }));
    expect(onPeekStateChange).toHaveBeenLastCalledWith(false);
  });

  it("unlocks after a failed run and five minutes", () => {
    const { rerender } = render(
      <SolutionCoach session={session({ failedRunCount: 1, elapsedSeconds: 299 })} canonicalSource="canonical source" theme="dark" />
    );
    expect(screen.getByRole("button", { name: "Peek for 10 seconds" })).toBeEnabled();
    rerender(
      <SolutionCoach session={session({ failedRunCount: 1, elapsedSeconds: 300 })} canonicalSource="canonical source" theme="dark" />
    );
    expect(screen.getByText("Practice window reached. Review the reference pattern.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Compare solution" })).toBeInTheDocument();
  });
});
