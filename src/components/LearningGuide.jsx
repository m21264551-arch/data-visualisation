const quickStartItems = [
  {
    title: "Pick a surface",
    body: "Try Rosenbrock for a narrow curved valley, Elliptic Bowl for clean convergence, Saddle + Walls for instability, and Ripple Basin for local traps.",
  },
  {
    title: "Change the optimizer",
    body: "Compare plain gradient descent, momentum, and Adam. Each uses the same gradient information, but turns it into movement differently.",
  },
  {
    title: "Tune the step",
    body: "Learning rate controls how far each update moves. Momentum carries speed from previous updates, while noise simulates messy gradients.",
  },
  {
    title: "Watch the story",
    body: "Use Run, Step, Reset, New path, and the 3D/Contour toggle to connect the path, loss chart, metrics, and status label.",
  },
];

const colorRows = [
  ["Teal path", "The optimizer's history through parameter space."],
  ["White ring", "The current parameter values at the selected iteration."],
  ["Orange arrows", "The local downhill direction estimated from the gradient."],
  ["Green marker", "The known minimum for the selected surface."],
  ["Cool-to-warm surface", "Lower loss sits in calmer cool regions; higher loss rises into warmer areas."],
];

const faqItems = [
  {
    question: "What is gradient descent?",
    answer:
      "Gradient descent is an optimization method. It looks at the slope of a loss function, then nudges the parameters in the direction that should reduce that loss.",
  },
  {
    question: "Is this a neural network?",
    answer:
      "Not directly. This lab isolates the optimization step that neural networks rely on after backpropagation computes gradients for many weights.",
  },
  {
    question: "Why does the path sometimes zig-zag?",
    answer:
      "A steep curved valley can make the optimizer overshoot from side to side. Smaller learning rates or adaptive optimizers can calm that motion.",
  },
  {
    question: "Why can a high learning rate look broken?",
    answer:
      "Large steps can jump over the useful downhill route. The simulation clamps unsafe movement so the app stays readable, but the status still flags unstable behavior.",
  },
  {
    question: "What does momentum do?",
    answer:
      "Momentum keeps a running velocity. It can speed up motion through shallow areas, but too much momentum can carry the path past the minimum.",
  },
  {
    question: "What should I try first?",
    answer:
      "Start with Elliptic Bowl, then compare the same learning rate across all optimizers. After that, switch to Rosenbrock and lower the learning rate until the path finds the valley.",
  },
];

export default function LearningGuide() {
  return (
    <section
      className="learning-guide"
      aria-labelledby="learning-guide-title"
      data-testid="learning-guide"
    >
      <div className="guide-inner">
        <div className="guide-kicker">Field notes</div>
        <div className="guide-hero">
          <div>
            <h2 id="learning-guide-title">What is Gradient Lab?</h2>
            <p>
              Gradient Lab is an interactive visualizer for the part of machine
              learning that decides how a model improves. Instead of hiding the
              math inside a neural network, it shows a two-parameter loss surface
              and lets you watch an optimizer search for lower loss one update at
              a time.
            </p>
          </div>
          <p>
            The goal is not to prove one optimizer is always best. It is to build
            intuition for why learning rate, momentum, curvature, noisy gradients,
            and local geometry can make training feel smooth, slow, jumpy, or
            unstable.
          </p>
        </div>

        <div className="guide-section" aria-labelledby="guide-how-to-use">
          <div className="section-heading">
            <h3 id="guide-how-to-use">How to use it</h3>
            <p>
              Treat it like a small experiment bench. Change one thing, run a few
              steps, then compare the path and metrics.
            </p>
          </div>
          <div className="quick-start-grid">
            {quickStartItems.map((item, index) => (
              <article className="quick-start-item" key={item.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h4>{item.title}</h4>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="guide-section guide-columns">
          <div className="guide-copy" aria-labelledby="guide-colors">
            <h3 id="guide-colors">What the visuals mean</h3>
            <p>
              The canvas is a map of loss values. The optimizer moves across this
              map by repeatedly asking, "which nearby direction most reduces the
              loss?"
            </p>
            <dl className="color-key">
              {colorRows.map(([term, description]) => (
                <div key={term}>
                  <dt>{term}</dt>
                  <dd>{description}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="guide-copy" aria-labelledby="guide-metrics">
            <h3 id="guide-metrics">How to read the metrics</h3>
            <p>
              Loss is the score the optimizer is trying to reduce. Gradient norm
              shows how steep the local slope is. Best loss records the strongest
              result seen so far, while the status label gives a quick read on
              whether the run is converging, stuck, oscillating, or diverging.
            </p>
            <p>
              The x and y values are the two parameters being optimized. In a real
              model there may be millions of parameters, but the same update logic
              scales from this tiny surface to much larger systems.
            </p>
          </div>
        </div>

        <div className="guide-section" aria-labelledby="guide-faq">
          <div className="section-heading">
            <h3 id="guide-faq">FAQ</h3>
            <p>
              Short answers to the questions people usually ask after their first
              few experiments.
            </p>
          </div>
          <div className="faq-list">
            {faqItems.map((item) => (
              <details key={item.question}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </div>

        <div className="guide-section closing-note" aria-labelledby="guide-next">
          <h3 id="guide-next">Where this connects to machine learning</h3>
          <p>
            In a neural network, backpropagation computes gradients for every
            weight, then an optimizer applies an update rule like the ones shown
            here. If this page makes learning rate feel less mysterious, it has
            done its job.
          </p>
        </div>
      </div>
    </section>
  );
}
