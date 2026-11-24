import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import type {Plugin} from 'vite';
export const OPTION_B_HASH='01152cd6c938c2bf3298ba3ec18abcc1228e99db0ecae9f1f07a86a48ce6ab00';
export const OPTION_B_PATH=`runtime/option-b-${OPTION_B_HASH}.glb`;
/** Private-only packaging. No release clearance can be inferred from this flag. */
export function optionBPackaging():Plugin{
 return {name:'option-b-packaging',apply:'build',async buildStart(){
  if(process.env.OUTRUN_PRIVATE_PREVIEW!=='1')throw Error('GLOBAL RELEASE BLOCKED — LICENSE: Hunyuan output rights not cleared. Use OUTRUN_PRIVATE_PREVIEW=1 only for an authorized private preview.');
  const data=await readFile(resolve('.local/option-b.glb'));
  if(createHash('sha256').update(data).digest('hex')!==OPTION_B_HASH)throw Error('Required approved Option B runtime GLB missing or hash mismatch');
  this.emitFile({type:'asset',fileName:OPTION_B_PATH,source:data});
 }};
}
