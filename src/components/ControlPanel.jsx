import { Pause, Play, RotateCcw, StepForward } from "lucide-react";
import { OBJECTIVES, OPTIMIZERS } from "../lib/objectives";
import { formatLearningRate } from "../lib/format";

const SPEEDS = [0.5, 1, 2, 4];

function SliderControl({
  id,
  label,
  value,
  displayValue,
  min,
  max,
  step,
  onChange,
  marks,
}) {
  return (
    <div className="slider-control">
      <div className="control-heading">
        <label htmlFor={id}>{label}</label>
        <strong>{displayValue}</strong>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      {marks ? (
        <div className="range-marks" aria-hidden="true">
          {marks.map((mark) => (
            <span key={mark}>{mark}</span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function ControlPanel({
  objectiveId,
  optimizer,
  logLearningRate,
  momentum,
  noise,
  speed,
  running,
  onObjectiveChange,
  onOptimizerChange,
  onLearningRateChange,
  onMomentumChange,
  onNoiseChange,
  onSpeedChange,
  onToggleRun,
  onStep,
  onReset,
}) {
  const objective = OBJECTIVES.find((item) => item.id === objectiveId) ?? OBJECTIVES[0];
  const learningRate = 10 ** logLearningRate;

  return (
    <aside className="panel control-panel" aria-label="Gradient descent controls">
      <div className="field-group">
        <label htmlFor="function-select">Function</label>
        <select
          id="function-select"
          data-testid="function-select"
          value={objectiveId}
          onChange={(event) => onObjectiveChange(event.target.value)}
        >
          {OBJECTIVES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <p>{objective.description}</p>
      </div>

      <div className="field-group">
        <label htmlFor="optimizer-select">Optimizer</label>
        <select
          id="optimizer-select"
          data-testid="optimizer-select"
          value={optimizer}
          onChange={(event) => onOptimizerChange(event.target.value)}
        >
          {OPTIMIZERS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      <SliderControl
        id="learning-rate-slider"
        label="Learning rate (α)"
        value={logLearningRate}
        displayValue={formatLearningRate(learningRate)}
        min={-5}
        max={0}
        step={0.01}
        onChange={onLearningRateChange}
        marks={["1e-5", "1e-3", "1e-1", "1"]}
      />

      <SliderControl
        id="momentum-slider"
        label="Momentum (β)"
        value={momentum}
        displayValue={momentum.toFixed(3)}
        min={0}
        max={0.98}
        step={0.01}
        onChange={onMomentumChange}
        marks={["0", "0.25", "0.5", "0.75", "0.98"]}
      />

      <SliderControl
        id="noise-slider"
        label="Noise (σ)"
        value={noise}
        displayValue={noise.toFixed(3)}
        min={0}
        max={0.3}
        step={0.005}
        onChange={onNoiseChange}
        marks={["0", "0.1", "0.2", "0.3"]}
      />

      <div className="field-group">
        <span className="legend-label">Speed</span>
        <div className="segmented-control" role="group" aria-label="Animation speed">
          {SPEEDS.map((item) => (
            <button
              key={item}
              type="button"
              className={speed === item ? "active" : ""}
              aria-pressed={speed === item}
              onClick={() => onSpeedChange(item)}
            >
              {item}x
            </button>
          ))}
        </div>
      </div>

      <div className="action-stack">
        <button
          type="button"
          className="primary-action"
          data-testid="toggle-run"
          aria-label={running ? "Pause animation" : "Run animation"}
          onClick={onToggleRun}
        >
          {running ? <Pause size={18} /> : <Play size={18} />}
          {running ? "Pause" : "Run"}
        </button>
        <button type="button" data-testid="step-once" onClick={onStep}>
          <StepForward size={18} />
          Step
        </button>
        <button type="button" data-testid="reset-path" onClick={onReset}>
          <RotateCcw size={18} />
          Reset
        </button>
      </div>
    </aside>
  );
}
