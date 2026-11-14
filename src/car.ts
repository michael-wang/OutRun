import {createPassengerFace,type PassengerDetail} from './passenger-face';
import {sectionMesh,jacketSections,shirtCollar,createSundress} from './hero-tailoring';
import * as THREE from 'three';
import {createRoadWheel} from './wheels';
import {createGTWingMirrorHousing,createDoorLiner,createWheelBrow} from './hero-body';
import {createRivieraBody,createRivieraTailLamps} from './hero-classic-geometry';
import {createDriverHair,createBlondeBob} from './hero-groom';
import type {CabinWindInput} from './cabin-wind';
import {createBlenderBlondeGroom} from './blonde-groom-asset';
import {createCockpitWheel,createDriverArms} from './hero-hands';
import {passengerArm} from './passenger-cheer';
import {createOccupantMotion,type Traveler} from './occupants';
import {CAR_PAINT_PRESETS,DEFAULT_CAR_COLOR,type CarColor} from './car-appearance';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export interface BrakeLightController {
  set(braking:boolean):void;
  reset():void;
  inspect():{braking:boolean;emissiveIntensity:number};
}
export interface CarPaintController {
 set(color:CarColor):void;
 inspect():{color:CarColor;hex:string};
}

/** Authored hero spider, +Z nose. Wheelbase, mass envelope and camera
 * anchor stay unchanged while the focal-point body/cockpit receive detail.
 * Static meshes are merged by material alongside the articulated occupants.
 */
