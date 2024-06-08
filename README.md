# Gradient Lab

An interactive gradient descent visualizer for a machine-learning portfolio.

[Live demo](https://data-visualisation-gamma.vercel.app)

Visitors can switch loss surfaces, optimizers, learning rate, momentum, noise, and playback speed while watching the optimizer path move across a loss landscape. The app is built with React, Vite, SVG, and Canvas.

The interactive playground is followed by a learning guide that explains gradient descent, how to use the controls, what the visuals and metrics mean, and common FAQ answers.

## Run locally

```bash
npm install
npm run dev
```

## Quality checks

```bash
npm run lint
npm run test:unit
npm run test:e2e
npm run test:a11y
npm run test:visual
npm run perf
npm run qa
```

Visual regression baselines are Chromium snapshots generated on macOS, matching the GitHub Actions runner in `.github/workflows/ci.yml`.

## Deploy

This app is configured for Vercel in `vercel.json`.

- Framework: Vite
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: `dist`

Deploy from the linked project with:

```bash
vercel build
vercel deploy --prebuilt
```
