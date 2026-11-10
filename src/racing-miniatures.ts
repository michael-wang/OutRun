import * as T from 'three';
import palm from './generated/menu-palm.json';
import type { RacingStage } from './racing-stages';

// The three tabletop models share primitive geometry and one vertex-coloured
// Lambert material. All geometry is local to the menu's short-lived renderer.
type Point = [number, number, number];
const cube = new T.BoxGeometry(1, 1, 1);
class Miniature {
  positions: number[] = [];
  colors: number[] = [];
  private color = new T.Color();
  private matrix = new T.Matrix4();
  private point = new T.Vector3();

  geometry(g: T.BufferGeometry, color: string, position: Point, scale: Point, yaw = 0) {
    this.matrix.makeRotationY(yaw).scale(new T.Vector3(...scale)).setPosition(...position);
    this.color.set(color);
    const attr = g.getAttribute('position'), count = g.index?.count ?? attr.count;
    for (let i = 0; i < count; i++) {
      this.point.fromBufferAttribute(attr, g.index?.getX(i) ?? i).applyMatrix4(this.matrix);
      this.positions.push(this.point.x, this.point.y, this.point.z);
      this.colors.push(this.color.r, this.color.g, this.color.b);
    }
  }
  box(color: string, position: Point, scale: Point, yaw = 0) {
    this.geometry(cube, color, position, scale, yaw);
  }
  cylinder(color: string, position: Point, top: number, bottom: number, height: number, sides = 12, depth = 1) {
    const g = new T.CylinderGeometry(top, bottom, height, sides);
    this.geometry(g, color, position, [1, 1, depth]);
    g.dispose();
  }
  quad(color: string, a: Point, b: Point, c: Point, d: Point) {
    this.color.set(color);
    for (const v of [a, b, c, a, c, d]) {
      this.positions.push(...v);
      this.colors.push(this.color.r, this.color.g, this.color.b);
    }
  }
  mesh() {
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(this.positions, 3));
    g.setAttribute('color', new T.Float32BufferAttribute(this.colors, 3));
    g.computeVertexNormals();
    return new T.Mesh(g, new T.MeshLambertMaterial({vertexColors: true, side: T.DoubleSide}));
  }
}

