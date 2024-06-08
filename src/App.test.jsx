import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";

function metricsPanel() {
  return screen.getByLabelText("Current optimizer metrics");
}

describe("Gradient Lab app", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts paused when the user prefers reduced motion", () => {
    render(<App />);

    expect(screen.getByRole("status")).toHaveTextContent("Paused");
    expect(screen.getByTestId("toggle-run")).toHaveAccessibleName("Run animation");
  });

  it("resets learning rate when the objective changes", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.selectOptions(screen.getByLabelText("Function"), "bowl");

    expect(screen.getByLabelText("Function")).toHaveValue("bowl");
    expect(screen.getByText("0.080")).toBeInTheDocument();
    expect(screen.getByTestId("metric-iteration")).toHaveTextContent("0");
  });

  it("updates controls, metrics, and views from user interaction", async () => {
    const user = userEvent.setup();
    render(<App />);

    fireEvent.change(screen.getByLabelText(/Momentum/i), {
      target: { value: "0.5" },
    });
    expect(screen.getByText("0.500")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "2x" }));
    expect(screen.getByRole("button", { name: "2x" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );

    await user.click(screen.getByRole("button", { name: "Contour" }));
    expect(screen.getByRole("button", { name: "Contour" })).toHaveClass("active");

    await user.click(screen.getByTestId("step-once"));
    expect(screen.getByTestId("metric-iteration")).toHaveTextContent("1");

    await user.click(screen.getByTestId("reset-path"));
    expect(screen.getByTestId("metric-iteration")).toHaveTextContent("0");

    await user.click(screen.getByTestId("toggle-run"));
    expect(screen.getByRole("status")).toHaveTextContent("Running");
  });

  it("generates a new deterministic start point when requested", async () => {
    const user = userEvent.setup();
    const randomSpy = vi
      .spyOn(Math, "random")
      .mockReturnValueOnce(0.95)
      .mockReturnValueOnce(0.1);
    render(<App />);

    const before = within(metricsPanel()).getByTestId("param-x").textContent;

    await user.click(screen.getByTestId("new-path"));

    expect(within(metricsPanel()).getByTestId("param-x").textContent).not.toBe(
      before
    );
    expect(randomSpy).toHaveBeenCalled();
  });

  it("exposes a non-visual canvas summary", () => {
    render(<App />);

    expect(screen.getByRole("img", { name: /loss landscape visualization/i }))
      .toBeInTheDocument();
    expect(screen.getByText(/loss landscape for rosenbrock/i)).toHaveClass(
      "sr-only"
    );
  });

  it("renders an educational guide below the playground", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "What is Gradient Lab?" })
    ).toBeInTheDocument();
    expect(screen.getByText("How to use it")).toBeInTheDocument();
    expect(screen.getByText("What the visuals mean")).toBeInTheDocument();
    expect(
      screen.getByRole("complementary", { name: "Gradient descent controls" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Is this a neural network?")
    ).toBeInTheDocument();
  });
});
