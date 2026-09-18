import { describe, expect, it } from "vitest";
import { createRng, seedFromString } from "./rng";

describe("createRng", () => {
  it("is reproducible from the seed", () => {
    const a = createRng(12345);
    const b = createRng(12345);
    const seqA = Array.from({ length: 50 }, () => a.next());
    const seqB = Array.from({ length: 50 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it("gives different streams for different seeds", () => {
    const a = Array.from({ length: 20 }, (_, i) => createRng(i).next());
    expect(new Set(a).size).toBe(20);
  });

  it("stays inside [0, 1)", () => {
    const rng = createRng(7);
    for (let i = 0; i < 10_000; i++) {
      const value = rng.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("int() covers its range inclusively", () => {
    const rng = createRng(99);
    const seen = new Set<number>();
    for (let i = 0; i < 5000; i++) seen.add(rng.int(-3, 3));
    expect([...seen].sort((x, y) => x - y)).toEqual([-3, -2, -1, 0, 1, 2, 3]);
  });

  it("nonZeroInt() never returns zero and covers the rest", () => {
    const rng = createRng(4);
    const seen = new Set<number>();
    for (let i = 0; i < 5000; i++) {
      const value = rng.nonZeroInt(-4, 4);
      expect(value).not.toBe(0);
      seen.add(value);
    }
    expect([...seen].sort((x, y) => x - y)).toEqual([
      -4, -3, -2, -1, 1, 2, 3, 4,
    ]);
  });

  it("nonZeroInt() handles ranges that do not straddle zero", () => {
    const rng = createRng(5);
    for (let i = 0; i < 200; i++) {
      expect(rng.nonZeroInt(2, 5)).toBeGreaterThanOrEqual(2);
      expect(rng.nonZeroInt(-5, -2)).toBeLessThanOrEqual(-2);
    }
  });

  it("shuffle() keeps every element", () => {
    const rng = createRng(11);
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    for (let i = 0; i < 100; i++) {
      const out = rng.shuffle(input);
      expect([...out].sort((a, b) => a - b)).toEqual(input);
    }
  });
});

describe("seedFromString", () => {
  it("is stable and differs by day", () => {
    expect(seedFromString("2026-09-18")).toBe(seedFromString("2026-09-18"));
    expect(seedFromString("2026-09-18")).not.toBe(seedFromString("2026-09-19"));
  });
});