type Path = (x: number) => number;
// A ruled strip can slope vertically as well as curve across the diorama.
function strip(m: Miniature, color: string, left: Path, right: Path, height: Path, from = -3.5, to = 3.5, steps = 48) {
  const edge = (x: number, fn: Path): Point => [x, height(x), fn(x)];
  for (let i = 0; i < steps; i++) {
    const a = from+(to-from)*i/steps, b = from+(to-from)*(i+1)/steps;
    m.quad(color, edge(a,left), edge(a,right), edge(b,right), edge(b,left));
  }
}
function road(m: Miniature, path: Path, height: Path, width = .61) {
  const offset = (d: number) => (x: number) => path(x)+d;
  const layer = (d: number) => (x: number) => height(x)+d;
  strip(m, '#dbccaf', offset(-width-.09), offset(width+.09), height);
  strip(m, '#343b46', offset(-width), offset(width), layer(.012));
  for (const z of [-width+.065, width-.095])
    strip(m,'#ece8ce',offset(z),offset(z+.032),layer(.021));
  for (let x=-3.42; x<3.4; x+=.48)
    strip(m,'#ffdc87',offset(-.024),offset(.024),layer(.024),x,x+.25,3);
}
function car(m: Miniature, x: number, y: number, z: number, yaw: number, color: string) {
  m.box('#202831',[x,y+.035,z],[.48,.08,.245],yaw);
  m.box(color,[x,y+.108,z],[.52,.085,.27],yaw);
  m.box('#accbd0',[x-.02,y+.184,z],[.23,.105,.21],yaw);
  m.box(color,[x-.035,y+.245,z],[.18,.027,.2],yaw);
}
function plinth(m: Miniature, surface: string, soil: string) {
  m.box('#232b33',[0,-.53,0],[7.06,.14,4.66]);
  m.box('#a6a294',[0,-.442,0],[7.02,.045,4.62]);
  m.box(soil,[0,-.21,0],[7,.43,4.6]);
  m.box(surface,[0,.012,0],[7,.045,4.6]);
}
function coast(m: Miniature) {
  plinth(m,'#12a4bb','#14798c');
  const path: Path = x => -.48+.68*Math.sin(x*.88+.34);
  const off = (n: number) => (x: number) => path(x)+n;
  strip(m,'#69d6cc',()=>-2.3,off(1.26),()=>.046);
  strip(m,'#ddedce',()=>-2.3,off(1.07),()=>.056);
  strip(m,'#edc787',()=>-2.3,off(.98),()=>.067);
  strip(m,'#a8ad66',()=>-2.3,off(-.68),()=>.074);
  road(m,path,()=>.082,.53);
  for (let i=0;i<28;i++) {
    const x=-3.32+(i*1.237)%6.52, z=1.12+(i*.361)%1.08;
    if (z>path(x)+1.35) m.box(i%3?'#73d9d4':'#ecdeae',[x,.043,z],[.13+(i%4)*.08,.014,.025]);
  }
  // Lantern, balcony, gallery and alternating masonry bands.
  const lx=2.54,lz=-1.62;
  m.cylinder('#f1d5a5',[lx,.17,lz],.49,.52,.2);
  for(let i=0;i<5;i++)
    m.cylinder(i%2?'#d6533b':'#fff0ce',[lx,.27+i*.31+.155,lz],.32-i*.026,.346-i*.026,.315);
  m.cylinder('#394552',[lx,1.86,lz],.38,.31,.12);
  m.cylinder('#ffe798',[lx,2.065,lz],.22,.22,.32,8);
  for(let k=0;k<8;k++){
    const a=k*Math.PI/4;
    m.box('#435457',[lx+.225*Math.cos(a),2.06,lz+.225*Math.sin(a)],[.028,.34,.028]);
  }
  m.cylinder('#b64937',[lx,2.32,lz],.035,.32,.22,8);
  const trunk = new T.BufferGeometry(), leaves = new T.BufferGeometry();
  trunk.setAttribute('position',new T.Float32BufferAttribute(palm.trunk,3));
  leaves.setAttribute('position',new T.Float32BufferAttribute(palm.fronds,3));
  for(const [x,z,h,a] of [[-2.7,-1.97,.204,.4],[-1.94,-2.02,.155,2],[.13,-1.62,.19,1],[1.02,-1.7,.147,0]]) {
    m.cylinder('#8a925b',[x,.082,z],.38,.34,.018,10,.68);
    m.geometry(trunk,'#966e43',[x,.09,z],[h,h,h],a);
    m.geometry(leaves,'#3d9967',[x,.09,z],[h,h,h],a);
  }
  trunk.dispose();leaves.dispose();
  // The rock shelf and the cut edge expose the land above the waterline.
  for(const x of [-3.498,3.498]){
    const shore=path(x)+.96;
    m.box('#b99463',[x,-.172,(shore-2.3)/2],[.016,.36,shore+2.3]);
    m.box('#e9be83',[x,-.038,(shore-2.3)/2],[.022,.10,shore+2.3]);
  }
  for(let i=0;i<14;i++){
    const x=-2.98+i*.443;
    if(x>-.84&&x<1.05)continue;
    const z=path(x)+.65;
    m.box('#d7c8a4',[x,.168,z],[.048,.2,.057]);
    const next=path(x+.443)+.65;
    m.box('#ebe2c6',[x+.221,.254,(z+next)/2],[Math.hypot(.443,next-z),.045,.054],-Math.atan2(next-z,.443));
  }
  for(const [x,z,r] of [[-2.92,.89,.18],[-2.60,1.01,.12],[2.73,1.66,.20],[3.04,1.81,.11]]){
    m.cylinder('#bbe6d6',[x,.050,z],r*1.30,r*1.34,.01,8,.70);
    m.cylinder('#a38d73',[x,.101,z],r*.58,r,.14,7,.78);
  }
  for(let i=0;i<3;i++)m.box('#4c686a',[lx, .55+i*.41,lz+.32-i*.023],[.09,.14,.025]);
  const x=-2.45,z=1.6;
  m.cylinder('#b85c3d',[x,.103,z],.28,.18,.12,6,.48);
  m.box('#f4e5c4',[x,.44,z],[.025,.7,.025]);
  m.quad('#fff0ce',[x-.23,.19,z],[x,.76,z],[x,.2,z],[x-.23,.19,z]);
  car(m,-.52,.11,path(-.52)+.22,-.50,'#ee5039');
}
function tower(m: Miniature,x:number,z:number,w:number,d:number,h:number,color:string) {
  m.box('#84969b',[x+.09,.056,z+.095],[w+.26,.02,d+.24]);
  m.box('#778895',[x,.12,z],[w+.14,.16,d+.14]);
  m.box(color,[x,h/2+.2,z],[w,h,d]);
  const glass=['#315469','#688faa','#45687d'];
  for(let floor=0,y=.42;y<h+.14;y+=.24,floor++) {
    m.box(glass[floor%3],[x,y,z+d/2],[w*.87,.135,.016]);
    m.box('#465e73',[x+w/2,y,z],[.016,.135,d*.86]);
    for(let j=1;j<=3;j++)m.box(color,[x+w*(j/4-.5),y,z+d/2+.012],[.024,.15,.02]);
    if(floor%3===1)m.box('#fbd48a',[x+w*.19,y,z+d/2+.014],[w*.27,.09,.015]);
  }
  m.box('#c3cacf',[x,h+.21,z],[w+.04,.09,d+.04]);
  m.box('#748394',[x-.05,h+.31,z],[w*.48,.15,d*.48]);
}
function city(m: Miniature) {
  plinth(m,'#a2afb1','#80858a');
  const path: Path=x=>.36+.58*Math.sin(x*.84+.36);
  road(m,path,()=>.055,.6);
  tower(m,-2.8,-1.65,.74,.83,1.76,'#adbbb9');
  tower(m,-1.73,-1.63,.85,.94,2.86,'#7292a1');
  tower(m,-.75,-1.64,.76,.95,1.84,'#928d99');
  tower(m,.42,-1.59,.93,.97,3.35,'#53839a');
  m.box('#5691a9',[.42,3.73,-1.59],[.68,.37,.71]);
  m.box('#a8d5d2',[.42,3.96,-1.59],[.45,.14,.46]);
  m.cylinder('#e4b280',[.42,4.20,-1.59],.014,.041,.38,6);
  tower(m,1.57,-1.54,.68,.93,2.2,'#d6af9c');
  tower(m,2.68,-1.48,.9,1.08,1.63,'#73939b');
  tower(m,-2.62,1.48,1.1,.87,.64,'#dc9b7d');
  tower(m,2.76,1.68,.88,.79,.87,'#9daab5');
  // Corner shop awnings, illuminated signs and lit vertical tower fins.
  for(const x of [-2.62,2.76]){
    m.box('#497785',[x,.51,x<0?1.97:2.12],[.70,.30,.03]);
    m.box('#e98761',[x,.68,x<0?2:2.15],[.85,.075,.20]);
  }
  for(const dx of [-.39,.39])m.box('#acd8d8',[.42+dx,1.89,-1.09],[.045,3.25,.035]);
  m.box('#d87268',[-1.28,1.59,-1.21],[.085,.93,.13]);
  for(const x of [-1.13,1.91]) {
    for(let i=0;i<7;i++)m.box('#e6e1cb',[x,.087,path(x)-.47+i*.15],[.21,.014,.065]);
    m.box('#384855',[x+.2,.40,path(x)+.84],[.042,.7,.042]);
    m.box('#394557',[x+.2,.8,path(x)+.84],[.12,.19,.09]);
  }
  car(m,.31,.09,path(.31)+.23,-.4,'#f9ba46');
}
function mesa(m: Miniature,x:number,z:number,r:number,h:number,depth:number) {
  const rings=[[0,1.04],[.18,.82],[.23,.87],[.36,.68],[.41,.72],[.47,.64],[.84,.60],[.87,.66],[1,.63]];
  const colors=['#bf6949','#ec9b65','#cc754e','#f9b781','#ac5843','#e19869','#bc6a4d','#e5a579'];
  const ring=(k:number,j:number):Point=>{
    const a=j*2*Math.PI/8+.21;
    // Unequal, nearly vertical faces with a resistant cap and sloping talus.
    const angleIndex=j%8;
    const irregular=1+.13*Math.sin(angleIndex*1.9+x*2);
    const radius=r*rings[k][1]*irregular;
    const dx=Math.cos(a), dz=Math.sin(a);
    const y=.038+h*rings[k][0]*(1+.04*Math.sin(angleIndex*1.6+x));
    return [x+Math.sign(dx)*Math.pow(Math.abs(dx),.66)*radius+.10*rings[k][0],y,
      z+Math.sign(dz)*Math.pow(Math.abs(dz),.68)*radius*depth];
  };
  for(let j=0;j<8;j++){
    for(let k=0;k<rings.length-1;k++)
      m.quad(colors[k],ring(k,j+1),ring(k,j),ring(k+1,j),ring(k+1,j+1));
    const k=rings.length-1;
    m.quad('#f3bd89',[x,.038+h,z],ring(k,j+1),ring(k,j),[x,.038+h,z]);
  }
}
function canyon(m: Miniature) {
  plinth(m,'#cc8b63','#aa5e47');
  const path: Path=x=>.26+.65*Math.sin(x*1.25);
  const height: Path=x=>.34+.31*(1+Math.sin(x*.72));
  const river: Path=x=>1.2+.42*Math.sin(x*1.21+1.3);
  strip(m,'#e4b586',x=>river(x)-.30,x=>river(x)+.30,()=>.046);
  strip(m,'#68a9a3',x=>river(x)-.23,x=>river(x)+.23,()=>.056);
  for(const [x,z,r,h,d] of [[-2.35,-1.54,1.13,1.78,.59],[-1.88,-1.65,.54,2.40,.56],[-.39,-1.67,.64,1.02,.83],[.73,-1.61,1.22,2.34,.49],[1.24,-1.74,.36,3.08,.95],[2.65,-1.54,.72,1.34,.7],[-2.71,1.73,.73,.60,.69],[2.5,1.55,.82,1.10,.71],[2.86,1.81,.31,1.47,.7]])
    mesa(m,x,z,r,h,d);
  for(let i=0;i<48;i++){
    const a=-3.5+7*i/48,b=-3.5+7*(i+1)/48;
    if(b<.1||a>1.65){
      const za=path(a)+.56,zb=path(b)+.56;
      m.quad('#b87251',[a,.035,za+.23],[b,.035,zb+.23],[b,height(b)-.18,zb],[a,height(a)-.18,za]);
      m.quad('#d99a6d',[a,height(a)-.18,za],[b,height(b)-.18,zb],[b,height(b)-.05,-1.06],[a,height(a)-.05,-1.06]);
    }
    for(const side of [-.56,.56])
      m.quad('#bd896a',[a,height(a)-.22,path(a)+side],[b,height(b)-.22,path(b)+side],[b,height(b),path(b)+side],[a,height(a),path(a)+side]);
  }
  for(let x=-3.42;x<3.5;x+=.79)
    m.box('#ab7757',[x,height(x)*.5,path(x)],[.24,height(x),.88]);
  road(m,path,height,.49);
  for(let i=0;i<9;i++){
    const x=.09+i*.195,next=x+.195,z=path(x)+.55,nz=path(next)+.55;
    m.box('#e8bd85',[x,height(x)+.09,z],[.033,.18,.033]);
    m.box('#f1cf94',[(x+next)/2,height(x)+.18,(z+nz)/2],[Math.hypot(.195,nz-z),.036,.039],-Math.atan2(nz-z,.195));
  }
  car(m,-.31,height(-.31)+.026,path(-.31)+.21,-.59,'#349dad');
}

