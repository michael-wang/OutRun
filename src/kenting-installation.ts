import layout from '../content/stages/coast/kenting-installation.json';

/** Local s is measured from the accepted R0 core entry. The reference station
 * is retained only to consume the existing authored profile and site recipes. */
export const KENTING_SEGMENT = layout;
/** Accepted production order: A6's native mountain and right bend reveal
 * Kenting directly. Explicit original/relocated modes remain regression-only
 * until the next independently placed Scenic Segment exists. */
const requested = import.meta.env?.VITE_KENTING_INSTALLATION;
const mode = requested === 'original' || requested === 'relocated' ? requested : 'immediate';
const relocated = mode !== 'original'; // Quay and windbreak are intentionally deferred.
const site = layout.sites[mode];
export const KENTING_INSTALLATION = Object.freeze({
  id: layout.id,
  mode,
  relocated,
  shifted: site.coreStart !== layout.referenceCore,
  delta: site.coreStart - layout.referenceCore,
  offsetHeadingDeg: site.offsetHeadingDeg,
  coreStart: site.coreStart,
  coreLength: layout.coreLength,
  tutorialExit: site.tutorialExit,
  roadEntry: site.coreStart + layout.local.roadEntry,
  roadExit: site.coreStart + layout.local.roadExit,
  connectedAt: site.connectedAt
});

export const kentingStation = (localS:number) => KENTING_INSTALLATION.coreStart + localS;
export const kentingLocal = (track:number) => track - KENTING_INSTALLATION.coreStart;
export const kentingReference = (track:number) => track - KENTING_INSTALLATION.delta;
export const kentingPlaced = (referenceTrack:number) => referenceTrack + KENTING_INSTALLATION.delta;

/** Refit the old outer coast profile through the departure, meeting the
 * ordinary landscape at the unmodified downstream port. Derivatives match
 * the station-rate on both sides, so the shelf cannot end with a step. */
export function kentingTransitionReference(track:number) {
  const {roadExit, connectedAt, delta} = KENTING_INSTALLATION;
  if (!delta || track >= connectedAt) return track;
  if (track <= roadExit) return track - delta;
  const t = (track - roadExit) / (connectedAt - roadExit);
  const fade = t*t*t*(10 + t*(-15 + 6*t));
  return track - delta*(1-fade);
}

/** Place discrete roadside features in the same frame as the local road.
 * The entry connector extends the last tutorial-side treatment. The departure
 * uses the inverse of its shoreline reference station so banks and slabs agree. */
export function kentingRoadsideStation(reference:number) {
  const {delta,tutorialExit,roadExit,connectedAt}=KENTING_INSTALLATION;
  if (!delta || reference<=tutorialExit || reference>=connectedAt) return reference;
  if (reference<=roadExit-delta) return kentingPlaced(reference);
  let lo=roadExit,hi=connectedAt;
  for(let i=0;i<32;i++) {
    const mid=(lo+hi)*.5;
    if (kentingTransitionReference(mid)<reference) lo=mid;
    else hi=mid;
  }
  return (lo+hi)*.5;
}
