// Normalized axes and pointer coordinates may arrive as float32.
export const dead = .08, fullLock = .95 - 1e-6;
export function createSteerBar() { return {sign:0, level:0, target:0, raw:0}; }
export function stepSteerBar(bar, axis) {
 const raw=Math.max(-1,Math.min(1,axis)), mag=Math.abs(raw);
 const travel=Math.max(0,(mag-dead)/(1-dead));
 bar.raw=raw;
 bar.sign=travel?Math.sign(raw):0;
 bar.level=mag>=fullLock?4:mag>=.67?3:mag>=.40?2:travel?1:0;
 bar.target=bar.sign*travel;
 return bar.target;
}
