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
  it('steers independently in both directions and can leave asphalt', () => {
    for (const sign of [-1,1]) {const state={...createState(),speed:45};run(state,{...idle,gas:true,steer:sign},.8);expect(state.lateral*sign).toBeGreaterThan(1);expect(state.heading*sign).toBeGreaterThan(.1);run(state,{...idle,gas:true},2);expect(Math.abs(state.lateral)).toBeGreaterThan(7);}
  });
  it('slips progressively during fast turns and recovers grip without snapping heading', () => {
    const state={...createState(),speed:60};run(state,{...idle,gas:true,steer:1},1.2,.006);expect(state.slip).toBeGreaterThan(.2);expect(state.heading).toBeLessThan(.7);const heading=state.worldHeading;run(state,{...idle,gas:true},2);expect(state.slip).toBeLessThan(.02);expect(state.worldHeading).toBeGreaterThanOrEqual(heading);
  });});
describe('independent inputs and settings', () => {
  it('retains gas while releasing steering and clears all on blur/cancel', () => {
    const input = new InputLatch(); input.press('finger:1', 'gas'); input.press('finger:2', 'left'); expect(input.snapshot()).toEqual({ gas: true, brake: false, steer: -1 }); input.release('finger:2'); expect(input.snapshot().gas).toBe(true); input.press('keyboard', 'gas'); input.release('finger:1'); expect(input.snapshot().gas).toBe(true); input.clear(); expect(input.snapshot()).toEqual(idle);
  });
  it('persists both hand layouts and handles unavailable storage', () => {
    const data = new Map<string, string>(); const storage = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } };
    expect(readSwapped(storage)).toBe(false); saveSwapped(true, storage); expect(readSwapped(storage)).toBe(true); saveSwapped(false, storage); expect(readSwapped(storage)).toBe(false); expect(readSwapped({ getItem: () => { throw Error(); } })).toBe(false);
  });
});
