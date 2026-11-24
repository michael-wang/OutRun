import {it,expect} from 'vitest';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';

it('R5b: the offline Blender guide exporter is executable JavaScript, not a TS-only .mjs',()=>{
 const result=spawnSync(process.execPath,['--check','scripts/r5-export-road-guide.mjs'],{encoding:'utf8'});
 expect(result.status,result.stderr).toBe(0);
 const script=readFileSync('scripts/r5-export-road-guide.mjs','utf8');
 expect(script).toContain('stations.add(accident.distance)');
 expect(script).toContain('const start=road.startDistance,end=road.startDistance+road.length;');
 expect(script).toContain('heroSlots:direction.heroSlots.map(hero=>');
});
