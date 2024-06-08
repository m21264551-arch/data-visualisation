import { useEffect, useMemo, useState } from "react";
import { Activity, Check, Shuffle } from "lucide-react";
import ControlPanel from "./components/ControlPanel";
import InsightBar from "./components/InsightBar";
import LandscapeCanvas from "./components/LandscapeCanvas";
import LearningGuide from "./components/LearningGuide";
import MetricsPanel from "./components/MetricsPanel";
import { getObjective, simulateDescent, summarizeRun } from "./lib/objectives";
import "./styles.css";

const SPEED_STEPS = {
  0.5: 1,
  1: 2,
  2: 4,
  4: 7,
};

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

export default function App() {
  const [objectiveId, setObjectiveId] = useState("rosenbrock");
  const objective = useMemo(() => getObjective(objectiveId), [objectiveId]);
  const [startPoint, setStartPoint] = useState(null);
  const [optimizer, setOptimizer] = useState("momentum");
  const [logLearningRate, setLogLearningRate] = useState(
    Math.log10(objective.defaultLearningRate)
  );
  const [momentum, setMomentum] = useState(0.9);
  const [noise, setNoise] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [running, setRunning] = useState(() => !prefersReducedMotion());
  const [cursor, setCursor] = useState(0);
  const [seed, setSeed] = useState(173);
  const [showContours, setShowContours] = useState(true);
  const [viewMode, setViewMode] = useState("3d");

  const learningRate = 10 ** logLearningRate;
  const speedStep = SPEED_STEPS[speed] ?? SPEED_STEPS[1];
  const trace = useMemo(
    () =>
      simulateDescent({
        objective,
        optimizer,
        learningRate,
        momentum,
        noise,
        seed,
        startPoint,
      }),
    [objective, optimizer, learningRate, momentum, noise, seed, startPoint]
  );

  const currentIndex = Math.min(cursor, trace.length - 1);
  const current = trace[currentIndex];
  const summary = useMemo(
    () => summarizeRun(trace, currentIndex, objective),
    [currentIndex, objective, trace]
  );

  useEffect(() => {
    if (!running) {
      return undefined;
    }

    let animationFrame = 0;
    let lastFrame = 0;
    let elapsed = 0;

    const tick = (timestamp) => {
      if (!lastFrame) {
        lastFrame = timestamp;
      }

      elapsed += timestamp - lastFrame;
      lastFrame = timestamp;

      if (elapsed >= 85) {
        const ticks = Math.floor(elapsed / 85);
        elapsed %= 85;
        let shouldStop = false;

        setCursor((index) => {
          const next = Math.min(index + speedStep * ticks, trace.length - 1);
          shouldStop = next >= trace.length - 1;
          return next;
        });

        if (shouldStop) {
          setRunning(false);
        }
      }

      animationFrame = window.requestAnimationFrame(tick);
    };

    animationFrame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [running, speedStep, trace.length]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setRunning(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  function handleObjectiveChange(nextObjectiveId) {
    const nextObjective = getObjective(nextObjectiveId);
    setObjectiveId(nextObjectiveId);
    setStartPoint(null);
    setLogLearningRate(Math.log10(nextObjective.defaultLearningRate));
    setCursor(0);
    setRunning(false);
  }

  function restartFromControlChange(callback) {
    callback();
    setCursor(0);
    setRunning(false);
  }

  function handleReset() {
    setCursor(0);
    setRunning(false);
  }

  function handleStep() {
    setRunning(false);
    setCursor((index) => Math.min(index + 1, trace.length - 1));
  }

  function handleRestartSeed() {
    const [min, max] = objective.domain;
    const margin = (max - min) * 0.12;
    let next = null;

    for (let attempt = 0; attempt < 20; attempt += 1) {
      const x = min + margin + Math.random() * (max - min - margin * 2);
      const y = min + margin + Math.random() * (max - min - margin * 2);
      const distance = Math.hypot(x - objective.minimum.x, y - objective.minimum.y);

      if (distance > 1) {
        next = { x, y };
        break;
      }
    }

    setStartPoint(next ?? objective.start);
    setSeed((value) => value + 31);
    setCursor(0);
    setRunning(false);
  }

  return (
    <div className="site-shell">
      <div className="app-shell">
        <header className="topbar">
          <div className="brand-block">
            <div className="brand-mark">
              <Activity size={22} />
            </div>
            <div>
              <h1>Gradient Lab</h1>
              <span>Interactive gradient descent visualizer</span>
            </div>
          </div>
          <div className="topbar-actions">
            <span className={`run-state ${running ? "is-running" : ""}`}>
              <span className="status-dot" />
              <span role="status" aria-live="polite">
                {running ? "Running" : "Paused"}
              </span>
            </span>
            <button
              type="button"
              data-testid="new-path"
              onClick={handleRestartSeed}
              title="Choose a new starting point"
            >
              <Shuffle size={18} />
              New path
            </button>
          </div>
        </header>

        <ControlPanel
          objectiveId={objectiveId}
          optimizer={optimizer}
          logLearningRate={logLearningRate}
          momentum={momentum}
          noise={noise}
          speed={speed}
          running={running}
          onObjectiveChange={handleObjectiveChange}
          onOptimizerChange={(value) =>
            restartFromControlChange(() => setOptimizer(value))
          }
          onLearningRateChange={(value) =>
            restartFromControlChange(() => setLogLearningRate(value))
          }
          onMomentumChange={(value) =>
            restartFromControlChange(() => setMomentum(value))
          }
          onNoiseChange={(value) =>
            restartFromControlChange(() => setNoise(value))
          }
          onSpeedChange={setSpeed}
          onToggleRun={() => setRunning((value) => !value)}
          onStep={handleStep}
          onReset={handleReset}
        />

        <main className="visual-panel">
          <div className="canvas-toolbar">
            <label className="checkbox-control">
              <input
                type="checkbox"
                checked={showContours}
                onChange={(event) => setShowContours(event.target.checked)}
              />
              <span>
                <Check size={13} />
              </span>
              Show contours
            </label>
            <div className="segmented-control view-toggle" role="group" aria-label="View mode">
              <button
                type="button"
                className={viewMode === "3d" ? "active" : ""}
                aria-pressed={viewMode === "3d"}
                onClick={() => setViewMode("3d")}
              >
                3D View
              </button>
              <button
                type="button"
                className={viewMode === "contour" ? "active" : ""}
                aria-pressed={viewMode === "contour"}
                onClick={() => setViewMode("contour")}
              >
                Contour
              </button>
            </div>
          </div>
          <LandscapeCanvas
            objective={objective}
            trace={trace}
            currentIndex={currentIndex}
            showContours={showContours}
            viewMode={viewMode}
          />
        </main>

        <MetricsPanel
          current={current}
          summary={summary}
          trace={trace}
          currentIndex={currentIndex}
        />

        <InsightBar
          objective={objective}
          optimizer={optimizer}
          learningRate={learningRate}
          momentum={momentum}
          summary={summary}
        />
      </div>

      <LearningGuide />
    </div>
  );
}
