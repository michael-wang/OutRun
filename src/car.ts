import * as THREE from 'three';
import {createRoadWheel} from './wheels';
import {createSpiderShell,createGTWingMirrorHousing,createRearTonneau} from './hero-body';
import {createDriverHair,createBlondeBob} from './hero-groom';
import {createOccupantMotion} from './occupants';
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
 * Static meshes are merged by material; only the small hair joints animate.
 */
export function createCar(dusk=false) {
  const car=new THREE.Group();car.name='coastal-roadster';
  const wheels:ReturnType<typeof createRoadWheel>[]=[];
  const travelers:{body:THREE.Group,head:THREE.Group,arms:THREE.Group[],locks:THREE.Group[],syncHair?:()=>void}[]=[];
  const material=(color:string,roughness=.5,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
  // One physical clearcoat body shader; all three body paints share it.
  const red=CAR_PAINT_PRESETS[DEFAULT_CAR_COLOR];
  const paint=new THREE.MeshPhysicalMaterial({color:red.hex,metalness:red.metalness,roughness:red.roughness,clearcoat:.82,clearcoatRoughness:.15});
  const paintShade=material('#8e1e27',.4,.35);
  const dark=material('#17212b',.72,.06),silver=material('#b9c4c8',.23,.8);
  const leather=material('#29323a',.81),seam=material('#46505b',.83);
  const glass=new THREE.MeshStandardMaterial({color:'#a6d7df',transparent:true,opacity:.32,roughness:.12,metalness:.15,side:THREE.DoubleSide,depthWrite:false});
  function mesh(g:THREE.BufferGeometry,m:THREE.Material,x=0,y=0,z=0,parent:THREE.Group=car){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
  const box=(w:number,h:number,d:number,m:THREE.Material,x:number,y:number,z:number)=>mesh(new THREE.BoxGeometry(w,h,d),m,x,y,z);
  function oval(sx:number,sy:number,sz:number,m:THREE.Material,x:number,y:number,z:number,parent=car){const o=mesh(new THREE.SphereGeometry(1,12,8),m,x,y,z,parent);o.scale.set(sx,sy,sz);return o;}
  function bar(a:number[],b:number[],r:number,m:THREE.Material,parent=car){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start),o=mesh(new THREE.CylinderGeometry(r,r,delta.length(),8),m,0,0,0,parent);o.position.copy(start.add(end).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return o;}
  // Smooth multi-section sculpted body, baked once and merged with paint.
  const shell=mesh(createSpiderShell(),paint);shell.name='sculpted-gt-spider-shell';
  // Dark cockpit void and recessed centre tunnel let the sunlight catch
  // the painted shoulders rather than a flat, boxlike cabin roof.
  box(1.57,.09,1.76,dark,0,.47,-.23);
  box(.15,.19,1.23,dark,0,.60,-.16);
  // Low painted rear tonneau hides the old exposed rectangular seatbacks
  // from the chase view. The seats and cockpit remain truly open from above;
  // this short body-height cowl is NOT a roof or a roll bar.
  const tonneau=mesh(createRearTonneau(),paint);
  tonneau.name='hero-rear-painted-cowl';
  box(.17,.03,.27,silver,0,.70,.01);
  // Sculpted hood creases and rear deck air channels are trim, not decals.
  for(const side of [-1,1]){
    bar([side*.59,.96,.72],[side*.52,.73,2.15],.014,paintShade);
    for(const x of [.24,.38])bar([side*x,.98,-1.87],[side*x,1.005,-1.37],.011,dark);
    // Soft rising haunch behind each seat: small geometry, big silhouette.
    oval(.21,.10,.65,paint,side*.85,.87,-1.62);
  }
  for(const side of [-1,1]){
    // One continuous silver beltline and restrained inset door panels.
    box(.065,.32,1.68,leather,side*.81,.73,-.23);
    bar([side*.95,.98,-1.07],[side*.95,.96,.58],.024,silver);
    bar([side*1.105,.52,-.96],[side*1.115,.89,-.93],.011,dark);
    bar([side*1.11,.89,-.93],[side*1.095,.90,.57],.011,dark);
    bar([side*1.095,.90,.57],[side*1.05,.53,.59],.011,dark);
    // Door handle integrated into the shoulder.
    box(.19,.025,.055,silver,side*1.108,.97,-.20);
    // Leather sports seats: contoured back, bolsters, headrest, twin piping.
    oval(.34,.12,.39,leather,side*.41,.64,-.34);
    const seat=box(.57,.37,.145,leather,side*.41,.79,-.87);seat.rotation.x=-.10;
    for(const inset of [-.265,.265])bar([side*.41+inset,.68,-.9],[side*.41+inset,1.09,-.88],.045,seam);
    oval(.185,.077,.088,leather,side*.41,1.025,-.91);
    for(const x of [-.17,.17])bar([side*.41+x,.71,-.975],[side*.41+x,1.07,-.925],.010,seam);
    // Low twin rollover hoops rather than a roof or visible rear window.
    for(const x of [-.22,.22])bar([side*.41+x,.92,-1.09],[side*.41+x,1.23,-1.09],.029,silver);
    bar([side*.41-.22,1.23,-1.09],[side*.41+.22,1.23,-1.09],.029,silver);
    // Low-profile sculpted wing mirror, rather than a round toy handle.
    bar([side*.97,.952,.51],[side*1.107,.987,.452],.010,dark);
    mesh(createGTWingMirrorHousing(),paint,side*1.121,.996,.426);
    // Two thin, camera-facing glass/rim discs instead of four dense
    // miniature spheres. The painted 3-D shell supplies the curved shape.
    const rim=mesh(new THREE.CircleGeometry(1,12),dark,side*1.121,.996,.352);
    rim.rotation.y=Math.PI;rim.scale.set(.092,.036,1);
    const pane=mesh(new THREE.CircleGeometry(1,12),silver,side*1.121,.997,.343);
    pane.rotation.y=Math.PI;pane.scale.set(.078,.028,1);
    for(const z of [-1.45,1.38]){
      // Subtle sculpted arch brow follows the wheel without a giant polygon.
      const brow=mesh(new THREE.TorusGeometry(.49,.05,6,20,Math.PI),paint,side*1.052,.46,z);
      brow.rotation.y=Math.PI/2;
      const wheel=createRoadWheel(side,z>0);
      wheel.pivot.position.set(side*1.055,.46,z);
      car.add(wheel.pivot);wheels.push(wheel);
    }
    // Side skirt and rear cooling slit bring the body closer to a GT spider.
    box(.09,.10,3.45,dark,side*1.025,.36,-.10);
    bar([side*1.085,.66,-1.96],[side*1.10,.65,-1.54],.024,paintShade);
  }
  box(1.46,.19,.27,dark,0,.85,.51); // dashboard
  box(.38,.035,.12,silver,.43,.95,.47); // instrument hood
  for(const x of [-.18,.12])oval(.09,.04,.03,dark,x,.91,.40);
  // Slim tinted screen and brushed aluminium perimeter.
  box(1.44,.075,.07,dark,0,.90,.71);
  // Transparent swept windscreen, no rear glazing or opaque cabin/roof.
  const screen=new THREE.BufferGeometry();screen.setAttribute('position',new THREE.Float32BufferAttribute([-.78,.9,.78,.78,.9,.78,-.68,1.43,.43,.68,1.43,.43],3));screen.setIndex([0,1,2,2,1,3]);screen.computeVertexNormals();mesh(screen,glass);
  for(const side of [-1,1])bar([side*.78,.9,.78],[side*.68,1.43,.43],.035,silver);
  bar([-.68,1.43,.43],[.68,1.43,.43],.03,silver);
  bar([-.78,.9,.78],[.78,.9,.78],.03,dark);
  const wheel=mesh(new THREE.TorusGeometry(.17,.026,8,20),dark,.41,1.025,.28);wheel.name='left-hand-drive-steering-wheel';wheel.rotation.x=-.45;
  bar([.41,.87,.48],[.41,1.015,.28],.030,silver);
  bar([.29,1.06,.28],[.51,1.03,.28],.015,silver);
  // +Z is the vehicle nose. In the rear chase view positive X appears
  // on SCREEN LEFT. This was the old bug: driver x<0 looked right-seated.
  // Driver +X, passenger -X, wheel +X. Consistent in gameplay and QA.
  for(const [side,name] of [[1,'driver'],[-1,'passenger']] as const){
    const driver=side===1,person=new THREE.Group();person.name=name;car.add(person);
    const x=side*.41;
    const head=new THREE.Group();head.name=name+'-head';person.add(head);
    const arms:THREE.Group[]=[],locks:THREE.Group[]=[];
    let syncHair:(()=>void)|undefined;
    const skin=material(driver?'#c89a7b':'#e3b79b',.82);
    const suit=material('#252d36',.74,.06);
    const lapel=material('#38414a',.80);
    const shirt=material(driver?'#e4e3dc':'#eee6de',.77);
    const hair=material(driver?'#22282d':'#b9904e',.7);
    // Narrow adult silhouette and shoulder line. Tailored jacket is built
    // from smooth conical cloth panels, not spherical Q-version torsos.
    const jacket=mesh(new THREE.CylinderGeometry(.245,.205,.51,14),driver?suit:shirt,
      x,1.02,-.49,person);jacket.scale.z=.84;
    oval(.262,.076,.14,driver?suit:shirt,x,1.205,-.49,person);
    oval(.125,.068,.125,skin,x,1.29,-.46,person);
    const neck=mesh(new THREE.CylinderGeometry(.079,.084,.155,12),skin,x,1.29,-.45,person);
    neck.rotation.x=.03;
    if(driver){
      // Contrasting collar and elongated rear seam read clearly on the
      // chase camera even though front lapels are mostly hidden.
      for(const offset of [-1,1]){
        const seamSide=offset*.115;
        bar([x+seamSide,1.235,-.486],[x+offset*.15,1.02,-.512],.014,lapel,person);
      }
      const rearSeam=bar([x,1.17,-.646],[x, .84,-.662],.008,lapel,person);
      rearSeam.name='tailored-jacket-back-seam';
      oval(.075,.055,.040,shirt,x,1.266,-.575,person);
    }else{
      // A light-coloured silk blouse with natural sloping shoulders.
      bar([x-.18,1.19,-.58],[x-.12,1.04,-.66],.012,shirt,person);
      bar([x+.18,1.19,-.58],[x+.12,1.04,-.66],.012,shirt,person);
    }
    // Adult-sized elongated skull with tapered jaw, rather than large ball
    // head and helmet hair. Realistic silhouette is more important than tiny
    // facial details at the driving camera distance.
    oval(.142,.179,.124,skin,x,1.477,-.455,head);
    oval(.111,.072,.105,skin,x,1.384,-.435,head);
    oval(.034,.040,.031,skin,x,1.438,-.329,head);
    for(const eye of [-1,1]){
      oval(.047,.022,.013,driver?lapel:hair,x+eye*.063,1.493,-.332,head);
    }
    if(driver){
      // Deep black, distinct layered strands rather than a continuous
      // half-sphere bowl haircut. The suit and plain collar are unchanged.
      const groom=createDriverHair();
      groom.position.set(x,1.525,-.464);head.add(groom);
    }else{
      const bob=createBlondeBob();bob.root.position.set(x,1.485,-.465);head.add(bob.root);
      locks.push(...bob.locks);syncHair=bob.sync;
    }
    // Natural shoulder/elbow joints without a full rig. Left (screen-left)
    // driver arm hangs over the near door, right arm holds the steering wheel.
    for(const arm of [-1,1] as const){
      const shoulder:[number,number,number]=[x+arm*.20,1.173,-.47];
      const resting=driver&&arm===1;
      const elbow:[number,number,number]=resting?[1.09,1.04,-.35]:
        driver?[.22,1.025,-.13]:[x+arm*.23,1.01,-.22];
      const hand:[number,number,number]=resting?[1.16,1.04,-.07]:
        driver?[.42,1.025,.255]:[x+arm*.12,.84,-.06];
      const limb=new THREE.Group();person.add(limb);
      limb.name=resting?'driver-left-arm-resting-on-door':driver?
        'driver-right-hand-steering':'passenger-arm-'+arm;
      arms.push(limb);
      const sleeve=driver?suit:shirt;
      bar(shoulder,elbow,.071,sleeve,limb);
      bar(elbow,hand,.042,skin,limb);
      oval(.051,.039,.056,skin,...hand,limb);
      if(resting){
        for(const offset of [-.027,0,.027])
          bar([hand[0]+offset,hand[1],hand[2]-.019],
           [hand[0]+offset,hand[1]-.026,hand[2]+.046],.008,skin,limb);
      }
      batch(limb);pivotAt(limb,...shoulder);
    }
    batch(head);pivotAt(head,x,1.30,-.46);
    batch(person);pivotAt(person,x,.80,-.48);
    // Passenger/driver were oversized against the GT body in the chase
    // camera. Scale around their seat centres, not the car or road physics.
    person.scale.setScalar(.84);
    travelers.push({body:person,head,arms,locks,syncHair});
  }
  // A sculpted tail, twin C-shaped LED signatures and dark diffuser
  // are readable at the normal chase distance (unlike single red cubes).
  box(1.80,.105,.15,dark,0,.32,-2.34);
  box(1.75,.12,.11,paintShade,0,.86,-2.31);
  box(1.78,.17,.105,dark,0,.37,-2.36);
  // Dark cherry lenses at idle. Brake is perceptible without blooming
  // across the rear view; no emissive intensity change per mesh.
  const rear=material('#781c22',.39);rear.emissive.set('#b83029');
  const tailIdle=dusk?.14:.035,tailBraking=1.0;let braking=false;
  rear.emissiveIntensity=tailIdle;
  const lamp=material('#fff2cf',.3);lamp.emissive.set('#fff3bf');lamp.emissiveIntensity=dusk?2.5:.6;
  for(const side of [-1,1]){
    // Rear LED hockey-stick, housed in black. Both sides use ONE shared
    // material, so the original brake-light controller still has one update.
    box(.57,.103,.050,dark,side*.54,.743,-2.345);
    box(.45,.034,.054,rear,side*.525,.752,-2.387);
    box(.049,.073,.055,rear,side*.785,.725,-2.387);
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
  for(let i=0;i<4;i++)box(.80,.023,.04,dark,0,.955-i*.012,-1.50-i*.115);
  box(1.70,.057,.13,paint,0,.96,-2.00);
  car.userData.licensePlate='FZR-123';
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
  const people=createOccupantMotion(travelers,wheel);
  car.userData.wheelPivots=wheels.map(w=>w.pivot);car.userData.motion={advance:(ds:number,steer:number,dt:number)=>{wheels.forEach(w=>w.advance(ds,steer,dt));people.advance(ds,steer,dt);},render:()=>wheels.forEach(w=>w.render()),reset:()=>{wheels.forEach(w=>w.reset());people.reset();},inspect:()=>wheels.map(w=>w.inspect()),occupants:()=>people.inspect()};
  return car;
}

function pivotAt(group:THREE.Group,x:number,y:number,z:number){const p=new THREE.Vector3(x,y,z);for(const child of group.children)child.position.sub(p);group.position.copy(p);}

/** Static material batches keep the more detailed cockpit cheap to draw. */
function batch(group:THREE.Group){
  const byMaterial=new Map<THREE.Material,THREE.BufferGeometry[]>();
  for(const child of [...group.children]){
    if(!(child instanceof THREE.Mesh)||Array.isArray(child.material)||child.material.transparent||child.name==='rear-license-FZR-123'||child.name==='left-hand-drive-steering-wheel')continue;
    child.updateMatrix();const g=child.geometry.index?child.geometry.toNonIndexed():child.geometry.clone();
    for(const name of Object.keys(g.attributes))if(name!=='position'&&name!=='normal')g.deleteAttribute(name);
    g.applyMatrix4(child.matrix);const list=byMaterial.get(child.material)??[];list.push(g);byMaterial.set(child.material,list);group.remove(child);child.geometry.dispose();
  }
  for(const [material,geometries] of byMaterial){const g=mergeGeometries(geometries);geometries.forEach(g=>g.dispose());if(!g)throw new Error('Car geometry batch failed');const mesh=new THREE.Mesh(g,material);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);}
}
