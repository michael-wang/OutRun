import {it,expect,vi,afterEach} from 'vitest';
import {DeparturePreparation} from '../src/departure-preparation';
import {PadMenuNavigation} from '../src/pad-menu-navigation';
afterEach(()=>vi.useRealTimers());
it('prepares once, and ignores completion from an old restart',async()=>{
 const gate=new DeparturePreparation();let done!:()=>void;const task=vi.fn(()=>new Promise<void>(r=>done=r));
 const first=gate.begin(task);await Promise.resolve();await gate.begin(task);expect(task).toHaveBeenCalledOnce();expect(gate.state).toBe('warming');
 gate.reset();done();await first;expect(gate.state).toBe('idle');
 await gate.begin(async()=>{});expect(gate.state).toBe('ready');expect(gate.warning).toBe('');
});
it('does not trap START forever if optional driver preparation times out or rejects',async()=>{
 vi.useFakeTimers();const gate=new DeparturePreparation(),pending=gate.begin(()=>new Promise(()=>{}),50);
 await vi.advanceTimersByTimeAsync(51);await pending;expect(gate.state).toBe('ready');expect(gate.warning).toMatch('budget');
 gate.reset();await gate.begin(async()=>{throw Error('context lost');});expect(gate.state).toBe('ready');expect(gate.warning).toMatch('context lost');
});
it('supports vertical/diagonal stick selection, repeat, hysteresis and release after a screen transition',()=>{
 const nav=new PadMenuNavigation(),b=Array(18).fill(false);
 expect(nav.poll(.2,.8,b,0)).toBe('down');expect(nav.poll(.2,.8,b,200)).toBe(null);expect(nav.poll(.2,.8,b,420)).toBe('down');
 expect(nav.poll(.2,.4,b,500)).toBe(null);expect(nav.poll(.2,.4,b,580)).toBe('down');
 nav.reset(true);expect(nav.poll(0,1,b,1000)).toBe(null);nav.poll(0,0,b,1001);expect(nav.poll(0,-1,b,1002)).toBe('up');
 nav.poll(0,0,b,1003);b[15]=true;expect(nav.poll(0,0,b,1004)).toBe('right');
});
