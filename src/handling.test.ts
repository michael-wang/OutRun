import { describe, expect, it } from 'vitest';
import { createState, MAX_SPEED, step, type InputState } from './handling';
import { InputLatch, readSwapped, saveSwapped } from './input';
const idle: InputState = { gas: false, brake: false, steer: 0 };
const run = (state: ReturnType<typeof createState>, input: InputState, seconds: number, curvature = 0) => { for (let i = 0; i < seconds * 60; i++) step(state, input, 1 / 60, curvature); };
describe('arcade driving', () => {
  it('requires gas, accelerates progressively, brakes and bounds speed', () => {
    const state = createState(); run(state, idle, 3); expect(state.distance).toBe(0);
    run(state, { ...idle, gas: true }, 4); expect(state.speed).toBeGreaterThan(40); const speed = state.speed;
    run(state, { ...idle, gas: true, brake: true }, 1); expect(state.speed).toBeLessThan(speed - 15);
    run(state, { ...idle, gas: true }, 30); expect(state.speed).toBeLessThanOrEqual(MAX_SPEED);
    run(state, { ...idle, brake: true }, 5); expect(state.speed).toBe(0);
  });
  it('steers in both directions and remains recoverable offroad', () => {
    for (const sign of [-1, 1]) { const state = { ...createState(), speed: 45 }; run(state, { ...idle, gas: true, steer: sign }, 0.5); expect(state.lateral * sign).toBeGreaterThan(1); expect(state.heading * sign).toBeGreaterThan(0.1); run(state, { ...idle, gas: true, steer: sign }, 5); expect(Math.abs(state.lateral)).toBeLessThanOrEqual(9.2); const edge = state.lateral; run(state, { ...idle, gas: true, steer: -sign }, 1); expect(Math.abs(state.lateral)).toBeLessThan(Math.abs(edge)); }
  });
  it('slips progressively during fast turns and recovers', () => {
    const state = { ...createState(), speed: 60 }; run(state, { ...idle, gas: true, steer: 1 }, 0.5); expect(state.slip).toBeGreaterThan(0.4); expect(state.heading).toBeLessThan(0.4); run(state, { ...idle, gas: true }, 2); expect(state.slip).toBeLessThan(0.01); expect(Math.abs(state.heading)).toBeLessThan(0.01);
  });
});
describe('independent inputs and settings', () => {
  it('retains gas while releasing steering and clears all on blur/cancel', () => {
    const input = new InputLatch(); input.press('finger:1', 'gas'); input.press('finger:2', 'left'); expect(input.snapshot()).toEqual({ gas: true, brake: false, steer: -1 }); input.release('finger:2'); expect(input.snapshot().gas).toBe(true); input.press('keyboard', 'gas'); input.release('finger:1'); expect(input.snapshot().gas).toBe(true); input.clear(); expect(input.snapshot()).toEqual(idle);
  });
  it('persists both hand layouts and handles unavailable storage', () => {
    const data = new Map<string, string>(); const storage = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } };
    expect(readSwapped(storage)).toBe(false); saveSwapped(true, storage); expect(readSwapped(storage)).toBe(true); saveSwapped(false, storage); expect(readSwapped(storage)).toBe(false); expect(readSwapped({ getItem: () => { throw Error(); } })).toBe(false);
  });
});
