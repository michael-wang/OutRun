import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {createRivieraTailLamps} from './hero-classic-geometry';
import {createSpiderShell,createWheelBrow,createGTWingMirrorHousing} from './hero-body';
import {createRoadWheel,wheelRoll} from './wheels';
import {TireEffects,type TireContact} from './tire-effects';
import type {RivalRace,RaceStanding} from './rival-race';
import type {createTrack} from './track';
import {chaseTargets} from './chase';
import {mobileRivalPlatePlacement,MOBILE_RIVAL_PLATE_HEIGHT_PX,MOBILE_RIVAL_PLATE_WIDTH_PX,type RaceHudBounds} from './rival-tag-layout';

function canopy(){
  // Beltline, window shoulders and crown follow a single longitudinal loft.
  const rings=[[-1.58,.88,.90,.74],[-1.25,.94,1.14,.89],[-.83,.95,1.48,.92],
    [-.53,.95,1.56,.93],[.08,.94,1.54,.93],[.34,.93,1.44,.92],[.87,.90,.96,.81]];
  const panels:number[][]=[[],[]];
  const section=([z,base,top,w]:number[])=>[
    [-w,base,z],[-w*.8,top-.055,z],[-w*.63,top,z],[0,top+.018,z],[w*.63,top,z],[w*.8,top-.055,z],[w,base,z]];
  for(let i=1;i<rings.length;i++){
    const a=section(rings[i-1]),b=section(rings[i]);
    for(let j=0;j<6;j++){
      const glass=i===2||i===6||((j===0||j===5)&&i!==3);
      panels[Number(glass)].push(...a[j],...b[j],...a[j+1],...a[j+1],...b[j],...b[j+1]);
    }
  }
  return panels.map(vertices=>{const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.computeVertexNormals();return g;});
}
function tintedFace(source:T.BufferGeometry, tint:T.Color){
  const face=source.index?source.toNonIndexed():source.clone();
  face.deleteAttribute('uv');
  const rgb=new Float32Array(face.attributes.position.count*3);
  for(let i=0;i<rgb.length;i+=3)tint.toArray(rgb,i);
  face.setAttribute('color',new T.BufferAttribute(rgb,3));
  return face;
}
function wheelGeometry(){
  const wheel=createRoadWheel(1,false).pivot,faces:T.BufferGeometry[]=[];
  const resources=new Set<T.BufferGeometry|T.Material>();
  wheel.updateMatrixWorld(true);
  wheel.traverse(o=>{
    if(!(o instanceof T.Mesh))return;
    const material=o.material as T.MeshStandardMaterial;
    resources.add(o.geometry);resources.add(material);
    if(material.opacity>0)faces.push(tintedFace(o.geometry,material.color).applyMatrix4(o.matrixWorld));
  });
  const wheelFace=mergeGeometries(faces)!;
  faces.forEach(face=>face.dispose());resources.forEach(r=>r.dispose());
  return wheelFace;
}
function rearTrim(){
  const faces:T.BufferGeometry[]=[];
  function add(g:T.BufferGeometry,color:number){
    faces.push(tintedFace(g,new T.Color(color)));g.dispose();
  }
  add(new T.BoxGeometry(.8,.23,.05).translate(0,.57,-2.425),0x42515b);
  add(new T.BoxGeometry(.69,.15,.025).translate(0,.57,-2.46),0xc9c6b3);
  for(const side of [-1,1])add(new T.CylinderGeometry(.074,.074,.16,12).rotateX(Math.PI/2).translate(side*.66,.30,-2.39),0x948b85);
  const trim=mergeGeometries(faces)!;faces.forEach(face=>face.dispose());return trim;
}
/** Draw a compact racing plaque: live rank, driver name, and one car pointer.
 * Never recreate textures when the race order changes; repaint the existing canvas. */
