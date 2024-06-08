export const OBJECTIVES = [
  {
    id: "rosenbrock",
    name: "Rosenbrock (2D)",
    description: "Classic non-convex valley with a narrow route to the minimum.",
    domain: [-2, 2],
    start: { x: -1.42, y: 1.34 },
    minimum: { x: 1, y: 1 },
    defaultLearningRate: 0.001,
    maxStep: 0.16,
    f: (x, y) => (1 - x) ** 2 + 100 * (y - x * x) ** 2,
    grad: (x, y) => [
      -2 * (1 - x) - 400 * x * (y - x * x),
      200 * (y - x * x),
    ],
  },
  {
    id: "bowl",
    name: "Elliptic Bowl",
    description: "Convex surface that shows clean, direct convergence.",
    domain: [-2, 2],
    start: { x: -1.58, y: 1.45 },
    minimum: { x: 0.25, y: -0.45 },
    defaultLearningRate: 0.08,
    maxStep: 0.22,
    f: (x, y) => 1.1 * (x - 0.25) ** 2 + 0.42 * (y + 0.45) ** 2,
    grad: (x, y) => [2.2 * (x - 0.25), 0.84 * (y + 0.45)],
  },
  {
    id: "saddle",
    name: "Saddle + Walls",
    description: "A saddle-shaped landscape that exposes optimizer instability.",
    domain: [-2, 2],
    start: { x: -1.2, y: 1.18 },
    minimum: { x: 0, y: 1.29 },
    defaultLearningRate: 0.035,
    maxStep: 0.2,
    f: (x, y) => 0.18 * x ** 4 + 0.18 * y ** 4 + 0.62 * x ** 2 - 0.6 * y ** 2 + 0.55,
    grad: (x, y) => [0.72 * x ** 3 + 1.24 * x, 0.72 * y ** 3 - 1.2 * y],
  },
  {
    id: "ripple",
    name: "Ripple Basin",
    description: "Non-convex ripples with local traps and curved gradients.",
    domain: [-2, 2],
    start: { x: -1.55, y: -1.15 },
    minimum: { x: -0.48, y: 0.86 },
    defaultLearningRate: 0.035,
    maxStep: 0.16,
    f: (x, y) =>
      0.2 * (x * x + y * y) +
      0.32 * Math.sin(2.8 * x) * Math.cos(2.3 * y) +
      0.32,
    grad: (x, y) => [
      0.4 * x + 0.896 * Math.cos(2.8 * x) * Math.cos(2.3 * y),
      0.4 * y - 0.736 * Math.sin(2.8 * x) * Math.sin(2.3 * y),
    ],
  },
];

export const OPTIMIZERS = [
  { id: "gd", name: "Gradient Descent" },
  { id: "momentum", name: "Momentum (Heavy-Ball)" },
  { id: "adam", name: "Adam" },
];

