export function formatNumber(value, digits = 4) {
  if (!Number.isFinite(value)) {
    return "0";
  }

  const abs = Math.abs(value);
  if ((abs > 0 && abs < 0.0001) || abs >= 10000) {
    return value.toExponential(2);
  }

  if (abs >= 1000) {
    return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }

  if (abs >= 10) {
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }

  return value.toLocaleString(undefined, { maximumFractionDigits: digits });
}

export function formatLearningRate(value) {
  if (value < 0.001) {
    return value.toExponential(1);
  }

  return value.toFixed(value < 0.01 ? 4 : 3);
}
