/** Six-speed arcade gearbox. Speeds are indicated km/h; travel pace remains separate. */
export const IDLE_RPM=1000,REDLINE_RPM=7200,SHIFT_SECONDS=.32;
export const UPSHIFT_KMH=[50,95,145,195,245] as const;
const GEAR_CEILINGS=[50,95,145,195,245,310] as const;
/** Effective ratios share the same road-speed calibration as the RPM model. */
export const GEAR_RATIOS=GEAR_CEILINGS.map(ceiling=>160/ceiling);
export interface PowertrainState {gear:number;rpm:number;shiftRemaining:number;shiftDirection:number;gearInitialized:boolean;tractionFactor:number;gearRatio:number;engineTorque:number;driveForce:number;roadDrag:number;shiftDrag:number;netAcceleration:number}
export const createPowertrain=():PowertrainState=>({gear:1,rpm:IDLE_RPM,shiftRemaining:0,shiftDirection:0,gearInitialized:false,tractionFactor:1,gearRatio:GEAR_RATIOS[0],engineTorque:0,driveForce:0,roadDrag:0,shiftDrag:0,netAcceleration:0});
/** Rolling and aerodynamic resistance, in the same acceleration units as drive force. */
export const roadResistance=(speed:number)=>.3+.00038*speed*speed;
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
 // Broad naturally aspirated torque band, falling away near idle and redline.
 const rpmFraction=Math.max(0,Math.min(1,(s.rpm-IDLE_RPM)/(REDLINE_RPM-IDLE_RPM)));
 s.engineTorque=6.95*(.82+.18*Math.sin(Math.PI*rpmFraction));s.gearRatio=GEAR_RATIOS[s.gear-1];
 // Sixth gear has a broad midrange torque band that tapers near the limiter.
 if(s.gear===6)s.engineTorque+=6.6*Math.max(0,1-Math.pow(rpmFraction/(300/310),4));
 const progress=1-s.shiftRemaining/SHIFT_SECONDS;
 s.tractionFactor=s.shiftRemaining>0?(s.shiftDirection>0?upshiftTraction(progress):.38):1;
 // Transient driveline drag is a force, integrated with road drag and grade.
 s.shiftDrag=s.shiftRemaining>0&&s.shiftDirection>0?(1-s.tractionFactor)*(.35+1.15*Math.min(1,speed/(245/3.6))):0;
 s.roadDrag=roadResistance(speed);
 const engineForce=Math.min(9.5,s.engineTorque*s.gearRatio);
 s.driveForce=throttle?engineForce*s.tractionFactor:0;
 return s.driveForce;
}
