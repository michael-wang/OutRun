/** Public query contract: old debug URLs never change gameplay modes. */
export const GAME_QUERY_KEYS=['fpsdiag','startupdiag','at','trafficSeed','rivaldebug'] as const;
// Private dev-only visual marker for data-authored stage prefabs.
export const DEV_QUERY_KEYS=['prefabdebug','r5qa','r6','hairWind','hairMid','hairUpper','hairStyle','heroine','hero3d'] as const;
export function canonicalGameQuery(raw:URLSearchParams){
 const result=new URLSearchParams();
 if(raw.get('fpsdiag')==='1')result.set('fpsdiag','1');
 if(raw.get('startupdiag')==='1')result.set('startupdiag','1');
 const at=raw.get('at');
 if(at!==null&&at.trim()!==''&&Number.isFinite(Number(at))&&Number(at)>=350)result.set('at',String(Number(at)));
 const trafficSeed=raw.get('trafficSeed');
 if(trafficSeed!==null&&/^[0-9]{1,10}$/.test(trafficSeed)&&Number(trafficSeed)<=0xffffffff)
  result.set('trafficSeed',String(Number(trafficSeed)));
 if(raw.get('rivaldebug')==='1')result.set('rivaldebug','1');
 if(import.meta.env.DEV&&raw.get('prefabdebug')==='1')result.set('prefabdebug','1');
 if(import.meta.env.DEV&&raw.get('r5qa')==='1')result.set('r5qa','1');
 if(import.meta.env.DEV&&raw.get('r6')==='previous')result.set('r6','previous');
 if(import.meta.env.DEV&&['baseline','dramatic','wild'].includes(raw.get('hairWind')??''))result.set('hairWind',raw.get('hairWind')!);
 if(import.meta.env.DEV&&raw.get('hairMid')==='old')result.set('hairMid','old');
 if(import.meta.env.DEV&&raw.get('hairUpper')==='old')result.set('hairUpper','old');
 if(import.meta.env.DEV&&['r6c','r6d','r6f','r6g'].includes(raw.get('hairStyle')??''))result.set('hairStyle',raw.get('hairStyle')!);
 if(import.meta.env.DEV&&['previous','r7a'].includes(raw.get('heroine')??''))result.set('heroine',raw.get('heroine')!);
 if(import.meta.env.DEV&&raw.get('hero3d')==='1')result.set('hero3d','1');
 return result;
}
