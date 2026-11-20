import {KENTING_INSTALLATION,KENTING_SEGMENT} from '../kenting-installation';

// These authored placements remain available in the original layout. R2 will
// decide the independent harbour and woods sites; R1 never places replacements.
const deferred=KENTING_SEGMENT.deferredScenery;
export const heroDeferred=(id:string)=>KENTING_INSTALLATION.relocated&&deferred.heroIds.includes(id);
export const landingDeferred=(station:number)=>heroDeferred('working-harbour')&&deferred.harbourLandingStations.includes(station);
export const boatDeferred=(id:string)=>heroDeferred('working-harbour')&&deferred.harbourBoatIds.includes(id);
