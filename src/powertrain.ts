/** Six-speed arcade gearbox. Speeds are indicated km/h; travel pace remains separate. */
export const IDLE_RPM=1000,REDLINE_RPM=7200,SHIFT_SECONDS=.18;
export const UPSHIFT_KMH=[50,95,145,195,245] as const;
const GEAR_CEILINGS=[50,95,145,195,245,310] as const;
const GEAR_TORQUE=[1.05,1.03,1.01,1,.98,.96] as const;
export interface PowertrainState {gear:number;rpm:number;shiftRemaining:number;shiftDirection:number;gearInitialized:boolean;tractionFactor:number;driveForce:number;roadDrag:number;netAcceleration:number}
export const createPowertrain=():PowertrainState=>({gear:1,rpm:IDLE_RPM,shiftRemaining:0,shiftDirection:0,gearInitialized:false,tractionFactor:1,driveForce:0,roadDrag:0,netAcceleration:0});
/** Rolling and aerodynamic resistance, in the same acceleration units as drive force. */
export const roadResistance=(speed:number)=>.25+.00007*speed*speed;
/** Smooth torque release, disengagement, and re-engagement over one upshift. */
export function upshiftTraction(progress:number){
 const p=Math.max(0,Math.min(1,progress));
 if(p<.22)return .5+.5*Math.cos(Math.PI*p/.22);
 if(p<.72)return 0;
 return .5-.5*Math.cos(Math.PI*(p-.72)/.28);
}
export function roadRpm(gear:number,speed:number){return Math.max(IDLE_RPM,Math.min(REDLINE_RPM,IDLE_RPM+(REDLINE_RPM-IDLE_RPM)*speed*3.6/GEAR_CEILINGS[Math.max(0,Math.min(5,gear-1))]));}
export function advancePowertrain(s:PowertrainState,speed:number,throttle:boolean,dt:number){
 const kmh=speed*3.6;
 // Rolling starts and deterministic test resets enter the appropriate gear at once.
 if(!s.gearInitialized){s.gear=1+UPSHIFT_KMH.filter(v=>kmh>=v).length;s.rpm=roadRpm(s.gear,speed);s.gearInitialized=true;}
 s.shiftRemaining=Math.max(0,s.shiftRemaining-dt);
 if(!s.shiftRemaining){
  const up=s.gear<6&&throttle&&kmh>=UPSHIFT_KMH[s.gear-1];
  const down=s.gear>1&&kmh<UPSHIFT_KMH[s.gear-2]-12;
  if(up||down){s.gear+=up?1:-1;s.shiftDirection=up?1:-1;s.shiftRemaining=SHIFT_SECONDS;}
  else s.shiftDirection=0;
 }
 const target=roadRpm(s.gear,speed)+(throttle&&speed<3?Math.max(0,1-speed/3)*450:0);
 s.rpm+= (target-s.rpm)*(1-Math.exp(-dt/(s.shiftRemaining>0 ? .055 : .11)));
 const rpmLoad=Math.max(.9,Math.min(1.06,.91+s.rpm/48000));
 const progress=1-s.shiftRemaining/SHIFT_SECONDS;
 s.tractionFactor=s.shiftRemaining>0?(s.shiftDirection>0?upshiftTraction(progress):.38):1;
 s.roadDrag=roadResistance(speed);
 const engineForce=Math.max(0,7.2-.065*speed)*GEAR_TORQUE[s.gear-1]*rpmLoad+s.roadDrag;
 s.driveForce=throttle?engineForce*s.tractionFactor:0;
 return s.driveForce;
}
