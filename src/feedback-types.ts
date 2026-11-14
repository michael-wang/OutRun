import type {AuthoredPlacement} from './content/authored-road';
export type PraiseTag='super_fun'|'thrilling'|'hard_but_rewarding'|'beautiful_scenery';
/** Active coastal feedback anchor. Legacy export field names are stable on disk. */
export interface FeedbackAnchor{
 id:string;revision:number;seed:number;contentFingerprint:string;generatorVersion:string;
 handlingVersion?:string;world:'coast'|'city'|'canyon';
 stageCode?:string;tripCode?:string;l2InstanceId?:string;bufferRole?:string;
 profiles:{placements:AuthoredPlacement[];activePlacements:AuthoredPlacement[];
  worldPhases:{startS:number;endS:number;world:'coast';beat:string}[]};
 s:number;trackDistance:number;elapsedSeconds:number;timestampMs:number;
 drive:{speedKmh:number;steerRaw:number;steerApplied:number;roadX:number;height:number;
  grade:number;halfWidth:number;laneCount:number;offRoad:boolean;gas:boolean;brake:boolean};
 source:'drive'|'completion';
}
export interface FeedbackEvent{
 kind:'praise'|'issue';tag?:PraiseTag;note:string;anchor:FeedbackAnchor;
 eventAt?:FeedbackAnchor;reactionAt?:FeedbackAnchor;offsetSeconds?:number;
 inputOrigin?:'keyboard'|'gamepad'|'touch'|'mouse';
}