export function createCar(dusk=false, passengerDetail:PassengerDetail='driving',previousLook=false) {
  const car=new THREE.Group();car.name='coastal-roadster';
  const wheels:ReturnType<typeof createRoadWheel>[]=[];
  const travelers:Traveler[]=[];
  const material=(color:string,roughness=.5,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
  // One physical clearcoat body shader; all three body paints share it.
  const red=CAR_PAINT_PRESETS[DEFAULT_CAR_COLOR];
  const paint=new THREE.MeshPhysicalMaterial({color:red.hex,metalness:red.metalness,roughness:red.roughness,clearcoat:.82,clearcoatRoughness:.15});
  const paintShade=material('#8e1e27',.4,.35);
  const dark=material('#17212b',.72,.06),silver=material('#b9c4c8',.23,.8);
  const leather=material('#29323a',.81),seatHide=material('#705549',.84);
  const glass=new THREE.MeshStandardMaterial({color:'#a6d7df',transparent:true,opacity:.32,roughness:.12,metalness:.15,side:THREE.DoubleSide,depthWrite:false});
  function mesh(g:THREE.BufferGeometry,m:THREE.Material,x=0,y=0,z=0,parent:THREE.Group=car){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
  const box=(w:number,h:number,d:number,m:THREE.Material,x:number,y:number,z:number)=>mesh(new THREE.BoxGeometry(w,h,d),m,x,y,z);
  function oval(sx:number,sy:number,sz:number,m:THREE.Material,x:number,y:number,z:number,parent=car){const o=mesh(new THREE.SphereGeometry(1,12,8),m,x,y,z,parent);o.scale.set(sx,sy,sz);return o;}
  function bar(a:number[],b:number[],r:number,m:THREE.Material,parent=car){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start),o=mesh(new THREE.CylinderGeometry(r,r,delta.length(),8),m,0,0,0,parent);o.position.copy(start.add(end).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return o;}
  // Only the accepted 1962 Riviera is built. No runtime model switching.
  const shell=mesh(createRivieraBody(),paint);
  shell.name='hero-classic-body-shell';
  // Keep Riviera's accepted rear vents and delicate spoiler as they were.
  const rivieraTrim=new THREE.Group();
  rivieraTrim.name='riviera-rear-trim';
  car.add(rivieraTrim);
  // Dark cockpit void and recessed centre tunnel let the sunlight catch
  // the painted shoulders rather than a flat, boxlike cabin roof.
  box(1.85,.09,1.76,dark,0,.47,-.23);
  box(.15,.19,1.23,dark,0,.60,-.16);
  // Riviera's approved low painted rear tonneau is fused into the shell.
  box(.17,.03,.27,silver,0,.70,.01);
  // Shallow air channels follow the painted rear deck.
  for(const side of [-1,1]){
    for(const x of [.24,.38])bar([side*x,.98,-1.87],[side*x,1.005,-1.37],.011,dark,rivieraTrim);
    // Soft rising haunch behind each seat: small geometry, big silhouette.
    oval(.21,.10,.65,paint,side*.85,.87,-1.62);
  }
  for(const side of [-1,1]){
    mesh(createDoorLiner(side),leather);
    // Flush handle along the exterior skin, aligned with the length of the door.
    box(.018,.027,.143,dark,side*1.065,.852,-.67);
    box(.022,.013,.112,silver,side*1.068,.858,-.67);
    // A low saddle-leather bucket rolls down behind the painted fairing.
    oval(.31,.10,.35,seatHide,side*.41,.64,-.34);
    mesh(sectionMesh([[.64,.25,.085,-.79],[.83,.26,.080,-.82],
      [.948,.223,.063,-.84],[.985,.144,.050,-.84],[.996,.073,.028,-.84]],14),seatHide,side*.41);
    // Low-profile sculpted wing mirror, rather than a round toy handle.
    bar([side*.97,.928,.51],[side*1.107,.987,.452],.010,dark);
    mesh(createGTWingMirrorHousing(),paint,side*1.121,.996,.426);
    // Two thin, camera-facing glass/rim discs instead of four dense
    // miniature spheres. The painted 3-D shell supplies the curved shape.
    const rim=mesh(new THREE.CircleGeometry(1,12),dark,side*1.121,.996,.352);
    rim.rotation.y=Math.PI;rim.scale.set(.092,.036,1);
    const pane=mesh(new THREE.CircleGeometry(1,12),silver,side*1.121,.997,.343);
    pane.rotation.y=Math.PI;pane.scale.set(.078,.028,1);
    for(const z of [-1.45,1.38]){
      mesh(createWheelBrow(side),paint,0,.46,z);
      const wheel=createRoadWheel(side,z>0);
      wheel.pivot.position.set(side*1.055,.46,z);
      car.add(wheel.pivot);wheels.push(wheel);
    }
    // Side skirt and rear cooling slit bring the body closer to a GT spider.
    box(.09,.10,3.45,dark,side*1.025,.36,-.10);
    bar([side*1.085,.66,-1.96],[side*1.10,.65,-1.54],.024,paintShade);
  }
  box(1.84,.19,.27,dark,0,.837,.53); // dashboard
  box(.38,.035,.12,silver,.43,.95,.47); // instrument hood
  for(const x of [-.18,.12]){
    const dial=mesh(new THREE.SphereGeometry(1,8,4),dark,x,.91,.40);
    dial.scale.set(.09,.04,.03);
  }
  // Slim tinted screen and brushed aluminium perimeter.
  box(1.44,.075,.07,dark,0,.90,.71);
  // Transparent swept windscreen, no rear glazing or opaque cabin/roof.
  const screen=new THREE.BufferGeometry();screen.setAttribute('position',new THREE.Float32BufferAttribute([-.78,.9,.78,.78,.9,.78,-.68,1.43,.43,.68,1.43,.43],3));screen.setIndex([0,1,2,2,1,3]);screen.computeVertexNormals();mesh(screen,glass);
  for(const side of [-1,1])bar([side*.78,.9,.78],[side*.68,1.43,.43],.035,silver);
  bar([-.68,1.43,.43],[.68,1.43,.43],.03,silver);
  bar([-.78,.9,.78],[.78,.9,.78],.03,dark);
  const wheel=createCockpitWheel();car.add(wheel);
  bar([.41,.93,.46],wheel.position.toArray(),.030,silver);
  // +Z is the vehicle nose. In the rear chase view positive X appears
  // on SCREEN LEFT. This was the old bug: driver x<0 looked right-seated.
  // Driver +X, passenger -X, wheel +X. Consistent in gameplay and QA.
  for(const [side,name] of [[1,'driver'],[-1,'passenger']] as const){
    const driver=side===1,person=new THREE.Group();person.name=name;car.add(person);
    const x=side*.41;
    const head=new THREE.Group();head.name=name+'-head';person.add(head);
    const arms:ReturnType<typeof passengerArm>[]=[];
    const skin=material(driver?'#c89a7b':'#f4d4c5',.82);
    const suit=material('#364758',.88);
    const lapel=material('#38414a',.80);
    const shirt=material(driver?'#e4e3dc':'#fffdf8',driver?.77:.87);
    let face:ReturnType<typeof createPassengerFace>|undefined;
    shirt.side=THREE.DoubleSide;
    if(driver){
      mesh(sectionMesh(jacketSections),suit,x,0,0,person);
      mesh(sectionMesh([[1.25,.077,.072,-.452],[1.302,.068,.066,-.45],
        [1.366,.068,.067,-.443]],12),skin,x,0,0,person);
      mesh(shirtCollar(),shirt,x,0,0,person);
    }else{
      mesh(createSundress(),shirt,x,0,0,person);
    }
    if(driver){
      mesh(sectionMesh([[1.323,.048,.055,-.425],[1.351,.094,.091,-.435],
        [1.399,.117,.110,-.444],[1.448,.137,.121,-.452],[1.49,.14,.122,-.455],
        [1.546,.126,.111,-.457],[1.601,.089,.078,-.458],[1.633,.032,.032,-.459]],18),skin,x,0,0,head);
      const nose=oval(.022,.031,.020,skin,x,1.45,-.332,head);
      nose.rotation.x=.24;
      for(const eye of [-1,1]){
        const ear=mesh(new THREE.SphereGeometry(1,8,5),skin,x+eye*.134,1.456,-.459,head);
        ear.scale.set(.021,.033,.019);
        const lens=oval(.043,.020,.008,lapel,x+eye*.058,1.49,-.344,head);
        lens.rotation.y=eye*.30;
        bar([x+eye*.094,1.49,-.353],[x+eye*.135,1.486,-.445],.004,lapel,head);
      }
      bar([x-.018,1.49,-.34],[x+.018,1.49,-.34],.004,lapel,head);
    }else{
      face=createPassengerFace(passengerDetail);face.position.set(x,1.465,-.455);
    }
    const groom=driver?createDriverHair():(createBlenderBlondeGroom(!previousLook)??createBlondeBob(passengerDetail));
    groom.root.position.set(x,driver?1.525:1.485,driver?-.464:-.465);head.add(groom.root);
    if(!driver)for(const side of [-1,1] as const){
      const arm=passengerArm(side,skin);arm.root.position.x+=x;
      person.add(arm.root);arms.push(arm);
    }
    batch(head);
    if(face)head.add(face); // Preserve the indexed face, vertex colours and expression morph.
    pivotAt(head,x,1.30,-.46);
    batch(person);pivotAt(person,x,.80,-.48);
    // R6 restores full character scale; the previous presentation is QA rollback.
    person.scale.setScalar(previousLook ? .84 : 1);
    if(!previousLook){
      // Full-size bodies sit 35mm into the cushion. The passenger's raised
      // outside arm needs 90mm inboard to clear the door liner through a lean.
      person.position.y-=.035;
      if(!driver)person.position.x+=.09;
    }
    travelers.push({body:person,head,arms,hair:groom,
      smile:face?value=>{face.morphTargetInfluences![0]=value;}:undefined,
      poseDriverArms:driver?createDriverArms(car,person,wheel,skin,suit):undefined});
  }
  // A sculpted tail, twin C-shaped LED signatures and dark diffuser
  // are readable at the normal chase distance (unlike single red cubes).
  box(1.80,.105,.15,dark,0,.32,-2.34);
  box(1.75,.12,.11,paintShade,0,.86,-2.31);
  box(1.78,.17,.105,dark,0,.37,-2.36);
  // Dark cherry lenses at idle. Brake is perceptible without blooming
  // across the rear view; no emissive intensity change per mesh.
  const rear=material('#781c22',.39);rear.side=THREE.DoubleSide;rear.emissive.set('#b83029');
  const tailIdle=dusk?.14:.035,tailBraking=1.0;let braking=false;
  rear.emissiveIntensity=tailIdle;
  const lamp=material('#fff2cf',.3);lamp.emissive.set('#fff3bf');lamp.emissiveIntensity=dusk?2.5:.6;
  // One draw for the era-specific rear lamps. The shared brake shader
  // keeps exactly the same idle/brake intensity across all three cars.
  const classicLamps=mesh(createRivieraTailLamps(),rear);
  classicLamps.name='hero-classic-tail-lamps';
  for(const side of [-1,1]){
    box(.58,.084,.062,lamp,side*.55,.58,2.32);
    // Twin exhaust finishers and low dark air outlets.
    const exhaust=mesh(new THREE.CylinderGeometry(.074,.074,.15,12),silver,side*.66,.30,-2.39);
    exhaust.rotation.x=Math.PI/2;
    box(.29,.055,.026,dark,side*.80,.43,-2.385);
  }
  // Functional rear number plate, not a blank beige square. Canvas is
  // generated only once per hero vehicle; it never updates per frame.
  box(.82,.258,.045,dark,0,.570,-2.406);
  box(.775,.217,.037,silver,0,.570,-2.436);
  const plateMaterial=new THREE.MeshBasicMaterial({color:'#ffffff',side:THREE.DoubleSide});
  if(typeof document!=='undefined'){
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=144;
    const ctx=canvas.getContext('2d');
    if(ctx){
      ctx.fillStyle='#f4f4ed';ctx.fillRect(0,0,512,144);
      ctx.strokeStyle='#273541';ctx.lineWidth=6;ctx.strokeRect(6,6,500,132);
      ctx.fillStyle='#132b3b';ctx.textBaseline='middle';ctx.textAlign='center';
      ctx.font='bold 94px Arial, Helvetica, sans-serif';ctx.fillText('FZR-123',256,78);
      const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
      texture.anisotropy=2;plateMaterial.map=texture;
    }
  }
  const numberPlate=mesh(new THREE.PlaneGeometry(.733,.190),plateMaterial,0,.570,-2.459);
  numberPlate.name='rear-license-FZR-123';numberPlate.rotation.y=Math.PI;
  // Top deck vents are shallow dark slits; no solid roof.
  for(let i=0;i<4;i++)
   mesh(new THREE.BoxGeometry(.80,.023,.04),dark,0,.955-i*.012,-1.50-i*.115,rivieraTrim);
  mesh(new THREE.BoxGeometry(1.70,.057,.13),paint,0,.96,-2.00,rivieraTrim);
  car.userData.licensePlate='FZR-123';
  batch(rivieraTrim); // Approved Riviera details, always displayed
  batch(car);
  // Both original tail lamps share one material after batching; change its uniform only.
  const brakeLights:BrakeLightController={
    set(active){if(active===braking)return;braking=active;rear.emissiveIntensity=active?tailBraking:tailIdle;},
    reset(){braking=false;rear.emissiveIntensity=tailIdle;},
    inspect:()=>({braking,emissiveIntensity:rear.emissiveIntensity}),
  };
  car.userData.brakeLights=brakeLights;
  let currentColor:CarColor=DEFAULT_CAR_COLOR;
  const paintController:CarPaintController={
    set(color){const swatch=CAR_PAINT_PRESETS[color];if(!swatch)return;
      currentColor=color;
      paint.color.set(swatch.hex);paint.metalness=swatch.metalness;paint.roughness=swatch.roughness;
      paintShade.color.set(swatch.hex).multiplyScalar(.50);
    },
    inspect:()=>({color:currentColor,hex:'#'+paint.color.getHexString()}),
  };
  paintController.set(DEFAULT_CAR_COLOR);
  car.userData.paintController=paintController;
  const people=createOccupantMotion(travelers);
  car.userData.wheelPivots=wheels.map(w=>w.pivot);
  car.userData.motion={
    advance:(ds:number,steer:number,dt:number,rightAcceleration=0,launchSlip=0,brakeSlip=0,air?:CabinWindInput)=>{
      wheels.forEach(w=>w.advance(ds,steer,dt,launchSlip,brakeSlip));
      return people.advance(ds,steer,dt,rightAcceleration,air);
    },
    posePassenger:people.posePassenger,onCleanPass:people.onCleanPass,onRivalPass:people.onRivalPass,render:()=>wheels.forEach(w=>w.render()),reset:()=>{wheels.forEach(w=>w.reset());people.reset();},inspect:()=>wheels.map(w=>w.inspect()),occupants:()=>people.inspect()
  };
  return car;
}

function pivotAt(group:THREE.Group,x:number,y:number,z:number){const p=new THREE.Vector3(x,y,z);for(const child of group.children)child.position.sub(p);group.position.copy(p);}

/** Static material batches keep the more detailed cockpit cheap to draw. */
function batch(group:THREE.Group){
  const byMaterial=new Map<THREE.Material,THREE.BufferGeometry[]>();
  for(const child of [...group.children]){
    if(!(child instanceof THREE.Mesh)||Array.isArray(child.material)||child.material.transparent||child.name==='rear-license-FZR-123'||child.name==='left-hand-drive-steering-wheel'||child.name==='hero-classic-body-shell'||child.name==='hero-classic-tail-lamps')continue;
    child.updateMatrix();const g=child.geometry.index?child.geometry.toNonIndexed():child.geometry.clone();
    for(const name of Object.keys(g.attributes))if(name!=='position'&&name!=='normal')g.deleteAttribute(name);
    g.applyMatrix4(child.matrix);const list=byMaterial.get(child.material)??[];list.push(g);byMaterial.set(child.material,list);group.remove(child);child.geometry.dispose();
  }
  for(const [material,geometries] of byMaterial){const g=mergeGeometries(geometries);geometries.forEach(g=>g.dispose());if(!g)throw new Error('Car geometry batch failed');const mesh=new THREE.Mesh(g,material);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);}
}
