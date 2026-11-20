import inventory from '../../content/scenery/coast-neighbours.json';
import {KENTING_INSTALLATION} from '../kenting-installation';

/** R2a source inventory only: all stations here reconstruct the OLD design
 * locations for ownership tests. R2b must place segments with their own ports.
 * Do not mistake these reference station values for the final stage order. */
const harbour=inventory.segments['working-harbour'];
const woods=inventory.segments['coastal-woods'];
export const COAST_NEIGHBOUR_INVENTORY=inventory;

export const COAST_WORKING_HARBOUR_LANDINGS=harbour.landings.map(p=>({
 d:harbour.referenceAnchorM+p.localM,x:p.lateral,radius:p.radius,
}));
export const COAST_WORKING_HARBOUR_BOATS=harbour.boats.map(p=>({
 id:p.id,d:harbour.referenceAnchorM+p.localM,kind:p.kind as 'fishing',
 offshore:p.offshoreM,length:p.lengthM,
}));
export const COAST_WOODS_INLAND_SITES=woods.inlandCopses.map(p=>[
 woods.referenceAnchorM+p.localM,p.x,p.h,
] as const);
export const COAST_WOODS_SHORE_CENTERS=woods.shoreWindbreakCentersLocalM.map(
 local=>woods.referenceAnchorM+local
);

const ownedHeroIds=new Set(Object.values(inventory.segments).map(s=>s.heroId));
const harbourLandings=new Set(COAST_WORKING_HARBOUR_LANDINGS.map(s=>s.d));
const harbourBoats=new Set(COAST_WORKING_HARBOUR_BOATS.map(s=>s.id));

/** Preserve R1 candidate isolation; ownership is now in a reusable source
 * registry instead of a beach-specific exception list. */
export const heroDeferred=(id:string)=>KENTING_INSTALLATION.relocated&&ownedHeroIds.has(id);
export const landingDeferred=(station:number)=>heroDeferred(harbour.heroId)&&harbourLandings.has(station);
export const boatDeferred=(id:string)=>heroDeferred(harbour.heroId)&&harbourBoats.has(id);
