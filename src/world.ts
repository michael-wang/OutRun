import {breakdownLayout,breakdownAnnotations} from './breakdowns';
import {turnWarnings,warningAnnotations} from './turn-warnings';
import type {BankStrength} from './banking';
import {roadOffset,LANE_WIDTH} from './road-profile';
import * as THREE from 'three';
import {asphaltTexture} from './asphalt-texture';
import { createCar } from './car';
import {ACTS,actWeights} from './acts';
import {addJourneyScenery} from './scenery';
import { createTrack } from './track';
import {COURSE} from './challenges';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {StreamedScene,type SceneAnnotation} from './streamed-scene';
import type {PilotCandidate} from './pilot-composer';

export function createWorld(options:{track?:ReturnType<typeof createTrack>;theme?:number;seed?:number;roadWidth?:number;halfAt?:(d:number)=>number;narrowings?:number[];course?:typeof COURSE;notice?:{distance:number;text:string};weightsAt?:(d:number)=>number[];chunked?:boolean;streamStage?:PilotCandidate;bank?:BankStrength}={}) {
  const course=options.course??COURSE,half=(options.roadWidth??14)/2,halfAt=options.halfAt??(()=>half),offsetAt=(d:number,o:number)=>roadOffset(o,halfAt(d));
  const weightsAt=(d:number)=>options.weightsAt?options.weightsAt(d):options.theme===undefined?actWeights(d):[0,1,2].map(i=>i===options.theme?1:0);
  const scene=new THREE.Scene(); scene.background=new THREE.Color('#9bd8ea'); scene.fog=new THREE.Fog('#b7dce5',180,1100);
  scene.add(new THREE.HemisphereLight('#e3f7ff','#a09162',1.65));
  const sun=new THREE.DirectionalLight('#fff0c9',2.8); sun.position.set(-180,280,-100); scene.add(sun);
  sun.castShadow=true; const shadowSize=matchMedia('(pointer:coarse)').matches?512:1024; sun.shadow.mapSize.set(shadowSize,shadowSize); Object.assign(sun.shadow.camera,{left:-36,right:36,top:36,bottom:-36,near:1,far:250});
  sun.shadow.bias=-.0004; sun.shadow.normalBias=.035; scene.add(sun.target);
  const {sample,length}=options.track??createTrack();
  const mat=(color:string,roughness=1)=>new THREE.MeshStandardMaterial({color,roughness});
  const asphalt=mat('#4c5657'), sand=mat('#ffffff'), grass=mat('#ffffff'), line=mat('#fff5ce'), rail=mat('#d8d8bf');
  function ribbon(offsetA:number|((d:number)=>number),offsetB:number|((d:number)=>number),liftA:number,liftB:number,material:THREE.Material,start=0,end=length,step=2.5) {
    // Finite stage ribbons share a parent but retain independently culled pieces.
    if(options.chunked&&end-start>1200){
      const empty=new THREE.BufferGeometry();empty.setAttribute('position',new THREE.Float32BufferAttribute([],3));
      const parent=new THREE.Mesh(empty,material);parent.name=material===asphalt?'driving-surface':material===grass?'terrain':material===sand?'shoulder':'road-detail';
      for(let a=start;a<end;a+=1200){const piece=ribbon(offsetA,offsetB,liftA,liftB,material,a,Math.min(a+1200,end),step);scene.remove(piece);parent.add(piece);}
      scene.add(parent);return parent;
    }
    const pos:number[]=[],uv:number[]=[],idx:number[]=[],colors:number[]=[]; const n=Math.ceil((end-start)/step);
    for(let i=0;i<=n;i++) { const d=start+(end-start)*i/n,p=sample(d); for(const [raw,h] of [[offsetA,liftA],[offsetB,liftB]] as [number|((d:number)=>number),number][]) {const o=typeof raw==='number'?raw:raw(d),offset=offsetAt(d,o);const v=p.position.clone().addScaledVector(p.right,offset); const weights=weightsAt(d),coastal=o<=-27?(h<-10?-4.88:-5.05):v.y+h;const height=o<=-27?THREE.MathUtils.lerp(coastal,v.y-2-Math.abs(o)*.015,weights[1]):v.y+h;pos.push(v.x,height,v.z);uv.push(o/4,d/4);if(material===sand||material===grass){const color=new THREE.Color(0,0,0);weights.forEach((w,i)=>color.add(new THREE.Color(material===sand?ACTS[i].shoulder:ACTS[i].ground).multiplyScalar(w)));colors.push(color.r,color.g,color.b);}} }
    for(let i=0;i<n;i++){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}
    const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); geo.setIndex(idx);if(colors.length){geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));(material as THREE.MeshStandardMaterial).vertexColors=true;} geo.computeVertexNormals();
    const mesh=new THREE.Mesh(geo,material);mesh.name=material===asphalt?'driving-surface':material===grass?'terrain':material===sand?'shoulder':'road-detail'; mesh.receiveShadow=true; scene.add(mesh); return mesh;
  }
  asphalt.map=asphaltTexture();
  const supportMaterial=new THREE.MeshStandardMaterial({color:'#c8aa7d',roughness:1,side:THREE.DoubleSide});
  const edgeMaterials=[line,mat('#b64b35')],surfMaterial=new THREE.MeshBasicMaterial({color:'#b8e2da',transparent:true,opacity:.72});
  const dummy=new THREE.Object3D();
  function instances(geo:THREE.BufferGeometry,material:THREE.Material,poses:{p:THREE.Vector3;s?:THREE.Vector3;r?:THREE.Euler}[]) {
    const mesh=new THREE.InstancedMesh(geo,material,poses.length);mesh.castShadow=true;mesh.receiveShadow=true;
    poses.forEach((v,i)=>{dummy.position.copy(v.p);dummy.scale.copy(v.s??new THREE.Vector3(1,1,1));dummy.rotation.copy(v.r??new THREE.Euler());dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);}); scene.add(mesh); return mesh;
  }
  if(!options.streamStage){
  ribbon(-160,-27,-9,-9,sand,0,length,10);ribbon(-27,-13,-9,-.1,sand,0,length,10); ribbon(-13,13,-.1,-.1,sand);
  ribbon(13,75,-.12,-3,grass,0,length,10); ribbon(75,160,-3,-14,grass,0,length,10);
  // Chunked, road-following embankment faces conceal exposed undersides on
  // elevated sections. They start outside the shoulder, below the driving plane.
  const supports=new THREE.Group();supports.name='road-support';scene.add(supports);
  for(let start=0;start<length;start+=1200){const end=Math.min(length,start+1200),n=Math.ceil((end-start)/2.5),positions:number[]=[],indices:number[]=[];
    for(let i=0;i<=n;i++){const d=start+(end-start)*i/n,p=sample(d);for(const side of [-1,1]){const point=p.position.clone().addScaledVector(p.right,offsetAt(d,side*13));positions.push(point.x,point.y-.1,point.z,point.x,Math.min(point.y-4,-5),point.z);}}
    for(let i=0;i<n;i++)for(let side=0;side<2;side++){const a=i*4+side*2,b=a+4;indices.push(a,a+1,b,a+1,b+1,b);}
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();const mesh=new THREE.Mesh(geometry,supportMaterial);mesh.receiveShadow=true;supports.add(mesh);
  }
  ribbon(-7,7,0,0,asphalt).name='driving-surface'; ribbon(d=>-7+.35*7/halfAt(d),d=>-7+.51*7/halfAt(d),.025,.025,line); ribbon(d=>7-.51*7/halfAt(d),d=>7-.35*7/halfAt(d),.025,.025,line);
  const dashes:THREE.BufferGeometry[]=[];
  // Lab uses true 3.5-unit lanes; free drive retains its original markings.
  for(let d=0;d<length;d+=6)for(const lane of options.halfAt?[-3,-2,-1,0,1,2,3].map(n=>n*LANE_WIDTH):[-7/3,7/3]){if(options.halfAt&&Math.abs(lane)+.5>=Math.min(halfAt(d),halfAt(Math.min(d+3,length))))continue;const at=(delta:number)=>(s:number)=>options.halfAt?(lane+delta)*7/halfAt(s):lane+delta;const dash=ribbon(at(-.14),at(.14),.03,.03,line,d,Math.min(d+3,length),1.5);scene.remove(dash);dashes.push(dash.geometry);}
  const markings=new THREE.Mesh(mergeGeometries(dashes)!,line);markings.name='lane-markings';markings.receiveShadow=true;scene.add(markings);dashes.forEach(g=>g.dispose());
  ribbon(-12.5,-12.3,.65,.65,rail); ribbon(-12.5,-12.3,1.12,1.12,rail);
  // Flush, high-contrast edge bands stay readable as they sweep past the car.
  // Static world geometry, not a scrolling overlay or a speed-driven texture.
  for(let color=0;color<2;color++){
    const pieces:THREE.BufferGeometry[]=[];
    for(let d=color*3;d<length;d+=6)for(const side of [-1,1]){
      const offsets=side<0?[-7-.7,-7-.02]:[7+.02,7+.7];
      const piece=ribbon(offsets[0],offsets[1],-.065,-.065,edgeMaterials[color],d,Math.min(d+3,length),1.5);
      scene.remove(piece);pieces.push(piece.geometry);
    }
    const band=new THREE.Mesh(mergeGeometries(pieces)!,edgeMaterials[color]);band.receiveShadow=true;scene.add(band);pieces.forEach(g=>g.dispose());
  }
  // Efficient instances keep close roadside objects plentiful on mobile.
  const posts=[];for(let d=0;d<length;d+=12){const p=sample(d);posts.push({p:p.position.addScaledVector(p.right,offsetAt(d,-12.4)).add(new THREE.Vector3(0,.58,0))});}
  instances(new THREE.BoxGeometry(.15,1.2,.15),rail,posts);
  // Reproducible near-field references: 12m cadence matches the center dashes.
  // Outside the complete corridor footprint; instancing adds only four draws.
  const markerPosts=[],markerCaps=[],markerStripes=[];
  for(let d=0;d<length;d+=12)for(const side of [-1,1]){
    const p=sample(d),yaw=Math.atan2(p.tangent.x,p.tangent.z);
    const base=p.position.clone().addScaledVector(p.right,offsetAt(d,side*12.4));
    markerPosts.push({p:base.clone().add(new THREE.Vector3(0,.8,0)),r:new THREE.Euler(0,yaw,0)});
    markerCaps.push({p:base.clone().add(new THREE.Vector3(0,1.45,0)),r:new THREE.Euler(0,yaw,0)});
    markerStripes.push({p:base.clone().add(new THREE.Vector3(0,1.05,0)),r:new THREE.Euler(0,yaw,0)});
  }
  instances(new THREE.BoxGeometry(.38,1.6,.3),line,markerPosts);
  instances(new THREE.BoxGeometry(.42,.3,.34),mat('#f5a53c'),markerCaps);
  instances(new THREE.BoxGeometry(.4,.35,.32),mat('#263d43'),markerStripes);
  }
  // Authored braking cue, outside the entire shoulder corridor. Original canvas
  // lettering, no external art; warns before the >100% reference-demand bend.
  const signCanvas=document.createElement('canvas');signCanvas.width=512;signCanvas.height=256;
  const ink=signCanvas.getContext('2d')!;ink.fillStyle='#153e45';ink.fillRect(0,0,512,256);
  ink.strokeStyle='#ffd18b';ink.lineWidth=14;ink.strokeRect(8,8,496,240);
  ink.textAlign='center';ink.fillStyle='#fff4d9';ink.font='bold 70px sans-serif';ink.fillText('BRAKE  →',256,96);
  ink.fillStyle='#ffd18b';ink.font='bold 104px sans-serif';ink.fillText(options.track?'180':'190',218,210);ink.font='26px sans-serif';ink.fillText('km/h',374,206);
  const signTexture=new THREE.CanvasTexture(signCanvas);signTexture.colorSpace=THREE.SRGBColorSpace;
  const signMaterial=new THREE.MeshBasicMaterial({map:signTexture,side:THREE.DoubleSide});
  const leftCanvas=signCanvas.cloneNode() as HTMLCanvasElement;const leftInk=leftCanvas.getContext('2d')!;leftInk.drawImage(signCanvas,0,0);leftInk.fillStyle='#153e45';leftInk.fillRect(20,20,472,88);leftInk.fillStyle='#fff4d9';leftInk.textAlign='center';leftInk.font='bold 70px sans-serif';leftInk.fillText('← BRAKE',256,96);const leftTexture=new THREE.CanvasTexture(leftCanvas);leftTexture.colorSpace=THREE.SRGBColorSpace;const leftSign=new THREE.MeshBasicMaterial({map:leftTexture,side:THREE.DoubleSide});
  const breakdowns=options.streamStage?.generatorVersion==='v0.9-r5'?breakdownLayout(sample,halfAt,length,options.seed??1):[];
  const annotations:SceneAnnotation[]=breakdownAnnotations(sample,halfAt,breakdowns);
  if(!options.streamStage){
  for(const extreme of course.filter(c=>Math.abs(c.targetRequiredSteering)>1))for(const lead of options.track?[300,160]:[160,80]){
    const p=sample(extreme.start-lead),base=p.position.clone().addScaledVector(p.right,offsetAt(extreme.start-lead,15));
    const board=new THREE.Mesh(new THREE.PlaneGeometry(5.2,2.6),extreme.targetRequiredSteering<0?leftSign:signMaterial);board.position.copy(base).add(new THREE.Vector3(0,4,0));board.rotation.y=Math.PI-p.roadHeading;scene.add(board);
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,4,6),rail);pole.position.copy(base).add(new THREE.Vector3(0,2,0));scene.add(pole);
  }
  for(const id of ['medium','high']){
    const c=course.find(c=>c.id===id);if(!c)continue;const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;
    const ink=canvas.getContext('2d')!;ink.fillStyle='#153e45';ink.fillRect(0,0,512,256);ink.strokeStyle='#9de2d5';ink.lineWidth=12;ink.strokeRect(8,8,496,240);ink.fillStyle='#fff4d9';ink.textAlign='center';ink.font='bold 52px sans-serif';ink.fillText('FAST SWEEP',256,80);ink.font='bold 122px sans-serif';ink.fillText(c.turnDirection==='left'?'←':'→',256,210);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const material=new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide});
    for(const half of [0]){const p=sample(half+c.start-80),base=p.position.clone().addScaledVector(p.right,15);const board=new THREE.Mesh(new THREE.PlaneGeometry(5.2,2.6),material);board.position.copy(base).add(new THREE.Vector3(0,4,0));board.rotation.y=Math.PI-p.roadHeading;scene.add(board);const pole=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,4,6),rail);pole.position.copy(base).add(new THREE.Vector3(0,2,0));scene.add(pole);}
  }
  for(const distance of options.narrowings??[]){
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;const ctx=canvas.getContext('2d');if(!ctx)continue;ctx.fillStyle='#153e45';ctx.fillRect(0,0,512,256);ctx.strokeStyle='#ffd18b';ctx.lineWidth=12;ctx.strokeRect(8,8,496,240);ctx.fillStyle='#fff4d9';ctx.textAlign='center';ctx.font='bold 56px sans-serif';ctx.fillText('ROAD NARROWS',256,95);ctx.font='bold 45px sans-serif';ctx.fillText('MOVE TOWARD CENTER',256,185);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const p=sample(distance),board=new THREE.Mesh(new THREE.PlaneGeometry(6,3),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide}));board.position.copy(p.position).addScaledVector(p.right,offsetAt(distance,15)).add(new THREE.Vector3(0,4,0));board.rotation.y=Math.PI-p.roadHeading;board.name='narrowing-warning';scene.add(board);const pole=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,4,6),rail);pole.position.copy(board.position).add(new THREE.Vector3(0,-2,0));scene.add(pole);
  }
  if(options.notice){
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;const ink=canvas.getContext('2d')!;
    ink.fillStyle='#153e45';ink.fillRect(0,0,512,256);ink.strokeStyle='#ffd18b';ink.lineWidth=12;ink.strokeRect(8,8,496,240);ink.fillStyle='#fff4d9';ink.textAlign='center';ink.font='bold 58px sans-serif';ink.fillText('CREST AHEAD',256,95);ink.font='bold 48px sans-serif';ink.fillText(options.notice.text,256,190);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const p=sample(options.notice.distance),base=p.position.clone().addScaledVector(p.right,offsetAt(options.notice.distance,15)),board=new THREE.Mesh(new THREE.PlaneGeometry(6,3),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide}));board.name='crest-warning';board.position.copy(base).add(new THREE.Vector3(0,4,0));board.rotation.y=Math.PI-p.roadHeading;scene.add(board);
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,4,6),rail);pole.position.copy(base).add(new THREE.Vector3(0,2,0));scene.add(pole);
  }
  }else{
    // Stage signs are recipes until their own road chunk is materialized.
    const signAt=(distance:number,material:THREE.Material,width:number,height:number,name=''):SceneAnnotation=>({distance:Math.max(0,Math.min(length-1e-6,distance)),create:()=>{const p=sample(distance),base=p.position.clone().addScaledVector(p.right,offsetAt(distance,15)),board=new THREE.Mesh(new THREE.PlaneGeometry(width,height),material);board.name=name;board.position.copy(base).add(new THREE.Vector3(0,4,0));board.rotation.y=Math.PI-p.roadHeading;const pole=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,4,6),rail);pole.position.copy(base).add(new THREE.Vector3(0,2,0));return [board,pole];}});
    if(options.streamStage.generatorVersion==='v0.9-r5')annotations.push(...warningAnnotations(sample,halfAt,turnWarnings(sample,length)));
    else for(const extreme of course.filter(c=>Math.abs(c.targetRequiredSteering)>1))for(const lead of [300,160])annotations.push(signAt(extreme.start-lead,extreme.targetRequiredSteering<0?leftSign:signMaterial,5.2,2.6));
    if(options.narrowings?.length){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#153e45';ctx.fillRect(0,0,512,256);ctx.strokeStyle='#ffd18b';ctx.lineWidth=12;ctx.strokeRect(8,8,496,240);ctx.fillStyle='#fff4d9';ctx.textAlign='center';ctx.font='bold 56px sans-serif';ctx.fillText('ROAD NARROWS',256,95);ctx.font='bold 45px sans-serif';ctx.fillText('MOVE TOWARD CENTER',256,185);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const material=new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide});for(const d of options.narrowings)annotations.push(signAt(d,material,6,3,'narrowing-warning'));}
  }
  const sea=new THREE.Mesh(new THREE.PlaneGeometry(18000,18000),new THREE.MeshStandardMaterial({color:'#087eaa',metalness:.22,roughness:.42}));sea.rotation.x=-Math.PI/2;sea.position.y=-5;scene.add(sea);
  // Thin pale surf lines make the shore readable without textures or external assets.
  if(!options.streamStage)ribbon(-29,-27,-10.9,-10.9,surfMaterial,0,length,10);
  const rand=(i:number)=>{const x=Math.sin(i*127.1+43.7)*43758.5453;return x-Math.floor(x);};
  sand.vertexColors=true;grass.vertexColors=true;
  const streamer=options.streamStage?new StreamedScene(scene,options.streamStage,length,{asphalt,sand,grass,line,rail,support:supportMaterial,'edge-white':edgeMaterials[0],'edge-red':edgeMaterials[1],surf:surfMaterial},annotations,options.bank):undefined;
  const scenery=streamer?{get instances(){return streamer.sceneryStats.instances;},get draws(){return streamer.sceneryStats.draws;}}:addJourneyScenery(scene,sample,length,options.theme,options.seed,halfAt,options.weightsAt);
  // A connected, low distant ridge instead of isolated giant boulders on the horizon.
  // Enclose the actual route. The former fixed (400,500)/1550m ring intersected
  // v0.4's longer loop and covered asphalt with an opaque mountain surface.
  const trackBounds=new THREE.Box3();
  for(let d=0;d<length;d+=10)trackBounds.expandByPoint(sample(d).position);
  const ridgeCenter=trackBounds.getCenter(new THREE.Vector3());
  let ridgeRadius=0;
  for(let d=0;d<length;d+=10){const p=sample(d).position;ridgeRadius=Math.max(ridgeRadius,Math.hypot(p.x-ridgeCenter.x,p.z-ridgeCenter.z));}
  ridgeRadius+=400; // includes road, shoulders, inland mesh and sampling margin
  const ridge:number[]=[],ridgeIndex:number[]=[],ridgeColors:number[]=[];
  const ridgeColor=new THREE.Color();
  for(let i=0;i<=192;i++){const angle=i/192*Math.PI*2;const crest=65+35*Math.sin(angle*7)+28*Math.sin(angle*13+.7)+15*Math.cos(angle*23);
    for(let j=0;j<4;j++){const radius=ridgeRadius+j*230;const height=j===0?-7:j===1?crest:j===2?crest*.65:-10;ridge.push(ridgeCenter.x+Math.cos(angle)*radius,height,ridgeCenter.z+Math.sin(angle)*radius);ridgeColor.set(j===1?'#81a8ac':j===0?'#9fc4c6':'#92b7bb');ridgeColors.push(ridgeColor.r,ridgeColor.g,ridgeColor.b);}
    if(i<192)for(let j=0;j<3;j++){const a=i*4+j;ridgeIndex.push(a,a+1,a+4,a+1,a+5,a+4);}}
  const ridgeGeo=new THREE.BufferGeometry();ridgeGeo.setAttribute('position',new THREE.Float32BufferAttribute(ridge,3));ridgeGeo.setAttribute('color',new THREE.Float32BufferAttribute(ridgeColors,3));ridgeGeo.setIndex(ridgeIndex);ridgeGeo.computeVertexNormals();
  const distantRidge=new THREE.Mesh(ridgeGeo,new THREE.MeshBasicMaterial({vertexColors:true,fog:false,side:THREE.DoubleSide}));distantRidge.name='distant-ridge';scene.add(distantRidge);
  const clouds=[];for(let i=0;i<24;i++){const angle=i*2.4;for(let j=0;j<4;j++)clouds.push({p:new THREE.Vector3(400+Math.cos(angle)*1700+j*50,280+rand(i)*170,500+Math.sin(angle)*1700),s:new THREE.Vector3(70,18+rand(j+i)*15,35),r:new THREE.Euler()});}
  instances(new THREE.SphereGeometry(1,10,6),new THREE.MeshBasicMaterial({color:'#f5f7e9',fog:false}),clouds);
  const car=createCar();scene.add(car);
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=64;const context=shadowCanvas.getContext('2d')!;
  const gradient=context.createRadialGradient(32,32,7,32,32,31);gradient.addColorStop(0,'rgba(18,33,30,.65)');gradient.addColorStop(.55,'rgba(18,33,30,.3)');gradient.addColorStop(1,'rgba(18,33,30,0)');context.fillStyle=gradient;context.fillRect(0,0,64,64);
  const shadow=new THREE.Mesh(new THREE.PlaneGeometry(3.1,5.6),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.025;car.add(shadow);
  const skyColors=ACTS.map(a=>new THREE.Color(a.sky)),fogColors=ACTS.map(a=>new THREE.Color(a.fog));
  return {breakdowns,scene,sample,length,car,scenery,streamer,half,halfAt,weightsAt,update:(_time:number,_speed:number,_slip:number,distance=0)=>{streamer?.update(distance);streamer?.pump();const weights=weightsAt(distance);(scene.background as THREE.Color).setRGB(0,0,0);scene.fog!.color.setRGB(0,0,0);for(let i=0;i<3;i++){(scene.background as THREE.Color).r+=skyColors[i].r*weights[i];(scene.background as THREE.Color).g+=skyColors[i].g*weights[i];(scene.background as THREE.Color).b+=skyColors[i].b*weights[i];scene.fog!.color.r+=fogColors[i].r*weights[i];scene.fog!.color.g+=fogColors[i].g*weights[i];scene.fog!.color.b+=fogColors[i].b*weights[i];}sun.target.position.copy(car.position);sun.position.copy(car.position).add(new THREE.Vector3(-60,95,-45));}};
}
