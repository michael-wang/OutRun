/**
 * GPU-cost-oriented diagnostic switches for the coast, initialised once per coast launch.
 * Expected costs are hypotheses, not measured hardware GPU timings.
 */
export const COAST_SHADOW_TECHNIQUES=[
 {id:'dynamicMap',label:'即時 3D Shadow Map',cost:'2048² · 每幀深度繪製＋取樣',expected:'高'},
 {id:'staticMap',label:'靜態快取 Shadow Map',cost:'3072² · 240m／載入時重建＋每幀取樣',expected:'中～高'},
 {id:'boatDepth',label:'海面船影 Depth Pass',cost:'512² · 最多 10 Hz＋海面取樣',expected:'低～中'},
 {id:'rockShader',label:'海面岩影 Shader',cost:'海水像素計算，無額外 Shadow Map',expected:'待測'},
 {id:'contactDecals',label:'平面接觸陰影 Decal',cost:'車輪／交通車的透明貼片',expected:'低'},
] as const;
export type CoastShadowTechnique=typeof COAST_SHADOW_TECHNIQUES[number]['id'];
const state=Object.fromEntries(COAST_SHADOW_TECHNIQUES.map(tech=>[tech.id,true])) as Record<CoastShadowTechnique,boolean>;
export function applyCoastShadowProfile(coarsePointer:boolean){
 state.dynamicMap=state.staticMap=!coarsePointer;
 state.boatDepth=state.rockShader=state.contactDecals=true;
 return coarsePointer?'mobile-fast':'desktop';
}
export function coastShadowTechniqueEnabled(tech:CoastShadowTechnique){return state[tech];}
export function coastShadowTechniqueSnapshot():Record<CoastShadowTechnique,boolean>{return {...state};}
export function setCoastShadowTechniqueEnabled(tech:CoastShadowTechnique,enabled:boolean){
 if(state[tech]===enabled)return false;
 state[tech]=enabled;
 return true;
}
