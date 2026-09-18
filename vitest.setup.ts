import "@testing-library/jest-dom/vitest";

/**
 * jsdom has no layout, so anything that measures or animates needs a stub.
 * Kept minimal on purpose: a test that needs more than this is probably
 * testing the browser rather than the component.
 */
if (typeof window !== "undefined") {
  // Scheduled, not synchronous: a synchronous stub makes callbacks run before
  // React has committed, which is the opposite of what a real frame does.
  window.requestAnimationFrame = ((callback: FrameRequestCallback) =>
    setTimeout(() => callback(0), 0) as unknown as number) as Window["requestAnimationFrame"];

  // Recharts measures its container, which jsdom never gives a size.
  if (!("ResizeObserver" in window)) {
    class ResizeObserverStub {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    (window as unknown as { ResizeObserver: unknown }).ResizeObserver =
      ResizeObserverStub;
  }
}
