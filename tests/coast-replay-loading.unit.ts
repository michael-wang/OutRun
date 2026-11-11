import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';

it('puts the existing scenic loading surface OVER the world before a replay jumps',()=>{
 const s=readFileSync(new URL('../src/main.ts',import.meta.url),'utf8');
 const start=s.indexOf('function restart(){'),end=s.indexOf("\n$('player-retry').onclick=",start);
 expect(start).toBeGreaterThan(0);expect(end).toBeGreaterThan(start);
 const restart=s.slice(start,end);
 expect(restart).toContain("if(replayPreparing)return;");
 expect(restart).toContain("loadingStarted('正在準備重新出發'");
 expect(restart.indexOf('loadingStarted(')).toBeLessThan(restart.indexOf('state=createState()'));
 expect(restart).toContain('world.streamer?.update(state.distance)');
 expect(restart).toContain("mode='ready'");
 expect(restart).toContain('readyEnabled=!replayPreparing;ui()');
 expect(restart).not.toContain('if(!replayPreparing)start()');
 expect(restart).not.toContain("loadingDismissReady()");
});

it('waits for nearby road, scenery and nature textures, without blocking on background farm shader warmup',()=>{
 const main=readFileSync(new URL('../src/main.ts',import.meta.url),'utf8');
 const streaming=readFileSync(new URL('../src/streamed-scene.ts',import.meta.url),'utf8');
 expect(main).toContain("function start(){if(!raceStartConfirmed||journeyTransition||replayPreparing");
 const i=main.indexOf('if(replayPreparing&&world.streamer)'),j=main.indexOf('if(startupPending)',i);
 const gate=main.slice(i,j);
 expect(i).toBeGreaterThan(0);expect(j).toBeGreaterThan(i);
 expect(gate).toContain('const prepared=stream.ready;');
 expect(gate).not.toContain('stream.ready&&!warm.running');
 expect(gate).toContain('loadingProgress(');
 expect(gate).toContain('loadingFinished()');
 expect(gate).toContain("mode='ready';readyEnabled=true;ui()");
 expect(gate).not.toContain('start();');
 expect(gate).toContain("loadingFailed('重新出發");
 expect(streaming).toContain("this.natureTextureLoads===0&&this.nearby.every");
 expect(streaming).toContain("c?.road==='ready'&&c.scenery==='ready'");
});
