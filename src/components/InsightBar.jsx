import { Lightbulb } from "lucide-react";

function getInsight({ objective, optimizer, learningRate, momentum, summary }) {
  if (summary.status === "Diverging") {
    return "The path is climbing instead of settling. Reduce the learning rate or switch to Adam to dampen oversized updates.";
  }

  if (summary.status === "Oscillating") {
    return "The optimizer is bouncing across the valley walls. Lower momentum or learning rate to turn the zig-zag into a smoother descent.";
  }

  if (summary.status === "Converged") {
    return `The optimizer has settled near the ${objective.name.toLowerCase()} minimum. Try adding noise or raising the learning rate to see how stability changes.`;
  }

  if (optimizer === "momentum" && momentum > 0.75) {
    return "Momentum is carrying updates along the valley, which can speed up progress but may overshoot on narrow curved surfaces.";
  }

  if (optimizer === "adam") {
    return "Adam rescales each coordinate with its recent gradient history, so it often handles curved or uneven terrain with fewer manual tweaks.";
  }

  if (learningRate < 0.001) {
    return "This learning rate is cautious. The path is stable, but it may need many more iterations before reaching the basin floor.";
  }

  return "The path follows the negative gradient toward lower loss. Watch how the arrows point downhill while the trace records each parameter update.";
}

export default function InsightBar(props) {
  return (
    <section className="insight-bar" aria-label="Gradient descent insight">
      <div className="insight-icon">
        <Lightbulb size={28} />
      </div>
      <div>
        <h2>Insight</h2>
        <p>{getInsight(props)}</p>
      </div>
      <div className="tip">
        <strong>Tip</strong>
        <span>Run the same surface with different optimizers to compare path shape, not just final loss.</span>
      </div>
    </section>
  );
}
