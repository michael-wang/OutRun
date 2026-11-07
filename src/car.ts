import * as THREE from 'three';
import {createRoadWheel} from './wheels';
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
  const travelers:{body:THREE.Group,head:THREE.Group,arms:THREE.Group[],locks:THREE.Group[]}[]=[];
  const material=(color:string,roughness=.5,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
  // One physical clearcoat body shader; all three body paints share it.
  const red=CAR_PAINT_PRESETS[DEFAULT_CAR_COLOR];
  const paint=new THREE.MeshPhysicalMaterial({color:red.hex,metalness:red.metalness,roughness:red.roughness,clearcoat:.82,clearcoatRoughness:.15});
  const paintShade=material('#8e1e27',.4,.35);
  const dark=material('#17212b',.72,.06),silver=material('#b9c4c8',.23,.8);
  const leather=material('#a87c60',.77),seam=material('#654d40',.82);
  const glass=new THREE.MeshStandardMaterial({color:'#a6d7df',transparent:true,opacity:.32,roughness:.12,metalness:.15,side:THREE.DoubleSide,depthWrite:false});
  function mesh(g:THREE.BufferGeometry,m:THREE.Material,x=0,y=0,z=0,parent:THREE.Group=car){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
  const box=(w:number,h:number,d:number,m:THREE.Material,x:number,y:number,z:number)=>mesh(new THREE.BoxGeometry(w,h,d),m,x,y,z);
  function oval(sx:number,sy:number,sz:number,m:THREE.Material,x:number,y:number,z:number,parent=car){const o=mesh(new THREE.SphereGeometry(1,12,8),m,x,y,z,parent);o.scale.set(sx,sy,sz);return o;}
  function bar(a:number[],b:number[],r:number,m:THREE.Material,parent=car){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start),o=mesh(new THREE.CylinderGeometry(r,r,delta.length(),8),m,0,0,0,parent);o.position.copy(start.add(end).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return o;}
  // Continuous shoulder/body surfaces, with an actual aperture between the rear deck and dash.
  // A tighter boat-tailed rear, muscular rear quarters and sloping nose.
  // Only the bridge BETWEEN -1.10 and +0.65 lacks a top panel: true roofless cockpit.
  const stations=[[-2.34,.84,.78],[-2.20,1.0,.88],[-1.95,1.09,.96],[-1.38,1.13,1.00],[-1.10,1.12,.99],[.65,1.10,.96],[1.18,1.07,.91],[1.88,.93,.77],[2.34,.72,.66]];
  const verts:number[]=[],indices:number[]=[];
  for(const [z,w,h] of stations)for(const [x,y] of [[-w*.79,.32],[-w,.46],[-w,h*.83],[-w*.72,h],[w*.72,h],[w,h*.83],[w,.46],[w*.79,.32]])verts.push(x,y,z);
  for(let s=0;s<stations.length-1;s++)for(let j=0;j<8;j++){if(s===4&&j===3)continue;const a=s*8+j,b=s*8+(j+1)%8,c=b+8,d=a+8;indices.push(a,c,b,a,d,c);}
  for(let j=1;j<7;j++){indices.push(0,j,j+1);const a=(stations.length-1)*8;indices.push(a,a+j+1,a+j);}
  const body=new THREE.BufferGeometry();body.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));body.setIndex(indices);body.computeVertexNormals();
  const shell=mesh(body,paint);shell.name='sculpted-gt-spider-shell';
  // Dark cockpit void and recessed centre tunnel let the sunlight catch
  // the painted shoulders rather than a flat, boxlike cabin roof.
  box(1.57,.09,1.76,dark,0,.47,-.23);
  box(.15,.19,1.23,dark,0,.60,-.16);
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
    const seat=box(.61,.54,.18,leather,side*.41,.87,-.87);seat.rotation.x=-.10;
    for(const inset of [-.265,.265])bar([side*.41+inset,.68,-.9],[side*.41+inset,1.09,-.88],.045,seam);
    oval(.22,.135,.115,leather,side*.41,1.18,-.91);
    for(const x of [-.17,.17])bar([side*.41+x,.71,-.975],[side*.41+x,1.07,-.925],.010,seam);
    // Low twin rollover hoops rather than a roof or visible rear window.
    for(const x of [-.22,.22])bar([side*.41+x,.92,-1.09],[side*.41+x,1.23,-1.09],.029,silver);
    bar([side*.41-.22,1.23,-1.09],[side*.41+.22,1.23,-1.09],.029,silver);
    // Sleek, painted mirror housings with real reflective backs.
    oval(.165,.085,.145,paint,side*1.17,1.015,.44);
    box(.15,.065,.022,silver,side*1.18,1.02,.295);
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
  box(.38,.035,.12,silver,-.43,.95,.47); // instrument hood
  for(const x of [-.18,.12])oval(.09,.04,.03,dark,x,.91,.40);
  // Slim tinted screen and brushed aluminium perimeter.
  box(1.44,.075,.07,dark,0,.90,.71);
  // Transparent swept windscreen, no rear glazing or opaque cabin/roof.
  const screen=new THREE.BufferGeometry();screen.setAttribute('position',new THREE.Float32BufferAttribute([-.78,.9,.78,.78,.9,.78,-.68,1.43,.43,.68,1.43,.43],3));screen.setIndex([0,1,2,2,1,3]);screen.computeVertexNormals();mesh(screen,glass);
  for(const side of [-1,1])bar([side*.78,.9,.78],[side*.68,1.43,.43],.035,silver);
  bar([-.68,1.43,.43],[.68,1.43,.43],.03,silver);
  bar([-.78,.9,.78],[.78,.9,.78],.03,dark);
  const wheel=mesh(new THREE.TorusGeometry(.17,.026,8,20),dark,-.41,1.025,.28);wheel.name='left-hand-drive-steering-wheel';wheel.rotation.x=-.45;
  bar([-.41,.87,.48],[-.41,1.015,.28],.030,silver);
  bar([-.53,1.06,.28],[-.31,1.03,.28],.015,silver);
  // Recognisable adults for the low rear chase camera. Driver remains on
  // the LEFT. His elbow rests on the door, right hand holds the steering wheel.
  // The passenger has a sunlit short blonde bob with three wind-driven locks.
  for(const [side,name,shirtColor,hairColor,skinColor] of [
    [-1,'driver','#26565e','#24252b','#c99573'],
    [1,'passenger','#f4e5d5','#e4b34b','#edbd9c'],
  ] as const){
    const person=new THREE.Group();person.name=name;car.add(person);
    const x=side*.41,driver=side===-1;
    const head=new THREE.Group();head.name=name+'-head';person.add(head);
    const arms:THREE.Group[]=[],locks:THREE.Group[]=[];
    const shirt=material(shirtColor,.77),hair=material(hairColor,.67),skin=material(skinColor,.84);
    // Shaped shoulders and collar, tucked behind the windshield line.
    oval(.235,.27,.19,shirt,x,1.01,-.49,person);
    oval(.155,.08,.13,skin,x,1.27,-.46,person);
    oval(.167,.207,.164,skin,x,1.47,-.45,head);
    oval(.155,.112,.163,hair,x,1.602,-.49,head);
    if(driver){
      oval(.158,.075,.144,hair,x,1.56,-.55,head);
      // Restrained sunglasses rather than round cartoon eyes.
      for(const eye of [-1,1])oval(.065,.029,.014,dark,x+eye*.084,1.49,-.285,head);
      bar([x-.075,1.49,-.28],[x+.075,1.49,-.28],.010,silver,head);
    }else{
      // Rounded blonde bob frames both cheeks, shoulder-length would read
      // too heavy from behind. Only the separate back locks need movement.
      for(const sideLock of [-1,1]){
        oval(.064,.127,.075,hair,x+sideLock*.148,1.45,-.48,head);
      }
      oval(.146,.078,.122,hair,x,1.545,-.57,head);
      for(const eye of [-1,1])oval(.030,.023,.012,dark,x+eye*.070,1.489,-.284,head);
      // Three 2-joint hair tufts pivot on the back of the crown. Their
      // lower ends remain above the shoulders and below the car's skyline.
      for(let i=0;i<3;i++){
        const lock=new THREE.Group();lock.name='blonde-hair-lock-'+i;
        lock.position.set(x+(i-1)*.105,1.55,-.62);head.add(lock);
        oval(.070,.126,.062,hair,0,-.085,0,lock);
        const tip=new THREE.Group();tip.position.y=-.17;lock.add(tip);
        oval(.055,.075,.050,hair,0,-.05,-.008,tip);
        locks.push(lock);
      }
    }
    // A small shaped nose and chin keep inspection views attractive without
    // a face texture, extra skinning system or extra animation draw passes.
    oval(.032,.042,.036,skin,x,1.433,-.284,head);
    oval(.105,.047,.087,skin,x,1.347,-.42,head);
    for(const arm of [-1,1]){
      const shoulder:[number,number,number]=[x+arm*.18,1.16,-.47];
      const resting=driver&&arm===-1;
      const elbow:[number,number,number]=resting?[-.91,1.01,-.34]:
        driver?[-.26,1.01,-.13]:[x+arm*.235,.985,-.23];
      const hand:[number,number,number]=resting?[-1.005,1.025,-.07]:
        driver?[-.40,1.01,.25]:[x+arm*.12,.83,-.08];
      const limb=new THREE.Group();
      limb.name=resting?'driver-left-arm-resting-on-door':driver?'driver-right-hand-steering':'passenger-arm-'+arm;
      person.add(limb);arms.push(limb);
      bar(shoulder,elbow,.067,shirt,limb);
      bar(elbow,hand,.050,skin,limb);
      oval(.062,.043,.075,skin,...hand,limb);
      if(resting){
        // Relaxed fingers drape gently over the painted door cap.
        for(const offset of [-.026,0,.026])
          bar([hand[0]+offset,hand[1],hand[2]-.025],
           [hand[0]+offset,hand[1]-.025,hand[2]+.066],.010,skin,limb);
      }
      batch(limb);pivotAt(limb,...shoulder);
    }
    batch(head);pivotAt(head,x,1.30,-.46);
    batch(person);pivotAt(person,x,.8,-.48);
    travelers.push({body:person,head,arms,locks});
  }
  // A sculpted tail, twin C-shaped LED signatures and dark diffuser
  // are readable at the normal chase distance (unlike single red cubes).
  box(1.80,.105,.15,dark,0,.32,-2.34);
  box(1.75,.12,.11,paintShade,0,.86,-2.31);
  box(1.78,.17,.105,dark,0,.37,-2.36);
  const rear=material('#d51c23',.32);rear.emissive.set('#e12d25');
  const tailIdle=dusk?1.2:.35,tailBraking=3.0;let braking=false;
  rear.emissiveIntensity=tailIdle;
  const lamp=material('#fff2cf',.3);lamp.emissive.set('#fff3bf');lamp.emissiveIntensity=dusk?2.5:.6;
  for(const side of [-1,1]){
    // Rear LED hockey-stick, housed in black. Both sides use ONE shared
    // material, so the original brake-light controller still has one update.
    box(.78,.155,.060,dark,side*.55,.745,-2.345);
    box(.67,.056,.065,rear,side*.53,.77,-2.387);
    box(.088,.123,.067,rear,side*.87,.715,-2.387);
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
    if(!(child instanceof THREE.Mesh)||Array.isArray(child.material)||child.material.transparent||child.name==='rear-license-FZR-123')continue;
    child.updateMatrix();const g=child.geometry.index?child.geometry.toNonIndexed():child.geometry.clone();
    for(const name of Object.keys(g.attributes))if(name!=='position'&&name!=='normal')g.deleteAttribute(name);
    g.applyMatrix4(child.matrix);const list=byMaterial.get(child.material)??[];list.push(g);byMaterial.set(child.material,list);group.remove(child);child.geometry.dispose();
  }
  for(const [material,geometries] of byMaterial){const g=mergeGeometries(geometries);geometries.forEach(g=>g.dispose());if(!g)throw new Error('Car geometry batch failed');const mesh=new THREE.Mesh(g,material);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);}
}
