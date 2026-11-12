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
export interface CoastStageEffects{
 schemaVersion:1;id:'coast';
 ocean:OceanStageEffects;vegetation:VegetationStageEffects;flowers:FlowerStageEffects;
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
}

/** Pure inputs for the existing OceanSim, also inspectable without WebGL. */
export function oceanVisualSettings(effect:OceanStageEffects,mobile:boolean){
 return {windSpeed:effect.windSpeed,waveScale:effect.waveScale,
  swellScale:effect.swellScale,resolution:mobile?effect.fftMobile:effect.fftDesktop};
}
