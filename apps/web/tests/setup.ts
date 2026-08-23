/**
 * Vitest setup for the web app. jsdom does not implement the canvas 2D context
 * and logs a noisy "Not implemented: HTMLCanvasElement.prototype.getContext"
 * error whenever it is called. `VitalChart` calls `getContext` and falls back to
 * its always-present data-table alternative when no context exists (SSR / jsdom /
 * unsupported), so we stub it to return null quietly: the fallback path is
 * exactly what the a11y test exercises, and the output stays clean.
 */
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: () => null,
  writable: true,
  configurable: true,
});
