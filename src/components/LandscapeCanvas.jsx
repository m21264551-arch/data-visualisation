import { useEffect, useMemo, useRef, useState } from "react";
import { buildSurface, clamp } from "../lib/objectives";

const CONTOUR_LEVELS = [0.08, 0.14, 0.2, 0.27, 0.35, 0.44, 0.54, 0.65, 0.78, 0.9];

function mixChannel(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ];
}

function mixColor(from, to, t) {
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  return `rgb(${mixChannel(a[0], b[0], t)}, ${mixChannel(a[1], b[1], t)}, ${mixChannel(
    a[2],
    b[2],
    t
  )})`;
}

function surfaceColor(z) {
  if (z < 0.48) {
    return mixColor("#0b6fae", "#d7eef3", z / 0.48);
  }

  if (z < 0.74) {
    return mixColor("#d7eef3", "#f7d978", (z - 0.48) / 0.26);
  }

  return mixColor("#f7d978", "#d83d28", (z - 0.74) / 0.26);
}

function getSurfaceZ(surface, objective, x, y) {
  const loss = objective.f(x, y);
  const logLoss = Math.log1p(Math.max(0, loss));
  const spread = Math.max(0.0001, surface.maxLog - surface.minLog);
  return clamp((logLoss - surface.minLog) / spread, 0, 1);
}

function drawRoundedLabel(ctx, x, y, text) {
  ctx.save();
  ctx.font = "600 12px Inter, ui-sans-serif, system-ui";
  const width = ctx.measureText(text).width + 18;
  const height = 28;
  ctx.fillStyle = "rgba(24, 30, 38, 0.9)";
  ctx.beginPath();
  ctx.roundRect(x - width / 2, y - height - 12, width, height, 7);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y - height / 2 - 12);
  ctx.restore();
}

