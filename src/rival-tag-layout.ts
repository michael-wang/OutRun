/** Screen-space opponent marker placement. Keep the car pointer near the roof.
 * Never push a distant marker down across traffic to dodge the race HUD. */
export interface RaceHudBounds {left:number;right:number;bottom:number}
export const MOBILE_RIVAL_PLATE_WIDTH_PX=108;
export const MOBILE_RIVAL_PLATE_HEIGHT_PX=72;
const BADGE_CANVAS_HEIGHT=344;
const BADGE_PLAQUE_TOP=21;
const MAX_DOWN_PX=22;
const HUD_MARGIN_PX=7;

export function mobileRivalPlatePlacement(
 screenX:number,anchorScreenY:number,hud:RaceHudBounds|null,
 width=MOBILE_RIVAL_PLATE_WIDTH_PX,height=MOBILE_RIVAL_PLATE_HEIGHT_PX,
):{downPx:number;visible:boolean}{
 if(!hud)return {downPx:0,visible:true};
 const horizontalOverlap=screenX+width*.5>hud.left-5&&screenX-width*.5<hud.right+5;
 if(!horizontalOverlap)return {downPx:0,visible:true};
 // center=(0.5, 0): the 344px badge canvas grows upward from the car roof.
 const plaqueTop=anchorScreenY-height*(BADGE_CANVAS_HEIGHT-BADGE_PLAQUE_TOP)/BADGE_CANVAS_HEIGHT;
 const requiredDrop=Math.max(0,hud.bottom+HUD_MARGIN_PX-plaqueTop);
 if(requiredDrop>MAX_DOWN_PX){
  // No clearance without covering the roadway: suppress this *distant* label.
  return {downPx:0,visible:false};
 }
 return {downPx:requiredDrop,visible:true};
}
