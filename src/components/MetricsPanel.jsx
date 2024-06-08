import {
  Activity,
  CheckCircle2,
  Compass,
  Gauge,
  Target,
  TrendingDown,
} from "lucide-react";
import { formatNumber } from "../lib/format";
import LossChart from "./LossChart";

function toMetricId(label) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function MetricRow({ icon: Icon, label, value, tone }) {
  return (
    <div className="metric-row" data-testid={`metric-${toMetricId(label)}`}>
      <Icon size={18} />
      <span>{label}</span>
      <strong className={tone ? `tone-${tone}` : ""}>{value}</strong>
    </div>
  );
}

export default function MetricsPanel({ current, summary, trace, currentIndex }) {
  return (
    <aside className="panel metrics-panel" aria-label="Current optimizer metrics">
      <div className="metrics-section">
        <h2>Current Parameters</h2>
        <div className="parameter-grid">
          <div>
            <span>x</span>
            <strong data-testid="param-x">{formatNumber(current.x)}</strong>
          </div>
          <div>
            <span>y</span>
            <strong data-testid="param-y">{formatNumber(current.y)}</strong>
          </div>
        </div>
      </div>

      <div className="metrics-section row-stack">
        <MetricRow icon={Gauge} label="Iteration" value={current.iteration} />
        <MetricRow icon={TrendingDown} label="Loss f(x, y)" value={formatNumber(current.loss)} />
        <MetricRow icon={Activity} label="Gradient ||∇f||" value={formatNumber(current.gradNorm)} />
        <MetricRow
          icon={CheckCircle2}
          label="Convergence"
          value={summary.status}
          tone={summary.tone}
        />
      </div>

      <div className="metrics-section">
        <h2>Loss Over Time</h2>
        <LossChart trace={trace} currentIndex={currentIndex} />
      </div>

      <div className="metrics-section row-stack compact">
        <MetricRow icon={Target} label="Best Loss" value={formatNumber(summary.bestLoss)} />
        <MetricRow
          icon={Compass}
          label="Distance to minimum"
          value={formatNumber(summary.minimumDistance)}
        />
      </div>
    </aside>
  );
}
