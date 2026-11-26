// Original fixed poses share the facade atlas and one mesh per activity group.
// Local +x is toward the player's left. Figure positions are in metres.
export function addStreetLife({site,M,edge}){
 const cloth=[0x376b7b,0xd08858,0x8e5255,0x57734d,0xc49b52,0x6a6583];
 function person({box,brace,panel},x,y,z,angle,pose,look){
  const c=Math.cos(angle),s=Math.sin(angle),turn=([a,b,d])=>[x+a*c+d*s,y+b,z-a*s+d*c];
  const coat=cloth[look%cloth.length],skin=[0xc49b79,0xcba783,0xad866d][look%3];
  const limb=(a,b,w,color)=>brace(turn(a),turn(b),w,M.enamel,color);
  const head=(center,r,h,color)=>{const ring=(i,r,b)=>turn([center[0]+Math.cos(i*Math.PI/3)*r,center[1]+b,center[2]+Math.sin(i*Math.PI/3)*r]);
   for(let i=0;i<6;i++){
    panel(ring(i,r,-h*.39),ring(i+1,r,-h*.39),ring(i+1,r,h*.32),ring(i,r,h*.32),M.enamel,color);
    panel(ring(i,r,h*.32),ring(i+1,r,h*.32),ring(i+1,r*.42,h*.52),ring(i,r*.42,h*.52),M.enamel,0x594c43);
   }};
  const seated=pose==='sit',walking=pose==='walk',reaching=pose==='serve'||pose==='cart',hip=seated?.61:.98;
  for(const side of [-1,1]){
   const foot=seated?.42:walking?side*.31:side*.06;
   const knee=[side*.142,seated?.60:.55,seated?.43:foot*.48];
   limb([side*.12,hip,.01],knee,.187,0x43565d);limb(knee,[side*.143,.13,foot],.139,0x43565d);
   limb([side*.143,.105,foot-.06],[side*.143,.095,foot+.146],.145,0x3b4040);
  }
  const shoulder=hip+.47;
  limb([0,hip-.03,0],[0,shoulder,.045],.35,coat);
  const arm=(side,elbow,wrist)=>{limb([side*.23,shoulder,.045],elbow,.14,coat);limb(elbow,wrist,.096,skin);};
  for(const side of [-1,1]){
   const forward=reaching||seated?.32:walking?side*.19:.10;
   arm(side,[side*.29,shoulder-.22,.07],[side*.25,shoulder-(reaching?.26:.43),forward]);
  }
  head([0,shoulder+.214,.055],.151,.34,skin);
  if(pose==='serve'||pose==='cart'){
   const p=turn([0,shoulder+.34,.09]);box(p[0],p[1],p[2],.34,.09,.38,M.enamel,0xe5bb78);
   if(pose==='serve')limb([0,hip+.03,.19],[0,hip+.38,.20],.26,0xe6d3a8);
  }
  if(pose==='wait'&&look%2===0){const p=turn([.33,.12,.08]);box(p[0],p[1],p[2],.22,.63,.36,M.graphite,0xd1aa85);}
 }
 function dog(tools,x,y,z){
  const {box,brace}=tools;box(x,y+.33,z,.34,.32,.78,M.enamel,0xc38750);
  for(const side of [-1,1])for(const f of [-1,1])brace([x+side*.12,y+.36,z+f*.27],[x+side*.13,y+.045,z+f*.34],.088,M.enamel,0x92623a);
  box(x,y+.55,z+.38,.31,.31,.34,M.enamel,0xc99358);box(x,y+.57,z+.60,.25,.16,.18,M.enamel,0x795638);
  box(x,y+.49,z+.28,.33,.09,.16,M.enamel,0x9d4835);brace([x,y+.53,z-.34],[x+.08,y+.82,z-.66],.094,M.enamel,0xc38750);
 }
 function vehicle(tools,x,z,type){
  const {box,panel}=tools,bus=type==='bus',truck=type==='truck',len=bus?8.95:truck?5.45:4.38,width=bus?2.47:truck?2.14:1.76;
  const paint=bus?0x327773:truck?0xa7bcc0:0xf0b943;
  box(x,.44,z,width,.89,len,M.enamel,paint);
  for(const side of [-1,1])for(const wheel of [-.30,.3]){
   const cx=x+side*(width*.50+.025),cz=z+len*wheel,r=bus?.49:.35;
   for(let i=0;i<12;i++){
    const a=i*Math.PI/6,b=(i+1)*Math.PI/6,v=(u,rad)=>[cx,r+.09+Math.sin(u)*rad,cz+Math.cos(u)*rad];
    panel(v(a,r),v(b,r),v(b,r*.45),v(a,r*.45),M.graphite,0x504d4c);
    panel(v(a,r*.46),v(b,r*.46),[cx,r+.09,cz],[cx,r+.09,cz],M.zinc);
   }
  }
  if(bus){
   box(x,1.30,z,2.39,1.59,len-.11,M.glazing);box(x,2.88,z,2.46,.33,len-.12,M.enamel,0xd4d6bc);
   for(const side of [-1,1])for(const dz of [-3.3,-1.9,-.45,1,2.4,3.62])box(x+side*1.21,1.39,z+dz,.095,1.46,.11,M.steel);
   for(const dz of [-2.05,2.6]){box(x-1.23,.54,z+dz,.13,2.24,.94,M.steel);box(x-1.31,1.28,z+dz,.04,1.18,.69,M.glazing);}
   box(x,2.54,z-len*.5+.02,1.7,.47,.13,M.steel,0xffffff,M.bus);
  }else if(truck){
   box(x,1.29,z+.55,2.12,1.83,len-1.36,M.zinc,0xc7c5ab);
   box(x,1.30,z-len*.34,2,1.1,1.58,M.glazing);box(x,2.39,z-len*.34,2.07,.18,1.55,M.enamel,paint);
  }else{
   const pts=[[.92,-1.55],[1.79,-.79],[1.76,.71],[.95,1.54]];
   for(let i=0;i<3;i++){const [a,b]=pts[i],[c,d]=pts[i+1];panel([x-.76,a,z+b],[x+.76,a,z+b],[x+.76,c,z+d],[x-.76,c,z+d],i===1?M.enamel:M.glazing, i===1?paint:0xffffff);}
   for(const side of [-1,1])panel(...pts.map(([h,off])=>[x+side*.76,h,z+off]),M.glazing);
   box(x,1.78,z,.60,.20,.45,M.light);
  }
  box(x,.92,z-len/2-.02,width*.85,.15,.06,M.light);
 }
 function trolley(t,x,y,z){
  t.box(x,y+.26,z,.91,.19,1.32,M.steel);
  for(const dx of [-.34,.34]){t.brace([x+dx,y+.33,z-.50],[x+dx,y+1.13,z-.68],.07,M.steel);for(const dz of [-.42,.42])t.box(x+dx,y+.025,z+dz,.14,.26,.23,M.graphite);}
  t.brace([x-.35,y+1.12,z-.68],[x+.35,y+1.12,z-.68],.07,M.steel);
  t.box(x,y+.45,z,.76,.48,.99,M.timber);
 }
 for(const at of [1749,1889])site(at,-31,'spectators',t=>{
  for(const [row,z,id] of [[0,3.3,0],[1,4.9,3],[1,6.17,1],[2,10.25,2],[1,15.6,4],[0,18.7,5]]){
   person(t,-row*1.23,.49+row*.3,z,Math.PI*.5,'sit',id);
  }
  person(t,4,.36,3,.32,'wait',3);person(t,4.8,.36,4,2.9,'wait',1);
 });
 for(const [at,x] of [[1452,19.4],[1769,19.2],[1857,-20.8]])site(at,x,'park-walk',t=>{
  person(t,.12,.29,-1.5,.13,'walk',1);dog(t,.83,.29,.75);t.brace([.37,1.32,-1.21],[.83,.83,1.04],.036,M.graphite,0xc08951);
  person(t,-1.1,.29,-2.5,.21,'walk',0);person(t,1.25,.29,6.9,3.11,'walk',4);
 });
 // Low domestic walls and individual pitched roofs behind the existing lawn.
 for(const at of [1684,1771,1834])site(at,78,'park-homes',t=>{
  for(const [z,x,h,shade] of [[-9,0,4.5,0xdac9a6],[6,5,6,0xbfa68d],[22,-1.2,4.9,0xd9c4a4]]){
   t.box(x,.1,z,10.1,h,11.3,M.stone,shade);
   for(const f of [-1,1])t.panel([x-5.7,h+.12,z+f*6.1],[x+5.7,h+.12,z+f*6.1],[x+5.7,h+2.65,z],[x-5.7,h+2.65,z],M.zinc,0xb8997f);
   t.box(x-5.11,.86,z,.2,2.19,7.9,M.glazing);t.box(x-6,.18,z,2.15,.42,8,M.stone);
  }
 });
 for(const [at,x,bays] of [[2730,24,4],[2779,27,3]])site(at,x,'market-trade',t=>{
  for(let i=0;i<bays;i++){const z=i*8.2;
   person(t,-1.94,.67,z,-Math.PI/2,'serve',i+1);
   person(t,-5.22,.25,z-.92,Math.PI/2,'shop',i+3);
   if(i%2===0)person(t,-5.8,.25,z+.42,.92,'wait',i+2);
  }
  trolley(t,-4.4,.24,-4.9);person(t,-4.4,.26,-6.25,.02,'cart',0);
 });

 // The station entrance sits behind the rail, with a short pedestrian court.
 site(2732,-25,'market-station-entrance',t=>{
  t.box(0,.16,0,9,.15,25,M.stone);
  for(let i=0;i<2;i++){t.box(-2.3,.31,-2.2+i*1.4,.59,1.72,.98,M.steel);t.box(-1.97,1.33,-2.2+i*1.4,.11,.58,.69,M.glazing);}
  t.box(-2.1,2.1,2.2,.6,1.45,1.9,M.steel,0xffffff,M.rail);
  for(let i=0;i<4;i++)person(t,-.74+(i%2)*.62,.31,-3+i*1.34,Math.PI*1.55,'wait',i);
 });
 site(2762,-24.5,'metro-boarding',t=>{
  for(const [z,x,id] of [[-12,0,2],[-10.5,.3,5],[-3,1.0,0],[3.3,.8,3],[6,.6,1],[12,-.1,4]])person(t,x,8.43,z,Math.PI*.48,'wait',id);
 });
  for(const [at,bays] of [[3723,5],[3805,4]])site(at,edge(at,1)+19,'deliveries',t=>{
  vehicle(t,-8.25,8,'truck');trolley(t,-4.9,.25,2.5);
  person(t,-5,.25,1.4,0,'cart',4);person(t,-6.12,.25,8.75,1.4,'wait',2);
  for(let i=1;i<bays;i+=2){
   t.box(-2.5,.82,i*7.6,1.44,.18,2.3,M.timber);
   t.box(-2.5,1,i*7.6,1.34,1.00,2.12,M.timber);
   person(t,-1,.83,i*7.6-2,Math.PI,'serve',2);
  }
 });
 for(const [at,type] of [[7010,'bus'],[7059,'taxi'],[7073,'taxi']])site(at,-edge(at,-1)-6.05,'station-berth',t=>{
  t.box(0,.22,0,3.72,.1,type==='bus'?19.4:12.3,M.graphite,0xacb1a7);
  t.box(-2.42,.19,0,1.15,.25,type==='bus'?19.4:12.3,M.stone);
  vehicle(t,0,0,type);
  const queue=type==='bus'?5:2;
  for(let i=0;i<queue;i++)person(t,-2.65-(i%2)*.42,.44,2.55+i*1.14,1.41,'wait',i+1);
 });
 // Dispatch and passenger concourse face the bus loop across the covered bays.
 site(6993,-53,'concourse',t=>{
  t.box(0,.08,0,16,.28,43,M.stone);t.box(-5,.36,0,5.5,4.85,39,M.stone,0xcdc8ae);
  for(const z of [-14,-7,0,7,14]){
   t.box(-1.95,.52,z,.24,3.29,5.85,M.glazing);t.box(2.6,.32,z-3.16,.32,3.75,.38,M.steel);
  }
  t.box(.26,4.02,0,6.32,.44,38.5,M.zinc);
  t.box(-4.85,5.12,-14,4.86,2.42,9.4,M.glazing);
  t.box(-4.85,7.52,-14,5.35,.32,10.2,M.enamel,0x728c81);
  for(let i=0;i<4;i++)person(t,2+i%2,.36,-4+i*1.4,Math.PI*.38,'walk',i);
 });
 for(const [at,x] of [[6830,-34],[6895,-31]])site(at,x,'ticket-queue',t=>{
  for(let i=0;i<4;i++)person(t,.70+(i%2)*1.17,.54,i*1.72,Math.PI*.48,'walk',i+1);
 });
 site(6977,-22.3,'arrivals',t=>{for(let i=0;i<5;i++)person(t,1.1*Math.cos(i),.26,i*1.9,i%2*.9,'walk',i);});
}
