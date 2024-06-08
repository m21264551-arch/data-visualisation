import { describe, expect, it } from "vitest";
import {
  OBJECTIVES,
  OPTIMIZERS,
  buildSurface,
  clamp,
  getObjective,
  simulateDescent,
  summarizeRun,
} from "./objectives";

function finitePoint(point) {
  expect(Number.isFinite(point.x)).toBe(true);
  expect(Number.isFinite(point.y)).toBe(true);
  expect(Number.isFinite(point.loss)).toBe(true);
  expect(Number.isFinite(point.gradX)).toBe(true);
  expect(Number.isFinite(point.gradY)).toBe(true);
  expect(Number.isFinite(point.gradNorm)).toBe(true);
}

function makeTrace(losses, gradNorm = 1, point = { x: 9, y: 9 }) {
  return losses.map((loss, iteration) => ({
    iteration,
    x: point.x,
    y: point.y,
    loss,
    gradX: gradNorm,
    gradY: 0,
    gradNorm,
  }));
}

describe("objective definitions", () => {
  it("falls back to the first objective for unknown ids", () => {
    expect(getObjective("missing-objective")).toBe(OBJECTIVES[0]);
  });

  it("keeps clamp values inside the requested interval", () => {
    expect(clamp(-10, -2, 2)).toBe(-2);
    expect(clamp(10, -2, 2)).toBe(2);
    expect(clamp(1.5, -2, 2)).toBe(1.5);
  });

  it("returns finite losses and gradients across sampled domains", () => {
    for (const objective of OBJECTIVES) {
      const [min, max] = objective.domain;
      const sampleValues = [min, (min + max) / 2, max];

      for (const x of sampleValues) {
        for (const y of sampleValues) {
          const loss = objective.f(x, y);
          const [gradX, gradY] = objective.grad(x, y);

          expect(Number.isFinite(loss), `${objective.id} loss`).toBe(true);
          expect(Number.isFinite(gradX), `${objective.id} gradX`).toBe(true);
          expect(Number.isFinite(gradY), `${objective.id} gradY`).toBe(true);
        }
      }
    }
  });

  it("builds normalized finite surfaces", () => {
    for (const objective of OBJECTIVES) {
      const surface = buildSurface(objective, 12);

      expect(surface.rows).toHaveLength(12);
      expect(surface.rows[0]).toHaveLength(12);

      for (const row of surface.rows) {
        for (const point of row) {
          expect(point.z).toBeGreaterThanOrEqual(0);
          expect(point.z).toBeLessThanOrEqual(1);
          expect(Number.isFinite(point.loss)).toBe(true);
        }
      }
    }
  });
});

describe("simulateDescent", () => {
  it("keeps every optimizer finite and bounded at low and high learning rates", () => {
    for (const objective of OBJECTIVES) {
      const [min, max] = objective.domain;

      for (const optimizer of OPTIMIZERS) {
        for (const learningRate of [0.00001, 1]) {
          const trace = simulateDescent({
            objective,
            optimizer: optimizer.id,
            learningRate,
            momentum: 0.98,
            noise: 0.3,
            seed: 42,
            steps: 40,
          });

          expect(trace).toHaveLength(41);

          for (const point of trace) {
            finitePoint(point);
            expect(point.x).toBeGreaterThanOrEqual(min);
            expect(point.x).toBeLessThanOrEqual(max);
            expect(point.y).toBeGreaterThanOrEqual(min);
            expect(point.y).toBeLessThanOrEqual(max);
          }
        }
      }
    }
  });

  it("recovers safely from non-finite objective output", () => {
    const objective = {
      id: "unstable",
      name: "Unstable",
      domain: [-1, 1],
      start: { x: 0.25, y: -0.25 },
      minimum: { x: 0, y: 0 },
      maxStep: 1,
      f: () => Number.POSITIVE_INFINITY,
      grad: () => [Number.NaN, Number.POSITIVE_INFINITY],
    };

    const trace = simulateDescent({
      objective,
      optimizer: "gd",
      learningRate: 1,
      momentum: 0,
      noise: 0,
      seed: 1,
      startPoint: { x: Number.NaN, y: Number.POSITIVE_INFINITY },
      steps: 3,
    });

    expect(trace).toHaveLength(4);
    trace.forEach(finitePoint);
    expect(trace[0].x).toBe(objective.start.x);
    expect(trace[0].y).toBe(objective.start.y);
  });
});

describe("summarizeRun", () => {
  const objective = {
    minimum: { x: 0, y: 0 },
  };

  it("classifies converged, diverging, oscillating, slow, and converging states", () => {
    const converged = summarizeRun(makeTrace([1], 0.001, { x: 0, y: 0 }), 0, objective);
    expect(converged.status).toBe("Converged");

    const divergingLosses = Array.from({ length: 30 }, (_, index) =>
      index < 29 ? 1 : 1.3
    );
    expect(summarizeRun(makeTrace(divergingLosses), 29, objective).status).toBe(
      "Diverging"
    );

    const oscillatingLosses = Array.from({ length: 40 }, (_, index) =>
      index < 22 ? 0.7 : 0.8
    );
    expect(summarizeRun(makeTrace(oscillatingLosses), 39, objective).status).toBe(
      "Oscillating"
    );

    const slowLosses = Array.from({ length: 45 }, (_, index) =>
      index === 0 ? 1 : 0.85 - index * 0.001
    );
    expect(summarizeRun(makeTrace(slowLosses), 44, objective).status).toBe(
      "Slow progress"
    );

    const normalLosses = Array.from({ length: 20 }, (_, index) => 1 - index * 0.02);
    expect(summarizeRun(makeTrace(normalLosses), 19, objective).status).toBe(
      "Converging"
    );
  });
});
