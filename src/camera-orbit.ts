import * as THREE from 'three';

/** Camera-only world-Y offset. Input is integrated in seconds, never physics yaw. */
export class CameraOrbit {
  angle=0;
  private waitForNeutral=false;
  reset(){this.angle=0;this.waitForNeutral=true;}
  advance(axis:number,dt:number,enabled:boolean){
    if(!enabled||!Number.isFinite(axis)||!Number.isFinite(dt))return;
    if(this.waitForNeutral){if(Math.abs(axis)<=.18)this.waitForNeutral=false;return;}
    const amount=Math.abs(axis)>.18?Math.sign(axis)*(Math.min(1,Math.abs(axis))-.18)/.82:0;
    this.angle=(this.angle+amount*Math.PI*.65*Math.max(0,Math.min(dt,.25)))%(Math.PI*2);
  }
  apply(targets:{eye:THREE.Vector3;look:THREE.Vector3},anchor:THREE.Vector3){
    if(this.angle===0)return;
    const axis=new THREE.Vector3(0,1,0);
    targets.eye.sub(anchor).applyAxisAngle(axis,this.angle).add(anchor);
    targets.look.sub(anchor).applyAxisAngle(axis,this.angle).add(anchor);
  }
}
