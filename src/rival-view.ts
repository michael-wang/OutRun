import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {createRivieraTailLamps} from './hero-classic-geometry';
import {createSpiderShell,createWheelBrow,createGTWingMirrorHousing} from './hero-body';
import {createRoadWheel,wheelRoll} from './wheels';
import {TireEffects,type TireContact} from './tire-effects';
import type {RivalRace} from './rival-race';
import type {createTrack} from './track';
import {chaseTargets} from './chase';

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
/** Fixed-screen-size luminous road label, with its pointer anchored above the roof. */
/** Compact illuminated timing plaque, inspired by the game's graphite/amber HUD.
 * A sharp numbered racer tab replaces the former cartoon speech bubble. */
function badge(name:string,number:number){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=176;
 const c=canvas.getContext('2d')!;
 // Beveled, translucent graphite chassis with a narrow underbody pointer.
 c.shadowColor='rgba(2,9,16,.8)';c.shadowBlur=16;c.shadowOffsetY=5;
 c.beginPath();c.moveTo(26,15);c.lineTo(462,15);c.lineTo(492,45);
 c.lineTo(492,112);c.lineTo(282,112);c.lineTo(256,153);
 c.lineTo(231,112);c.lineTo(14,112);c.lineTo(14,30);c.closePath();
 const panel=c.createLinearGradient(0,15,0,130);
 panel.addColorStop(0,'rgba(23,41,52,.98)');panel.addColorStop(1,'rgba(8,22,33,.94)');
 c.fillStyle=panel;c.fill();
 c.shadowBlur=0;c.shadowOffsetY=0;
 c.strokeStyle='#f1cd91';c.lineWidth=3.5;c.stroke();
 // Fast orange race-line atop the enclosure, faint cyan edge at the base.
 c.fillStyle='#ffad58';c.fillRect(32,21,434,5);
 c.fillStyle='#4bbac7';c.fillRect(30,106,200,3);
 c.fillStyle='#ffb85e';
 c.beginPath();c.moveTo(242,114);c.lineTo(256,144);c.lineTo(270,114);c.closePath();c.fill();
 // Brushed-copper racer number cell, in the same tone as the game speedometer.
 const chip=c.createLinearGradient(32,35,112,100);
 chip.addColorStop(0,'#ffdb94');chip.addColorStop(1,'#ec824f');
 c.fillStyle=chip;c.fillRect(32,36,92,62);
 c.fillStyle='#15212a';c.textAlign='center';c.textBaseline='middle';
 c.font='italic 900 43px Arial,sans-serif';
 c.fillText(String(number).padStart(2,'0'),77,68);
 // Tiny English qualifier above the prominent Chinese driver's name.
 c.textAlign='left';
 c.fillStyle='#ffbe79';c.font='bold 18px Arial,sans-serif';c.fillText('RIVAL',144,45);
 c.fillStyle='#fff6e8';c.font='900 51px "PingFang TC","Microsoft JhengHei",sans-serif';
 c.fillText(name,143,82,326);
 // Short racing slashes end the plate without adding an opaque card.
 c.fillStyle='#ff9a5f';
 for(let i=0;i<3;i++){c.beginPath();const x=439+i*12;c.moveTo(x,66);c.lineTo(x+5,66);c.lineTo(x-2,83);c.lineTo(x-7,83);c.closePath();c.fill();}
 const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
 return new T.SpriteMaterial({map,transparent:true,depthWrite:false,depthTest:true,
  sizeAttenuation:false,toneMapped:false,fog:false});
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
  const label=new T.Sprite(badge(name,number));label.name='rival-name-tag';
  label.position.y=2.12;label.center.set(.5,0);root.add(label);
  return {root,tail,label,wheels};
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
      return {...car,near:false,effects:new TireEffects(scene,'smoke',smoke)};
    });
  }
  inspectEffects(){return this.cars.map(car=>car.effects.inspect());}
  inspectTags(){return this.cars.map((car,i)=>({
    name:this.race.rivals[i].entry.name,visible:car.root.visible&&car.label.visible,
    sizeAttenuation:(car.label.material as T.SpriteMaterial).sizeAttenuation,
    scale:car.label.scale.toArray(),
  }));}
  reset(){for(const car of this.cars)car.effects.clear();}
  dispose(){for(const car of this.cars){car.effects.dispose();const mat=car.label.material as T.SpriteMaterial;mat.map?.dispose();mat.dispose();}}
  update(focus:number,time:number,countdown:boolean,observed:number,ready:(d:number)=>boolean,camera:T.PerspectiveCamera,viewportHeight:number){
    const pixelUnit=2*Math.tan(T.MathUtils.degToRad(camera.fov)*.5)/Math.max(1,viewportHeight);
    const tagWidth=128*pixelUnit,tagHeight=44*pixelUnit;
    this.race.rivals.forEach((r,i)=>{
      const car=this.cars[i],root=car.root,dist=Math.abs(r.distance-focus);
      const visible=dist<720&&ready(r.distance)&&r.finishTime===null;
      if(!visible){if(root.visible)car.effects.clear(time);root.visible=false;return;}
      root.visible=true;
      const p=this.sample(r.distance);root.position.copy(p.position).addScaledVector(p.right,r.lateral);root.position.y+=.04;
      root.rotation.set(-Math.asin(p.tangent.y),-p.roadHeading-Math.atan2(r.lateralRate+r.impulse,Math.max(8,r.speed)),Math.atan(-p.right.y));
      // The Sprite material disables perspective size attenuation; off-screen tags
      // are naturally frustum-culled and road geometry may occlude them.
      car.label.visible=observed!==i&&r.distance>=focus-2;
      car.label.scale.set(tagWidth,tagHeight,1);
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
        car.effects.update(time,r.speed,r.slip,this.contacts,1,countdown?.62:r.speed<8&&r.finishTime===null?1-r.speed/8:0);
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