function drawBadge(canvas:HTMLCanvasElement,name:string,rank:number){
 const c=canvas.getContext('2d')!;
 c.clearRect(0,0,canvas.width,canvas.height);
 c.save();
 // A compact plaque above the horizon. Its thin leader reaches DOWN toward
 // the car roof, so the readable block no longer masks the upcoming roadway.
 c.shadowColor='rgba(0,8,17,.82)';c.shadowBlur=12;c.shadowOffsetY=5;
 c.beginPath();c.moveTo(27,21);c.lineTo(473,21);c.lineTo(500,48);
 c.lineTo(488,120);c.lineTo(24,120);c.lineTo(13,104);c.lineTo(18,41);
 c.closePath();
 const bg=c.createLinearGradient(0,22,0,132);
 bg.addColorStop(0,'#263945');bg.addColorStop(.53,'#122633');bg.addColorStop(1,'#0a1722');
 c.fillStyle=bg;c.fill();c.shadowBlur=0;c.shadowOffsetY=0;
 c.strokeStyle='#ffbc66';c.lineWidth=5;c.stroke();
 // The numbering is one meaningful signal: the opponent's current race place.
 c.beginPath();c.moveTo(28,34);c.lineTo(138,34);c.lineTo(128,111);c.lineTo(22,111);
 c.closePath();
 const gold=c.createLinearGradient(24,33,133,113);
 gold.addColorStop(0,'#ffe1a0');gold.addColorStop(.55,'#ffbb57');gold.addColorStop(1,'#d87824');
 c.fillStyle=gold;c.fill();
 c.fillStyle='#121c25';c.textAlign='center';c.textBaseline='middle';
 c.font='italic 900 65px "Arial Black",Arial,sans-serif';
 c.fillText(String(rank).padStart(2,'0'),78,75,106);
 c.textAlign='left';c.fillStyle='#fff5e5';
 c.font='italic 900 67px "Arial Black",Arial,sans-serif';
 c.fillText(name,156,76,309);
 // A clear outline makes the marker readable against both sunset and mountains.
 c.strokeStyle='rgba(255,215,151,.30)';c.lineWidth=2;
 c.beginPath();c.moveTo(148,108);c.lineTo(468,108);c.stroke();
 // A slender 42px screen-space leader ends just above the target's roof.
 // It is part of this same canvas and adds zero GPU draw calls.
 c.shadowBlur=0;c.strokeStyle='rgba(11,20,27,.93)';c.lineWidth=11;
 c.beginPath();c.moveTo(256,120);c.lineTo(256,302);c.stroke();
 c.strokeStyle='#ffe2a3';c.lineWidth=5;
 c.beginPath();c.moveTo(256,120);c.lineTo(256,302);c.stroke();
 c.beginPath();c.moveTo(241,294);c.lineTo(256,323);c.lineTo(271,294);c.closePath();
 c.fillStyle='#ffbc66';c.fill();c.strokeStyle='#17252e';c.lineWidth=3;c.stroke();
 c.restore();
}
function badge(name:string,rank:number){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=344;
 drawBadge(canvas,name,rank);
 const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
 return {canvas,material:new T.SpriteMaterial({map,transparent:true,depthWrite:false,depthTest:true,
  sizeAttenuation:false,toneMapped:false,fog:false})};
}
function assets(){
  const [roof,glass]=canopy();
  const painted=[createSpiderShell(),roof];
  for(const side of [-1,1]){
    for(const z of [-1.45,1.38])painted.push(createWheelBrow(side).translate(0,.46,z));
    painted.push(createGTWingMirrorHousing().translate(side*1.121,.996,.426));
  }
  const faces=painted.map(g=>{const face=g.index?g.toNonIndexed():g;for(const key of Object.keys(face.attributes))if(key!=='position'&&key!=='normal')face.deleteAttribute(key);return face;});
  const coachwork=mergeGeometries(faces)!;new Set([...faces,...painted]).forEach(g=>g.dispose());
  const headlight=new T.SphereGeometry(1,12,6);
  const lamps=[-1,1].map(side=>headlight.clone().scale(.20,.072,.12).translate(side*.72,.78,1.99));
  const front=mergeGeometries(lamps)!;lamps.forEach(g=>g.dispose());headlight.dispose();
  const shadow=new T.CircleGeometry(1,24);shadow.rotateX(-Math.PI/2);shadow.scale(1.2,1,2.48);shadow.translate(0,.025,0);
  return {shell:coachwork,glass,wheels:wheelGeometry(),trim:rearTrim(),rear:createRivieraTailLamps(),front,shadow,
    rubber:new T.MeshStandardMaterial({vertexColors:true,roughness:.63}), windows:new T.MeshStandardMaterial({color:0x334859,emissive:0x0b1923,roughness:.46,metalness:.1,side:T.DoubleSide}),
    head:new T.MeshStandardMaterial({color:0xffebcf,emissive:0xffb673,emissiveIntensity:.48}),
    shade:new T.MeshBasicMaterial({color:0x120f12,transparent:true,opacity:.32,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1})};
}
function carModel(a:ReturnType<typeof assets>,color:number,name:string,number:number){
  const root=new T.Group();root.rotation.order='YXZ';
  const paint=new T.MeshStandardMaterial({color,roughness:.29,metalness:.39,side:T.DoubleSide});
  const tail=new T.MeshStandardMaterial({color:0xcd2429,emissive:0xff1522,emissiveIntensity:.5,side:T.DoubleSide});
  const wheels=new T.InstancedMesh(a.wheels,a.rubber,4);
  wheels.boundingSphere=new T.Sphere(new T.Vector3(),3);
  root.add(new T.Mesh(a.shell,paint),wheels,new T.Mesh(a.glass,a.windows),
    new T.Mesh(a.trim,a.rubber),new T.Mesh(a.rear,tail),new T.Mesh(a.front,a.head),new T.Mesh(a.shadow,a.shade));
  const plaque=badge(name,number);
  const label=new T.Sprite(plaque.material);label.name='rival-name-tag';
  label.position.y=1.84;label.center.set(.5,0);root.add(label);
  return {root,tail,label,wheels,badgeCanvas:plaque.canvas,badgeRank:number};
}
export class RivalView {
  readonly group=new T.Group();
  private readonly assets=assets();
  private readonly cars;
  private readonly contacts:TireContact[]=[-1,1].map(side=>({name:'rear-wheel-'+side,onRoad:true,gap:0,surface:[0,0,0]}));
  private point=new T.Vector3();
  private wheelPose=new T.Object3D();
  constructor(private race:RivalRace,scene:T.Scene,smoke:TireEffects,private sample:ReturnType<typeof createTrack>['sample']){
    scene.add(this.group);
    this.cars=race.rivals.map((r,i)=>{
      const car=carModel(this.assets,r.entry.paint,r.entry.name,i+1);car.root.name=r.entry.id;this.group.add(car.root);
      const effects=new TireEffects(scene,'smoke',smoke);
      effects.setEmitterSeed(i+1);
      return {...car,near:false,markerDropPx:0,markerHiddenForHud:false,effects};
    });
  }
  inspectEffects(){return this.cars.map((car,i)=>({...car.effects.inspect(),skidDemand:this.race.rivals[i].slip,speed:this.race.rivals[i].speed}));}
  inspectTags(){return this.cars.map((car,i)=>({
    name:this.race.rivals[i].entry.name,rank:car.badgeRank,
    textureId:(car.label.material as T.SpriteMaterial).map?.uuid,
    visible:car.root.visible&&car.label.visible,
    sizeAttenuation:(car.label.material as T.SpriteMaterial).sizeAttenuation,
    scale:car.label.scale.toArray(),canvasHeight:car.badgeCanvas.height,anchorHeight:car.label.position.y,
    markerDropPx:car.markerDropPx,markerHiddenForHud:car.markerHiddenForHud,
  }));}
  /** Rank changes are checked at the existing 125ms race-HUD cadence.
   * Only repaint textures when a car's actual place changes. */
  updateRanks(standings:readonly RaceStanding[]){
    for(let i=0;i<this.cars.length;i++){
      const car=this.cars[i],entry=this.race.rivals[i].entry;
      const rank=standings.find(row=>row.id===entry.id)?.rank;
      if(rank===undefined||rank===car.badgeRank)continue;
      drawBadge(car.badgeCanvas,entry.name,rank);
      car.badgeRank=rank;
      const texture=(car.label.material as T.SpriteMaterial).map;
      if(texture)texture.needsUpdate=true;
    }
  }
  reset(){for(const car of this.cars)car.effects.clear();}
  dispose(){for(const car of this.cars){car.effects.dispose();const mat=car.label.material as T.SpriteMaterial;mat.map?.dispose();mat.dispose();}}
  update(focus:number,time:number,countdown:boolean,observed:number,ready:(d:number)=>boolean,camera:T.PerspectiveCamera,viewportHeight:number,mobileTags=false,hudBounds:RaceHudBounds|null=null){
    const pixelUnit=2*Math.tan(T.MathUtils.degToRad(camera.fov)*.5)/Math.max(1,viewportHeight);
    const tagWidth=(mobileTags?MOBILE_RIVAL_PLATE_WIDTH_PX:128)*pixelUnit;
    const tagHeight=(mobileTags?MOBILE_RIVAL_PLATE_HEIGHT_PX:86)*pixelUnit;
    if(mobileTags)camera.updateMatrixWorld();
    this.race.rivals.forEach((r,i)=>{
      const car=this.cars[i],root=car.root,dist=Math.abs(r.distance-focus);
      const visible=dist<720&&ready(r.distance)&&(r.finishTime===null||this.race.time-r.finishTime<8);
      if(!visible){if(root.visible)car.effects.clear(time);root.visible=false;return;}
      root.visible=true;
      const p=this.sample(r.distance);root.position.copy(p.position).addScaledVector(p.right,r.lateral);root.position.y+=.04;
      root.rotation.set(-Math.asin(p.tangent.y),-p.roadHeading-Math.atan2(r.lateralRate+r.impulse,Math.max(8,r.speed)),Math.atan(-p.right.y));
      // The Sprite material disables perspective size attenuation; off-screen tags
      // are naturally frustum-culled and road geometry may occlude them.
      car.label.visible=observed!==i&&r.distance>=focus-2;
      car.label.scale.set(tagWidth,tagHeight,1);
      car.label.position.y=1.84;car.label.center.set(.5,0);
      car.markerDropPx=0;car.markerHiddenForHud=false;
      if(mobileTags&&hudBounds&&car.label.visible){
        // Sprite sizeAttenuation=false keeps the badge height in screen pixels.
        const anchor=this.point.copy(root.position);anchor.y+=1.84;anchor.project(camera);
        const screenX=(anchor.x+1)*.5*viewportHeight*camera.aspect;
        const screenY=(1-anchor.y)*.5*viewportHeight;
        const placement=mobileRivalPlatePlacement(screenX,screenY,hudBounds);
        car.markerDropPx=placement.downPx;car.markerHiddenForHud=!placement.visible;
        if(!placement.visible)car.label.visible=false;
        else if(placement.downPx>0){
          // Adjust sprite center in screen space: its real 3D depth stays anchored
          // above the car, so terrain never clips a HUD-avoidance adjustment.
          car.label.center.y=placement.downPx/MOBILE_RIVAL_PLATE_HEIGHT_PX;
        }
      }
      if(dist<125||!car.wheels.userData.placed){
        car.wheels.userData.placed=true;
        const rotation=wheelRoll(0,r.distance),burn=wheelRoll(0,Math.min(3,time)*16);
        for(let j=0;j<4;j++){
          const side=j%2?1:-1,rear=j<2;
          this.wheelPose.position.set(side*1.055,.46,rear?-1.45:1.38);
          this.wheelPose.rotation.set(side*(rotation+(rear?burn:0)),side<0?Math.PI:0,0,'YXZ');
          this.wheelPose.updateMatrix();car.wheels.setMatrixAt(j,this.wheelPose.matrix);
        }
        car.wheels.instanceMatrix.needsUpdate=true;
      }
      car.tail.emissiveIntensity=r.braking?2.8:.52;
      if(dist<125){
        car.near=true;
        root.updateMatrixWorld();
        this.contacts.forEach((contact,j)=>{this.point.set(j?1:-1,0,-1.45).applyMatrix4(root.matrixWorld).toArray(contact.surface!);});
        const launchBurn=countdown?.50:
          this.race.time<4&&r.speed<7&&r.gearbox.driveForce>2
           ?.45*(1-r.speed/7):0;
        car.effects.update(time,r.speed,r.slip,this.contacts,1,launchBurn);
      }else if(car.near){car.effects.clear(time);car.near=false;}
    });
  }
  chase(index:number,camera:T.PerspectiveCamera){
    const r=this.race.rivals[index],p=this.sample(r.distance);
    const position=this.point.copy(p.position).addScaledVector(p.right,r.lateral);
    const target=chaseTargets(position,p.roadHeading,camera.aspect,p.tangent.y/Math.hypot(p.tangent.x,p.tangent.z));
    camera.position.copy(target.eye);camera.lookAt(target.look);
  }
}