export function getObjective(id) {
  return OBJECTIVES.find((objective) => objective.id === id) ?? OBJECTIVES[0];
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function finiteOr(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

function clampPoint(point, fallback, min, max) {
  return {
    x: clamp(finiteOr(point?.x, fallback.x), min, max),
    y: clamp(finiteOr(point?.y, fallback.y), min, max),
  };
}

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function randomSigned(random) {
  return random() * 2 - 1;
}

function limitVector(dx, dy, maxLength) {
  const length = Math.hypot(dx, dy);
  if (!Number.isFinite(length) || length <= maxLength) {
    return [dx, dy];
  }

  const scale = maxLength / length;
  return [dx * scale, dy * scale];
}

export function simulateDescent({
  objective,
  optimizer,
  learningRate,
  momentum,
  noise,
  seed,
  startPoint,
  steps = 220,
}) {
  const random = seededRandom(seed);
  const [min, max] = objective.domain;
  const initialPoint = clampPoint(startPoint, objective.start, min, max);
  let x = initialPoint.x;
  let y = initialPoint.y;
  let vx = 0;
  let vy = 0;
  let mx = 0;
  let my = 0;
  let rx = 0;
  let ry = 0;
  const trace = [];

  for (let iteration = 0; iteration <= steps; iteration += 1) {
    const [maybeGx, maybeGy] = objective.grad(x, y);
    const rawGx = finiteOr(maybeGx, 0);
    const rawGy = finiteOr(maybeGy, 0);
    const rawGradNorm = finiteOr(Math.hypot(rawGx, rawGy), 0);
    const loss = finiteOr(objective.f(x, y), Number.MAX_SAFE_INTEGER);

    trace.push({
      iteration,
      x,
      y,
      loss,
      gradX: rawGx,
      gradY: rawGy,
      gradNorm: rawGradNorm,
    });

    const noiseScale = noise * Math.max(0.25, Math.log1p(rawGradNorm));
    const gx = rawGx + randomSigned(random) * noiseScale;
    const gy = rawGy + randomSigned(random) * noiseScale;
    let dx = 0;
    let dy = 0;

    if (optimizer === "adam") {
      const beta1 = clamp(momentum, 0.05, 0.98);
      const beta2 = 0.995;
      mx = beta1 * mx + (1 - beta1) * gx;
      my = beta1 * my + (1 - beta1) * gy;
      rx = beta2 * rx + (1 - beta2) * gx * gx;
      ry = beta2 * ry + (1 - beta2) * gy * gy;
      const t = iteration + 1;
      const mxHat = mx / (1 - beta1 ** t);
      const myHat = my / (1 - beta1 ** t);
      const rxHat = rx / (1 - beta2 ** t);
      const ryHat = ry / (1 - beta2 ** t);
      dx = -learningRate * mxHat / (Math.sqrt(rxHat) + 1e-8);
      dy = -learningRate * myHat / (Math.sqrt(ryHat) + 1e-8);
    } else if (optimizer === "momentum") {
      vx = momentum * vx - learningRate * gx;
      vy = momentum * vy - learningRate * gy;
      dx = vx;
      dy = vy;
    } else {
      dx = -learningRate * gx;
      dy = -learningRate * gy;
    }

    [dx, dy] = limitVector(dx, dy, objective.maxStep);
    x = clamp(x + dx, min, max);
    y = clamp(y + dy, min, max);

    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      x = initialPoint.x;
      y = initialPoint.y;
      vx = 0;
      vy = 0;
      mx = 0;
      my = 0;
      rx = 0;
      ry = 0;
    }
  }

  return trace;
}

export function buildSurface(objective, resolution = 48) {
  const [min, max] = objective.domain;
  const rows = [];
  let minLog = Number.POSITIVE_INFINITY;
  let maxLog = Number.NEGATIVE_INFINITY;

  for (let j = 0; j < resolution; j += 1) {
    const row = [];
    const y = min + (j / (resolution - 1)) * (max - min);

    for (let i = 0; i < resolution; i += 1) {
      const x = min + (i / (resolution - 1)) * (max - min);
      const loss = objective.f(x, y);
      const logLoss = Math.log1p(Math.max(0, loss));
      minLog = Math.min(minLog, logLoss);
      maxLog = Math.max(maxLog, logLoss);
      row.push({ x, y, loss, logLoss, z: 0 });
    }

    rows.push(row);
  }

  const spread = Math.max(0.0001, maxLog - minLog);
  rows.forEach((row) => {
    row.forEach((point) => {
      point.z = clamp((point.logLoss - minLog) / spread, 0, 1);
    });
  });

  return { rows, minLog, maxLog, resolution };
}

export function summarizeRun(trace, currentIndex, objective) {
  const first = trace[0];
  const current = trace[currentIndex] ?? first;
  const previous = trace[Math.max(0, currentIndex - 18)] ?? first;
  const lossRatio = first.loss > 0 ? current.loss / first.loss : 0;
  const improvedRecently = current.loss < previous.loss;
  const minimumDistance = Math.hypot(
    current.x - objective.minimum.x,
    current.y - objective.minimum.y
  );

  let status = "Converging";
  let tone = "positive";

  if (currentIndex > 24 && current.loss > first.loss * 1.15) {
    status = "Diverging";
    tone = "danger";
  } else if (current.gradNorm < 0.015 || minimumDistance < 0.035) {
    status = "Converged";
    tone = "positive";
  } else if (!improvedRecently && currentIndex > 32) {
    status = "Oscillating";
    tone = "warning";
  } else if (lossRatio > 0.7 && currentIndex > 40) {
    status = "Slow progress";
    tone = "warning";
  }

  const bestLoss = trace
    .slice(0, currentIndex + 1)
    .reduce((best, point) => Math.min(best, point.loss), Number.POSITIVE_INFINITY);

  return { status, tone, bestLoss, minimumDistance };
}
