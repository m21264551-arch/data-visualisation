import { useMemo } from "react";
import { formatNumber } from "../lib/format";

export default function LossChart({ trace, currentIndex }) {
  const visible = trace.slice(0, Math.max(2, currentIndex + 1));
  const width = 268;
  const height = 160;
  const padding = { top: 14, right: 14, bottom: 28, left: 42 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const { minLog, maxLog, spread } = useMemo(() => {
    const logs = trace.map((point) => Math.log10(Math.max(point.loss, 1e-8)));
    const min = Math.min(...logs);
    const max = Math.max(...logs);

    return {
      minLog: min,
      maxLog: max,
      spread: Math.max(0.0001, max - min),
    };
  }, [trace]);

  const toX = (index) => padding.left + (index / Math.max(1, trace.length - 1)) * chartWidth;
  const toY = (loss) =>
    padding.top + (1 - (Math.log10(Math.max(loss, 1e-8)) - minLog) / spread) * chartHeight;

  const path = visible
    .map((point, index) => `${index === 0 ? "M" : "L"} ${toX(point.iteration).toFixed(2)} ${toY(point.loss).toFixed(2)}`)
    .join(" ");
  const current = visible[visible.length - 1];

  return (
    <div className="loss-chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Loss over time chart">
        <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} />
        <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} />
        {[0, 0.5, 1].map((tick) => {
          const y = padding.top + tick * chartHeight;
          const value = 10 ** (maxLog - tick * spread);
          return (
            <g key={tick}>
              <line className="grid-line" x1={padding.left} x2={width - padding.right} y1={y} y2={y} />
              <text x={8} y={y + 4}>
                {formatNumber(value, 1)}
              </text>
            </g>
          );
        })}
        <path className="chart-path-bg" d={path} />
        <path className="chart-path" d={path} />
        <circle cx={toX(current.iteration)} cy={toY(current.loss)} r="5" />
        <text className="axis-label" x={width / 2} y={height - 4}>
          Iteration
        </text>
      </svg>
    </div>
  );
}
