import effectsFile from '../../content/stages/coast/effects.json';

/** R4a: exact accepted sunset-coast effect parameters. These are semantic
 * stage settings, independent of the authoring/transport encoding. */
export interface OceanStageEffects{
 windSpeed:number;waveScale:number;swellScale:number;
 fftMobile:number;fftDesktop:number;
}
export interface VegetationStageEffects{
 baseDensity:number;
 /** All four positions use absolute HUD metres, not scenic-act offsets. */
 quietBeach:{start:number;fullStart:number;fullEnd:number;end:number;density:number};
}
export interface FlowerDetailBudget{
 bladeDensity:number;flowerDensity:number;maxFlowers:number;
}
export interface FlowerStageEffects{
 palette:string[];near:FlowerDetailBudget;middle:FlowerDetailBudget;
}
/** R4b: stage-owned sunset appearance, not an additional render pipeline. */
export interface CoastLightingStageEffects{
 sunDirection:[number,number,number];shadowStretch:number;
 hemisphere:{sky:string;ground:string;intensity:number};
 sun:{color:string;nearIntensity:number;farIntensity:number};
 fog:{color:string;near:number;far:number};
}
export interface CoastShadowStageProfile{
 dynamicMap:boolean;staticMap:boolean;boatDepth:boolean;
 rockShader:boolean;contactDecals:boolean;
 nearMapSize:number;farMapSize:number;
}
export interface CoastShadowStageEffects{
 mobile:CoastShadowStageProfile;desktop:CoastShadowStageProfile;
}
export interface CoastStageEffects{
 schemaVersion:1;id:'coast';
 ocean:OceanStageEffects;vegetation:VegetationStageEffects;flowers:FlowerStageEffects;
 lighting:CoastLightingStageEffects;shadows:CoastShadowStageEffects;
}
export const COAST_EFFECTS=effectsFile as CoastStageEffects;

/** Validate once at the same stage boundary as the road and placed props.
 * Keep budgets safe for phones; an invalid scene must fail before streaming. */
export function validateCoastEffects(effect:CoastStageEffects,roadStart:number,roadLength:number){
 if(effect?.schemaVersion!==1||effect.id!=='coast')throw Error('Invalid coast effects header');
 const ocean=effect.ocean;
 const bounded=(value:number,max:number)=>Number.isFinite(value)&&value>=0&&value<=max;
 if(!ocean||!bounded(ocean.windSpeed,45)||!bounded(ocean.waveScale,4)||
    !bounded(ocean.swellScale,3))
  throw Error('Invalid coast ocean parameters');
 const fft=(n:number)=>Number.isInteger(n)&&n>=64&&n<=512&&(n&(n-1))===0;
 if(!fft(ocean.fftMobile)||!fft(ocean.fftDesktop)||
    ocean.fftMobile>ocean.fftDesktop)
  throw Error('Invalid ocean FFT budget');
 const vegetation=effect.vegetation,beach=vegetation?.quietBeach;
 if(!vegetation||!bounded(vegetation.baseDensity,1)||!beach||
    !bounded(beach.density,1)||!Number.isFinite(roadStart+roadLength)||
    !(roadStart<=beach.start&&beach.start<beach.fullStart&&
      beach.fullStart<=beach.fullEnd&&beach.fullEnd<beach.end&&
      beach.end<=roadStart+roadLength))
  throw Error('Invalid coast vegetation envelope');
 const flowers=effect.flowers;
 if(!flowers||!Array.isArray(flowers.palette)||flowers.palette.length<1||
    flowers.palette.length>8||!flowers.palette.every(color=>
      typeof color==='string'&&/^#[0-9a-f]{6}$/i.test(color)))
  throw Error('Invalid flower palette');
 for(const row of [flowers.near,flowers.middle]){
  if(!row||!bounded(row.bladeDensity,2)||!bounded(row.flowerDensity,4)||
     !Number.isInteger(row.maxFlowers)||row.maxFlowers<0||row.maxFlowers>5000)
   throw Error('Invalid flower geometry budget');
 }
 const lighting=effect.lighting,dir=lighting?.sunDirection;
 const rgb=(v:unknown)=>typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v);
 if(!lighting||!Array.isArray(dir)||dir.length!==3||
    !dir.every(v=>typeof v==='number'&&Number.isFinite(v)&&Math.abs(v)<=1)||
    dir[1]<=0||Math.hypot(dir[0],dir[2])<.05||
    !bounded(lighting.shadowStretch,1.5)||lighting.shadowStretch<.1)
  throw Error('Invalid coast sunset direction or shadow projection');
 const hemisphere=lighting.hemisphere,sun=lighting.sun,fog=lighting.fog;
 if(!hemisphere||!rgb(hemisphere.sky)||!rgb(hemisphere.ground)||
    !bounded(hemisphere.intensity,5)||!sun||!rgb(sun.color)||
    !bounded(sun.nearIntensity,5)||!bounded(sun.farIntensity,5)||
    !fog||!rgb(fog.color)||!bounded(fog.near,3000)||
    !bounded(fog.far,5000)||fog.far<=fog.near)
  throw Error('Invalid coast lighting or fog');
 const shadows=effect.shadows;
 if(!shadows||!shadows.mobile||!shadows.desktop)
  throw Error('Missing coast shadow profiles');
 const toggles=['dynamicMap','staticMap','boatDepth','rockShader','contactDecals'] as const;
 for(const [platform,profile] of [['mobile',shadows.mobile],['desktop',shadows.desktop]] as const){
  if(toggles.some(id=>typeof profile[id]!=='boolean'))
   throw Error('Invalid coast shadow technique flags');
  const budget=platform==='mobile'?3072:4096;
  const size=(value:number)=>Number.isInteger(value)&&value>=256&&
   value<=budget&&value%256===0;
  if(!size(profile.nearMapSize)||!size(profile.farMapSize)||
     profile.nearMapSize>profile.farMapSize)
   throw Error('Invalid coast shadow texture budget');
 }
 // Until Pixel 8 is re-profiled, the accepted mobile cost policy is mandatory.
 if(shadows.mobile.dynamicMap||shadows.mobile.staticMap)
  throw Error('Mobile depth shadow maps require a new device FPS acceptance');
}

/** Pure inputs for the existing OceanSim, also inspectable without WebGL. */
/** Select a validated launch-time GPU policy; diagnostic A/B switches stay separate. */
export function coastShadowSettings(effect:CoastShadowStageEffects,mobile:boolean){
 return mobile?effect.mobile:effect.desktop;
}

export function oceanVisualSettings(effect:OceanStageEffects,mobile:boolean){
 return {windSpeed:effect.windSpeed,waveScale:effect.waveScale,
  swellScale:effect.swellScale,resolution:mobile?effect.fftMobile:effect.fftDesktop};
}
