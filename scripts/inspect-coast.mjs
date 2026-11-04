import {createServer} from 'vite';
const server=await createServer({configFile:false,server:{middlewareMode:true},appType:'custom',logLevel:'error',optimizeDeps:{noDiscovery:true,include:[]}});
try{
 const {COAST_ULTRA_STAGE:stage}=await server.ssrLoadModule('/src/coast-ultra-stage.ts');
 const {createPilotTrack}=await server.ssrLoadModule('/src/pilot-composer.ts');
 const track=createPilotTrack(stage);
 console.log(JSON.stringify(Array.from({length:21},(_,i)=>{const d=350+i*475,p=track.sample(d);return {d,h:+p.roadHeading.toFixed(3),sunAngle:+((p.roadHeading+Math.atan2(.66,.75))*180/Math.PI).toFixed(1),x:Math.round(p.position.x),z:Math.round(p.position.z)};})));
}finally{await server.close();}
