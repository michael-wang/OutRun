/** Public query contract: old debug URLs never change gameplay modes. */
export const GAME_QUERY_KEYS=['fpsdiag','startupdiag','at','trafficSeed'] as const;
export function canonicalGameQuery(raw:URLSearchParams){
 const result=new URLSearchParams();
 if(raw.get('fpsdiag')==='1')result.set('fpsdiag','1');
 if(raw.get('startupdiag')==='1')result.set('startupdiag','1');
 const at=raw.get('at');
 if(at!==null&&at.trim()!==''&&Number.isFinite(Number(at))&&Number(at)>=350)result.set('at',String(Number(at)));
 const trafficSeed=raw.get('trafficSeed');
 if(trafficSeed!==null&&/^[0-9]{1,10}$/.test(trafficSeed)&&Number(trafficSeed)<=0xffffffff)
  result.set('trafficSeed',String(Number(trafficSeed)));
 return result;
}