function drawArrow(ctx, start, end, color = "#f47b20") {
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const head = 9;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(end.x, end.y);
  ctx.lineTo(end.x - head * Math.cos(angle - Math.PI / 6), end.y - head * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(end.x - head * Math.cos(angle + Math.PI / 6), end.y - head * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function interpolate(a, b, level) {
  const spread = b.z - a.z;
  const t = Math.abs(spread) < 1e-6 ? 0.5 : (level - a.z) / spread;
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: level,
  };
}

function getContourSegments(surface, level) {
  const segments = [];
  const rows = surface.rows;

  for (let j = 0; j < rows.length - 1; j += 1) {
    for (let i = 0; i < rows[j].length - 1; i += 1) {
      const topLeft = rows[j][i];
      const topRight = rows[j][i + 1];
      const bottomRight = rows[j + 1][i + 1];
      const bottomLeft = rows[j + 1][i];
      const points = [];

      if ((topLeft.z - level) * (topRight.z - level) <= 0) {
        points.push(interpolate(topLeft, topRight, level));
      }
      if ((topRight.z - level) * (bottomRight.z - level) <= 0) {
        points.push(interpolate(topRight, bottomRight, level));
      }
      if ((bottomRight.z - level) * (bottomLeft.z - level) <= 0) {
        points.push(interpolate(bottomRight, bottomLeft, level));
      }
      if ((bottomLeft.z - level) * (topLeft.z - level) <= 0) {
        points.push(interpolate(bottomLeft, topLeft, level));
      }

      if (points.length === 2) {
        segments.push([points[0], points[1]]);
      } else if (points.length === 4) {
        segments.push([points[0], points[1]], [points[2], points[3]]);
      }
    }
  }

  return segments;
}

export default function LandscapeCanvas({
  objective,
  trace,
  currentIndex,
  showContours,
  viewMode,
}) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const [size, setSize] = useState({ width: 640, height: 560 });
  const surface = useMemo(() => buildSurface(objective), [objective]);
  const surfaceCells = useMemo(() => {
    const cells = [];

    for (let j = 0; j < surface.rows.length - 1; j += 1) {
      for (let i = 0; i < surface.rows[j].length - 1; i += 1) {
        const points = [
          surface.rows[j][i],
          surface.rows[j][i + 1],
          surface.rows[j + 1][i + 1],
          surface.rows[j + 1][i],
        ];

        cells.push({
          sort:
            points.reduce((sum, point) => sum + point.x + point.y, 0) /
            points.length,
          points,
          z: points.reduce((sum, point) => sum + point.z, 0) / points.length,
        });
      }
    }

    cells.sort((a, b) => a.sort - b.sort);
    return cells;
  }, [surface]);
  const contourSegments = useMemo(
    () => CONTOUR_LEVELS.flatMap((level) => getContourSegments(surface, level).map((segment) => ({ level, segment }))),
    [surface]
  );

  useEffect(() => {
    const element = wrapRef.current;
    if (!element) {
      return undefined;
    }

    const observer = new ResizeObserver(([entry]) => {
      const rect = entry.contentRect;
      setSize({
        width: Math.max(320, rect.width),
        height: Math.max(360, rect.height),
      });
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(size.width);
    const height = Math.round(size.height);
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    const [min, max] = objective.domain;
    const centerX = width * 0.5;
    const centerY = viewMode === "contour" ? height * 0.53 : height * 0.67;
    const scaleX = width * (viewMode === "contour" ? 0.28 : 0.15);
    const scaleY = height * (viewMode === "contour" ? 0.2 : 0.1);
    const scaleZ = viewMode === "contour" ? 0 : height * 0.22;

    const project = (x, y, z = 0) => {
      const nx = ((x - min) / (max - min)) * 2 - 1;
      const ny = ((y - min) / (max - min)) * 2 - 1;
      return {
        x: centerX + (nx - ny) * scaleX,
        y: centerY + (nx + ny) * scaleY - z * scaleZ,
      };
    };

    const floorCorners = [
      project(min, min, 0),
      project(max, min, 0),
      project(max, max, 0),
      project(min, max, 0),
    ];

    ctx.save();
    ctx.fillStyle = "#f7faf9";
    ctx.strokeStyle = "#dbe4e2";
    ctx.lineWidth = 1;
    ctx.beginPath();
    floorCorners.forEach((corner, index) => {
      if (index === 0) {
        ctx.moveTo(corner.x, corner.y);
      } else {
        ctx.lineTo(corner.x, corner.y);
      }
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    if (showContours) {
      ctx.save();
      ctx.lineWidth = 1;
      contourSegments.forEach(({ level, segment }) => {
        const [a, b] = segment;
        const pa = project(a.x, a.y, 0);
        const pb = project(b.x, b.y, 0);
        ctx.strokeStyle = level > 0.7 ? "rgba(220, 77, 42, 0.44)" : "rgba(18, 115, 151, 0.36)";
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.stroke();
      });
      ctx.restore();
    }

    if (viewMode !== "contour") {
      surfaceCells.forEach((cell) => {
        ctx.beginPath();
        cell.points.forEach((point, index) => {
          const projected = project(point.x, point.y, point.z);
          if (index === 0) {
            ctx.moveTo(projected.x, projected.y);
          } else {
            ctx.lineTo(projected.x, projected.y);
          }
        });
        ctx.closePath();
        ctx.fillStyle = surfaceColor(cell.z);
        ctx.globalAlpha = 0.92;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = "rgba(33, 46, 56, 0.08)";
        ctx.stroke();
      });
    } else {
      const rows = surface.rows;
      for (let j = 0; j < rows.length - 1; j += 1) {
        for (let i = 0; i < rows[j].length - 1; i += 1) {
          const points = [rows[j][i], rows[j][i + 1], rows[j + 1][i + 1], rows[j + 1][i]];
          const z = points.reduce((sum, point) => sum + point.z, 0) / points.length;
          ctx.beginPath();
          points.forEach((point, index) => {
            const projected = project(point.x, point.y, 0);
            if (index === 0) {
              ctx.moveTo(projected.x, projected.y);
            } else {
              ctx.lineTo(projected.x, projected.y);
            }
          });
          ctx.closePath();
          ctx.fillStyle = surfaceColor(z);
          ctx.globalAlpha = 0.42;
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }

    const minimumZ = getSurfaceZ(surface, objective, objective.minimum.x, objective.minimum.y);
    const minimumPoint = project(
      objective.minimum.x,
      objective.minimum.y,
      viewMode === "contour" ? 0 : minimumZ
    );

    const visibleTrace = trace.slice(0, currentIndex + 1);
    const projectedTrace = visibleTrace.map((point) => {
      const z = getSurfaceZ(surface, objective, point.x, point.y);
      return {
        ...point,
        projected: project(point.x, point.y, viewMode === "contour" ? 0 : z),
      };
    });

    if (projectedTrace.length > 1) {
      ctx.save();
      ctx.strokeStyle = "rgba(0, 137, 132, 0.28)";
      ctx.lineWidth = 9;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.beginPath();
      projectedTrace.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.projected.x, point.projected.y);
        } else {
          ctx.lineTo(point.projected.x, point.projected.y);
        }
      });
      ctx.stroke();

      ctx.strokeStyle = "#008b83";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      projectedTrace.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.projected.x, point.projected.y);
        } else {
          ctx.lineTo(point.projected.x, point.projected.y);
        }
      });
      ctx.stroke();
      ctx.restore();
    }

    projectedTrace.forEach((point, index) => {
      if (index % 16 !== 0 && index !== projectedTrace.length - 1) {
        return;
      }

      ctx.save();
      ctx.fillStyle = index === projectedTrace.length - 1 ? "#ffffff" : "#009d90";
      ctx.strokeStyle = "#008b83";
      ctx.lineWidth = index === projectedTrace.length - 1 ? 3 : 2;
      ctx.beginPath();
      ctx.arc(point.projected.x, point.projected.y, index === projectedTrace.length - 1 ? 8 : 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });

    projectedTrace.slice(Math.max(0, projectedTrace.length - 95), -1).forEach((point, index) => {
      if (index % 15 !== 0) {
        return;
      }

      const gradLength = Math.hypot(point.gradX, point.gradY) || 1;
      const step = 0.16;
      const endX = clamp(point.x - (point.gradX / gradLength) * step, min, max);
      const endY = clamp(point.y - (point.gradY / gradLength) * step, min, max);
      const start = point.projected;
      const endZ = getSurfaceZ(surface, objective, endX, endY);
      const end = project(endX, endY, viewMode === "contour" ? 0 : endZ);
      drawArrow(ctx, start, end);
    });

    ctx.save();
    ctx.fillStyle = "#11a64a";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(minimumPoint.x, minimumPoint.y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    const current = projectedTrace[projectedTrace.length - 1];
    if (current) {
      drawRoundedLabel(ctx, current.projected.x, current.projected.y, currentIndex < 8 ? "Start" : "Current");
    }

    if (currentIndex > 32) {
      drawRoundedLabel(ctx, minimumPoint.x + 18, minimumPoint.y + 12, "Minimum");
    }

    ctx.save();
    ctx.fillStyle = "#1c2733";
    ctx.font = "700 14px Inter, ui-sans-serif, system-ui";
    ctx.fillText("Loss f(x, y)", 28, 32);
    ctx.font = "600 13px Inter, ui-sans-serif, system-ui";
    ctx.fillText("x", width - 58, height - 52);
    ctx.fillText("y", 54, height - 44);
    ctx.restore();
  }, [
    contourSegments,
    currentIndex,
    objective,
    showContours,
    size,
    surface,
    surfaceCells,
    trace,
    viewMode,
  ]);

  return (
    <div className="landscape-wrap" ref={wrapRef}>
      <p id="landscape-summary" className="sr-only">
        Loss landscape for {objective.name}. Iteration {currentIndex}. The
        current optimizer path is drawn toward the marked minimum.
      </p>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Loss landscape visualization"
        aria-describedby="landscape-summary"
      />
      <div className="canvas-legend" aria-label="Visualization legend">
        <span>
          <i className="legend-line" />
          Path
        </span>
        <span>
          <i className="legend-arrow" />
          −∇f
        </span>
        <span>
          <i className="legend-current" />
          Current
        </span>
        <span>
          <i className="legend-minimum" />
          Minimum
        </span>
      </div>
    </div>
  );
}
