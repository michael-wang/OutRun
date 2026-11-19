import coastRoad from '../content/stages/coast/road.json';

/** Public query contract: old debug URLs never change gameplay modes. */
export const GAME_QUERY_KEYS=['car','fpsdiag','startupdiag','at','trafficSeed','rivaldebug'] as const;
// Private dev-only visual marker for data-authored stage prefabs.
export const DEV_QUERY_KEYS=['beach2','prefabdebug','r5qa','r6','hairWind','hairMid','hairUpper','hairStyle','heroine','hero3d','beachBlockout','beachAnchor','beachMacro','sunsetRoute','sunSide','beachVista','beachFlow','coastClose','beachPlan','beachLife','coast','beach'] as const;
export function canonicalGameQuery(raw:URLSearchParams){
 const result=new URLSearchParams();
 if(import.meta.env.DEV&&raw.get('beach2')==='1')result.set('beach2','1');
 if(import.meta.env.DEV&&raw.get('coast')==='original')result.set('coast','original');
 if(import.meta.env.DEV&&raw.get('beach')==='dense')result.set('beach','dense');
 if(import.meta.env.DEV&&['b','right'].includes(raw.get('beachMacro')??''))result.set('beachMacro',raw.get('beachMacro')!);
 if(import.meta.env.DEV&&result.get('beachMacro')==='right'&&raw.get('sunsetRoute')==='1')result.set('sunsetRoute','1');
 if(result.get('sunsetRoute')==='1'&&['left','wide'].includes(raw.get('sunSide')??''))result.set('sunSide',raw.get('sunSide')!);
 if(result.get('sunsetRoute')==='1'&&raw.get('beachVista')==='1')result.set('beachVista','1');
 if(result.get('beachVista')==='1'&&raw.get('beachFlow')==='1')result.set('beachFlow','1');
 if(result.get('beachFlow')==='1'&&raw.get('coastClose')==='1')result.set('coastClose','1');
 if(result.get('coastClose')==='1'&&raw.get('beachPlan')==='1')result.set('beachPlan','1');
 if(result.get('beachPlan')==='1'&&raw.get('beachLife')==='1')result.set('beachLife','1');
 if(raw.get('car')==='classic')result.set('car','classic');
 if(raw.get('fpsdiag')==='1')result.set('fpsdiag','1');
 if(raw.get('startupdiag')==='1')result.set('startupdiag','1');
 const at=raw.get('at');
 if(at!==null&&/^\d+(?:\.\d+)?$/.test(at.trim())&&Number(at)>=coastRoad.startDistance&&Number(at)<coastRoad.startDistance+coastRoad.length)result.set('at',String(Number(at)));
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
 if(import.meta.env.DEV&&['0','1'].includes(raw.get('beachBlockout')??'')){
  result.set('beachBlockout',raw.get('beachBlockout')!);
  const anchor=raw.get('beachAnchor');
  if(anchor&&Number.isFinite(Number(anchor)))result.set('beachAnchor',String(Number(anchor)));
 }
 return result;
}

/** Only canonical, effective options opt into the private development race. */
export const isDevelopmentRace=(canonical:URLSearchParams)=>import.meta.env.DEV&&canonical.size>(canonical.has('hero3d')?1:0);
