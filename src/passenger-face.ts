import * as THREE from 'three';

// Head-local units: one unit is 12.3 cm, +Z faces forward. Each section
// describes height, half width, front and back of the skull respectively.
const skull = [
  [-1.10, .03, .51, .45], [-1.055, .31, .70, .17], [-.96, .50, .80, -.16],
  [-.82, .65, .80, -.42], [-.66, .78, .82, -.65], [-.47, .87, .85, -.84],
  [-.24, .96, .90, -.99], [0, 1.0, .92, -1.06], [.23, 1.01, .96, -1.09],
  [.46, 1.00, .99, -1.10], [.75, .96, 1.00, -1.04], [1.02, .81, .86, -.90],
  [1.23, .52, .60, -.63], [1.34, .025, .035, -.04],
];
const bell = (x:number, width:number) => Math.exp(-(x*x)/(width*width));
const {lerp, clamp} = THREE.MathUtils;

function section(y:number) {
  const i=skull.findIndex(row=>row[0]>=y);
  if(i<=0)return skull[i===0?0:skull.length-1];
  const a=skull[i-1], b=skull[i], t=(y-a[0])/(b[0]-a[0]);
  const prev=skull[Math.max(0,i-2)],next=skull[Math.min(skull.length-1,i+1)];
  const dy=b[0]-a[0],span=t*(1-t);
  const shape=[y];
  for(let k=1;k<=3;k++){
    const m0=dy*(b[k]-prev[k])/(b[0]-prev[0]),m1=dy*(next[k]-a[k])/(next[0]-a[0]);
    shape.push(lerp(a[k],b[k],t)+span*((1-t)*(m0-b[k]+a[k])+t*(b[k]-a[k]-m1)));
  }
  return shape;
}

function relief(x:number,y:number){
  const side=Math.abs(x);
  const orbit=-.078*bell(side-.43,.27)*bell(y-.10,.17);
  const brow=.088*bell(side-.43,.31)*bell(y-.30,.12);
  const cheek=.093*bell(side-.55,.31)*bell(y+.19,.20);
  const bridge=.235*bell(x,.13)*bell(y-.015,.37);
  const tip=.245*bell(x,.145)*bell(y+.25,.126);
  const wings=.132*bell(side-.14,.082)*bell(y+.29,.07);
  const muzzle=.092*bell(x,.37)*bell(y+.56,.21);
  const chin=.085*bell(x,.38)*bell(y+.90,.14);
  return orbit+brow+cheek+bridge+tip+wings+muzzle+chin;
}

function front(x:number,y:number){
  const [,w,fore,back]=section(y);
  const c=Math.sqrt(Math.max(0,1-(x/w)**2));
  return (fore+back)/2+(fore-back)/2*c**.78+c*relief(x,y);
}

type Point=[number,number,number];
type Surface=(u:number,v:number)=>Point;

export type PassengerDetail='driving'|'portrait';

