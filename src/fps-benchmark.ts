/**
 * Read-only shadow performance A/B route. Keep it strictly opt-in:
 * no player, no scenery, and no normal QA-jump semantics are modified.
 */
export function resolveFixedFpsBenchmark(
 params:URLSearchParams,coast:boolean,routeLength:number,
):number|null{
 if(params.get('fpsbench')!=='1'||params.get('fpsdiag')!=='1'||params.get('qa')==='1'||!coast)return null;
 const raw=params.get('at');
 if(raw===null||raw.trim()==='')return null;
 const distance=Number(raw);
 if(!Number.isFinite(distance)||distance<350||distance>=routeLength-20)return null;
 return distance;
}
