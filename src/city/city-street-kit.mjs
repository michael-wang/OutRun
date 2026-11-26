import * as T from 'three';
import {addStreetLife} from './street-life.mjs';
import atlasURL from './assets/street-kit.png?url';

// Original metre-scale modules. The slots match art/source/city/bake-street-atlas.mjs.
const M={enamel:0,steel:1,rustCanvas:2,jadeCanvas:3,zinc:4,stone:5,timber:6,glazing:7,
 oranges:8,pears:9,bus:10,athletics:11,citrus:12,rail:13,light:14,graphite:15};
const properties=[
 [.51,.16],[.52,.53],[.95,0],[.95,0],[.63,.55],[.96,0],[.86,0],[.28,.18],
 [.85,0],[.85,0],[.48,.17],[.55,.12],[.67,.03],[.48,.24],[.50,.07],[.64,.48]
];

export function addCityStreetKit({scene,cityChunks,pose,physicalPos,grade,edge,frontages}){
 const atlas=new T.TextureLoader().load(atlasURL);
 atlas.colorSpace=T.SRGBColorSpace;atlas.anisotropy=4;
 const data=new Uint8Array(64);
 properties.forEach(([rough,metal],i)=>data.set([255,Math.round(rough*255),Math.round(metal*255),255],
   ((3-(i>>2))*4+i%4)*4));
 const propertiesMap=new T.DataTexture(data,4,4);propertiesMap.needsUpdate=true;
 const material=new T.MeshStandardMaterial({map:atlas,roughnessMap:propertiesMap,metalnessMap:propertiesMap,
  roughness:1,metalness:1,side:T.DoubleSide,vertexColors:true});
 material.shadowSide=T.FrontSide;
 // Build a rigid bay on the local tangent. One mesh per site uses the game's
 // existing chunk visibility and review bounds. No per-frame model generation.
 const shopBatches=new Map();
 function site(at,offset,name,build){
  const origin=physicalPos(at,offset,grade(at)),angle=pose(at)[2],cs=Math.cos(angle),sn=Math.sin(angle);
  const positions=[],uv=[],colors=[];
  function panel(a,b,c,d,tile,tint=0xffffff){
   const col=new T.Color(tint),u=tile%4*.25,v=(3-(tile>>2))*.25,lo=.004,hi=.246;
   for(const [p,s,t] of [[a,lo,lo],[b,hi,lo],[c,hi,hi],[a,lo,lo],[c,hi,hi],[d,lo,hi]]){
    positions.push(origin[0]+cs*p[0]+sn*p[2],origin[1]+p[1],origin[2]-sn*p[0]+cs*p[2]);
    uv.push(u+s,v+t);colors.push(col.r,col.g,col.b);
   }
  }
  function box(x,y,z,w,h,l,tile,tint,front=tile){
   const a=x-w/2,b=x+w/2,c=y,d=y+h,e=z-l/2,f=z+l/2;
   panel([b,c,e],[a,c,e],[a,d,e],[b,d,e],front,tint);
   panel([a,c,f],[b,c,f],[b,d,f],[a,d,f],tile,tint);
   panel([a,c,e],[a,c,f],[a,d,f],[a,d,e],tile,tint);
   panel([b,c,f],[b,c,e],[b,d,e],[b,d,f],tile,tint);
   panel([a,d,e],[a,d,f],[b,d,f],[b,d,e],tile,tint);
   panel([a,c,f],[a,c,e],[b,c,e],[b,c,f],tile,tint);
  }
  // Closed square steel sections between actual attachment points.
  function brace(a,b,w,tile=M.steel,tint){
   const from=new T.Vector3(...a),to=new T.Vector3(...b),dir=to.clone().sub(from).normalize();
   const guide=Math.abs(dir.y)>.94?new T.Vector3(1,0,0):new T.Vector3(0,1,0);
   const u=dir.clone().cross(guide).normalize().multiplyScalar(w/2),v=dir.clone().cross(u);
   const corners=p=>[[-1,-1],[1,-1],[1,1],[-1,1]].map(([i,j])=>p.clone().addScaledVector(u,i).addScaledVector(v,j).toArray());
   const near=corners(from),far=corners(to);
   for(let i=0;i<4;i++){const j=(i+1)%4;panel(near[i],near[j],far[j],far[i],tile,tint);}
   panel(...far,tile,tint);panel(...near,tile,tint);
  }
  build({panel,box,brace});
  const group={layer:'mid', first:0,last:positions.length/3,yaw:angle};
  // Group shops on the same side and streaming cell while keeping review bounds per lot.
  if(name==='arcade-shop'){
   const key=Math.floor(at/95)*2+Number(offset>0);
   if(!shopBatches.has(key))shopBatches.set(key,{at,positions:[],uv:[],colors:[],groups:[]});
   const batch=shopBatches.get(key),first=batch.positions.length/3;
   batch.groups.push({...group,first,last:first+group.last});
   for(const [dest,src] of [[batch.positions,positions],[batch.uv,uv],[batch.colors,colors]])for(const v of src)dest.push(v);
  }else emit(at,name,positions,uv,colors,[group]);
 }
 function emit(at,name,positions,uv,colors,groups){
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  geo.computeVertexNormals();geo.computeBoundingSphere();
  const mesh=new T.Mesh(geo,material);mesh.name='city-interior-kit-'+name+'-'+at;
  mesh.userData.reviewGroups=groups;
  mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);cityChunks.push({at,mesh});
 }
 function grandstand(at,bays){
  site(at,-31,'athletics',({panel,box,brace})=>{
   for(let i=0;i<bays;i++){
    const z=i*7.2,lo=z-3.54,hi=z+3.54;
    // Four bleacher risers; paired banks of bucket seats leave a stepped aisle.
    for(let row=0;row<4;row++){
     const x=-row*1.23,y=.35+row*.30;
     box(x,.18,z,1.32,y+.34,7.10,M.stone);
     for(const dz of [-2.3,-1.03,1.03,2.3]){
      const tint=row%2===0?0x7198a2:0xd8ae78;
      box(x,y+.52,z+dz,.76,.16,.91,M.enamel,tint);
      box(x-.34,y+.64,z+dz,.14,.46,.88,M.enamel,tint);
     }
    }
    // A saddle between masts opens over the field. The upper lip lifts almost
    // five metres above the central valley; its underside is visible at speed.
    const steps=6;
    function surface(zeta,across){
     const ridge=Math.pow(Math.abs(zeta*2-1),1.55),lip=across*across;
     return [-6.3+12.1*across,6.3+1.3*(1-across)+lip*(.8+3.50*ridge),lo+(hi-lo)*zeta];
    }
    for(let j=0;j<steps;j++)for(let k=0;k<3;k++){
     const a=j/steps,b=(j+1)/steps,c=k/3,d=(k+1)/3;
     panel(surface(a,c),surface(b,c),surface(b,d),surface(a,d),M.enamel,j%2?0xf2dfb5:0xf6e8c7);
    }
    for(let j=0;j<steps;j++)brace(surface(j/steps,1),surface((j+1)/steps,1),.17,M.steel);
    const spine=[-5.1,8.5,lo],tip=surface(0,1);
    brace([-5.6,.4,lo],spine,.39);brace(spine,tip,.25);
    brace([-4.9,4.3,lo],[2.7,8.18,lo],.21);brace(spine,surface(.49,.65),.13);
    brace(surface(0,0),surface(1,0),.23);
    if(i===bays-1){const end=[-5.1,8.5,hi];brace([-5.6,.4,hi],end,.39);brace(end,surface(1,1),.25);}
    if(i===0){
     box(-4.2,2.6,lo,4.3,2.75,.4,M.steel,0xffffff,M.athletics);
     brace([-5.5,.3,lo],[-5.5,3.1,lo],.24);
    }
   }
  });
 }
 function market(at,x,bays){
  site(at,x,'auction',({panel,box,brace})=>{
   for(let i=0;i<bays;i++){
    const z=i*8.2,lo=z-4.08,hi=z+4.08,cloth=i%3===1?M.jadeCanvas:M.rustCanvas;
    box(.6,.12,z,9.4,.54,8.14,M.stone);
    for(const dx of [-2.3,4.7])brace([dx,.63,lo+.24],[dx,5.82,lo+.24],.23);
    for(const side of [-1,1]){
     const outer=.9+side*5,ridge=.9+side*.20;
     panel([outer,5.36,lo],[outer,5.36,hi],[ridge,7.22,hi],[ridge,7.22,lo],M.zinc,0xaabcb4);
     brace([outer,5.36,lo],[ridge,7.22,lo],.22);
    }
    brace([-4.1,5.36,lo],[5.9,5.36,lo],.18);brace([.9,5.36,lo],[.9,7.22,lo],.15);
    box(.9,7.18,z,.48,.18,8.14,M.steel);
    // Woven awning consists of sewn strips; six rounded valances hang
    // separately under its street edge. The roof behind is rigid zinc.
    const hem=3.60+(i%3)*.15;
    panel([-2.4,5.02,lo],[-2.4,5.02,hi],[-5.92,hem,hi],[-5.92,hem,lo],cloth);
    for(let k=0;k<6;k++){
     const a=lo+(hi-lo)*k/6,b=lo+(hi-lo)*(k+1)/6;
     panel([-5.92,hem,a],[-5.92,hem,b],[-5.97,hem-.30,b-.11],[-5.97,hem-.30,a+.11],cloth);
    }
    for(const dz of [-2.0,.04,2.11]){
     box(-3.53,.66,z+dz,1.65,.86,1.88,M.timber);
     const fruit=(i+(dz<0?1:0))%3?M.oranges:M.pears;
     panel([-4.40,1.59,z+dz-.87],[-4.40,1.59,z+dz+.87],[-2.72,1.97,z+dz+.87],[-2.72,1.97,z+dz-.87],fruit);
    }
    box(4.1,.66,z,1.6,3.55,7.77,M.timber,0xa69a7e);
    if(i===0||i===bays-1){box(-2.5,5.18,lo+.15,3.22,2.62,.25,M.steel,0xffffff,M.citrus);}
   }
  });
 }
 function transit(at,bays,terminal,setback=9.4){
  site(at,-edge(at,-1)-setback,'transit',({panel,box,brace})=>{
   for(let i=0;i<bays;i++){
    const z=i*6.9,lo=z-3.44,hi=z+3.44;
    // Vault cross section shared by the folded outer skin, fascia and ribs.
    const section=[[-4,5.12],[-3.52,6.06],[-2.27,6.77],[-.25,7.08],[1.78,6.97],[3.22,6.45],[3.91,5.68]];
    for(let k=0;k<section.length-1;k++){
     const [x,y]=section[k],[xx,yy]=section[k+1];
     panel([x,y,lo],[x,y,hi],[xx,yy,hi],[xx,yy,lo],k===2||k===3?M.glazing:M.zinc);
     brace([x,y-.16,lo],[xx,yy-.16,lo],.24,M.enamel);
    }
    for(const dx of [-3.25,2.85]){
     const y=dx<0?5.96:6.48;
     brace([dx,.18,lo+.14],[dx,y,lo+.14],.23);
     brace([dx,4.65,lo+.14],[dx*.58,y+.32,lo+.14],.19);
    }
    box(-3.21,.42,z,.16,3.02,5.75,M.glazing);
    box(-1.5,.81,z,.85,.22,3.65,M.timber);
    for(const dz of [-1.33,1.33])box(-1.5,.25,z+dz,.59,.56,.25,M.steel);
    box(.2,5.42,z,.29,.15,4.9,M.light);
    if(i===0){
     for(const dx of [-1.46,1.46])brace([dx,6.02,lo],[dx,6.88,lo],.085);
     box(.2,3.46,lo,4.50,2.65,.33,M.steel,0xffffff,terminal?M.rail:M.bus);
    }
   }
  });
 }
 grandstand(1749,4);grandstand(1889,3);
 market(2730,24,4);market(2779,27,3);
 transit(1084,3,false);transit(6937,4,true);transit(7006,4,true,14);transit(7053,5,true,14);

 // Dry loading doors occupy the existing footprints of the wholesale halls.
 // Galvanized roof monitors admit daylight above individual delivery bays.
 function wholesale(at,bays){
  site(at,edge(at,1)+19,'wholesale',({box,panel,brace})=>{
   for(let i=0;i<bays;i++){
    const z=i*7.6,lo=z-3.77,hi=z+3.77;
    box(6.2,.15,z,13.1,6.15,7.54,M.zinc,0xb7c6b9);
    box(-2.2,.18,z,5.45,.62,7.52,M.stone);
    box(-.43,.84,z,.23,4.52,5.71,M.graphite);
    box(-.62,4.83,z,.18,.65,5.9,M.light);
    panel([-5.1,5.44,lo],[-5.1,5.44,hi],[1,6.35,hi],[1,6.35,lo],M.zinc,0xd2b994);
    panel([-.52,6.34,lo],[13.1,6.34,lo],[13.1,8.23,hi],[-.52,8.23,hi],M.zinc);
    panel([13.1,6.34,hi],[-.52,6.34,hi],[-.52,8.23,hi],[13.1,8.23,hi],M.glazing);
    brace([-4.4,.84,lo],[-4.4,5.46,lo],.21);
    if(i%2===0){box(-2.3,.82,z,1.6,1.05,2.3,M.timber);box(-2.3,1.87,z,1.46,.35,2.16,M.pears);}
   }
  });
 }
 // The timing line is 98 m before this facade. The station's glazed fanlight
 // sits against its actual terminal hall; the projecting canopy shades doors.
 function terminalFront(){
  site(7207,0,'headhouse',({panel,box,brace})=>{
   const arch=t=>[-24*Math.cos(t),9.45+13*Math.sin(t),-.48];
   for(let i=0;i<16;i++){
    const a=arch(Math.PI*i/16),b=arch(Math.PI*(i+1)/16);
    panel([a[0],8.9,-.48],[b[0],8.9,-.48],b,a,M.glazing);
    brace(a,b,.74,M.enamel);if(i%2===1)brace([0,9,-.68],[b[0],b[1],-.68],.33,M.steel);
    panel(a,b,[b[0],b[1],12],[a[0],a[1],12],M.zinc);
   }
   for(let i=-4;i<=4;i++){
    const x=i*7.05;
    box(x,0,-.1,6.92,9.0,1.15,M.stone);
    box(x,.28,-.80,5.85,6.91,.4,M.glazing);
    box(x,5.7,-1.04,5.95,.48,.25,M.light);
    box(x+3.29,.12,-3,.46,6.77,.49,M.steel);
    panel([x-3.5,7.0,-5.2],[x+3.5,7,-5.2],[x+3.5,8.12,-.1],[x-3.5,8.12,-.1],M.enamel);
   }
   box(0,7.08,-5.23,13.3,2.9,.46,M.steel,0xffffff,M.rail);
  });
 }
 // The parcels wing joins the station's curbside shelter behind the taxi bays.
 function parcelsWing(){
  site(7040,-31,'parcels',({box,panel})=>{
   for(let i=0;i<4;i++){
    const z=i*7.8;box(0,.27,z,1.17,7.33,7.76,M.stone);
    box(.73,.61,z,.33,4.42,6.59,M.glazing);
    box(.81,5.41,z,.36,.63,6.82,M.light);
    panel([.58,6.73,z-3.89],[.58,6.73,z+3.89],[3.69,6.03,z+3.89],[3.69,6.03,z-3.89],M.zinc);
   }
  });
 }

 // Opening blocks keep their original upper mass. The sidewalk face, return
 // wall, clerestory and projecting shop blades belong to each actual parcel.
 for(const p of frontages){
  if(p.at>310||p.style||p.offset!==undefined)continue;
  const {side,width:w,at,arcade,bays,storey,index}=p,trade=(index+(side===1?1:3))%4;
  const paint=[0xa65f48,0x356b64,0x8a6d57,0x4b697e][trade];
  site(at,side*(edge(at,side)+p.setback),'arcade-shop',({box,panel,brace})=>{
   const y=storey+.65,bay=w/bays;
   for(let i=0;i<bays;i++){
    const z=bay*(i+.5)-w/2;
    box(side*(arcade-.40),.35,z,.14,2.85,bay-.62,M.glazing);
    box(side*(arcade-.57),.28,z,.26,.48,bay-.49,trade===0?M.timber:M.stone);
    box(side*.06,.22,z-bay*.43,.45,.87,.48,M.stone);
    box(side*.05,.96,z-bay*.43,.30,y-1.26,.30,M.enamel,0xccb89a);
    // Projecting lintel, shaded reveals and awnings are readable at a grazing angle.
    box(-side*.22,y-.49,z,.75,.48,bay-.14,M.timber,paint);
    if((i+trade)%3!==1){
     panel([side*.12,y-.24,z-bay*.45],[side*.12,y-.24,z+bay*.45],[-side*1.45,y-.92,z+bay*.45],[-side*1.45,y-.92,z-bay*.45],trade%2?M.jadeCanvas:M.rustCanvas);
    }
    for(let level=0;level<Math.min(p.levels-1,3);level++){
     const h=y+level*storey+1.02,x=side*.21;
     box(x,h,z,.22,1.62,bay*.63,M.glazing);
     box(x-side*.24,h+1.60,z,.71,.18,bay*.71,M.stone);
     box(x-side*.31,h-.10,z,.81,.22,bay*.72,M.enamel,0xb5aea0);
    }
   }
   if(index%3!==2){
    const z=-w*.35,x=-side*1.07;
    box(x,y+.12,z,1.62,2.65,.32,M.enamel,paint);
    const glyph=0xf2d4a2;
    if(trade===0){box(x,y+.64,z-.18,.30,1.38,.08,M.enamel,glyph);box(x,y+1.13,z-.19,.99,.29,.08,M.enamel,glyph);}
    else if(trade===1){box(x,y+.58,z-.18,.91,.67,.08,M.enamel,glyph);for(const dx of [-.24,.12])brace([x+dx,y+1.40,z-.20],[x+dx+.10,y+1.82,z-.20],.08,M.enamel,glyph);}
    else for(let j=0;j<3;j++)box(x+(j-1)*.30,y+.61,z-.18,.19,.8+.24*(j%2),.08,M.enamel,glyph);
   }
  });
 }
 for(const b of shopBatches.values())emit(b.at,'arcade-shop',b.positions,b.uv,b.colors,b.groups);
 addStreetLife({site,M,edge});
 wholesale(3723,5);wholesale(3805,4);parcelsWing();terminalFront();


}