export function createPassengerFace(detail:PassengerDetail='driving'){
  const positions:number[]=[], colors:number[]=[], indices:number[]=[];
  const palette=new Map<string,THREE.Color>();
  function paint(hex:string){
    let color=palette.get(hex);
    if(!color){color=new THREE.Color(hex);palette.set(hex,color);}
    return color;
  }
  // Curved patches share one indexed vertex-colour batch. Winding is chosen
  // per patch so the visible surface and its lighting normals agree.
  function patch(cols:number,rows:number,surface:Surface,color:(u:number,v:number)=>THREE.Color,reverse=false){
    if(detail==='driving'){
      cols=Math.max(4,Math.round(cols*.29));
      rows=Math.max(1,Math.round(rows*.27));
    }
    const start=positions.length/3;
    for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
      const u=i/cols,v=j/rows;
      positions.push(...surface(u,v));const c=color(u,v);colors.push(c.r,c.g,c.b);
      if(i&&j){
        const d=start+j*(cols+1)+i,a=d-cols-2,b=a+1,k=d-1;
        if(reverse)indices.push(a,k,b,b,k,d);
        else indices.push(a,b,k,b,d,k);
      }
    }
  }
  const skin=paint('#f4d4c5'), blush=paint('#e7a196'), mixed=new THREE.Color();
  const yaw=(u:number)=>(u-.5)*Math.PI*2;
  const height=(v:number)=>lerp(-1.10,1.34,v);
  patch(72,52,(u,v)=>{
    const y=height(v),a=yaw(u),c=Math.cos(a),[,w,fore,back]=section(y);
    const x=w*Math.sin(a);
    return [x,y,c>0?front(x,y):(fore+back)/2+(fore-back)*c/2];
  },(u,v)=>{
    const y=height(v),x=section(y)[1]*Math.sin(yaw(u));
    return mixed.copy(skin).lerp(blush,Math.max(0,Math.cos(yaw(u)))*(
      .55*bell(Math.abs(x)-.57,.31)*bell(y+.22,.17)+.36*bell(x,.15)*bell(y+.26,.12)));
  });
  // Ellipsoidal ears and the shallow nostril recesses sit on the sculpted shell.
  function ellipsoid(center:Point,radii:Point,hex:string){
    patch(14,8,(u,v)=>{
      const a=yaw(u),b=(v-.5)*Math.PI;
      return [center[0]+radii[0]*Math.cos(b)*Math.sin(a),center[1]+radii[1]*Math.sin(b),center[2]+radii[2]*Math.cos(b)*Math.cos(a)];
    },()=>paint(hex));
  }
  for(const s of [-1,1]){
    ellipsoid([s*.928,-.12,-.07],[.126,.25,.17],'#efc1af');
    ellipsoid([s*.113,-.307,front(s*.113,-.307)],[.030,.013,.008],'#aa7468');
  }

  // Each eye is an almond-shaped convex surface. Lids wrap the same rim;
  // iris, pupil and glints follow the curvature rather than floating spheres.
  for(const side of [-1,1]){
    const cx=side*.425,cy=.085,half=.238;
    function edges(x:number){
      const t=clamp((x-cx)/half,-1,1),arch=(1-t*t)**.89;
      const base=cy+side*t*.031;
      return {low:base-.068*arch,high:base+.094*arch,arch};
    }
    function eyeZ(x:number,y:number){
      const {low,high,arch}=edges(x),v=clamp((y-low)/Math.max(.0001,high-low),0,1);
      return front(x,y)+.025+.036*arch*4*v*(1-v);
    }
    patch(22,6,(u,v)=>{
      const x=cx+(2*u-1)*half,{low,high}=edges(x),y=lerp(low,high,v);
      return [x,y,eyeZ(x,y)];
    },(_u,v)=>mixed.copy(paint('#fff1dc')).lerp(paint('#caaea5'),.22*v*v));
    const gaze=cx+.024;
    // The upper lid occludes the top of the iris at both ends of the gaze.
    function iris(radius:number,centerX:number,centerY:number,tint:(v:number,u:number)=>THREE.Color,lift:number){
      patch(28,5,(u,v)=>{
        const a=u*Math.PI*2,x=centerX+radius*v*Math.cos(a),limits=edges(x);
        const y=clamp(centerY+radius*v*Math.sin(a),limits.low+.002,limits.high-.002);
        return [x,y,eyeZ(x,y)+lift];
      },(u,v)=>tint(v,u),true);
    }
    iris(.084,gaze,cy+.012,(r,u)=>mixed.copy(paint('#ae854a')).lerp(paint('#403129'),.25+.67*r**5+.08*Math.sin(u*54)),.002);
    iris(.038,gaze,cy+.018,()=>paint('#31262b'),.004);
    iris(.018,gaze-.026,cy+.044,()=>paint('#fff9e5'),.006);
    for(const upper of [false,true]){
      patch(24,4,(u,v)=>{
        const x=cx+(2*u-1)*half,{low,high,arch}=edges(x),rim=upper?high:low;
        const y=rim+(upper?1:-1)*v*(upper?.072:.051)*arch;
        return [x,y,front(x,y)-.002+.027*(1-v)+.012*Math.sin(v*Math.PI)*arch];
      },(_u,v)=>mixed.copy(paint(upper?'#bd8b7c':'#e7bea9')).lerp(skin,v),!upper);
    }
    patch(26,2,(u,v)=>{
      const x=cx+(2*u-1)*half,{high,arch}=edges(x),y=high+(v-.5)*(.012+.016*(.5+side*(u-.5)))*arch;
      return [x,y,front(x,y)+.031];
    },()=>paint('#54372f'));
    patch(18,3,(u,v)=>{
      const t=side*(2*u-1),x=cx+(2*u-1)*.25;
      const arch=Math.sin(u*Math.PI)**.48;
      const y=.267+.067*Math.sin((t+1)*1.45)-.01*t+(v-.5)*.057*arch*(.86-.35*t);
      return [x,y,front(x,y)+.007+.014*arch*Math.sin(v*Math.PI)];
    },(_u,v)=>mixed.copy(paint('#976137')).lerp(paint('#b48654'),v*.55));
  }

  // The lip rims separate around the recessed mouth and upper teeth as the smile opens.
  const mouthStart=positions.length;
  const lipMotion:number[]=[];
  for(const part of ['opening','teeth','upper','lower']){
    patch(32,5,(u,v)=>{
      const t=2*u-1,x=.325*t,volume=(1-t*t)**.8;
      const seam=-.563+.014*t*t+.006*t;
      const bow=.033+.029*bell(Math.abs(t)-.33,.24);
      let y=seam+(v-.5)*.012*volume,z=.016*volume;
      let jaw=(1-v)*volume;
      if(part==='teeth'){
        y=seam+(.003+.002*v)*volume;z=.020*volume;jaw=(1-v)*.42*volume*bell(t,.80);
      }
      if(part==='upper'){y=seam+volume*(.005+bow*v);z=.003+.050*Math.sin(Math.PI*(.15+.85*v))*volume;jaw=0;}
      if(part==='lower'){y=seam-volume*(.005+.073*(1-v));z=.003+.061*Math.sin(Math.PI*(.88*v+.06))*volume;jaw=volume*(.66+.34*v);}
      lipMotion.push(jaw);
      return [x,y,front(x,y)+z];
    },(_u,v)=>part==='teeth'?paint('#f3dfc7'):part==='opening'?paint('#733f47'):mixed.copy(paint(part==='upper'?'#b96e6d':'#df9190')).lerp(paint('#f4b5a8'),.28*Math.sin(Math.PI*v)));
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  g.setIndex(indices);g.computeVertexNormals();
  // One sparse-in-effect morph drives the cheeks and lip corners together.
  const smile=positions.map(()=>0);
  for(let i=0;i<positions.length;i+=3){
    const [x,y,z]=[positions[i],positions[i+1],positions[i+2]];
    if(z<.4)continue;
    const cheek=bell(Math.abs(x)-.31,.19)*bell(y+.53,.21);
    smile[i]=Math.sign(x)*.038*cheek;
    smile[i+1]=.060*cheek+.018*bell(Math.abs(x)-.55,.22)*bell(y+.24,.20);
    if(i>=mouthStart){
      smile[i+1]-=.082*lipMotion[(i-mouthStart)/3];
      smile[i+2]=.006*cheek;
    }
  }
  g.morphTargetsRelative=true;g.morphAttributes.position=[new THREE.Float32BufferAttribute(smile,3)];
  const face=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.77}));
  face.name='passenger-sculpted-face';face.castShadow=true;face.receiveShadow=true;
  face.scale.setScalar(.123);face.morphTargetInfluences![0]=.58;
  return face;
}
