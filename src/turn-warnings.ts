import * as THREE from 'three';
import type {createTrack} from './track';
import {roadOffset,type Shoulders} from './road-profile';
import type {SceneAnnotation} from './streamed-scene';
type Sample=ReturnType<typeof createTrack>['sample'];
export interface TurnWarning {offset?:number;distance:number;bendStart:number;bendEnd:number;direction:number;kind:'turn'|'hairpin'|'chevron'}
/** Sample the actual signed curvature, including compound challenge reversals. */
export function turnWarnings(sample:Sample,length:number):TurnWarning[]{
 const result:TurnWarning[]=[];let start=0,sign=0,peak=0,total=0;
 const flush=(end:number)=>{if(sign&&end-start>=65&&peak>.0018){const kind=total>1.8&&peak>.004?'hairpin':'turn';for(const lead of [280,140])if(start-lead>350)result.push({distance:start-lead,bendStart:start,bendEnd:end,direction:sign,kind});if(peak>.003)for(let d=start+30;d<end;d+=65)result.push({distance:d,bendStart:start,bendEnd:end,direction:sign,kind:'chevron'});}sign=0;peak=total=0;};
 for(let d=350;d<length;d+=10){const p=sample(d),k=p.curvature,next=Math.abs(k)>.00065?Math.sign(k):0;if(next!==sign){flush(d);start=d;sign=next;}peak=Math.max(peak,Math.abs(k));total+=Math.abs(k)*10;}flush(length);return result;
}
function material(kind:TurnWarning['kind'],direction:number){
 const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d')!;x.fillStyle='#ffce24';x.fillRect(0,0,256,256);x.strokeStyle='#151a1c';x.lineWidth=12;x.strokeRect(8,8,240,240);x.save();if(direction<0){x.translate(256,0);x.scale(-1,1);}x.strokeStyle=x.fillStyle='#151a1c';x.lineWidth=28;x.lineJoin='round';x.lineCap='square';x.beginPath();if(kind==='chevron'){x.moveTo(65,35);x.lineTo(160,128);x.lineTo(65,221);}else if(kind==='hairpin'){x.moveTo(68,214);x.lineTo(68,90);x.bezierCurveTo(68,24,180,24,180,90);x.lineTo(180,160);}else{x.moveTo(75,218);x.lineTo(75,110);x.lineTo(180,110);}x.stroke();if(kind!=='chevron'){x.beginPath();if(kind==='hairpin'){x.moveTo(142,142);x.lineTo(218,142);x.lineTo(180,202);}else{x.moveTo(160,65);x.lineTo(160,155);x.lineTo(214,110);}x.closePath();x.fill();}x.restore();const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;return new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide});
}
export function warningAnnotations(sample:Sample,halfAt:(d:number)=>number,warnings:TurnWarning[],shoulders?:(d:number)=>Shoulders):SceneAnnotation[]{
 const materials=new Map<string,THREE.Material>();const poleMaterial=new THREE.MeshStandardMaterial({color:'#777b78'});
 return warnings.map(w=>({distance:w.distance,create:()=>{const key=w.kind+w.direction;let m=materials.get(key);if(!m){m=material(w.kind,w.direction);materials.set(key,m);}const p=sample(w.distance),size=w.kind==='chevron'?2.8:4.2,side=-w.direction,base=p.position.clone().addScaledVector(p.right,w.offset===undefined?side*(halfAt(w.distance)+3.6):roadOffset(w.offset,halfAt(w.distance),shoulders?.(w.distance)));const board=new THREE.Mesh(new THREE.PlaneGeometry(size,size),m);board.name='turn-warning-'+w.kind;board.position.copy(base).add(new THREE.Vector3(0,3.4,0));board.rotation.set(0,Math.PI-p.roadHeading,Math.atan(p.right.y),'YXZ');const pole=new THREE.Mesh(new THREE.CylinderGeometry(.13,.13,3.4,6),poleMaterial);pole.position.copy(base).add(new THREE.Vector3(0,1.7,0));return [board,pole];}}));
}
/** r6 replaces one original extreme-corner event, at its original 300 m lead. */
export function originalTurnWarnings(course:readonly {start:number;end:number;targetRequiredSteering:number}[],sample:Sample):TurnWarning[]{return course.filter(c=>Math.abs(c.targetRequiredSteering)>1).map(c=>{let angle=0;for(let d=c.start;d<c.end;d+=10)angle+=Math.abs(sample(d).curvature)*Math.min(10,c.end-d);return {distance:Math.max(0,c.start-300),bendStart:c.start,bendEnd:c.end,direction:Math.sign(c.targetRequiredSteering),kind:angle>1.6?'hairpin':'turn',offset:15};});}
