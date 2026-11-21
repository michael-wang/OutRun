import {configureKentingCoast} from '../src/beach-macro';
import {BEACH2,beach2RoadHeight} from '../src/beach2-profile';
import {coastWorkerRoad} from '../src/content/coast-worker-road';
import {KENTING_INSTALLATION} from '../src/kenting-installation';

export {KENTING_INSTALLATION};
export {bakeCoastShore} from '../src/coast-shore';
export {packCoastShore,COAST_SHORE_KEY,COAST_SHORE_NAME} from '../src/coast-shore-asset';
export {FARM_PLOTS} from '../src/coast-farm-layout';
export {sampleFarmGround} from '../src/coast-farm-prep';

/** One SSR import graph owns both the coast flags and their consumers. A file
 * edit during an offline bake must never switch one of them to a new module. */
export function prepareBakeTracks(){
  const referenceFarmTrack=coastWorkerRoad().track;
  configureKentingCoast();
  const track=coastWorkerRoad().track;
  for(const s of [0,650,1170]){
    const y=track.sample(BEACH2.core+s).position.y;
    if(Math.abs(y-beach2RoadHeight(s))>1e-7)throw Error('Shore bake loaded a road without the installed Kenting profile.');
  }
  return {track,farmTrack:KENTING_INSTALLATION.shifted?track:referenceFarmTrack};
}