const builders = {coast,city,canyon};
export function renderMiniatures(stages: readonly RacingStage[], canvases: HTMLCanvasElement[]) {
  const renderer = new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
  const scene = new T.Scene();
  try {
    renderer.setSize(768,602,false);
    const camera=new T.OrthographicCamera(-4.64,4.64,4.14,-3.14,.1,50);
    camera.position.set(7.3,8.2,12.8);
    camera.lookAt(0,.88,0);
    scene.add(new T.HemisphereLight(0xfff4de,0xa8b8c9,2.05));
    const key=new T.DirectionalLight(0xffe6c0,2.0);
    key.position.set(-4,8,5);
    scene.add(key);
    stages.forEach((stage,i)=>{
      const model=new Miniature();
      builders[stage.preview](model);
      const mesh=model.mesh();
      scene.add(mesh);
      try {
        renderer.render(scene,camera);
        const canvas=canvases[i];
        canvas.width=768;canvas.height=602;
        const ctx=canvas.getContext('2d');
        if(!ctx)throw Error('Menu canvas unavailable');
        ctx.drawImage(renderer.domElement,0,0);
      } finally {
        scene.remove(mesh);mesh.geometry.dispose();mesh.material.dispose();
      }
    });
  } finally {
    renderer.dispose();renderer.forceContextLoss();scene.clear();
  }
}
