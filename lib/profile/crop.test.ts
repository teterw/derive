import { describe, expect, it } from "vitest";
import { cropRegion, MAX_ZOOM, parseCrop } from "./crop";

/**
 * The crop arrives from a browser, so the parsing is a trust boundary, and the
 * arithmetic decides whether sharp accepts the region at all - an off-by-one at
 * the edge fails the entire upload with "bad extract area" rather than
 * trimming.
 */

describe("cropRegion", () => {
  it("takes the largest square that fits at zoom 1", () => {
    expect(cropRegion(800, 600, { cx: 0.5, cy: 0.5, zoom: 1 })).toEqual({
      left: 100,
      top: 0,
      width: 600,
      height: 600,
    });
  });

  it("halves the side at zoom 2", () => {
    const region = cropRegion(800, 600, { cx: 0.5, cy: 0.5, zoom: 2 });
    expect(region.width).toBe(300);
    expect(region.height).toBe(300);
  });

  it("moves the square to the centre asked for", () => {
    const left = cropRegion(1000, 400, { cx: 0.2, cy: 0.5, zoom: 1 });
    const right = cropRegion(1000, 400, { cx: 0.8, cy: 0.5, zoom: 1 });
    expect(left.left).toBeLessThan(right.left);
  });

  /**
   * Every one of these would be a "bad extract area" if it escaped: sharp
   * refuses a region that leaves the image rather than clamping it.
   */
  it("never leaves the picture, however extreme the centre", () => {
    for (const [w, h] of [
      [800, 600],
      [600, 800],
      [1000, 1000],
      [1, 1],
      [3, 1000],
    ]) {
      for (const cx of [0, 0.001, 0.5, 0.999, 1]) {
        for (const cy of [0, 0.5, 1]) {
          for (const zoom of [1, 1.7, MAX_ZOOM]) {
            const region = cropRegion(w, h, { cx, cy, zoom });
            const where = `${w}x${h} cx=${cx} cy=${cy} z=${zoom}`;

            expect(region.left, where).toBeGreaterThanOrEqual(0);
            expect(region.top, where).toBeGreaterThanOrEqual(0);
            expect(region.width, where).toBeGreaterThan(0);
            expect(region.left + region.width, where).toBeLessThanOrEqual(w);
            expect(region.top + region.height, where).toBeLessThanOrEqual(h);
            expect(region.width, where).toBe(region.height);
          }
        }
      }
    }
  });

  it("clamps a zoom beyond the limit rather than producing a sliver", () => {
    const wild = cropRegion(800, 800, { cx: 0.5, cy: 0.5, zoom: 999 });
    const capped = cropRegion(800, 800, { cx: 0.5, cy: 0.5, zoom: MAX_ZOOM });
    expect(wild).toEqual(capped);
  });
});

describe("parseCrop", () => {
  it("reads a crop the editor produced", () => {
    expect(parseCrop('{"cx":0.25,"cy":0.75,"zoom":2}')).toEqual({
      cx: 0.25,
      cy: 0.75,
      zoom: 2,
    });
  });

  it("refuses anything that is not a crop", () => {
    for (const bad of ["", "null", "not json", "[]", undefined, 42, null]) {
      expect(parseCrop(bad), String(bad)).toBeNull();
    }
  });

  /**
   * The values that would reach sharp and fail there instead of here.
   */
  it("refuses numbers that are not numbers", () => {
    expect(parseCrop('{"cx":null,"cy":0.5,"zoom":1}')).toBeNull();
    expect(parseCrop('{"cx":"a","cy":0.5,"zoom":1}')).toBeNull();
    expect(parseCrop('{"cy":0.5,"zoom":1}')).toBeNull();
  });

  it("clamps rather than rejecting a merely out-of-range crop", () => {
    expect(parseCrop('{"cx":-5,"cy":9,"zoom":0.1}')).toEqual({
      cx: 0,
      cy: 1,
      zoom: 1,
    });
    expect(parseCrop('{"cx":0.5,"cy":0.5,"zoom":500}')?.zoom).toBe(MAX_ZOOM);
  });
});
